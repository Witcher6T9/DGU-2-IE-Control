/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DownloadCloud, Check, X, RefreshCw, AlertTriangle, Sparkles, Layout, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SystemUpdatePush, AppPageLayoutConfig } from '../types';
import {
  getActiveSystemUpdate,
  acknowledgeSystemUpdate,
  hasAcknowledgedUpdate
} from '../utils/systemUpdateManager';
import { saveStoredAppPageLayout, getStoredAppPageLayout } from '../utils/layoutManager';

interface SystemUpdateReceiverProps {
  onLayoutApplied?: (newLayout: AppPageLayoutConfig) => void;
}

export const SystemUpdateReceiver: React.FC<SystemUpdateReceiverProps> = ({ onLayoutApplied }) => {
  const [update, setUpdate] = useState<SystemUpdatePush | null>(() => {
    const active = getActiveSystemUpdate();
    if (active && !hasAcknowledgedUpdate(active.id)) {
      return active;
    }
    return null;
  });
  const [isApplying, setIsApplying] = useState(false);
  const [countdown, setCountdown] = useState<number>(30);

  useEffect(() => {
    const handlePushed = (e: any) => {
      const pushedUpdate: SystemUpdatePush = e.detail;
      if (pushedUpdate) {
        setUpdate(pushedUpdate);
        setCountdown(30);
      }
    };

    const handleRolledBack = (e: any) => {
      setUpdate(null);
    };

    window.addEventListener('debonair:system_update_pushed', handlePushed);
    window.addEventListener('debonair:system_update_rolled_back', handleRolledBack);
    return () => {
      window.removeEventListener('debonair:system_update_pushed', handlePushed);
      window.removeEventListener('debonair:system_update_rolled_back', handleRolledBack);
    };
  }, []);

  // Countdown timer for mandatory updates
  useEffect(() => {
    if (!update || update.severity !== 'mandatory') return;
    if (countdown <= 0) {
      handleApplyUpdate();
      return;
    }
    const timer = setInterval(() => {
      setCountdown(c => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [update, countdown]);

  if (!update) return null;

  const handleApplyUpdate = () => {
    setIsApplying(true);
    acknowledgeSystemUpdate(update.id);

    // If layout configuration is attached, apply it!
    if (update.actionPayload?.layoutConfig) {
      const current = getStoredAppPageLayout();
      const merged: AppPageLayoutConfig = {
        ...current,
        ...update.actionPayload.layoutConfig
      };
      saveStoredAppPageLayout(merged);
      if (onLayoutApplied) onLayoutApplied(merged);
    }

    // If reload requested or cache cleared, refresh the window smoothly
    if (update.actionPayload?.reloadRequired || update.category === 'ota_hotfix') {
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } else {
      setTimeout(() => {
        setIsApplying(false);
        setUpdate(null);
      }, 500);
    }
  };

  const handleDismiss = () => {
    acknowledgeSystemUpdate(update.id);
    setUpdate(null);
  };

  // 1. Mandatory Update Modal Dialog (Cannot be ignored)
  if (update.severity === 'mandatory') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
        <div className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#1c1c1e] border-2 border-rose-500 shadow-2xl space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                {update.version} MANDATORY UPDATE
              </span>
              <span className="text-xs font-mono text-slate-500">Auto-reload in {countdown}s</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
              {update.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Broadcasted by Tier_0 Root Administration. This critical patch must be applied to maintain shop floor integrity.
            </p>
          </div>

          {update.releaseNotes && update.releaseNotes.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Patch Directives:</div>
              {update.releaseNotes.map((note, idx) => (
                <div key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={handleApplyUpdate}
              disabled={isApplying}
              className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isApplying ? 'animate-spin' : ''}`} />
              <span>{isApplying ? 'Applying Critical Update...' : 'Apply & Reload Now'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Important / Normal Non-Intrusive Top Alert Banner
  return (
    <div className="sticky top-0 z-45 bg-linear-to-r from-blue-700 via-indigo-700 to-slate-900 text-white border-b border-blue-400/30 px-3 sm:px-6 py-2.5 shadow-md animate-fadeIn">
      <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 shrink-0">
            {update.category === 'layout_push' ? <Layout className="w-4 h-4" /> : <DownloadCloud className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.2 rounded-md bg-white/20 text-white text-[10px] font-mono font-bold">
                {update.version}
              </span>
              <span className="px-2 py-0.2 rounded-md bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                {update.category.replace('_', ' ')}
              </span>
              <strong className="text-xs sm:text-sm font-bold truncate">{update.title}</strong>
            </div>
            {update.releaseNotes && update.releaseNotes.length > 0 && (
              <p className="text-[11px] text-blue-100/80 truncate mt-0.5">
                • {update.releaseNotes[0]}
                {update.releaseNotes.length > 1 ? ` (+${update.releaseNotes.length - 1} more)` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={isApplying}
            className="px-3.5 py-1.5 rounded-xl bg-white text-slate-950 hover:bg-blue-50 font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{isApplying ? 'Applying...' : update.actionLabel || 'Apply Update'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 hover:text-white cursor-pointer transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
