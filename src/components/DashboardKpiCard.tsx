/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Maximize2,
  Clock,
  Calendar,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface HourlyKpiPoint {
  hour: string;
  timeSlot: string;
  actual: number;
  target: number;
  variance: number;
  eff?: number;
  status: 'above' | 'on_track' | 'below';
}

export interface HistoricalKpiPoint {
  date: string;
  label: string;
  value: number;
  target?: number;
  formattedValue: string;
}

export interface DashboardKpiCardProps {
  id: 'efficiency' | 'production' | 'attendance' | 'wip_lines';
  title: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  badge?: {
    text: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  accentColor: string;
  progressValue?: number;
  progressMax?: number;
  progressColor?: string;
  secondaryStats?: {
    label: string;
    value: string | number;
    color?: string;
  }[];
  hourlyBreakdown: HourlyKpiPoint[];
  historicalTrends: HistoricalKpiPoint[];
  metricType: 'percentage' | 'units' | 'count';
  onOpenDrillDown?: (cardId: string) => void;
  quickSummaryNote?: string;
}

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  id,
  title,
  value,
  unit,
  subValue,
  badge,
  icon,
  iconBgColor,
  iconColor,
  accentColor,
  progressValue,
  progressMax = 100,
  progressColor = '#176f78',
  secondaryStats,
  hourlyBreakdown,
  historicalTrends,
  metricType,
  onOpenDrillDown,
  quickSummaryNote
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [activeHourlyIdx, setActiveHourlyIdx] = useState<number | null>(null);

  // Compute 7-day trend variance
  const latestHistorical = historicalTrends[historicalTrends.length - 1];
  const previousHistorical = historicalTrends[historicalTrends.length - 2];
  const histDelta =
    latestHistorical && previousHistorical
      ? Math.round((latestHistorical.value - previousHistorical.value) * 10) / 10
      : 0;

  // Mini historical SVG sparkline calculations
  const sparkWidth = 180;
  const sparkHeight = 36;
  const sparkPadX = 8;
  const sparkPadY = 6;

  const histValues = historicalTrends.map(h => h.value);
  const minVal = Math.min(...histValues, 0);
  const maxVal = Math.max(...histValues, 100);
  const range = maxVal - minVal || 1;

  const sparkCoords = historicalTrends.map((h, i) => {
    const x =
      sparkPadX + (i / Math.max(1, historicalTrends.length - 1)) * (sparkWidth - sparkPadX * 2);
    const normalizedY = (h.value - minVal) / range;
    const y = sparkHeight - sparkPadY - normalizedY * (sparkHeight - sparkPadY * 2);
    return { x, y: Math.max(sparkPadY, Math.min(sparkHeight - sparkPadY, y)), point: h };
  });

  const sparkPathD = sparkCoords.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ''
  );

  return (
    <div
      id={`kpi-card-${id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveHourlyIdx(null);
      }}
      onClick={() => onOpenDrillDown && onOpenDrillDown(id)}
      className="group relative w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-[#176f78] cursor-pointer select-none"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-xs text-[#527078] font-bold uppercase tracking-wider mb-2">
        <span className="truncate pr-1">{title}</span>
        <div className="flex items-center gap-1.5">
          {/* Subtle Drill-Down Icon Tag visible on hover */}
          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-bold text-[#176f78] opacity-0 group-hover:opacity-100 transition-opacity bg-[#dceceb] px-1.5 py-0.5 rounded-md">
            Drill-down <Maximize2 className="w-2.5 h-2.5" />
          </span>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
            style={{ backgroundColor: iconBgColor, color: iconColor }}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Main KPI Value Row */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="font-display text-3xl sm:text-4xl font-bold text-[#17343a] tracking-tight">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-xl font-normal ml-0.5">{unit}</span>}
        </span>
        {subValue && (
          <span className="text-xs text-[#527078] font-mono-numbers">
            {subValue}
          </span>
        )}
        {badge && (
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
              badge.positive
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {/* Progress Bar (if provided) */}
      {progressValue !== undefined && (
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: progressColor,
                width: `${Math.min(100, Math.max(0, (progressValue / progressMax) * 100))}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Secondary Stats Footer */}
      {secondaryStats && secondaryStats.length > 0 && (
        <div className="mt-2.5 flex justify-between items-center text-[10px] text-[#527078] font-mono-numbers">
          {secondaryStats.map((st, i) => (
            <span key={i} className="truncate">
              {st.label}:{' '}
              <strong className={st.color || 'text-[#17343a]'}>
                {typeof st.value === 'number' ? st.value.toLocaleString() : st.value}
              </strong>
            </span>
          ))}
        </div>
      )}

      {/* Quick Interactive Tooltip Cue */}
      <div className="mt-2 pt-2 border-t border-[#f1eee6] flex items-center justify-between text-[9px] text-slate-400 group-hover:text-[#176f78] transition-colors">
        <span className="flex items-center gap-1 font-mono">
          <Clock className="w-2.5 h-2.5" /> Hourly Pacing & 7-Day Trend
        </span>
        <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* INTERACTIVE DRILL-DOWN HOVER TOOLTIP / POPOVER */}
      {/* ────────────────────────────────────────────────────────── */}
      <div
        className={`absolute left-0 sm:left-1/2 sm:-translate-x-1/2 bottom-[calc(100%+8px)] z-50 w-80 sm:w-84 rounded-2xl bg-slate-900 text-white p-3.5 shadow-2xl border border-slate-700 pointer-events-none transition-all duration-200 transform ${
          isHovered
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Tooltip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
              {title} Telemetry
            </span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 font-bold">
            Live Drill-down
          </span>
        </div>

        {/* 1. Hourly Breakdown Pacing Comparison */}
        <div className="py-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Clock className="w-3 h-3 text-teal-400" /> Hourly Pacing Breakdown:
            </span>
            <span className="text-[9px] text-slate-400">Target vs Actual</span>
          </div>

          {/* Mini Hourly Pacing Bars */}
          <div className="grid grid-cols-9 gap-1 h-12 items-end bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/80">
            {hourlyBreakdown.map((hb, idx) => {
              const maxUnits = Math.max(...hourlyBreakdown.map(h => Math.max(h.target, h.actual)), 1);
              const actualHeightPct = Math.round((hb.actual / maxUnits) * 100);
              const targetHeightPct = Math.round((hb.target / maxUnits) * 100);
              const isSelected = activeHourlyIdx === idx;

              return (
                <div
                  key={hb.hour}
                  onMouseEnter={() => setActiveHourlyIdx(idx)}
                  className="flex flex-col items-center h-full justify-end relative cursor-pointer group/bar"
                >
                  {/* Target reference horizontal dash */}
                  <div
                    className="absolute w-full border-t border-dashed border-amber-400/70 z-10"
                    style={{ bottom: `${targetHeightPct}%` }}
                    title={`Target: ${hb.target}`}
                  />
                  {/* Actual bar */}
                  <div
                    className={`w-full rounded-t-sm transition-all duration-200 ${
                      hb.actual >= hb.target
                        ? 'bg-teal-400 hover:bg-teal-300'
                        : 'bg-rose-400 hover:bg-rose-300'
                    } ${isSelected ? 'ring-2 ring-white' : ''}`}
                    style={{ height: `${actualHeightPct}%` }}
                  />
                  <span className="text-[7.5px] font-mono text-slate-400 mt-1">
                    {hb.hour.split('-')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Hour Details */}
          {activeHourlyIdx !== null && hourlyBreakdown[activeHourlyIdx] ? (
            <div className="mt-1.5 p-1 rounded-lg bg-slate-800/80 text-[9.5px] font-mono flex items-center justify-between text-slate-200">
              <span className="font-bold text-teal-300">
                Slot {hourlyBreakdown[activeHourlyIdx].timeSlot}:
              </span>
              <span>
                Act: <strong>{hourlyBreakdown[activeHourlyIdx].actual}</strong> / Tgt:{' '}
                {hourlyBreakdown[activeHourlyIdx].target} (
                <span
                  className={
                    hourlyBreakdown[activeHourlyIdx].variance >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }
                >
                  {hourlyBreakdown[activeHourlyIdx].variance >= 0 ? '+' : ''}
                  {hourlyBreakdown[activeHourlyIdx].variance}
                </span>
                )
              </span>
            </div>
          ) : (
            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-amber-400 inline-block" /> Target Pacing
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-teal-400 inline-block" /> Actual Output
              </span>
            </div>
          )}
        </div>

        {/* 2. 7-Day Historical Performance Trend */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-400" /> 7-Day Performance Trend:
            </span>
            <span className="text-[9px] text-slate-300 font-bold">
              {histDelta >= 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{histDelta}
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-0.5">
                  <TrendingDown className="w-2.5 h-2.5" /> {histDelta}
                </span>
              )}
            </span>
          </div>

          {/* SVG Sparkline */}
          <div className="w-full h-9 bg-slate-950/60 rounded-xl p-1 border border-slate-800/80 relative flex items-center">
            <svg
              viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
              className="w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id={`spark-grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={sparkPathD}
                fill="none"
                stroke="#2dd4bf"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparkCoords.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={i === sparkCoords.length - 1 ? 3 : 2}
                  fill={i === sparkCoords.length - 1 ? '#38bdf8' : '#2dd4bf'}
                  stroke="#0f172a"
                  strokeWidth="1"
                />
              ))}
            </svg>
          </div>

          {/* Date Points X-Axis */}
          <div className="flex justify-between text-[8px] font-mono text-slate-400 mt-1">
            <span>{historicalTrends[0]?.label || '17-Sep'}</span>
            <span>{historicalTrends[Math.floor(historicalTrends.length / 2)]?.label || '21-Sep'}</span>
            <span className="text-teal-300 font-bold">
              {historicalTrends[historicalTrends.length - 1]?.label || '24-Sep (Active)'}
            </span>
          </div>
        </div>

        {/* Footer Click Action */}
        <div
          onClick={() => onOpenDrillDown && onOpenDrillDown(id)}
          className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9.5px] font-bold text-teal-400 hover:text-teal-300 transition-colors cursor-pointer"
        >
          <span>Click card for detailed floor breakdown</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
