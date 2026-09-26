/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
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
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChecklistMap, ChecklistStatus, UserProfile, RoleTier } from '../types';
import { CHECKLIST_TASK_COUNT, IE_DAILY_TASKS, normalizeChecklistStatuses, ROLE_TIERS as DEFAULT_ROLE_TIERS } from '../mockData';
import { formatDateLabel, getOffsetDateStr, isFridayHoliday } from '../utils';

interface DailyChecklistProps {
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateTaskStatus: (date: string, taskIndex: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist: (date: string, statuses: ChecklistStatus[]) => void;
  profile: UserProfile;
  roleTiers?: RoleTier[];
  onNavigate?: (tab: string) => void;
}

export const DailyChecklist: React.FC<DailyChecklistProps> = ({
  checklists,
  selectedDate,
  onSelectDate,
  onUpdateTaskStatus,
  onBatchUpdateChecklist,
  profile,
  roleTiers,
  onNavigate
}) => {
  const [taskNotes, setTaskNotes] = useState<Record<number, string>>({
    0: 'Ramp-up milestones and operator loading plan aligned with supervisor.',
    1: '1st vs 2nd day balance graph logged; cycle variance minimized.',
    2: '70% production target achieved on Line 20.',
    3: '4th day graph completed; bottleneck station cycle balanced.',
    4: 'Day 6-7 estimate prepared with manpower and efficiency evidence.',
    5: 'Collar attach station analyzed; countermeasure applied.',
    6: 'Tech pack and trims confirmed 10 days ahead.',
    7: 'T.R sample passed initial audit; 2 open actions tracked.',
    8: 'Shift A floor status logged across all active lines.',
    9: 'Critical station operators tracked; helper assigned to Line 19.',
    10: 'Pneumatic thread wiper jig installed; saved 3.2s per piece.',
    11: 'Shift running efficiency logged at 87.4% against 85% target.',
    12: 'Tomorrow line target forecast calculated based on line balance.'
  });

  const currentStatuses: ChecklistStatus[] = normalizeChecklistStatuses(checklists[selectedDate]);
  const isFriday = isFridayHoliday(selectedDate);

  const completedCount = currentStatuses.filter(s => s === 'yes').length;
  const pendingCount = currentStatuses.filter(s => s === 'pending').length;
  const noCount = currentStatuses.filter(s => s === 'no').length;
  const completionPercentage = Math.round((completedCount / CHECKLIST_TASK_COUNT) * 100);

  const handleNoteChange = (idx: number, text: string) => {
    setTaskNotes(prev => ({ ...prev, [idx]: text }));
  };

  // Custom Date Selector Menu State
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
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

  // Standard Factory Datasets & Presets
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

  const getTasksDoneCount = (dateStr: string) => {
    const list = normalizeChecklistStatuses(checklists[dateStr]);
    return list.filter(s => s === 'yes').length;
  };

  const formattedDayOfWeek = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    } catch {
      return '';
    }
  }, [selectedDate]);

  const formattedDisplayDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Close custom date popover on outside click or escape
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
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const markAllYes = () => {
    onBatchUpdateChecklist(selectedDate, Array(CHECKLIST_TASK_COUNT).fill('yes'));
  };

  const resetAll = () => {
    onBatchUpdateChecklist(selectedDate, Array(CHECKLIST_TASK_COUNT).fill('pending'));
  };

  return (
    <div className="space-y-6">
      {/* Header & Date Navigation */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 sm:p-6 shadow-xs surface-card checklist-intro">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#dceceb] text-[#176f78] section-kicker">
                IE Daily Activity Inspection Protocol
              </span>
              <span className="text-xs text-[#527078]">{CHECKLIST_TASK_COUNT}-Task Verification Protocol</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase text-[#17343a] tracking-tight page-title">
              IE Daily Activity Tracking
            </h1>
            <p className="text-xs sm:text-sm text-[#527078] mt-1">
              Audit learning curve plans, line balancing graphs, bottleneck flow, style input dates, T.R samples, operator tracking, and shift targets.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Custom Date Selector Bar with Rich Popover & Presets */}
            <div
              id="checklist-custom-date-selector"
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
                    {completedCount}/{CHECKLIST_TASK_COUNT} Tasks Done ({completionPercentage}%)
                  </span>
                </div>

                <ChevronDown className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 shrink-0 ${isDateMenuOpen ? 'rotate-180 text-[#176f78]' : ''}`} />
              </button>

              {/* Quick Jump to Today Button (Visible if past date is selected) */}
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => onSelectDate(todayStr)}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#dceceb] hover:bg-[#cde4e2] text-[#176f78] text-[11px] font-bold transition-all cursor-pointer touch-manipulation active:scale-95"
                  title="Jump directly to Today's date"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Today</span>
                </button>
              )}

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

              {/* Custom Date Popover Dropdown */}
              <AnimatePresence>
                {isDateMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 w-[340px] max-w-[95vw] rounded-2xl bg-[#fbfaf6] border border-[#d9d2c2] shadow-2xl p-4 text-[#17343a] space-y-3"
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

                    {/* Direct Custom Date Input */}
                    <div className="bg-[#f1eee6] p-2.5 rounded-xl border border-[#d9d2c2] space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#527078] flex items-center justify-between">
                        <span>Custom Date Input</span>
                        <span className="text-[#176f78] font-mono-numbers">{selectedDate}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={e => {
                            if (e.target.value) {
                              onSelectDate(e.target.value);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#d9d2c2] text-xs font-bold font-mono-numbers text-[#17343a] focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                        />
                      </div>
                    </div>

                    {/* Individual Date / Day-Wise Shift Reports */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] px-0.5">
                        Date / Day-Wise Shift Reports
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {datePresets.map(preset => {
                          const isCurrent = preset.date === selectedDate;
                          const doneCount = getTasksDoneCount(preset.date);
                          const isFullyDone = doneCount === CHECKLIST_TASK_COUNT;

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
                                    {preset.phase}
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
                      </div>
                    </div>

                    {/* Popover Footer Shortcuts */}
                    <div className="pt-2 border-t border-[#e7e1d5] flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(todayStr);
                          setIsDateMenuOpen(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1eee6] border border-[#d9d2c2] text-[#17343a] font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        Reset to Today
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectDate(yesterdayStr);
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

            {isFriday && (
              <span className="px-3 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                <span>🌴</span>
                <span>Friday Holiday</span>
              </span>
            )}

            {onNavigate && (
              <button
                onClick={() => onNavigate('monthly')}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] text-xs font-bold transition-all shadow-2xs"
                title="View Monthly Activity & Audit Log with Calendar UI"
              >
                <Calendar className="w-3.5 h-3.5 text-[#176f78]" />
                <span>Monthly Audit Calendar</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress & Quick Actions */}
        <div className="mt-6 pt-5 border-t border-[#e7e1d5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-bold text-[#17343a] flex items-center gap-1.5">
                <span>Checklist Compliance:</span>
                <span className="text-[#176f78] font-mono-numbers font-black">{completionPercentage}%</span>
              </span>
              <span className="text-[#527078] font-mono-numbers text-[11px]">
                 {completedCount}/{CHECKLIST_TASK_COUNT} Tasks Done
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#f1eee6] overflow-hidden flex">
              <div
                className="h-full bg-[#176f78] transition-all duration-300"
                 style={{ width: `${(completedCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                 style={{ width: `${(pendingCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
              <div
                className="h-full bg-rose-400 transition-all duration-300"
                 style={{ width: `${(noCount / CHECKLIST_TASK_COUNT) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono-numbers mt-1 text-[#527078]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#176f78]"></span> {completedCount} Done
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> {pendingCount} Pending
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span> {noCount} Not Met
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllYes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#dceceb] text-[#176f78] hover:bg-[#c9e4e2] text-xs font-bold transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Done</span>
            </button>
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-slate-600 hover:bg-[#e7e1d5] text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
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

      {/* Full IE + SL task cards */}
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
                    </div>
                    <h3 className="font-bold text-sm text-[#17343a] mt-0.5 leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-xs text-[#527078] mt-1 leading-relaxed">
                      {task.hint}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1 shrink-0 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]">
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'yes')}
                    title="Mark Done"
                    aria-label="Mark task Done"
                    className={`w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      status === 'yes'
                        ? 'bg-emerald-600 text-white shadow-xs font-bold ring-2 ring-emerald-600/30'
                        : 'text-slate-400 hover:text-emerald-700 hover:bg-white/60'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'pending')}
                    title="Mark Pending"
                    aria-label="Mark task Pending"
                    className={`w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      status === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-bold ring-2 ring-amber-500/30'
                        : 'text-slate-400 hover:text-amber-700 hover:bg-white/60'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onUpdateTaskStatus(selectedDate, idx, 'no')}
                    title="Mark Not Met / Action Needed"
                    aria-label="Mark task Not Met"
                    className={`w-10 h-10 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      status === 'no'
                        ? 'bg-rose-500 text-white shadow-xs font-bold ring-2 ring-rose-500/30'
                        : 'text-slate-400 hover:text-rose-700 hover:bg-white/60'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Observation / Note Input */}
              <div className="mt-3 pt-3 border-t border-[#e7e1d5]/80">
                <input
                  type="text"
                  placeholder="Record floor notes or specific line observations..."
                  value={taskNotes[idx] || ''}
                  onChange={e => handleNoteChange(idx, e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-xl bg-[#f1eee6]/60 border border-[#e7e1d5] text-[#17343a] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#176f78]"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Debonair LTD (Unit-02) Audit & Management Sign-Off Stamp */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-[#fbfaf6] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#dceceb] text-[#176f78] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-[#17343a]">
                IE Daily Activity Floor Audit Verification
              </h4>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  profile.tierId === 'tier_4'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {profile.tierId === 'tier_4'
                  ? 'Data Recorded (Pending Incharge Sign-off)'
                  : profile.tierId === 'tier_3'
                  ? 'Audited & Approved (Incharge Sign-off)'
                  : profile.tierId === 'tier_2'
                  ? 'Audited & Approved (Wing Manager Sign-off)'
                  : 'Audited & Approved (Sr. Manager Sign-off)'}
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5">
              {profile.tierId === 'tier_4'
                ? `Observations recorded by ${profile.name} (Tier 4: Line IE). Debonair RBAC requires Tier 3 IE Incharge or Tier 1/2 Manager sign-off.`
                : profile.tierId === 'tier_3'
                ? `Section sign-off authorized by ${profile.name} (Tier 3: IE Incharge / Assistant Manager).`
                : profile.tierId === 'tier_2'
                ? `Wing sign-off authorized by ${profile.name} (Tier 2: Manager, ${profile.assignedWing || 'Wing'}).`
                : `Executive sign-off approved by ${profile.name} (Tier 1: Sr. Manager).`}
            </p>
          </div>
        </div>

        <div className="text-right text-xs font-mono-numbers text-[#527078] border-t sm:border-t-0 pt-3 sm:pt-0 border-[#e7e1d5]">
          <div>Shift Verification ID: #SL-CHK-{selectedDate.replace(/-/g, '')}</div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
            Compliance Score: {completionPercentage}%
          </div>
        </div>
      </div>
    </div>
  );
};
