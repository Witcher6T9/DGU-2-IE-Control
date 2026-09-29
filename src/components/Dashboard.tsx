/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  AlertTriangle,
  Users,
  Layers,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  RotateCw,
  FileSpreadsheet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  LayoutGrid,
  Upload,
  Zap,
  Sparkles,
  Check,
  CheckCheck,
  Activity,
  X,
  Sliders,
  Folder,
  FolderOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays
} from 'lucide-react';
import { LineEntry, DashboardLayout, UserProfile, RoleTier, ChecklistMap, ChecklistStatus, FactoryIndustryProfile } from '../types';
import { calculateFactoryOverall, calculateLineMetrics } from '../utils';
import { DailyProductivityInsights } from './DailyProductivityInsights';
import { MorningHuddleTimer } from './MorningHuddleTimer';
import { QuickReportsWidget } from './QuickReportsWidget';
import { CustomDateSelector } from './CustomDateSelector';
import { ProductionFloorDropdown, matchesProductionFloor } from './ProductionFloorSelector';
import { ROLE_TIERS, normalizeChecklistStatuses, CHECKLIST_TASK_COUNT } from '../mockData';
import { isMasterAdminOrAdmin } from '../utils/rbac';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardKpiCard, HourlyKpiPoint, HistoricalKpiPoint } from './DashboardKpiCard';
import { KpiDrillDownModal } from './KpiDrillDownModal';
import { ContextAwareFab, FabTabId } from './ContextAwareFab';

interface DashboardProps {
  lines: LineEntry[];
  todayDate: string;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  onInitializeDateLines?: (date: string) => void;
  layout: DashboardLayout;
  onNavigate: (tab: string, lineNo?: string) => void;
  onSelectLine: (lineNo: string) => void;
  checklistCompletion: number;
  checklistCounts?: {
    done: number;
    pending: number;
    notDone: number;
    total: number;
  };
  profile?: UserProfile;
  onOpenUserModal?: () => void;
  onOpenScorecard?: () => void;
  selectedLineNo?: string;
  onSaveLine?: (updatedLine: LineEntry) => void;
  onChecklistCompleted?: () => void;
  privacyMode?: boolean;
  roleTiers?: RoleTier[];
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  checklists?: ChecklistMap;
  onUpdateChecklistTask?: (date: string, idx: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist?: (date: string, statuses: ChecklistStatus[]) => void;
  onSaveMultipleLines?: (updatedLines: LineEntry[]) => void;
  factoryProfile?: FactoryIndustryProfile;
  onAddNewLine?: () => void;
  onOpenNewDowntime?: () => void;
  onOpenNewAction?: () => void;
  onOpenHourlyProduction?: () => void;
  activeTab?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  lines,
  todayDate,
  activeDate,
  onSelectDate,
  onInitializeDateLines,
  layout,
  onNavigate,
  onSelectLine,
  checklistCompletion,
  checklistCounts = { done: 0, pending: 25, notDone: 0, total: 25 },
  profile,
  onOpenUserModal,
  onOpenScorecard,
  selectedLineNo = '18',
  onSaveLine,
  onChecklistCompleted,
  privacyMode = false,
  roleTiers,
  onOpenDatabase,
  checklists,
  onUpdateChecklistTask,
  onBatchUpdateChecklist,
  onSaveMultipleLines,
  factoryProfile,
  onAddNewLine,
  onOpenNewDowntime,
  onOpenNewAction,
  onOpenHourlyProduction,
  activeTab
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const availableRoleTiers = roleTiers && roleTiers.length > 0 ? roleTiers : ROLE_TIERS;
  const currentTier =
    availableRoleTiers.find(t => t.id === (profile?.tierId || 'tier_0')) || availableRoleTiers[0];

  const effectiveDate = activeDate || todayDate;

  // Filter lines by selected date (deduplicating by lineNo fallback to ensure exact active lines count)
  const displayLines = React.useMemo(() => {
    const dayLines = lines.filter(l => l.date === effectiveDate);
    if (dayLines.length > 0) return dayLines;
    const map = new Map<string, LineEntry>();
    lines.forEach(l => {
      const key = String(l.lineNo).trim();
      if (!map.has(key) || (l.date && map.get(key)!.date && l.date > map.get(key)!.date)) {
        map.set(key, l);
      }
    });
    return Array.from(map.values());
  }, [lines, effectiveDate]);

  // Available production report dates with counts and shift metrics
  const availableReportDates = React.useMemo(() => {
    const datesMap = new Map<string, number>();
    lines.forEach(l => {
      if (l.date) {
        datesMap.set(l.date, (datesMap.get(l.date) || 0) + 1);
      }
    });
    // Ensure all 7 Debonair dates are shown
    ['2026-09-24', '2026-09-23', '2026-09-22', '2026-09-21', '2026-09-20', '2026-09-19', '2026-09-17'].forEach(d => {
      if (!datesMap.has(d)) datesMap.set(d, 34);
    });
    // Ensure effectiveDate is shown even if empty custom date
    if (effectiveDate && !datesMap.has(effectiveDate)) {
      datesMap.set(effectiveDate, 0);
    }
    return Array.from(datesMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, count]) => {
        const dateLines = lines.filter(l => (l.date || '2026-09-24') === date);
        const totalOutput = dateLines.reduce((s, l) => s + (l.dailyOutput || l.achievedProd || 0), 0);
        const avgEff = dateLines.length > 0
          ? (dateLines.reduce((s, l) => s + (l.efficiency || 0), 0) / dateLines.length)
          : 0;

        let label = date;
        let shiftTag = 'Shift';
        if (date === '2026-09-24') {
          label = '24-Sep (Day 6)';
          shiftTag = 'Day 6';
        } else if (date === '2026-09-23') {
          label = '23-Sep (Day 5)';
          shiftTag = 'Day 5';
        } else if (date === '2026-09-22') {
          label = '22-Sep (Day 4)';
          shiftTag = 'Day 4';
        } else if (date === '2026-09-21') {
          label = '21-Sep (Day 3)';
          shiftTag = 'Day 3';
        } else if (date === '2026-09-20') {
          label = '20-Sep (Day 2)';
          shiftTag = 'Day 2';
        } else if (date === '2026-09-19') {
          label = '19-Sep (Day 1)';
          shiftTag = 'Day 1';
        } else if (date === '2026-09-17') {
          label = '17-Sep (Regular)';
          shiftTag = 'Regular';
        } else if (date === todayDate) {
          label = `Today (${date})`;
          shiftTag = 'Today';
        }

        return {
          date,
          count,
          totalOutput,
          avgEff,
          label,
          shiftTag
        };
      });
  }, [lines, effectiveDate, todayDate]);

  // Date slider scroll reference & active index helper
  const dateSliderRef = React.useRef<HTMLDivElement>(null);
  const currentReportDateIdx = availableReportDates.findIndex(d => d.date === effectiveDate);
  const currentShiftItem = availableReportDates[currentReportDateIdx];
  const previousShiftItem = React.useMemo(() => {
    if (currentReportDateIdx < 0 || currentReportDateIdx >= availableReportDates.length - 1) {
      return null;
    }
    return availableReportDates[currentReportDateIdx + 1];
  }, [availableReportDates, currentReportDateIdx]);

  // Auto-scroll active date tab into view on change
  React.useEffect(() => {
    if (dateSliderRef.current && effectiveDate) {
      const activeBtn = dateSliderRef.current.querySelector(`[data-date-tab="${effectiveDate}"]`) as HTMLElement | null;
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [effectiveDate]);

  // Shift variance calculations (comparing active date with its predecessor)
  const shiftVariance = React.useMemo(() => {
    if (!currentShiftItem || !previousShiftItem || previousShiftItem.totalOutput === 0) return null;
    const outputDiff = currentShiftItem.totalOutput - previousShiftItem.totalOutput;
    const outputPct = (outputDiff / previousShiftItem.totalOutput) * 100;
    const effDiff = currentShiftItem.avgEff - previousShiftItem.avgEff;
    return {
      outputDiff,
      outputPct,
      effDiff,
      prevDateLabel: previousShiftItem.label,
      prevShiftTag: previousShiftItem.shiftTag
    };
  }, [currentShiftItem, previousShiftItem]);

  // Shift navigation actions
  const handleShiftNext = () => {
    // Next shift = newer date (lower array index)
    if (currentReportDateIdx > 0 && onSelectDate) {
      onSelectDate(availableReportDates[currentReportDateIdx - 1].date);
    }
  };

  const handleShiftPrev = () => {
    // Previous shift = older date (higher array index)
    if (currentReportDateIdx < availableReportDates.length - 1 && onSelectDate) {
      onSelectDate(availableReportDates[currentReportDateIdx + 1].date);
    }
  };

  const scrollDateSlider = (direction: 'left' | 'right') => {
    if (dateSliderRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      dateSliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const factory = calculateFactoryOverall(displayLines);

  // Live Ticking Clock (updates every second)
  const [liveDate, setLiveDate] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const timer = setInterval(() => {
      setLiveDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format live digital time: "11:46:16 AM"
  const formattedLiveTime = React.useMemo(() => {
    return liveDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }, [liveDate]);

  // Format full live date string: "Thursday, September 17, 2026"
  const formattedFullLiveDate = React.useMemo(() => {
    return liveDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, [liveDate]);

  // Dynamic Shift Progress calculation (08:00 - 17:00 shift)
  const shiftProgress = React.useMemo(() => {
    const hours = liveDate.getHours();
    const minutes = liveDate.getMinutes();
    const currentMinFromMidnight = hours * 60 + minutes;
    const shiftStartMin = 8 * 60; // 08:00
    const shiftEndMin = 17 * 60; // 17:00
    const totalShiftMin = shiftEndMin - shiftStartMin; // 540 min

    if (currentMinFromMidnight < shiftStartMin) {
      return {
        isBeforeShift: true,
        phaseName: 'Pre-Shift Line Preparation & Morning Top 5 Stand-Up',
        pct: 0,
        elapsedText: 'Pre-Shift (08:00 AM Start)',
        remainingText: 'Full 8h General Shift Ahead'
      };
    } else if (currentMinFromMidnight >= shiftEndMin) {
      return {
        isAfterShift: true,
        phaseName: 'Shift Completed • Evening IE Reconciliation',
        pct: 100,
        elapsedText: 'Full 8h Shift Completed',
        remainingText: 'General Shift Concluded'
      };
    } else {
      const elapsedMin = currentMinFromMidnight - shiftStartMin;
      const remainingMin = shiftEndMin - currentMinFromMidnight;
      const pct = Math.min(100, Math.round((elapsedMin / totalShiftMin) * 100));

      const elapsedH = Math.floor(elapsedMin / 60);
      const elapsedM = elapsedMin % 60;
      const remH = Math.floor(remainingMin / 60);
      const remM = remainingMin % 60;

      let phase = 'Active Sewing Output Run';
      if (elapsedMin < 60) phase = 'Hour 1 Target Pacing & Bottleneck Balancing';
      else if (elapsedMin < 240) phase = 'Peak Morning Production Drive';
      else if (elapsedMin < 300) phase = 'Mid-Shift Relief & Line Balancing';
      else if (elapsedMin < 480) phase = 'Afternoon Target Acceleration';
      else phase = 'Final Hour Output Reconciliation';

      return {
        phaseName: phase,
        pct,
        elapsedText: `${elapsedH}h ${elapsedM}m elapsed`,
        remainingText: `${remH}h ${remM}m remaining`
      };
    }
  }, [liveDate]);

  // Morning Huddle state & line status
  const [isHuddleOpen, setIsHuddleOpen] = React.useState(false);

  const activeLine = React.useMemo(() => {
    return lines.find(l => l.lineNo === selectedLineNo) || lines[0];
  }, [lines, selectedLineNo]);

  const hasHuddleToday = React.useMemo(() => {
    return lines.some(
      l => l.top5?.held === 'yes' || (l.remarks && l.remarks.toLowerCase().includes('huddle'))
    );
  }, [lines]);

  // Sync state & live timer for the 30s auto-update card
  const [syncTime, setSyncTime] = React.useState('07:22:20 AM');
  const [isSyncing, setIsSyncing] = React.useState(false);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date();
      setSyncTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
      setIsSyncing(false);
    }, 600);
  };

  // Quick Action States
  const [quickActionScope, setQuickActionScope] = React.useState<'active' | 'all'>('active');
  const [taktAuditedLineNos, setTaktAuditedLineNos] = React.useState<Set<string>>(new Set());
  const [isRefreshingChecklist, setIsRefreshingChecklist] = React.useState(false);
  const [quickActionToast, setQuickActionToast] = React.useState<{
    id: number;
    type: 'success' | 'info';
    title: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // Auto-dismiss Quick Action toast after 4.5 seconds
  React.useEffect(() => {
    if (!quickActionToast) return;
    const timer = setTimeout(() => {
      setQuickActionToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [quickActionToast]);

  // Active Line Real-time Takt & Pitch Calculations
  const workingHours = activeLine?.workingHours || 8;
  const targetProd = Math.max(1, activeLine?.targetProd || 1000);
  const taktSeconds = Math.max(1, Math.round((workingHours * 3600) / targetProd));
  const plannedMP = Math.max(1, activeLine?.plannedMP || 32);
  const lineSmv = activeLine?.smv || 14.5;
  const operatorPitchSeconds = Math.max(1, Math.round((lineSmv * 60) / plannedMP));
  const balanceEfficiencyRatio = Math.round((operatorPitchSeconds / taktSeconds) * 100);
  const isTaktVerified = taktAuditedLineNos.has(activeLine?.lineNo || '') || activeLine?.timeStudy?.done === 'yes';
  const isMeetingDone = activeLine?.top5?.held === 'yes';

  // 1. One-Click: Morning Meeting Done
  const handleQuickMorningMeetingDone = () => {
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (quickActionScope === 'all') {
      const updatedLines = displayLines.map(l => ({
        ...l,
        top5: {
          ...l.top5,
          held: 'yes' as const,
          notes: l.top5?.notes || 'Morning Top 5 alignment completed: hourly targets, bottleneck operations, and operator allocations verified.'
        },
        remarks: l.remarks
          ? (l.remarks.includes('Top 5') ? l.remarks : `${l.remarks} | Top 5 Done`)
          : 'Morning Top 5 meeting conducted with line supervisor.'
      }));

      if (onSaveMultipleLines) {
        onSaveMultipleLines(updatedLines);
      } else if (onSaveLine) {
        updatedLines.forEach(l => onSaveLine(l));
      }

      onChecklistCompleted?.();
      onUpdateChecklistTask?.(effectiveDate, 0, 'yes');
      onUpdateChecklistTask?.(effectiveDate, 6, 'yes');

      setQuickActionToast({
        id: Date.now(),
        type: 'success',
        title: 'Morning Meeting Done',
        message: `Top 5 stand-up verified for all ${displayLines.length} active lines. Daily targets & checklist synchronized.`,
        timestamp: timeLabel
      });
    } else {
      const updatedLine: LineEntry = {
        ...activeLine,
        top5: {
          ...activeLine.top5,
          held: 'yes',
          notes: activeLine.top5?.notes || 'Morning Top 5 alignment completed: hourly targets, bottleneck operations, and operator allocations verified.'
        },
        remarks: activeLine.remarks
          ? (activeLine.remarks.includes('Top 5') ? activeLine.remarks : `${activeLine.remarks} | Top 5 Done`)
          : 'Morning Top 5 meeting conducted with line supervisor.'
      };

      onSaveLine?.(updatedLine);
      onChecklistCompleted?.();
      onUpdateChecklistTask?.(effectiveDate, 0, 'yes');

      setQuickActionToast({
        id: Date.now(),
        type: 'success',
        title: 'Morning Meeting Done',
        message: `Top 5 stand-up logged for Line ${activeLine.lineNo} (${activeLine.style}). Target alignment recorded.`,
        timestamp: timeLabel
      });
    }
  };

  // 2. One-Click: Takt Time Check
  const handleQuickTaktTimeCheck = () => {
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (quickActionScope === 'all') {
      const updatedLines = displayLines.map(l => {
        const wHours = l.workingHours || 8;
        const tProd = Math.max(1, l.targetProd || 1000);
        const tSec = Math.max(1, Math.round((wHours * 3600) / tProd));
        const pMP = Math.max(1, l.plannedMP || 32);
        const lSmv = l.smv || 14.5;
        const pSec = Math.max(1, Math.round((lSmv * 60) / pMP));

        return {
          ...l,
          timeStudy: {
            done: 'yes' as const,
            type: 'both' as const,
            observedRate: pSec,
            standardRate: tSec,
            findings: `Takt Time verified: ${tSec}s/pc (Pitch: ${pSec}s/pc)`
          },
          remarks: l.remarks
            ? (l.remarks.includes('Takt') ? l.remarks : `${l.remarks} | Takt: ${tSec}s`)
            : `Takt Pace Verified: ${tSec}s/pc (${pSec}s pitch)`
        };
      });

      if (onSaveMultipleLines) {
        onSaveMultipleLines(updatedLines);
      } else if (onSaveLine) {
        updatedLines.forEach(l => onSaveLine(l));
      }

      onUpdateChecklistTask?.(effectiveDate, 1, 'yes');
      setTaktAuditedLineNos(prev => new Set([...prev, ...displayLines.map(l => l.lineNo)]));

      setQuickActionToast({
        id: Date.now(),
        type: 'success',
        title: 'Takt Time Check Complete',
        message: `Takt & pitch cadence audited across all ${displayLines.length} active lines. Line balancing tasks synchronized.`,
        timestamp: timeLabel
      });
    } else {
      const updatedLine: LineEntry = {
        ...activeLine,
        timeStudy: {
          done: 'yes',
          type: 'both',
          observedRate: operatorPitchSeconds,
          standardRate: taktSeconds,
          findings: `Takt Time verified: ${taktSeconds}s/pc vs Operator Pitch: ${operatorPitchSeconds}s/pc (${balanceEfficiencyRatio}% balance ratio)`
        },
        remarks: activeLine.remarks
          ? (activeLine.remarks.includes('Takt') ? activeLine.remarks : `${activeLine.remarks} | Takt: ${taktSeconds}s`)
          : `Takt Pace Verified: ${taktSeconds}s/pc (${operatorPitchSeconds}s pitch)`
      };

      onSaveLine?.(updatedLine);
      onUpdateChecklistTask?.(effectiveDate, 1, 'yes');
      setTaktAuditedLineNos(prev => new Set([...prev, activeLine.lineNo]));

      setQuickActionToast({
        id: Date.now(),
        type: 'success',
        title: 'Takt Time Check Verified',
        message: `Line ${activeLine.lineNo} cadence verified: ${taktSeconds}s takt pace vs ${operatorPitchSeconds}s operator pitch (${balanceEfficiencyRatio}% balance ratio).`,
        timestamp: timeLabel
      });
    }
  };

  // 3. One-Click: Checklist Refresh
  const handleQuickChecklistRefresh = () => {
    setIsRefreshingChecklist(true);
    const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setTimeout(() => {
      const currentStatuses = normalizeChecklistStatuses(checklists?.[effectiveDate]);
      const refreshed: ChecklistStatus[] = [...currentStatuses];

      // Auto-evaluate floor data against 13 IE tasks
      if (hasHuddleToday || isMeetingDone) refreshed[0] = 'yes';
      if (isTaktVerified || taktAuditedLineNos.size > 0) refreshed[1] = 'yes';
      if (Number(factory.overallEfficiency) >= 70) refreshed[2] = 'yes';
      if (Number(factory.overallEfficiency) >= 85) refreshed[3] = 'yes';
      refreshed[8] = 'yes';
      if (factory.attendanceRate >= 90) refreshed[9] = 'yes';

      onBatchUpdateChecklist?.(effectiveDate, refreshed);
      setIsRefreshingChecklist(false);

      setQuickActionToast({
        id: Date.now(),
        type: 'info',
        title: 'Checklist Refreshed',
        message: `All ${CHECKLIST_TASK_COUNT} IE floor tasks synchronized with live factory telemetry for ${effectiveDate}.`,
        timestamp: timeLabel
      });
    }, 450);
  };

  const formattedEyebrowDate = React.useMemo(() => {
    try {
      const d = new Date(todayDate);
      if (!isNaN(d.getTime())) {
        const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
        const day = d.getDate();
        const year = d.getFullYear();
        return `${month} ${day}, ${year}`;
      }
    } catch {}
    return 'SEP 17, 2026';
  }, [todayDate]);

  // Active Floor filter for Bottleneck Watchlist & Upcoming Style Changeovers
  const [selectedDashboardFloor, setSelectedDashboardFloor] = React.useState<string>('all');

  // Dynamic target baseline & variance
  const targetEffBaseline = displayLines.length > 10 ? 60.0 : 85.0;
  const effVariance = Math.round((factory.overallEfficiency - targetEffBaseline) * 10) / 10;
  const effVarianceText = effVariance >= 0 ? `+${effVariance}% vs ${targetEffBaseline}% Target` : `${effVariance}% vs ${targetEffBaseline}% Target`;
  const isEffPositive = effVariance >= 0;

  // Floor Level Aggregates (e.g. Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag)
  const floorSummaries = React.useMemo(() => {
    const map = new Map<string, {
      floor: string;
      lines: LineEntry[];
      targetProd: number;
      achievedProd: number;
      manpower: number;
      producedMin: number;
      availMin: number;
    }>();

    displayLines.forEach(l => {
      const fl = l.floor || 'Floor 01';
      if (!map.has(fl)) {
        map.set(fl, {
          floor: fl,
          lines: [],
          targetProd: 0,
          achievedProd: 0,
          manpower: 0,
          producedMin: 0,
          availMin: 0
        });
      }
      const entry = map.get(fl)!;
      entry.lines.push(l);
      entry.targetProd += l.targetProd;
      entry.achievedProd += l.achievedProd;
      entry.manpower += l.plannedMP;
      const m = calculateLineMetrics(l);
      entry.producedMin += m.standardProducedMinutes;
      entry.availMin += m.availableMinutes;
    });

    const CANONICAL_ORDER = [
      'Padma Floor',
      'Meghna Floor',
      'Karnophuli Floor',
      'Korotoya Floor',
      'Shitalokshya Floor',
      'Turag Floor'
    ];

    return Array.from(map.values())
      .map(e => {
        const eff = e.availMin > 0 ? Math.round((e.producedMin / e.availMin) * 1000) / 10 : 0;
        const variance = e.achievedProd - e.targetProd;
        return {
          ...e,
          efficiencyPct: eff,
          variancePcs: variance,
          lineNumbers: e.lines.map(l => l.lineNo)
        };
      })
      .sort((a, b) => {
        const idxA = CANONICAL_ORDER.findIndex(o => a.floor.toLowerCase().includes(o.split(' ')[0].toLowerCase()));
        const idxB = CANONICAL_ORDER.findIndex(o => b.floor.toLowerCase().includes(o.split(' ')[0].toLowerCase()));
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.floor.localeCompare(b.floor);
      });
  }, [displayLines]);

  // Circular gauge calculations
  const gaugeTheta = ((Math.min(checklistCompletion, 100) / 100) * 360 - 90) * (Math.PI / 180);
  const gaugeDotX = 50 + 38 * Math.cos(gaugeTheta);
  const gaugeDotY = 50 + 38 * Math.sin(gaugeTheta);

  // Hourly production simulation data
  const hourlyData = [
    { hour: '08-09', actual: 480, target: 550 },
    { hour: '09-10', actual: 560, target: 600 },
    { hour: '10-11', actual: 610, target: 600 },
    { hour: '11-12', actual: 630, target: 620 },
    { hour: '12-13', actual: 350, target: 400 }, // Lunch break shift transition
    { hour: '13-14', actual: 640, target: 620 },
    { hour: '14-15', actual: 670, target: 650 },
    { hour: '15-16', actual: 690, target: 660 },
    { hour: '16-17', actual: 210, target: 200 }
  ];

  // Active KPI drill-down modal state
  const [drillDownKpiId, setDrillDownKpiId] = React.useState<
    'efficiency' | 'production' | 'attendance' | 'wip_lines' | null
  >(null);

  // 7-Day Historical Performance Trends for all 4 KPIs
  const efficiencyHistorical = React.useMemo<HistoricalKpiPoint[]>(() => {
    return availableReportDates.slice().reverse().map(d => ({
      date: d.date,
      label: d.label.split(' ')[0],
      value: Math.round(d.avgEff * 10) / 10,
      formattedValue: `${Math.round(d.avgEff * 10) / 10}%`
    }));
  }, [availableReportDates]);

  const productionHistorical = React.useMemo<HistoricalKpiPoint[]>(() => {
    return availableReportDates.slice().reverse().map(d => ({
      date: d.date,
      label: d.label.split(' ')[0],
      value: d.totalOutput,
      formattedValue: `${d.totalOutput.toLocaleString()} pcs`
    }));
  }, [availableReportDates]);

  const attendanceHistorical = React.useMemo<HistoricalKpiPoint[]>(() => {
    return availableReportDates.slice().reverse().map((d, i) => {
      const val = 94.0 + (i % 3) * 1.2;
      return {
        date: d.date,
        label: d.label.split(' ')[0],
        value: Math.round(val * 10) / 10,
        formattedValue: `${Math.round(val * 10) / 10}%`
      };
    });
  }, [availableReportDates]);

  const wipHistorical = React.useMemo<HistoricalKpiPoint[]>(() => {
    return availableReportDates.slice().reverse().map((d, i) => {
      const val = Math.round((factory.totalWip || 8400) * (0.94 + (i % 4) * 0.03));
      return {
        date: d.date,
        label: d.label.split(' ')[0],
        value: val,
        formattedValue: `${val.toLocaleString()} pcs`
      };
    });
  }, [availableReportDates, factory.totalWip]);

  // Hourly Breakdown Comparisons for all 4 KPIs
  const productionHourlyBreakdown = React.useMemo<HourlyKpiPoint[]>(() => {
    return hourlyData.map(h => {
      const variance = h.actual - h.target;
      return {
        hour: h.hour,
        timeSlot: `${h.hour.replace('-', ':00 - ')}:00`,
        actual: h.actual,
        target: h.target,
        variance,
        status: h.actual >= h.target ? 'above' : h.actual >= h.target * 0.9 ? 'on_track' : 'below'
      };
    });
  }, [hourlyData]);

  const efficiencyHourlyBreakdown = React.useMemo<HourlyKpiPoint[]>(() => {
    return hourlyData.map(h => {
      const eff = Math.round((h.actual / (h.target || 1)) * (factory.overallEfficiency || 80) * 10) / 10;
      const targetEff = 85.0;
      return {
        hour: h.hour,
        timeSlot: `${h.hour.replace('-', ':00 - ')}:00`,
        actual: eff,
        target: targetEff,
        variance: Math.round((eff - targetEff) * 10) / 10,
        status: eff >= targetEff ? 'above' : eff >= targetEff * 0.9 ? 'on_track' : 'below'
      };
    });
  }, [hourlyData, factory.overallEfficiency]);

  const attendanceHourlyBreakdown = React.useMemo<HourlyKpiPoint[]>(() => {
    return hourlyData.map((h, i) => {
      const pres = Math.round(factory.totalPresent * (0.98 + (i % 2) * 0.02));
      return {
        hour: h.hour,
        timeSlot: `${h.hour.replace('-', ':00 - ')}:00`,
        actual: pres,
        target: factory.totalPresent,
        variance: pres - factory.totalPresent,
        status: 'on_track'
      };
    });
  }, [hourlyData, factory.totalPresent]);

  const wipHourlyBreakdown = React.useMemo<HourlyKpiPoint[]>(() => {
    const targetBuffer = Math.round(factory.totalWip * 0.95);
    return hourlyData.map((h, i) => {
      const act = Math.round(factory.totalWip * (0.92 + i * 0.016));
      return {
        hour: h.hour,
        timeSlot: `${h.hour.replace('-', ':00 - ')}:00`,
        actual: act,
        target: targetBuffer,
        variance: act - targetBuffer,
        status: act <= targetBuffer ? 'on_track' : 'below'
      };
    });
  }, [hourlyData, factory.totalWip]);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* EXECUTIVE OVERVIEW HEADER CARD: Live Clock & IE Command Pulse */}
      {/* ────────────────────────────────────────────────────────── */}
      {layout.showHero && (
        <section id="executive-overview-header-card" className="space-y-4">
          {/* Main Command Hero Container */}
          <div className="rounded-3xl bg-gradient-to-br from-[#103138] via-[#143e47] to-[#0c262b] bg-[#12363e] text-white border border-[#1b434b] p-5 sm:p-7 shadow-xl relative overflow-hidden space-y-6">
            {/* Ambient Subtle Glows */}
            <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl pointer-events-none" />

            {/* Top Row: Live Clock, Active Shift, User Role, and Telemetry Status */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 border-b border-white/10 pb-4 sm:pb-5 relative z-10">
              {/* Live Clock Section */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] sm:text-xs">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[9px] sm:text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE SHIFT</span>
                  </span>
                  <span className="text-sky-200/90 font-medium">
                    {formattedFullLiveDate}
                  </span>
                  <span className="text-white/30 hidden sm:inline">•</span>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300 block sm:inline w-full sm:w-auto">
                    {shiftProgress.phaseName}
                  </span>
                </div>

                {/* Big Digital Monospace Clock */}
                <div className="flex items-baseline justify-between sm:justify-start gap-2 sm:gap-3 flex-wrap">
                  <span
                    id="hero-live-clock-digits"
                    className="font-mono-numbers text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-none drop-shadow-xs"
                  >
                    {formattedLiveTime}
                  </span>
                  <div className="text-[11px] sm:text-xs text-sky-200/90 font-mono-numbers flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    <span>Shift: 8:00 AM - 5:00 PM</span>
                  </div>
                </div>

                {/* Dynamic Shift Progress Bar */}
                <div className="flex items-center gap-2 sm:gap-3 pt-1 max-w-md">
                  <div className="flex-1 h-2 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${shiftProgress.pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold font-mono-numbers text-sky-200/90 whitespace-nowrap">
                    {shiftProgress.pct}% ({shiftProgress.elapsedText})
                  </span>
                </div>
              </div>

              {/* Right: Operational Role & Sync Status */}
              <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-start lg:self-center justify-between sm:justify-start pt-1 sm:pt-0">
                <button
                  onClick={onOpenUserModal}
                  title="Click to view or switch Active System Role & Operational Tiers"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center"
                >
                  <span
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full text-white text-[8px] sm:text-[9px] font-black flex items-center justify-center shrink-0"
                    style={{ backgroundColor: currentTier.color }}
                  >
                    {currentTier.shortCode}
                  </span>
                  <span className="truncate">
                    Role: <strong className="font-mono text-teal-300">{currentTier.systemRole}</strong>
                  </span>
                </button>

                {/* Telemetry Auto-Update Badge */}
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-sky-100 shrink-0">
                  <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers">
                    Sync: {syncTime}
                  </span>
                  <button
                    onClick={handleManualSync}
                    title="Manual Floor Telemetry Ping"
                    className="p-0.5 sm:p-1 rounded-lg hover:bg-white/20 text-sky-200 hover:text-white transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSyncing ? 'animate-spin text-teal-300' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Hero Main Content: 2-Column Command Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
              {/* Column 1 (Left 7 Cols): Factory Operational Pulse & Output Progress */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300 block">
                    Executive Overview
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
                    Industrial Engineering Command Center
                  </h2>
                  <p className="text-xs text-sky-100/80 mt-1 max-w-xl">
                    Real-time sewing line tracking, dynamic takt pitch pace, in-line WIP buffer compliance, and 10-minute Top 5 morning alignment.
                  </p>
                </div>

                {/* Date Selector Slider / Folder Tab Bar for Switching Daily Production Datasets */}
                {onSelectDate && (
                  <div
                    id="dashboard-date-selector-bar"
                    className="w-full rounded-2xl bg-black/35 backdrop-blur-md border border-white/20 p-2.5 sm:p-3 shadow-xl transition-all space-y-2.5"
                  >
                    {/* Folder & Slider Top Control Header (Target Focus Element) */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 px-0.5 text-xs">
                      {/* Left: Folder Title, Active Shift Metrics & Day-over-Day Variance */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-500/25 border border-teal-400/40 text-teal-100 font-bold text-[11px] uppercase tracking-wider shadow-xs">
                          <FolderOpen className="w-3.5 h-3.5 text-teal-300" />
                          <span>Shift Folders</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-teal-400/30 text-[9.5px] font-mono font-black text-teal-200">
                            {availableReportDates.length}
                          </span>
                        </div>

                        {/* Active Shift Performance Snapshot */}
                        {currentShiftItem && (
                          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-[11px] text-sky-100 font-medium">
                            <span className="text-white/60">Shift:</span>
                            <span className="font-bold text-white">{currentShiftItem.shiftTag}</span>
                            {currentShiftItem.totalOutput > 0 && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className="font-mono-numbers font-bold text-teal-300">
                                  {currentShiftItem.totalOutput.toLocaleString()} pcs
                                </span>
                              </>
                            )}
                            {currentShiftItem.avgEff > 0 && (
                              <>
                                <span className="text-white/30">•</span>
                                <span className={`font-mono-numbers font-bold ${
                                  currentShiftItem.avgEff >= 80 ? 'text-emerald-300' : 'text-amber-300'
                                }`}>
                                  {currentShiftItem.avgEff.toFixed(1)}% Eff
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Day-over-Day Shift Variance Pill */}
                        {shiftVariance && (
                          <div
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10.5px] font-bold font-mono-numbers ${
                              shiftVariance.outputDiff >= 0
                                ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-200'
                                : 'bg-rose-500/20 border-rose-400/30 text-rose-200'
                            }`}
                            title={`Variance vs ${shiftVariance.prevDateLabel}: ${shiftVariance.outputDiff >= 0 ? '+' : ''}${shiftVariance.outputDiff.toLocaleString()} pcs (${shiftVariance.outputPct >= 0 ? '+' : ''}${shiftVariance.outputPct.toFixed(1)}%), ${shiftVariance.effDiff >= 0 ? '+' : ''}${shiftVariance.effDiff.toFixed(1)}% Eff`}
                          >
                            {shiftVariance.outputDiff >= 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-emerald-300 shrink-0" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-rose-300 shrink-0" />
                            )}
                            <span>
                              {shiftVariance.outputDiff >= 0 ? '+' : ''}{shiftVariance.outputDiff.toLocaleString()} pcs
                            </span>
                            <span className="text-white/50">|</span>
                            <span>
                              {shiftVariance.effDiff >= 0 ? '+' : ''}{shiftVariance.effDiff.toFixed(1)}%
                            </span>
                            <span className="text-[9px] font-normal text-white/70 hidden lg:inline">
                              vs {shiftVariance.prevShiftTag}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right: Date Shifter Controls (Prev/Next), Custom Picker & Latest Jump */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-between sm:justify-end">
                        {/* Quick Date Shifter Navigation: Previous & Next Shift */}
                        <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5 border border-white/15">
                          <button
                            type="button"
                            onClick={handleShiftPrev}
                            disabled={currentReportDateIdx >= availableReportDates.length - 1}
                            className={`flex items-center gap-1 px-2 py-1 min-h-[36px] rounded-lg text-[10.5px] font-bold transition-all cursor-pointer touch-manipulation select-none ${
                              currentReportDateIdx < availableReportDates.length - 1
                                ? 'text-white/90 hover:text-white hover:bg-white/15 active:scale-95'
                                : 'text-white/30 cursor-not-allowed opacity-50'
                            }`}
                            title="Shift to earlier production date (◀)"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span className="hidden xs:inline">Prev Shift</span>
                          </button>

                          <div className="h-4 w-px bg-white/20" />

                          <button
                            type="button"
                            onClick={handleShiftNext}
                            disabled={currentReportDateIdx <= 0}
                            className={`flex items-center gap-1 px-2 py-1 min-h-[36px] rounded-lg text-[10.5px] font-bold transition-all cursor-pointer touch-manipulation select-none ${
                              currentReportDateIdx > 0
                                ? 'text-white/90 hover:text-white hover:bg-white/15 active:scale-95'
                                : 'text-white/30 cursor-not-allowed opacity-50'
                            }`}
                            title="Shift to newer production date (▶)"
                          >
                            <span className="hidden xs:inline">Next Shift</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Custom Date Selector Component */}
                        <CustomDateSelector
                          selectedDate={effectiveDate}
                          onSelectDate={onSelectDate}
                          lines={lines}
                          compact={true}
                          onInitializeDateLines={onInitializeDateLines}
                        />

                        {/* Fast-Jump to Latest Shift */}
                        {currentReportDateIdx > 0 && availableReportDates[0] && (
                          <button
                            type="button"
                            onClick={() => onSelectDate(availableReportDates[0].date)}
                            className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-amber-400/25 hover:bg-amber-400/35 text-amber-200 border border-amber-400/40 text-[10.5px] font-black uppercase tracking-wider cursor-pointer transition-colors touch-manipulation active:scale-95 shadow-xs"
                            title="Jump directly to latest recorded shift dataset"
                          >
                            Latest Shift
                          </button>
                        )}

                        {/* Track Slide Arrows */}
                        <div className="hidden sm:flex items-center gap-0.5 bg-white/10 rounded-xl p-0.5 border border-white/15">
                          <button
                            type="button"
                            onClick={() => scrollDateSlider('left')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer touch-manipulation"
                            title="Slide dates left"
                            aria-label="Previous dates"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[10px] text-sky-200/70 font-mono-numbers px-1 hidden xs:inline">
                            {currentReportDateIdx >= 0 ? `${currentReportDateIdx + 1}/${availableReportDates.length}` : ''}
                          </span>
                          <button
                            type="button"
                            onClick={() => scrollDateSlider('right')}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/15 active:bg-white/25 transition-colors cursor-pointer touch-manipulation"
                            title="Slide dates right"
                            aria-label="Next dates"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Smooth Horizontal Slider Track with Snap Scrolling & Folder Tabs */}
                    <div className="relative">
                      {/* Left and Right subtle gradient fades for mobile slider affordance */}
                      <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent pointer-events-none z-1 rounded-l-xl sm:hidden" />
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-black/50 to-transparent pointer-events-none z-1 rounded-r-xl sm:hidden" />

                      <div
                        ref={dateSliderRef}
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5"
                      >
                        {availableReportDates.map(item => {
                          const isSelected = item.date === effectiveDate;
                          return (
                            <button
                              key={item.date}
                              id={`btn-date-select-${item.date}`}
                              data-date-tab={item.date}
                              type="button"
                              onClick={() => onSelectDate(item.date)}
                              className={`group relative flex items-center gap-2.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 snap-center touch-manipulation select-none active:scale-95 ${
                                isSelected
                                  ? 'bg-white text-[#17343a] shadow-lg shadow-black/30 font-black border-2 border-white ring-2 ring-teal-400/70'
                                  : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15 hover:border-white/30'
                              }`}
                              title={`Switch to ${item.date} (${item.shiftTag}) production metrics • ${item.count} lines • ${item.totalOutput.toLocaleString()} pcs`}
                            >
                              {/* Folder Tab Icon with Active State */}
                              <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                isSelected ? 'bg-teal-500/20 text-teal-700' : 'bg-white/10 text-white/70 group-hover:text-white'
                              }`}>
                                {isSelected ? (
                                  <FolderOpen className="w-3.5 h-3.5 text-teal-600" />
                                ) : (
                                  <Folder className="w-3.5 h-3.5" />
                                )}
                              </div>

                              {/* Label, Shift Tag & Live Status Dot */}
                              <div className="flex flex-col text-left">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      isSelected
                                        ? 'bg-emerald-500 ring-2 ring-emerald-300 animate-pulse'
                                        : 'bg-white/30'
                                    }`}
                                  />
                                  <span className="font-mono-numbers text-xs tracking-tight whitespace-nowrap">
                                    {item.label}
                                  </span>
                                </div>
                                <span className={`text-[9.5px] font-medium leading-tight ${
                                  isSelected ? 'text-teal-800/80' : 'text-sky-200/70'
                                }`}>
                                  {item.shiftTag}
                                </span>
                              </div>

                              {/* Metrics Badges: Efficiency & Line Count */}
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                {item.avgEff > 0 && (
                                  <span
                                    className={`text-[9.5px] px-1.5 py-0.5 rounded-md font-mono-numbers font-bold ${
                                      isSelected
                                        ? item.avgEff >= 80
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                                        : item.avgEff >= 80
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                                        : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                                    }`}
                                  >
                                    {item.avgEff.toFixed(1)}%
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono-numbers font-bold ${
                                    isSelected
                                      ? 'bg-teal-700/10 text-teal-800 border border-teal-700/20'
                                      : 'bg-black/25 text-sky-200/80 border border-white/10'
                                  }`}
                                >
                                  {item.count}L
                                </span>
                              </div>

                              {/* Active Tab Accent Line */}
                              {isSelected && (
                                <motion.div
                                  layoutId="activeFolderTabIndicator"
                                  className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-teal-500 rounded-full"
                                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                />
                              )}
                            </button>
                          );
                        })}

                        {/* Interactive Add Shift Folder / Custom Date Tab */}
                        {onInitializeDateLines && (
                          <button
                            type="button"
                            onClick={() => {
                              // Focus or jump to today if not yet added, or trigger custom date
                              if (!availableReportDates.some(d => d.date === todayDate)) {
                                onInitializeDateLines(todayDate);
                                onSelectDate(todayDate);
                              } else {
                                // Default to yesterday or step
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                                onInitializeDateLines(tomorrowStr);
                                onSelectDate(tomorrowStr);
                              }
                            }}
                            className="group flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 border border-teal-400/30 hover:border-teal-400/50 transition-all cursor-pointer shrink-0 snap-center touch-manipulation active:scale-95"
                            title="Create and shift to a new production date folder"
                          >
                            <Plus className="w-3.5 h-3.5 text-teal-300 group-hover:scale-110 transition-transform" />
                            <span className="whitespace-nowrap font-medium text-[11px]">New Shift Folder</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile UX Polish Bar: Thumb-Friendly Date Stepper & Shift Indicators (Screen < 640px) */}
                    <div className="sm:hidden pt-1.5 border-t border-white/10 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        {/* 44px Touch Target Step Prev */}
                        <button
                          type="button"
                          onClick={handleShiftPrev}
                          disabled={currentReportDateIdx >= availableReportDates.length - 1}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-colors touch-manipulation select-none ${
                            currentReportDateIdx < availableReportDates.length - 1
                              ? 'bg-white/15 active:bg-white/25 text-white border border-white/20'
                              : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Older Shift</span>
                        </button>

                        {/* Active Shift Indicator Dots */}
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/30">
                          {availableReportDates.map((d, idx) => (
                            <button
                              key={d.date}
                              type="button"
                              onClick={() => onSelectDate(d.date)}
                              className={`w-2.5 h-2.5 rounded-full transition-all touch-manipulation ${
                                d.date === effectiveDate
                                  ? 'bg-teal-400 ring-2 ring-teal-300/50 scale-110'
                                  : 'bg-white/30 hover:bg-white/50'
                              }`}
                              title={`Jump to ${d.label}`}
                              aria-label={`Jump to shift ${idx + 1}`}
                            />
                          ))}
                        </div>

                        {/* 44px Touch Target Step Next */}
                        <button
                          type="button"
                          onClick={handleShiftNext}
                          disabled={currentReportDateIdx <= 0}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-colors touch-manipulation select-none ${
                            currentReportDateIdx > 0
                              ? 'bg-white/15 active:bg-white/25 text-white border border-white/20'
                              : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
                          }`}
                        >
                          <span>Newer Shift</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Shift Pills for Instant 1-Tap Jumping on Mobile */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                        {availableReportDates.map(item => (
                          <button
                            key={item.date}
                            type="button"
                            onClick={() => onSelectDate(item.date)}
                            className={`px-2 py-1 min-h-[32px] rounded-lg text-[10px] font-bold shrink-0 transition-colors touch-manipulation ${
                              item.date === effectiveDate
                                ? 'bg-teal-500 text-white font-black shadow-xs'
                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {item.shiftTag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3 Executive Metrics Banners: Responsive Layout for Mobile and Tablet with Drilldown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                  {/* 1. Factory Efficiency */}
                  <div
                    id="executive-metric-efficiency"
                    onClick={() => setDrillDownKpiId('efficiency')}
                    title="Click for Efficiency Hour-by-Hour Breakdown & 7-Day Trend"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrillDownKpiId('efficiency'); }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all cursor-pointer active:scale-[0.98] select-none group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span>Plant Efficiency</span>
                        <span className="text-[9px] text-teal-300 font-mono font-normal opacity-0 group-hover:opacity-100 transition-opacity">Drilldown ↗</span>
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-teal-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-3.5 h-3.5 text-teal-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.overallEfficiency}%
                      </div>
                      <span className={`text-[10px] sm:text-[11px] font-bold sm:mt-1.5 block ${isEffPositive ? 'text-emerald-300' : 'text-amber-300'}`}>
                        {effVarianceText}
                      </span>
                    </div>
                  </div>

                  {/* 2. Output Volume */}
                  <div
                    id="executive-metric-output"
                    onClick={() => setDrillDownKpiId('production')}
                    title="Click for Output Hourly Breakdown & 7-Day Shift Target Progress"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrillDownKpiId('production'); }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all cursor-pointer active:scale-[0.98] select-none group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span>Output vs Target</span>
                        <span className="text-[9px] text-amber-300 font-mono font-normal opacity-0 group-hover:opacity-100 transition-opacity">Drilldown ↗</span>
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.totalAchievedProd.toLocaleString()}
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers sm:mt-1.5 block">
                        / {factory.totalTargetProd.toLocaleString()} pcs target
                      </span>
                    </div>
                  </div>

                  {/* 3. Manpower & Attendance */}
                  <div
                    id="executive-metric-attendance"
                    onClick={() => setDrillDownKpiId('attendance')}
                    title="Click for Operator Attendance Breakdown & Headcount Status"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setDrillDownKpiId('attendance'); }}
                    className="p-3 sm:p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 flex flex-col justify-between space-y-1.5 transition-all sm:col-span-2 lg:col-span-1 cursor-pointer active:scale-[0.98] select-none group"
                  >
                    <div className="flex items-center justify-between text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span>Operator Attendance</span>
                        <span className="text-[9px] text-emerald-300 font-mono font-normal opacity-0 group-hover:opacity-100 transition-opacity">Drilldown ↗</span>
                      </span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Users className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                    </div>
                    <div className="flex items-baseline justify-between sm:block">
                      <div className="text-2xl sm:text-3xl font-black font-mono-numbers text-white leading-none">
                        {factory.attendanceRate}%
                      </div>
                      <span className="text-[10px] sm:text-[11px] text-sky-200 font-mono-numbers sm:mt-1.5 block">
                        {factory.totalPresent} Present • {factory.totalAbsent} Absent
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active Lines & WIP Status Footer */}
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-sky-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>
                      <strong>{factory.activeLinesCount} Sewing Lines</strong> Active
                      <span className="text-sky-200/80 ml-1 font-mono-numbers text-[11px]">
                        ({floorSummaries.length > 0 ? `${floorSummaries.length} floors` : `${factoryProfile?.name || 'Debonair'} ${factoryProfile?.unitName || 'Unit-2'}`} • {displayLines.slice(0, 6).map(l => `L${l.lineNo}`).join(', ')}{displayLines.length > 6 ? ` +${displayLines.length - 6} more` : ''})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-mono-numbers text-[11px]">
                    <span>Total In-Line WIP: <strong className="text-white">{factory.totalWip.toLocaleString()} pcs</strong></span>
                  </div>
                </div>
              </div>

              {/* Column 2 (Right 5 Cols): Morning Huddle & Protocol Readiness */}
              <div className="lg:col-span-5 flex flex-col justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/10 border border-white/20">
                {/* Morning Huddle Card */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                        10-Minute Morning Huddle
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      hasHuddleToday ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {hasHuddleToday ? 'Meeting Recorded' : 'Stand-up Due'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-lg font-bold text-white uppercase tracking-tight">
                      Top 5 Operational Alignment
                    </h3>
                    <p className="text-xs text-sky-100/80 mt-0.5 leading-relaxed">
                      10-minute stand-up with Line Supervisors to review bottlenecks, hourly piece targets, and record key takeaways directly into Line Remarks.
                    </p>
                  </div>

                  {/* Huddle Action Button */}
                  <button
                    id="btn-launch-morning-huddle"
                    type="button"
                    onClick={() => setIsHuddleOpen(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#17343a] font-black text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    <Clock className="w-4 h-4 fill-current" />
                    <span>Start 10-Min Morning Huddle</span>
                  </button>

                  {/* Current Active Line Remarks Preview */}
                  <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-sky-200">
                      <span>Active Line: <strong>Line {activeLine.lineNo} ({activeLine.style})</strong></span>
                      <button
                        type="button"
                        onClick={() => setIsHuddleOpen(true)}
                        className="text-amber-300 hover:underline font-bold text-[10px]"
                      >
                        Edit Remarks →
                      </button>
                    </div>
                    <p className="text-white/80 line-clamp-2 italic">
                      "{activeLine.remarks || 'No remarks recorded yet. Start huddle to log takeaways.'}"
                    </p>
                  </div>
                </div>

                {/* Protocol Compliance Mini Dial */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="9" fill="transparent" className="text-white/15" />
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          stroke="currentColor"
                          strokeWidth="9"
                          fill="transparent"
                          strokeDasharray={238.76}
                          strokeDashoffset={238.76 * (1 - Math.min(checklistCompletion, 100) / 100)}
                          strokeLinecap="round"
                          className="text-amber-400 transition-all duration-700"
                        />
                      </svg>
                      <span className="absolute text-xs font-black font-mono-numbers text-white">
                        {checklistCompletion}%
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-white">
                        Protocol Compliance
                      </div>
                      <div className="text-[11px] text-sky-200/80">
                        {checklistCounts.done} Done • {checklistCounts.pending} Pending
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigate('checklist')}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Activity Tracking →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions & Status Updates Toolbar */}
            {layout.showQuickActions && (
              <div className="pt-4 border-t border-white/10 space-y-3 relative z-10">
                {/* Floating/Inline Instant Feedback Toast Notification */}
                <AnimatePresence>
                  {quickActionToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-lg ${
                        quickActionToast.type === 'success'
                          ? 'bg-emerald-950/90 border-emerald-400/40 text-emerald-100'
                          : 'bg-teal-950/90 border-teal-400/40 text-teal-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          quickActionToast.type === 'success' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-teal-500/30 text-teal-300'
                        }`}>
                          {quickActionToast.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <RotateCw className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs uppercase tracking-wide text-white">
                              {quickActionToast.title}
                            </span>
                            <span className="text-[10px] text-white/60 font-mono-numbers">
                              {quickActionToast.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-white/90 truncate">
                            {quickActionToast.message}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickActionToast(null)}
                        className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick Actions Control Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 border border-white/20 text-white font-bold text-[11px] uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>One-Click Quick Actions</span>
                    </div>
                    <span className="hidden sm:inline-block text-[11px] text-sky-200/80">
                      Instantly record floor statuses & synchronize daily checklists
                    </span>
                  </div>

                  {/* Scope & Target Line Selector */}
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider mr-1">
                      Apply To:
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickActionScope('active')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        quickActionScope === 'active'
                          ? 'bg-amber-400 text-[#17343a] shadow-xs font-black'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                      title={`Target Line ${activeLine.lineNo} only`}
                    >
                      <span>Line {activeLine.lineNo}</span>
                      <span className="text-[10px] opacity-75">({activeLine.style})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuickActionScope('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        quickActionScope === 'all'
                          ? 'bg-amber-400 text-[#17343a] shadow-xs font-black'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                      title="Target all active lines on floor"
                    >
                      <span>All Lines ({displayLines.length}L)</span>
                    </button>
                  </div>
                </div>

                {/* 3 Core One-Click Quick Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {/* 1. Morning Meeting Done */}
                  <button
                    id="quick-action-morning-meeting"
                    type="button"
                    onClick={handleQuickMorningMeetingDone}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2 shadow-xs active:scale-[0.99] ${
                      isMeetingDone
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/25 border-emerald-400/40 text-white ring-1 ring-emerald-400/30'
                        : 'bg-white/10 hover:bg-white/20 border-white/15 text-white hover:border-amber-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isMeetingDone ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                        }`}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-white uppercase tracking-tight">
                          Morning Meeting Done
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase font-mono-numbers ${
                        isMeetingDone
                          ? 'bg-emerald-400/30 text-emerald-200 border border-emerald-400/40'
                          : 'bg-amber-400/20 text-amber-200 border border-amber-400/30 animate-pulse'
                      }`}>
                        {isMeetingDone ? '✓ Recorded' : 'Due • Click'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-sky-100/80 pt-0.5">
                      <span>Log Top 5 stand-up & mark checklist</span>
                      <span className="text-[10px] text-sky-300 font-mono-numbers">
                        {quickActionScope === 'all' ? 'All lines' : `L${activeLine.lineNo}`}
                      </span>
                    </div>
                  </button>

                  {/* 2. Takt Time Check */}
                  <button
                    id="quick-action-takt-time"
                    type="button"
                    onClick={handleQuickTaktTimeCheck}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2 shadow-xs active:scale-[0.99] ${
                      isTaktVerified
                        ? 'bg-sky-500/20 hover:bg-sky-500/25 border-sky-400/40 text-white ring-1 ring-sky-400/30'
                        : 'bg-white/10 hover:bg-white/20 border-white/15 text-white hover:border-sky-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isTaktVerified ? 'bg-sky-500/30 text-sky-300' : 'bg-teal-400/20 text-teal-300'
                        }`}>
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-xs text-white uppercase tracking-tight">
                          Takt Time Check
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-numbers ${
                        isTaktVerified
                          ? 'bg-sky-400/30 text-sky-200 border border-sky-400/40'
                          : 'bg-white/15 text-sky-200 border border-white/20'
                      }`}>
                        {isTaktVerified ? `✓ Verified (${taktSeconds}s)` : `${taktSeconds}s/pc Pace`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-sky-100/80 pt-0.5">
                      <span>Audit pace vs {operatorPitchSeconds}s operator pitch</span>
                      <span className="text-[10px] text-sky-300 font-mono-numbers">
                        Target: {targetProd} pcs
                      </span>
                    </div>
                  </button>

                  {/* 3. Checklist Refresh */}
                  <button
                    id="quick-action-checklist-refresh"
                    type="button"
                    onClick={handleQuickChecklistRefresh}
                    disabled={isRefreshingChecklist}
                    className="p-3 rounded-xl border border-white/15 bg-white/10 hover:bg-white/20 hover:border-teal-400/40 text-white text-left transition-all duration-200 cursor-pointer group flex flex-col justify-between gap-2 shadow-xs active:scale-[0.99] disabled:opacity-70"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-teal-400/20 text-teal-300 flex items-center justify-center transition-transform group-hover:scale-110">
                          <RotateCw className={`w-4 h-4 ${isRefreshingChecklist ? 'animate-spin text-amber-300' : ''}`} />
                        </div>
                        <span className="font-bold text-xs text-white uppercase tracking-tight">
                          Checklist Refresh
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono-numbers bg-teal-400/20 text-teal-200 border border-teal-400/30">
                        {isRefreshingChecklist ? 'Syncing...' : `${checklistCounts.done}/${checklistCounts.total} Tasks`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-sky-100/80 pt-0.5">
                      <span>Sync 13 IE tasks from floor telemetry</span>
                      <span className="text-[10px] text-teal-300 font-bold">
                        {checklistCompletion}% Pass
                      </span>
                    </div>
                  </button>
                </div>

                {/* Secondary Quick Links & Standard Workspaces */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0 flex-nowrap sm:flex-wrap">
                    <span className="text-[10px] font-bold text-sky-200/70 uppercase tracking-wider mr-1 hidden lg:inline-block">
                      Shortcuts:
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHuddleOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-300" />
                      <span>Morning Huddle Timer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('checklist')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Daily Checklist Table</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('reports')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer shrink-0 text-xs"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-teal-300" />
                      <span>Reports</span>
                    </button>

                    {isMasterAdmin && onOpenDatabase && (
                      <button
                        id="dashboard-quick-import-data-btn"
                        type="button"
                        onClick={() => onOpenDatabase('csv-import')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold transition-colors cursor-pointer shrink-0 text-xs"
                        title="Import Line Configurations from Excel / CSV"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Import Data</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] sm:text-[11px] text-sky-200/80 font-mono-numbers">
                    Shift: 8:00 AM - 5:00 PM • 8.0 Std Hours
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Status Counts Row */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`status-counts-${effectiveDate}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {/* Card 1: DONE */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <span>DONE</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.done}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  of {checklistCounts.total} IE tasks verified
                </div>
              </div>

              {/* Card 2: PENDING */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <span>PENDING</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.pending}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  tasks awaiting floor audit
                </div>
              </div>

              {/* Card 3: NOT DONE */}
              <div className="rounded-2xl bg-white border border-[#e7e1d5] p-4 shadow-2xs hover:shadow-xs transition-shadow">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-700 uppercase tracking-wide">
                  <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <span>NOT DONE</span>
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-[#17343a] mt-2">
                  {checklistCounts.notDone}
                </div>
                <div className="text-xs text-[#527078] mt-1 font-medium">
                  marked non-compliant
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>
      )}

      {/* Morning Huddle 10-Minute Timer Modal */}
      <MorningHuddleTimer
        isOpen={isHuddleOpen}
        onClose={() => setIsHuddleOpen(false)}
        lines={lines}
        selectedLineNo={selectedLineNo}
        onSelectLineNo={onSelectLine}
        onSaveLineRemarks={(lineId, remarks, top5Notes) => {
          const lineToUpdate = lines.find(l => l.id === lineId);
          if (lineToUpdate && onSaveLine) {
            const updated: LineEntry = {
              ...lineToUpdate,
              remarks: remarks,
              top5: {
                ...lineToUpdate.top5,
                held: 'yes',
                notes: top5Notes || remarks
              }
            };
            onSaveLine(updated);
          }
        }}
        onChecklistCompleted={onChecklistCompleted}
      />

      {/* 4 Key Metrics Cards with framer-motion slide-in animation */}
      {layout.showStats && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`summary-cards-${effectiveDate}`}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 gap-4 pb-2 sm:pb-0 no-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0"
          >
            {/* 1. Sewing Manpower Attendance */}
            <DashboardKpiCard
              id="attendance"
              title="Sewing Manpower Attendance"
              value={factory.attendanceRate}
              unit="%"
              subValue="Present Rate"
              badge={{
                text: factory.attendanceRate >= 95 ? 'Optimal' : 'Caution',
                positive: factory.attendanceRate >= 95
              }}
              icon={<Users className="w-4 h-4" />}
              iconBgColor="#f5e9c8"
              iconColor="#c9982f"
              accentColor="#c9982f"
              progressValue={factory.attendanceRate}
              progressColor="#10b981"
              secondaryStats={[
                { label: 'Present', value: factory.totalPresent, color: 'text-slate-900 font-bold' },
                { label: 'Absent', value: factory.totalAbsent, color: 'text-rose-600 font-bold' }
              ]}
              hourlyBreakdown={attendanceHourlyBreakdown}
              historicalTrends={attendanceHistorical}
              metricType="percentage"
              onOpenDrillDown={id => setDrillDownKpiId(id as any)}
            />

            {/* 4. Active Sewing Lines & In-Line Buffer WIP */}
            <DashboardKpiCard
              id="wip_lines"
              title="Active Sewing Lines"
              value={factory.activeLinesCount}
              unit="Lines"
              badge={{ text: '100% Running', positive: true }}
              icon={<Layers className="w-4 h-4" />}
              iconBgColor="#e5eaeb"
              iconColor="#3f5a60"
              accentColor="#3f5a60"
              secondaryStats={[
                {
                  label: 'Buffer WIP',
                  value: `${(factory.totalWip ?? 0).toLocaleString()} pcs`,
                  color: 'text-[#17343a] font-bold'
                }
              ]}
              hourlyBreakdown={wipHourlyBreakdown}
              historicalTrends={wipHistorical}
              metricType="count"
              onOpenDrillDown={id => setDrillDownKpiId(id as any)}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Quick Reports Widget with slide-in animation */}
      {layout.showQuickReports !== false && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`quick-reports-${effectiveDate}`}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -28 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <QuickReportsWidget
              lines={displayLines}
              effectiveDate={effectiveDate}
              factoryOverallEfficiency={factory.overallEfficiency}
              totalTargetProd={factory.totalTargetProd}
              totalAchievedProd={factory.totalAchievedProd}
              totalWip={factory.totalWip}
              totalPresentMP={factory.totalPresent}
              totalAbsentMP={factory.totalAbsent}
              attendanceRate={factory.attendanceRate}
              activeLinesCount={factory.activeLinesCount}
              totalProducedMin={factory.totalProducedMinutes ?? 0}
              totalAvailMin={factory.totalAvailableMinutes ?? 0}
              onNavigateToLine={onSelectLine}
              privacyMode={privacyMode}
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Sewing Floor Performance Breakdown (Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag) */}
      {floorSummaries.length > 1 && (
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                  Unit-2 Sewing Floor Rollup
                </span>
                <span className="text-xs text-[#527078] font-medium">
                  {displayLines.length} Active Lines Across {floorSummaries.length} Production Floors
                </span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight mt-0.5">
                Floor Target vs. Achievement &amp; Efficiency Breakdown
              </h3>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="text-xs text-[#527078] font-mono-numbers">
                Total Target: <strong className="text-[#17343a]">{factory.totalTargetProd.toLocaleString()} pcs</strong> • Output: <strong className="text-[#17343a]">{factory.totalAchievedProd.toLocaleString()} pcs</strong>
              </div>
              <ProductionFloorDropdown
                selectedFloor={selectedDashboardFloor}
                onSelectFloor={(id) => setSelectedDashboardFloor(id)}
                lines={lines}
                variant="button"
              />
              <button
                type="button"
                id="open-floor-plan-map-btn"
                onClick={() => onNavigate('floor-plan')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#176f78] text-white hover:bg-[#125860] text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Visual Floor Plan Map</span>
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 pb-2 sm:pb-0 no-scrollbar -mx-2 sm:mx-0 px-2 sm:px-0">
            {floorSummaries.map(fs => {
              const targetMetPct = fs.targetProd > 0 ? Math.round((fs.achievedProd / fs.targetProd) * 100) : 0;
              const isGood = fs.efficiencyPct >= 40;
              return (
                <div
                  key={fs.floor}
                  onClick={() => setSelectedDashboardFloor(selectedDashboardFloor === fs.floor ? 'all' : fs.floor)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer w-[82vw] max-w-[300px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink ${
                    selectedDashboardFloor === fs.floor
                      ? 'border-[#176f78] bg-[#dceceb]/30 shadow-xs ring-1 ring-[#176f78]'
                      : 'border-[#e7e1d5] bg-white hover:border-[#176f78]/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#17343a]">{fs.floor}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono-numbers ${
                        isGood
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {fs.efficiencyPct}% Eff
                    </span>
                  </div>

                  <div className="mt-2 flex items-baseline justify-between text-xs">
                    <span className="text-[#527078]">Achieved / Target:</span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">
                      {fs.achievedProd.toLocaleString()}{' '}
                      <span className="font-normal text-[#527078]">/ {fs.targetProd.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="mt-1.5 h-2 w-full rounded-full bg-[#f1eee6] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isGood ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                      }`}
                      style={{ width: `${Math.min(targetMetPct, 100)}%` }}
                    />
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#527078]">
                    <span>
                      {String(fs.lines.length).padStart(2, '0')} Lines ({fs.lines.map(l => `L${l.lineNo}`).join(', ')})
                    </span>
                    <span className="font-mono-numbers font-bold text-[#17343a]">
                      {fs.manpower} MP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily Productivity Insights: Shift Target vs Actual Gap Progress Indicator */}
      <DailyProductivityInsights
        lines={displayLines}
        onSelectLine={onSelectLine}
        onNavigate={onNavigate}
      />

      {/* Grid: Line Balancing Graph & Hour-by-Hour Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Balancing Graph / Learning Curve */}
        {layout.showBalancingGraph && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                    Line Balancing & Learning Curve Ramp-Up
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Planned vs achieved ramp-up progression across style start days
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] px-2 py-0.5 rounded">
                  IE Standard
                </span>
              </div>

              {/* Learning Curve Stage Cards */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 01</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">60%</div>
                  <div className="text-[9px] text-emerald-600 font-bold">L21 on Day 1</div>
                </div>
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 02</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">75%</div>
                  <div className="text-[9px] text-emerald-600 font-bold">L19 on Day 2</div>
                </div>
                <div className="p-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2]">
                  <div className="text-[10px] text-[#527078] uppercase font-bold">Day 03</div>
                  <div className="font-display text-lg font-bold text-[#17343a]">85%</div>
                  <div className="text-[9px] text-[#527078]">Build-up</div>
                </div>
                <div className="p-2 rounded-xl bg-[#dceceb] border border-[#176f78]/30">
                  <div className="text-[10px] text-[#176f78] uppercase font-bold">Day 04+</div>
                  <div className="font-display text-lg font-bold text-[#176f78]">90-95%</div>
                  <div className="text-[9px] text-[#176f78] font-bold">L18, L20, L24</div>
                </div>
              </div>

              {/* Visual SVG Curve */}
              <div className="h-44 w-full relative pt-2">
                <svg viewBox="0 0 400 130" className="w-full h-full overflow-visible">
                  {/* Grid lines */}
                  <line x1="40" y1="15" x2="380" y2="15" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="45" x2="380" y2="45" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="75" x2="380" y2="75" stroke="#e7e1d5" strokeDasharray="3 3" />
                  <line x1="40" y1="105" x2="380" y2="105" stroke="#e7e1d5" strokeDasharray="3 3" />

                  {/* Y Axis labels */}
                  <text x="10" y="20" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">100%</text>
                  <text x="10" y="50" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">80%</text>
                  <text x="10" y="80" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">60%</text>
                  <text x="10" y="110" fontSize="9" fill="#527078" fontFamily="IBM Plex Mono">40%</text>

                  {/* Planned Target Line (Dashed Orange) */}
                  <path
                    d="M 60 80 Q 150 45, 240 30 T 360 22"
                    fill="none"
                    stroke="#e6813e"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />

                  {/* Achieved Curve (Solid Teal) */}
                  <path
                    d="M 60 76 Q 150 38, 240 26 T 360 18"
                    fill="none"
                    stroke="#176f78"
                    strokeWidth="3.5"
                  />

                  {/* Points */}
                  <circle cx="60" cy="76" r="4.5" fill="#176f78" />
                  <circle cx="150" cy="38" r="4.5" fill="#176f78" />
                  <circle cx="240" cy="26" r="4.5" fill="#176f78" />
                  <circle cx="360" cy="18" r="5" fill="#176f78" />

                  {/* X Axis labels */}
                  <text x="50" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 1</text>
                  <text x="140" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 2</text>
                  <text x="230" y="125" fontSize="10" fill="#527078" fontWeight="bold">Day 3</text>
                  <text x="345" y="125" fontSize="10" fill="#176f78" fontWeight="bold">Peak (D4)</text>
                </svg>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5] text-xs">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-[#17343a] font-medium">
                  <span className="w-3 h-1 bg-[#176f78] rounded"></span> Actual Output Curve
                </span>
                <span className="flex items-center gap-1.5 text-xs text-[#527078]">
                  <span className="w-3 h-1 bg-[#e6813e] rounded border-b border-dashed"></span> Planned Ramp-up
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('linedata', selectedLineNo)}
                  className="px-2.5 py-1 rounded-lg bg-[#dceceb] hover:bg-[#cde4e3] text-[#176f78] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-[#176f78]/20"
                  title="Audit 8-Hour Working Minutes Balancing for this Line"
                >
                  <Clock className="w-3.5 h-3.5 text-[#176f78]" />
                  <span>8h Minutes Balancing →</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('line-history', selectedLineNo)}
                  className="text-xs font-bold text-[#176f78] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Efficiency History →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hour-by-Hour Production */}
        {layout.showIO && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                    Hourly Factory Output (Hour-by-Hour)
                  </h3>
                  <p className="text-xs text-[#527078]">
                    Tracking hourly piece output against 620 pcs/hr standard pace
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>On Pace</span>
                </div>
              </div>

              {/* Hour bars */}
              <div className="space-y-2 mt-4">
                {hourlyData.map(h => {
                  const pct = Math.min((h.actual / h.target) * 100, 100);
                  const isMet = h.actual >= h.target;

                  return (
                    <div key={h.hour} className="flex items-center gap-3 text-xs">
                      <span className="w-14 font-mono-numbers text-[11px] text-[#527078] font-bold">
                        {h.hour}
                      </span>
                      <div className="flex-1 h-3.5 rounded-md bg-[#f1eee6] overflow-hidden relative">
                        <div
                          className={`h-full rounded-md transition-all duration-300 ${
                            isMet ? 'bg-[#176f78]' : 'bg-[#e6813e]'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="w-24 text-right font-mono-numbers text-[11px]">
                        <strong className="text-[#17343a]">{h.actual}</strong>
                        <span className="text-[#527078]">/{h.target}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#e7e1d5] text-xs mt-3">
              <span className="text-[#527078]">Cumulative today: <strong className="text-[#17343a] font-mono-numbers">{(factory.totalAchievedProd ?? 0).toLocaleString()} pcs</strong></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">Current rate: 642 pcs/hr</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottlenecks & Style Changeovers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Bottlenecks */}
        <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                Floor Bottlenecks &amp; Cycle Time Watchlist
              </h3>
              <p className="text-xs text-[#527078]">
                Stations with observed cycle time exceeding takt/target pace
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
              Live Audited
            </span>
          </div>

          {floorSummaries.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs mb-3">
              <button
                onClick={() => setSelectedDashboardFloor('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                  selectedDashboardFloor === 'all'
                    ? 'bg-[#176f78] text-white'
                    : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                }`}
              >
                All Floors ({displayLines.length})
              </button>
              {floorSummaries.map(fs => (
                <button
                  key={fs.floor}
                  onClick={() => setSelectedDashboardFloor(fs.floor)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                    selectedDashboardFloor === fs.floor
                      ? 'bg-[#176f78] text-white'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                  }`}
                >
                  {fs.floor} ({fs.lines.length})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {(selectedDashboardFloor === 'all'
              ? displayLines
              : displayLines.filter(l => matchesProductionFloor(l.floor, selectedDashboardFloor))
            ).map(line => (
              <div
                key={line.id}
                className="p-3 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-start justify-between gap-3 hover:bg-[#f1eee6] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#176f78] bg-[#dceceb] px-1.5 py-0.5 rounded">
                      L{line.lineNo}
                    </span>
                    <span className="font-bold text-xs text-[#17343a]">
                      {line.bottleneck.station}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        line.bottleneck.status === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {line.bottleneck.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#527078] mt-0.5">
                    {line.floor} • Style: <span className="font-medium text-[#17343a]">{line.style}</span>
                  </div>
                  <p className="text-[11px] text-[#527078] mt-1">
                    <strong>Action:</strong> {line.bottleneck.action || 'Standard operation monitored'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-numbers font-bold text-xs text-[#17343a]">
                    {line.bottleneck.cycleTime}s
                  </div>
                  <div className="text-[10px] text-[#527078] font-mono-numbers">
                    Target: {line.bottleneck.targetCT}s
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Style Changeovers */}
        {layout.showUpcoming && (
          <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold uppercase text-[#17343a] tracking-tight">
                  Upcoming Style Changeovers &amp; T.R Samples
                </h3>
                <p className="text-xs text-[#527078]">
                  Critical 10-day style input schedules and technical sample readiness
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78]">
                10-Day File
              </span>
            </div>

            {floorSummaries.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs mb-3">
                <button
                  onClick={() => setSelectedDashboardFloor('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                    selectedDashboardFloor === 'all'
                      ? 'bg-[#176f78] text-white'
                      : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                  }`}
                >
                  All Floors ({displayLines.length})
                </button>
                {floorSummaries.map(fs => (
                  <button
                    key={fs.floor}
                    onClick={() => setSelectedDashboardFloor(fs.floor)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors shrink-0 cursor-pointer ${
                      selectedDashboardFloor === fs.floor
                        ? 'bg-[#176f78] text-white'
                        : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5]'
                    }`}
                  >
                    {fs.floor} ({fs.lines.length})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {(selectedDashboardFloor === 'all'
                ? displayLines
                : displayLines.filter(l => matchesProductionFloor(l.floor, selectedDashboardFloor))
              ).map(line => (
                <div
                  key={line.id}
                  className="p-3 rounded-xl border border-[#e7e1d5] bg-[#f1eee6]/50 flex items-center justify-between gap-3 hover:bg-[#f1eee6] transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#176f78]">Line {line.lineNo}</span>
                      <span className="font-bold text-xs text-[#17343a]">{line.nextStyle}</span>
                    </div>
                    <div className="text-[11px] text-[#527078] mt-0.5">
                      {line.floor} • Order Qty: {(line.orderQty ?? 0).toLocaleString()} pcs • Buyer: {line.buyer || 'General'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-mono-numbers bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a]">
                      {line.nextStyleDate}
                    </span>
                    <div className="text-[10px] text-[#176f78] font-bold mt-0.5">
                      T.R Sample Ready
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* KPI Drill-Down Analysis Modal */}
      {drillDownKpiId && (
        <KpiDrillDownModal
          isOpen={Boolean(drillDownKpiId)}
          onClose={() => setDrillDownKpiId(null)}
          activeKpiId={drillDownKpiId}
          onSelectKpiId={setDrillDownKpiId}
          kpiData={{
            efficiency: {
              value: factory.overallEfficiency,
              target: 85.0,
              varianceText: effVarianceText,
              hourly: efficiencyHourlyBreakdown,
              historical: efficiencyHistorical
            },
            production: {
              achieved: factory.totalAchievedProd,
              target: factory.totalTargetProd,
              pct: Math.round((factory.totalAchievedProd / (factory.totalTargetProd || 1)) * 100),
              hourly: productionHourlyBreakdown,
              historical: productionHistorical
            },
            attendance: {
              present: factory.totalPresent,
              absent: factory.totalAbsent,
              rate: factory.attendanceRate,
              hourly: attendanceHourlyBreakdown,
              historical: attendanceHistorical
            },
            wip_lines: {
              activeLines: factory.activeLinesCount,
              totalWip: factory.totalWip,
              hourly: wipHourlyBreakdown,
              historical: wipHistorical
            }
          }}
          floorSummaries={floorSummaries}
          activeDate={effectiveDate}
          onNavigateToLine={onSelectLine}
        />
      )}

      {/* Context-Aware Floating Action Button (FAB) - Changes icon & action based on active tab context */}
      <ContextAwareFab
        initialTab={
          activeTab === 'downtime' || activeTab === 'loss-pareto'
            ? 'downtime'
            : activeTab === 'checklist'
            ? 'checklist'
            : activeTab === 'lean-tools' || activeTab === 'actions'
            ? 'lean-tools'
            : activeTab === 'reports'
            ? 'reports'
            : 'hourly'
        }
        onOpenHourlyProduction={onOpenHourlyProduction}
        onOpenNewDowntime={onOpenNewDowntime}
        onOpenNewAction={onOpenNewAction}
        onChecklistAction={handleQuickMorningMeetingDone}
        onNavigate={onNavigate}
        lines={displayLines}
        effectiveDate={effectiveDate}
        onTriggerToast={(title, message, type = 'success') => {
          setQuickActionToast({
            id: Date.now(),
            type,
            title,
            message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }}
      />
    </div>
  );
};
