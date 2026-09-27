/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Layers,
  Save,
  Plus,
  TrendingUp,
  AlertTriangle,
  Users,
  Clock,
  Sparkles,
  CheckCircle2,
  FileText,
  Sliders,
  Activity,
  Calendar,
  Info,
  Check,
  Flame,
  ArrowUpRight,
  Percent,
  Timer,
  Target,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  Search,
  Building2,
  LayoutGrid,
  Upload,
  Download,
  RefreshCw,
  Lock,
  ShieldCheck,
  ClipboardCheck,
  Radio,
  Gauge,
  Zap,
  Play,
  Pause,
  BarChart3,
  FastForward,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineEntry, StyleNature, SMVWeight, LearningCurveDayRecord, BalancingLossAnalysis, BuildUpCurve, ChecklistMap, UserProfile, Shift8hWorkingMinutesBalance, RoleTier, HandoffCheckItem, LineHandoffSignoff, LiveLineTelemetry, LiveStationCycleTime, LiveWipStation } from '../types';
import { calculateLineMetrics } from '../utils';
import { CHECKLIST_TASK_COUNT, normalizeChecklistStatuses, ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import { DEFAULT_HANDOFF_CHECKLIST, DEFAULT_HANDOFF_SIGNOFFS } from '../data/simulatorPresets';
import { checkLineAccess, isMasterAdminOrAdmin } from '../utils/rbac';
import { ProductionFloorDropdown, matchesProductionFloor, getProductionFloorLabel } from './ProductionFloorSelector';
import {
  getSMVWeight,
  getProgressionTargetEff,
  generateLineLearningCurve,
  calculateBalancingLossAnalysis
} from '../data/learningCurveMatrix';

const StyleProgressionModal = React.lazy(() =>
  import('./StyleProgressionModal').then(m => ({ default: m.StyleProgressionModal }))
);
const TelemetryImportModal = React.lazy(() =>
  import('./TelemetryImportModal').then(m => ({ default: m.TelemetryImportModal }))
);
const WorkingMinutesBalancingModal = React.lazy(() =>
  import('./WorkingMinutesBalancingModal').then(m => ({ default: m.WorkingMinutesBalancingModal }))
);
const TelemetryQuickEntryModal = React.lazy(() =>
  import('./TelemetryQuickEntryModal').then(m => ({ default: m.TelemetryQuickEntryModal }))
);

import { calculate8hShiftWorkingMinutesBalancing } from '../utils/workingMinutesBalancing';
import { generateTelemetryCSV, downloadTelemetryCSV } from '../utils/telemetryCsv';
import { LineEfficiencySparkline } from './LineEfficiencySparkline';
import { QuickOutputUpdateModal } from './QuickOutputUpdateModal';

export type LineSortCriterion = 'lineNo' | 'efficiency' | 'bottleneck' | 'wip' | 'critical';
export type SortDirection = 'asc' | 'desc';

/**
 * Calculates bottleneck severity score and status details for a sewing line.
 * Higher score indicates worse station choking requiring urgent floor intervention.
 */
export const getBottleneckSeverity = (line: LineEntry): {
  score: number;
  status: 'critical' | 'high' | 'ok' | 'none';
  cycleTime: number;
  targetCT: number;
  overrunPct: number;
  station: string;
  action: string;
} => {
  const bn = line.bottleneck;
  if (!bn) {
    return {
      score: 0,
      status: 'none',
      cycleTime: 0,
      targetCT: 0,
      overrunPct: 0,
      station: 'No Bottleneck Reported',
      action: ''
    };
  }

  const ct = Number(bn.cycleTime) || 0;
  const targetCT = Number(bn.targetCT) || 0;
  const overrunPct = targetCT > 0 ? Math.round(((ct - targetCT) / targetCT) * 100) : (ct > 0 ? 50 : 0);

  let score = 0;
  let status: 'critical' | 'high' | 'ok' | 'none' = 'ok';

  if (bn.status === 'critical' || overrunPct >= 20 || (ct > 0 && targetCT > 0 && ct >= targetCT * 1.2)) {
    status = 'critical';
    score += 500;
  } else if (bn.status === 'high' || overrunPct > 0 || (ct > 0 && targetCT > 0 && ct > targetCT)) {
    status = 'high';
    score += 250;
  } else if (bn.status === 'ok') {
    status = 'ok';
    score += 50;
  }

  // Weight by actual cycle time overrun
  score += Math.max(0, overrunPct * 2);

  return {
    score,
    status,
    cycleTime: ct,
    targetCT,
    overrunPct,
    station: bn.station || 'Critical Station',
    action: bn.action || ''
  };
};

/**
 * Compound urgency score for shop-floor IE interventions.
 */
export const getFloorInterventionUrgency = (line: LineEntry): {
  score: number;
  reasons: string[];
  level: 'urgent' | 'warning' | 'stable';
} => {
  let score = 0;
  const reasons: string[] = [];

  // 1. Bottleneck severity
  const bn = getBottleneckSeverity(line);
  if (bn.status === 'critical') {
    score += 400;
    reasons.push(`Critical Bottleneck at ${bn.station} (${bn.cycleTime}s vs ${bn.targetCT}s takt)`);
  } else if (bn.status === 'high') {
    score += 200;
    reasons.push(`High Cycle Time at ${bn.station} (+${bn.overrunPct}%)`);
  }

  // 2. Efficiency deficit (<60% is urgent)
  const eff = line.efficiency ?? 0;
  const targetEff = line.targetEff ?? 85;
  if (eff < 55) {
    score += 350;
    reasons.push(`Severely Low Efficiency (${eff}% vs ${targetEff}% target)`);
  } else if (eff < 70) {
    score += 180;
    reasons.push(`Under Target Efficiency (${eff}%)`);
  }

  // 3. WIP Accumulation (>350 is severe buffer choke)
  const wip = line.wip ?? 0;
  if (wip > 350) {
    score += 150;
    reasons.push(`Excessive WIP Buffer (${wip} pcs)`);
  } else if (wip > 240) {
    score += 80;
    reasons.push(`High Buffer WIP (${wip} pcs)`);
  }

  // 4. Manpower Absenteeism
  const present = (line.mp?.Operator?.present || 0) + (line.mp?.Helper?.present || 0) + (line.mp?.['Iron Man']?.present || 0);
  const absent = (line.mp?.Operator?.absent || 0) + (line.mp?.Helper?.absent || 0) + (line.mp?.['Iron Man']?.absent || 0);
  const total = present + absent;
  if (total > 0 && (absent / total) >= 0.15) {
    score += 120;
    reasons.push(`High Absenteeism (${absent} absent / ${Math.round((absent / total) * 100)}%)`);
  }

  const level = score >= 400 ? 'urgent' : score >= 200 ? 'warning' : 'stable';
  return { score, reasons, level };
};

interface LineDataProps {
  lines: LineEntry[];
  checklists?: ChecklistMap;
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onSaveLine: (line: LineEntry) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (identifier: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  profile?: UserProfile;
  roleTiers?: RoleTier[];
  initialSortBy?: LineSortCriterion;
  initialSortDirection?: SortDirection;
  onOpenOptimizer?: () => void;
}

export const LineData: React.FC<LineDataProps> = ({
  lines,
  checklists,
  selectedLineNo,
  onSelectLineNo,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onNavigate,
  activeDate,
  onSelectDate,
  profile,
  roleTiers,
  initialSortBy,
  initialSortDirection,
  onOpenOptimizer
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const [filterDate, setFilterDate] = useState<string>(activeDate || 'all');
  const [selectedFloorFilter, setSelectedFloorFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<LineSortCriterion>(initialSortBy || 'lineNo');
  const [sortDirection, setSortDirection] = useState<SortDirection>(initialSortDirection || 'asc');

  useEffect(() => {
    if (initialSortBy) {
      setSortBy(initialSortBy);
    }
  }, [initialSortBy]);

  useEffect(() => {
    if (initialSortDirection) {
      setSortDirection(initialSortDirection);
    }
  }, [initialSortDirection]);

  // Debonair LTD (Unit-02) RBAC Access Check for currently selected line
  const lineAccess = useMemo(() => {
    return checkLineAccess(profile, roleTiers || DEFAULT_ROLE_TIERS, selectedLineNo);
  }, [profile, roleTiers, selectedLineNo]);

  // Keep filterDate in sync with global activeDate selection
  React.useEffect(() => {
    if (activeDate) {
      setFilterDate(activeDate);
    }
  }, [activeDate]);

  // Date Stepper & Shift Presets State for Line Data Collection Day
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [quickOutputLine, setQuickOutputLine] = useState<LineEntry | null>(null);
  const datePickerPopoverRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = useMemo(() => {
    const d = new Date();
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  }, []);

  // Standard Factory Shift Datasets & Presets matching Screenshot
  const datePresets = useMemo(() => {
    const presets = [
      { date: '2026-09-24', label: '24-Sep (Day 6)', phase: 'Live Final Run' },
      { date: '2026-09-23', label: '23-Sep (Day 5)', phase: 'Full Flow Run' },
      { date: '2026-09-22', label: '22-Sep (Day 4)', phase: 'Steady State' },
      { date: '2026-09-21', label: '21-Sep (Day 3)', phase: 'Active Run' },
      { date: '2026-09-20', label: '20-Sep (Day 2)', phase: 'Ramp-up Target' },
      { date: '2026-09-19', label: '19-Sep (Day 1)', phase: 'Initial Loading' },
      { date: '2026-09-17', label: '17-Sep (Regular)', phase: 'Regular Data' },
    ];
    if (!presets.some(p => p.date === todayStr)) {
      presets.unshift({ date: todayStr, label: 'Today (Live)', phase: 'Live Operations' });
    }
    return presets;
  }, [todayStr]);

  const getTasksDoneCount = (dateStr: string) => {
    if (checklists && checklists[dateStr]) {
      const list = normalizeChecklistStatuses(checklists[dateStr]);
      return list.filter(s => s === 'yes').length;
    }
    // Realistic fallback for factory audit shift days matching the design
    if (dateStr === '2026-09-24') return 13;
    if (dateStr === '2026-09-23') return 13;
    if (dateStr === '2026-09-22') return 12;
    if (dateStr === '2026-09-17') return 12;
    if (dateStr === '2026-09-21') return 13;
    if (dateStr === '2026-09-20') return 12;
    if (dateStr === '2026-09-19') return 13;
    if (dateStr === todayStr) return 9;
    return 0;
  };

  const effectiveDate = useMemo(() => {
    if (filterDate && filterDate !== 'all') return filterDate;
    return activeDate || '2026-09-24';
  }, [filterDate, activeDate]);

  const formattedDayOfWeek = useMemo(() => {
    if (filterDate === 'all') return 'ALL';
    try {
      const [y, m, d] = effectiveDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    } catch {
      return 'CAL';
    }
  }, [filterDate, effectiveDate]);

  const formattedDisplayDate = useMemo(() => {
    if (filterDate === 'all') return 'All Production Days';
    try {
      const [y, m, d] = effectiveDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return effectiveDate;
    }
  }, [filterDate, effectiveDate]);

  const currentTasksDone = useMemo(() => {
    return getTasksDoneCount(effectiveDate);
  }, [effectiveDate, checklists]);

  const currentCompletionPct = Math.round((currentTasksDone / CHECKLIST_TASK_COUNT) * 100);

  // Distinct active lines and shift report counts (Debonair Unit-2 has 34 Active Lines across recorded Days Reports)
  const uniqueActiveLineCount = useMemo(() => {
    return new Set(lines.map(l => l.lineNo)).size || 34;
  }, [lines]);

  const uniqueDatesCount = useMemo(() => {
    const set = new Set(lines.map(l => l.date).filter(Boolean));
    return set.size > 0 ? set.size : 7;
  }, [lines]);

  // Close popover on outside click or escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerPopoverRef.current &&
        !datePickerPopoverRef.current.contains(event.target as Node)
      ) {
        setIsDateMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDateMenuOpen(false);
      }
    };

    if (isDateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDateMenuOpen]);

  // Stepper handlers
  const handlePrevDay = () => {
    const base = filterDate === 'all' ? (activeDate || '2026-09-21') : filterDate;
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${yStr}-${mStr}-${dStr}`;
    setFilterDate(newDateStr);
    if (onSelectDate) onSelectDate(newDateStr);
  };

  const handleNextDay = () => {
    const base = filterDate === 'all' ? (activeDate || '2026-09-21') : filterDate;
    const d = new Date(base + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${yStr}-${mStr}-${dStr}`;
    setFilterDate(newDateStr);
    if (onSelectDate) onSelectDate(newDateStr);
  };

  // Modals & Notifications
  const [isAddLineModalOpen, setIsAddLineModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [lineToDelete, setLineToDelete] = useState<LineEntry | null>(null);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [isFloorManagerOpen, setIsFloorManagerOpen] = useState(false);
  const [floorManagerSearch, setFloorManagerSearch] = useState('');
  const [isDeleteFloorModalOpen, setIsDeleteFloorModalOpen] = useState(false);
  const [floorToDelete, setFloorToDelete] = useState<{
    name: string;
    lines: LineEntry[];
    totalOutput: number;
    totalMP: number;
    avgEff: number;
    totalWip: number;
  } | null>(null);
  const [deleteFloorMode, setDeleteFloorMode] = useState<'delete_all_lines' | 'reassign'>('delete_all_lines');
  const [reassignTargetFloor, setReassignTargetFloor] = useState<string>('');
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const showToastNotification = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Add Line Form State
  const [addLineNo, setAddLineNo] = useState('');
  const [addFloor, setAddFloor] = useState('Padma Floor');
  const [addBuyer, setAddBuyer] = useState('H&M');
  const [addStyle, setAddStyle] = useState('Polo Shirt Classic');
  const [addSmv, setAddSmv] = useState('14.50');
  const [addWorkingHours, setAddWorkingHours] = useState('8.0');
  const [addTargetEff, setAddTargetEff] = useState('85');
  const [addOperators, setAddOperators] = useState('28');
  const [addHelpers, setAddHelpers] = useState('6');
  const [addIronMan, setAddIronMan] = useState('2');
  const [addWip, setAddWip] = useState('200');
  const [addRemarks, setAddRemarks] = useState('Commissioned sewing line');

  // Available unique dates
  const availableDates = React.useMemo(() => {
    const set = new Set<string>();
    lines.forEach(l => {
      if (l.date) set.add(l.date);
    });
    return Array.from(set).sort().reverse();
  }, [lines]);

  // Aggregated Floors / Units breakdown
  const floorList = React.useMemo(() => {
    const map = new Map<string, {
      name: string;
      lines: LineEntry[];
      totalOutput: number;
      totalTarget: number;
      totalWip: number;
      totalMP: number;
    }>();

    lines.forEach(l => {
      const fl = (l.floor || 'Padma Floor').trim();
      if (!map.has(fl)) {
        map.set(fl, {
          name: fl,
          lines: [],
          totalOutput: 0,
          totalTarget: 0,
          totalWip: 0,
          totalMP: 0
        });
      }
      const data = map.get(fl)!;
      data.lines.push(l);
      data.totalOutput += l.achievedProd || 0;
      data.totalTarget += l.targetProd || 0;
      data.totalWip += l.wip || 0;
      data.totalMP += l.plannedMP || 0;
    });

    return Array.from(map.values())
      .map(f => ({
        ...f,
        avgEfficiency: f.lines.length > 0
          ? Math.round(f.lines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / f.lines.length)
          : 0
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [lines]);

  const filteredLines = React.useMemo(() => {
    let result = lines;
    if (filterDate && filterDate !== 'all') {
      const dateMatches = result.filter(l => l.date === filterDate);
      if (dateMatches.length > 0) result = dateMatches;
    } else {
      // There are 34 Active Lines in the factory across 4 Days of Reports.
      // Deduplicate by lineNo so each of the 34 Active Lines is represented once (preferring activeDate)
      const lineMap = new Map<string, LineEntry>();
      const preferredDate = activeDate || '2026-09-21';
      for (const line of lines) {
        if (line.date === preferredDate) {
          lineMap.set(line.lineNo, line);
        }
      }
      for (const line of lines) {
        if (!lineMap.has(line.lineNo)) {
          lineMap.set(line.lineNo, line);
        }
      }
      result = Array.from(lineMap.values());
    }
    if (selectedFloorFilter && selectedFloorFilter !== 'all') {
      const floorMatches = result.filter(l => matchesProductionFloor(l.floor, selectedFloorFilter));
      if (floorMatches.length > 0) result = floorMatches;
    }
    return result;
  }, [lines, filterDate, activeDate, selectedFloorFilter]);

  // Sorted Lines computation supporting Bottleneck Status, Efficiency %, Intervention Priority, WIP, and Line Number
  const sortedLines = React.useMemo(() => {
    return [...filteredLines].sort((a, b) => {
      // 1. Bottleneck Status Sorting: Critical floor interventions prioritized
      if (sortBy === 'bottleneck') {
        const bnA = getBottleneckSeverity(a);
        const bnB = getBottleneckSeverity(b);
        if (bnA.score !== bnB.score) {
          // desc: Critical bottlenecks first (highest severity score)
          // asc: Balanced lines first (lowest severity score)
          return sortDirection === 'desc' ? bnB.score - bnA.score : bnA.score - bnB.score;
        }
        // Secondary: sort by efficiency ascending (lowest efficiency needs help first)
        const effA = a.efficiency ?? 0;
        const effB = b.efficiency ?? 0;
        if (effA !== effB) {
          return effA - effB;
        }
      }

      // 2. Efficiency Percentage Sorting: Prioritize low efficiency lines for intervention
      if (sortBy === 'efficiency') {
        const effA = a.efficiency ?? 0;
        const effB = b.efficiency ?? 0;
        if (effA !== effB) {
          // asc: Lowest efficiency first (Critical floor intervention priority)
          // desc: Highest efficiency first (Top benchmark performers)
          return sortDirection === 'desc' ? effB - effA : effA - effB;
        }
        // Secondary: sort by bottleneck severity desc
        const bnA = getBottleneckSeverity(a);
        const bnB = getBottleneckSeverity(b);
        if (bnA.score !== bnB.score) {
          return bnB.score - bnA.score;
        }
      }

      // 3. Compound Floor Intervention Urgency
      if (sortBy === 'critical') {
        const urgA = getFloorInterventionUrgency(a);
        const urgB = getFloorInterventionUrgency(b);
        if (urgA.score !== urgB.score) {
          return sortDirection === 'desc' ? urgB.score - urgA.score : urgA.score - urgB.score;
        }
        // Secondary: lowest efficiency first
        return (a.efficiency ?? 0) - (b.efficiency ?? 0);
      }

      // 4. WIP Buffer Accumulation
      if (sortBy === 'wip') {
        const wipA = a.wip ?? 0;
        const wipB = b.wip ?? 0;
        if (wipA !== wipB) {
          return sortDirection === 'desc' ? wipB - wipA : wipA - wipB;
        }
      }

      // Default or secondary sort: Line Number
      const numA = parseInt(a.lineNo.replace(/\D/g, ''), 10);
      const numB = parseInt(b.lineNo.replace(/\D/g, ''), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return sortBy === 'lineNo' && sortDirection === 'desc' ? numB - numA : numA - numB;
      }
      return sortBy === 'lineNo' && sortDirection === 'desc'
        ? b.lineNo.localeCompare(a.lineNo, undefined, { numeric: true })
        : a.lineNo.localeCompare(b.lineNo, undefined, { numeric: true });
    });
  }, [filteredLines, sortBy, sortDirection]);

  // Floor intervention and bottleneck summary across currently filtered lines
  const interventionSummary = React.useMemo(() => {
    let criticalBottlenecks = 0;
    let highBottlenecks = 0;
    let lowEfficiency = 0; // < 60%
    let subTargetEfficiency = 0; // < targetEff
    let mostCriticalLine: LineEntry | null = null;
    let highestUrgencyScore = -1;

    filteredLines.forEach(line => {
      const bn = getBottleneckSeverity(line);
      if (bn.status === 'critical') criticalBottlenecks++;
      else if (bn.status === 'high') highBottlenecks++;

      const eff = line.efficiency ?? 0;
      const target = line.targetEff ?? 85;
      if (eff < 60) lowEfficiency++;
      if (eff < target) subTargetEfficiency++;

      const urgency = getFloorInterventionUrgency(line);
      if (urgency.score > highestUrgencyScore) {
        highestUrgencyScore = urgency.score;
        mostCriticalLine = line;
      }
    });

    return {
      criticalBottlenecks,
      highBottlenecks,
      lowEfficiency,
      subTargetEfficiency,
      mostCriticalLine: mostCriticalLine as LineEntry | null,
      highestUrgencyScore
    };
  }, [filteredLines]);

  const currentLine = filteredLines.find(l => l.lineNo === selectedLineNo) || lines.find(l => l.lineNo === selectedLineNo) || lines[0];

  const handleOpenAddLineModal = () => {
    const nextNumericLine = lines.reduce((max, l) => {
      const num = parseInt(l.lineNo.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    setAddLineNo(String(nextNumericLine > 0 ? nextNumericLine + 1 : lines.length + 1));
    if (currentLine) {
      setAddFloor(currentLine.floor || 'Padma Floor');
      setAddBuyer(currentLine.buyer || 'H&M');
      setAddStyle(currentLine.style || 'Polo Shirt Classic');
    }
    setIsAddLineModalOpen(true);
  };

  const handleCreateLineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLineNo = addLineNo.replace(/line\s*/i, '').trim();
    if (!cleanLineNo) {
      showToastNotification('Please provide a valid line number.');
      return;
    }

    const smvVal = parseFloat(addSmv) || 14.5;
    const hoursVal = parseFloat(addWorkingHours) || 8.0;
    const targetEffVal = parseFloat(addTargetEff) || 85.0;
    const opVal = parseInt(addOperators, 10) || 28;
    const helpVal = parseInt(addHelpers, 10) || 6;
    const ironVal = parseInt(addIronMan, 10) || 2;
    const totalMP = opVal + helpVal + ironVal;
    const totalAvailMin = totalMP * hoursVal * 60;
    const targetProdVal = Math.round((totalAvailMin / smvVal) * (targetEffVal / 100));

    const newLine: LineEntry = {
      id: Date.now(),
      date: filterDate !== 'all' ? filterDate : (activeDate || '2026-09-21'),
      lineNo: cleanLineNo,
      floor: addFloor.trim() || 'Padma Floor',
      buyer: addBuyer.trim() || 'H&M',
      style: addStyle.trim() || 'Polo Shirt Classic',
      smv: smvVal,
      plannedMP: totalMP,
      workingHours: hoursVal,
      targetEff: targetEffVal,
      targetProd: targetProdVal,
      achievedProd: 0,
      efficiency: 0,
      remarks: addRemarks.trim() || 'Newly commissioned line setup',
      orderQty: 10000,
      dailyInput: targetProdVal,
      dailyOutput: 0,
      wip: parseInt(addWip, 10) || 200,
      balancingGraph: 'day1',
      nextStyle: '',
      nextStyleDate: '',
      mp: {
        Operator: { present: opVal, absent: 0 },
        Helper: { present: helpVal, absent: 0 },
        'Iron Man': { present: ironVal, absent: 0 }
      },
      balanceMethod: 'IE Line Balancing',
      balanceNotes: 'New line layout ramp-up',
      top5: {
        held: 'yes',
        attendance: 100,
        items: ['Initial machine inspection', 'Critical operation verification'],
        notes: 'Line setup complete'
      },
      bottleneck: {
        station: 'Main Assembly',
        cycleTime: Math.round(smvVal * 2.2),
        targetCT: Math.round(smvVal * 2.0),
        status: 'ok',
        action: 'Operator assigned and guide fixture calibrated'
      },
      timeStudy: {
        done: 'yes',
        type: 'both',
        observedRate: 110,
        standardRate: 120
      },
      buildUp: {
        day: '1',
        plannedPct: 50,
        achievedPct: 50,
        operators: totalMP
      },
      lineIE: {
        name: 'IE Lead',
        level: 'Senior IE',
        period: 'daily'
      }
    };

    if (onAddNewLine) {
      onAddNewLine(newLine);
    }
    onSelectLineNo(cleanLineNo);
    setIsAddLineModalOpen(false);
    showToastNotification(`Line ${cleanLineNo} created successfully!`);
  };

  const handleRequestDelete = (line: LineEntry) => {
    if (lines.length <= 1) {
      showToastNotification('Cannot delete: Factory requires at least one active sewing line.');
      return;
    }
    setLineToDelete(line);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!lineToDelete) return;
    const deletedNo = lineToDelete.lineNo;
    if (onDeleteLine) {
      onDeleteLine(deletedNo);
    }
    const remaining = sortedLines.filter(l => l.lineNo !== deletedNo);
    if (remaining.length > 0) {
      onSelectLineNo(remaining[0].lineNo);
    }
    setIsDeleteConfirmOpen(false);
    setLineToDelete(null);
    showToastNotification(`Line ${deletedNo} deleted successfully.`);
  };

  const handleRequestDeleteFloor = (floorName: string) => {
    const trimmed = floorName.trim();
    if (floorList.length <= 1) {
      showToastNotification(`Cannot delete floor "${floorName}": The factory requires at least one active production floor/unit.`);
      return;
    }

    const matchedLines = lines.filter(l => (l.floor || '').trim().toLowerCase() === trimmed.toLowerCase());
    const remainingFloors = floorList.filter(f => f.name.toLowerCase() !== trimmed.toLowerCase());

    setFloorToDelete({
      name: floorName,
      lines: matchedLines,
      totalOutput: matchedLines.reduce((acc, l) => acc + (l.achievedProd || 0), 0),
      totalMP: matchedLines.reduce((acc, l) => acc + (l.plannedMP || 0), 0),
      avgEff: matchedLines.length > 0 ? Math.round(matchedLines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / matchedLines.length) : 0,
      totalWip: matchedLines.reduce((acc, l) => acc + (l.wip || 0), 0)
    });
    setDeleteFloorMode('delete_all_lines');
    setReassignTargetFloor(remainingFloors[0]?.name || '');
    setIsDeleteFloorModalOpen(true);
  };

  const handleConfirmDeleteFloor = () => {
    if (!floorToDelete) return;
    const floorName = floorToDelete.name;

    if (onDeleteFloor) {
      onDeleteFloor(floorName, deleteFloorMode, reassignTargetFloor);
    }

    if (deleteFloorMode === 'delete_all_lines') {
      const remainingLines = lines.filter(l => (l.floor || '').trim().toLowerCase() !== floorName.trim().toLowerCase());
      if (remainingLines.length > 0 && !remainingLines.some(l => l.lineNo === selectedLineNo)) {
        onSelectLineNo(remainingLines[0].lineNo);
      }
      showToastNotification(`Floor "${floorName}" and its ${floorToDelete.lines.length} lines deleted.`);
    } else {
      showToastNotification(`Floor "${floorName}" deleted: ${floorToDelete.lines.length} lines transferred to ${reassignTargetFloor}.`);
    }

    if (selectedFloorFilter.toLowerCase() === floorName.trim().toLowerCase()) {
      setSelectedFloorFilter('all');
    }

    setIsDeleteFloorModalOpen(false);
    setFloorToDelete(null);
  };

  // Local draft state for editing
  const [formData, setFormData] = useState<LineEntry>(() => initializeLineData(currentLine));
  const [saveToast, setSaveToast] = useState(false);
  const [showProgressionModal, setShowProgressionModal] = useState(false);
  const [is8hBalancingModalOpen, setIs8hBalancingModalOpen] = useState(false);

  // Collapsible sections state matching the Line Telemetry Logging Sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    liveTelemetry: true,
    top5: true,
    planning: true,
    flowHandoff: true,
    manpowerBalancing: true,
    bottleneck: true,
    timeStudy: true,
    learningCurve: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isAllExpanded = Object.values(expandedSections).every(Boolean);

  const toggleAllSections = () => {
    const nextState = !isAllExpanded;
    setExpandedSections({
      liveTelemetry: nextState,
      top5: nextState,
      planning: nextState,
      flowHandoff: nextState,
      manpowerBalancing: nextState,
      bottleneck: nextState,
      timeStudy: nextState,
      learningCurve: nextState,
    });
  };

  // Pre-production technical handoff state for Section 3
  const [handoffChecks, setHandoffChecks] = useState<HandoffCheckItem[]>(DEFAULT_HANDOFF_CHECKLIST);
  const [handoffSignoffs, setHandoffSignoffs] = useState<LineHandoffSignoff[]>(DEFAULT_HANDOFF_SIGNOFFS);

  const handoffScore = useMemo(() => {
    const passedCount = handoffChecks.filter(c => c.status === 'pass').length;
    const checkPct = (passedCount / (handoffChecks.length || 1)) * 60;
    const approvedCount = handoffSignoffs.filter(s => s.status === 'approved').length;
    const signoffPct = (approvedCount / (handoffSignoffs.length || 1)) * 40;
    return Math.round(checkPct + signoffPct);
  }, [handoffChecks, handoffSignoffs]);

  // Derived 8h shift working minutes balancing reconciliation
  const shift8hBalance = useMemo(() => {
    return formData.shift8hBalancing || calculate8hShiftWorkingMinutesBalancing(formData);
  }, [formData.achievedProd, formData.targetProd, formData.smv, formData.plannedMP, formData.mp, formData.bottleneck, formData.shift8hBalancing]);

  // Helper to generate default live telemetry values based on line parameters
  function generateDefaultLiveTelemetry(entry: LineEntry, totalMP: number, hours: number): LiveLineTelemetry {
    const smv = entry.smv || 14.5;
    const targetPcsPerHour = entry.targetProd ? Math.round(entry.targetProd / (hours || 8)) : Math.round((totalMP * 60 * 0.85) / smv);
    const actualPcsPerHour = entry.achievedProd ? Math.round(entry.achievedProd / (hours || 8)) : Math.round(targetPcsPerHour * 0.92);
    const standardPitchSec = Math.round((smv * 60) / Math.max(1, totalMP));
    const targetCTSec = Math.round(standardPitchSec * 1.05);
    const bnCTSec = entry.bottleneck?.cycleTime || Math.round(targetCTSec * 1.25);
    const currentWip = entry.wip || Math.round(targetPcsPerHour * 1.8);
    const standardBuffer = Math.round(targetPcsPerHour * 1.5);
    const bufferHours = targetPcsPerHour > 0 ? parseFloat((currentWip / targetPcsPerHour).toFixed(1)) : 1.5;

    return {
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isLiveMonitoring: true,
      averageCycleTimeSec: Math.round((targetCTSec + bnCTSec) / 2),
      targetCycleTimeSec: targetCTSec,
      bottleneckCycleTimeSec: bnCTSec,
      pitchTimeSec: standardPitchSec,
      currentHourlyRatePcs: actualPcsPerHour,
      targetHourlyRatePcs: targetPcsPerHour,
      runRatePcsPerHour: Math.round(actualPcsPerHour * 1.02),
      pacingVariancePcs: actualPcsPerHour - targetPcsPerHour,
      pacingStatus: actualPcsPerHour >= targetPcsPerHour ? 'on_pace' : actualPcsPerHour >= targetPcsPerHour * 0.85 ? 'behind' : 'critical_lag',
      currentWipTotalPcs: currentWip,
      standardWipBufferPcs: standardBuffer,
      wipBufferHours: bufferHours,
      wipHealthStatus: bufferHours > 3.0 ? 'high_accumulation' : bufferHours < 0.8 ? 'starvation_risk' : 'buffer_safe',
      cycleTimeStations: [
        {
          stationId: 'st-1',
          operationName: 'Front Placket Setting',
          operatorName: 'Fatema Begum',
          observedCycleTimeSec: bnCTSec,
          standardCycleTimeSec: targetCTSec,
          pitchTimeSec: standardPitchSec,
          status: 'bottleneck',
          lastLoggedAt: 'Just now'
        },
        {
          stationId: 'st-2',
          operationName: 'Collar Run & Topstitch',
          operatorName: 'Abdul Malek',
          observedCycleTimeSec: Math.round(targetCTSec * 0.95),
          standardCycleTimeSec: targetCTSec,
          pitchTimeSec: standardPitchSec,
          status: 'optimal',
          lastLoggedAt: '2 min ago'
        },
        {
          stationId: 'st-3',
          operationName: 'Sleeve Hem Overlock',
          operatorName: 'Nasima Khatun',
          observedCycleTimeSec: Math.round(targetCTSec * 0.88),
          standardCycleTimeSec: targetCTSec,
          pitchTimeSec: standardPitchSec,
          status: 'optimal',
          lastLoggedAt: '5 min ago'
        },
        {
          stationId: 'st-4',
          operationName: 'Side Seam Join & Close',
          operatorName: 'Jahangir Alam',
          observedCycleTimeSec: Math.round(targetCTSec * 1.12),
          standardCycleTimeSec: targetCTSec,
          pitchTimeSec: standardPitchSec,
          status: 'bottleneck',
          lastLoggedAt: 'Just now'
        }
      ],
      wipStations: [
        {
          stage: 'input_loading',
          label: '1. Input Loading / Batch Feed',
          wipPcs: Math.round(currentWip * 0.22),
          bufferHours: parseFloat((bufferHours * 0.25).toFixed(1)),
          status: 'balanced'
        },
        {
          stage: 'front_assembly',
          label: '2. Front Body & Placket',
          wipPcs: Math.round(currentWip * 0.28),
          bufferHours: parseFloat((bufferHours * 0.32).toFixed(1)),
          status: 'surging'
        },
        {
          stage: 'back_assembly',
          label: '3. Back Yoke & Shoulder',
          wipPcs: Math.round(currentWip * 0.18),
          bufferHours: parseFloat((bufferHours * 0.20).toFixed(1)),
          status: 'balanced'
        },
        {
          stage: 'side_seam',
          label: '4. Side Seam & Sleeve Join',
          wipPcs: Math.round(currentWip * 0.20),
          bufferHours: parseFloat((bufferHours * 0.22).toFixed(1)),
          status: 'balanced'
        },
        {
          stage: 'end_line_qco',
          label: '5. End-Line QC & Inspection',
          wipPcs: Math.round(currentWip * 0.12),
          bufferHours: parseFloat((bufferHours * 0.15).toFixed(1)),
          status: 'balanced'
        }
      ],
      telemetryNotes: `Real-time shop-floor telemetry active for Line ${entry.lineNo}. Station 1 & 4 cycle pacing monitored live.`
    };
  }

  // Sync draft when selected line changes
  useEffect(() => {
    if (currentLine) {
      setFormData(initializeLineData(currentLine));
    }
  }, [currentLine?.lineNo, currentLine?.id]);

  function initializeLineData(entry: LineEntry): LineEntry {
    const smv = entry.smv || 1.0;
    const totalMP =
      (entry.mp?.Operator?.present ?? 28) +
      (entry.mp?.Helper?.present ?? 8) +
      (entry.mp?.['Iron Man']?.present ?? 3);

    const learningCurve = entry.learningCurve || generateLineLearningCurve(
      smv,
      totalMP || 40,
      entry.workingHours || 8,
      'new',
      2,
      false
    );

    const tacct = Math.round(smv * 60 * 60); // Default total cycle seconds
    const maxCT = entry.bottleneck?.cycleTime || 55.0;
    const balancingAnalysis = entry.balancingAnalysis || calculateBalancingLossAnalysis(
      tacct,
      totalMP || 40,
      maxCT,
      entry.achievedProd ? Math.round(entry.achievedProd / (entry.workingHours || 8)) : 90,
      entry.targetProd ? Math.round(entry.targetProd / (entry.workingHours || 8)) : 110
    );

    const liveTelemetry = entry.liveTelemetry || generateDefaultLiveTelemetry(entry, totalMP, entry.workingHours || 8);

    return {
      ...entry,
      learningCurve,
      balancingAnalysis,
      liveTelemetry
    };
  }

  const metrics = calculateLineMetrics(formData);
  const smvWeight = getSMVWeight(formData.smv);

  // Learning curve safe accessor
  const lc = formData.learningCurve || generateLineLearningCurve(
    formData.smv,
    metrics.totalPresentMP || 40,
    formData.workingHours || 8,
    'new',
    2,
    false
  );

  // Balancing analysis safe accessor
  const ba = formData.balancingAnalysis || calculateBalancingLossAnalysis(
    Math.round(formData.smv * 60 * 60),
    metrics.totalPresentMP || 40,
    formData.bottleneck?.cycleTime || 55.0,
    Math.round(formData.achievedProd / (formData.workingHours || 8)),
    Math.round(formData.targetProd / (formData.workingHours || 8))
  );

  // Telemetry modal state
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [isQuickEntryModalOpen, setIsQuickEntryModalOpen] = useState(false);

  // Update Line Build-Up parameters
  const handleUpdateBuildUp = (updates: Partial<BuildUpCurve>) => {
    setFormData(prev => ({
      ...prev,
      buildUp: {
        ...prev.buildUp,
        ...updates
      }
    }));
  };

  // Update day fields (plannedEff, plannedQty, achievedQty, notes) in 6-day curve
  const handleUpdateDayField = (
    dayIndex: number,
    field: keyof LearningCurveDayRecord,
    value: any
  ) => {
    const totalAvailMin = (metrics.totalPresentMP || 40) * (formData.workingHours || 8) * 60;
    const smv = formData.smv > 0 ? formData.smv : 1;
    const newHistory = [...lc.history];
    const record = { ...newHistory[dayIndex] };

    if (field === 'plannedEff') {
      const plannedEff = Math.max(0, Math.min(100, Number(value) || 0));
      record.plannedEff = plannedEff;
      record.plannedQty = Math.round((totalAvailMin * (plannedEff / 100)) / smv);
    } else if (field === 'plannedQty') {
      const plannedQty = Math.max(0, Number(value) || 0);
      record.plannedQty = plannedQty;
      record.plannedEff = totalAvailMin > 0 ? Math.round(((plannedQty * smv) / totalAvailMin) * 100) : 0;
    } else if (field === 'achievedQty') {
      const achievedQty = Math.max(0, Number(value) || 0);
      record.achievedQty = achievedQty;
      record.achievedEff = totalAvailMin > 0 ? Math.round(((achievedQty * smv) / totalAvailMin) * 100) : 0;
    } else {
      (record as any)[field] = value;
    }

    record.variancePcs = (record.achievedQty || 0) - record.plannedQty;
    record.variancePct = record.plannedQty > 0 ? Math.round((record.variancePcs / record.plannedQty) * 100) : 0;

    newHistory[dayIndex] = record;
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...lc,
        history: newHistory
      }
    }));
  };

  // Recalculate curve targets from matrix while preserving achieved logs & notes
  const handleRecalculateTargets = () => {
    const isRepeat = lc.styleNature === 'repeat';
    const newLC = generateLineLearningCurve(
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8,
      lc.styleNature,
      lc.currentDay,
      isRepeat
    );
    const mergedHistory = newLC.history.map((h, i) => {
      const oldRec = lc.history[i];
      const achQty = oldRec?.achievedQty || 0;
      const totalAvailMin = (metrics.totalPresentMP || 40) * (formData.workingHours || 8) * 60;
      const smv = formData.smv > 0 ? formData.smv : 1;
      const achEff = totalAvailMin > 0 && achQty > 0 ? Math.round(((achQty * smv) / totalAvailMin) * 100) : 0;
      return {
        ...h,
        achievedQty: achQty,
        achievedEff: achEff,
        variancePcs: achQty - h.plannedQty,
        variancePct: h.plannedQty > 0 ? Math.round(((achQty - h.plannedQty) / h.plannedQty) * 100) : 0,
        notes: oldRec?.notes || ''
      };
    });
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...newLC,
        history: mergedHistory
      }
    }));
    showToastNotification(`Targets recalculated from ${lc.styleNature} style progression matrix.`);
  };

  // Export current line telemetry
  const handleExportTelemetry = () => {
    const csvContent = generateTelemetryCSV(
      lc,
      formData.buildUp,
      formData.lineNo,
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8
    );
    downloadTelemetryCSV(`telemetry_line_${formData.lineNo}_${formData.date || 'current'}.csv`, csvContent);
    showToastNotification(`Telemetry log for Line ${formData.lineNo} exported successfully!`);
  };

  // Apply imported telemetry
  const handleApplyImportedTelemetry = (imported: {
    history: LearningCurveDayRecord[];
    buildUp?: Partial<BuildUpCurve>;
  }) => {
    setFormData(prev => ({
      ...prev,
      learningCurve: {
        ...lc,
        history: imported.history
      },
      buildUp: imported.buildUp
        ? { ...prev.buildUp, ...imported.buildUp }
        : prev.buildUp
    }));
    showToastNotification(`Telemetry imported for Line ${formData.lineNo} successfully!`);
  };

  // Update learning curve parameter
  const handleUpdateLearningCurve = (
    updates: Partial<typeof lc>
  ) => {
    const updatedLC = { ...lc, ...updates };
    setFormData(prev => ({
      ...prev,
      learningCurve: updatedLC
    }));
  };

  // Update day output in 6-day curve
  const handleUpdateDayRecord = (
    dayIndex: number,
    achievedQty: number,
    notes?: string
  ) => {
    const totalAvailMin = metrics.totalPresentMP * formData.workingHours * 60;
    const smv = formData.smv > 0 ? formData.smv : 1;
    const newHistory = [...lc.history];
    const record = newHistory[dayIndex];
    if (record) {
      const producedMinutes = achievedQty * smv;
      const achievedEff = totalAvailMin > 0 ? Math.round((producedMinutes / totalAvailMin) * 100) : 0;
      const variancePcs = achievedQty - record.plannedQty;
      const variancePct = record.plannedQty > 0 ? Math.round((variancePcs / record.plannedQty) * 100) : 0;

      newHistory[dayIndex] = {
        ...record,
        achievedQty,
        achievedEff,
        variancePcs,
        variancePct,
        notes: notes ?? record.notes
      };

      setFormData(prev => ({
        ...prev,
        learningCurve: {
          ...lc,
          history: newHistory
        }
      }));
    }
  };

  // Re-generate curve when Style Nature changes
  const handleStyleNatureChange = (nature: StyleNature) => {
    const isRepeat = nature === 'repeat';
    const newLC = generateLineLearningCurve(
      formData.smv,
      metrics.totalPresentMP || 40,
      formData.workingHours || 8,
      nature,
      lc.currentDay,
      isRepeat
    );
    setFormData(prev => ({
      ...prev,
      learningCurve: newLC
    }));
  };

  // Balancing Analysis update
  const handleBalancingParamChange = (field: 'tacctSeconds' | 'totalOperators' | 'maxCTSeconds' | 'currentProductionPcsPerHour' | 'estimatePcsPerHour', val: number) => {
    const updated = { ...ba, [field]: val };
    const recalculated = calculateBalancingLossAnalysis(
      field === 'tacctSeconds' ? val : ba.tacctSeconds,
      field === 'totalOperators' ? val : ba.totalOperators,
      field === 'maxCTSeconds' ? val : ba.maxCTSeconds,
      field === 'currentProductionPcsPerHour' ? val : ba.currentProductionPcsPerHour,
      field === 'estimatePcsPerHour' ? val : ba.estimatePcsPerHour
    );
    setFormData(prev => ({
      ...prev,
      balancingAnalysis: {
        ...recalculated,
        theoreticalBalancePct: ba.theoreticalBalancePct,
        balancingErrorPct: ba.balancingErrorPct,
        capacityEstimatePct: ba.capacityEstimatePct,
        rightManInRightProcess: ba.rightManInRightProcess,
        rightMachineForProcess: ba.rightMachineForProcess,
        needleDowntimeMinutes: ba.needleDowntimeMinutes
      }
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lineAccess.canEdit) {
      alert(`RBAC Policy Restricted: Your assigned scope does not permit editing ${selectedLineNo}. (${lineAccess.reason || 'View Only'})`);
      return;
    }
    const updated: LineEntry = {
      ...formData,
      efficiency: metrics.efficiencyPct,
      learningCurve: lc,
      balancingAnalysis: ba,
      liveTelemetry: formData.liveTelemetry
    };
    onSaveLine(updated);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Debonair LTD (Unit-02) RBAC Permission Status Notification */}
      {!lineAccess.canEdit && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                  Debonair RBAC View-Only Mode
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
                  {lineAccess.accessControlLevel}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-0.5">
                {lineAccess.reason || `You are viewing ${selectedLineNo} in read-only mode.`}
              </p>
            </div>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('roles')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>View Roles &amp; Scope</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header Card matching Image 1 */}
      <div className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#dceceb] text-[#176f78]">
                <Activity className="w-3 h-3" />
                Garment IE Floor Telemetry
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight">
              Daily Data Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-0.5 max-w-xl">
              Record hourly output, SMV, manpower absents, bottleneck takt cycle times, and Top 5 monitoring.
            </p>
          </div>

          {/* Line Selection Buttons & Action */}
          <div className="flex flex-col gap-2.5 items-end w-full sm:w-auto">
            {/* Top Control Row: Date Stepper Selector matching Image + Floor Filter */}
            <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
              {/* Custom Date & Shift Stepper Selector */}
              <div
                id="linedata-custom-date-selector"
                ref={datePickerPopoverRef}
                className="relative flex items-center gap-1 sm:gap-1.5 bg-[#f1eee6] p-1.5 rounded-2xl border border-[#d9d2c2] shadow-xs"
              >
                {/* Previous Day Stepper */}
                <button
                  type="button"
                  onClick={handlePrevDay}
                  title="Previous Day"
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] active:bg-[#ded6c7] text-[#17343a] transition-all cursor-pointer touch-manipulation active:scale-95"
                  aria-label="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Main Custom Date Selector Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsDateMenuOpen(prev => !prev)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#fbfaf6] text-[#17343a] border border-[#d9d2c2] shadow-2xs transition-all cursor-pointer touch-manipulation active:scale-98 group"
                  title="Click to open custom date & shift dataset selector"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#dceceb] flex items-center justify-center text-[#176f78] shrink-0 group-hover:scale-105 transition-transform">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#176f78] bg-[#eef7f6] px-1 py-0.5 rounded">
                        {formattedDayOfWeek}
                      </span>
                      <span className="text-xs font-bold font-mono-numbers text-[#17343a]">
                        {formattedDisplayDate}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#527078] font-mono-numbers mt-0.5">
                      {filterDate === 'all'
                        ? `${uniqueActiveLineCount} Active Lines (${uniqueDatesCount} Days Reports)`
                        : `${currentTasksDone}/${CHECKLIST_TASK_COUNT} Tasks Done (${currentCompletionPct}%) • ${new Set(lines.filter(l => l.date === effectiveDate).map(l => l.lineNo)).size || uniqueActiveLineCount} Active Lines`}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 shrink-0 ${
                      isDateMenuOpen ? 'rotate-180 text-[#176f78]' : ''
                    }`}
                  />
                </button>

                {/* Native Calendar Picker Quick Trigger */}
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
                    className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] active:bg-[#ded6c7] text-[#176f78] transition-all cursor-pointer touch-manipulation"
                    title="Open Native Calendar Picker"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <input
                    ref={nativeDateInputRef}
                    type="date"
                    value={effectiveDate}
                    onChange={e => {
                      if (e.target.value) {
                        setFilterDate(e.target.value);
                        if (onSelectDate) onSelectDate(e.target.value);
                        setIsDateMenuOpen(false);
                      }
                    }}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>

                {/* Next Day Stepper */}
                <button
                  type="button"
                  onClick={handleNextDay}
                  title="Next Day"
                  className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[#e7e1d5] active:bg-[#ded6c7] text-[#17343a] transition-all cursor-pointer touch-manipulation active:scale-95"
                  aria-label="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Custom Date Popover Dropdown matching Screenshot */}
                <AnimatePresence>
                  {isDateMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute top-full mt-2 right-0 z-50 w-[340px] max-w-[95vw] rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl p-4 text-[#17343a] space-y-3"
                    >
                      {/* Popover Header */}
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
                          className="p-1 rounded-lg hover:bg-[#e7e1d5] text-[#527078] hover:text-[#17343a] transition-colors cursor-pointer"
                          title="Close date selector"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Direct Custom Date Input matching Screenshot */}
                      <div className="bg-[#f1eee6] p-2.5 rounded-xl border border-[#d9d2c2] space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-[#527078] flex items-center justify-between">
                          <span>Custom Date Input</span>
                          <span className="text-[#176f78] font-mono-numbers">{effectiveDate}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={effectiveDate}
                            onChange={e => {
                              if (e.target.value) {
                                setFilterDate(e.target.value);
                                if (onSelectDate) onSelectDate(e.target.value);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-[#17343a] focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                          />
                        </div>
                      </div>

                      {/* Individual Date /Day wise Reports */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] px-0.5">
                          Date /Day wise Reports
                        </span>
                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {datePresets.map(preset => {
                            const isCurrent = (preset.date === filterDate) || (preset.date === effectiveDate && filterDate !== 'all');
                            const doneCount = getTasksDoneCount(preset.date);
                            const isFullyDone = doneCount === CHECKLIST_TASK_COUNT;
                            const presetLineCount = new Set(lines.filter(l => l.date === preset.date).map(l => l.lineNo)).size || uniqueActiveLineCount;

                            return (
                              <button
                                key={preset.date}
                                type="button"
                                onClick={() => {
                                  setFilterDate(preset.date);
                                  if (onSelectDate) onSelectDate(preset.date);
                                  setIsDateMenuOpen(false);
                                }}
                                className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                                  isCurrent
                                    ? 'bg-[#dceceb] border-[#176f78] text-[#17343a] font-bold ring-1 ring-[#176f78]/30 shadow-2xs'
                                    : 'bg-white hover:bg-[#f1eee6] border-[#e7e1d5] text-[#527078] hover:text-[#17343a]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? 'bg-[#176f78]' : 'bg-[#d9d2c2]'}`} />
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold text-[#17343a] truncate">
                                      {preset.label}
                                    </div>
                                    <div className="text-[10px] text-[#527078] truncate">
                                      {preset.phase} • {presetLineCount} Active Lines
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                                  <span className={`text-[10px] font-mono-numbers font-bold px-1.5 py-0.5 rounded ${
                                    isFullyDone
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : doneCount > 0
                                      ? 'bg-teal-100 text-teal-800'
                                      : 'bg-stone-100 text-stone-600'
                                  }`}>
                                    {doneCount}/{CHECKLIST_TASK_COUNT}
                                  </span>
                                  {isCurrent && <Check className="w-3.5 h-3.5 text-[#176f78]" />}
                                </div>
                              </button>
                            );
                          })}

                          {/* Option to show All Dates */}
                          <button
                            type="button"
                            onClick={() => {
                              setFilterDate('all');
                              setIsDateMenuOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer border ${
                              filterDate === 'all'
                                ? 'bg-[#dceceb] border-[#176f78] text-[#17343a] font-bold ring-1 ring-[#176f78]/30 shadow-2xs'
                                : 'bg-white hover:bg-[#f1eee6] border-[#e7e1d5] text-[#527078] hover:text-[#17343a]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${filterDate === 'all' ? 'bg-[#176f78]' : 'bg-[#d9d2c2]'}`} />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[#17343a] truncate">
                                  All Production Days ({uniqueDatesCount} Days Reports)
                                </div>
                                <div className="text-[10px] text-[#527078] truncate">
                                  {uniqueActiveLineCount} Active Lines across {uniqueDatesCount} Shifts
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                              <span className="text-[10px] font-mono-numbers font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                                {uniqueActiveLineCount} Active Lines
                              </span>
                              {filterDate === 'all' && <Check className="w-3.5 h-3.5 text-[#176f78]" />}
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Popover Footer Shortcuts matching Screenshot */}
                      <div className="pt-2 border-t border-[#e7e1d5] flex items-center justify-between gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterDate(todayStr);
                            if (onSelectDate) onSelectDate(todayStr);
                            setIsDateMenuOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Reset to Today
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setFilterDate(yesterdayStr);
                            if (onSelectDate) onSelectDate(yesterdayStr);
                            setIsDateMenuOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#527078] hover:text-[#17343a] font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Yesterday
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsDateMenuOpen(false)}
                          className="px-3 py-1 rounded-lg bg-[#176f78] hover:bg-[#135960] text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Merged Floor / Scope Dropdown Filter */}
              <div className="shrink-0">
                <ProductionFloorDropdown
                  selectedFloor={selectedFloorFilter}
                  onSelectFloor={(id) => setSelectedFloorFilter(id)}
                  selectedLineNo={selectedLineNo}
                  onSelectLineNo={(lNo) => onSelectLineNo(lNo)}
                  lines={lines}
                  variant="filter"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isMasterAdmin && (
                  <button
                    onClick={handleOpenAddLineModal}
                    title="Add New Sewing Line"
                    className="p-1.5 h-8.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] transition-colors cursor-pointer shrink-0 shadow-2xs flex items-center gap-1 text-xs font-bold px-2.5 touch-manipulation active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                )}
                {onNavigate && (
                  <>
                    <button
                      type="button"
                      onClick={() => onNavigate('floor-plan')}
                      className="px-2.5 py-1.5 h-8.5 rounded-xl bg-[#f1eee6] text-[#176f78] hover:bg-[#dceceb] border border-[#d9d2c2] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer touch-manipulation active:scale-95"
                      title="Open Visual Floor Plan & Line Setup"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Floor &amp; Setup</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('simulator')}
                      className="px-2.5 py-1.5 h-8.5 rounded-xl bg-[#f1eee6] text-[#176f78] hover:bg-[#dceceb] border border-[#d9d2c2] text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer touch-manipulation active:scale-95"
                      title="Open IE Simulator"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Simulator</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Active Merged Filter Status Notice */}
            {(selectedFloorFilter !== 'all' || (selectedLineNo && selectedLineNo !== 'all')) && (
              <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#176f78]/10 border border-[#176f78]/25 text-xs text-[#17343a]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#176f78] animate-pulse" />
                  <span className="font-medium text-[#527078]">Active Filter:</span>
                  <span className="font-bold text-[#176f78]">
                    {selectedLineNo && selectedLineNo !== 'all'
                      ? `${selectedLineNo} • ${getProductionFloorLabel(selectedFloorFilter)}`
                      : getProductionFloorLabel(selectedFloorFilter)}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white font-bold text-[#176f78] border border-[#176f78]/20">
                    {sortedLines.length} of 34 Lines
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFloorFilter('all');
                    onSelectLineNo('all');
                  }}
                  className="text-[11px] font-bold text-[#176f78] hover:text-[#114b51] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Show All 34 Lines</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sorting Controls Bar with Bottleneck & Efficiency Prioritization */}
        <div className="mt-4 pt-3 border-t border-[#e7e1d5] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#527078] uppercase tracking-wider">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Sort Lines:</span>
            </div>

            {/* Segmented Sort Buttons */}
            <div className="inline-flex rounded-xl bg-[#f1eee6] p-0.5 border border-[#d9d2c2] flex-wrap">
              {/* Bottleneck Status - Priority Floor Interventions */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'bottleneck') {
                    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('bottleneck');
                    setSortDirection('desc'); // Default to critical bottlenecks first
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  sortBy === 'bottleneck'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort lines by station bottleneck status to prioritize critical floor interventions"
              >
                <AlertTriangle className={`w-3 h-3 ${sortBy === 'bottleneck' ? 'text-amber-300' : 'text-rose-600'}`} />
                <span>Bottleneck</span>
                {interventionSummary.criticalBottlenecks > 0 && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-mono font-bold ${
                      sortBy === 'bottleneck' ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {interventionSummary.criticalBottlenecks}
                  </span>
                )}
                {sortBy === 'bottleneck' && (
                  sortDirection === 'desc' ? (
                    <span className="text-[10px] opacity-90 font-mono">Crit ⚠️</span>
                  ) : (
                    <span className="text-[10px] opacity-90 font-mono">OK ✓</span>
                  )
                )}
              </button>

              {/* Efficiency % - Low (Intervention) or High (Benchmark) */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'efficiency') {
                    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortBy('efficiency');
                    setSortDirection('asc'); // Default to lowest efficiency first to prioritize critical lines
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'efficiency'
                    ? sortDirection === 'asc'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-[#176f78] text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by Efficiency % (Lowest First for floor intervention, or Highest First for top benchmarks)"
              >
                <Percent className="w-3 h-3" />
                <span>Efficiency</span>
                {sortBy === 'efficiency' && (
                  sortDirection === 'asc' ? (
                    <span className="text-[10px] font-mono opacity-90">Low 🚨</span>
                  ) : (
                    <span className="text-[10px] font-mono opacity-90">High 🏆</span>
                  )
                )}
              </button>

              {/* Compound Intervention Priority */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'critical') {
                    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('critical');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'critical'
                    ? 'bg-rose-700 text-white shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Compound floor intervention priority based on bottlenecks, efficiency deficit, and buffer WIP"
              >
                <Flame className={`w-3 h-3 ${sortBy === 'critical' ? 'text-amber-300' : 'text-rose-500'}`} />
                <span>Intervene</span>
              </button>

              {/* Line Number */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'lineNo') {
                    setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortBy('lineNo');
                    setSortDirection('asc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'lineNo'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by Line Number"
              >
                <span>Line No</span>
                {sortBy === 'lineNo' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#176f78]" /> : <ArrowDown className="w-3 h-3 text-[#176f78]" />
                )}
              </button>

              {/* WIP Level */}
              <button
                type="button"
                onClick={() => {
                  if (sortBy === 'wip') {
                    setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                  } else {
                    setSortBy('wip');
                    setSortDirection('desc');
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  sortBy === 'wip'
                    ? 'bg-white text-[#176f78] shadow-2xs'
                    : 'text-[#527078] hover:text-[#17343a]'
                }`}
                title="Sort by WIP Level (High / Low)"
              >
                <span>WIP</span>
                {sortBy === 'wip' && (
                  sortDirection === 'desc' ? <ArrowDown className="w-3 h-3 text-[#176f78]" /> : <ArrowUp className="w-3 h-3 text-[#176f78]" />
                )}
              </button>
            </div>

            {/* Quick Dropdown Selector for Complete Control */}
            <select
              value={`${sortBy}-${sortDirection}`}
              onChange={(e) => {
                const [criterion, dir] = e.target.value.split('-') as [LineSortCriterion, SortDirection];
                setSortBy(criterion);
                setSortDirection(dir);
              }}
              className="text-xs font-bold py-1 px-2.5 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#176f78]"
            >
              <optgroup label="Floor Intervention Priorities">
                <option value="bottleneck-desc">⚠️ Bottleneck: Critical Bottlenecks First</option>
                <option value="bottleneck-asc">✓ Bottleneck: Stable &amp; Balanced Lines First</option>
                <option value="efficiency-asc">🚨 Efficiency: Lowest First (Intervention Priority)</option>
                <option value="critical-desc">🔥 Floor Triage: Combined Urgent Needs First</option>
              </optgroup>
              <optgroup label="Standard Benchmarks &amp; Order">
                <option value="efficiency-desc">🏆 Efficiency: Highest First (Top Performers)</option>
                <option value="lineNo-asc">🔢 Line Number: Sequential (Line 01 → 34)</option>
                <option value="lineNo-desc">🔢 Line Number: Reverse (Line 34 → 01)</option>
                <option value="wip-desc">📦 WIP Buffer: High Buffer First (&gt;350 pcs)</option>
                <option value="wip-asc">📦 WIP Buffer: Low Buffer First</option>
              </optgroup>
            </select>

            {/* AI Optimization Assistant Quick Action Trigger */}
            {onOpenOptimizer && (
              <button
                type="button"
                onClick={onOpenOptimizer}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-[#176f78] to-[#1a73e8] text-white shadow-2xs hover:from-[#135961] hover:to-[#1557b0] active:scale-95 shrink-0"
                title="Launch AI Optimization Assistant for manpower reallocation across bottleneck lines"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI Reallocation Assistant</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
                  AI
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('line-history', formData.lineNo)}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-xs font-bold text-[#176f78] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="View multi-day efficiency trend & recharts curve"
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Efficiency History</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsDirectoryModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:text-[#17343a] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Open Directory of All Lines"
            >
              <Layers className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Line Directory ({sortedLines.length})</span>
            </button>

            {isMasterAdmin && (
              <button
                type="button"
                onClick={handleOpenAddLineModal}
                className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Add New Sewing Line"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
            )}
          </div>
        </div>

        {/* Smart Floor Intervention Callout Banner */}
        {(sortBy === 'bottleneck' || sortBy === 'critical' || (sortBy === 'efficiency' && sortDirection === 'asc')) && (
          <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 shadow-xs">
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-rose-950 flex flex-wrap items-center gap-2">
                  <span>Prioritizing Critical Floor Interventions</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-200 text-rose-900 font-mono font-bold uppercase">
                    {sortBy === 'bottleneck'
                      ? 'Bottleneck Status Sorting'
                      : sortBy === 'critical'
                      ? 'Compound Urgency Ranking'
                      : 'Lowest Efficiency First'}
                  </span>
                </div>
                <p className="text-[11px] text-rose-800 mt-0.5">
                  Shop-floor lines are ordered to surface critical bottlenecks, station cycle overruns, and underperforming efficiencies.
                  {interventionSummary.criticalBottlenecks > 0 && (
                    <strong className="ml-1 text-rose-950 font-bold">
                      {interventionSummary.criticalBottlenecks} lines with critical bottlenecks flagged.
                    </strong>
                  )}
                  {interventionSummary.lowEfficiency > 0 && (
                    <strong className="ml-1 text-amber-900 font-bold">
                      {interventionSummary.lowEfficiency} lines under 60% efficiency.
                    </strong>
                  )}
                </p>
              </div>
            </div>

            {interventionSummary.mostCriticalLine && interventionSummary.mostCriticalLine.lineNo !== selectedLineNo && (
              <button
                type="button"
                onClick={() => onSelectLineNo(interventionSummary.mostCriticalLine!.lineNo)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
              >
                <Flame className="w-3.5 h-3.5 text-amber-300" />
                <span>Jump to Line {interventionSummary.mostCriticalLine.lineNo} (Highest Severity)</span>
              </button>
            )}
          </div>
        )}

        {/* Capture Line Record Banner (Image 1 Header Banner) */}
        <div className="mt-5 p-4 rounded-2xl bg-white border border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="font-display text-base font-bold uppercase text-[#17343a]">
                Capture Line Record — Line {formData.lineNo}
              </div>
              <div className="text-xs text-[#527078]">
                {formData.floor} • Style: <strong className="text-[#17343a]">{formData.style}</strong> ({formData.buyer}) • SMV: <strong className="text-[#176f78]">{formData.smv} min</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIs8hBalancingModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full border border-[#176f78]/30 bg-[#dceceb] hover:bg-[#cde4e3] text-[#176f78] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs group touch-manipulation active:scale-95"
              title="Audit and Balance Working Minutes for Full 8h Shift"
            >
              <Clock className="w-3.5 h-3.5 text-[#176f78] group-hover:rotate-12 transition-transform" />
              <span>8h Shift Balancing</span>
              <span className="text-[9px] bg-[#176f78] text-white px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
                480m
              </span>
            </button>

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('line-history', formData.lineNo)}
                className="px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50 hover:bg-teal-100 text-[#176f78] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title={`View Historical Efficiency Trend for Line ${formData.lineNo}`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>History Chart</span>
              </button>
            )}

            <div className="px-3.5 py-1.5 rounded-full bg-[#eef7f7] border border-[#b2d8d8] flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#527078] uppercase">Efficiency:</span>
              <span className="font-display text-lg font-bold text-[#176f78] font-mono-numbers">
                {metrics.efficiencyPct}%
              </span>
            </div>

            {isMasterAdmin && onDeleteLine && (
              <button
                type="button"
                onClick={() => handleRequestDelete(currentLine)}
                className="px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title={`Delete Line ${formData.lineNo}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Line</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Efficiency</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#176f78] font-mono-numbers">
              {metrics.efficiencyPct}%
            </div>
            <span className="text-[10px] text-[#527078]">Target: {formData.targetEff}%</span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] relative group">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#527078] font-bold uppercase block">Output vs Target</span>
              {lineAccess.canEdit && (
                <button
                  type="button"
                  onClick={() => setQuickOutputLine(currentLine)}
                  title={`Quick Update Line ${currentLine.lineNo} Output`}
                  className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[9.5px] font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1"
                >
                  <Zap className="w-2.5 h-2.5 fill-white" />
                  <span>Quick Update</span>
                </button>
              )}
            </div>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {formData.achievedProd}
              <span className="text-xs text-[#527078] font-sans font-normal"> / {formData.targetProd}</span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
              {metrics.variancePcs >= 0 ? `+${metrics.variancePcs} pcs` : `${metrics.variancePcs} pcs`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Present Manpower</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {metrics.totalPresentMP}
              <span className="text-xs text-[#527078] font-sans font-normal"> MP</span>
            </div>
            <span className="text-[10px] text-rose-600 font-bold">
              {metrics.totalAbsentMP} Absent ({metrics.absenteeismPct}%)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
            <span className="text-[10px] text-[#527078] font-bold uppercase block">Produced Minutes</span>
            <div className="font-display text-xl sm:text-2xl font-bold text-[#17343a] font-mono-numbers">
              {metrics.standardProducedMinutes}
            </div>
            <span className="text-[10px] text-[#527078]">Avail: {metrics.availableMinutes} min</span>
          </div>
        </div>
      </div>

      {/* Line Telemetry Sections */}
      <form id="line-telemetry-sections" onSubmit={handleSave} className="space-y-4">
        {/* Section Navigation & Expand/Collapse Master Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#eef7f7] text-[#176f78]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#17343a] uppercase tracking-wide">
                Line Telemetry Logging Sections
              </span>
              <span className="text-[11px] text-[#527078] ml-2">
                ({Object.values(expandedSections).filter(Boolean).length} of 8 Open)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllSections}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] text-xs font-bold text-[#527078] hover:text-[#17343a] hover:bg-[#f1eee6] shadow-2xs transition-all cursor-pointer"
            >
              {isAllExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isAllExpanded ? "Collapse All Sections" : "Expand All Sections"}</span>
            </button>
          </div>
        </div>

        {/* ================= REAL-TIME LINE TELEMETRY: LIVE CYCLE TIMES, PRODUCTION RATES & WIP ================= */}
        <div className="rounded-2xl border border-[#b2d8d8] bg-[#f7fcfc] overflow-hidden shadow-xs">
          <div className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-[#b2d8d8] text-left">
            <div
              onClick={() => toggleSection('liveTelemetry')}
              className="flex items-center gap-3 flex-1 cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-[#dceceb] text-[#176f78] border border-[#b2d8d8] relative">
                <Radio className="w-5 h-5 animate-pulse text-[#176f78]" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Live Line Telemetry
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Real-Time Feed
                  </span>
                  <span className="text-[10px] font-mono text-[#527078] bg-[#f1eee6] px-2 py-0.5 rounded-md">
                    Line {formData.lineNo} • Updated {formData.liveTelemetry?.lastUpdated || 'Live'}
                  </span>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Direct input for real-time station cycle times, hourly production pacing run-rate, and stage-by-stage WIP balance levels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <div className="flex items-center gap-2 text-xs font-mono-numbers">
                <span className="px-2.5 py-1 rounded-full bg-[#eef7f7] text-[#176f78] font-bold border border-[#b2d8d8]">
                  {formData.liveTelemetry?.currentHourlyRatePcs || 0} pcs/hr
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 font-bold border border-amber-200">
                  WIP: {formData.liveTelemetry?.currentWipTotalPcs ?? formData.wip} pcs ({formData.liveTelemetry?.wipBufferHours ?? 1.5}h)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsQuickEntryModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer touch-manipulation active:scale-95"
                title="Open Floor Quick Entry Modal"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Quick Entry</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection('liveTelemetry')}
                className="p-1.5 rounded-lg text-[#527078] hover:bg-[#f1eee6] cursor-pointer transition-colors"
                title={expandedSections.liveTelemetry ? "Collapse Live Line Telemetry" : "Expand Live Line Telemetry"}
              >
                {expandedSections.liveTelemetry ? (
                  <ChevronUp className="w-4 h-4 text-[#527078]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#527078]" />
                )}
              </button>
            </div>
          </div>

          {expandedSections.liveTelemetry && (
            <div className="p-4 sm:p-5 space-y-5 text-xs">
              {/* Telemetry Core KPI Snapshot Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Live Cycle Time Pace */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#b2d8d8] shadow-2xs">
                  <div className="flex items-center justify-between text-[#527078] text-[11px] font-bold uppercase mb-1">
                    <span className="flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-[#176f78]" />
                      Average Cycle Time
                    </span>
                    <span className="text-[10px] font-mono text-[#176f78]">Pitch: {formData.liveTelemetry?.pitchTimeSec || 42}s</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">
                      {formData.liveTelemetry?.averageCycleTimeSec || 48}
                    </span>
                    <span className="text-xs text-[#527078]">sec / piece</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-[#527078]">Target: {formData.liveTelemetry?.targetCycleTimeSec || 44}s</span>
                    <span className={`font-bold ${
                      (formData.liveTelemetry?.averageCycleTimeSec || 0) <= (formData.liveTelemetry?.targetCycleTimeSec || 44)
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}>
                      {((formData.liveTelemetry?.averageCycleTimeSec || 48) - (formData.liveTelemetry?.targetCycleTimeSec || 44)) > 0
                        ? `+${(formData.liveTelemetry?.averageCycleTimeSec || 48) - (formData.liveTelemetry?.targetCycleTimeSec || 44)}s overrun`
                        : 'On Takt Target'}
                    </span>
                  </div>
                </div>

                {/* 2. Live Production Pacing Rate */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#b2d8d8] shadow-2xs">
                  <div className="flex items-center justify-between text-[#527078] text-[11px] font-bold uppercase mb-1">
                    <span className="flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-[#176f78]" />
                      Current Hourly Rate
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">Pacing</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-[#176f78] font-mono-numbers">
                      {formData.liveTelemetry?.currentHourlyRatePcs || 0}
                    </span>
                    <span className="text-xs text-[#527078]">pcs / hr</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-[#527078]">Target: {formData.liveTelemetry?.targetHourlyRatePcs || Math.round(formData.targetProd / (formData.workingHours || 8))} pcs</span>
                    <span className={`font-bold ${
                      (formData.liveTelemetry?.pacingVariancePcs || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                    }`}>
                      {(formData.liveTelemetry?.pacingVariancePcs || 0) >= 0
                        ? `+${formData.liveTelemetry?.pacingVariancePcs} pcs ahead`
                        : `${formData.liveTelemetry?.pacingVariancePcs} pcs deficit`}
                    </span>
                  </div>
                </div>

                {/* 3. Live WIP Buffer Hours */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#b2d8d8] shadow-2xs">
                  <div className="flex items-center justify-between text-[#527078] text-[11px] font-bold uppercase mb-1">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      Active Floor WIP
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800">
                      Buffer
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-amber-800 font-mono-numbers">
                      {formData.liveTelemetry?.currentWipTotalPcs ?? formData.wip}
                    </span>
                    <span className="text-xs text-[#527078]">pcs in line</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-[#527078]">Coverage:</span>
                    <span className="font-bold text-[#17343a] font-mono-numbers">
                      {formData.liveTelemetry?.wipBufferHours || 1.8} Hours Run
                    </span>
                  </div>
                </div>

                {/* 4. Instantaneous Run-Rate Forecast */}
                <div className="p-3.5 rounded-2xl bg-white border border-[#b2d8d8] shadow-2xs">
                  <div className="flex items-center justify-between text-[#527078] text-[11px] font-bold uppercase mb-1">
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      Run-Rate Forecast
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700">8h Proj</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-[#17343a] font-mono-numbers">
                      {Math.round((formData.liveTelemetry?.currentHourlyRatePcs || 0) * (formData.workingHours || 8))}
                    </span>
                    <span className="text-xs text-[#527078]">pcs / shift</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-[#527078]">Shift Target: {formData.targetProd}</span>
                    <span className={`font-bold ${
                      Math.round((formData.liveTelemetry?.currentHourlyRatePcs || 0) * (formData.workingHours || 8)) >= formData.targetProd
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }`}>
                      {Math.round(((formData.liveTelemetry?.currentHourlyRatePcs || 0) * (formData.workingHours || 8) / (formData.targetProd || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time Telemetry Controls: Production Rates & WIP Totals Input Row */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[#e7e1d5]">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#176f78]" />
                    <h3 className="font-bold text-[#17343a] uppercase text-xs tracking-wide">
                      Live Production Rates &amp; WIP Volume Telemetry Inputs
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#527078]">
                    Inputs instantly recalculate hourly run-rates, buffer health, and synchronization with Line {formData.lineNo}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Input 1: Current Hourly Production Rate */}
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1 flex items-center justify-between">
                      <span>Live Hourly Production Rate</span>
                      <span className="text-[10px] text-[#176f78] font-mono">Pcs / Hour</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={formData.liveTelemetry?.currentHourlyRatePcs ?? 0}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          const target = formData.liveTelemetry?.targetHourlyRatePcs || Math.round(formData.targetProd / (formData.workingHours || 8));
                          const variance = val - target;
                          const currentWip = formData.liveTelemetry?.currentWipTotalPcs ?? formData.wip;
                          const bufferHrs = val > 0 ? parseFloat((currentWip / val).toFixed(1)) : 0;
                          setFormData(prev => ({
                            ...prev,
                            liveTelemetry: {
                              ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                              currentHourlyRatePcs: val,
                              pacingVariancePcs: variance,
                              wipBufferHours: bufferHrs,
                              pacingStatus: val >= target ? 'on_pace' : val >= target * 0.85 ? 'behind' : 'critical_lag',
                              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-sm font-bold font-mono-numbers text-[#176f78] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-xs font-bold text-[#527078] shrink-0">pcs/hr</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#527078]">
                      <span>Extrapolated 8h Run:</span>
                      <strong className="text-[#17343a] font-mono-numbers">
                        {(formData.liveTelemetry?.currentHourlyRatePcs || 0) * (formData.workingHours || 8)} pcs
                      </strong>
                    </div>
                  </div>

                  {/* Input 2: Target Hourly Rate Pace */}
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1 flex items-center justify-between">
                      <span>Target Hourly Pace</span>
                      <span className="text-[10px] text-[#176f78] font-mono">Takt Standard</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={formData.liveTelemetry?.targetHourlyRatePcs ?? Math.round(formData.targetProd / (formData.workingHours || 8))}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 1;
                          const current = formData.liveTelemetry?.currentHourlyRatePcs ?? 0;
                          const variance = current - val;
                          setFormData(prev => ({
                            ...prev,
                            liveTelemetry: {
                              ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                              targetHourlyRatePcs: val,
                              pacingVariancePcs: variance,
                              pacingStatus: current >= val ? 'on_pace' : current >= val * 0.85 ? 'behind' : 'critical_lag',
                              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-sm font-bold font-mono-numbers text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-xs font-bold text-[#527078] shrink-0">target/hr</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#527078]">
                      <span>Hourly Pacing Variance:</span>
                      <strong className={`font-mono-numbers font-bold ${
                        (formData.liveTelemetry?.pacingVariancePcs || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {(formData.liveTelemetry?.pacingVariancePcs || 0) >= 0
                          ? `+${formData.liveTelemetry?.pacingVariancePcs} pcs`
                          : `${formData.liveTelemetry?.pacingVariancePcs} pcs`}
                      </strong>
                    </div>
                  </div>

                  {/* Input 3: Current Live WIP on Floor */}
                  <div className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1 flex items-center justify-between">
                      <span>Total In-Line WIP Level</span>
                      <span className="text-[10px] text-amber-700 font-mono font-bold">Active Buffer</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={formData.liveTelemetry?.currentWipTotalPcs ?? formData.wip}
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          const hourlyRate = formData.liveTelemetry?.currentHourlyRatePcs || Math.round(formData.targetProd / (formData.workingHours || 8)) || 1;
                          const bufferHrs = parseFloat((val / hourlyRate).toFixed(1));
                          const healthStatus = bufferHrs > 3.0 ? 'high_accumulation' : bufferHrs < 0.8 ? 'starvation_risk' : 'buffer_safe';
                          setFormData(prev => ({
                            ...prev,
                            wip: val, // also synchronize top-level WIP
                            liveTelemetry: {
                              ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                              currentWipTotalPcs: val,
                              wipBufferHours: bufferHrs,
                              wipHealthStatus: healthStatus,
                              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            }
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-sm font-bold font-mono-numbers text-amber-800 focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="text-xs font-bold text-[#527078] shrink-0">pcs</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px]">
                      <span className="text-[#527078]">Buffer Duration:</span>
                      <span className="font-bold text-[#17343a] font-mono-numbers">
                        {formData.liveTelemetry?.wipBufferHours || 1.8} Hours of Work
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Station-by-Station Live Cycle Times Table */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-[#176f78]" />
                    <h3 className="font-bold text-[#17343a] uppercase text-xs tracking-wide">
                      Station Live Cycle Time Observations &amp; Takt Synchronizer
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newStation: LiveStationCycleTime = {
                          stationId: `st-${Date.now()}`,
                          operationName: 'Operation Process',
                          operatorName: 'Sewing Operator',
                          observedCycleTimeSec: formData.liveTelemetry?.targetCycleTimeSec || 44,
                          standardCycleTimeSec: formData.liveTelemetry?.targetCycleTimeSec || 44,
                          pitchTimeSec: formData.liveTelemetry?.pitchTimeSec || 42,
                          status: 'optimal',
                          lastLoggedAt: 'Just now'
                        };
                        const currentStations = formData.liveTelemetry?.cycleTimeStations || [];
                        const updatedStations = [...currentStations, newStation];
                        const avgCT = Math.round(updatedStations.reduce((acc, s) => acc + s.observedCycleTimeSec, 0) / updatedStations.length);
                        const maxCT = Math.max(...updatedStations.map(s => s.observedCycleTimeSec));
                        setFormData(prev => ({
                          ...prev,
                          liveTelemetry: {
                            ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                            cycleTimeStations: updatedStations,
                            averageCycleTimeSec: avgCT,
                            bottleneckCycleTimeSec: maxCT,
                            lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                          }
                        }));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#eef7f7] hover:bg-[#dceceb] text-[#176f78] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Station</span>
                    </button>
                    <span className="text-[11px] text-[#527078]">
                      Pitch: <strong className="text-[#17343a] font-mono">{formData.liveTelemetry?.pitchTimeSec || 42}s</strong>
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#e7e1d5]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#fbfaf6] border-b border-[#e7e1d5] text-[#527078] text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Operation / Station</th>
                        <th className="py-2.5 px-3">Assigned Operator</th>
                        <th className="py-2.5 px-3 text-center">Observed Cycle (s)</th>
                        <th className="py-2.5 px-3 text-center">Standard Takt (s)</th>
                        <th className="py-2.5 px-3 text-center">Variance</th>
                        <th className="py-2.5 px-3 text-center">Pacing Status</th>
                        <th className="py-2.5 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {(formData.liveTelemetry?.cycleTimeStations || []).map((station, idx) => {
                        const varianceSec = station.observedCycleTimeSec - station.standardCycleTimeSec;
                        const isOverrun = varianceSec > 0;
                        const isCritical = varianceSec >= (station.standardCycleTimeSec * 0.2);

                        return (
                          <tr key={station.stationId || idx} className="hover:bg-[#fbfaf6] transition-colors">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={station.operationName}
                                onChange={e => {
                                  const name = e.target.value;
                                  const updated = (formData.liveTelemetry?.cycleTimeStations || []).map(s =>
                                    s.stationId === station.stationId ? { ...s, operationName: name } : s
                                  );
                                  setFormData(prev => ({
                                    ...prev,
                                    liveTelemetry: {
                                      ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                      cycleTimeStations: updated
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={station.operatorName}
                                onChange={e => {
                                  const op = e.target.value;
                                  const updated = (formData.liveTelemetry?.cycleTimeStations || []).map(s =>
                                    s.stationId === station.stationId ? { ...s, operatorName: op } : s
                                  );
                                  setFormData(prev => ({
                                    ...prev,
                                    liveTelemetry: {
                                      ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                      cycleTimeStations: updated
                                    }
                                  }));
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-[#d9d2c2] text-xs text-[#527078] bg-white"
                              />
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="0.5"
                                  value={station.observedCycleTimeSec}
                                  onChange={e => {
                                    const ctVal = parseFloat(e.target.value) || 0;
                                    const updated = (formData.liveTelemetry?.cycleTimeStations || []).map(s => {
                                      if (s.stationId === station.stationId) {
                                        const stat = ctVal > s.standardCycleTimeSec * 1.15 ? 'bottleneck' : ctVal < s.standardCycleTimeSec * 0.85 ? 'starved' : 'optimal';
                                        return { ...s, observedCycleTimeSec: ctVal, status: stat as any, lastLoggedAt: 'Just now' };
                                      }
                                      return s;
                                    });
                                    const avgCT = Math.round(updated.reduce((acc, s) => acc + s.observedCycleTimeSec, 0) / updated.length);
                                    const maxCT = Math.max(...updated.map(s => s.observedCycleTimeSec));
                                    setFormData(prev => ({
                                      ...prev,
                                      liveTelemetry: {
                                        ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                        cycleTimeStations: updated,
                                        averageCycleTimeSec: avgCT,
                                        bottleneckCycleTimeSec: maxCT,
                                        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                      }
                                    }));
                                  }}
                                  className={`w-20 px-2 py-1 rounded-lg border font-mono-numbers font-bold text-center ${
                                    isCritical
                                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                                      : isOverrun
                                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                                      : 'bg-white border-[#d9d2c2] text-[#17343a]'
                                  }`}
                                />
                                <span className="text-[10px] text-[#527078]">s</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="inline-flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  step="0.5"
                                  value={station.standardCycleTimeSec}
                                  onChange={e => {
                                    const stdVal = parseFloat(e.target.value) || 1;
                                    const updated = (formData.liveTelemetry?.cycleTimeStations || []).map(s =>
                                      s.stationId === station.stationId ? { ...s, standardCycleTimeSec: stdVal } : s
                                    );
                                    setFormData(prev => ({
                                      ...prev,
                                      liveTelemetry: {
                                        ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                        cycleTimeStations: updated
                                      }
                                    }));
                                  }}
                                  className="w-18 px-2 py-1 rounded-lg border border-[#d9d2c2] text-xs font-mono-numbers text-center bg-white"
                                />
                                <span className="text-[10px] text-[#527078]">s</span>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`font-mono-numbers text-xs font-bold ${
                                isCritical ? 'text-rose-700' : isOverrun ? 'text-amber-700' : 'text-emerald-700'
                              }`}>
                                {varianceSec > 0 ? `+${varianceSec.toFixed(1)}s` : `${varianceSec.toFixed(1)}s`}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : isOverrun
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}>
                                {isCritical ? 'Bottleneck' : isOverrun ? 'High CT' : 'Optimal Pace'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = (formData.liveTelemetry?.cycleTimeStations || []).filter(s => s.stationId !== station.stationId);
                                  const avgCT = updated.length > 0 ? Math.round(updated.reduce((acc, s) => acc + s.observedCycleTimeSec, 0) / updated.length) : 0;
                                  const maxCT = updated.length > 0 ? Math.max(...updated.map(s => s.observedCycleTimeSec)) : 0;
                                  setFormData(prev => ({
                                    ...prev,
                                    liveTelemetry: {
                                      ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                      cycleTimeStations: updated,
                                      averageCycleTimeSec: avgCT,
                                      bottleneckCycleTimeSec: maxCT
                                    }
                                  }));
                                }}
                                className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove Station Observation"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sub-Assembly Stage-by-Stage WIP Balancing Breakdown */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <h3 className="font-bold text-[#17343a] uppercase text-xs tracking-wide">
                      Stage-by-Stage Current In-Line WIP Buffer Balance
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#527078]">
                    Summed WIP: <strong className="text-amber-800 font-mono-numbers">{(formData.liveTelemetry?.wipStations || []).reduce((acc, st) => acc + st.wipPcs, 0)} pcs</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {(formData.liveTelemetry?.wipStations || []).map((stageItem, sIdx) => {
                    return (
                      <div key={stageItem.stage || sIdx} className="p-3 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] space-y-2">
                        <div className="text-[10px] font-bold uppercase text-[#17343a] truncate" title={stageItem.label}>
                          {stageItem.label}
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold uppercase text-[#527078] mb-0.5">WIP (Pcs)</label>
                          <input
                            type="number"
                            min="0"
                            value={stageItem.wipPcs}
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              const updatedWipStations = (formData.liveTelemetry?.wipStations || []).map(st =>
                                st.stage === stageItem.stage ? { ...st, wipPcs: val } : st
                              );
                              const totalSumWip = updatedWipStations.reduce((acc, st) => acc + st.wipPcs, 0);
                              const hourlyRate = formData.liveTelemetry?.currentHourlyRatePcs || Math.round(formData.targetProd / (formData.workingHours || 8)) || 1;
                              const bufferHrs = parseFloat((totalSumWip / hourlyRate).toFixed(1));

                              setFormData(prev => ({
                                ...prev,
                                wip: totalSumWip,
                                liveTelemetry: {
                                  ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                                  wipStations: updatedWipStations,
                                  currentWipTotalPcs: totalSumWip,
                                  wipBufferHours: bufferHrs,
                                  wipHealthStatus: bufferHrs > 3.0 ? 'high_accumulation' : bufferHrs < 0.8 ? 'starvation_risk' : 'buffer_safe',
                                  lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                }
                              }));
                            }}
                            className="w-full px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center text-xs bg-white text-[#17343a]"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-[#e7e1d5]">
                          <span className="text-[#527078]">Buffer:</span>
                          <span className="font-mono-numbers font-bold text-[#176f78]">
                            {formData.liveTelemetry?.currentHourlyRatePcs ? ((stageItem.wipPcs / Math.max(1, formData.liveTelemetry.currentHourlyRatePcs))).toFixed(1) : 0.3}h
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floor Observation Log & Timestamp Sign-off */}
              <div className="p-3 rounded-xl bg-white border border-[#d9d2c2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold uppercase text-[#527078] mb-1">
                    Live Floor Observation Notes &amp; IE Lead Remarks
                  </label>
                  <input
                    type="text"
                    value={formData.liveTelemetry?.telemetryNotes || ''}
                    onChange={e => {
                      const notes = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        liveTelemetry: {
                          ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                          telemetryNotes: notes
                        }
                      }));
                    }}
                    placeholder="e.g. Front placket folder needle swap complete; pacing recovering to 95 pcs/hr"
                    className="w-full px-3 py-1.5 rounded-lg border border-[#d9d2c2] text-xs text-[#17343a] bg-[#fbfaf6]"
                  />
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => setIsQuickEntryModalOpen(true)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs touch-manipulation active:scale-95"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Quick Entry Modal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      setFormData(prev => ({
                        ...prev,
                        liveTelemetry: {
                          ...(prev.liveTelemetry || generateDefaultLiveTelemetry(prev, metrics.totalPresentMP || 40, prev.workingHours || 8)),
                          lastUpdated: nowTime
                        }
                      }));
                      showToastNotification(`Telemetry timestamp refreshed: ${nowTime}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#b2d8d8] bg-[#eef7f7] hover:bg-[#dceceb] text-[#176f78] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#176f78]" />
                    <span>Sync Timestamp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 1. TOP 5 MEETING MONITORING ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('top5')}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#f3e8fd] text-[#7627bb] border border-[#e9d5ff]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Top 5 Meeting Monitoring
                  </h2>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Daily floor alignment, critical defect resolutions &amp; team attendance
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                formData.top5.held === 'yes' ? 'bg-[#f3e8fd] text-[#7627bb]' : 'bg-rose-100 text-rose-700'
              }`}>
                Status: {formData.top5.held.toUpperCase()} • {formData.top5.attendance}%
              </span>
              {expandedSections.top5 ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.top5 && (
            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-white border border-[#d9d2c2]">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#17343a] uppercase">Meeting Conducted?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, top5: { ...formData.top5, held: 'yes' } })}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                        formData.top5.held === 'yes'
                          ? 'bg-[#176f78] text-white shadow-xs'
                          : 'bg-[#f1eee6] text-[#527078]'
                      }`}
                    >
                      YES
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, top5: { ...formData.top5, held: 'no' } })}
                      className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                        formData.top5.held === 'no'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-[#f1eee6] text-[#527078]'
                      }`}
                    >
                      NO
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#527078] uppercase">Attendance %:</span>
                  <input
                    type="number"
                    value={formData.top5.attendance}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        top5: { ...formData.top5, attendance: parseInt(e.target.value) || 0 }
                      })
                    }
                    className="w-20 px-2.5 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                  <span>%</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1.5">
                  Top 5 Floor Review Items Discussed
                </label>
                <div className="space-y-1.5">
                  {formData.top5.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#f1eee6] text-[#17343a] font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const newItems = [...formData.top5.items];
                          newItems[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            top5: { ...formData.top5, items: newItems }
                          });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Meeting Resolution &amp; Supervisor Acknowledgement
                </label>
                <input
                  type="text"
                  value={formData.top5.notes || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      top5: { ...formData.top5, notes: e.target.value }
                    })
                  }
                  placeholder="Supervisor confirmed all actions acknowledged by batch chiefs"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= 2. LINE SETUP & PLANNING ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("planning")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#eef7f7] text-[#176f78] border border-[#c4e5e5]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Line Setup &amp; Planning
                  </h2>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  SMV, working hours, planned manpower, buyer &amp; style technical specifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#f1eee6] text-[#527078] font-bold">
                SMV {formData.smv}m • {smvWeight}
              </span>
              {expandedSections.planning ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.planning && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Line Number
                  </label>
                  <input
                    type="text"
                    value={formData.lineNo}
                    onChange={e => setFormData({ ...formData, lineNo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Floor Location
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={e => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Buyer / Customer
                  </label>
                  <input
                    type="text"
                    value={formData.buyer}
                    onChange={e => setFormData({ ...formData, buyer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Running Style Name
                  </label>
                  <input
                    type="text"
                    value={formData.style}
                    onChange={e => setFormData({ ...formData, style: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-[#17343a] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard Allowed Minutes (SMV)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={formData.smv}
                      onChange={e => setFormData({ ...formData, smv: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                    />
                    <span className="absolute right-3 top-2 text-[10px] font-bold uppercase text-[#527078]">
                      {smvWeight}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Shift Hours
                  </label>
                  <input
                    type="number"
                    value={formData.workingHours}
                    onChange={e => setFormData({ ...formData, workingHours: parseInt(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Target Eff %
                  </label>
                  <input
                    type="number"
                    value={formData.targetEff}
                    onChange={e => setFormData({ ...formData, targetEff: parseInt(e.target.value) || 80 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers text-[#176f78] font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Target Output (Pcs)
                  </label>
                  <input
                    type="number"
                    value={formData.targetProd}
                    onChange={e => setFormData({ ...formData, targetProd: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 3. PRODUCTION FLOW & HANDOFF ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("flowHandoff")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Production Flow &amp; Handoff
                  </h2>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Daily inputs, output pace, WIP buffer inventory, order progress &amp; pre-production technical handoff
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] font-bold">
                Output: {formData.achievedProd || formData.dailyOutput} / {formData.targetProd} pcs • WIP {formData.wip}
              </span>
              {expandedSections.flowHandoff ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.flowHandoff && (
            <div className="p-5 space-y-4 text-xs">
              {/* Core Output & WIP Flow Inputs */}
              <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17343a] uppercase text-xs">Floor Flow &amp; WIP Metrics</span>
                  <span className="text-[11px] text-[#527078]">
                    Buffer: {formData.targetProd > 0 ? (formData.wip / (formData.targetProd / (formData.workingHours || 8))).toFixed(1) : 0} hrs WIP
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Order Qty (Pcs)</label>
                    <input
                      type="number"
                      value={formData.orderQty}
                      onChange={e => setFormData({ ...formData, orderQty: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] font-mono-numbers"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Daily Input (Cut Pcs)</label>
                    <input
                      type="number"
                      value={formData.dailyInput}
                      onChange={e => setFormData({ ...formData, dailyInput: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] font-mono-numbers"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Daily Output (Passed Pcs)</label>
                    <input
                      type="number"
                      value={formData.dailyOutput}
                      onChange={e => setFormData({ ...formData, dailyOutput: parseInt(e.target.value) || 0, achievedProd: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Current WIP (In-Line)</label>
                    <input
                      type="number"
                      value={formData.wip}
                      onChange={e => setFormData({ ...formData, wip: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] font-mono-numbers font-bold text-amber-700"
                    />
                  </div>
                </div>

                {/* Style transition plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f1eee6]">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Next Style Transition</label>
                    <input
                      type="text"
                      value={formData.nextStyle || ''}
                      onChange={e => setFormData({ ...formData, nextStyle: e.target.value })}
                      placeholder="e.g. Mens Pique Polo 2026"
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">Next Style Loading Date</label>
                    <input
                      type="date"
                      value={formData.nextStyleDate || ''}
                      onChange={e => setFormData({ ...formData, nextStyleDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]"
                    />
                  </div>
                </div>
              </div>

              {/* Technical Line Handoff Scorecard & Protocols */}
              <div className="p-4 rounded-xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-[#176f78]" />
                    <h3 className="font-bold text-[#17343a] uppercase text-xs">
                      Pre-Production Technical Line Handoff Protocols
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-[#527078]">Handoff Readiness:</span>
                    <span className="px-2.5 py-0.5 rounded-full font-mono-numbers font-bold text-xs bg-[#eef7f7] text-[#176f78] border border-[#c4e5e5]">
                      {handoffScore}% Ready
                    </span>
                  </div>
                </div>

                {/* Checkpoint list */}
                <div className="space-y-2">
                  {handoffChecks.map(item => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-[#e7e1d5] bg-[#fbfaf6] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#17343a] text-xs">{item.item}</span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#f1eee6] text-[#527078]">
                            {item.responsible}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#527078] truncate mt-0.5">{item.standard}</p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setHandoffChecks(prev =>
                              prev.map(c => c.id === item.id ? { ...c, status: 'pass' } : c)
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            item.status === 'pass'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white border border-[#d9d2c2] text-[#527078] hover:bg-[#f1eee6]'
                          }`}
                        >
                          Pass
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHandoffChecks(prev =>
                              prev.map(c => c.id === item.id ? { ...c, status: 'pending' } : c)
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            item.status === 'pending'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white border border-[#d9d2c2] text-[#527078] hover:bg-[#f1eee6]'
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHandoffChecks(prev =>
                              prev.map(c => c.id === item.id ? { ...c, status: 'fail' } : c)
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                            item.status === 'fail'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-white border border-[#d9d2c2] text-[#527078] hover:bg-[#f1eee6]'
                          }`}
                        >
                          Fail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Handoff Signoff Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#f1eee6]">
                  {handoffSignoffs.map(sign => (
                    <div
                      key={sign.role}
                      onClick={() => {
                        setHandoffSignoffs(prev =>
                          prev.map(s =>
                            s.role === sign.role
                              ? { ...s, status: s.status === 'approved' ? 'pending' : 'approved', signedAt: new Date().toISOString().split('T')[0] }
                              : s
                          )
                        );
                      }}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        sign.status === 'approved'
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                          : 'bg-white border-[#d9d2c2] text-[#527078] hover:bg-[#fbfaf6]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] font-bold uppercase">{sign.title}</span>
                        {sign.status === 'approved' && <Check className="w-3 h-3 text-emerald-600" />}
                      </div>
                      <span className="text-[11px] font-bold block mt-0.5 truncate">{sign.signedByName}</span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md inline-block mt-1 ${
                        sign.status === 'approved' ? 'bg-emerald-200/80 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sign.status === 'approved' ? 'Signed Off' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 4. MANPOWER ALLOCATION & ABSENTEEISM : SHIFT WORKING MINUTES BALANCING ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <div className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-[#e7e1d5] text-left">
            <div
              onClick={() => toggleSection("manpowerBalancing")}
              className="flex items-center gap-3 flex-1 cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-[#fef7e0] text-[#b06000] border border-[#feefa3]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Manpower Allocation &amp; Absenteeism : Shift Working Minutes Balancing
                  </h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#dceceb] text-[#176f78] px-2 py-0.5 rounded-md">
                    480 Min Std
                  </span>
                  {shift8hBalance.signOff.isSignedOff && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-300">
                      Signed Off
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Operators, helpers, iron men, absenteeism rate, shift 480-minute working minutes reconciliation &amp; loss drains audit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#fef7e0] text-[#8c4600] font-bold">
                Present: {metrics.totalPresentMP} • Absent: {metrics.totalAbsentMP}
              </span>

              <button
                type="button"
                onClick={() => setIs8hBalancingModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer touch-manipulation active:scale-95"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Open Cockpit</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection("manpowerBalancing")}
                className="p-1 rounded-lg text-[#527078] hover:bg-[#f1eee6] cursor-pointer"
              >
                {expandedSections.manpowerBalancing ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {expandedSections.manpowerBalancing && (
            <div className="p-5 space-y-5 text-xs">
              {/* Part 1: Manpower Deployment Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Operator */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Machine Operators</span>
                    <span className="text-[10px] text-[#527078]">Core Sewing</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp.Operator.present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Operator: {
                                ...formData.mp.Operator,
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp.Operator.absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Operator: {
                                ...formData.mp.Operator,
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Helper */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Floor Helpers</span>
                    <span className="text-[10px] text-[#527078]">Bundles &amp; Trimming</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp.Helper.present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Helper: {
                                ...formData.mp.Helper,
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp.Helper.absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              Helper: {
                                ...formData.mp.Helper,
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Iron Man */}
                <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] space-y-2">
                  <div className="font-bold text-[#17343a] text-xs uppercase flex items-center justify-between">
                    <span>Iron Men / Pressers</span>
                    <span className="text-[10px] text-[#527078]">Intermediate Press</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-[#527078] block font-bold uppercase">Present</span>
                      <input
                        type="number"
                        value={formData.mp['Iron Man'].present}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              'Iron Man': {
                                ...formData.mp['Iron Man'],
                                present: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-600 block font-bold uppercase">Absent</span>
                      <input
                        type="number"
                        value={formData.mp['Iron Man'].absent}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            mp: {
                              ...formData.mp,
                              'Iron Man': {
                                ...formData.mp['Iron Man'],
                                absent: parseInt(e.target.value) || 0
                              }
                            }
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#d9d2c2] font-mono-numbers text-rose-600 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Absenteeism Mitigation Method & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#e7e1d5]">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Absenteeism Mitigation Method
                  </label>
                  <select
                    value={formData.balanceMethod}
                    onChange={e => setFormData({ ...formData, balanceMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs font-bold"
                  >
                    <option value="Overtime">Overtime (OT for critical stations)</option>
                    <option value="Borrowed from other line">Borrowed from Other Line / Training Pool</option>
                    <option value="Re-allocated from non-bottleneck">Re-allocated from Non-Bottleneck Process</option>
                    <option value="Float operator assigned">Multi-skilled Float Operator Assigned</option>
                    <option value="Buffer stock consumption">WIP Buffer Consumption</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Balancing Action Notes
                  </label>
                  <input
                    type="text"
                    value={formData.balanceNotes}
                    onChange={e => setFormData({ ...formData, balanceNotes: e.target.value })}
                    placeholder="e.g. 2 operators worked 1 hr OT to absorb backlog"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                  />
                </div>
              </div>

              {/* Part 2: Shift Working Minutes Balancing Metrics (480-minute standard) */}
              <div className="pt-3 border-t border-[#e7e1d5] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#17343a] uppercase text-xs flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#176f78]" />
                    480-Minute Shift Minutes Reconciliation &amp; Loss Drains
                  </span>
                  <button
                    type="button"
                    onClick={() => setIs8hBalancingModalOpen(true)}
                    className="text-xs font-bold text-[#176f78] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Balancing Cockpit</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                    <span className="text-[10px] text-[#527078] font-bold uppercase block tracking-wider">
                      Gross 8h Minutes
                    </span>
                    <div className="font-display text-xl font-bold text-[#17343a] font-mono-numbers mt-0.5">
                      {shift8hBalance.grossAvailableMinutes.toLocaleString()}
                      <span className="text-xs font-semibold text-[#527078] ml-1">min</span>
                    </div>
                    <span className="text-[10px] text-[#527078] mt-0.5 block">
                      {shift8hBalance.totalPresentMP} MP × 480 working min
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                    <span className="text-[10px] text-[#527078] font-bold uppercase block tracking-wider">
                      Earned Std Minutes
                    </span>
                    <div className="font-display text-xl font-bold text-[#176f78] font-mono-numbers mt-0.5">
                      {shift8hBalance.earnedStandardMinutes.toLocaleString()}
                      <span className="text-xs font-semibold text-[#527078] ml-1">min</span>
                    </div>
                    <span className="text-[10px] text-[#527078] mt-0.5 block">
                      {shift8hBalance.achievedProd8h} pcs × {shift8hBalance.smv} SMV
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                    <span className="text-[10px] text-[#527078] font-bold uppercase block tracking-wider">
                      8h Realized Efficiency
                    </span>
                    <div className={`font-display text-xl font-bold font-mono-numbers mt-0.5 ${
                      shift8hBalance.realizedShiftEfficiencyPct >= formData.targetEff
                        ? 'text-emerald-700'
                        : shift8hBalance.realizedShiftEfficiencyPct >= 65
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}>
                      {shift8hBalance.realizedShiftEfficiencyPct}%
                    </div>
                    <span className="text-[10px] text-[#527078] mt-0.5 block">
                      Target: {formData.targetEff}% ({shift8hBalance.targetProd8h} pcs)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#d9d2c2] shadow-2xs">
                    <span className="text-[10px] text-[#527078] font-bold uppercase block tracking-wider">
                      Post-8h OT Directive
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                        shift8hBalance.postShiftBalancing.deficitPcs === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : shift8hBalance.postShiftBalancing.requiresOvertime
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {shift8hBalance.postShiftBalancing.deficitPcs === 0 ? 'No OT Needed' : `${shift8hBalance.postShiftBalancing.recommendedOtMinutes}m OT Suggested`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#527078] mt-0.5 block">
                      {shift8hBalance.postShiftBalancing.deficitPcs === 0
                        ? 'Daily quota achieved'
                        : `Deficit: ${shift8hBalance.postShiftBalancing.deficitPcs} pcs`}
                    </span>
                  </div>
                </div>

                {/* Minute Loss Breakdown Highlights */}
                <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                  <div>
                    <h3 className="font-display text-xs font-bold uppercase text-[#17343a]">
                      Shop-Floor Working Minutes Drains (480-Minute Variance Audit)
                    </h3>
                    <p className="text-[11px] text-[#527078]">
                      Realized working minutes lost across sewing, mechanical stoppage, and balancing starved stations
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 text-center font-mono-numbers">
                    <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200">
                      <span className="text-[9px] font-bold text-rose-700 uppercase block">Balancing Delay</span>
                      <span className="font-bold text-xs text-rose-800">{shift8hBalance.lostMinutes.lineBalancingDelayMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200">
                      <span className="text-[9px] font-bold text-amber-700 uppercase block">Needle Stops</span>
                      <span className="font-bold text-xs text-amber-800">{shift8hBalance.lostMinutes.needleDowntimeMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-orange-50/60 border border-orange-200">
                      <span className="text-[9px] font-bold text-orange-700 uppercase block">Machine Stops</span>
                      <span className="font-bold text-xs text-orange-800">{shift8hBalance.lostMinutes.machineBreakdownMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-indigo-50/60 border border-indigo-200">
                      <span className="text-[9px] font-bold text-indigo-700 uppercase block">Material Waiting</span>
                      <span className="font-bold text-xs text-indigo-800">{shift8hBalance.lostMinutes.materialFeedingDelayMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-pink-50/60 border border-pink-200">
                      <span className="text-[9px] font-bold text-pink-700 uppercase block">Quality Rework</span>
                      <span className="font-bold text-xs text-pink-800">{shift8hBalance.lostMinutes.reworkAndAlterationMinutes}m</span>
                    </div>
                    <div className="p-2 rounded-xl bg-teal-50/60 border border-teal-200">
                      <span className="text-[9px] font-bold text-teal-700 uppercase block">Huddle &amp; Setup</span>
                      <span className="font-bold text-xs text-teal-800">{shift8hBalance.lostMinutes.morningBriefingAndSetupMinutes}m</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= 5. BOTTLENECK ANALYSIS & BALANCING ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection('bottleneck')}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Bottleneck Analysis &amp; Balancing
                  </h2>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Pacing station study, takt vs observed cycle times &amp; line balancing action
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold">
                {formData.bottleneck.station || 'Critical'} • {formData.bottleneck.cycleTime}s
              </span>
              {expandedSections.bottleneck ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.bottleneck && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Critical Bottleneck Station Name
                  </label>
                  <input
                    type="text"
                    value={formData.bottleneck.station}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        bottleneck: { ...formData.bottleneck, station: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold text-[#17343a]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Observed Cycle Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bottleneck.cycleTime}
                    onChange={e => {
                      const ct = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        bottleneck: { ...formData.bottleneck, cycleTime: ct }
                      });
                      handleBalancingParamChange('maxCTSeconds', ct);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Target Cycle Time (sec)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bottleneck.targetCT}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        bottleneck: {
                          ...formData.bottleneck,
                          targetCT: parseFloat(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Corrective Action Taken at Station
                </label>
                <input
                  type="text"
                  value={formData.bottleneck.action}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      bottleneck: { ...formData.bottleneck, action: e.target.value }
                    })
                  }
                  placeholder="e.g. Assigned senior multi-skilled operator & added guide attachment"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= 6. TIME / PRODUCTION STUDY'S ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => toggleSection("timeStudy")}
            className="w-full p-4 flex items-center justify-between bg-white border-b border-[#e7e1d5] text-left hover:bg-[#fbfaf6] transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Time / Production Study's
                  </h2>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Stopwatch audit, standard vs observed output rate &amp; operator rating
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#e0f2fe] text-[#0369a1] font-bold">
                Study: {formData.timeStudy.done.toUpperCase()} • {formData.timeStudy.observedRate} pcs/h
              </span>
              {expandedSections.timeStudy ? (
                <ChevronUp className="w-4 h-4 text-[#527078]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#527078]" />
              )}
            </div>
          </button>

          {expandedSections.timeStudy && (
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Study Conducted
                  </label>
                  <select
                    value={formData.timeStudy.done}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: { ...formData.timeStudy, done: e.target.value as any }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-bold cursor-pointer"
                  >
                    <option value="yes">YES - Full Study Completed</option>
                    <option value="partial">PARTIAL - Sample Audit Only</option>
                    <option value="no">NO - Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Study Type
                  </label>
                  <select
                    value={formData.timeStudy.type}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: { ...formData.timeStudy, type: e.target.value as any }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] cursor-pointer"
                  >
                    <option value="time">Time Study (Snap-back / Continuous)</option>
                    <option value="production">Production Study (Output Log)</option>
                    <option value="both">Both (Time &amp; Motion Analysis)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Observed Rate (Pcs / Hr)
                  </label>
                  <input
                    type="number"
                    value={formData.timeStudy.observedRate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: {
                          ...formData.timeStudy,
                          observedRate: parseInt(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard Target Rate (Pcs / Hr)
                  </label>
                  <input
                    type="number"
                    value={formData.timeStudy.standardRate}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        timeStudy: {
                          ...formData.timeStudy,
                          standardRate: parseInt(e.target.value) || 0
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] font-mono-numbers font-bold text-[#176f78]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  IE Findings &amp; Motion Waste Observations
                </label>
                <input
                  type="text"
                  value={formData.timeStudy.findings || ''}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      timeStudy: { ...formData.timeStudy, findings: e.target.value }
                    })
                  }
                  placeholder="e.g. Material handling delay accounts for 4.2s per garment"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2]"
                />
              </div>
            </div>
          )}
        </div>

        {/* ================= 7. LINE BUILD-UP & LEARNING CURVE TRACKING ================= */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] overflow-hidden shadow-xs">
          <div className="w-full p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white border-b border-[#e7e1d5] text-left">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleSection("learningCurve")}
                className="p-2.5 rounded-xl bg-[#176f78] text-white shadow-xs hover:bg-[#125860] cursor-pointer shrink-0"
              >
                <TrendingUp className="w-5 h-5" />
              </button>
              <div onClick={() => toggleSection("learningCurve")} className="cursor-pointer">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-base sm:text-lg font-bold uppercase text-[#17343a]">
                    Line Build-Up &amp; Learning Curve Tracking
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#176f78] text-white">
                    Period: 6 Days
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Import &amp; Updateable
                  </span>
                </div>
                <p className="text-xs text-[#527078] mt-0.5">
                  Import/export CSV telemetry, update daily targets &amp; actual logs, and adjust line build-up ramp
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono-numbers px-2.5 py-1 rounded-full bg-[#dceceb] text-[#176f78] font-bold">
                Day {lc.currentDay} of 6 • Target {getProgressionTargetEff(lc.currentDay, lc.styleNature, smvWeight)}%
              </span>

              {/* Import Telemetry Button */}
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-[#17343a] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#224b53] cursor-pointer"
                title="Import 6-Day Curve & Build-Up Telemetry from CSV or Excel"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>Import Telemetry</span>
              </button>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportTelemetry}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#176f78] font-bold text-xs flex items-center gap-1.5 shadow-2xs hover:bg-[#f1eee6] cursor-pointer"
                title="Export Line Telemetry Log to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* Sync Targets Button */}
              <button
                type="button"
                onClick={handleRecalculateTargets}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#d9d2c2] text-[#527078] hover:text-[#17343a] font-bold text-xs flex items-center gap-1 shadow-2xs hover:bg-[#f1eee6] cursor-pointer"
                title="Recalculate targets from Style Progression matrix"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProgressionModal(true)}
                className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#125860] cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>40-Day</span>
              </button>

              <button
                type="button"
                onClick={() => toggleSection("learningCurve")}
                className="p-1 rounded-lg text-[#527078] hover:bg-[#f1eee6] cursor-pointer ml-1"
              >
                {expandedSections.learningCurve ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {expandedSections.learningCurve && (
            <div className="p-5 space-y-4 text-xs">
              {/* Style Nature & Weight Configuration Banner */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold uppercase text-[#17343a]">
                      Garment Style Classification &amp; 6-Day Period Rule
                    </h3>
                    <p className="text-[11px] text-[#527078]">
                      Automatically looks up efficiency targets from the Style Progression Chart (Image 4)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowProgressionModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:bg-[#125860] cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>View Full 40-Day Chart</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Style Nature Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Style Nature
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleStyleNatureChange('new')}
                        className={`p-2.5 rounded-xl text-center font-bold transition-all ${
                          lc.styleNature === 'new'
                            ? 'bg-[#176f78] text-white shadow-xs'
                            : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                        }`}
                      >
                        New Style
                        <span className="block text-[10px] font-normal opacity-80">Initial Run</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStyleNatureChange('repeat')}
                        className={`p-2.5 rounded-xl text-center font-bold transition-all ${
                          lc.styleNature === 'repeat'
                            ? 'bg-[#8c531b] text-white shadow-xs'
                            : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                        }`}
                      >
                        Repeat Style
                        <span className="block text-[10px] font-normal opacity-80">&le; 3 Months</span>
                      </button>
                    </div>
                  </div>

                  {/* SMV Weight Classification */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      SMV Weight Category
                    </label>
                    <div className="p-2.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#17343a] capitalize">{smvWeight} weight</div>
                        <div className="text-[10px] text-[#527078]">
                          {smvWeight === 'light' ? '0 - 30 Min' : smvWeight === 'medium' ? '31 - 60 Min' : '>61 Min'}
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-md text-[11px] font-mono-numbers font-bold bg-white text-[#176f78] border border-[#d9d2c2]">
                        {formData.smv} min SMV
                      </span>
                    </div>
                  </div>

                  {/* Current Learning Curve Day */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Current Period Day (1 to 6)
                    </label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5, 6].map(dayNum => (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => handleUpdateLearningCurve({ currentDay: dayNum })}
                          className={`flex-1 py-2 rounded-xl font-mono-numbers font-bold text-center transition-all ${
                            lc.currentDay === dayNum
                              ? 'bg-[#17343a] text-white shadow-xs ring-2 ring-[#176f78]'
                              : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
                          }`}
                        >
                          D{dayNum}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Rule Banner from Image 4 */}
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[#fff8e8] border border-[#f5e0b0] text-[11px] text-[#8c531b]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Standard Rule:</strong> If any style input starts again within 3 months in the same line, it is considered a <strong>Repeat Style</strong> (higher target curve on Days 1-5). Learning curve ramp-up period is standardized to <strong>6 days</strong> before reaching normal operations.
                  </div>
                </div>
              </div>

              {/* LINE BUILD-UP RAMP-UP & OPERATOR ALLOCATION TELEMETRY CARD */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e7e1d5]">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#dceceb] text-[#176f78]">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-bold uppercase text-[#17343a]">
                        Line Build-Up Ramp-Up &amp; Operator Allocation Telemetry
                      </h4>
                      <p className="text-[11px] text-[#527078]">
                        Progressive loading stage, planned vs achieved ramp efficiency, and active workstation manpower
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono-numbers ${
                      (formData.buildUp.achievedPct ?? 50) >= (formData.buildUp.plannedPct ?? 50)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      Ramp Status: {(formData.buildUp.achievedPct ?? 50) >= (formData.buildUp.plannedPct ?? 50) ? 'On Target / Ahead' : 'Ramp Lag'} (
                      {(formData.buildUp.achievedPct ?? 50) - (formData.buildUp.plannedPct ?? 50) >= 0 ? '+' : ''}
                      {(formData.buildUp.achievedPct ?? 50) - (formData.buildUp.plannedPct ?? 50)}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {/* Build-Up Stage Day */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Build-Up Stage / Day
                    </label>
                    <select
                      value={formData.buildUp.day || '1'}
                      onChange={e => handleUpdateBuildUp({ day: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                    >
                      <option value="1">Day 1 - Initial Feeder Ramp</option>
                      <option value="2">Day 2 - Sub-Assembly Loading</option>
                      <option value="3">Day 3 - Line Balancing</option>
                      <option value="4">Day 4 - Output Stabilization</option>
                      <option value="5">Day 5 - Peak Speed Tuning</option>
                      <option value="6">Day 6 - Standard Steady State</option>
                      <option value="stable">Full Steady Production</option>
                    </select>
                  </div>

                  {/* Planned Ramp Efficiency % */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Planned Ramp Eff %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.buildUp.plannedPct ?? 50}
                        onChange={e => handleUpdateBuildUp({ plannedPct: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#176f78] focus:ring-1 focus:ring-[#176f78]"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-[#527078]">%</span>
                    </div>
                  </div>

                  {/* Achieved Ramp Efficiency % */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                      Achieved Ramp Eff %
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.buildUp.achievedPct ?? 50}
                        onChange={e => handleUpdateBuildUp({ achievedPct: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-emerald-800 focus:ring-1 focus:ring-emerald-600"
                      />
                      <span className="absolute right-3 top-2 text-xs font-bold text-[#527078]">%</span>
                    </div>
                  </div>

                  {/* Allocated Build-Up Operators */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold uppercase text-[#527078]">
                        Allocated Operators
                      </label>
                      <button
                        type="button"
                        onClick={() => handleUpdateBuildUp({ operators: metrics.totalPresentMP || 36 })}
                        className="text-[10px] text-[#176f78] hover:underline font-bold"
                      >
                        Use MP ({metrics.totalPresentMP})
                      </button>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={formData.buildUp.operators ?? metrics.totalPresentMP}
                      onChange={e => handleUpdateBuildUp({ operators: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                    />
                  </div>
                </div>

                {/* Build-Up Stage Notes */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Build-Up Floor Observations &amp; Balancing Notes
                  </label>
                  <input
                    type="text"
                    value={formData.buildUp.notes || ''}
                    onChange={e => handleUpdateBuildUp({ notes: e.target.value })}
                    placeholder="e.g. Day 1 initial feeder loading completed, front placket operator required cross-training"
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              {/* 6-Day Period Progression Visual Comparison Bar Chart */}
              <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold uppercase text-[#17343a] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#176f78]" />
                    <span>6-Day Learning Curve Progression (Planned vs Achieved Efficiency)</span>
                  </h4>
                  <div className="flex items-center gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-[#176f78]" />
                      <span className="text-[#527078]">Planned Target</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                      <span className="text-[#527078]">Achieved Output</span>
                    </div>
                  </div>
                </div>

                {/* Bar Grid for the 6 Days */}
                <div className="grid grid-cols-6 gap-2 pt-2 border-t border-[#e7e1d5]">
                  {lc.history.slice(0, 6).map((item) => {
                    const isCurrent = lc.currentDay === item.day;
                    const maxPercent = 85; // scale height
                    const plannedHeight = Math.min(100, (item.plannedEff / maxPercent) * 100);
                    const achievedHeight = Math.min(100, ((item.achievedEff || 0) / maxPercent) * 100);

                    return (
                      <div
                        key={item.day}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                          isCurrent
                            ? 'bg-[#eef7f7] border-[#176f78] shadow-xs'
                            : 'bg-[#fbfaf6] border-[#d9d2c2]'
                        }`}
                      >
                        <div className="text-center w-full">
                          <span className={`text-[10px] font-bold block ${
                            isCurrent ? 'text-[#176f78]' : 'text-[#527078]'
                          }`}>
                            Day {item.day}
                          </span>
                          {isCurrent && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-[#176f78] text-white uppercase inline-block">
                              Active
                            </span>
                          )}
                        </div>

                        {/* Dual Bar Display */}
                        <div className="w-full h-24 flex items-end justify-center gap-1.5 py-1">
                          {/* Planned Bar */}
                          <div
                            style={{ height: `${plannedHeight}%` }}
                            className="w-3.5 sm:w-4 bg-[#176f78] rounded-t-sm transition-all relative group cursor-pointer"
                            title={`Planned: ${item.plannedEff}% (${item.plannedQty} pcs)`}
                          />
                          {/* Achieved Bar */}
                          <div
                            style={{ height: `${achievedHeight}%` }}
                            className={`w-3.5 sm:w-4 rounded-t-sm transition-all cursor-pointer ${
                              item.achievedEff >= item.plannedEff
                                ? 'bg-emerald-500'
                                : item.achievedEff > 0
                                ? 'bg-amber-500'
                                : 'bg-slate-200'
                            }`}
                            title={`Achieved: ${item.achievedEff}% (${item.achievedQty} pcs)`}
                          />
                        </div>

                        {/* Efficiency Labels */}
                        <div className="text-center text-[10px] font-mono-numbers">
                          <span className="text-[#176f78] font-bold block">{item.plannedEff}%</span>
                          <span className={`${
                            item.achievedEff >= item.plannedEff
                              ? 'text-emerald-700 font-bold'
                              : item.achievedEff > 0
                              ? 'text-amber-700'
                              : 'text-slate-400'
                          }`}>
                            {item.achievedEff > 0 ? `${item.achievedEff}%` : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Day-by-Day Interactive Telemetry & Logging Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-[#17343a]">
                      6-Day Interactive Telemetry Log (Direct Inline Editing)
                    </span>
                    <span className="text-[10px] text-[#527078]">
                      Click and edit planned efficiency %, targets, actual output pcs, or notes
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsTelemetryModalOpen(true)}
                    className="text-xs text-[#176f78] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Import from CSV/Excel</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-[#d9d2c2] rounded-2xl bg-white shadow-xs">
                  <table className="w-full text-center text-xs border-collapse">
                    <thead className="bg-[#f1eee6] border-b border-[#d9d2c2] text-[11px] font-bold text-[#17343a]">
                      <tr>
                        <th className="p-2.5 border-r border-[#e7e1d5] w-24">Period Day</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7] w-28">Planned Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#eef7f7] w-32">Planned Target Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea] w-32">Achieved Log Pcs</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] bg-[#e6f4ea] w-28">Achieved Eff %</th>
                        <th className="p-2.5 border-r border-[#e7e1d5] w-28">Variance (Pcs / %)</th>
                        <th className="p-2.5 border-r border-[#e7e1d5]">Daily Floor Notes &amp; Observations</th>
                        <th className="p-2.5 w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7e1d5]">
                      {lc.history.slice(0, 6).map((item, idx) => {
                        const isCurrent = lc.currentDay === item.day;
                        const isAhead = (item.variancePcs || 0) >= 0;

                        return (
                          <tr
                            key={item.day}
                            className={`hover:bg-[#fbfaf6] ${isCurrent ? 'bg-[#f0f9f9]' : ''}`}
                          >
                            <td className="p-2.5 border-r border-[#e7e1d5] font-bold text-[#17343a]">
                              <button
                                type="button"
                                onClick={() => handleUpdateLearningCurve({ currentDay: item.day })}
                                className="hover:text-[#176f78] cursor-pointer"
                                title="Click to set as current active day"
                              >
                                Day - {item.day}
                              </button>
                              {isCurrent && (
                                <span className="block text-[9px] text-[#176f78] uppercase font-bold">Active Today</span>
                              )}
                            </td>

                            {/* Editable Planned Eff % */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#eef7f7]/30">
                              <div className="relative flex items-center justify-center">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={item.plannedEff}
                                  onChange={e => handleUpdateDayField(idx, 'plannedEff', e.target.value)}
                                  className="w-20 px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center bg-white text-[#176f78] focus:ring-1 focus:ring-[#176f78]"
                                  title="Edit planned efficiency %"
                                />
                                <span className="text-[10px] text-[#527078] ml-1 font-bold">%</span>
                              </div>
                            </td>

                            {/* Editable Target Pcs */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#eef7f7]/30">
                              <input
                                type="number"
                                min="0"
                                value={item.plannedQty}
                                onChange={e => handleUpdateDayField(idx, 'plannedQty', e.target.value)}
                                className="w-24 px-2 py-1 rounded-lg border border-[#d9d2c2] font-mono-numbers font-bold text-center bg-white text-[#17343a] focus:ring-1 focus:ring-[#176f78]"
                                title="Edit planned quantity target"
                              />
                            </td>

                            {/* Editable Achieved Output Log Pcs */}
                            <td className="p-1.5 border-r border-[#e7e1d5] bg-[#e6f4ea]/30">
                              <input
                                type="number"
                                min="0"
                                value={item.achievedQty || ''}
                                onChange={e => handleUpdateDayField(idx, 'achievedQty', e.target.value)}
                                placeholder="Log pcs"
                                className="w-24 px-2 py-1 rounded-lg border border-emerald-300 font-mono-numbers font-bold text-center bg-white text-emerald-900 focus:ring-1 focus:ring-emerald-500"
                                title="Enter actual achieved quantity"
                              />
                            </td>

                            {/* Achieved Eff % (Auto-calculated) */}
                            <td className="p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold text-emerald-800 bg-[#e6f4ea]/30">
                              {item.achievedEff > 0 ? `${item.achievedEff}%` : '—'}
                            </td>

                            {/* Variance (Pcs / %) */}
                            <td className={`p-2.5 border-r border-[#e7e1d5] font-mono-numbers font-bold ${
                              item.achievedQty === 0 ? 'text-slate-400' : isAhead ? 'text-emerald-700' : 'text-rose-600'
                            }`}>
                              {item.achievedQty === 0 ? (
                                '—'
                              ) : (
                                <span>
                                  {isAhead ? `+${item.variancePcs}` : `${item.variancePcs}`} pcs
                                  <span className="block text-[10px] font-normal opacity-85">
                                    ({isAhead ? `+${item.variancePct}` : `${item.variancePct}`}%)
                                  </span>
                                </span>
                              )}
                            </td>

                            {/* Editable Daily Notes */}
                            <td className="p-1.5 border-r border-[#e7e1d5] text-left">
                              <input
                                type="text"
                                value={item.notes || ''}
                                onChange={e => handleUpdateDayField(idx, 'notes', e.target.value)}
                                placeholder="IE observations, motor replacements, feeding notes..."
                                className="w-full px-2.5 py-1 rounded-lg border border-[#d9d2c2] text-xs text-[#17343a] bg-white focus:ring-1 focus:ring-[#176f78]"
                              />
                            </td>

                            {/* Status */}
                            <td className="p-2.5">
                              {item.achievedQty === 0 ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  Pending
                                </span>
                              ) : isAhead ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  On Track
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                  Behind
                                </span>
                              )}
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

        {/* General Remarks & Save Actions */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
              General Line Remarks &amp; IE Lead Handover Summary
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5]">
            <div className="text-xs text-[#527078]">
              {saveToast && (
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold animate-bounce">
                  <CheckCircle2 className="w-4 h-4" />
                  Line {formData.lineNo} telemetry &amp; 6-day learning curve saved successfully!
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!lineAccess.canEdit}
              title={!lineAccess.canEdit ? (lineAccess.reason || 'View-Only under Debonair RBAC policy') : 'Save Line Data'}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all ${
                lineAccess.canEdit
                  ? 'bg-[#176f78] text-white hover:bg-[#12555c] cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed border border-slate-300'
              }`}
            >
              {lineAccess.canEdit ? <Save className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{lineAccess.canEdit ? 'Save Line Data' : 'View-Only (Scope Restricted)'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Weekly Efficiency Trend — Line {formData.lineNo} */}
      <div className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] p-4 sm:p-5 shadow-xs">
        <LineEfficiencySparkline
          line={formData}
          allLines={lines}
          currentEfficiency={metrics.efficiencyPct}
          targetEfficiency={formData.targetEff || 85}
          onNavigateHistory={onNavigate ? (lineNo) => onNavigate('line-history', lineNo) : undefined}
        />
      </div>

      {/* Full 40-Day Style Progression Chart Modal - Lazy Loaded */}
      {showProgressionModal && (
        <React.Suspense fallback={null}>
          <StyleProgressionModal
            isOpen={showProgressionModal}
            onClose={() => setShowProgressionModal(false)}
            activeSMVWeight={smvWeight}
            activeStyleNature={lc.styleNature}
          />
        </React.Suspense>
      )}

      {/* Telemetry Import Modal - Lazy Loaded */}
      {isTelemetryModalOpen && (
        <React.Suspense fallback={null}>
          <TelemetryImportModal
            isOpen={isTelemetryModalOpen}
            onClose={() => setIsTelemetryModalOpen(false)}
            onApplyTelemetry={handleApplyImportedTelemetry}
            lineNo={formData.lineNo}
            smv={formData.smv}
            totalMP={metrics.totalPresentMP || 40}
            workingHours={formData.workingHours || 8}
          />
        </React.Suspense>
      )}

      {/* Quick Entry Modal for Line Telemetry - Lazy Loaded */}
      {isQuickEntryModalOpen && (
        <React.Suspense fallback={null}>
          <TelemetryQuickEntryModal
            isOpen={isQuickEntryModalOpen}
            onClose={() => setIsQuickEntryModalOpen(false)}
            line={formData}
            canEdit={lineAccess.canEdit}
            readOnlyReason={lineAccess.reason}
            onSaveQuickTelemetry={(updated) => {
              setFormData(updated);
              if (onSaveLine) onSaveLine(updated);
              showToastNotification(`Line ${updated.lineNo} telemetry & WIP updated from Quick Entry!`);
            }}
          />
        </React.Suspense>
      )}

      {/* Full 8-Hour Shift Working Minutes Balancing & Reconciliation Modal - Lazy Loaded */}
      {is8hBalancingModalOpen && (
        <React.Suspense fallback={null}>
          <WorkingMinutesBalancingModal
            isOpen={is8hBalancingModalOpen}
            onClose={() => setIs8hBalancingModalOpen(false)}
            line={formData}
            lines={lines}
            onSelectLineNo={onSelectLineNo}
            onSaveLine={(updated) => {
              setFormData(updated);
              if (onSaveLine) onSaveLine(updated);
            }}
            profile={profile}
          />
        </React.Suspense>
      )}

      {/* Add New Line Modal */}
      {isMasterAdmin && isAddLineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full border border-[#d9d2c2] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5]">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#dceceb] text-[#176f78]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Add New Sewing Line
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Configure line allocation, manpower targets, style parameters, and IE balancing.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLineModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#f1eee6] text-[#527078] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLineSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Line Number / Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 35 or 18-B"
                    value={addLineNo}
                    onChange={e => setAddLineNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Floor / Module Unit
                  </label>
                  <select
                    value={addFloor}
                    onChange={e => setAddFloor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  >
                    <option value="Padma Floor">Padma (Floor 1)</option>
                    <option value="Meghna Floor">Meghna (Floor 2)</option>
                    <option value="Karnophuli Floor">Karnophuli (Floor 3)</option>
                    <option value="Korotoya Floor">Korotoya (Floor 4)</option>
                    <option value="Shitalokshya Floor">Shitalokshya (Floor 5)</option>
                    <option value="Turag Floor">Turag (Floor 6)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Buyer / Brand Account
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. H&M, Target, Zara"
                    value={addBuyer}
                    onChange={e => setAddBuyer(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Active Garment Style
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Polo Shirt Classic"
                    value={addStyle}
                    onChange={e => setAddStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Standard SMV (Min)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={addSmv}
                    onChange={e => setAddSmv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Planned Shift Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="16"
                    value={addWorkingHours}
                    onChange={e => setAddWorkingHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Target Efficiency %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={addTargetEff}
                    onChange={e => setAddTargetEff(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                    Initial Floor WIP (Pcs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addWip}
                    onChange={e => setAddWip(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs font-mono-numbers text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                  />
                </div>
              </div>

              {/* Manpower Allocation breakdown */}
              <div className="p-3 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] space-y-2">
                <span className="text-[11px] font-bold uppercase text-[#527078] block">
                  Planned Manpower Allocation
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-[#527078]">Operators</label>
                    <input
                      type="number"
                      min="1"
                      value={addOperators}
                      onChange={e => setAddOperators(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#527078]">Helpers</label>
                    <input
                      type="number"
                      min="0"
                      value={addHelpers}
                      onChange={e => setAddHelpers(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#527078]">Iron Man</label>
                    <input
                      type="number"
                      min="0"
                      value={addIronMan}
                      onChange={e => setAddIronMan(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-mono-numbers font-bold"
                    />
                  </div>
                </div>
                <div className="text-[11px] text-[#176f78] font-bold pt-1">
                  Total Planned MP: {(parseInt(addOperators, 10) || 0) + (parseInt(addHelpers, 10) || 0) + (parseInt(addIronMan, 10) || 0)} Operators &amp; Helpers
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#527078] mb-1">
                  Remarks / Commissioning Note
                </label>
                <input
                  type="text"
                  value={addRemarks}
                  onChange={e => setAddRemarks(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7e1d5]">
                <button
                  type="button"
                  onClick={() => setIsAddLineModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create &amp; Select Line</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isMasterAdmin && isDeleteConfirmOpen && lineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#d9d2c2] shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                  Delete Sewing Line {lineToDelete.lineNo}?
                </h3>
                <p className="text-xs text-[#527078]">
                  This action permanently removes this line from the factory dataset.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fbfaf6] border border-[#e7e1d5] text-xs space-y-1.5 text-[#527078]">
              <div><strong>Style:</strong> <span className="text-[#17343a]">{lineToDelete.style}</span></div>
              <div><strong>Buyer:</strong> <span className="text-[#17343a]">{lineToDelete.buyer}</span></div>
              <div><strong>Floor:</strong> <span className="text-[#17343a]">{lineToDelete.floor}</span></div>
              <div><strong>Output:</strong> <span className="text-[#17343a]">{lineToDelete.achievedProd} / {lineToDelete.targetProd} pcs</span></div>
              <div>
                <strong>Efficiency:</strong> <span className="text-[#176f78] font-bold">{lineToDelete.efficiency}%</span> • <strong>WIP:</strong> <span className="text-[#17343a] font-bold">{lineToDelete.wip ?? 0} pcs</span>
              </div>
            </div>

            <p className="text-xs text-rose-700 bg-rose-50/80 p-2.5 rounded-xl border border-rose-200/60">
              Warning: All hourly logs, manpower allocations, bottleneck takt records, and Top 5 data for Line {lineToDelete.lineNo} will be removed.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7e1d5]">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setLineToDelete(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#527078] hover:bg-[#f1eee6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* All Lines Directory Table Modal */}
      {isDirectoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-[#d9d2c2] shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7e1d5] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#dceceb] text-[#176f78]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold uppercase text-[#17343a]">
                    Factory Sewing Lines Directory
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Overview of all {sortedLines.length} lines sorted by {sortBy.toUpperCase()} ({sortDirection.toUpperCase()}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isMasterAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDirectoryModalOpen(false);
                      handleOpenAddLineModal();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Line</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDirectoryModalOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#f1eee6] text-[#527078] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter and Search Bar inside Directory */}
            <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#527078]" />
                <input
                  type="text"
                  placeholder="Filter by Line #, Buyer, Style or Floor..."
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2] text-xs text-[#17343a] focus:outline-none focus:ring-1 focus:ring-[#176f78]"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-[11px] font-bold text-[#527078]">Priority Sort:</span>
                {/* Bottleneck Sort */}
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'bottleneck') {
                      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                    } else {
                      setSortBy('bottleneck');
                      setSortDirection('desc');
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    sortBy === 'bottleneck'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-[#f1eee6] text-rose-800 border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                  title="Sort by Bottleneck Status (Critical First)"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Bottleneck {sortBy === 'bottleneck' ? (sortDirection === 'desc' ? '⚠️ Crit' : '✓ OK') : ''}</span>
                </button>

                {/* Efficiency Sort */}
                <button
                  type="button"
                  onClick={() => {
                    if (sortBy === 'efficiency') {
                      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                    } else {
                      setSortBy('efficiency');
                      setSortDirection('asc'); // Lowest first for interventions
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    sortBy === 'efficiency'
                      ? sortDirection === 'asc'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                  title="Sort by Efficiency % (Lowest First for floor intervention)"
                >
                  <Percent className="w-3 h-3" />
                  <span>Efficiency {sortBy === 'efficiency' ? (sortDirection === 'asc' ? '🚨 Low' : '🏆 High') : ''}</span>
                </button>

                {/* WIP Sort */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('wip');
                    setSortDirection(prev => (sortBy === 'wip' && prev === 'desc' ? 'asc' : 'desc'));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    sortBy === 'wip'
                      ? 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                >
                  WIP Level {sortBy === 'wip' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                </button>

                {/* Line No Sort */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('lineNo');
                    setSortDirection(prev => (sortBy === 'lineNo' && prev === 'asc' ? 'desc' : 'asc'));
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                    sortBy === 'lineNo'
                      ? 'bg-[#176f78] text-white border-[#176f78]'
                      : 'bg-[#f1eee6] text-[#527078] border-[#d9d2c2] hover:bg-[#e7e1d5]'
                  }`}
                >
                  Line # {sortBy === 'lineNo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-y-auto flex-1 border border-[#e7e1d5] rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f1eee6] sticky top-0 text-[#17343a] text-[11px] font-bold uppercase tracking-wider border-b border-[#d9d2c2]">
                  <tr>
                    <th
                      className="p-3 cursor-pointer hover:text-[#176f78]"
                      onClick={() => {
                        setSortBy('lineNo');
                        setSortDirection(prev => (sortBy === 'lineNo' && prev === 'asc' ? 'desc' : 'asc'));
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        Line # {sortBy === 'lineNo' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                      </span>
                    </th>
                    <th className="p-3">Floor / Unit</th>
                    <th className="p-3">Buyer &amp; Style</th>
                    <th className="p-3 text-right">SMV</th>
                    <th className="p-3 text-right">Planned MP</th>
                    <th className="p-3 text-right">Output / Target</th>
                    <th
                      className="p-3 text-right cursor-pointer hover:text-[#176f78]"
                      onClick={() => {
                        if (sortBy === 'efficiency') {
                          setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
                        } else {
                          setSortBy('efficiency');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1 justify-end">
                        Efficiency {sortBy === 'efficiency' ? (sortDirection === 'asc' ? '🚨 Low' : '🏆 High') : '↕'}
                      </span>
                    </th>
                    <th
                      className="p-3 cursor-pointer hover:text-rose-700"
                      onClick={() => {
                        if (sortBy === 'bottleneck') {
                          setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
                        } else {
                          setSortBy('bottleneck');
                          setSortDirection('desc');
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Bottleneck Status {sortBy === 'bottleneck' ? (sortDirection === 'desc' ? '⚠️ Crit' : '✓ OK') : '↕'}
                      </span>
                    </th>
                    <th
                      className="p-3 text-right cursor-pointer hover:text-[#176f78]"
                      onClick={() => {
                        setSortBy('wip');
                        setSortDirection(prev => (sortBy === 'wip' && prev === 'desc' ? 'asc' : 'desc'));
                      }}
                    >
                      <span className="inline-flex items-center gap-1 justify-end">
                        WIP Level {sortBy === 'wip' ? (sortDirection === 'desc' ? '↓' : '↑') : ''}
                      </span>
                    </th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e1d5]">
                  {sortedLines
                    .filter(l => {
                      if (!directorySearch) return true;
                      const q = directorySearch.toLowerCase();
                      return (
                        l.lineNo.toLowerCase().includes(q) ||
                        l.buyer.toLowerCase().includes(q) ||
                        l.style.toLowerCase().includes(q) ||
                        l.floor.toLowerCase().includes(q)
                      );
                    })
                    .map(line => {
                      const isCurrent = line.lineNo === selectedLineNo;
                      const bn = getBottleneckSeverity(line);

                      return (
                        <tr
                          key={line.id}
                          className={`hover:bg-[#fbfaf6] transition-colors relative group/row ${
                            isCurrent
                              ? 'bg-[#eef7f7]/60 font-semibold'
                              : bn.status === 'critical' && sortBy === 'bottleneck'
                              ? 'bg-rose-50/50'
                              : ''
                          }`}
                        >
                          <td className="p-3 font-bold text-[#17343a]">
                            <span className="inline-flex items-center gap-1.5">
                              Line {line.lineNo}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-[#176f78] text-white">
                                  Active
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="p-3 text-[#527078] text-[11px]">{line.floor}</td>
                          <td className="p-3">
                            <div className="font-bold text-[#17343a]">{line.style}</div>
                            <div className="text-[11px] text-[#527078]">{line.buyer}</div>
                          </td>
                          <td className="p-3 text-right font-mono-numbers text-[#176f78]">
                            {line.smv}m
                          </td>
                          <td className="p-3 text-right font-mono-numbers text-[#527078]">
                            {line.plannedMP}
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <div className="flex items-center justify-end gap-1.5">
                              <div>
                                <span className="font-bold text-[#17343a]">{line.achievedProd}</span>
                                <span className="text-[#527078]"> / {line.targetProd}</span>
                              </div>
                              {checkLineAccess(profile, roleTiers || DEFAULT_ROLE_TIERS, line.lineNo).canEdit && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickOutputLine(line);
                                  }}
                                  title={`Quick Update Achieved Output for Line ${line.lineNo}`}
                                  className="p-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center opacity-85 hover:opacity-100"
                                >
                                  <Zap className="w-3 h-3 fill-white" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              line.efficiency >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : line.efficiency >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {line.efficiency}%
                            </span>
                          </td>
                          {/* Bottleneck Status Column */}
                          <td className="p-3">
                            {bn.status === 'critical' ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  <span>Critical ({bn.cycleTime}s vs {bn.targetCT}s)</span>
                                </span>
                                <div className="text-[10px] text-rose-800 truncate max-w-[170px]" title={bn.station}>
                                  {bn.station}
                                </div>
                              </div>
                            ) : bn.status === 'high' ? (
                              <div className="space-y-0.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                  <span>High Cycle ({bn.cycleTime}s)</span>
                                </span>
                                <div className="text-[10px] text-[#527078] truncate max-w-[170px]" title={bn.station}>
                                  {bn.station}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Balanced</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-mono-numbers">
                            <span className={`font-bold ${
                              (line.wip ?? 0) > 350
                                ? 'text-rose-600'
                                : (line.wip ?? 0) > 220
                                ? 'text-amber-600'
                                : 'text-[#17343a]'
                            }`}>
                              {line.wip ?? 0} pcs
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectLineNo(line.lineNo);
                                  setIsDirectoryModalOpen(false);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#f1eee6] hover:bg-[#dceceb] text-[#176f78] text-xs font-bold transition-colors cursor-pointer"
                              >
                                Select
                              </button>
                              {checkLineAccess(profile, roleTiers || DEFAULT_ROLE_TIERS, line.lineNo).canEdit && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setQuickOutputLine(line);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer inline-flex items-center gap-1 active:scale-95"
                                  title={`Quick Update Achieved Output for Line ${line.lineNo}`}
                                >
                                  <Zap className="w-3 h-3 fill-white" />
                                  <span>Quick Update</span>
                                </button>
                              )}
                              {isMasterAdmin && onDeleteLine && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestDelete(line)}
                                  className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                  title={`Delete Line ${line.lineNo}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
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

      {/* Quick Output Update Compact Modal */}
      {quickOutputLine && (
        <QuickOutputUpdateModal
          line={quickOutputLine}
          isOpen={!!quickOutputLine}
          onClose={() => setQuickOutputLine(null)}
          onSave={(updated) => {
            onSaveLine(updated);
            if (updated.lineNo === selectedLineNo) {
              setFormData(prev => ({
                ...prev,
                achievedProd: updated.achievedProd,
                dailyOutput: updated.dailyOutput,
                efficiency: updated.efficiency
              }));
            }
            setQuickOutputLine(null);
            setToastNotification(`Line ${updated.lineNo} output updated to ${updated.achievedProd} pcs (${updated.efficiency}%)`);
          }}
        />
      )}

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#17343a] text-white shadow-xl text-xs font-bold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastNotification}</span>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="ml-2 text-white/60 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
