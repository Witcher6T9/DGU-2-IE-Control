/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WifiOff, ChevronRight, Activity, Wifi, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { isSystemOffline, setSystemOffline } from '../utils/offlineSyncManager';

interface OfflineIndicatorProps {
  onOpenOfflineLog?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ onOpenOfflineLog }) => {
  const isBrowserOnline = useOnlineStatus();
  const [isOfflineConfig, setIsOfflineConfig] = useState<boolean>(() => isSystemOffline());
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleStatusChange = (e: any) => {
      if (typeof e.detail?.isOffline === 'boolean') {
        const wasOffline = isOfflineConfig;
        setIsOfflineConfig(e.detail.isOffline);
        if (wasOffline && !e.detail.isOffline) {
          setShowOnlineToast(true);
          setTimeout(() => setShowOnlineToast(false), 3800);
        }
      }
    };

    window.addEventListener('ie_offline_status_change', handleStatusChange);
    return () => {
      window.removeEventListener('ie_offline_status_change', handleStatusChange);
    };
  }, [isOfflineConfig]);

  const handleConnectOnline = () => {
    setSystemOffline(false);
  };

  if (showOnlineToast) {
    return (
      <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-3 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/50 px-3.5 py-2 text-xs font-bold text-emerald-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="tracking-wide">Online Ready • Cloud Sync 100% Active</span>
      </div>
    );
  }

  const shouldShow = isOfflineConfig || !isBrowserOnline;

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] left-3 sm:bottom-6 sm:left-6 z-40 flex items-center gap-2.5 rounded-2xl bg-[#0f282f]/95 border border-amber-500/50 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-amber-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-2 duration-200 max-w-[calc(100vw-1.5rem)]">
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0 truncate">
        <span className="tracking-wide truncate">Offline (Connection Off)</span>
        <span className="text-[11px] text-amber-200/80 font-normal hidden md:inline">• Local cache active</span>
      </div>

      <button
        type="button"
        onClick={handleConnectOnline}
        className="ml-auto sm:ml-1 px-2.5 py-1 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 hover:text-emerald-100 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 border border-emerald-400/40 transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0"
        title="Switch to Online Ready & Sync Immediately"
      >
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span>Go Online</span>
      </button>

      {onOpenOfflineLog && (
        <button
          type="button"
          onClick={onOpenOfflineLog}
          className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] sm:text-[11px] font-bold flex items-center gap-1 border border-amber-400/30 transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0"
          title="Open Offline Activity Log in Database Modal"
        >
          <Activity className="w-3 h-3 text-amber-400" />
          <span className="hidden xs:inline">Activity Log</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

