/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * Mobile Quick Action Floating Action Button (FAB) & Thumb-Zone Speed Dial
 */

import React, { useState } from 'react';
import {
  Zap,
  X,
  Clock,
  AlertTriangle,
  ClipboardList,
  Layers,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileQuickActionFABProps {
  onOpenHourlyProduction: () => void;
  onOpenNewDowntime: () => void;
  onOpenNewAction: () => void;
  onNavigate: (tab: string, lineNo?: string) => void;
}

export const MobileQuickActionFAB: React.FC<MobileQuickActionFABProps> = ({
  onOpenHourlyProduction,
  onOpenNewDowntime,
  onOpenNewAction,
  onNavigate
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(12);
      } catch {}
    }
  };

  const handleAction = (actionFn: () => void) => {
    triggerHaptic();
    setIsOpen(false);
    actionFn();
  };

  return (
    <>
      {/* Backdrop overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Floating Speed Dial / Sheet */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden flex flex-col items-end pb-safe select-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.92 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="mb-3 w-[290px] rounded-3xl bg-[#fbfaf6] dark:bg-[#18202b] border border-[#d9d2c2] dark:border-[#2e3b4d] shadow-[0_12px_36px_rgba(0,0,0,0.28)] p-3 text-[#17343a] dark:text-slate-200 space-y-1.5"
            >
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2a3646] mb-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#176f78] dark:text-teal-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Floor Quick Actions</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500 uppercase">Unit-02</span>
              </div>

              {/* 1. Log Hourly Production */}
              <button
                type="button"
                onClick={() => handleAction(onOpenHourlyProduction)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1f2937] hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-[#d9d2c2] dark:border-[#374558] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17343a] dark:text-white truncate">
                      Log Hourly Output
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Bottleneck, Assembly &amp; Output pcs
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 2. Report Downtime */}
              <button
                type="button"
                onClick={() => handleAction(onOpenNewDowntime)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1f2937] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-[#d9d2c2] dark:border-[#374558] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17343a] dark:text-white truncate">
                      Report Line Downtime
                    </div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 truncate">
                      Machine breakdown, fabric or quality stop
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 3. New Action Item */}
              <button
                type="button"
                onClick={() => handleAction(onOpenNewAction)}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1f2937] hover:bg-blue-50 dark:hover:bg-blue-950/30 border border-[#d9d2c2] dark:border-[#374558] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Plus className="w-5 h-5 stroke-[2.4]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17343a] dark:text-white truncate">
                      Create Action Item
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Floor 5-Why or corrective assignment
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>

              {/* 4. Quick Checklist Audit */}
              <button
                type="button"
                onClick={() => handleAction(() => onNavigate('checklist'))}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-[#1f2937] hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-[#d9d2c2] dark:border-[#374558] text-left transition-all active:scale-[0.98] cursor-pointer touch-manipulation shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <ClipboardList className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17343a] dark:text-white truncate">
                      Daily 13-Task Checklist
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      Checklist compliance &amp; 5S audits
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Round Floating Trigger Button */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic();
            setIsOpen(prev => !prev);
          }}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close Quick Actions' : 'Open Floor Quick Actions'}
          className={`relative w-13 h-13 min-w-[52px] min-h-[52px] rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(23,111,120,0.38)] transition-all duration-200 cursor-pointer touch-manipulation active:scale-90 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 ring-4 ring-slate-800/40'
              : 'bg-[#176f78] text-white hover:bg-[#125860] ring-4 ring-[#176f78]/30'
          }`}
        >
          {isOpen ? (
            <X className="w-6 h-6 stroke-[2.4]" />
          ) : (
            <>
              <Zap className="w-6 h-6 fill-white stroke-[2.2] animate-pulse" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
            </>
          )}
        </button>
      </div>
    </>
  );
};
