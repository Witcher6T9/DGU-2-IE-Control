/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Flame,
  Info
} from 'lucide-react';
import { LineEntry } from '../types';
import { calculateStyleWipThreshold } from '../utils';

export interface WipHourDataPoint {
  hourIndex: number;
  hourLabel: string;
  timeStr: string;
  wip: number;
  hourlyInput: number;
  hourlyOutput: number;
  netDelta: number;
  status: 'optimal' | 'caution' | 'critical';
}

export interface LineWipSeries {
  lineNo: string;
  style: string;
  currentWip: number;
  threshold: number;
  isBreached: boolean;
  color: string;
  points: WipHourDataPoint[];
  netChange: number;
  pctChange: number;
  minWip: number;
  maxWip: number;
  avgWip: number;
}

const LINE_SERIES_COLORS = [
  '#0d9488', // Teal
  '#ea580c', // Orange
  '#dc2626', // Red
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#16a34a', // Green
];

/**
 * Calculates a realistic 4-hour WIP progression backwards from current live WIP
 */
export function getLineWipHistory(line: LineEntry, hoursCount: number = 4): WipHourDataPoint[] {
  const currentWip = Math.max(40, line.wip ?? 280);
  const thresholdInfo = calculateStyleWipThreshold(line);
  const hourlyTarget = thresholdInfo.hourlyTarget || Math.round((line.targetProd || 600) / (line.workingHours || 8));

  // Deterministic seed based on lineNo and style
  const numericId = parseInt(line.lineNo.replace(/\D/g, ''), 10) || 1;
  const styleHash = (line.style || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = numericId * 37 + styleHash * 11;

  // Bottleneck status check
  const isBottlenecked = Boolean(
    line.bottleneck && (
      line.bottleneck.status === 'critical' ||
      line.bottleneck.status === 'high' ||
      (line.bottleneck.cycleTime > line.bottleneck.targetCT && line.bottleneck.targetCT > 0)
    )
  );

  const now = new Date();
  const currentHour = now.getHours() || 14;

  // Working backward deltas
  const deltas: { input: number; output: number; delta: number }[] = [];
  for (let i = 0; i < hoursCount; i++) {
    const pseudoSin = Math.sin(seed + i * 1.93);
    const pseudoCos = Math.cos(seed + i * 2.47);
    
    // Inputs: regular input pacing with slight variance
    const inputRatio = 1.0 + pseudoSin * 0.12 + (isBottlenecked ? 0.05 : 0);
    const input = Math.round(hourlyTarget * inputRatio);

    // Outputs: reduced if line is bottlenecked or efficiency dropped
    const outputPenalty = isBottlenecked ? 0.22 : (line.efficiency && line.efficiency < 75 ? 0.15 : 0);
    const outputRatio = Math.max(0.6, 1.0 - outputPenalty + pseudoCos * 0.08);
    const output = Math.round(hourlyTarget * outputRatio);

    const delta = input - output;
    deltas.push({ input, output, delta });
  }

  // Anchor latest point to currentWip, derive previous hours
  const wips: number[] = [currentWip];
  for (let i = hoursCount - 1; i >= 1; i--) {
    const prevWip = Math.max(30, Math.round(wips[0] - deltas[i].delta));
    wips.unshift(prevWip);
  }

  const points: WipHourDataPoint[] = [];
  for (let i = 0; i < hoursCount; i++) {
    const hourOffset = (hoursCount - 1) - i;
    const hNum = Math.max(8, (currentHour - hourOffset + 24) % 24);
    const timeStr = `${hNum.toString().padStart(2, '0')}:00`;
    const hourLabel = i === hoursCount - 1 ? `Now (${timeStr})` : `H-${hourOffset} (${timeStr})`;
    const wipVal = wips[i];

    let status: 'optimal' | 'caution' | 'critical' = 'optimal';
    if (wipVal > thresholdInfo.threshold) {
      status = 'critical';
    } else if (wipVal > thresholdInfo.threshold * 0.85) {
      status = 'caution';
    }

    points.push({
      hourIndex: i,
      hourLabel,
      timeStr,
      wip: wipVal,
      hourlyInput: deltas[i].input,
      hourlyOutput: deltas[i].output,
      netDelta: deltas[i].delta,
      status
    });
  }

  return points;
}

interface FloorWipSparklineProps {
  lines: LineEntry[];
  initialSelectedLineNo?: string;
  onNavigateLine?: (lineNo: string) => void;
  className?: string;
}

export const FloorWipSparkline: React.FC<FloorWipSparklineProps> = ({
  lines,
  initialSelectedLineNo,
  onNavigateLine,
  className = ''
}) => {
  // Deduplicate lines by lineNo so each physical line appears exactly once
  const uniqueLines = useMemo(() => {
    const map = new Map<string, LineEntry>();
    lines.forEach(l => {
      if (!map.has(l.lineNo)) {
        map.set(l.lineNo, l);
      } else {
        const existing = map.get(l.lineNo)!;
        if (l.date && existing.date && l.date > existing.date) {
          map.set(l.lineNo, l);
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      const numA = parseInt(a.lineNo.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.lineNo.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [lines]);

  // Lines that have active WIP breach
  const breachedLineNumbers = useMemo(() => {
    return new Set(uniqueLines.filter(l => calculateStyleWipThreshold(l).isBreached).map(l => l.lineNo));
  }, [uniqueLines]);

  // Selected line state
  const [selectedLineNo, setSelectedLineNo] = useState<string>(() => {
    if (initialSelectedLineNo && uniqueLines.some(l => l.lineNo === initialSelectedLineNo)) {
      return initialSelectedLineNo;
    }
    // Default to first breached line if exists, else first line
    const firstBreached = uniqueLines.find(l => calculateStyleWipThreshold(l).isBreached);
    return firstBreached?.lineNo || uniqueLines[0]?.lineNo || '1';
  });

  // Filter mode: 'all' | 'breached'
  const [lineFilter, setLineFilter] = useState<'all' | 'breached'>(
    breachedLineNumbers.size > 0 ? 'breached' : 'all'
  );

  // Multi-line comparison mode
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparedLines, setComparedLines] = useState<string[]>(() => {
    const initial = [selectedLineNo];
    // Add up to 2 other lines
    for (const l of uniqueLines) {
      if (initial.length >= 3) break;
      if (!initial.includes(l.lineNo)) initial.push(l.lineNo);
    }
    return initial;
  });

  // Active hover point for single-line tooltip
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Filtered line list for selection chips
  const selectableLines = useMemo(() => {
    if (lineFilter === 'breached') {
      const breached = uniqueLines.filter(l => breachedLineNumbers.has(l.lineNo));
      return breached.length > 0 ? breached : uniqueLines;
    }
    return uniqueLines;
  }, [uniqueLines, lineFilter, breachedLineNumbers]);

  // Generate series data for the selected lines
  const seriesList = useMemo<LineWipSeries[]>(() => {
    const targetLineNos = isCompareMode ? comparedLines : [selectedLineNo];
    return targetLineNos.map((lineNo, idx) => {
      const line = uniqueLines.find(l => l.lineNo === lineNo) || uniqueLines[0];
      if (!line) {
        return {
          lineNo,
          style: '',
          currentWip: 0,
          threshold: 0,
          isBreached: false,
          color: LINE_SERIES_COLORS[idx % LINE_SERIES_COLORS.length],
          points: [],
          netChange: 0,
          pctChange: 0,
          minWip: 0,
          maxWip: 0,
          avgWip: 0
        };
      }

      const points = getLineWipHistory(line, 4);
      const thresholdInfo = calculateStyleWipThreshold(line);
      const firstWip = points[0]?.wip || line.wip || 1;
      const lastWip = points[points.length - 1]?.wip || line.wip || 1;
      const netChange = lastWip - firstWip;
      const pctChange = Math.round(((lastWip - firstWip) / firstWip) * 100);

      const wipVals = points.map(p => p.wip);
      const minWip = Math.min(...wipVals);
      const maxWip = Math.max(...wipVals);
      const avgWip = Math.round(wipVals.reduce((a, b) => a + b, 0) / (wipVals.length || 1));

      return {
        lineNo: line.lineNo,
        style: line.style,
        currentWip: line.wip,
        threshold: thresholdInfo.threshold,
        isBreached: thresholdInfo.isBreached,
        color: LINE_SERIES_COLORS[idx % LINE_SERIES_COLORS.length],
        points,
        netChange,
        pctChange,
        minWip,
        maxWip,
        avgWip
      };
    });
  }, [lines, isCompareMode, comparedLines, selectedLineNo]);

  // Focused single series (for single-line view)
  const primarySeries = seriesList[0] || null;

  // Chart bounds & scaling
  const chartBounds = useMemo(() => {
    if (seriesList.length === 0) return { min: 0, max: 1000 };
    let min = Infinity;
    let max = -Infinity;

    seriesList.forEach(s => {
      s.points.forEach(p => {
        if (p.wip < min) min = p.wip;
        if (p.wip > max) max = p.wip;
      });
      if (s.threshold > max) max = s.threshold;
    });

    if (min === Infinity) min = 100;
    if (max === -Infinity) max = 600;

    // Add 12% padding top and bottom for visually pleasing margin
    const range = Math.max(50, max - min);
    const paddedMin = Math.max(0, Math.floor((min - range * 0.15) / 10) * 10);
    const paddedMax = Math.ceil((max + range * 0.15) / 10) * 10;

    return { min: paddedMin, max: paddedMax };
  }, [seriesList]);

  // SVG Coordinates calculation
  const svgWidth = 280;
  const svgHeight = 72;
  const paddingX = 22;
  const paddingY = 12;

  const getCoordinates = (pointIndex: number, wipValue: number) => {
    const x = paddingX + (pointIndex / 3) * (svgWidth - paddingX * 2);
    const normalizedY = (wipValue - chartBounds.min) / (chartBounds.max - chartBounds.min || 1);
    const y = svgHeight - paddingY - normalizedY * (svgHeight - paddingY * 2);
    return { x, y: Math.max(paddingY, Math.min(svgHeight - paddingY, y)) };
  };

  // Build SVG path strings
  const generatePathD = (points: WipHourDataPoint[]) => {
    if (!points || points.length === 0) return '';
    const coords = points.map((p, idx) => getCoordinates(idx, p.wip));
    
    // Smooth Catmull-Rom or cubic bezier curve
    let d = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i === 0 ? 0 : i - 1];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[i + 2 >= coords.length ? coords.length - 1 : i + 2];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const generateAreaD = (points: WipHourDataPoint[]) => {
    const linePath = generatePathD(points);
    if (!linePath) return '';
    const lastX = paddingX + (svgWidth - paddingX * 2);
    const firstX = paddingX;
    const bottomY = svgHeight - 4;
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  };

  const handleToggleCompareLine = (lineNo: string) => {
    setComparedLines(prev => {
      if (prev.includes(lineNo)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter(l => l !== lineNo);
      } else {
        if (prev.length >= 4) return [...prev.slice(1), lineNo]; // Max 4 lines
        return [...prev, lineNo];
      }
    });
  };

  return (
    <div
      id="floor-wip-mini-sparkline-widget"
      className={`rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 select-none text-slate-800 dark:text-slate-100 ${className}`}
    >
      {/* Sparkline Widget Header */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#176f78]/15 text-[#176f78] dark:text-teal-400 flex items-center justify-center">
            <Activity className="w-3 h-3 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
            4-Hour WIP Level Trend
          </span>
        </div>

        {/* View Mode Toggle: Single Line vs Compare */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsCompareMode(prev => !prev)}
            title={isCompareMode ? 'Switch to detailed single-line view' : 'Compare multiple lines simultaneously'}
            className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold font-mono transition-all cursor-pointer border ${
              isCompareMode
                ? 'bg-[#176f78] text-white border-[#176f78]'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-[#176f78]'
            }`}
          >
            {isCompareMode ? 'Multi-Line (ON)' : 'Compare'}
          </button>

          {breachedLineNumbers.size > 0 && (
            <button
              type="button"
              onClick={() => setLineFilter(prev => prev === 'breached' ? 'all' : 'breached')}
              title={lineFilter === 'breached' ? 'Show all floor lines' : 'Filter only WIP breached lines'}
              className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-all cursor-pointer border ${
                lineFilter === 'breached'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
              }`}
            >
              Breached ({breachedLineNumbers.size})
            </button>
          )}
        </div>
      </div>

      {/* Selected Lines Horizontal Selector Chips */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-none mb-2">
        {selectableLines.map((line, idx) => {
          const isSelected = isCompareMode
            ? comparedLines.includes(line.lineNo)
            : selectedLineNo === line.lineNo;
          const isBreached = breachedLineNumbers.has(line.lineNo);

          return (
            <button
              key={`wip-chip-${line.lineNo}-${idx}`}
              type="button"
              onClick={() => {
                if (isCompareMode) {
                  handleToggleCompareLine(line.lineNo);
                } else {
                  setSelectedLineNo(line.lineNo);
                  if (onNavigateLine) onNavigateLine(line.lineNo);
                }
              }}
              title={`Line ${line.lineNo} (${line.style || 'Basic'}) - Current WIP: ${line.wip} pcs ${
                isBreached ? '⚠️ BREACHED' : '✓ Normal'
              }`}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-[#176f78] text-white border-[#176f78] shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#176f78]'
              }`}
            >
              <span>L-{line.lineNo}</span>
              {isBreached && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-amber-300' : 'bg-rose-500 animate-pulse'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Sparkline Chart Canvas */}
      {seriesList.length > 0 && (
        <div className="relative bg-white dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80 p-2 shadow-2xs overflow-hidden">
          {/* Top Series Info Row */}
          {!isCompareMode && primarySeries && (
            <div className="flex items-center justify-between text-[10px] pb-1.5 mb-1 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-extrabold text-[#176f78] dark:text-teal-400">
                  Line {primarySeries.lineNo}
                </span>
                <span className="text-slate-400 dark:text-slate-500 truncate max-w-[100px]">
                  {primarySeries.style || 'In Production'}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 font-mono font-bold">
                  <span className="text-slate-500 text-[9px]">WIP:</span>
                  <span
                    className={
                      primarySeries.isBreached
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }
                  >
                    {primarySeries.currentWip} pcs
                  </span>
                </div>

                <div
                  className={`flex items-center gap-0.5 text-[9px] font-bold font-mono px-1 py-0.2 rounded ${
                    primarySeries.netChange > 0
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      : primarySeries.netChange < 0
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {primarySeries.netChange > 0 ? (
                    <TrendingUp className="w-2.5 h-2.5" />
                  ) : primarySeries.netChange < 0 ? (
                    <TrendingDown className="w-2.5 h-2.5" />
                  ) : null}
                  <span>
                    {primarySeries.netChange > 0 ? '+' : ''}
                    {primarySeries.netChange} ({primarySeries.pctChange}%)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Multi-line Legend (shown in Compare mode) */}
          {isCompareMode && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-1 text-[9px] font-mono scrollbar-none">
              {seriesList.map((s, idx) => (
                <div key={`wip-legend-${s.lineNo}-${idx}`} className="flex items-center gap-1 shrink-0">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    L-{s.lineNo}
                  </span>
                  <span className="text-slate-500">({s.currentWip}pcs)</span>
                </div>
              ))}
            </div>
          )}

          {/* SVG Sparkline Graph */}
          <div className="relative w-full h-[72px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradient Fills */}
                <linearGradient id="wip-sparkline-teal-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="wip-sparkline-rose-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Threshold Dashed Line (for single-line view) */}
              {!isCompareMode && primarySeries && (
                <>
                  {(() => {
                    const thresholdCoord = getCoordinates(0, primarySeries.threshold);
                    return (
                      <g className="opacity-75">
                        <line
                          x1={paddingX - 4}
                          y1={thresholdCoord.y}
                          x2={svgWidth - paddingX + 4}
                          y2={thresholdCoord.y}
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                        <text
                          x={svgWidth - paddingX + 5}
                          y={thresholdCoord.y + 3}
                          fontSize="7"
                          fill="#ef4444"
                          textAnchor="start"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Lim
                        </text>
                      </g>
                    );
                  })()}
                </>
              )}

              {/* Baseline Grid Guides */}
              <line
                x1={paddingX}
                y1={svgHeight - paddingY}
                x2={svgWidth - paddingX}
                y2={svgHeight - paddingY}
                stroke="#94a3b8"
                strokeWidth="0.5"
                strokeDasharray="1 3"
                opacity="0.35"
              />

              {/* Render Series Curves */}
              {seriesList.map((series, sIdx) => {
                const areaD = generateAreaD(series.points);
                const pathD = generatePathD(series.points);
                const isSingle = !isCompareMode;
                const strokeColor = isSingle
                  ? series.isBreached
                    ? '#dc2626'
                    : '#0d9488'
                  : series.color;
                const fillGrad = series.isBreached
                  ? 'url(#wip-sparkline-rose-grad)'
                  : 'url(#wip-sparkline-teal-grad)';

                return (
                  <g key={`wip-series-${series.lineNo}-${sIdx}`}>
                    {/* Gradient Fill under sparkline */}
                    {isSingle && areaD && (
                      <path d={areaD} fill={fillGrad} />
                    )}

                    {/* Sparkline Line Curve */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isSingle ? '2.2' : '1.8'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data Points on the curve */}
                    {series.points.map((pt, ptIdx) => {
                      const { x, y } = getCoordinates(ptIdx, pt.wip);
                      const isHovered = hoveredPointIdx === ptIdx && isSingle;
                      const isLatest = ptIdx === 3;

                      return (
                        <g key={`wip-pt-${series.lineNo}-${ptIdx}`}>
                          {/* Pulsing ring on current point */}
                          {isLatest && (
                            <circle
                              cx={x}
                              cy={y}
                              r="5"
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth="1"
                              className="animate-ping opacity-60"
                            />
                          )}

                          {/* Interactive Dot */}
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 4.5 : isLatest ? 3.5 : 2.5}
                            fill={strokeColor}
                            stroke="#ffffff"
                            strokeWidth={isHovered ? 2 : 1}
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredPointIdx(ptIdx)}
                            onMouseLeave={() => setHoveredPointIdx(null)}
                          />

                          {/* Numerical point label on single-line view */}
                          {isSingle && (
                            <text
                              x={x}
                              y={y - 6}
                              fontSize="7.5"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                              fill={pt.status === 'critical' ? '#dc2626' : '#1e293b'}
                              className="dark:fill-slate-200 pointer-events-none"
                            >
                              {pt.wip}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Time Labels on X-Axis (H-3, H-2, H-1, Now) */}
          <div className="flex items-center justify-between px-1 text-[8.5px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
            {primarySeries?.points.map((pt, idx) => (
              <span
                key={`wip-time-${idx}`}
                className={`transition-colors ${
                  idx === 3
                    ? 'font-bold text-[#176f78] dark:text-teal-400'
                    : hoveredPointIdx === idx
                    ? 'text-slate-800 dark:text-slate-200 font-semibold'
                    : ''
                }`}
              >
                {idx === 0 ? '4h ago' : idx === 1 ? '3h ago' : idx === 2 ? '2h ago' : 'Now'}
              </span>
            ))}
          </div>

          {/* Hovered Point Detail Card (if single-line hovered) */}
          {!isCompareMode && hoveredPointIdx !== null && primarySeries?.points[hoveredPointIdx] && (
            <div className="mt-1.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] flex items-center justify-between animate-fadeIn font-mono">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                {primarySeries.points[hoveredPointIdx].hourLabel}:
              </span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white">
                  {primarySeries.points[hoveredPointIdx].wip} pcs
                </span>
                <span className="text-[9px] text-slate-500">
                  (In: {primarySeries.points[hoveredPointIdx].hourlyInput} / Out:{' '}
                  {primarySeries.points[hoveredPointIdx].hourlyOutput})
                </span>
              </div>
            </div>
          )}

          {/* Sparkline Bottom Metrics: Min, Max, Safe Limit */}
          {!isCompareMode && primarySeries && hoveredPointIdx === null && (
            <div className="mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <span>Min:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {primarySeries.minWip}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Max:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {primarySeries.maxWip}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span>Limit:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {primarySeries.threshold}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[8.5px]">4h Flow</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
