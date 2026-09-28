/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Layers,
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Users,
  Search,
  Filter,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import { LineEntry, UserProfile } from '../types';
import { calculateLineMetrics, calculateFactoryOverall, formatDateLabel } from '../utils';
import { downloadShiftEndSummaryPDF } from '../utils/generatePdfReport';
import { ReportTemplateConfig, PREBUILT_REPORT_TEMPLATES, ReportTemplateImporterModal } from './ReportTemplateImporterModal';

interface ShiftEndSummaryViewProps {
  lines: LineEntry[];
  reportDate: string;
  profile: UserProfile;
  floorFilter?: string;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
}

export const ShiftEndSummaryView: React.FC<ShiftEndSummaryViewProps> = ({
  lines,
  reportDate,
  profile,
  floorFilter = 'all',
  onSelectFloor,
  onNavigate
}) => {
  const [template, setTemplate] = useState<ReportTemplateConfig>(PREBUILT_REPORT_TEMPLATES[0]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBottleneckFilter, setSelectedBottleneckFilter] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sortField, setSortField] = useState<'lineNo' | 'efficiency' | 'wip' | 'achieved' | 'bottleneck'>(template.defaultSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(template.sortOrder);

  // Filter lines by selected report date
  const dayLines = useMemo(() => {
    const matched = lines.filter(l => l.date === reportDate);
    return matched.length > 0 ? matched : lines;
  }, [lines, reportDate]);

  // Factory Overall Metrics
  const factory = useMemo(() => calculateFactoryOverall(dayLines), [dayLines]);

  // Key Aggregations for Shift End
  const shiftEndAggregates = useMemo(() => {
    const totalLines = dayLines.length;
    const totalWip = dayLines.reduce((acc, l) => acc + (l.wip || 0), 0);
    const avgWipPerLine = totalLines > 0 ? Math.round(totalWip / totalLines) : 0;
    const totalTarget = dayLines.reduce((acc, l) => acc + (l.targetProd || 0), 0);
    const totalAchieved = dayLines.reduce((acc, l) => acc + (l.achievedProd || 0), 0);
    const outputVariance = totalAchieved - totalTarget;
    const attainmentPct = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 1000) / 10 : 0;

    const efficiencies = dayLines.map(l => l.efficiency || 0);
    const avgEfficiency = totalLines > 0
      ? Math.round((efficiencies.reduce((a, b) => a + b, 0) / totalLines) * 10) / 10
      : 0;

    // Compile active bottleneck stages and names
    const bottleneckMap = new Map<string, {
      stationName: string;
      count: number;
      lines: string[];
      avgCycleTime: number;
      avgTargetCT: number;
      totalCycleTime: number;
      totalTargetCT: number;
      maxCycleTime: number;
      worstLine: string;
    }>();

    let totalBottleneckedLines = 0;

    dayLines.forEach(l => {
      const station = l.bottleneck?.station?.trim();
      if (station && station !== 'None' && station !== '-' && station !== 'Normal Flow') {
        totalBottleneckedLines += 1;
        const ct = l.bottleneck?.cycleTime || 0;
        const tct = l.bottleneck?.targetCT || 0;

        if (!bottleneckMap.has(station)) {
          bottleneckMap.set(station, {
            stationName: station,
            count: 1,
            lines: [String(l.lineNo)],
            avgCycleTime: ct,
            avgTargetCT: tct,
            totalCycleTime: ct,
            totalTargetCT: tct,
            maxCycleTime: ct,
            worstLine: String(l.lineNo)
          });
        } else {
          const item = bottleneckMap.get(station)!;
          item.count += 1;
          item.lines.push(String(l.lineNo));
          item.totalCycleTime += ct;
          item.totalTargetCT += tct;
          item.avgCycleTime = Math.round((item.totalCycleTime / item.count) * 10) / 10;
          item.avgTargetCT = Math.round((item.totalTargetCT / item.count) * 10) / 10;
          if (ct > item.maxCycleTime) {
            item.maxCycleTime = ct;
            item.worstLine = String(l.lineNo);
          }
        }
      }
    });

    const bottleneckStages = Array.from(bottleneckMap.values()).sort((a, b) => b.count - a.count);

    return {
      totalLines,
      totalWip,
      avgWipPerLine,
      totalTarget,
      totalAchieved,
      outputVariance,
      attainmentPct,
      avgEfficiency,
      totalBottleneckedLines,
      bottleneckStages
    };
  }, [dayLines]);

  // Filtered & Sorted Line Entries
  const processedLines = useMemo(() => {
    let result = dayLines.filter(line => {
      // Floor filter
      if (floorFilter !== 'all' && line.floor && !line.floor.toLowerCase().includes(floorFilter.toLowerCase())) {
        return false;
      }

      // Bottleneck stage name filter
      if (selectedBottleneckFilter !== 'all') {
        const station = line.bottleneck?.station?.trim() || '';
        if (selectedBottleneckFilter === 'none') {
          if (station && station !== 'None' && station !== '-') return false;
        } else if (station !== selectedBottleneckFilter) {
          return false;
        }
      }

      // Search query (Line #, style, buyer, bottleneck name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchLine = String(line.lineNo).includes(q);
        const matchStyle = (line.style || '').toLowerCase().includes(q);
        const matchBuyer = (line.buyer || '').toLowerCase().includes(q);
        const matchBottleneck = (line.bottleneck?.station || '').toLowerCase().includes(q);
        const matchAction = (line.bottleneck?.action || '').toLowerCase().includes(q);
        return matchLine || matchStyle || matchBuyer || matchBottleneck || matchAction;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'lineNo') {
        const numA = parseInt(String(a.lineNo).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.lineNo).replace(/\D/g, ''), 10) || 0;
        comparison = numA - numB;
      } else if (sortField === 'efficiency') {
        comparison = (a.efficiency || 0) - (b.efficiency || 0);
      } else if (sortField === 'wip') {
        comparison = (a.wip || 0) - (b.wip || 0);
      } else if (sortField === 'achieved') {
        comparison = (a.achievedProd || 0) - (b.achievedProd || 0);
      } else if (sortField === 'bottleneck') {
        const stationA = a.bottleneck?.station || '';
        const stationB = b.bottleneck?.station || '';
        comparison = stationA.localeCompare(stationB);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [dayLines, floorFilter, selectedBottleneckFilter, searchQuery, sortField, sortDirection]);

  const handleTriggerPrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPdf(true);
    try {
      downloadShiftEndSummaryPDF({
        lines: dayLines,
        reportDate,
        profile,
        options: {
          includeSignatures: true,
          orientation: template.orientation
        }
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSortToggle = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar for Shift End Summary */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#176f78] to-[#0f4e55] text-white flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#17343a] dark:text-slate-100 font-display">
                  Shift End Summary Report Generator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#176f78]/15 text-[#176f78] dark:text-teal-400 font-mono">
                  MANAGEMENT DISPATCH
                </span>
              </div>
              <p className="text-xs text-[#527078] dark:text-slate-400">
                Compiles final WIP status, total achieved output, overall efficiency averages, and Bottle Neck Stage Names.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Formatted PDF, Print, Template Importer */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#252e3a] border border-[#176f78]/30 hover:border-[#176f78] text-[#176f78] dark:text-teal-300 transition-all text-xs font-bold cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title="Open Template Importer to load or configure custom report blueprints"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Template Importer</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#176f78]/10 font-mono">
              {template.name.split(' ')[0]}
            </span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-60"
            title="Download formatted management PDF with signatures and bottleneck matrix"
          >
            {isGeneratingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Formatted PDF</span>
          </button>

          <button
            type="button"
            onClick={handleTriggerPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f1eee6] dark:bg-[#252e3a] border border-[#d9d2c2] dark:border-[#384454] text-[#17343a] dark:text-slate-200 hover:bg-[#e7e1d5] transition-colors text-xs font-bold cursor-pointer"
            title="Open printable browser view with sign-off sheet"
          >
            <Printer className="w-3.5 h-3.5 text-[#176f78]" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* 2. PRINT-ONLY EXECUTIVE HEADER (Appears only on paper printout) */}
      <div className="hidden print:block border-b-2 border-[#176f78] pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              DEBONAIR GROUP • UNIT-02 INDUSTRIAL ENGINEERING
            </h1>
            <p className="text-xs text-slate-600 font-semibold uppercase">
              EXECUTIVE SHIFT END SUMMARY • FINAL WIP, OUTPUT &amp; BOTTLENECK AUDIT
            </p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-slate-900">DATE: {reportDate}</div>
            <div className="text-slate-500 font-mono">Shift: 08:00 AM – 05:00 PM • {dayLines.length} Lines</div>
          </div>
        </div>
      </div>

      {/* 3. Executive 4-KPI Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Achieved Output */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs relative overflow-hidden">
          <div className="w-1.5 h-full bg-[#176f78] absolute left-0 top-0" />
          <div className="flex items-center justify-between text-xs text-[#527078] dark:text-slate-400 font-bold uppercase tracking-wider pl-1.5">
            <span>Total Achieved Output</span>
            <Activity className="w-4 h-4 text-[#176f78]" />
          </div>
          <div className="mt-2 pl-1.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#17343a] dark:text-slate-100 font-mono tracking-tight">
              {shiftEndAggregates.totalAchieved.toLocaleString()} <span className="text-xs font-normal text-[#527078] font-sans">pcs</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={`font-bold font-mono ${
                shiftEndAggregates.outputVariance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {shiftEndAggregates.outputVariance >= 0 ? `+${shiftEndAggregates.outputVariance}` : shiftEndAggregates.outputVariance} pcs
              </span>
              <span className="text-[#527078] dark:text-slate-400">
                (Target: {shiftEndAggregates.totalTarget.toLocaleString()} pcs • {shiftEndAggregates.attainmentPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Overall Line Efficiency Average */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs relative overflow-hidden">
          <div className="w-1.5 h-full bg-blue-600 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-xs text-[#527078] dark:text-slate-400 font-bold uppercase tracking-wider pl-1.5">
            <span>Overall Line Efficiency</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 pl-1.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#17343a] dark:text-slate-100 font-mono tracking-tight">
              {shiftEndAggregates.avgEfficiency}%
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-[#527078] dark:text-slate-400">
                Factory Benchmark: <strong className="text-slate-800 dark:text-slate-200">80.0%</strong>
              </span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                shiftEndAggregates.avgEfficiency >= 75
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {shiftEndAggregates.avgEfficiency >= 75 ? 'Pacing OK' : 'Sub-Benchmark'}
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Final WIP Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs relative overflow-hidden">
          <div className="w-1.5 h-full bg-emerald-600 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-xs text-[#527078] dark:text-slate-400 font-bold uppercase tracking-wider pl-1.5">
            <span>Final WIP Status</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 pl-1.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-[#17343a] dark:text-slate-100 font-mono tracking-tight">
              {shiftEndAggregates.totalWip.toLocaleString()} <span className="text-xs font-normal text-[#527078] font-sans">pcs</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#527078] dark:text-slate-400">
              <span>Avg <strong>{shiftEndAggregates.avgWipPerLine} pcs</strong> / line</span>
              <span>•</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Active Floor Buffers</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Active Bottleneck Stages */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs relative overflow-hidden">
          <div className="w-1.5 h-full bg-rose-600 absolute left-0 top-0" />
          <div className="flex items-center justify-between text-xs text-[#527078] dark:text-slate-400 font-bold uppercase tracking-wider pl-1.5">
            <span>Bottle Neck Stages</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 pl-1.5">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tracking-tight">
              {shiftEndAggregates.totalBottleneckedLines} <span className="text-xs font-normal text-[#527078] font-sans">Lines Choked</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#527078] dark:text-slate-400">
              <span><strong>{shiftEndAggregates.bottleneckStages.length} Unique Stages</strong></span>
              <span>•</span>
              <span className="text-rose-600 font-bold">Action Mandated</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DEDICATED SECTION: BOTTLE NECK STAGE (NAMES) ANALYSIS */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-[#17343a] dark:text-slate-100 font-display">
                Bottle Neck Stage (Names) &amp; Floor Flow Analysis
              </h2>
            </div>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
              Click any bottleneck stage name to instantly filter the line matrix and view operator assignments.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#527078] dark:text-slate-400">
            <span className="font-bold text-rose-600">{shiftEndAggregates.bottleneckStages.length} Bottleneck Types</span>
            <span>•</span>
            <span>{shiftEndAggregates.totalBottleneckedLines} Lines Affected</span>
          </div>
        </div>

        {/* Bottleneck Stage Name Interactive Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedBottleneckFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedBottleneckFilter === 'all'
                ? 'bg-[#176f78] text-white shadow-xs'
                : 'bg-[#f1eee6] dark:bg-[#252e3a] text-[#17343a] dark:text-slate-300 hover:bg-[#e7e1d5]'
            }`}
          >
            All Stages ({dayLines.length} Lines)
          </button>

          {shiftEndAggregates.bottleneckStages.map(bs => {
            const isSelected = selectedBottleneckFilter === bs.stationName;
            return (
              <button
                key={bs.stationName}
                type="button"
                onClick={() => setSelectedBottleneckFilter(isSelected ? 'all' : bs.stationName)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-500/20'
                    : 'bg-white dark:bg-[#202732] border-rose-300 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                }`}
              >
                <span>{bs.stationName}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                }`}>
                  {bs.count} {bs.count === 1 ? 'line' : 'lines'}
                </span>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                  (avg {bs.avgCycleTime}s vs {bs.avgTargetCT}s)
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setSelectedBottleneckFilter('none')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedBottleneckFilter === 'none'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Normal Flow / No Bottleneck ({dayLines.length - shiftEndAggregates.totalBottleneckedLines})
          </button>
        </div>

        {/* Selected Bottleneck Quick Detail Card */}
        {selectedBottleneckFilter !== 'all' && selectedBottleneckFilter !== 'none' && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">
                Active Filter Focus:
              </span>
              <div className="font-bold text-rose-900 dark:text-rose-200 text-sm">
                Stage: &ldquo;{selectedBottleneckFilter}&rdquo;
              </div>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Lines Affected: {shiftEndAggregates.bottleneckStages.find(b => b.stationName === selectedBottleneckFilter)?.lines.join(', ')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBottleneckFilter('all')}
              className="text-xs font-bold text-rose-700 hover:underline cursor-pointer self-start sm:self-auto"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {/* 5. Comprehensive Shift End Line Table */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#17343a] dark:text-slate-100">
              Shift End Line-by-Line Telemetry Audit
            </h3>
            <p className="text-xs text-[#527078] dark:text-slate-400">
              Showing {processedLines.length} of {dayLines.length} production sewing lines
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search line, style, buyer, bottleneck..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 w-56 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl shadow-2xs">
          <table className="w-full text-xs text-left text-[#17343a] dark:text-slate-200">
            <thead className="bg-[#f1eee6] dark:bg-[#202732] text-[#176f78] dark:text-teal-400 font-bold border-b border-[#d9d2c2] dark:border-[#2e3846]">
              <tr>
                <th
                  onClick={() => handleSortToggle('lineNo')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-[#e7e1d5] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Line</span>
                    {sortField === 'lineNo' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-3 py-2.5">Floor</th>
                <th className="px-3 py-2.5">Buyer / Style</th>
                <th
                  onClick={() => handleSortToggle('achieved')}
                  className="px-3 py-2.5 text-right cursor-pointer hover:bg-[#e7e1d5] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Target / Achieved</span>
                    {sortField === 'achieved' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('efficiency')}
                  className="px-3 py-2.5 text-center cursor-pointer hover:bg-[#e7e1d5] transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Efficiency %</span>
                    {sortField === 'efficiency' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('wip')}
                  className="px-3 py-2.5 text-right cursor-pointer hover:bg-[#e7e1d5] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Final WIP Status</span>
                    {sortField === 'wip' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('bottleneck')}
                  className="px-3 py-2.5 cursor-pointer hover:bg-[#e7e1d5] transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-rose-700 dark:text-rose-400 font-extrabold">Bottle Neck Stage (Name)</span>
                    {sortField === 'bottleneck' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                  </div>
                </th>
                <th className="px-3 py-2.5">Cycle vs Target CT</th>
                <th className="px-3 py-2.5">Immediate IE Floor Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9d2c2] dark:divide-[#2e3846]">
              {processedLines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    No production lines match your current search or bottleneck filter.
                  </td>
                </tr>
              ) : (
                processedLines.map(line => {
                  const variance = (line.achievedProd || 0) - (line.targetProd || 0);
                  const isHighWip = (line.wip || 0) > template.wipWarningThreshold;
                  const hasBottleneck = line.bottleneck?.station && line.bottleneck.station !== 'None' && line.bottleneck.station !== '-';

                  return (
                    <tr
                      key={line.id}
                      className="hover:bg-[#fbfaf6] dark:hover:bg-[#202732] transition-colors"
                    >
                      {/* Line Number */}
                      <td className="px-3 py-2.5 font-bold font-mono text-[#17343a] dark:text-slate-100">
                        Line {line.lineNo}
                      </td>

                      {/* Floor */}
                      <td className="px-3 py-2.5 text-[#527078] dark:text-slate-400 whitespace-nowrap">
                        {line.floor || 'Floor 01'}
                      </td>

                      {/* Buyer / Style */}
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-[#17343a] dark:text-slate-200">
                          {line.buyer}
                        </div>
                        <div className="text-[11px] text-[#527078] dark:text-slate-400 font-mono">
                          {line.style}
                        </div>
                      </td>

                      {/* Target / Achieved Output */}
                      <td className="px-3 py-2.5 text-right font-mono">
                        <div className="font-extrabold text-[#17343a] dark:text-slate-100">
                          {line.achievedProd || 0} <span className="text-[10px] font-normal text-slate-500">/ {line.targetProd || 0}</span>
                        </div>
                        <div className={`text-[10px] font-bold ${variance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {variance >= 0 ? `+${variance}` : variance} pcs
                        </div>
                      </td>

                      {/* Overall Line Efficiency */}
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                          (line.efficiency || 0) >= 75
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : (line.efficiency || 0) >= 60
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {line.efficiency || 0}%
                        </span>
                      </td>

                      {/* Final WIP Status */}
                      <td className="px-3 py-2.5 text-right font-mono">
                        <span className={`font-extrabold text-xs ${isHighWip ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {line.wip || 0} pcs
                        </span>
                        {isHighWip && (
                          <span className="block text-[9px] font-bold uppercase text-amber-600">
                            High Buffer
                          </span>
                        )}
                      </td>

                      {/* Bottle Neck Stage (Name) */}
                      <td className="px-3 py-2.5">
                        {hasBottleneck ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                            <span className="font-extrabold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                              {line.bottleneck?.station}
                            </span>
                          </div>
                        ) : (
                          <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Normal Flow</span>
                          </span>
                        )}
                      </td>

                      {/* Cycle Time vs Target CT */}
                      <td className="px-3 py-2.5 font-mono text-[11px]">
                        {line.bottleneck?.cycleTime ? (
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-rose-700 dark:text-rose-400">
                              {line.bottleneck.cycleTime}s
                            </span>
                            <span className="text-slate-400">vs</span>
                            <span className="text-slate-600 dark:text-slate-300">
                              {line.bottleneck.targetCT || 0}s
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Immediate IE Floor Action */}
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        {line.bottleneck?.action || (
                          <span className="text-slate-400 italic">Operating smoothly</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Formal Factory Sign-off Section (Formatted for Print & Executive Management) */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 shadow-2xs space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-2">
          Factory Management Verification &amp; Approval Sign-off
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
            <div className="font-bold text-xs text-[#17343a] dark:text-slate-200">
              Shift Supervisor / Line IE Lead
            </div>
            <div className="text-[11px] text-[#527078] dark:text-slate-400">
              {profile.name} ({profile.jobTitle || 'IE'})
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Date: {reportDate}</div>
          </div>

          <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
            <div className="font-bold text-xs text-[#17343a] dark:text-slate-200">
              Industrial Engineering Manager
            </div>
            <div className="text-[11px] text-[#527078] dark:text-slate-400">
              Debonair Unit-02 IE Department
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Signature: __________________</div>
          </div>

          <div className="border-t-2 border-slate-400 pt-2 space-y-0.5">
            <div className="font-bold text-xs text-[#17343a] dark:text-slate-200">
              General Manager / Plant Head
            </div>
            <div className="text-[11px] text-[#527078] dark:text-slate-400">
              Executive Plant Approval
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Signature: __________________</div>
          </div>
        </div>
      </div>

      {/* 7. Template Importer Modal */}
      {isTemplateModalOpen && (
        <ReportTemplateImporterModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          activeTemplate={template}
          onApplyTemplate={(newTemplate) => {
            setTemplate(newTemplate);
            setSortField(newTemplate.defaultSortBy);
            setSortDirection(newTemplate.sortOrder);
          }}
        />
      )}
    </div>
  );
};
