/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Save,
  Plus,
  Minus,
  Layers,
  ArrowRight,
  Flame,
  Activity,
  Check
} from 'lucide-react';
import { LineEntry } from '../types';
import { HourlyOutput } from '../types/dcs';

export type ProductionStage = 'bottleneck' | 'assembly' | 'output';

export interface HourlyProductionUpdatePayload {
  lineNo: string;
  hourIndex: number;
  timeSlot: string;
  // 3 Primary Garment Production Stages:
  bottleneckUnits: number;
  bottleneckStation?: string;
  assemblyUnits: number;
  outputUnits: number;
  actualUnits: number; // Synced with outputUnits for general shift calculations
  scrapUnits: number;
  downtimeMinutes: number;
  notes?: string;
  targetUnits: number;
}

interface QuickHourlyProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: LineEntry[];
  hourlyData?: HourlyOutput[];
  selectedLineNo?: string;
  initialStage?: ProductionStage | 'all';
  onSaveHourlyUpdate: (payload: HourlyProductionUpdatePayload) => void;
}

const DEFAULT_TIME_SLOTS = [
  { index: 1, label: 'Hr 1', time: '08:00 - 09:00' },
  { index: 2, label: 'Hr 2', time: '09:00 - 10:00' },
  { index: 3, label: 'Hr 3', time: '10:00 - 11:00' },
  { index: 4, label: 'Hr 4', time: '11:00 - 12:00' },
  { index: 5, label: 'Hr 5', time: '13:00 - 14:00' },
  { index: 6, label: 'Hr 6', time: '14:00 - 15:00' },
  { index: 7, label: 'Hr 7', time: '15:00 - 16:00' },
  { index: 8, label: 'Hr 8', time: '16:00 - 17:00' },
  { index: 9, label: 'Hr 9 (OT)', time: '17:00 - 18:00' },
  { index: 10, label: 'Hr 10 (OT)', time: '18:00 - 19:00' },
];

export const QuickHourlyProductionModal: React.FC<QuickHourlyProductionModalProps> = ({
  isOpen,
  onClose,
  lines,
  hourlyData = [],
  selectedLineNo,
  initialStage = 'all',
  onSaveHourlyUpdate,
}) => {
  const activeLineList = lines.length > 0 ? lines : [];
  const initialLineNo = selectedLineNo || activeLineList[0]?.lineNo || '01';

  const [lineNo, setLineNo] = useState<string>(initialLineNo);

  // Guess current shift hour based on system clock
  const currentHourOfShift = () => {
    const hr = new Date().getHours();
    if (hr >= 8 && hr < 17) return Math.min(8, Math.max(1, hr - 7));
    if (hr >= 17 && hr < 19) return hr - 8;
    return 1;
  };

  const [hourIndex, setHourIndex] = useState<number>(() => currentHourOfShift());
  const [activeStageTab, setActiveStageTab] = useState<'all' | ProductionStage>(initialStage);

  // 3 Critical Stages: (Bottle Neck, Assembly, Output)
  const [bottleneckUnits, setBottleneckUnits] = useState<number>(68);
  const [assemblyUnits, setAssemblyUnits] = useState<number>(70);
  const [outputUnits, setOutputUnits] = useState<number>(65);

  const [scrapUnits, setScrapUnits] = useState<number>(0);
  const [downtimeMinutes, setDowntimeMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const currentLine = activeLineList.find(l => l.lineNo === lineNo) || activeLineList[0];

  // Target per hour
  const hourlyTarget = currentLine
    ? Math.round((currentLine.targetProd || 600) / (currentLine.workingHours || 8)) || 75
    : 75;

  const bottleneckStationName = currentLine?.bottleneck?.station || 'ST-02 Robotic Fastening';

  // Synchronize initial values when line or hour changes
  useEffect(() => {
    const existingHr = hourlyData.find(h => h.hourIndex === hourIndex);
    if (existingHr && existingHr.actualUnits > 0) {
      setOutputUnits(existingHr.actualUnits);
      setAssemblyUnits(Math.round(existingHr.actualUnits * 1.05));
      setBottleneckUnits(Math.round(existingHr.actualUnits * 0.98));
      setScrapUnits(existingHr.scrapUnits || 0);
      setDowntimeMinutes(existingHr.downtimeMinutes || 0);
      setNotes(existingHr.notes || '');
    } else {
      setOutputUnits(Math.max(10, hourlyTarget - 5));
      setAssemblyUnits(hourlyTarget);
      setBottleneckUnits(Math.max(10, hourlyTarget - 2));
      setScrapUnits(0);
      setDowntimeMinutes(0);
      setNotes('');
    }
  }, [hourIndex, lineNo, hourlyData, hourlyTarget]);

  if (!isOpen) return null;

  const currentSlot = DEFAULT_TIME_SLOTS.find(s => s.index === hourIndex) || DEFAULT_TIME_SLOTS[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveHourlyUpdate({
      lineNo,
      hourIndex,
      timeSlot: currentSlot.time,
      bottleneckUnits: Math.max(0, bottleneckUnits),
      bottleneckStation: bottleneckStationName,
      assemblyUnits: Math.max(0, assemblyUnits),
      outputUnits: Math.max(0, outputUnits),
      actualUnits: Math.max(0, outputUnits),
      scrapUnits: Math.max(0, scrapUnits),
      downtimeMinutes: Math.max(0, downtimeMinutes),
      notes: notes.trim(),
      targetUnits: hourlyTarget
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hourly-production-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-[#d9d2c2] dark:border-slate-800 shadow-2xl overflow-hidden pb-safe text-slate-800 dark:text-slate-100">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto my-2 sm:hidden shrink-0" />

        {/* Sticky Header */}
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 id="hourly-production-modal-title" className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>Hourly Production Updates</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700">
                  {currentSlot.label} ({currentSlot.time})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-stage tracking: <strong>Bottle Neck</strong>, <strong>Assembly</strong>, and <strong>Output</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* 3-Stage Visual Pipeline Bar */}
          <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl bg-[#fbfaf6] dark:bg-slate-800/60 border border-[#d9d2c2] dark:border-slate-700">
            {/* 1. Bottle Neck */}
            <button
              type="button"
              onClick={() => setActiveStageTab('bottleneck')}
              className={`p-2.5 rounded-xl text-left transition-all cursor-pointer touch-manipulation border ${
                activeStageTab === 'bottleneck' || activeStageTab === 'all'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                  : 'bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5 text-rose-700 dark:text-rose-400">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  1. Bottle Neck
                </span>
              </div>
              <div className="text-lg font-mono font-black">{bottleneckUnits} <span className="text-[10px] font-normal">pcs</span></div>
              <div className="text-[9px] text-slate-500 truncate">{bottleneckStationName.split(' ')[0]}</div>
            </button>

          {/* 2. Assembly */}
          <button
            type="button"
            onClick={() => setActiveStageTab('assembly')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeStageTab === 'assembly' || activeStageTab === 'all'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                : 'bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5 text-amber-700 dark:text-amber-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                2. Assembly
              </span>
            </div>
            <div className="text-lg font-mono font-black">{assemblyUnits} <span className="text-[10px] font-normal">pcs</span></div>
            <div className="text-[9px] text-slate-500 truncate">Joining Stage</div>
          </button>

          {/* 3. Output */}
          <button
            type="button"
            onClick={() => setActiveStageTab('output')}
            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
              activeStageTab === 'output' || activeStageTab === 'all'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-white dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5 text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                3. Line Output
              </span>
            </div>
            <div className="text-lg font-mono font-black">{outputUnits} <span className="text-[10px] font-normal">pcs</span></div>
            <div className="text-[9px] text-slate-500 truncate">Target: {hourlyTarget}</div>
          </button>
        </div>

          <div className="space-y-4">
          {/* Row 1: Line Selection & Hour Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Sewing Line
              </label>
              <select
                value={lineNo}
                onChange={(e) => setLineNo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {activeLineList.map((line) => (
                  <option key={line.id} value={line.lineNo}>
                    Line {line.lineNo} — {line.style || line.buyer || 'Standard'} (Target: {line.targetProd || 600} pcs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Production Hour Slot
              </label>
              <select
                value={hourIndex}
                onChange={(e) => setHourIndex(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                {DEFAULT_TIME_SLOTS.map((slot) => (
                  <option key={slot.index} value={slot.index}>
                    {slot.label} ({slot.time})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STAGE INPUTS: Bottle Neck, Assembly, Output */}
          <div className="space-y-3">
            {/* Stage 1: Bottle Neck Input */}
            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-rose-900 dark:text-rose-200 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Bottle Neck Stage ({bottleneckStationName})</span>
                </span>
                <span className="text-[10px] font-mono text-rose-700 dark:text-rose-300 font-semibold">
                  Takt Pace: {bottleneckUnits} pcs/hr
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBottleneckUnits(prev => Math.max(0, prev - 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    min="0"
                    max="500"
                    value={bottleneckUnits}
                    onChange={(e) => setBottleneckUnits(Number(e.target.value) || 0)}
                    className="w-full text-center text-xl font-mono font-black py-2 rounded-xl bg-white dark:bg-slate-800 border border-rose-300 dark:border-rose-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                    BN pcs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setBottleneckUnits(prev => Math.max(0, prev + 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 font-bold text-rose-700 dark:text-rose-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {[-5, +5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setBottleneckUnits(prev => Math.max(0, prev + d))}
                    className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 text-xs font-mono font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage 2: Assembly Input */}
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Assembly Stage (Mid-Line Section Joining)</span>
                </span>
                <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-semibold">
                  Assembly Pace: {assemblyUnits} pcs/hr
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssemblyUnits(prev => Math.max(0, prev - 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    min="0"
                    max="500"
                    value={assemblyUnits}
                    onChange={(e) => setAssemblyUnits(Number(e.target.value) || 0)}
                    className="w-full text-center text-xl font-mono font-black py-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                    Asm pcs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAssemblyUnits(prev => Math.max(0, prev + 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 font-bold text-amber-700 dark:text-amber-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {[-5, +5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setAssemblyUnits(prev => Math.max(0, prev + d))}
                    className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-xs font-mono font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Stage 3: Output Input */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Output Stage (Finished Inspection &amp; Off-Line)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                  Target: {hourlyTarget} pcs ({Math.round((outputUnits / hourlyTarget) * 100)}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOutputUnits(prev => Math.max(0, prev - 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    min="0"
                    max="500"
                    value={outputUnits}
                    onChange={(e) => setOutputUnits(Number(e.target.value) || 0)}
                    className="w-full text-center text-xl font-mono font-black py-2 rounded-xl bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 text-slate-900 dark:text-white"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-slate-400">
                    Output pcs
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOutputUnits(prev => Math.max(0, prev + 1))}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 touch-manipulation"
                >
                  <Plus className="w-5 h-5" />
                </button>
                {[-5, +5, +10].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setOutputUnits(prev => Math.max(0, prev + d))}
                    className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer touch-manipulation flex items-center justify-center"
                  >
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Scrap Units & Downtime Minutes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Scrap / Rejects</label>
                <div className="text-[11px] text-slate-400">Quality rejects</div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  min="0"
                  max="100"
                  value={scrapUnits}
                  onChange={(e) => setScrapUnits(Number(e.target.value) || 0)}
                  className="w-16 min-h-[44px] text-center font-mono font-bold py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setScrapUnits(prev => prev + 1)}
                  className="min-h-[44px] min-w-[40px] px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold active:scale-95 touch-manipulation flex items-center justify-center cursor-pointer"
                >
                  +1
                </button>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Stoppage Time</label>
                <div className="text-[11px] text-slate-400">Lost minutes</div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  inputMode="numeric"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  min="0"
                  max="60"
                  value={downtimeMinutes}
                  onChange={(e) => setDowntimeMinutes(Number(e.target.value) || 0)}
                  className="w-16 min-h-[44px] text-center font-mono font-bold py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setDowntimeMinutes(prev => Math.min(60, prev + 5))}
                  className="min-h-[44px] min-w-[40px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold active:scale-95 touch-manipulation flex items-center justify-center cursor-pointer"
                >
                  +5m
                </button>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Hour Remarks &amp; Bottleneck Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Balanced flow between BN & Assembly, thread tension adjusted"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-cyan-500 min-h-[44px]"
            />
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions */}
          <div className="p-4 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 sm:flex-initial px-5 py-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#176f78] to-[#125860] hover:brightness-110 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 touch-manipulation min-h-[44px]"
            >
              <Save className="w-4 h-4" />
              <span>Save (BN, Asm &amp; Output)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
