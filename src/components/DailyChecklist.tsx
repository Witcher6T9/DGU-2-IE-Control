/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * IE Daily Activity Tracking Engine (Based on IE ORG Hierarchy & Line IE Performance Accountability)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  CheckCheck,
  RotateCcw,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ChevronDown,
  Sparkles,
  X,
  CalendarDays,
  Check,
  Layers,
  Zap,
  ArrowRight,
  Users,
  Building2,
  Filter,
  Search,
  Award,
  TrendingUp,
  Activity,
  AlertTriangle,
  UserCheck,
  FileCheck,
  LayoutGrid,
  ListOrdered
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChecklistMap, ChecklistStatus, UserProfile, RoleTier, LineEntry } from '../types';
import { CHECKLIST_TASK_COUNT, IE_DAILY_TASKS, normalizeChecklistStatuses, ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import { formatDateLabel, getOffsetDateStr, isFridayHoliday } from '../utils';
import { getLineIEMeta, LineIEMeta } from '../utils/ieOrgMapping';
import { normalizeLineNo } from '../utils/rbac';
import { DEBONAIR_IE_ORG_CHART } from '../data/debonairOrgData';

interface DailyChecklistProps {
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateTaskStatus: (date: string, taskIndex: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist: (date: string, statuses: ChecklistStatus[]) => void;
  profile: UserProfile;
  roleTiers?: RoleTier[];
  onNavigate?: (tab: string, lineNo?: string) => void;
  lines?: LineEntry[];
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
}

export type IEOrgWingFilter = 'all' | 'blue' | 'green';
export type IEOrgViewMode = 'linewise' | 'matrix';

/**
 * Deterministically generates realistic demo statuses for any line if not yet saved in database.
 * Insures lines on past/preset dates show authentic, diverse Line IE execution levels.
 */
function generateDeterministicLineStatuses(date: string, lineNo: string): ChecklistStatus[] {
  const norm = normalizeLineNo(lineNo);
  const lineNum = parseInt(norm.replace(/[^0-9]/g, ''), 10) || 1;
  
  // Seed hash based on date and line
  let hash = 0;
  const seed = `${date}_line_${norm}_debonair_ie`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const pseudo = (idx: number) => {
    const val = Math.sin(Math.abs(hash) + idx * 4391) * 10000;
    return val - Math.floor(val);
  };

  // Higher completion for Lines 1-6 (Incharge 1) and 18-23 (Incharge 4)
  const targetCompletedCount = lineNum % 5 === 0 
    ? 13 
    : lineNum % 3 === 0 
    ? 11 
    : lineNum % 2 === 0 
    ? 12 
    : 10;

  return Array.from({ length: CHECKLIST_TASK_COUNT }, (_, idx) => {
    if (idx < targetCompletedCount) return 'yes';
    const rand = pseudo(idx);
    if (rand > 0.6) return 'pending';
    return 'yes';
  });
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  checklists,
  selectedDate,
  onSelectDate,
  onUpdateTaskStatus,
  onBatchUpdateChecklist,
  profile,
  roleTiers,
  onNavigate,
  lines = [],
  selectedLineNo,
  onSelectLineNo
}) => {
  // 1. Linewise Selection & IE Org State
  const [activeLineNo, setActiveLineNo] = useState<string>(() => {
    if (selectedLineNo) return normalizeLineNo(selectedLineNo);
    if (profile?.assignedLines && profile.assignedLines.length > 0) {
      return normalizeLineNo(profile.assignedLines[0]);
    }
    return '01';
  });

  const [activeWingFilter, setActiveWingFilter] = useState<IEOrgWingFilter>('all');
  const [activeInchargeFilter, setActiveInchargeFilter] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<IEOrgViewMode>('linewise');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep activeLineNo in sync if prop changes
  useEffect(() => {
    if (selectedLineNo && normalizeLineNo(selectedLineNo) !== activeLineNo) {
      setActiveLineNo(normalizeLineNo(selectedLineNo));
    }
  }, [selectedLineNo]);

  const handleSelectLine = (lNo: string) => {
    const norm = normalizeLineNo(lNo);
    setActiveLineNo(norm);
    if (onSelectLineNo) onSelectLineNo(norm);
  };

  // 2. Linewise Checklist Status Resolver
  const getLineChecklistKey = (date: string, lNo: string) => {
    return `${date}__line_${normalizeLineNo(lNo)}`;
  };

  const getStatusesForLine = (lNo: string, date: string): ChecklistStatus[] => {
    const norm = normalizeLineNo(lNo);
    const lineKey = getLineChecklistKey(date, norm);

    if (checklists[lineKey] && checklists[lineKey].length > 0) {
      return normalizeChecklistStatuses(checklists[lineKey]);
    }

    // Backwards compatibility for Line 01 or base date key
    if (norm === '01' && checklists[date] && checklists[date].length > 0) {
      return normalizeChecklistStatuses(checklists[date]);
    }

    // Default simulation for rich experience
    return generateDeterministicLineStatuses(date, norm);
  };

  const currentStatuses = useMemo(() => {
    return getStatusesForLine(activeLineNo, selectedDate);
  }, [activeLineNo, selectedDate, checklists]);

  // Current active Line IE Meta from IE ORG Chart
  const activeLineMeta = useMemo(() => {
    return getLineIEMeta(activeLineNo);
  }, [activeLineNo]);

  // Match corresponding line entry if present
  const activeLineEntry = useMemo(() => {
    return lines.find(l => normalizeLineNo(l.lineNo) === activeLineNo);
  }, [lines, activeLineNo]);

  // 3. Task Notes state (per active line)
  const [taskNotes, setTaskNotes] = useState<Record<string, Record<number, string>>>({
    '01': {
      0: 'Ramp-up milestones and operator loading plan aligned with supervisor on Floor 01.',
      1: '1st vs 2nd day balance graph logged; cycle variance reduced to 2.8s.',
      2: '70% production target achieved on Line 01 during shift hour 5.',
      3: '4th day graph completed; collar attach bottleneck station balanced with float operator.',
      4: 'Day 6-7 estimate prepared with manpower and efficiency evidence (87.2%).',
      5: 'Sleeve hem attach station analyzed; pneumatic jig countermeasure applied.',
      6: 'Next style tech pack and trims confirmed 10 days ahead for upcoming jacket style.',
      7: 'T.R sample passed initial audit; 1 open action tracked on seam puckering.',
      8: 'Shift A floor status logged across all stations in Padma Floor.',
      9: 'Critical station operators tracked; helper assigned to bottleneck station #14.',
      10: 'Pneumatic thread wiper jig installed; saved 3.2s per garment piece.',
      11: 'Shift running efficiency logged at 87.4% against 85% target.',
      12: 'Tomorrow line target forecast calculated based on SMV and active line balance.'
    }
  });

  const activeLineNotes = taskNotes[activeLineNo] || {};

  const handleNoteChange = (idx: number, text: string) => {
    setTaskNotes(prev => ({
      ...prev,
      [activeLineNo]: {
        ...(prev[activeLineNo] || {}),
        [idx]: text
      }
    }));
  };

  // 4. Update task handler for specific line
  const handleUpdateTask = (taskIndex: number, status: ChecklistStatus) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    const lineKey = getLineChecklistKey(selectedDate, activeLineNo);
    onUpdateTaskStatus(lineKey, taskIndex, status);

    // Keep global/Line 01 key in sync
    if (activeLineNo === '01') {
      onUpdateTaskStatus(selectedDate, taskIndex, status);
    }
  };

  const handleMarkAllDone = () => {
    const lineKey = getLineChecklistKey(selectedDate, activeLineNo);
    const doneList = Array(CHECKLIST_TASK_COUNT).fill('yes') as ChecklistStatus[];
    onBatchUpdateChecklist(lineKey, doneList);
    if (activeLineNo === '01') {
      onBatchUpdateChecklist(selectedDate, doneList);
    }
  };

  const handleResetAll = () => {
    const lineKey = getLineChecklistKey(selectedDate, activeLineNo);
    const pendingList = Array(CHECKLIST_TASK_COUNT).fill('pending') as ChecklistStatus[];
    onBatchUpdateChecklist(lineKey, pendingList);
    if (activeLineNo === '01') {
      onBatchUpdateChecklist(selectedDate, pendingList);
    }
  };

  // 5. Build Comprehensive IE ORG Roster across all 34 Sewing Lines
  const allOrgLines = useMemo(() => {
    // Generate lines 1 to 34
    const list: Array<{
      lineNo: string;
      cleanNumber: number;
      meta: LineIEMeta;
      lineEntry?: LineEntry;
      statuses: ChecklistStatus[];
      completedCount: number;
      pendingCount: number;
      noCount: number;
      completionPct: number;
      performanceTier: 'Exemplary' | 'High' | 'Moderate' | 'Critical';
    }> = [];

    for (let i = 1; i <= 34; i++) {
      const lineNoStr = String(i).padStart(2, '0');
      const meta = getLineIEMeta(lineNoStr);
      const lineEntry = lines.find(l => normalizeLineNo(l.lineNo) === lineNoStr);
      const statuses = getStatusesForLine(lineNoStr, selectedDate);
      const completedCount = statuses.filter(s => s === 'yes').length;
      const pendingCount = statuses.filter(s => s === 'pending').length;
      const noCount = statuses.filter(s => s === 'no').length;
      const completionPct = Math.round((completedCount / CHECKLIST_TASK_COUNT) * 100);

      let performanceTier: 'Exemplary' | 'High' | 'Moderate' | 'Critical' = 'Critical';
      if (completionPct === 100) performanceTier = 'Exemplary';
      else if (completionPct >= 80) performanceTier = 'High';
      else if (completionPct >= 50) performanceTier = 'Moderate';

      list.push({
        lineNo: lineNoStr,
        cleanNumber: i,
        meta,
        lineEntry,
        statuses,
        completedCount,
        pendingCount,
        noCount,
        completionPct,
        performanceTier
      });
    }

    return list;
  }, [lines, selectedDate, checklists]);

  // Filtered Roster based on Wing, Incharge, and Search
  const filteredOrgLines = useMemo(() => {
    return allOrgLines.filter(item => {
      // Wing filter
      if (activeWingFilter === 'blue' && item.meta.wingSection !== 'blue') return false;
      if (activeWingFilter === 'green' && item.meta.wingSection !== 'green') return false;

      // Incharge filter
      if (activeInchargeFilter !== 'all' && item.meta.inchargeCode !== activeInchargeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesLine = item.lineNo.includes(q) || `line ${item.lineNo}`.includes(q);
        const matchesIE = item.meta.lineIEName.toLowerCase().includes(q) || item.meta.lineIECode.toLowerCase().includes(q);
        const matchesIncharge = item.meta.inchargeName.toLowerCase().includes(q) || item.meta.inchargeCode.toLowerCase().includes(q);
        const matchesFloor = item.meta.floorName.toLowerCase().includes(q);
        const matchesStyle = item.lineEntry?.style?.toLowerCase().includes(q) || false;
        if (!matchesLine && !matchesIE && !matchesIncharge && !matchesFloor && !matchesStyle) return false;
      }

      return true;
    });
  }, [allOrgLines, activeWingFilter, activeInchargeFilter, searchQuery]);

  // Org-wide Aggregated Statistics
  const orgStats = useMemo(() => {
    const totalLines = allOrgLines.length;
    const totalTasksDone = allOrgLines.reduce((acc, l) => acc + l.completedCount, 0);
    const totalPossibleTasks = totalLines * CHECKLIST_TASK_COUNT;
    const overallCompliancePct = Math.round((totalTasksDone / totalPossibleTasks) * 100);

    const blueLines = allOrgLines.filter(l => l.meta.wingSection === 'blue');
    const greenLines = allOrgLines.filter(l => l.meta.wingSection === 'green');

    const blueDone = blueLines.reduce((acc, l) => acc + l.completedCount, 0);
    const bluePossible = blueLines.length * CHECKLIST_TASK_COUNT;
    const blueCompliancePct = bluePossible > 0 ? Math.round((blueDone / bluePossible) * 100) : 0;

    const greenDone = greenLines.reduce((acc, l) => acc + l.completedCount, 0);
    const greenPossible = greenLines.length * CHECKLIST_TASK_COUNT;
    const greenCompliancePct = greenPossible > 0 ? Math.round((greenDone / greenPossible) * 100) : 0;

    const exemplaryCount = allOrgLines.filter(l => l.completionPct === 100).length;
    const highCount = allOrgLines.filter(l => l.completionPct >= 80 && l.completionPct < 100).length;
    const needsAttentionCount = allOrgLines.filter(l => l.completionPct < 80).length;

    return {
      totalLines,
      overallCompliancePct,
      blueCompliancePct,
      greenCompliancePct,
      exemplaryCount,
      highCount,
      needsAttentionCount
    };
  }, [allOrgLines]);

  // Current Active Line Statistics
  const activeLineCompleted = currentStatuses.filter(s => s === 'yes').length;
  const activeLinePending = currentStatuses.filter(s => s === 'pending').length;
  const activeLineNoCount = currentStatuses.filter(s => s === 'no').length;
  const activeLineCompletionPct = Math.round((activeLineCompleted / CHECKLIST_TASK_COUNT) * 100);

  // Date utilities & Popover logic
  const isFriday = isFridayHoliday(selectedDate);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const datePickerPopoverRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const datePresets = useMemo(() => {
    const presets = [
      { date: '2026-09-21', label: '21-Sep (Day 3)', phase: 'Active Run', isStandard: true },
      { date: '2026-09-20', label: '20-Sep (Day 2)', phase: 'Ramp-up Target', isStandard: true },
      { date: '2026-09-19', label: '19-Sep (Day 1)', phase: 'Initial Loading', isStandard: true },
      { date: '2026-09-17', label: '17-Sep (Regular)', phase: 'Regular Audit', isStandard: true },
    ];
    if (!presets.some(p => p.date === todayStr)) {
      presets.unshift({ date: todayStr, label: 'Today (Live)', phase: 'Live Operations', isStandard: false });
    }
    return presets;
  }, [todayStr]);

  const formattedDayOfWeek = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    } catch {
      return '';
    }
  }, [selectedDate]);

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isDateMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (datePickerPopoverRef.current && !datePickerPopoverRef.current.contains(e.target as Node)) {
        setIsDateMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDateMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDateMenuOpen]);

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    onSelectDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    onSelectDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & OPERATIONAL SCOPE                                        */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#176f78] text-white">
                Debonair IE ORG Governance
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#dceceb] text-[#176f78] text-[10px] font-bold uppercase">
                {CHECKLIST_TASK_COUNT} Linewise IE Everyday Activities
              </span>
              <span className="text-[11px] text-[#527078] font-mono-numbers">
                34 Sewing Lines • 18 Line IEs • 6 Incharges • 2 Wings
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold uppercase text-[#17343a] tracking-tight">
              IE Daily Activity Tracking
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1 max-w-3xl leading-relaxed">
              Linewise everyday activity execution &amp; operational compliance matrix to insure each individual 
              <strong> Line IE&apos;s Performance</strong> across Section Wings A &amp; B under Debonair IE Org leadership.
            </p>
          </div>

          {/* Right Controls: View Mode Switcher + Date Navigation */}
          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {/* View Mode Switcher: Linewise Focus vs Full IE Org Matrix */}
            <div className="flex items-center bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2] shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveViewMode('linewise')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'linewise'
                    ? 'bg-white text-[#176f78] shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Focused view for selected Line IE and everyday 13 tasks"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Linewise Hub</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveViewMode('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeViewMode === 'matrix'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Full executive performance matrix across all 34 Line IEs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>IE Org Matrix</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                  activeViewMode === 'matrix' ? 'bg-white/20 text-white' : 'bg-[#e0dbcd] text-[#527078]'
                }`}>
                  34
                </span>
              </button>
            </div>

            {/* Custom Date Selector Bar with Rich Popover */}
            <div
              id="checklist-custom-date-selector"
              ref={datePickerPopoverRef}
              className="relative flex items-center gap-1 bg-[#f1eee6] p-1.5 rounded-2xl border border-[#d9d2c2] shadow-xs"
            >
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] active:bg-[#ded6c7] text-[#17343a] transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsDateMenuOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white hover:bg-[#fbfaf6] text-[#17343a] border border-[#d9d2c2] shadow-2xs transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-[#dceceb] flex items-center justify-center text-[#176f78] shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[10px] font-black uppercase text-[#176f78] bg-[#eef7f6] px-1 py-0.5 rounded">
                      {formattedDayOfWeek}
                    </span>
                    <span className="text-xs font-bold font-mono-numbers text-[#17343a]">
                      {formattedDisplayDate}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#527078] font-mono-numbers mt-0.5">
                    Org Compliance: {orgStats.overallCompliancePct}%
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 shrink-0 ${isDateMenuOpen ? 'rotate-180 text-[#176f78]' : ''}`} />
              </button>

              {/* Native Calendar Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    try {
                      nativeDateInputRef.current?.showPicker?.();
                    } catch {
                      nativeDateInputRef.current?.focus();
                    }
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] text-[#176f78] transition-all cursor-pointer"
                  title="Open Native Calendar Picker"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
                <input
                  ref={nativeDateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={e => {
                    if (e.target.value) {
                      onSelectDate(e.target.value);
                      setIsDateMenuOpen(false);
                    }
                  }}
                  className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                  tabIndex={-1}
                  aria-hidden="true"
                />
              </div>

              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] active:bg-[#ded6c7] text-[#17343a] transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Custom Date Popover Dropdown */}
              <AnimatePresence>
                {isDateMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full mt-2 right-0 z-50 w-[340px] max-w-[95vw] rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl p-4 text-[#17343a] space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#e7e1d5]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#176f78]" />
                        <span className="text-xs font-black uppercase tracking-wider text-[#17343a]">
                          Select Audit Date
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsDateMenuOpen(false)}
                        className="p-1 rounded-lg hover:bg-[#e7e1d5] text-[#527078] hover:text-[#17343a] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="bg-[#f1eee6] p-2.5 rounded-xl border border-[#d9d2c2] space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#527078] flex items-center justify-between">
                        <span>Custom Date Input</span>
                        <span className="text-[#176f78] font-mono-numbers">{selectedDate}</span>
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={e => {
                          if (e.target.value) {
                            onSelectDate(e.target.value);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] px-0.5">
                        Historical Shift Records
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {datePresets.map(preset => {
                          const isCurrent = preset.date === selectedDate;
                          return (
                            <button
                              key={preset.date}
                              type="button"
                              onClick={() => {
                                onSelectDate(preset.date);
                                setIsDateMenuOpen(false);
                              }}
                              className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                                isCurrent
                                  ? 'bg-[#dceceb] border-[#176f78] text-[#17343a] font-bold'
                                  : 'bg-white hover:bg-[#f1eee6] border-[#e7e1d5] text-[#527078]'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? 'bg-[#176f78]' : 'bg-[#d9d2c2]'}`} />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#17343a] truncate">
                                    {preset.label}
                                  </div>
                                  <div className="text-[10px] text-[#527078] truncate">
                                    {preset.phase}
                                  </div>
                                </div>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-[#176f78]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#e7e1d5] flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(todayStr);
                          setIsDateMenuOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] font-bold text-[11px] cursor-pointer"
                      >
                        Reset to Today
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(yesterdayStr);
                          setIsDateMenuOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#527078] font-bold text-[11px] cursor-pointer"
                      >
                        Yesterday
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDateMenuOpen(false)}
                        className="px-3 py-1 rounded-lg bg-[#176f78] text-white font-bold text-[11px] cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. IE ORG EXECUTIVE COMPLIANCE METRIC STRIP                              */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-[#e7e1d5]">
          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] block">Overall Org Compliance</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-[#176f78]">
                {orgStats.overallCompliancePct}%
              </span>
              <span className="text-[11px] text-[#527078]">avg</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-blue-600 block">Section Wing A (Blue)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-blue-700">
                {orgStats.blueCompliancePct}%
              </span>
              <span className="text-[11px] text-[#527078]">17 Lines</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Section Wing B (Green)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-emerald-700">
                {orgStats.greenCompliancePct}%
              </span>
              <span className="text-[11px] text-[#527078]">17 Lines</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] block">100% Exemplary Lines</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-emerald-600">
                {orgStats.exemplaryCount}
              </span>
              <span className="text-[11px] text-[#527078]">/ 34 IEs</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] block">80-99% Compliant</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-amber-600">
                {orgStats.highCount}
              </span>
              <span className="text-[11px] text-[#527078]">IEs</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-[#d9d2c2] shadow-2xs">
            <span className="text-[10px] font-bold uppercase text-[#527078] block">Follow-up Needed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold font-mono-numbers text-rose-600">
                {orgStats.needsAttentionCount}
              </span>
              <span className="text-[11px] text-[#527078]">Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Friday Weekly Holiday Protocol Banner */}
      {isFriday && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/95 p-4 sm:p-5 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-200/90 text-amber-900 flex items-center justify-center shrink-0 text-xl font-black shadow-2xs">
              🌴
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wide text-amber-950 flex items-center gap-2 flex-wrap">
                <span>Official Factory Weekly Holiday (Friday)</span>
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[9px] font-extrabold uppercase">
                  Plant Offline
                </span>
              </div>
              <p className="text-xs text-amber-900/85 mt-0.5 max-w-2xl">
                Friday is the designated weekly rest day for DGU2. Standard line production is halted. Verification checklist is optional for special overtime operations, mechanical line overhauls, or pilot trial runs.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-amber-200/80 text-amber-950 shrink-0 self-start sm:self-center border border-amber-300/80">
            Weekly Rest Day
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. IE ORG FILTER BAR: WINGS, INCHARGES & SEARCH                           */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#d9d2c2] p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Wing Tabs */}
          <div className="flex items-center gap-1.5 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2] overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveWingFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeWingFilter === 'all'
                  ? 'bg-white text-[#17343a] shadow-xs'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              All IE Org (34 Lines)
            </button>

            <button
              type="button"
              onClick={() => setActiveWingFilter('blue')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeWingFilter === 'blue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 hover:bg-white/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300" />
              <span>Section Wing A (Lines 01–17)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWingFilter('green')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeWingFilter === 'green'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 hover:bg-white/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300" />
              <span>Section Wing B (Lines 18–34)</span>
            </button>
          </div>

          {/* Incharge Filter & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#527078] hidden sm:inline">Incharge:</span>
              <select
                value={activeInchargeFilter}
                onChange={e => setActiveInchargeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78] cursor-pointer"
              >
                <option value="all">All 6 Incharges</option>
                <option value="INC-01">INC-01: Md. Rafiqul Islam (Lines 01–06 • Floor 01)</option>
                <option value="INC-02">INC-02: Kazi Nazmul (Lines 07–12 • Floor 02)</option>
                <option value="INC-03">INC-03: Sharif Hossain (Lines 13–17 • Floor 03)</option>
                <option value="INC-04">INC-04: Arifur Rahman (Lines 18–23 • Floor 04)</option>
                <option value="INC-05">INC-05: Kamrul Hasan (Lines 24–29 • Floor 05)</option>
                <option value="INC-06">INC-06: Tariqul Islam (Lines 30–34 • Floor 06)</option>
              </select>
            </div>

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#527078]" />
              <input
                type="text"
                placeholder="Search Line or Line IE..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Horizontal Carousel of Lines matching filter */}
        <div className="pt-2 border-t border-[#f1eee6]">
          <div className="flex items-center justify-between text-[11px] text-[#527078] mb-1.5 font-bold uppercase tracking-wider">
            <span>Select Line to Inspect / Log Daily Activities ({filteredOrgLines.length} Lines):</span>
            <span className="text-[#176f78] font-mono-numbers">Active: Line {activeLineNo} ({activeLineMeta.lineIEName})</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {filteredOrgLines.map(item => {
              const isSelected = item.lineNo === activeLineNo;
              const isDone = item.completionPct === 100;
              const isPartial = item.completionPct > 0 && item.completionPct < 100;

              return (
                <button
                  key={item.lineNo}
                  type="button"
                  onClick={() => {
                    handleSelectLine(item.lineNo);
                    if (activeViewMode === 'matrix') {
                      setActiveViewMode('linewise');
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#176f78] border-[#176f78] text-white shadow-xs ring-2 ring-[#176f78]/30 scale-102'
                      : 'bg-[#fbfaf6] hover:bg-[#f1eee6] border-[#d9d2c2] text-[#17343a]'
                  }`}
                >
                  <span className="font-mono-numbers font-black">L-{item.lineNo}</span>
                  <span className={`text-[11px] truncate max-w-[90px] ${isSelected ? 'text-white/90' : 'text-[#527078]'}`}>
                    {item.meta.lineIEName.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] font-mono-numbers font-extrabold px-1.5 py-0.2 rounded ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : isPartial
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {item.completedCount}/{CHECKLIST_TASK_COUNT}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VIEW A: LINEWISE ACTIVITY HUB (13 Tasks for Selected Line IE)          */}
      {/* ========================================================================= */}
      {activeViewMode === 'linewise' && (
        <div className="space-y-5">
          {/* Active Line IE Personnel & Accountability Card */}
          <div className="rounded-3xl border border-[#b2d8d8] bg-gradient-to-br from-[#f7fcfc] to-[#eef7f6] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Line IE Profile & Org Hierarchy */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#176f78] text-white flex flex-col items-center justify-center font-black shadow-md shrink-0 border-2 border-white">
                  <span className="text-[10px] tracking-wider uppercase opacity-80">LINE</span>
                  <span className="text-xl leading-none font-mono-numbers">{activeLineNo}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-extrabold text-[#17343a]">
                      {activeLineMeta.lineIEName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-bold font-mono">
                      {activeLineMeta.lineIECode} • Line IE
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      activeLineMeta.wingSection === 'blue'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {activeLineMeta.wing}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 text-xs text-[#527078] mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-[#17343a]">
                      <Building2 className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>{activeLineMeta.floorLabel}</span>
                    </span>
                    <span>•</span>
                    <span>
                      Incharge: <strong className="text-[#17343a]">{activeLineMeta.inchargeName}</strong> ({activeLineMeta.inchargeCode})
                    </span>
                    <span>•</span>
                    <span>
                      Manager: <strong className="text-[#17343a]">{activeLineMeta.managerName}</strong>
                    </span>
                  </div>

                  {activeLineEntry && (
                    <div className="flex items-center gap-2 text-xs font-mono text-[#527078] mt-1.5 flex-wrap">
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[#b2d8d8]">
                        Style: <strong className="text-[#17343a]">{activeLineEntry.style || 'Standard Run'}</strong>
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[#b2d8d8]">
                        SMV: <strong className="text-[#17343a]">{activeLineEntry.smv || 14.5}m</strong>
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[#b2d8d8]">
                        Output: <strong className="text-[#17343a]">{activeLineEntry.achievedProd || 0} / {activeLineEntry.targetProd || 0} pcs</strong>
                      </span>
                      <span className="bg-white/80 px-2 py-0.5 rounded border border-[#b2d8d8]">
                        Efficiency: <strong className="text-[#176f78]">{activeLineEntry.efficiency || 0}%</strong>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line IE Performance Compliance Gauge */}
              <div className="bg-white p-4 rounded-2xl border border-[#b2d8d8] shadow-xs flex items-center justify-between sm:justify-start gap-4 min-w-[280px]">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold uppercase text-[#527078] text-[10px]">
                      Line IE Compliance
                    </span>
                    <span className="font-black font-mono-numbers text-sm text-[#176f78]">
                      {activeLineCompletionPct}%
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-[#eef7f6] overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${(activeLineCompleted / CHECKLIST_TASK_COUNT) * 100}%` }}
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-300"
                      style={{ width: `${(activeLinePending / CHECKLIST_TASK_COUNT) * 100}%` }}
                    />
                    <div
                      className="h-full bg-rose-400 transition-all duration-300"
                      style={{ width: `${(activeLineNoCount / CHECKLIST_TASK_COUNT) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono-numbers mt-1.5 text-[#527078]">
                    <span className="text-emerald-700 font-bold">{activeLineCompleted} Done</span>
                    <span className="text-amber-700 font-bold">{activeLinePending} Pending</span>
                    <span className="text-rose-700 font-bold">{activeLineNoCount} Not Met</span>
                  </div>
                </div>

                <div className="border-l border-[#d9d2c2] pl-3 flex flex-col items-center justify-center shrink-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    activeLineCompletionPct === 100
                      ? 'bg-emerald-600'
                      : activeLineCompletionPct >= 80
                      ? 'bg-teal-600'
                      : activeLineCompletionPct >= 50
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}>
                    {activeLineCompletionPct === 100 ? <Award className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                  </div>
                  <span className="text-[9px] font-extrabold uppercase mt-1 text-[#17343a]">
                    {activeLineCompletionPct === 100
                      ? 'Exemplary'
                      : activeLineCompletionPct >= 80
                      ? 'Compliant'
                      : activeLineCompletionPct >= 50
                      ? 'Partial'
                      : 'Low'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for this line */}
            <div className="mt-4 pt-3 border-t border-[#b2d8d8]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <span className="text-xs text-[#527078]">
                Everyday operations logged for <strong>Line {activeLineNo}</strong> by Line IE <strong>{activeLineMeta.lineIEName}</strong>.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllDone}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#12555c] font-bold transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark All 13 Tasks Done</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#d9d2c2] text-[#527078] hover:bg-[#f1eee6] font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Line</span>
                </button>
              </div>
            </div>
          </div>

          {/* 13 Line IE Everyday Tasks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IE_DAILY_TASKS.map((task, idx) => {
              const status = currentStatuses[idx] || 'pending';

              return (
                <div
                  key={task.id}
                  className={`rounded-2xl border p-4 transition-all duration-200 checklist-task ${
                    status === 'yes'
                      ? 'border-emerald-200 bg-[#fbfaf6] shadow-2xs'
                      : status === 'pending'
                      ? 'border-amber-200 bg-[#fbfaf6]'
                      : 'border-rose-200 bg-[#fbfaf6]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#f1eee6] border border-[#d9d2c2] text-[#176f78] font-bold font-mono-numbers text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {String(task.id).padStart(2, '0')}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            task.category === 'SL Control'
                              ? 'bg-[#fff2cf] text-[#946200]'
                              : 'bg-[#f1eee6] text-[#527078]'
                          }`}>
                            {task.category}
                          </span>
                          <span className="text-[10px] text-[#527078] font-mono">
                            Line {activeLineNo} • {activeLineMeta.lineIEName.split(' ')[0]}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-[#17343a] mt-0.5 leading-snug">
                          {task.title}
                        </h3>
                        <p className="text-xs text-[#527078] mt-1 leading-relaxed">
                          {task.hint}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Buttons with 44px mobile touch targets */}
                    <div className="flex items-center gap-1 shrink-0 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]">
                      <button
                        onClick={() => handleUpdateTask(idx, 'yes')}
                        title="Mark Done"
                        aria-label="Mark task Done"
                        className={`w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                          status === 'yes'
                            ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-600/30'
                            : 'text-slate-400 hover:text-emerald-700 hover:bg-white/60'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleUpdateTask(idx, 'pending')}
                        title="Mark Pending"
                        aria-label="Mark task Pending"
                        className={`w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                          status === 'pending'
                            ? 'bg-amber-500 text-white shadow-xs font-bold ring-2 ring-amber-500/30'
                            : 'text-slate-400 hover:text-amber-700 hover:bg-white/60'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleUpdateTask(idx, 'no')}
                        title="Mark Not Met / Action Needed"
                        aria-label="Mark task Not Met"
                        className={`w-11 h-11 sm:w-10 sm:h-10 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                          status === 'no'
                            ? 'bg-rose-500 text-white shadow-xs font-bold ring-2 ring-rose-500/30'
                            : 'text-slate-400 hover:text-rose-700 hover:bg-white/60'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Line IE Observation Note */}
                  <div className="mt-3 pt-3 border-t border-[#e7e1d5]/80">
                    <input
                      type="text"
                      placeholder={`Record Line ${activeLineNo} IE observation or specific action notes...`}
                      value={activeLineNotes[idx] || ''}
                      onChange={e => handleNoteChange(idx, e.target.value)}
                      className="w-full text-xs px-3 py-1.5 rounded-xl bg-[#f1eee6]/60 border border-[#e7e1d5] text-[#17343a] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit & Management Sign-Off Stamp */}
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-[#17343a]">
                    Line {activeLineNo} IE Daily Activity Floor Audit Verification
                  </h4>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      profile.tierId === 'tier_4'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {profile.tierId === 'tier_4'
                      ? 'Recorded by Line IE (Pending Incharge Sign-off)'
                      : `Verified by Incharge: ${activeLineMeta.inchargeName}`}
                  </span>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Line IE: <strong>{activeLineMeta.lineIEName}</strong> ({activeLineMeta.lineIECode}) • 
                  Auditing Incharge: <strong>{activeLineMeta.inchargeName}</strong> • 
                  Wing: <strong>{activeLineMeta.wing}</strong>
                </p>
              </div>
            </div>

            <div className="text-right text-xs font-mono-numbers text-[#527078] border-t sm:border-t-0 pt-3 sm:pt-0 border-[#e7e1d5]">
              <div>Shift Verification ID: #SL-L{activeLineNo}-{selectedDate.replace(/-/g, '')}</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                Line Compliance Score: {activeLineCompletionPct}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. VIEW B: IE ORG LINE IE PERFORMANCE MATRIX (All 34 Lines Overview)      */}
      {/* ========================================================================= */}
      {activeViewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#d9d2c2] bg-white overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fbfaf6]">
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                  IE ORG Line-by-Line Activity &amp; Line IE Performance Matrix
                </h3>
                <p className="text-xs text-[#527078]">
                  Comparative overview of all 34 sewing lines to insure every Line IE’s everyday execution standards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#176f78] bg-[#dceceb] px-2.5 py-1 rounded-xl">
                  Showing {filteredOrgLines.length} of 34 Line IEs
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[10px] font-bold uppercase text-[#527078] tracking-wider">
                    <th className="p-3">Line #</th>
                    <th className="p-3">Assigned Line IE</th>
                    <th className="p-3">Incharge &amp; Wing</th>
                    <th className="p-3">Active Garment Style</th>
                    <th className="p-3 text-center">Daily Activity Progress</th>
                    <th className="p-3 text-right">Running Eff %</th>
                    <th className="p-3 text-center">Performance Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5] text-xs">
                  {filteredOrgLines.map(item => {
                    const isSelected = item.lineNo === activeLineNo;
                    const eff = item.lineEntry?.efficiency || 82;

                    return (
                      <tr
                        key={item.lineNo}
                        onClick={() => {
                          handleSelectLine(item.lineNo);
                          setActiveViewMode('linewise');
                        }}
                        className={`hover:bg-[#f7fcfc] transition-colors cursor-pointer ${
                          isSelected ? 'bg-[#dceceb]/40 font-semibold' : ''
                        }`}
                      >
                        {/* Line No */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 rounded-xl bg-[#17343a] text-white font-mono-numbers font-black flex items-center justify-center text-xs shadow-2xs">
                              {item.lineNo}
                            </span>
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              item.meta.wingSection === 'blue'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.meta.wingCode}
                            </span>
                          </div>
                        </td>

                        {/* Assigned Line IE */}
                        <td className="p-3">
                          <div>
                            <div className="font-bold text-[#17343a] flex items-center gap-1.5">
                              <span>{item.meta.lineIEName}</span>
                            </div>
                            <span className="text-[10px] text-[#527078] font-mono">
                              {item.meta.lineIECode} • Line IE
                            </span>
                          </div>
                        </td>

                        {/* Incharge & Wing */}
                        <td className="p-3">
                          <div>
                            <div className="text-[#17343a] font-medium">
                              {item.meta.inchargeName}
                            </div>
                            <span className="text-[10px] text-[#527078]">
                              {item.meta.floorLabel}
                            </span>
                          </div>
                        </td>

                        {/* Style */}
                        <td className="p-3">
                          <span className="text-[#17343a] font-medium truncate max-w-[140px] block">
                            {item.lineEntry?.style || 'Basic Polo Classic'}
                          </span>
                          <span className="text-[10px] text-[#527078] font-mono">
                            SMV: {item.lineEntry?.smv || 14.0} min
                          </span>
                        </td>

                        {/* Progress Bar & Tasks Done */}
                        <td className="p-3 text-center min-w-[160px]">
                          <div className="flex items-center justify-between text-[10px] font-mono-numbers font-bold text-[#527078] mb-1">
                            <span>{item.completedCount} of {CHECKLIST_TASK_COUNT}</span>
                            <span className="text-[#176f78]">{item.completionPct}%</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden flex">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${(item.completedCount / CHECKLIST_TASK_COUNT) * 100}%` }}
                            />
                            <div
                              className="h-full bg-amber-400"
                              style={{ width: `${(item.pendingCount / CHECKLIST_TASK_COUNT) * 100}%` }}
                            />
                            <div
                              className="h-full bg-rose-400"
                              style={{ width: `${(item.noCount / CHECKLIST_TASK_COUNT) * 100}%` }}
                            />
                          </div>
                        </td>

                        {/* Running Efficiency */}
                        <td className="p-3 text-right font-mono-numbers font-bold">
                          <span className={`${
                            eff >= 85 ? 'text-emerald-700' : eff >= 75 ? 'text-amber-700' : 'text-rose-700'
                          }`}>
                            {eff}%
                          </span>
                        </td>

                        {/* Performance Status */}
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center gap-1 ${
                            item.performanceTier === 'Exemplary'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : item.performanceTier === 'High'
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : item.performanceTier === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}>
                            {item.performanceTier === 'Exemplary' && <Award className="w-3 h-3" />}
                            <span>{item.performanceTier}</span>
                          </span>
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectLine(item.lineNo);
                              setActiveViewMode('linewise');
                            }}
                            className="px-2.5 py-1 rounded-xl bg-[#dceceb] hover:bg-[#cbe3e1] text-[#176f78] text-[11px] font-bold transition-all cursor-pointer"
                          >
                            Inspect Tasks
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
