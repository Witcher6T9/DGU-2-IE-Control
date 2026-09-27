/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * Compact Quick Update Modal for Rapid Achieved Output Adjustment
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Zap,
  TrendingUp,
  TrendingDown,
  Check,
  Save,
  Target,
  Sparkles,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { LineEntry } from '../types';
import { calculateLineMetrics } from '../utils';

interface QuickOutputUpdateModalProps {
  line: LineEntry;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedLine: LineEntry) => void;
}

export const QuickOutputUpdateModal: React.FC<QuickOutputUpdateModalProps> = ({
  line,
  isOpen,
  onClose,
  onSave
}) => {
  const [outputVal, setOutputVal] = useState<number>(Number(line.achievedProd) || 0);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state when line changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setOutputVal(Number(line.achievedProd) || 0);
      setIsSavedNotice(false);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, line]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter') {
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, outputVal]);

  if (!isOpen) return null;

  const targetProd = Number(line.targetProd) || 0;
  const variance = outputVal - targetProd;
  const targetPct = targetProd > 0 ? Math.round((outputVal / targetProd) * 100) : 0;

  // Calculate live preview metrics
  const previewLine: LineEntry = {
    ...line,
    achievedProd: outputVal,
    dailyOutput: outputVal
  };
  const metrics = calculateLineMetrics(previewLine);
  const effPct = metrics.efficiencyPct;

  const handleAdjust = (delta: number) => {
    setOutputVal(prev => Math.max(0, prev + delta));
  };

  const handlePreset = (pct: number) => {
    if (targetProd > 0) {
      setOutputVal(Math.round(targetProd * (pct / 100)));
    }
  };

  const handleSave = () => {
    const updated: LineEntry = {
      ...line,
      achievedProd: outputVal,
      dailyOutput: outputVal,
      efficiency: effPct
    };
    onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl border border-[#d9d2c2] shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#176f78] to-[#135d65] text-white p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xs">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm font-mono leading-none">
                  Line {line.lineNo}
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/20 text-white font-sans">
                  Quick Update
                </span>
              </div>
              <p className="text-[11px] text-white/80 truncate max-w-[210px] mt-0.5">
                {line.style} • {line.floor}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          {/* Output Display & Number Input */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <label htmlFor="achieved-output-input" className="font-bold text-[#17343a]">
                Achieved Output (Pcs)
              </label>
              <span className="text-[11px] font-mono text-[#527078]">
                Target: <strong className="text-[#17343a]">{targetProd.toLocaleString()} pcs</strong>
              </span>
            </div>

            <div className="relative flex items-center">
              <input
                id="achieved-output-input"
                ref={inputRef}
                type="number"
                min="0"
                step="1"
                value={outputVal}
                onChange={(e) => setOutputVal(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-[#fbfaf6] border-2 border-[#176f78] rounded-xl px-3.5 py-2.5 text-center text-2xl font-black font-mono-numbers text-[#17343a] focus:outline-hidden focus:ring-2 focus:ring-[#176f78]/30 transition-all shadow-inner"
              />
              <span className="absolute right-3.5 text-xs font-bold text-[#527078] pointer-events-none">
                pcs
              </span>
            </div>
          </div>

          {/* Stepper Quick Adjustment Buttons */}
          <div>
            <span className="text-[10px] font-bold text-[#527078] uppercase tracking-wider block mb-1">
              Rapid Step Steppers
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[-50, -10, -5, +5, +10].map(delta => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAdjust(delta)}
                  className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer border ${
                    delta < 0
                      ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 active:scale-95'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 active:scale-95'
                  }`}
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {[+25, +50, +100, +200].map(delta => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAdjust(delta)}
                  className="py-1 rounded-lg text-xs font-bold font-mono bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 transition-all cursor-pointer active:scale-95"
                >
                  +{delta}
                </button>
              ))}
            </div>
          </div>

          {/* Target Pace Shortcuts */}
          <div>
            <span className="text-[10px] font-bold text-[#527078] uppercase tracking-wider block mb-1">
              Target Pace Presets
            </span>
            <div className="flex items-center gap-1.5">
              {[
                { label: '80% Pace', pct: 80 },
                { label: '90% Pace', pct: 90 },
                { label: '100% Target', pct: 100 },
                { label: '110% Surge', pct: 110 }
              ].map(preset => (
                <button
                  key={preset.pct}
                  type="button"
                  onClick={() => handlePreset(preset.pct)}
                  className="flex-1 py-1 rounded-lg text-[10px] font-bold bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#17343a] border border-[#d9d2c2] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Metrics Card */}
          <div className="bg-[#fbfaf6] border border-[#e5dfd3] rounded-xl p-2.5 font-mono-numbers">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-[#527078] block">Efficiency</span>
                <span
                  className={`text-sm font-black ${
                    effPct >= 60 ? 'text-emerald-700' : effPct >= 45 ? 'text-amber-700' : 'text-red-700'
                  }`}
                >
                  {effPct}%
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-[#527078] block">Variance</span>
                <span
                  className={`text-sm font-black flex items-center justify-center gap-0.5 ${
                    variance >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {variance >= 0 ? `+${variance}` : variance}
                </span>
              </div>

              <div>
                <span className="text-[9px] uppercase font-bold text-[#527078] block">Pace %</span>
                <span className="text-sm font-black text-[#17343a]">
                  {targetPct}%
                </span>
              </div>
            </div>

            {/* Target progress visual bar */}
            <div className="mt-2 w-full bg-[#e5dfd3] h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  effPct >= 60 ? 'bg-emerald-600' : effPct >= 45 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, targetPct)}%` }}
              />
            </div>
          </div>

          {/* Success Notice */}
          {isSavedNotice && (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 rounded-lg animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Output Updated Successfully!</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="p-3 bg-[#fbfaf6] border-t border-[#d9d2c2] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSavedNotice}
            className="px-4 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#135d65] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Output</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickOutputUpdateModal;
