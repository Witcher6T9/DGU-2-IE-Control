/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Check,
  CalendarDays,
  X,
  Layers,
  Clock,
  Plus
} from 'lucide-react';
import { LineEntry } from '../types';
import { formatDateLabel, isFridayHoliday } from '../utils';
import { DEBONAIR_AVAILABLE_DATES } from '../data/importedDebonairData';

export interface CustomDateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  lines?: LineEntry[];
  compact?: boolean;
  className?: string;
  onInitializeDateLines?: (targetDate: string) => void;
}

export const CustomDateSelector: React.FC<CustomDateSelectorProps> = ({
  selectedDate,
  onSelectDate,
  lines = [],
  compact = false,
  className = '',
  onInitializeDateLines
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse currently selected date safely
  const parsedDate = useMemo(() => {
    if (!selectedDate) return new Date(2026, 8, 21);
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  }, [selectedDate]);

  // Calendar view navigation state (year & month)
  const [viewYear, setViewYear] = useState<number>(() => parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => parsedDate.getMonth());
  const [customInputVal, setCustomInputVal] = useState<string>(selectedDate || '');

  // Keep view in sync when selectedDate changes externally
  useEffect(() => {
    setViewYear(parsedDate.getFullYear());
    setViewMonth(parsedDate.getMonth());
    setCustomInputVal(selectedDate);
  }, [selectedDate, parsedDate]);

  // Close popup on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Map of dates with lines count
  const dateCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    lines.forEach(l => {
      if (l.date) {
        map.set(l.date, (map.get(l.date) || 0) + 1);
      }
    });
    // Ensure standard Debonair dates are mapped
    DEBONAIR_AVAILABLE_DATES.forEach(d => {
      if (!map.has(d.date)) {
        map.set(d.date, d.lineCount);
      }
    });
    return map;
  }, [lines]);

  // Individual Date /Day wise Reports shortcuts
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const shiftDateReports = useMemo(() => [
    { label: '24-Sep-26 (Shift 6)', date: '2026-09-24', badge: '34 Lines' },
    { label: '23-Sep-26 (Shift 5)', date: '2026-09-23', badge: '34 Lines' },
    { label: '22-Sep-26 (Shift 4)', date: '2026-09-22', badge: '34 Lines' },
    { label: '21-Sep-26 (Shift 3)', date: '2026-09-21', badge: '34 Lines' },
    { label: '20-Sep-26 (Shift 2)', date: '2026-09-20', badge: '34 Lines' },
    { label: '19-Sep-26 (Shift 1)', date: '2026-09-19', badge: '34 Lines' },
    { label: '17-Sep-26 (Regular)', date: '2026-09-17', badge: '34 Lines' },
    { label: 'Today (Live)', date: todayStr, badge: dateCountsMap.has(todayStr) ? `${dateCountsMap.get(todayStr)} Lines` : 'Live' },
    { label: 'Yesterday', date: yesterdayStr, badge: dateCountsMap.has(yesterdayStr) ? `${dateCountsMap.get(yesterdayStr)} Lines` : undefined }
  ], [todayStr, yesterdayStr, dateCountsMap]);

  // Step dates by offset (e.g. -1 or +1 day)
  const handleStepDay = (step: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const d = new Date(parsedDate);
    d.setDate(d.getDate() + step);
    const newYear = d.getFullYear();
    const newMonth = String(d.getMonth() + 1).padStart(2, '0');
    const newDay = String(d.getDate()).padStart(2, '0');
    const newDateStr = `${newYear}-${newMonth}-${newDay}`;
    onSelectDate(newDateStr);
  };

  // Calendar month days calculation
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      isFriday: boolean;
      hasData: boolean;
      lineCount: number;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(viewYear, viewMonth - 1, dayNum);
      const dateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isFriday: prevDate.getDay() === 5,
        hasData: dateCountsMap.has(dateStr),
        lineCount: dateCountsMap.get(dateStr) || 0
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(viewYear, viewMonth, d);
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isFriday: curDate.getDay() === 5,
        hasData: dateCountsMap.has(dateStr),
        lineCount: dateCountsMap.get(dateStr) || 0
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(viewYear, viewMonth + 1, d);
      const dateStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        isFriday: nextDate.getDay() === 5,
        hasData: dateCountsMap.has(dateStr),
        lineCount: dateCountsMap.get(dateStr) || 0
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedDate, todayStr, dateCountsMap]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (dateStr: string) => {
    onSelectDate(dateStr);
    setIsOpen(false);
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInputVal && /^\d{4}-\d{2}-\d{2}$/.test(customInputVal)) {
      onSelectDate(customInputVal);
      setIsOpen(false);
    }
  };

  // Label formatting
  const formattedLabel = useMemo(() => {
    if (selectedDate === '2026-09-21') return '21-Sep-26 (Day 3)';
    if (selectedDate === '2026-09-20') return '20-Sep-26 (Day 2)';
    if (selectedDate === '2026-09-19') return '19-Sep-26 (Day 1)';
    if (selectedDate === '2026-09-17') return '17-Sep-26 (Regular)';
    if (selectedDate === todayStr) return `Today (${formatDateLabel(selectedDate)})`;
    if (selectedDate === yesterdayStr) return `Yesterday (${formatDateLabel(selectedDate)})`;
    return formatDateLabel(selectedDate);
  }, [selectedDate, todayStr, yesterdayStr]);

  const currentLinesCount = dateCountsMap.get(selectedDate) || 0;
  const isSelectedFriday = isFridayHoliday(selectedDate);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button & Step Arrows */}
      <div
        id="custom-date-selector-container"
        className={`flex items-center gap-1 rounded-xl bg-white/90 dark:bg-black/40 border border-[#d9d2c2] dark:border-white/15 p-0.5 shadow-2xs transition-all ${
          isOpen ? 'ring-2 ring-[#176f78] border-[#176f78]' : 'hover:border-[#b8ad96]'
        }`}
      >
        {/* Previous Day Step Button */}
        <button
          id="btn-date-step-prev"
          type="button"
          onClick={e => handleStepDay(-1, e)}
          className="p-1 rounded-lg hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#527078] dark:text-white/70 hover:text-[#17343a] dark:hover:text-white transition-colors cursor-pointer"
          title="Step to previous production date (◀)"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Main Date Display Trigger */}
        <button
          id="btn-custom-date-dropdown-trigger"
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#f8f6f0] dark:hover:bg-white/5 transition-colors cursor-pointer text-left select-none"
          title="Click to open full calendar date selector and presets"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <Calendar className="w-3.5 h-3.5 text-[#176f78] dark:text-[#2dd4bf] shrink-0" />
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-mono-numbers text-xs font-bold text-[#17343a] dark:text-[#fbfaf6] tracking-tight leading-none whitespace-nowrap">
                {formattedLabel}
              </span>
              {currentLinesCount > 0 ? (
                <span className="text-[10px] font-bold font-mono px-1 py-0.2 bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 rounded border border-teal-300 dark:border-teal-700/50 leading-tight">
                  {currentLinesCount}L
                </span>
              ) : (
                <span className="text-[9.5px] font-bold px-1 py-0.2 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded border border-amber-300 dark:border-amber-700/50 leading-tight">
                  Custom
                </span>
              )}
            </div>
            {!compact && (
              <span className="text-[10px] text-[#527078] dark:text-slate-400 font-medium leading-none mt-0.5">
                {isSelectedFriday ? 'Friday • Weekly Holiday' : 'Shift Active'}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-3 h-3 text-[#527078] dark:text-slate-400 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180 text-[#176f78]' : ''
            }`}
          />
        </button>

        {/* Next Day Step Button */}
        <button
          id="btn-date-step-next"
          type="button"
          onClick={e => handleStepDay(1, e)}
          className="p-1 rounded-lg hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#527078] dark:text-white/70 hover:text-[#17343a] dark:hover:text-white transition-colors cursor-pointer"
          title="Step to next production date (▶)"
          aria-label="Next day"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Popover Dropdown Calendar */}
      {isOpen && (
        <>
          {/* Mobile backdrop for clean touch dismissal */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <div
            id="custom-date-selector-popover"
            className="fixed inset-x-3 bottom-3 sm:bottom-auto sm:inset-x-auto sm:absolute sm:right-0 sm:top-full mt-2 z-50 max-h-[88vh] overflow-y-auto w-auto sm:w-[360px] rounded-2xl bg-white dark:bg-[#121e20] border border-[#d9d2c2] dark:border-white/15 p-4 shadow-2xl space-y-4 animate-in fade-in-50 zoom-in-95 duration-150"
          >
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#f1eee6] dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#176f78]/10 text-[#176f78] dark:text-[#2dd4bf] flex items-center justify-center">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-[#17343a] dark:text-white tracking-wider">
                  Custom Date Selector
                </h4>
                <p className="text-[10px] text-[#527078] dark:text-slate-400 font-medium">
                  Debonair LTD (Unit-02) Operations
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#527078] dark:text-slate-400 cursor-pointer"
              aria-label="Close date picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Individual Date /Day wise Reports */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#527078] dark:text-slate-400 tracking-wider">
              <span>Date /Day wise Reports</span>
              <span className="text-emerald-700 dark:text-emerald-400">All 34 Lines</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {shiftDateReports.map(p => {
                const isSelected = p.date === selectedDate;
                return (
                  <button
                    key={p.date}
                    type="button"
                    onClick={() => handleSelectDay(p.date)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                      isSelected
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                        : 'bg-[#fbfaf6] dark:bg-white/5 hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#17343a] dark:text-white border-[#e4ddce] dark:border-white/10'
                    }`}
                  >
                    <span className="truncate text-[11px]">{p.label}</span>
                    {p.badge && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold shrink-0 ml-1 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-[#f1eee6] dark:bg-white/10 text-[#527078] dark:text-slate-300'
                        }`}
                      >
                        {p.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Month & Year Navigation */}
          <div className="pt-2 border-t border-[#f1eee6] dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#527078] dark:text-slate-300 cursor-pointer"
                title="Previous month"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#17343a] dark:text-white font-mono uppercase">
                <span>{monthNames[viewMonth]}</span>
                <span>{viewYear}</span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-[#f1eee6] dark:hover:bg-white/10 text-[#527078] dark:text-slate-300 cursor-pointer"
                title="Next month"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#527078] dark:text-slate-400">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span className="text-amber-600 dark:text-amber-400" title="Weekly Holiday">
                Fr
              </span>
              <span>Sa</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {calendarGrid.map((day, idx) => {
                return (
                  <button
                    key={`${day.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleSelectDay(day.dateStr)}
                    className={`relative h-8 rounded-lg flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                      day.isSelected
                        ? 'bg-[#176f78] text-white font-black shadow-xs ring-2 ring-[#176f78]/30'
                        : day.isToday
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                        : !day.isCurrentMonth
                        ? 'text-slate-300 dark:text-slate-600 hover:bg-[#f1eee6] dark:hover:bg-white/5'
                        : day.isFriday
                        ? 'text-amber-700 dark:text-amber-400 hover:bg-[#fbfaf6] dark:hover:bg-white/5'
                        : 'text-[#17343a] dark:text-slate-200 hover:bg-[#f1eee6] dark:hover:bg-white/10'
                    }`}
                    title={`${day.dateStr} ${day.isFriday ? '• Friday Holiday' : ''} ${
                      day.hasData ? `• ${day.lineCount} Lines Logged` : ''
                    }`}
                  >
                    <span>{day.dayNumber}</span>
                    {/* Small Dot Indicator if date has logged lines */}
                    {day.hasData && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full -mt-0.5 ${
                          day.isSelected
                            ? 'bg-white'
                            : 'bg-emerald-500 ring-1 ring-emerald-300'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Date Input & Jump Form */}
          <form
            onSubmit={handleCustomDateSubmit}
            className="pt-2 border-t border-[#f1eee6] dark:border-white/10 space-y-2"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#527078] dark:text-slate-400 tracking-wider">
              <span>Direct Custom Date</span>
              <span className="font-mono">YYYY-MM-DD</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="date"
                value={customInputVal}
                onChange={e => setCustomInputVal(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl bg-[#f8f6f0] dark:bg-black/30 border border-[#d9d2c2] dark:border-white/15 text-xs font-mono font-bold text-[#17343a] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold cursor-pointer transition-colors shadow-2xs"
              >
                Jump
              </button>
            </div>
          </form>

          {/* Date Context Details & Line Initialization option */}
          <div className="p-2.5 rounded-xl bg-[#f8f6f0] dark:bg-white/5 border border-[#e4ddce] dark:border-white/10 flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-[#527078] dark:text-slate-400 block">
                Selected Status
              </span>
              <p className="font-semibold text-[#17343a] dark:text-white text-[11px]">
                {currentLinesCount > 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    ✓ {currentLinesCount} Sewing Lines Active
                  </span>
                ) : (
                  <span className="text-amber-700 dark:text-amber-400">
                    No line records for this date
                  </span>
                )}
              </p>
            </div>

            {currentLinesCount === 0 && onInitializeDateLines && (
              <button
                type="button"
                onClick={() => {
                  onInitializeDateLines(selectedDate);
                  setIsOpen(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                title="Create 34 standard line records for this date using regular data template"
              >
                <Plus className="w-3 h-3" />
                <span>Seed 34 Lines</span>
              </button>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
};
