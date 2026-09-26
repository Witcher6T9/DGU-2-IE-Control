/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  TrendingUp,
  FileText,
  Copy,
  Printer,
  Check,
  RefreshCw,
  Layers,
  Users,
  Zap,
  Wrench,
  ShieldCheck,
  Award,
  ArrowUpRight,
  Info,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  Cell
} from 'recharts';
import { LineEntry, UserProfile, Shift8hWorkingMinutesBalance, Shift8hLostMinutesBreakdown } from '../types';
import {
  calculate8hShiftWorkingMinutesBalancing,
  simulatePostShiftOvertimeScenario,
  generate8hBalancingReportText
} from '../utils/workingMinutesBalancing';

interface WorkingMinutesBalancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineEntry;
  lines?: LineEntry[];
  onSelectLineNo?: (lineNo: string) => void;
  onSaveLine?: (line: LineEntry) => void;
  profile?: UserProfile;
}

export const WorkingMinutesBalancingModal: React.FC<WorkingMinutesBalancingModalProps> = ({
  isOpen,
  onClose,
  line,
  lines = [],
  onSelectLineNo,
  onSaveLine,
  profile
}) => {
  if (!isOpen) return null;

  // Active view tab inside the modal
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'hourly' | 'stations' | 'ot-simulator' | 'sign-off'>('reconciliation');

  // Internal working state initialized from line.shift8hBalancing or calculated defaults
  const [balanceData, setBalanceData] = useState<Shift8hWorkingMinutesBalance>(() => {
    return line.shift8hBalancing || calculate8hShiftWorkingMinutesBalancing(line);
  });

  // Keep state in sync if line changes
  useEffect(() => {
    if (line) {
      setBalanceData(line.shift8hBalancing || calculate8hShiftWorkingMinutesBalancing(line));
    }
  }, [line.id, line.lineNo, line.achievedProd, line.targetProd, line.smv]);

  // OT Simulation Controls
  const [simOtMinutes, setSimOtMinutes] = useState<number>(() => {
    return balanceData.postShiftBalancing.recommendedOtMinutes || 60;
  });
  const [simOtManpower, setSimOtManpower] = useState<number>(() => {
    return balanceData.postShiftBalancing.recommendedOtManpower || Math.round(balanceData.totalPresentMP * 0.8);
  });
  const [simExpectedEff, setSimExpectedEff] = useState<number>(() => {
    return balanceData.realizedShiftEfficiencyPct || 75;
  });

  // Copy feedback state
  const [copied, setCopied] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Derived OT Simulation calculation
  const otSimulationResult = useMemo(() => {
    return simulatePostShiftOvertimeScenario(
      balanceData,
      simOtMinutes,
      simOtManpower,
      simExpectedEff
    );
  }, [balanceData, simOtMinutes, simOtManpower, simExpectedEff]);

  // Total Lost Minutes
  const totalLostMinutes = useMemo(() => {
    const lm = balanceData.lostMinutes;
    return (
      lm.lineBalancingDelayMinutes +
      lm.needleDowntimeMinutes +
      lm.machineBreakdownMinutes +
      lm.materialFeedingDelayMinutes +
      lm.reworkAndAlterationMinutes +
      lm.morningBriefingAndSetupMinutes +
      lm.otherUnaccountedMinutes
    );
  }, [balanceData.lostMinutes]);

  // Interactive Lost Minutes Handler
  const handleUpdateLostMinutes = (field: keyof Shift8hLostMinutesBreakdown, val: number) => {
    const num = Math.max(0, val);
    const updatedLost = { ...balanceData.lostMinutes, [field]: num };
    setBalanceData(prev => ({
      ...prev,
      lostMinutes: updatedLost,
      lastUpdatedAt: new Date().toISOString()
    }));
  };

  // Interactive Hourly Pcs Handler
  const handleUpdateHourlyPcs = (hourNum: number, actualPcs: number) => {
    const newRecords = balanceData.hourlyBreakdown.map(h => {
      if (h.hourNumber === hourNum) {
        const earned = Math.round(actualPcs * balanceData.smv);
        const lost = Math.max(0, h.availableMinutes - earned);
        const eff = h.availableMinutes > 0 ? Math.round((earned / h.availableMinutes) * 1000) / 10 : 0;
        let status: any = 'On Track';
        if (eff >= 85) status = 'Surge';
        else if (eff >= 70) status = 'On Track';
        else if (eff >= 55) status = 'Minor Lag';
        else status = 'Bottleneck Delay';

        return {
          ...h,
          actualPcs,
          earnedMinutes: earned,
          lostMinutes: lost,
          efficiencyPct: eff,
          status
        };
      }
      return h;
    });

    const newTotalAchieved = newRecords.reduce((acc, r) => acc + r.actualPcs, 0);
    const newEarned = Math.round(newTotalAchieved * balanceData.smv);
    const newRealizedEff = balanceData.grossAvailableMinutes > 0
      ? Math.round((newEarned / balanceData.grossAvailableMinutes) * 1000) / 10
      : 0;

    setBalanceData(prev => ({
      ...prev,
      achievedProd8h: newTotalAchieved,
      earnedStandardMinutes: newEarned,
      realizedShiftEfficiencyPct: newRealizedEff,
      hourlyBreakdown: newRecords,
      lastUpdatedAt: new Date().toISOString()
    }));
  };

  // Reset to auto-calculated benchmark
  const handleResetToAuto = () => {
    const fresh = calculate8hShiftWorkingMinutesBalancing(line);
    setBalanceData(fresh);
    setSimOtMinutes(fresh.postShiftBalancing.recommendedOtMinutes || 60);
    setSimOtManpower(fresh.postShiftBalancing.recommendedOtManpower || Math.round(fresh.totalPresentMP * 0.8));
    setSimExpectedEff(fresh.realizedShiftEfficiencyPct || 75);
    setSaveFeedback('Re-initialized to factory engineering standard benchmarks');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  // Sign-off Handler
  const handleSignOff = () => {
    const signer = profile?.name || 'Lead IE Officer';
    const updatedSignOff = {
      ...balanceData.signOff,
      isSignedOff: true,
      signedBy: signer,
      role: profile?.jobTitle || 'Industrial Engineering Lead',
      signedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + (line.date || 'Today')
    };

    const updated = {
      ...balanceData,
      signOff: updatedSignOff,
      lastUpdatedAt: new Date().toISOString()
    };

    setBalanceData(updated);

    if (onSaveLine) {
      onSaveLine({
        ...line,
        achievedProd: updated.achievedProd8h,
        efficiency: updated.realizedShiftEfficiencyPct,
        shift8hBalancing: updated,
        remarks: `8h Shift Balanced (${updated.achievedProd8h} pcs / ${updated.realizedShiftEfficiencyPct}% eff). Verdict: ${updated.signOff.shiftVerdict}.`
      });
    }

    setSaveFeedback('Shift Working Minutes officially signed off and saved to Line Record!');
    setTimeout(() => setSaveFeedback(null), 3500);
  };

  // Copy Summary Report
  const handleCopyReport = () => {
    const txt = generate8hBalancingReportText(line, balanceData, profile?.name);
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Lost Minutes chart data
  const lostBreakdownChartData = [
    { name: 'Line Balancing', minutes: balanceData.lostMinutes.lineBalancingDelayMinutes, fill: '#e11d48' },
    { name: 'Needle Downtime', minutes: balanceData.lostMinutes.needleDowntimeMinutes, fill: '#f59e0b' },
    { name: 'Machine Stops', minutes: balanceData.lostMinutes.machineBreakdownMinutes, fill: '#d97706' },
    { name: 'Material Waiting', minutes: balanceData.lostMinutes.materialFeedingDelayMinutes, fill: '#6366f1' },
    { name: 'Quality Rework', minutes: balanceData.lostMinutes.reworkAndAlterationMinutes, fill: '#ec4899' },
    { name: 'Huddle & Setup', minutes: balanceData.lostMinutes.morningBriefingAndSetupMinutes, fill: '#14b8a6' },
    { name: 'Other/Micro', minutes: balanceData.lostMinutes.otherUnaccountedMinutes, fill: '#64748b' }
  ];

  return (
    <div
      id="shift-8h-working-minutes-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="shift-8h-working-minutes-modal-container"
        className="relative w-full max-w-6xl max-h-[95vh] rounded-3xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl flex flex-col overflow-hidden text-[#17343a] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-[#d9d2c2] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#176f78] to-[#0d4e55] text-white flex items-center justify-center shadow-md shrink-0">
              <Clock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#dceceb] text-[#176f78] border border-[#176f78]/20">
                  Full 8h Shift Complete (480 Min Baseline)
                </span>
                <span className="text-xs font-mono-numbers font-bold text-[#527078]">
                  Date: {line.date || '2026-09-21'}
                </span>
                {balanceData.signOff.isSignedOff && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Signed Off
                  </span>
                )}
              </div>
              <h2 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight text-[#17343a] mt-0.5">
                Line {line.lineNo} Working Minutes Balancing &amp; Reconciliation
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#527078] flex-wrap">
                <span>{line.floor}</span>
                <span>•</span>
                <span>Style: <strong className="text-[#17343a]">{line.style}</strong> ({line.buyer})</span>
                <span>•</span>
                <span>SMV: <strong className="text-[#176f78] font-mono-numbers">{balanceData.smv} min</strong></span>
                <span>•</span>
                <span>Present MP: <strong className="text-[#17343a] font-mono-numbers">{balanceData.totalPresentMP}</strong> ({balanceData.operatorsPresent} Op + {balanceData.helpersPresent} Hlp + {balanceData.ironManPresent} Iron)</span>
              </div>
            </div>
          </div>

          {/* Quick Line Selector & Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {lines.length > 1 && onSelectLineNo && (
              <div className="relative">
                <select
                  value={line.lineNo}
                  onChange={e => onSelectLineNo(e.target.value)}
                  aria-label="Select Line to Audit"
                  className="px-2.5 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                >
                  {lines.map(l => (
                    <option key={l.id} value={l.lineNo}>
                      Line {l.lineNo} ({l.efficiency}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyReport}
              className="p-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer shadow-2xs"
              title="Copy 8-Hour Balancing Audit Report to Clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleResetToAuto}
              className="p-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer shadow-2xs"
              title="Recalculate with Default Engineering Benchmarks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-rose-50 hover:text-rose-600 text-[#527078] transition-colors cursor-pointer shadow-2xs"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if saved/reset */}
        {saveFeedback && (
          <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-900 text-xs font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveFeedback}</span>
            </div>
          </div>
        )}

        {/* Core KPI Metrics Ribbon (480 min reconciliation overview) */}
        <div className="p-4 sm:p-5 bg-[#f5f2ea] border-b border-[#d9d2c2] grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Card 1: Gross Available Working Minutes */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider block">
              Available Minutes
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono-numbers text-[#17343a] mt-0.5">
              {balanceData.grossAvailableMinutes.toLocaleString()}
              <span className="text-xs font-semibold text-[#527078] ml-1">min</span>
            </div>
            <span className="text-[10px] text-[#527078] block mt-0.5">
              {balanceData.totalPresentMP} MP × 480 min (8.0h)
            </span>
          </div>

          {/* Card 2: Earned Standard Minutes */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider block">
              Earned Std Minutes
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono-numbers text-[#176f78] mt-0.5">
              {balanceData.earnedStandardMinutes.toLocaleString()}
              <span className="text-xs font-semibold text-[#527078] ml-1">min</span>
            </div>
            <span className="text-[10px] text-[#527078] block mt-0.5">
              {balanceData.achievedProd8h.toLocaleString()} pcs × {balanceData.smv} SMV
            </span>
          </div>

          {/* Card 3: 8h Realized Efficiency */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider block">
              8h Realized Eff
            </span>
            <div className={`text-xl sm:text-2xl font-black font-mono-numbers mt-0.5 ${
              balanceData.realizedShiftEfficiencyPct >= line.targetEff
                ? 'text-emerald-700'
                : balanceData.realizedShiftEfficiencyPct >= 65
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}>
              {balanceData.realizedShiftEfficiencyPct}%
            </div>
            <span className="text-[10px] text-[#527078] block mt-0.5">
              Target: {line.targetEff}% ({balanceData.targetProd8h} pcs)
            </span>
          </div>

          {/* Card 4: Total Lost Working Minutes */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider block">
              Total Lost Minutes
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono-numbers text-rose-700 mt-0.5">
              {totalLostMinutes.toLocaleString()}
              <span className="text-xs font-semibold text-[#527078] ml-1">min</span>
            </div>
            <span className="text-[10px] text-[#527078] block mt-0.5">
              ~{Math.round(totalLostMinutes / (balanceData.totalPresentMP || 1))} min / worker
            </span>
          </div>

          {/* Card 5: Post-8h Deficit / OT Requirement */}
          <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs col-span-2 md:col-span-1">
            <span className="text-[10px] font-bold uppercase text-[#527078] tracking-wider block">
              Shift 8h Verdict
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-sm font-black font-display uppercase px-2 py-0.5 rounded-md ${
                balanceData.postShiftBalancing.deficitPcs === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : balanceData.postShiftBalancing.requiresOvertime
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {balanceData.postShiftBalancing.deficitPcs === 0 ? 'Target Met' : `${balanceData.postShiftBalancing.deficitPcs} Pcs Deficit`}
              </span>
            </div>
            <span className="text-[10px] text-[#527078] block mt-0.5">
              {balanceData.postShiftBalancing.requiresOvertime
                ? `Suggest ${balanceData.postShiftBalancing.recommendedOtMinutes}m OT`
                : 'Zero overtime required'}
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-[#d9d2c2] bg-white overflow-x-auto no-scrollbar">
          {[
            { id: 'reconciliation', label: '1. Minutes Balancing Audit', icon: Sliders },
            { id: 'hourly', label: '2. Hour-by-Hour (H1 - H8)', icon: Clock },
            { id: 'stations', label: '3. Workstation Pitch Diagram', icon: Layers },
            { id: 'ot-simulator', label: '4. Post-8h Overtime Simulator', icon: Zap },
            { id: 'sign-off', label: '5. Shift Sign-Off & Action Plan', icon: Award }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap touch-manipulation active:scale-98 ${
                  isActive
                    ? 'border-[#176f78] text-[#176f78]'
                    : 'border-transparent text-[#527078] hover:text-[#17343a]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= TAB 1: RECONCILIATION & MINUTES DOWNTIME AUDIT ================= */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Interactive Minutes Loss Tuning */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-sm sm:text-base font-bold uppercase text-[#17343a]">
                        Working Minutes Loss Breakdown (Shop-Floor Drains)
                      </h3>
                      <p className="text-xs text-[#527078]">
                        Categorizes the {totalLostMinutes.toLocaleString()} unearned working minutes. Adjust values to match floor stoppage logs.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* Item 1: Line Balancing Delay */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Line Balancing Delay &amp; Starvation/Blocking
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          Takt cycle mismatch between stations; waiting for bottleneck collar/sleeve flow
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.lineBalancingDelayMinutes}
                          onChange={e => handleUpdateLostMinutes('lineBalancingDelayMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-rose-700 focus:ring-1 focus:ring-rose-500"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>

                    {/* Item 2: Needle Downtime */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Needle Running Downtime &amp; Thread Breakage
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          Bobbin replacement, needle re-threading, seam tension calibration (Target: 18 min/MP)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.needleDowntimeMinutes}
                          onChange={e => handleUpdateLostMinutes('needleDowntimeMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-amber-700 focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>

                    {/* Item 3: Machine Breakdown */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-700 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Machine Mechanical Breakdown &amp; Maintenance
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          Mechanic call time, looper stall, folder attachment adjustment
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.machineBreakdownMinutes}
                          onChange={e => handleUpdateLostMinutes('machineBreakdownMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>

                    {/* Item 4: Material Waiting */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Material Feeding Delays &amp; Cut Part Shortage
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          Waiting for cutting room bundles, fusible interlining, or printed trims
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.materialFeedingDelayMinutes}
                          onChange={e => handleUpdateLostMinutes('materialFeedingDelayMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-indigo-700 focus:ring-1 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>

                    {/* Item 5: Quality Rework */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-pink-500 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Quality Alteration &amp; Defect Rework Time
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          Operator unpicking stitches, re-aligning puckered seams, ironing repair
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.reworkAndAlterationMinutes}
                          onChange={e => handleUpdateLostMinutes('reworkAndAlterationMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-pink-700 focus:ring-1 focus:ring-pink-500"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>

                    {/* Item 6: Morning Huddle & Startup/Clean */}
                    <div className="p-3 rounded-2xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-teal-500 shrink-0" />
                          <span className="text-xs font-bold text-[#17343a]">
                            Morning Top 5 Huddle &amp; Shift 5S Clean-Up
                          </span>
                        </div>
                        <span className="text-[11px] text-[#527078] block mt-0.5">
                          10 min morning briefing + 5 min end-of-shift 5S cleaning and bundle count
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={balanceData.lostMinutes.morningBriefingAndSetupMinutes}
                          onChange={e => handleUpdateLostMinutes('morningBriefingAndSetupMinutes', parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-right text-teal-700 focus:ring-1 focus:ring-teal-500"
                        />
                        <span className="text-xs font-bold text-[#527078] w-8">min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Lost Minutes Visual Chart & Minute Balance Audit */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#17343a] flex items-center justify-between">
                      <span>Lost Minutes Composition</span>
                      <span className="font-mono-numbers text-rose-700">{totalLostMinutes.toLocaleString()} min</span>
                    </h4>

                    {/* Horizontal Bar Chart for Lost Minutes */}
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={lostBreakdownChartData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e7e1d5" />
                          <XAxis type="number" tick={{ fontSize: 10, fill: '#527078' }} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={100}
                            tick={{ fontSize: 10, fill: '#17343a', fontWeight: 600 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#fbfaf6',
                              borderRadius: '12px',
                              border: '1px solid #d9d2c2',
                              fontSize: '11px'
                            }}
                            formatter={(value: any) => [`${value} minutes`, 'Loss']}
                          />
                          <Bar dataKey="minutes" radius={[0, 6, 6, 0]}>
                            {lostBreakdownChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Mathematical Balancing Formula Box */}
                    <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs space-y-1.5 font-mono-numbers">
                      <div className="flex justify-between text-[#527078]">
                        <span>Gross Available (480m × {balanceData.totalPresentMP}):</span>
                        <span className="font-bold text-[#17343a]">{balanceData.grossAvailableMinutes.toLocaleString()} min</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Earned Standard Minutes ({balanceData.achievedProd8h} pcs × {balanceData.smv}):</span>
                        <span className="font-bold">{balanceData.earnedStandardMinutes.toLocaleString()} min</span>
                      </div>
                      <div className="flex justify-between text-rose-700 border-t border-[#d9d2c2] pt-1 font-bold">
                        <span>Net Shift Variance:</span>
                        <span>{balanceData.netVarianceMinutes >= 0 ? '+' : ''}{balanceData.netVarianceMinutes.toLocaleString()} min</span>
                      </div>
                      <div className="text-[10px] text-[#527078] pt-1">
                        * In factory IE accounting, Realized Efficiency = Earned Minutes / Available Minutes = {balanceData.realizedShiftEfficiencyPct}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: HOUR-BY-HOUR (H1 - H8) PACING BOARD ================= */}
          {activeTab === 'hourly' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold uppercase text-[#17343a]">
                    Hour-by-Hour (Hour 1 to Hour 8) 480-Minute Pacing Audit
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Tracking every 60-minute interval across the 8-hour shift. Edit hourly actual pieces to reflect shop-floor hourly counters.
                  </p>
                </div>
                <div className="text-xs font-mono-numbers font-bold text-[#176f78] bg-[#dceceb] px-3 py-1.5 rounded-xl border border-[#176f78]/20">
                  Total 8h Output: {balanceData.achievedProd8h} / {balanceData.targetProd8h} pcs
                </div>
              </div>

              {/* Chart: Hourly Target vs Actual Pieces */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
                <span className="text-xs font-bold uppercase text-[#17343a]">
                  Hourly Output Pacing (Pieces vs Target Pace)
                </span>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={balanceData.hourlyBreakdown}
                      margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d5" />
                      <XAxis
                        dataKey="timeRange"
                        tick={{ fontSize: 10, fill: '#527078' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis tick={{ fontSize: 10, fill: '#527078' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fbfaf6',
                          borderRadius: '12px',
                          border: '1px solid #d9d2c2',
                          fontSize: '11px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="targetPcs" name="Target Pcs" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actualPcs" name="Achieved Pcs" fill="#176f78" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hourly Records Table */}
              <div className="overflow-x-auto border border-[#d9d2c2] rounded-2xl bg-white shadow-2xs">
                <table className="w-full text-center text-xs border-collapse">
                  <thead className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[11px] font-bold text-[#17343a]">
                    <tr>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-28">Shift Slot</th>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-24">Target Pcs</th>
                      <th className="p-2.5 border-r border-[#e7e1d5] bg-emerald-50 text-emerald-900 w-28">
                        Achieved Pcs
                      </th>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-24">Available Min</th>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-24">Earned Min</th>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-24">Efficiency</th>
                      <th className="p-2.5 border-r border-[#e7e1d5] w-28">Status</th>
                      <th className="p-2.5 text-left">Hourly Floor Observation &amp; Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7e1d5]">
                    {balanceData.hourlyBreakdown.map(h => (
                      <tr key={h.hourNumber} className="hover:bg-[#fbfaf6]">
                        <td className="p-2.5 border-r border-[#e7e1d5] font-bold text-[#17343a] whitespace-nowrap">
                          {h.hourLabel}
                        </td>
                        <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers text-[#527078]">
                          {h.targetPcs}
                        </td>
                        <td className="p-1.5 border-r border-[#e7e1d5] bg-emerald-50/50">
                          <input
                            type="number"
                            min="0"
                            value={h.actualPcs}
                            onChange={e => handleUpdateHourlyPcs(h.hourNumber, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 rounded-lg bg-white border border-emerald-300 font-mono-numbers font-bold text-center text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                            title="Edit hourly actual pieces"
                          />
                        </td>
                        <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers text-[#527078]">
                          {h.availableMinutes}m
                        </td>
                        <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-[#176f78]">
                          {h.earnedMinutes}m
                        </td>
                        <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold">
                          <span className={`${
                            h.efficiencyPct >= 80
                              ? 'text-emerald-700'
                              : h.efficiencyPct >= 65
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}>
                            {h.efficiencyPct}%
                          </span>
                        </td>
                        <td className="p-2.5 border-r border-[#e7e1d5]">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            h.status === 'Surge'
                              ? 'bg-emerald-100 text-emerald-800'
                              : h.status === 'On Track'
                              ? 'bg-teal-100 text-teal-800'
                              : h.status === 'Minor Lag'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-left text-[#527078]">
                          {h.notes || 'Normal operation flow.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: WORKSTATION PITCH DIAGRAM ================= */}
          {activeTab === 'stations' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold uppercase text-[#17343a]">
                    Workstation Working Minutes Pitch Diagram (480 Min Distribution)
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Analyses cycle time vs Line Pitch Time across the 480-minute shift to detect station starvation and bottleneck minutes.
                  </p>
                </div>
                <div className="text-xs font-mono-numbers text-[#527078] bg-[#f1eee6] px-3 py-1.5 rounded-xl border border-[#d9d2c2]">
                  Line Pitch: <strong className="text-[#176f78]">{balanceData.workstations[0]?.pitchTimeSeconds || 24}s</strong> per piece
                </div>
              </div>

              {/* Station Breakdown Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {balanceData.workstations.map(stn => {
                  const isBottleneck = stn.status === 'Bottleneck';
                  const isStarved = stn.status === 'Starved';

                  return (
                    <div
                      key={stn.stationNumber}
                      className={`p-4 rounded-2xl border transition-all ${
                        isBottleneck
                          ? 'bg-rose-50/50 border-rose-300 ring-1 ring-rose-400 shadow-xs'
                          : isStarved
                          ? 'bg-amber-50/30 border-amber-300'
                          : 'bg-white border-[#d9d2c2]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold font-mono-numbers text-[#527078] uppercase">
                            Station #{stn.stationNumber} • {stn.machineType}
                          </span>
                          <h4 className="text-xs font-bold text-[#17343a] mt-0.5 line-clamp-1">
                            {stn.operationName}
                          </h4>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                          isBottleneck
                            ? 'bg-rose-600 text-white'
                            : isStarved
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {stn.status}
                        </span>
                      </div>

                      {/* Cycle time vs Pitch meter */}
                      <div className="mt-3 p-2 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] text-xs font-mono-numbers space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#527078]">Cycle Time:</span>
                          <span className={`font-bold ${isBottleneck ? 'text-rose-600' : 'text-[#17343a]'}`}>
                            {stn.cycleTimeSeconds}s {stn.taktVarianceSeconds > 0 ? `(+${stn.taktVarianceSeconds}s)` : `(${stn.taktVarianceSeconds}s)`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#527078]">8h Productive Min:</span>
                          <span className="font-bold text-[#176f78]">{stn.productiveMinutes} / 480 min</span>
                        </div>
                        <div className="flex justify-between text-rose-700">
                          <span>Balancing Idle Loss:</span>
                          <span className="font-bold">{stn.lostBalancingMinutes} min</span>
                        </div>
                      </div>

                      <div className="mt-2.5 text-[11px] text-[#527078] leading-tight">
                        <strong className="text-[#17343a]">Directive:</strong> {stn.recommendedAction}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 4: POST-8H SHIFT OVERTIME (OT) BALANCING SIMULATOR ================= */}
          {activeTab === 'ot-simulator' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold uppercase text-[#17343a]">
                    Post-8h Shift Deficit &amp; Overtime (OT) Balancing Simulator
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Simulate overtime working minutes to close the piece deficit without unnecessary manpower waste.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Simulator Inputs & Presets */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#17343a]">
                      Overtime Parameters
                    </h4>

                    {/* Quick OT Minutes Presets */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                        Overtime Duration (Minutes)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[30, 45, 60, 90, 120].map(mins => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setSimOtMinutes(mins)}
                            className={`p-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer ${
                              simOtMinutes === mins
                                ? 'bg-[#176f78] text-white shadow-xs'
                                : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                            }`}
                          >
                            {mins} Min
                            <span className="block text-[10px] font-normal opacity-80">
                              {(mins / 60).toFixed(1)} hrs
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Minutes Slider */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-[#527078]">Fine-tune OT Minutes:</span>
                        <span className="text-[#176f78] font-mono-numbers">{simOtMinutes} Minutes</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="180"
                        step="5"
                        value={simOtMinutes}
                        onChange={e => setSimOtMinutes(parseInt(e.target.value) || 0)}
                        className="w-full accent-[#176f78] cursor-pointer"
                      />
                    </div>

                    {/* Lean Rebalanced OT Manpower */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                          Retained OT Manpower
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={balanceData.totalPresentMP}
                          value={simOtManpower}
                          onChange={e => setSimOtManpower(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-[#17343a]"
                        />
                        <span className="text-[10px] text-[#527078] mt-0.5 block">
                          Full 8h line was {balanceData.totalPresentMP} MP
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                          Expected OT Efficiency %
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={simExpectedEff}
                          onChange={e => setSimExpectedEff(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-[#176f78]"
                        />
                        <span className="text-[10px] text-[#527078] mt-0.5 block">
                          8h realized eff was {balanceData.realizedShiftEfficiencyPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulator Projected Outcome */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-4">
                    <h4 className="font-display text-xs font-bold uppercase tracking-wider text-[#17343a] flex items-center justify-between">
                      <span>Projected OT Recovery Result</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        otSimulationResult.isTargetAchievedWithOt
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {otSimulationResult.isTargetAchievedWithOt ? 'Target Fully Cleared' : 'Partial Deficit'}
                      </span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] uppercase font-bold block">OT Extra Pieces</span>
                        <div className="text-xl font-bold font-mono-numbers text-emerald-700 mt-0.5">
                          +{otSimulationResult.otExpectedOutputPcs} pcs
                        </div>
                        <span className="text-[10px] text-[#527078] block mt-0.5">
                          {otSimulationResult.otAvailableMinutes.toLocaleString()} man-min
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5]">
                        <span className="text-[10px] text-[#527078] uppercase font-bold block">New Day Total</span>
                        <div className="text-xl font-bold font-mono-numbers text-[#17343a] mt-0.5">
                          {otSimulationResult.newTotalAchievedPcs} pcs
                        </div>
                        <span className="text-[10px] text-[#527078] block mt-0.5">
                          Target was {balanceData.targetProd8h} pcs
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs space-y-1.5 font-mono-numbers">
                      <div className="flex justify-between">
                        <span className="text-[#527078]">Remaining Deficit:</span>
                        <span className={`font-bold ${otSimulationResult.newNetDeficitPcs === 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {otSimulationResult.newNetDeficitPcs} pcs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#527078]">Combined Shift (8h + OT) Efficiency:</span>
                        <span className="font-bold text-[#176f78]">{otSimulationResult.combinedOverallEffPct}%</span>
                      </div>
                    </div>

                    {/* Industrial Engineering OT Directives */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#17343a]">
                        IE Rebalancing Plan for OT
                      </span>
                      <ul className="text-xs text-[#527078] space-y-1 list-disc pl-4">
                        {balanceData.postShiftBalancing.rebalanceActionPlan.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 5: SHIFT SIGN-OFF & ACTION PLAN ================= */}
          {activeTab === 'sign-off' && (
            <div className="space-y-6">
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#d9d2c2] shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e7e1d5]">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                      Official Full 8-Hour Shift Balancing Sign-Off
                    </h3>
                    <p className="text-xs text-[#527078]">
                      Validate line minutes reconciliation and log engineering sign-off for Debonair factory management.
                    </p>
                  </div>
                  {balanceData.signOff.isSignedOff && (
                    <div className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Signed Off by {balanceData.signOff.signedBy} ({balanceData.signOff.signedAt})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Verdict Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                      Shift Performance Verdict
                    </label>
                    <select
                      value={balanceData.signOff.shiftVerdict}
                      onChange={e => setBalanceData(prev => ({
                        ...prev,
                        signOff: { ...prev.signOff, shiftVerdict: e.target.value as any }
                      }))}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a]"
                    >
                      <option value="Met Target">Met Target (100% On Standard)</option>
                      <option value="Minor Deficit - Rebalanced">Minor Deficit - Rebalanced for Next Shift</option>
                      <option value="OT Required">OT Required (Overtime Scheduled)</option>
                      <option value="Exceeded Target">Exceeded Target (High Pacing Surge)</option>
                    </select>
                  </div>

                  {/* Signer Profile */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                      Signing Engineer / Lead
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`${profile?.name || 'Lead IE Officer'} • ${profile?.jobTitle || 'Industrial Engineering Lead'}`}
                      className="w-full px-3 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#527078]"
                    />
                  </div>
                </div>

                {/* IE Engineering Remarks Textarea */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                    Industrial Engineering Floor Takeaways &amp; Root Cause Notes
                  </label>
                  <textarea
                    rows={4}
                    value={balanceData.signOff.ieNotes || ''}
                    onChange={e => setBalanceData(prev => ({
                      ...prev,
                      signOff: { ...prev.signOff, ieNotes: e.target.value }
                    }))}
                    placeholder="Enter observations on bottleneck station flow, needle downtime variance, and tomorrow morning Hour 1 preparation..."
                    className="w-full p-3 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                {/* Bottom Actions Bar */}
                <div className="pt-4 border-t border-[#e7e1d5] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#17343a] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{copied ? 'Copied Report!' : 'Copy Summary Report'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-[#f1eee6] text-xs font-bold text-[#527078] cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOff}
                      className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125960] text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer touch-manipulation active:scale-95"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{balanceData.signOff.isSignedOff ? 'Update & Save Sign-Off' : 'Official 8h Sign-Off & Save'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Sticky Status Bar */}
        <div className="p-3 sm:px-6 bg-[#f5f2ea] border-t border-[#d9d2c2] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#527078]">
          <div className="flex items-center gap-2 font-mono-numbers text-[11px]">
            <span>Line {line.lineNo}</span>
            <span>•</span>
            <span>8h Gross Minutes: {balanceData.grossAvailableMinutes.toLocaleString()}</span>
            <span>•</span>
            <span className="text-[#176f78] font-bold">Realized Efficiency: {balanceData.realizedShiftEfficiencyPct}%</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>Shift: 08:00 - 17:00 (480 min standard)</span>
            <span>•</span>
            <span className="font-bold text-[#17343a]">Debonair Group Unit-02 IE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
