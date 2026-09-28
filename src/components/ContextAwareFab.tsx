/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckSquare,
  Sparkles,
  FileSpreadsheet,
  ChevronUp,
  X,
  Layers,
  Check,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineEntry } from '../types';
import { exportReportToCSV, downloadCSV } from '../utils';

export type FabTabId = 'hourly' | 'downtime' | 'checklist' | 'lean-tools' | 'reports';

export interface FabTabOption {
  id: FabTabId;
  tabLabel: string;
  actionLabel: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorHex: string;
  bgGradient: string;
  shadowColor: string;
  badgeBg: string;
  badgeText: string;
}

export const FAB_TAB_CONFIGS: Record<FabTabId, FabTabOption> = {
  hourly: {
    id: 'hourly',
    tabLabel: 'Hourly Production',
    actionLabel: 'Hourly Production',
    shortLabel: 'Hourly Prod',
    description: "Update sewing line's hourly output & pacing",
    icon: Clock,
    colorHex: '#0891b2',
    bgGradient: 'from-cyan-600 to-teal-700',
    shadowColor: 'shadow-cyan-600/30',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
    badgeText: 'text-cyan-800 dark:text-cyan-300'
  },
  downtime: {
    id: 'downtime',
    tabLabel: 'Downtime',
    actionLabel: 'Log Downtime',
    shortLabel: 'Log Downtime',
    description: 'Record machine or Andon stoppage',
    icon: AlertTriangle,
    colorHex: '#e11d48',
    bgGradient: 'from-rose-600 to-red-700',
    shadowColor: 'shadow-rose-600/30',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700'
  },
  checklist: {
    id: 'checklist',
    tabLabel: 'Checklist',
    actionLabel: 'Verify Stand-Up',
    shortLabel: 'Stand-Up',
    description: 'Verify Top 5 stand-up & tasks',
    icon: CheckSquare,
    colorHex: '#059669',
    bgGradient: 'from-emerald-600 to-teal-700',
    shadowColor: 'shadow-emerald-600/30',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-700'
  },
  'lean-tools': {
    id: 'lean-tools',
    tabLabel: 'Lean & Kaizen',
    actionLabel: 'Log Action Item',
    shortLabel: 'Kaizen Action',
    description: 'Create countermeasure investigation',
    icon: Sparkles,
    colorHex: '#7c3aed',
    bgGradient: 'from-violet-600 to-purple-700',
    shadowColor: 'shadow-violet-600/30',
    badgeBg: 'bg-violet-100',
    badgeText: 'text-violet-700'
  },
  reports: {
    id: 'reports',
    tabLabel: 'Reports',
    actionLabel: 'Export Shift CSV',
    shortLabel: 'Export CSV',
    description: 'Download shift production ledger',
    icon: FileSpreadsheet,
    colorHex: '#0284c7',
    bgGradient: 'from-sky-600 to-blue-700',
    shadowColor: 'shadow-sky-600/30',
    badgeBg: 'bg-sky-100',
    badgeText: 'text-sky-700'
  }
};

export interface ContextAwareFabProps {
  initialTab?: FabTabId;
  onOpenHourlyProduction?: () => void;
  onOpenNewDowntime?: () => void;
  onOpenNewAction?: () => void;
  onChecklistAction?: () => void;
  onExportReport?: () => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  lines?: LineEntry[];
  effectiveDate?: string;
  onTriggerToast?: (title: string, message: string, type?: 'success' | 'info') => void;
}

export const ContextAwareFab: React.FC<ContextAwareFabProps> = ({
  initialTab = 'hourly',
  onOpenHourlyProduction,
  onOpenNewDowntime,
  onOpenNewAction,
  onChecklistAction,
  onExportReport,
  onNavigate,
  lines = [],
  effectiveDate = '2026-09-24',
  onTriggerToast
}) => {
  const [activeTabId, setActiveTabId] = useState<FabTabId>(() => {
    try {
      const saved = localStorage.getItem('ie_fab_active_tab');
      if (saved && saved in FAB_TAB_CONFIGS) return saved as FabTabId;
    } catch {}
    return (initialTab in FAB_TAB_CONFIGS ? initialTab : 'hourly') as FabTabId;
  });

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync to local storage
  const handleSelectTab = (tabId: FabTabId, executeImmediate = false) => {
    setActiveTabId(tabId);
    try {
      localStorage.setItem('ie_fab_active_tab', tabId);
    } catch {}

    if (executeImmediate) {
      executeActionForTab(tabId);
      setIsOpen(false);
    }
  };

  // Close speed-dial on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Execute primary action corresponding to active tab
  const executeActionForTab = (tabId: FabTabId) => {
    switch (tabId) {
      case 'hourly': {
        if (onOpenHourlyProduction) {
          onOpenHourlyProduction();
        } else if (onNavigate) {
          onNavigate('datas');
        }
        break;
      }
      case 'downtime': {
        if (onOpenNewDowntime) {
          onOpenNewDowntime();
        } else if (onNavigate) {
          onNavigate('loss-pareto');
        }
        break;
      }
      case 'checklist': {
        if (onChecklistAction) {
          onChecklistAction();
          onTriggerToast?.('Stand-Up Synchronized', 'Morning Top 5 Stand-Up checklist verified.', 'success');
        } else if (onNavigate) {
          onNavigate('checklist');
        }
        break;
      }
      case 'lean-tools': {
        if (onOpenNewAction) {
          onOpenNewAction();
        } else if (onNavigate) {
          onNavigate('lean-tools');
        }
        break;
      }
      case 'reports': {
        if (onExportReport) {
          onExportReport();
        } else if (lines.length > 0) {
          try {
            const csv = exportReportToCSV(lines, effectiveDate);
            downloadCSV(`Debonair_Shift_Report_${effectiveDate}.csv`, csv);
            onTriggerToast?.('CSV Export Complete', `Shift report CSV exported for ${effectiveDate}.`, 'success');
          } catch {
            if (onNavigate) onNavigate('reports');
          }
        } else if (onNavigate) {
          onNavigate('reports');
        }
        break;
      }
    }
  };

  const handleMainFabClick = () => {
    executeActionForTab(activeTabId);
  };

  const activeConfig = FAB_TAB_CONFIGS[activeTabId] || FAB_TAB_CONFIGS.hourly;
  const ActiveIcon = activeConfig.icon;

  const tabList = Object.values(FAB_TAB_CONFIGS);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-[calc(8.25rem+env(safe-area-inset-bottom,0px))] sm:bottom-36 right-3.5 sm:right-6 z-30 flex flex-col items-end select-none"
    >
      {/* Speed Dial Menu (Fans Upwards) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3 flex flex-col items-end gap-2"
          >
            {/* Context Switcher Header Pill */}
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-slate-800 shadow-lg text-[10px] text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>Select Active Action Mode</span>
            </div>

            {/* List of Contextual Tab Options */}
            {tabList.map((item) => {
              const isSelected = item.id === activeTabId;
              const ItemIcon = item.icon;

              return (
                <div key={item.id} className="flex items-center gap-2">
                  {/* Text Label Pill */}
                  <button
                    type="button"
                    onClick={() => handleSelectTab(item.id, true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent'
                        : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-[#d9d2c2] dark:border-slate-700 hover:border-[#176f78]'
                    }`}
                  >
                    <span>{item.actionLabel}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">
                      ({item.tabLabel})
                    </span>
                    {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </button>

                  {/* Icon Circular Trigger */}
                  <button
                    type="button"
                    onClick={() => handleSelectTab(item.id, true)}
                    title={`${item.actionLabel} (${item.tabLabel})`}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer bg-gradient-to-br ${item.bgGradient} ${
                      isSelected ? 'ring-2 ring-offset-2 ring-white dark:ring-offset-slate-950 scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
                  >
                    <ItemIcon className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dual-Action FAB (Primary Click = Execute Action; Split Toggle = Open Context Dial) */}
      <div className="flex items-center shadow-2xl rounded-full border border-white/20 dark:border-white/10 overflow-hidden ring-1 ring-black/10">
        {/* Primary Action Button (Executes active action) */}
        <button
          id="dashboard-context-fab-main"
          type="button"
          onClick={handleMainFabClick}
          title={`${activeConfig.actionLabel} (${activeConfig.tabLabel}) • Faster access to primary floor actions`}
          aria-label={activeConfig.actionLabel}
          className={`flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r ${activeConfig.bgGradient} text-white font-bold transition-all duration-200 hover:brightness-110 active:scale-95 cursor-pointer touch-manipulation`}
        >
          {/* Animated Morphing Icon */}
          <motion.div
            key={activeConfig.id}
            initial={{ scale: 0.6, rotate: -25, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.6, rotate: 25, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="flex items-center justify-center shrink-0"
          >
            <ActiveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </motion.div>

          {/* Action Label (Visible on all screens with responsive sizing) */}
          <div className="flex flex-col text-left leading-none">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white font-display">
              {activeConfig.actionLabel}
            </span>
            <span className="text-[9px] text-white/80 font-medium font-mono uppercase tracking-wider mt-0.5">
              {activeConfig.tabLabel}
            </span>
          </div>
        </button>

        {/* Speed-Dial Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          title="Switch Active Action Mode (Line Data, Downtime, Checklist, Kaizen, Reports)"
          aria-label="Toggle action options"
          aria-expanded={isOpen}
          className={`h-full px-2 sm:px-2.5 py-3 sm:py-3.5 bg-black/20 hover:bg-black/35 active:bg-black/45 text-white/90 transition-all border-l border-white/15 cursor-pointer flex items-center justify-center`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </motion.div>
        </button>
      </div>
    </div>
  );
};
