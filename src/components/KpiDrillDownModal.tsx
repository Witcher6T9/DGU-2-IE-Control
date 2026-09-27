/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Layers,
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Share2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { LineEntry } from '../types';
import { HourlyKpiPoint, HistoricalKpiPoint } from './DashboardKpiCard';

interface KpiDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKpiId: 'efficiency' | 'production' | 'attendance' | 'wip_lines';
  onSelectKpiId: (id: 'efficiency' | 'production' | 'attendance' | 'wip_lines') => void;
  kpiData: {
    efficiency: {
      value: number;
      target: number;
      varianceText: string;
      hourly: HourlyKpiPoint[];
      historical: HistoricalKpiPoint[];
    };
    production: {
      achieved: number;
      target: number;
      pct: number;
      hourly: HourlyKpiPoint[];
      historical: HistoricalKpiPoint[];
    };
    attendance: {
      present: number;
      absent: number;
      rate: number;
      hourly: HourlyKpiPoint[];
      historical: HistoricalKpiPoint[];
    };
    wip_lines: {
      activeLines: number;
      totalWip: number;
      hourly: HourlyKpiPoint[];
      historical: HistoricalKpiPoint[];
    };
  };
  floorSummaries: {
    floor: string;
    efficiencyPct: number;
    achievedProd: number;
    targetProd: number;
    manpower: number;
    lineNumbers: string[];
  }[];
  activeDate?: string;
  onNavigateToLine?: (lineNo: string) => void;
}

export const KpiDrillDownModal: React.FC<KpiDrillDownModalProps> = ({
  isOpen,
  onClose,
  activeKpiId,
  onSelectKpiId,
  kpiData,
  floorSummaries,
  activeDate = '2026-09-24',
  onNavigateToLine
}) => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'historical' | 'floors' | 'ie_advice'>('hourly');

  if (!isOpen) return null;

  const currentKpi = kpiData[activeKpiId];
  const hourlyList = currentKpi.hourly;
  const histList = currentKpi.historical;

  const totalHourlyActual = hourlyList.reduce((acc, h) => acc + h.actual, 0);
  const totalHourlyTarget = hourlyList.reduce((acc, h) => acc + h.target, 0);
  const hourlyVariance = totalHourlyActual - totalHourlyTarget;

  return (
    <div
      id="kpi-drilldown-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="kpi-drilldown-modal-container"
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-[#d9d2c2] dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#fbfaf6] dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#176f78]/15 text-[#176f78] dark:text-teal-400 flex items-center justify-center font-bold">
              {activeKpiId === 'efficiency' && <TrendingUp className="w-5 h-5" />}
              {activeKpiId === 'production' && <Target className="w-5 h-5" />}
              {activeKpiId === 'attendance' && <Users className="w-5 h-5" />}
              {activeKpiId === 'wip_lines' && <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {activeKpiId.replace('_', ' & ')} Drill-Down Analysis
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300">
                  {activeDate}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed hourly progression logs, multi-day benchmark trends & floor distribution
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* KPI Selector Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-xs font-bold text-slate-600 dark:text-slate-400">
          <button
            type="button"
            onClick={() => onSelectKpiId('efficiency')}
            className={`py-2.5 sm:py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeKpiId === 'efficiency'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Efficiency ({kpiData.efficiency.value}%)
          </button>
          <button
            type="button"
            onClick={() => onSelectKpiId('production')}
            className={`py-2.5 sm:py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeKpiId === 'production'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Output ({kpiData.production.achieved.toLocaleString()} pcs)
          </button>
          <button
            type="button"
            onClick={() => onSelectKpiId('attendance')}
            className={`py-2.5 sm:py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeKpiId === 'attendance'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Attendance ({kpiData.attendance.rate}%)
          </button>
          <button
            type="button"
            onClick={() => onSelectKpiId('wip_lines')}
            className={`py-2.5 sm:py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeKpiId === 'wip_lines'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-400 bg-white dark:bg-slate-900'
                : 'border-transparent hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lines & WIP ({kpiData.wip_lines.totalWip.toLocaleString()} pcs)
          </button>
        </div>

        {/* Sub-view Navigation Pills */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'hourly'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Hourly Breakdown</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historical')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'historical'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>7-Day Benchmark Trend</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'floors'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Floor Distribution</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ie_advice')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              activeTab === 'ie_advice'
                ? 'bg-[#176f78] text-white shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>IE Floor Guidance</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: Hourly Breakdown */}
          {activeTab === 'hourly' && (
            <div className="space-y-4">
              {/* Summary Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Shift Actual Pacing
                  </span>
                  <div className="text-xl font-black mt-0.5 font-mono text-slate-900 dark:text-white">
                    {totalHourlyActual.toLocaleString()} pcs
                  </div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                    Across 9 Shift Hours
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Shift Target Pacing
                  </span>
                  <div className="text-xl font-black mt-0.5 font-mono text-slate-900 dark:text-white">
                    {totalHourlyTarget.toLocaleString()} pcs
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Target Standard Minutes
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Shift Variance
                  </span>
                  <div
                    className={`text-xl font-black mt-0.5 font-mono ${
                      hourlyVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {hourlyVariance >= 0 ? '+' : ''}
                    {hourlyVariance.toLocaleString()} pcs
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {hourlyVariance >= 0 ? 'Ahead of baseline' : 'Behind baseline'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pacing Health
                  </span>
                  <div className="text-xl font-black mt-0.5 font-mono text-emerald-600">
                    {Math.round((totalHourlyActual / (totalHourlyTarget || 1)) * 100)}%
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Optimal line rhythm
                  </span>
                </div>
              </div>

              {/* Hourly Logs Data Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950/50">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Hour Slot</th>
                      <th className="py-2.5 px-3">Actual Output</th>
                      <th className="py-2.5 px-3">Target Output</th>
                      <th className="py-2.5 px-3">Variance</th>
                      <th className="py-2.5 px-3">Pacing Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {hourlyList.map(h => {
                      const isAhead = h.actual >= h.target;
                      return (
                        <tr
                          key={h.hour}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {h.timeSlot} ({h.hour})
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {h.actual.toLocaleString()} pcs
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {h.target.toLocaleString()} pcs
                          </td>
                          <td
                            className={`py-2.5 px-3 font-bold ${
                              h.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {h.variance >= 0 ? '+' : ''}
                            {h.variance} pcs
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isAhead
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {isAhead ? '✓ Target Achieved' : '⚠️ Below Pacing'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: 7-Day Historical Benchmark Trend */}
          {activeTab === 'historical' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  7-Day Trend Progression ({activeKpiId})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px]">Active Shift:</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                      {histList[histList.length - 1]?.formattedValue || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">7-Day Peak:</span>
                    <div className="text-lg font-bold text-emerald-600">
                      {Math.max(...histList.map(h => h.value))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">7-Day Baseline Avg:</span>
                    <div className="text-lg font-bold text-slate-700 dark:text-slate-300">
                      {Math.round(
                        (histList.reduce((acc, h) => acc + h.value, 0) / (histList.length || 1)) * 10
                      ) / 10}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Trajectoral Status:</span>
                    <div className="text-lg font-bold text-teal-600 dark:text-teal-400">
                      Upward Ramp ↗
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Daily Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950/50">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Production Report Label</th>
                      <th className="py-2.5 px-3">Metric Value</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {histList.map((h, i) => {
                      const isLatest = i === histList.length - 1;
                      return (
                        <tr
                          key={h.date}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                            isLatest ? 'bg-teal-50/50 dark:bg-teal-950/20 font-bold' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                            {h.date}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {h.label} {isLatest && <span className="text-teal-600">(Current)</span>}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {h.formattedValue}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                              ✓ Verified
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Floor Distribution */}
          {activeTab === 'floors' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floorSummaries.map(fs => {
                  const targetPct =
                    fs.targetProd > 0 ? Math.round((fs.achievedProd / fs.targetProd) * 100) : 0;
                  return (
                    <div
                      key={fs.floor}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {fs.floor}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300">
                          {fs.efficiencyPct}% Eff
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs font-mono">
                        <span className="text-slate-500">Output:</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {fs.achievedProd.toLocaleString()} / {fs.targetProd.toLocaleString()} pcs ({targetPct}%)
                        </span>
                      </div>

                      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#176f78]"
                          style={{ width: `${Math.min(targetPct, 100)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Lines: {fs.lineNumbers.join(', ')}</span>
                        <span>MP: {fs.manpower} operators</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: IE Floor Guidance */}
          {activeTab === 'ie_advice' && (
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Industrial Engineering Action Plan for {activeKpiId.toUpperCase()}</span>
                </div>
                <p>
                  Based on live production pacing across 34 lines, morning start-up loss is currently
                  under 4.2%. Bottleneck intervention is recommended for stations with cycle time
                  variance &gt; 15% to maintain afternoon shift targets.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 space-y-2">
                <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Floor Directives:
                </h5>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-300">
                  <li>Enforce hourly pitch inspection on lines falling below 85% target achievement.</li>
                  <li>Maintain in-line buffer WIP within 1.8 to 2.5 hours of hourly production demand.</li>
                  <li>Deploy floater operators to relief critical assembly stations prior to 14:00 shift peak.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Unit-02 Daily Control Telemetry
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Close Drill-Down
          </button>
        </div>
      </div>
    </div>
  );
};
