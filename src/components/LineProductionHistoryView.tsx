/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Award,
  Clock,
  Users,
  Target,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Building2
} from 'lucide-react';
import { LineEntry, UserProfile } from '../types';
import { StyleProgressionModal } from './StyleProgressionModal';
import { getSMVWeight } from '../data/learningCurveMatrix';

const formatNumber = (val: number | undefined | null): string => {
  return (val ?? 0).toLocaleString();
};

interface LineProductionHistoryViewProps {
  lines: LineEntry[];
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  onSelectDate?: (date: string) => void;
  profile?: UserProfile;
}

interface HistoricalDataPoint {
  id: number;
  date: string;
  rawDate: string;
  dayLabel: string;
  lineNo: string;
  style: string;
  buyer: string;
  smv: number;
  workingHours: number;
  plannedMP: number;
  targetEff: number;
  efficiency: number;
  targetProd: number;
  achievedProd: number;
  variancePcs: number;
  producedMin: number;
  availableMin: number;
  wip: number;
  status: string;
}

export const LineProductionHistoryView: React.FC<LineProductionHistoryViewProps> = ({
  lines,
  selectedLineNo,
  onSelectLineNo,
  onNavigate,
  onSelectDate
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'efficiency' | 'comparison' | 'learning-curve'>('efficiency');
  const [showBenchmarkLine, setShowBenchmarkLine] = useState<boolean>(true);
  const [isStyleProgressionModalOpen, setIsStyleProgressionModalOpen] = useState<boolean>(false);
  const [searchLine, setSearchLine] = useState<string>('');

  // Extract unique active lines in factory (1 to 34)
  const uniqueLineNumbers = useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => {
      if (l.lineNo) set.add(l.lineNo);
    });
    return Array.from(set).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [lines]);

  // Current active line number (fallback to first available or '01')
  const currentLineNo = useMemo(() => {
    if (uniqueLineNumbers.includes(selectedLineNo)) return selectedLineNo;
    return uniqueLineNumbers[0] || '01';
  }, [selectedLineNo, uniqueLineNumbers]);

  // Filter all multi-date historical records for this specific line
  const lineHistoryRecords = useMemo(() => {
    const records = lines.filter(l => l.lineNo === currentLineNo);
    // Sort chronologically ascending for time-series chart
    return [...records].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [lines, currentLineNo]);

  // Latest record for summary information
  const latestRecord = useMemo(() => {
    if (lineHistoryRecords.length === 0) return null;
    return lineHistoryRecords[lineHistoryRecords.length - 1];
  }, [lineHistoryRecords]);

  // Format historical chart data
  const chartData: HistoricalDataPoint[] = useMemo(() => {
    return lineHistoryRecords.map(rec => {
      let dayLabel = rec.date;
      try {
        const parts = rec.date.split('-');
        if (parts.length === 3) {
          const dt = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
          dayLabel = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      } catch {
        dayLabel = rec.date;
      }

      const producedMin = Math.round((rec.achievedProd || 0) * (rec.smv || 1));
      const availableMin = Math.round((rec.plannedMP || 50) * (rec.workingHours || 8) * 60);

      return {
        id: rec.id,
        date: dayLabel,
        rawDate: rec.date,
        dayLabel,
        lineNo: rec.lineNo,
        style: rec.style || 'Standard Style',
        buyer: rec.buyer || 'Standard Buyer',
        smv: rec.smv || 0,
        workingHours: rec.workingHours || 8,
        plannedMP: rec.plannedMP || 0,
        targetEff: rec.targetEff || 60,
        efficiency: rec.efficiency || 0,
        targetProd: rec.targetProd || 0,
        achievedProd: rec.achievedProd || 0,
        variancePcs: (rec.achievedProd || 0) - (rec.targetProd || 0),
        producedMin,
        availableMin,
        wip: rec.wip || 0,
        status: (rec.efficiency || 0) >= (rec.targetEff || 60) ? 'Met Target' : 'Under Target'
      };
    });
  }, [lineHistoryRecords]);

  // Learning curve points if line has multi-day build-up or history records
  const learningCurveData = useMemo(() => {
    if (latestRecord?.learningCurve?.history && latestRecord.learningCurve.history.length > 0) {
      return latestRecord.learningCurve.history.map(item => ({
        dayName: `Day ${item.day}`,
        dayNumber: item.day,
        plannedEff: item.plannedEff,
        achievedEff: item.achievedEff,
        plannedQty: item.plannedQty,
        achievedQty: item.achievedQty,
        variancePcs: (item.achievedQty || 0) - (item.plannedQty || 0),
        notes: item.notes || ''
      }));
    }
    // Fallback: derive curve points from chronological chart records
    return chartData.map((pt, idx) => ({
      dayName: `Run ${idx + 1} (${pt.dayLabel})`,
      dayNumber: idx + 1,
      plannedEff: pt.targetEff,
      achievedEff: pt.efficiency,
      plannedQty: pt.targetProd,
      achievedQty: pt.achievedProd,
      variancePcs: pt.variancePcs,
      notes: pt.style
    }));
  }, [latestRecord, chartData]);

  // Aggregate KPI computations
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return {
        avgEfficiency: 0,
        avgTarget: 60,
        peakEfficiency: 0,
        lowestEfficiency: 0,
        totalAchievedQty: 0,
        totalTargetQty: 0,
        netVariancePcs: 0,
        trendPts: 0,
        isImproving: true,
        daysTracked: 0
      };
    }

    const effs = chartData.map(d => d.efficiency);
    const targets = chartData.map(d => d.targetEff);
    const sumEff = effs.reduce((a, b) => a + b, 0);
    const sumTarget = targets.reduce((a, b) => a + b, 0);
    const totalAchieved = chartData.reduce((a, b) => a + b.achievedProd, 0);
    const totalTarget = chartData.reduce((a, b) => a + b.targetProd, 0);

    const firstEff = effs[0] ?? 0;
    const lastEff = effs[effs.length - 1] ?? 0;
    const trendPts = Math.round((lastEff - firstEff) * 10) / 10;

    return {
      avgEfficiency: Math.round((sumEff / effs.length) * 10) / 10,
      avgTarget: Math.round((sumTarget / targets.length) * 10) / 10,
      peakEfficiency: Math.max(...effs),
      lowestEfficiency: Math.min(...effs),
      totalAchievedQty: totalAchieved,
      totalTargetQty: totalTarget,
      netVariancePcs: totalAchieved - totalTarget,
      trendPts,
      isImproving: trendPts >= 0,
      daysTracked: chartData.length
    };
  }, [chartData]);

  // Filter line chips based on search
  const filteredLineChips = useMemo(() => {
    if (!searchLine.trim()) return uniqueLineNumbers;
    const q = searchLine.toLowerCase();
    return uniqueLineNumbers.filter(lNo => {
      const matchNo = lNo.toLowerCase().includes(q);
      const matchSample = lines.find(l => l.lineNo === lNo);
      const matchStyle = matchSample?.style?.toLowerCase().includes(q);
      const matchBuyer = matchSample?.buyer?.toLowerCase().includes(q);
      const matchFloor = matchSample?.floor?.toLowerCase().includes(q);
      return matchNo || matchStyle || matchBuyer || matchFloor;
    });
  }, [uniqueLineNumbers, searchLine, lines]);

  // Custom Chart Tooltip
  const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as HistoricalDataPoint;
      const eff = dataPoint.efficiency;
      const target = dataPoint.targetEff;
      const diff = Math.round((eff - target) * 10) / 10;

      return (
        <div className="bg-[#17343a] text-white p-3.5 rounded-2xl shadow-xl border border-white/10 text-xs min-w-[220px] max-w-[280px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/15">
            <div>
              <span className="font-extrabold text-[13px] text-teal-300">
                Line {dataPoint.lineNo}
              </span>
              <span className="text-stone-300 ml-1.5 text-[11px]">({dataPoint.dayLabel})</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                eff >= target ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {eff >= target ? 'Target Met' : 'Under Target'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono-numbers">
            <div className="flex items-center justify-between">
              <span className="text-stone-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#176f78]" />
                Achieved Efficiency:
              </span>
              <span className="font-extrabold text-sm text-teal-200">{eff}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Target Efficiency:
              </span>
              <span className="font-bold text-amber-300">{target}%</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
              <span className="text-stone-300">Efficiency Variance:</span>
              <span className={`font-bold ${diff >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {diff >= 0 ? `+${diff}%` : `${diff}%`}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-300">Production vs Target:</span>
              <span className="text-stone-100 font-bold">
                {formatNumber(dataPoint.achievedProd)} / {formatNumber(dataPoint.targetProd)} pcs
              </span>
            </div>

            <div className="pt-2 mt-2 border-t border-white/10 text-[10px] text-stone-300 space-y-0.5">
              <div className="truncate">
                Style: <strong className="text-white">{dataPoint.style}</strong>
              </div>
              <div className="truncate">
                Buyer: <strong className="text-white">{dataPoint.buyer}</strong> • SMV: <strong className="text-teal-300">{dataPoint.smv}m</strong>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cockpit Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#176f78] text-white">
                IE Time-Series Analytics
              </span>
              <span className="text-xs text-[#527078] font-bold">
                Debonair Unit-2 Industrial Engineering
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-[#17343a] mt-1">
              Line Production History & Efficiency Trajectory
            </h1>
            <p className="text-xs text-[#527078] mt-0.5">
              Multi-day performance trend, achieved vs target efficiency, and pacing stability for sewing workstations.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('linedata', currentLineNo)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Open Workstation Balancer for this line"
              >
                <Layers className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Workstation Detail</span>
              </button>
            )}

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="View shift reports"
              >
                <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Shift Reports</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Line Selector Carousel */}
        <div className="mt-4 pt-3 border-t border-[#e7e1d5]">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#527078]">
                Select Sewing Line ({uniqueLineNumbers.length} Active Lines):
              </span>
            </div>
            <div className="w-36 sm:w-48">
              <input
                type="text"
                value={searchLine}
                onChange={e => setSearchLine(e.target.value)}
                placeholder="Find line / style..."
                className="w-full text-xs px-2.5 py-1 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] placeholder-[#527078]/60 focus:outline-none focus:ring-1 focus:ring-[#176f78]"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar snap-x snap-mandatory touch-scroll">
            {filteredLineChips.map(lineNo => {
              const isSelected = lineNo === currentLineNo;
              const lineSamples = lines.filter(l => l.lineNo === lineNo);
              const latestEff = lineSamples.length > 0 ? lineSamples[lineSamples.length - 1].efficiency : null;

              return (
                <button
                  key={lineNo}
                  type="button"
                  onClick={() => onSelectLineNo(lineNo)}
                  className={`px-3 py-1.5 min-h-[40px] rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 snap-start touch-manipulation active:scale-95 ${
                    isSelected
                      ? 'bg-[#176f78] text-white shadow-xs ring-2 ring-[#176f78]/30 scale-102'
                      : 'bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]'
                  }`}
                >
                  <span>Line {lineNo}</span>
                  {typeof latestEff === 'number' && (
                    <span
                      className={`text-[10px] font-mono-numbers px-1.5 py-0.2 rounded-md ${
                        isSelected
                          ? 'bg-white/20 text-teal-100'
                          : latestEff >= 60
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {latestEff}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Line Profile & Core Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Line Identity Summary */}
        <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md bg-[#176f78]/10 text-[#176f78] text-xs font-bold uppercase tracking-wider">
                Line {currentLineNo}
              </span>
              <span className="text-[11px] font-bold text-[#527078] flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#176f78]" />
                {latestRecord?.floor || 'Sewing Floor'}
              </span>
            </div>

            <div className="mt-2.5">
              <h3 className="font-display text-lg font-bold text-[#17343a] leading-tight line-clamp-1">
                {latestRecord?.style || 'Sewing Operations'}
              </h3>
              <p className="text-xs text-[#527078] mt-0.5">
                Buyer: <strong className="text-[#17343a]">{latestRecord?.buyer || 'Factory'}</strong> • SMV: <strong className="text-[#176f78]">{latestRecord?.smv || 14.5}m</strong>
              </p>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#e7e1d5] flex items-center justify-between text-xs text-[#527078]">
            <span>Supervisor / IE:</span>
            <span className="font-bold text-[#17343a] truncate max-w-[120px]">
              {latestRecord?.lineIE?.name || 'Assigned Lead'}
            </span>
          </div>
        </div>

        {/* KPI 1: Average Achieved Efficiency */}
        <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-[#527078] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Average Efficiency</span>
            <Award className="w-4 h-4 text-[#176f78]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-[#17343a] font-mono-numbers">
              {stats.avgEfficiency}%
            </span>
            <span className="text-xs text-[#527078] font-mono-numbers">
              Target: {stats.avgTarget}%
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            <span
              className={`font-bold flex items-center gap-0.5 ${
                stats.avgEfficiency >= stats.avgTarget ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {stats.avgEfficiency >= stats.avgTarget ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              {stats.avgEfficiency >= stats.avgTarget ? 'Meeting Factory Target' : 'Under Target Gap'}
            </span>
          </div>
        </div>

        {/* KPI 2: Peak & Lowest Range */}
        <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-[#527078] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Efficiency Range</span>
            <Target className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-700 font-mono-numbers">
              {stats.peakEfficiency}%
            </span>
            <span className="text-xs text-[#527078]">Peak Peak</span>
          </div>
          <div className="mt-2 text-[11px] text-[#527078] flex items-center justify-between">
            <span>Lowest Day: <strong className="text-stone-700">{stats.lowestEfficiency}%</strong></span>
            <span>Range: <strong>{Math.round((stats.peakEfficiency - stats.lowestEfficiency) * 10) / 10}%</strong></span>
          </div>
        </div>

        {/* KPI 3: Production Trend */}
        <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center justify-between text-[#527078] text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">Pacing & Output</span>
            {stats.isImproving ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-[#17343a] font-mono-numbers">
              {formatNumber(stats.totalAchievedQty)}
            </span>
            <span className="text-xs text-[#527078]">Pcs Produced</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px]">
            <span
              className={`font-bold flex items-center gap-0.5 ${
                stats.trendPts >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {stats.trendPts >= 0 ? `+${stats.trendPts}%` : `${stats.trendPts}%`} trend
            </span>
            <span className="text-[#527078]">• {stats.daysTracked} Shift Records</span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-[#d9d2c2] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#e7e1d5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#176f78]" />
              <h2 className="font-display text-base sm:text-lg font-bold uppercase tracking-tight text-[#17343a]">
                Achieved Efficiency Over Time — Line {currentLineNo}
              </h2>
            </div>
            <p className="text-xs text-[#527078] mt-0.5">
              Daily time-series comparison against planned target efficiency with dynamic IE benchmark threshold.
            </p>
          </div>

          {/* Visualization Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-[#f1eee6] p-0.5 rounded-xl border border-[#d9d2c2]">
              <button
                type="button"
                onClick={() => setActiveMetricTab('efficiency')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetricTab === 'efficiency'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Efficiency (%)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab('comparison')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetricTab === 'comparison'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Production (Pcs)
              </button>
              <button
                type="button"
                onClick={() => setActiveMetricTab('learning-curve')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMetricTab === 'learning-curve'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
              >
                Learning Ramp
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBenchmarkLine(prev => !prev)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                showBenchmarkLine
                  ? 'bg-teal-50 border-teal-300 text-teal-800'
                  : 'bg-white border-[#d9d2c2] text-[#527078]'
              }`}
              title="Toggle Standard 60% Benchmark Reference Line"
            >
              <Target className="w-3 h-3 text-[#176f78]" />
              <span>Benchmark (60%)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsStyleProgressionModalOpen(true)}
              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="View Standard 40-Day Style Progression Matrix Chart"
            >
              <Calendar className="w-3 h-3 text-[#176f78]" />
              <span>40-Day Matrix</span>
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-[340px] sm:h-[400px] w-full pt-2">
          {activeMetricTab === 'efficiency' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 25, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d5" opacity={0.7} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 10) * 10)]}
                  unit="%"
                  dx={-4}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />

                {showBenchmarkLine && (
                  <ReferenceLine
                    y={60}
                    stroke="#0284c7"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Target Benchmark 60%',
                      fill: '#0284c7',
                      fontSize: 11,
                      position: 'top'
                    }}
                  />
                )}

                {/* Achieved Efficiency Line */}
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  name="Achieved Efficiency (%)"
                  stroke="#176f78"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#176f78', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, fill: '#0f4e55', strokeWidth: 2, stroke: '#ffffff' }}
                  animationDuration={800}
                />

                {/* Planned Target Efficiency Line */}
                <Line
                  type="monotone"
                  dataKey="targetEff"
                  name="Target Efficiency (%)"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#d97706', strokeWidth: 1.5, stroke: '#ffffff' }}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeMetricTab === 'comparison' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 15, right: 25, left: -5, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d5" opacity={0.7} />
                <XAxis
                  dataKey="dayLabel"
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  unit=" pcs"
                  dx={-4}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />

                {/* Achieved Production Line */}
                <Line
                  type="monotone"
                  dataKey="achievedProd"
                  name="Achieved Production (Pcs)"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 8, fill: '#047857', strokeWidth: 2, stroke: '#ffffff' }}
                />

                {/* Target Production Line */}
                <Line
                  type="monotone"
                  dataKey="targetProd"
                  name="Target Production (Pcs)"
                  stroke="#0284c7"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#0284c7', strokeWidth: 1.5, stroke: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeMetricTab === 'learning-curve' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={learningCurveData}
                margin={{ top: 15, right: 25, left: -10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e1d5" opacity={0.7} />
                <XAxis
                  dataKey="dayName"
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="#527078"
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 100]}
                  unit="%"
                  dx={-4}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name]}
                  labelStyle={{ fontWeight: 'bold', color: '#17343a' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #d9d2c2', fontSize: 12 }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />

                <Line
                  type="monotone"
                  dataKey="achievedEff"
                  name="Ramp Achieved Eff (%)"
                  stroke="#176f78"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#176f78', strokeWidth: 2, stroke: '#ffffff' }}
                />

                <Line
                  type="monotone"
                  dataKey="plannedEff"
                  name="Learning Curve Plan (%)"
                  stroke="#e11d48"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#e11d48', strokeWidth: 1.5, stroke: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart Explanatory Footer */}
        <div className="mt-4 pt-3 border-t border-[#e7e1d5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#527078]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#176f78] rounded-full" />
              <span>Solid Teal: Daily Achieved Efficiency (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 border-t-2 border-dashed border-[#d97706]" />
              <span>Dashed Amber: Daily IE Planned Target (%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 border-t-2 border-dashed border-[#0284c7]" />
              <span>Dashed Sky: 60% Benchmark Gate</span>
            </div>
          </div>

          <div className="text-[11px] font-mono-numbers">
            Data Points: <strong className="text-[#17343a]">{chartData.length} Shifts</strong>
          </div>
        </div>
      </div>

      {/* Historical Records Breakdown Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#e7e1d5]">
          <div>
            <h3 className="font-display text-base font-bold uppercase tracking-tight text-[#17343a]">
              Shift-by-Shift Performance Log — Line {currentLineNo}
            </h3>
            <p className="text-xs text-[#527078]">
              Recorded daily audit entries with output, manpower allocation, and variance statistics.
            </p>
          </div>

          <span className="text-xs font-mono-numbers font-bold text-[#176f78]">
            {chartData.length} Recorded Shifts
          </span>
        </div>

        {/* Mobile Shift Cards View (screens < sm) */}
        <div className="sm:hidden space-y-2.5">
          {chartData.map((row) => {
            const effDiff = Math.round((row.efficiency - row.targetEff) * 10) / 10;
            const isMet = effDiff >= 0;

            return (
              <div
                key={row.id}
                className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-[#17343a]">
                      {row.rawDate}
                    </span>
                    <span className="text-[10px] text-[#527078] ml-1.5">
                      ({row.dayLabel})
                    </span>
                    <div className="text-xs font-bold text-[#17343a] mt-0.5 line-clamp-1">
                      {row.style}
                    </div>
                    <div className="text-[10px] text-[#527078]">
                      {row.buyer} • SMV: {row.smv}m
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-black font-mono-numbers ${
                      row.efficiency >= 60
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : row.efficiency >= row.targetEff
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {row.efficiency}% Eff
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e7e1d5] text-center font-mono-numbers">
                  <div className="p-1 rounded-lg bg-white border border-[#e7e1d5]">
                    <span className="text-[9px] uppercase tracking-wider text-[#527078] block">Output</span>
                    <span className="text-xs font-bold text-[#17343a]">{formatNumber(row.achievedProd)}</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-[#e7e1d5]">
                    <span className="text-[9px] uppercase tracking-wider text-[#527078] block">Target</span>
                    <span className="text-xs font-bold text-[#527078]">{formatNumber(row.targetProd)}</span>
                  </div>
                  <div className="p-1 rounded-lg bg-white border border-[#e7e1d5]">
                    <span className="text-[9px] uppercase tracking-wider text-[#527078] block">Variance</span>
                    <span className={`text-xs font-bold ${isMet ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isMet ? `+${effDiff}%` : `${effDiff}%`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#527078]">
                    {row.plannedMP} MP • {row.workingHours}h shift
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDate) onSelectDate(row.rawDate);
                      if (onNavigate) onNavigate('linedata', row.lineNo);
                    }}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-[#176f78] text-white font-bold text-[11px] transition-colors cursor-pointer touch-manipulation active:scale-95"
                  >
                    Inspect Shift
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop / Tablet Shift Table (screens >= sm) */}
        <div className="hidden sm:block overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e7e1d5] text-[#527078] uppercase text-[10px] font-bold tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Style / Buyer</th>
                <th className="py-2.5 px-3 text-right">Target Eff</th>
                <th className="py-2.5 px-3 text-right">Achieved Eff</th>
                <th className="py-2.5 px-3 text-right">Variance</th>
                <th className="py-2.5 px-3 text-right">Output (Pcs)</th>
                <th className="py-2.5 px-3 text-right">Manpower</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1eee6] font-mono-numbers">
              {chartData.map((row) => {
                const effDiff = Math.round((row.efficiency - row.targetEff) * 10) / 10;
                const isMet = effDiff >= 0;

                return (
                  <tr key={row.id} className="hover:bg-[#fbfaf6] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#17343a] whitespace-nowrap">
                      {row.rawDate}
                      <span className="text-[10px] font-normal text-[#527078] ml-1.5 font-sans">
                        ({row.dayLabel})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans max-w-[200px]">
                      <div className="font-bold text-[#17343a] truncate">{row.style}</div>
                      <div className="text-[10px] text-[#527078] truncate">{row.buyer} • {row.smv}m</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#527078]">
                      {row.targetEff}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                          row.efficiency >= 60
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.efficiency >= row.targetEff
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {row.efficiency}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      <span className={isMet ? 'text-emerald-700' : 'text-rose-700'}>
                        {isMet ? `+${effDiff}%` : `${effDiff}%`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#17343a]">
                      <strong>{formatNumber(row.achievedProd)}</strong> / {formatNumber(row.targetProd)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#527078]">
                      {row.plannedMP} MP ({row.workingHours}h)
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectDate) onSelectDate(row.rawDate);
                          if (onNavigate) onNavigate('linedata', row.lineNo);
                        }}
                        className="px-2.5 py-1 min-h-[32px] rounded-lg bg-[#f1eee6] hover:bg-[#176f78] text-[#17343a] hover:text-white font-bold text-[11px] transition-colors cursor-pointer touch-manipulation active:scale-95"
                        title={`Inspect Line ${row.lineNo} on ${row.rawDate}`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standard 40-Day Style Progression Matrix Modal */}
      <StyleProgressionModal
        isOpen={isStyleProgressionModalOpen}
        onClose={() => setIsStyleProgressionModalOpen(false)}
        activeSMVWeight={getSMVWeight(latestRecord?.smv || 15)}
        activeStyleNature={latestRecord?.learningCurve?.styleNature || 'new'}
      />
    </div>
  );
};
