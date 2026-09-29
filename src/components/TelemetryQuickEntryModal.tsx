/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Radio,
  Timer,
  Layers,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Building2,
  Clock
} from 'lucide-react';
import { LineEntry, LiveLineTelemetry, LiveStationCycleTime, LiveWipStation } from '../types';

interface TelemetryQuickEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineEntry;
  onSaveQuickTelemetry: (updated: LineEntry) => void;
  canEdit: boolean;
  readOnlyReason?: string;
}

export const TelemetryQuickEntryModal: React.FC<TelemetryQuickEntryModalProps> = ({
  isOpen,
  onClose,
  line,
  onSaveQuickTelemetry,
  canEdit,
  readOnlyReason
}) => {
  if (!isOpen) return null;

  // Initialize working state from line data
  const currentTelemetry = line.liveTelemetry;
  const smv = line.smv || 14.5;
  const totalMP =
    (line.mp?.Operator?.present ?? 28) +
    (line.mp?.Helper?.present ?? 8) +
    (line.mp?.['Iron Man']?.present ?? 3);
  const hours = line.workingHours || 8;
  const targetHourlyRate = currentTelemetry?.targetHourlyRatePcs || (line.targetProd ? Math.round(line.targetProd / hours) : Math.round((totalMP * 60 * 0.85) / smv));
  const standardPitchSec = currentTelemetry?.pitchTimeSec || Math.round((smv * 60) / Math.max(1, totalMP));

  const [hourlyRate, setHourlyRate] = useState<number>(currentTelemetry?.currentHourlyRatePcs ?? (line.achievedProd ? Math.round(line.achievedProd / hours) : Math.round(targetHourlyRate * 0.9)));
  const [targetPace, setTargetPace] = useState<number>(targetHourlyRate);
  const [totalWip, setTotalWip] = useState<number>(currentTelemetry?.currentWipTotalPcs ?? (line.wip || Math.round(targetHourlyRate * 1.8)));
  const [notes, setNotes] = useState<string>(currentTelemetry?.telemetryNotes || '');

  // Local stations for quick cycle updates
  const [stations, setStations] = useState<LiveStationCycleTime[]>(() => {
    if (currentTelemetry?.cycleTimeStations && currentTelemetry.cycleTimeStations.length > 0) {
      return JSON.parse(JSON.stringify(currentTelemetry.cycleTimeStations));
    }
    const defaultTargetCT = Math.round(standardPitchSec * 1.05);
    return [
      {
        stationId: 'st-1',
        operationName: 'Front Placket / Key Bottleneck',
        operatorName: 'Operator 1',
        observedCycleTimeSec: line.bottleneck?.cycleTime || Math.round(defaultTargetCT * 1.25),
        standardCycleTimeSec: defaultTargetCT,
        pitchTimeSec: standardPitchSec,
        status: 'bottleneck',
        lastLoggedAt: 'Floor Walk'
      },
      {
        stationId: 'st-2',
        operationName: 'Collar Run & Topstitch',
        operatorName: 'Operator 2',
        observedCycleTimeSec: defaultTargetCT,
        standardCycleTimeSec: defaultTargetCT,
        pitchTimeSec: standardPitchSec,
        status: 'optimal',
        lastLoggedAt: 'Floor Walk'
      },
      {
        stationId: 'st-3',
        operationName: 'Side Seam & Sleeve Join',
        operatorName: 'Operator 3',
        observedCycleTimeSec: Math.round(defaultTargetCT * 1.1),
        standardCycleTimeSec: defaultTargetCT,
        pitchTimeSec: standardPitchSec,
        status: 'optimal',
        lastLoggedAt: 'Floor Walk'
      }
    ];
  });

  // Local sub-assembly WIP breakdown
  const [wipStages, setWipStages] = useState<LiveWipStation[]>(() => {
    if (currentTelemetry?.wipStations && currentTelemetry.wipStations.length > 0) {
      return JSON.parse(JSON.stringify(currentTelemetry.wipStations));
    }
    return [
      { stage: 'input_loading', label: '1. Input Loading / Batch Feed', wipPcs: Math.round(totalWip * 0.22), bufferHours: 0.4, status: 'balanced' },
      { stage: 'front_assembly', label: '2. Front Body & Placket', wipPcs: Math.round(totalWip * 0.28), bufferHours: 0.5, status: 'surging' },
      { stage: 'back_assembly', label: '3. Back Yoke & Shoulder', wipPcs: Math.round(totalWip * 0.18), bufferHours: 0.3, status: 'balanced' },
      { stage: 'side_seam', label: '4. Side Seam & Sleeve Join', wipPcs: Math.round(totalWip * 0.20), bufferHours: 0.4, status: 'balanced' },
      { stage: 'end_line_qco', label: '5. End-Line QC & Inspection', wipPcs: Math.round(totalWip * 0.12), bufferHours: 0.2, status: 'balanced' }
    ];
  });

  const [activeTab, setActiveTab] = useState<'all' | 'cycles' | 'wip'>('all');

  // Quick increment/decrement helpers
  const adjustCycleTime = (index: number, delta: number) => {
    setStations(prev => {
      const copy = [...prev];
      const newSec = Math.max(1, parseFloat((copy[index].observedCycleTimeSec + delta).toFixed(1)));
      const std = copy[index].standardCycleTimeSec;
      copy[index] = {
        ...copy[index],
        observedCycleTimeSec: newSec,
        status: newSec > std * 1.15 ? 'bottleneck' : newSec < std * 0.85 ? 'starved' : 'optimal',
        lastLoggedAt: 'Floor Walk'
      };
      return copy;
    });
  };

  const adjustStageWip = (index: number, delta: number) => {
    setWipStages(prev => {
      const copy = [...prev];
      const newPcs = Math.max(0, copy[index].wipPcs + delta);
      copy[index] = { ...copy[index], wipPcs: newPcs };
      const newSum = copy.reduce((sum, s) => sum + s.wipPcs, 0);
      setTotalWip(newSum);
      return copy;
    });
  };

  const bufferHours = hourlyRate > 0 ? parseFloat((totalWip / hourlyRate).toFixed(1)) : 1.5;
  const pacingVariance = hourlyRate - targetPace;
  const avgCycleTime = stations.length > 0 ? Math.round(stations.reduce((acc, s) => acc + s.observedCycleTimeSec, 0) / stations.length) : 0;
  const maxCycleTime = stations.length > 0 ? Math.max(...stations.map(s => s.observedCycleTimeSec)) : 0;

  const handleSave = () => {
    if (!canEdit) {
      alert(readOnlyReason || 'Read-only access: Cannot update line telemetry under Debonair RBAC.');
      return;
    }

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const updatedTelemetry: LiveLineTelemetry = {
      lastUpdated: nowTime,
      isLiveMonitoring: true,
      averageCycleTimeSec: avgCycleTime,
      targetCycleTimeSec: stations[0]?.standardCycleTimeSec || Math.round(standardPitchSec * 1.05),
      bottleneckCycleTimeSec: maxCycleTime,
      pitchTimeSec: standardPitchSec,
      currentHourlyRatePcs: hourlyRate,
      targetHourlyRatePcs: targetPace,
      runRatePcsPerHour: Math.round(hourlyRate * 1.02),
      pacingVariancePcs: pacingVariance,
      pacingStatus: hourlyRate >= targetPace ? 'on_pace' : hourlyRate >= targetPace * 0.85 ? 'behind' : 'critical_lag',
      currentWipTotalPcs: totalWip,
      standardWipBufferPcs: Math.round(targetPace * 1.5),
      wipBufferHours: bufferHours,
      wipHealthStatus: bufferHours > 3.0 ? 'high_accumulation' : bufferHours < 0.8 ? 'starvation_risk' : 'buffer_safe',
      cycleTimeStations: stations,
      wipStations: wipStages,
      telemetryNotes: notes || `Quick floor entry logged for Line ${line.lineNo} at ${nowTime}.`
    };

    const updatedLine: LineEntry = {
      ...line,
      wip: totalWip,
      liveTelemetry: updatedTelemetry
    };

    onSaveQuickTelemetry(updatedLine);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white border border-[#d9d2c2] shadow-2xl overflow-hidden pb-safe">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto my-1.5 sm:hidden shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#17343a] via-[#17464e] to-[#176f78] text-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-xs shrink-0">
              <Radio className="w-5 h-5 text-emerald-300 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-tight text-white truncate">
                  Line Telemetry Quick Entry
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase font-mono">
                  Line {line.lineNo}
                </span>
                <span className="text-[11px] text-teal-100 hidden sm:inline">
                  {line.floor} • {line.style} ({line.buyer})
                </span>
              </div>
              <p className="text-xs text-teal-100/80 mt-0.5">
                Rapid floor observation logger: Update cycle times, hourly run-rates, and WIP buffers on the fly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            title="Close Quick Entry"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-[#fbfaf6] border-b border-[#e7e1d5] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-white text-[#176f78] shadow-2xs' : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              All Telemetry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cycles')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cycles' ? 'bg-white text-[#176f78] shadow-2xs' : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Cycle Times Only
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wip')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'wip' ? 'bg-white text-[#176f78] shadow-2xs' : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              WIP Levels Only
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-numbers">
            <span className="text-[#527078] hidden sm:inline">Pacing:</span>
            <span className={`font-bold px-2 py-0.5 rounded-md ${
              pacingVariance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {hourlyRate} pcs/hr ({pacingVariance >= 0 ? `+${pacingVariance}` : pacingVariance})
            </span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#eef7f7] border border-[#b2d8d8]">
              <span className="text-[10px] font-bold uppercase text-[#527078] block">Hourly Production Rate</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-[#176f78] font-mono-numbers">
                  {hourlyRate}
                </span>
                <span className="text-xs text-[#527078]">pcs/hr</span>
              </div>
              <span className="text-[10px] text-[#527078]">Target: {targetPace} pcs</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-900 block">Total Floor WIP</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-amber-900 font-mono-numbers">
                  {totalWip}
                </span>
                <span className="text-xs text-amber-700">pcs</span>
              </div>
              <span className="text-[10px] text-amber-800 font-bold">{bufferHours}h Buffer Coverage</span>
            </div>

            <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2]">
              <span className="text-[10px] font-bold uppercase text-[#527078] block">Average Cycle Time</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
                  {avgCycleTime}
                </span>
                <span className="text-xs text-[#527078]">seconds</span>
              </div>
              <span className="text-[10px] text-[#176f78] font-mono">Pitch: {standardPitchSec}s</span>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200">
              <span className="text-[10px] font-bold uppercase text-rose-900 block">Max Station Cycle</span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="font-display text-xl sm:text-2xl font-bold text-rose-800 font-mono-numbers">
                  {maxCycleTime}
                </span>
                <span className="text-xs text-rose-700">seconds</span>
              </div>
              <span className="text-[10px] text-rose-800 font-bold">
                {maxCycleTime > standardPitchSec ? `+${maxCycleTime - standardPitchSec}s vs Pitch` : 'Balanced'}
              </span>
            </div>
          </div>

          {/* SECTION 1: Hourly Production Rate & Target Quick Steppers */}
          {(activeTab === 'all' || activeTab === 'wip') && (
            <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wide text-[#17343a] flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-[#176f78]" />
                  1. Live Production Rate &amp; WIP Buffer Steppers
                </span>
                <span className="text-[11px] text-[#527078]">Tap +/- for rapid floor adjustments</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hourly Rate Stepper */}
                <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                    Live Production Rate (Pcs / Hour)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHourlyRate(prev => Math.max(0, prev - 5))}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setHourlyRate(prev => Math.max(0, prev - 1))}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={hourlyRate}
                      onChange={e => setHourlyRate(parseInt(e.target.value) || 0)}
                      className="flex-1 h-11 px-3 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-center text-lg text-[#176f78]"
                    />
                    <button
                      type="button"
                      onClick={() => setHourlyRate(prev => prev + 1)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setHourlyRate(prev => prev + 5)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-[#176f78] text-white font-bold text-sm hover:bg-[#12555c] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Total WIP Stepper */}
                <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                    Total Current Line WIP (Pcs)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTotalWip(prev => Math.max(0, prev - 10))}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalWip(prev => Math.max(0, prev - 5))}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      -5
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={totalWip}
                      onChange={e => setTotalWip(parseInt(e.target.value) || 0)}
                      className="flex-1 h-11 px-3 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-center text-lg text-amber-800"
                    />
                    <button
                      type="button"
                      onClick={() => setTotalWip(prev => prev + 5)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-bold text-sm hover:bg-[#f1eee6] flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalWip(prev => prev + 10)}
                      className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-amber-700 text-white font-bold text-sm hover:bg-amber-800 flex items-center justify-center cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: Rapid Station Cycle Time Adjustments */}
          {(activeTab === 'all' || activeTab === 'cycles') && (
            <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wide text-[#17343a] flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-[#176f78]" />
                  2. Rapid Station Cycle Time Logging
                </span>
                <span className="text-[11px] text-[#527078]">
                  Pitch: <strong className="font-mono text-[#176f78]">{standardPitchSec}s</strong>
                </span>
              </div>

              <div className="space-y-2">
                {stations.map((station, idx) => {
                  const overrun = station.observedCycleTimeSec - station.standardCycleTimeSec;
                  const isCritical = overrun >= station.standardCycleTimeSec * 0.2;

                  return (
                    <div
                      key={station.stationId || idx}
                      className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCritical
                          ? 'bg-rose-50/70 border-rose-300'
                          : overrun > 0
                          ? 'bg-amber-50/70 border-amber-300'
                          : 'bg-[#fbfaf6] border-[#d9d2c2]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={station.operationName}
                            onChange={e => {
                              const val = e.target.value;
                              setStations(prev => prev.map((s, i) => i === idx ? { ...s, operationName: val } : s));
                            }}
                            className="font-bold text-xs text-[#17343a] bg-transparent border-b border-dashed border-[#d9d2c2] focus:border-[#176f78] outline-hidden px-1"
                          />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isCritical ? 'bg-rose-200 text-rose-900' : overrun > 0 ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isCritical ? 'Bottleneck' : overrun > 0 ? 'Overrun' : 'Balanced'}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#527078] mt-1 flex items-center gap-2">
                          <span>Operator:</span>
                          <input
                            type="text"
                            value={station.operatorName}
                            onChange={e => {
                              const val = e.target.value;
                              setStations(prev => prev.map((s, i) => i === idx ? { ...s, operatorName: val } : s));
                            }}
                            className="bg-transparent border-b border-[#d9d2c2] outline-hidden text-[#17343a] px-1 text-xs"
                          />
                        </div>
                      </div>

                      {/* Rapid adjust controls */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => adjustCycleTime(idx, -2)}
                          className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold hover:bg-[#f1eee6] cursor-pointer shadow-2xs touch-manipulation active:scale-95 flex items-center justify-center"
                        >
                          -2s
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustCycleTime(idx, -0.5)}
                          className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold hover:bg-[#f1eee6] cursor-pointer shadow-2xs touch-manipulation active:scale-95 flex items-center justify-center"
                        >
                          -0.5s
                        </button>

                        <div className="w-18 text-center">
                          <input
                            type="number"
                            inputMode="decimal"
                            step="0.5"
                            value={station.observedCycleTimeSec}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setStations(prev => prev.map((s, i) => i === idx ? { ...s, observedCycleTimeSec: val } : s));
                            }}
                            className={`w-full text-center font-mono-numbers font-bold text-base py-1.5 rounded-lg border min-h-[44px] ${
                              isCritical ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-white text-[#17343a] border-[#d9d2c2]'
                            }`}
                          />
                          <span className="text-[9px] text-[#527078] block">Std: {station.standardCycleTimeSec}s</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => adjustCycleTime(idx, 0.5)}
                          className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold hover:bg-[#f1eee6] cursor-pointer shadow-2xs touch-manipulation active:scale-95 flex items-center justify-center"
                        >
                          +0.5s
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustCycleTime(idx, 2)}
                          className="min-h-[44px] min-w-[40px] px-2.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-2xs touch-manipulation active:scale-95 flex items-center justify-center"
                        >
                          +2s
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 3: Stage WIP Levels Adjustment */}
          {(activeTab === 'all' || activeTab === 'wip') && (
            <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wide text-[#17343a] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  3. Stage-by-Stage WIP Adjustment
                </span>
                <span className="text-[11px] text-[#527078]">
                  Total: <strong className="text-amber-800 font-mono-numbers">{totalWip} pcs</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {wipStages.map((stage, idx) => (
                  <div key={stage.stage || idx} className="p-2.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#17343a] truncate block" title={stage.label}>
                      {stage.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => adjustStageWip(idx, -5)}
                        className="px-1.5 py-0.5 rounded-md bg-white border border-[#d9d2c2] text-[10px] font-bold hover:bg-[#f1eee6] cursor-pointer"
                      >
                        -5
                      </button>
                      <input
                        type="number"
                        value={stage.wipPcs}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          setWipStages(prev => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], wipPcs: val };
                            setTotalWip(copy.reduce((acc, s) => acc + s.wipPcs, 0));
                            return copy;
                          });
                        }}
                        className="w-full text-center font-mono-numbers font-bold text-xs py-1 rounded-md border border-[#d9d2c2] bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => adjustStageWip(idx, 5)}
                        className="px-1.5 py-0.5 rounded-md bg-white border border-[#d9d2c2] text-[10px] font-bold hover:bg-[#f1eee6] cursor-pointer"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Remarks */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2]">
            <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
              Floor Walk Observation Notes &amp; Handover Flag
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Needle replacement on station 1 complete, line back to target pacing"
              className="w-full px-3 py-2.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-base sm:text-xs min-h-[44px]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-[#fbfaf6] border-t border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#527078]">
            <span className="font-bold text-[#17343a]">Fast-Track Sync:</span> Updates will instantly save to Line {line.lineNo} and reflect across Live Telemetry and Shift Balances.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] bg-white text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer touch-manipulation min-h-[44px] flex items-center justify-center"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!canEdit}
              onClick={handleSave}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all touch-manipulation min-h-[44px] active:scale-98 ${
                canEdit
                  ? 'bg-[#176f78] text-white hover:bg-[#125860] cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{canEdit ? 'Log Telemetry Update' : 'View-Only (Restricted)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
