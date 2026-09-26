/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  Layers,
  CheckSquare,
  ListTodo,
  Sparkles,
  User,
  Copy,
  Check,
  Send,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import {
  OfflineActivityLogEntry,
  getOfflineActivityLogs,
  syncSingleLogEntry,
  syncAllPendingLogs,
  clearSyncedLogs,
  resetOfflineLogs,
  exportOfflineLogsAsJSON,
  exportOfflineLogsAsCSV,
  isSystemOffline,
  setSystemOffline,
  logOfflineActivity
} from '../utils/offlineSyncManager';

interface OfflineActivityLogViewProps {
  onRefreshData?: () => void;
  activeOperatorName?: string;
  activeOperatorRole?: string;
}

export const OfflineActivityLogView: React.FC<OfflineActivityLogViewProps> = ({
  activeOperatorName = 'Debonair IE Admin',
  activeOperatorRole = 'SENIOR INDUSTRIAL ENGINEER'
}) => {
  const [logs, setLogs] = useState<OfflineActivityLogEntry[]>(() => getOfflineActivityLogs());
  const [isOffline, setIsOffline] = useState<boolean>(() => isSystemOffline());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'synced'>('all');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  // Listen for storage / log events
  useEffect(() => {
    const handleLogChange = (e: any) => {
      if (e.detail?.logs) {
        setLogs(e.detail.logs);
      } else {
        setLogs(getOfflineActivityLogs());
      }
    };

    const handleStatusChange = (e: any) => {
      if (typeof e.detail?.isOffline === 'boolean') {
        setIsOffline(e.detail.isOffline);
      }
    };

    window.addEventListener('ie_offline_log_change', handleLogChange);
    window.addEventListener('ie_offline_status_change', handleStatusChange);

    return () => {
      window.removeEventListener('ie_offline_log_change', handleLogChange);
      window.removeEventListener('ie_offline_status_change', handleStatusChange);
    };
  }, []);

  const pendingCount = useMemo(() => logs.filter(l => l.syncStatus === 'pending').length, [logs]);
  const syncedCount = useMemo(() => logs.filter(l => l.syncStatus === 'synced').length, [logs]);

  // Filtered entries
  const filteredLogs = useMemo(() => {
    return logs.filter(entry => {
      if (selectedCategory !== 'all' && entry.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && entry.syncStatus !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.entityTitle.toLowerCase().includes(q);
        const matchesSummary = entry.summary.toLowerCase().includes(q);
        const matchesOperator = entry.operatorName.toLowerCase().includes(q);
        const matchesDataPoints = entry.dataPoints.some(
          dp =>
            dp.label.toLowerCase().includes(q) ||
            String(dp.previousValue || '').toLowerCase().includes(q) ||
            String(dp.newValue || '').toLowerCase().includes(q)
        );
        return matchesTitle || matchesSummary || matchesOperator || matchesDataPoints;
      }
      return true;
    });
  }, [logs, selectedCategory, selectedStatus, searchQuery]);

  const handleToggleOfflineMode = () => {
    const nextState = !isOffline;
    setIsOffline(nextState);
    setSystemOffline(nextState);
    setSyncToast({
      message: nextState
        ? 'System connection set to OFFLINE (Online Connection Off)'
        : 'System connection set to ONLINE (Server connection active)',
      type: 'info'
    });
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleForceSyncAll = () => {
    if (pendingCount === 0) {
      setSyncToast({
        message: 'All offline changes are already synchronized with the server!',
        type: 'info'
      });
      setTimeout(() => setSyncToast(null), 3000);
      return;
    }

    setIsSyncingAll(true);
    setTimeout(() => {
      const { syncedCount } = syncAllPendingLogs();
      setLogs(getOfflineActivityLogs());
      setIsSyncingAll(false);
      setSyncToast({
        message: `Successfully force-synced ${syncedCount} offline modification${syncedCount === 1 ? '' : 's'} to server!`,
        type: 'success'
      });
      setTimeout(() => setSyncToast(null), 4000);
    }, 700);
  };

  const handleSyncSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = syncSingleLogEntry(id);
    setLogs(updated);
    setSyncToast({
      message: 'Modification successfully synchronized to server.',
      type: 'success'
    });
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleClearSynced = () => {
    const remaining = clearSyncedLogs();
    setLogs(remaining);
    setSyncToast({
      message: 'Synced history cleared from local cache.',
      type: 'info'
    });
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportOfflineLogsAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debonair_offline_activity_log_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const csvStr = exportOfflineLogsAsCSV();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debonair_offline_activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyDetails = (entry: OfflineActivityLogEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const details = `[Offline Change Log]
Entity: ${entry.entityTitle}
Action: ${entry.action.toUpperCase()}
Timestamp: ${entry.formattedTime}
Operator: ${entry.operatorName} (${entry.operatorRole || 'IE'})
Status: ${entry.syncStatus.toUpperCase()}
Summary: ${entry.summary}
Modified Data Points:
${entry.dataPoints.map(dp => `  - ${dp.label}: ${dp.previousValue ?? 'N/A'} -> ${dp.newValue}`).join('\n')}`;

    navigator.clipboard.writeText(details);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSampleOfflineChange = () => {
    const randomLine = Math.floor(Math.random() * 20) + 1;
    const lineStr = String(randomLine).padStart(2, '0');
    const oldTarget = 100 + Math.floor(Math.random() * 20);
    const newTarget = oldTarget + 10 + Math.floor(Math.random() * 15);
    const oldDhu = (2.5 + Math.random() * 1.5).toFixed(1);
    const newDhu = (1.5 + Math.random() * 0.8).toFixed(1);

    logOfflineActivity({
      category: 'line',
      action: 'update',
      entityId: `Line ${lineStr}`,
      entityTitle: `Sewing Line ${lineStr} (Floor 03 / Unit A)`,
      dataPoints: [
        { field: 'target', label: 'Hourly Target', previousValue: `${oldTarget} pcs/hr`, newValue: `${newTarget} pcs/hr` },
        { field: 'dhu', label: 'DHU Defect Rate', previousValue: `${oldDhu}%`, newValue: `${newDhu}%` },
        { field: 'bottleneck.action', label: 'IE Corrective Action', previousValue: 'Waiting parts', newValue: 'Workstation re-aligned with ergonomic fixture' }
      ],
      summary: `Manual line calibration while connection OFF: Target boosted to ${newTarget} pcs/hr, DHU reduced to ${newDhu}%`,
      operatorName: activeOperatorName,
      operatorRole: activeOperatorRole
    });

    setLogs(getOfflineActivityLogs());
    setSyncToast({
      message: `Simulated offline change logged for Line ${lineStr}`,
      type: 'info'
    });
    setTimeout(() => setSyncToast(null), 3000);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'line':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#176f78]/10 text-[#176f78] dark:text-teal-300 font-mono">
            <Layers className="w-3 h-3" />
            LINE DATA
          </span>
        );
      case 'checklist':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono">
            <CheckSquare className="w-3 h-3" />
            CHECKLIST
          </span>
        );
      case 'todo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono">
            <ListTodo className="w-3 h-3" />
            FLOOR TASK
          </span>
        );
      case 'lean':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 font-mono">
            <Sparkles className="w-3 h-3" />
            KAIZEN ACTION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-500/10 text-slate-700 dark:text-slate-300 font-mono">
            SYSTEM
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
      {/* Toast Notification */}
      {syncToast && (
        <div
          className={`p-3 rounded-2xl flex items-center justify-between text-xs font-semibold shadow-md animate-fadeIn ${
            syncToast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-[#176f78] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{syncToast.message}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP SYSTEM STATUS HERO CARD */}
      <div className="rounded-2xl border border-[#d9d2c2] bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs shrink-0 ${
                isOffline
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-600'
                  : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-600'
              }`}
            >
              {isOffline ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-[#17343a]">
                  System Connection Status:
                </h4>
                {isOffline ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    OFFLINE (Connection Off)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    ONLINE (Connected)
                  </span>
                )}
              </div>
              <p className="text-xs text-[#527078] mt-0.5">
                {isOffline
                  ? 'All manual edits are captured locally in the Offline Activity Log with high-precision timestamps & field diffs.'
                  : 'Connected to primary database server. Manual offline edits can now be synced or reviewed.'}
              </p>
            </div>
          </div>

          {/* Connection Mode Toggle */}
          <button
            type="button"
            onClick={handleToggleOfflineMode}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              isOffline
                ? 'bg-white hover:bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                : 'bg-white hover:bg-amber-50 border-amber-600 text-amber-700 shadow-xs'
            }`}
          >
            {isOffline ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Simulate Connection ON</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Switch Connection OFF</span>
              </>
            )}
          </button>
        </div>

        {/* METRICS & QUICK ACTIONS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#d9d2c2]/60">
          <div className="p-2.5 rounded-xl bg-[#f8f6f0] border border-[#d9d2c2]/50">
            <span className="text-[11px] font-semibold text-[#527078] block">Total Offline Edits</span>
            <span className="text-lg font-bold font-mono text-[#17343a]">{logs.length}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <span className="text-[11px] font-semibold text-amber-800 block">Pending Force-Sync</span>
            <span className="text-lg font-bold font-mono text-amber-700">{pendingCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <span className="text-[11px] font-semibold text-emerald-800 block">Synced to Server</span>
            <span className="text-lg font-bold font-mono text-emerald-700">{syncedCount}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#f8f6f0] border border-[#d9d2c2]/50 flex flex-col justify-center">
            <span className="text-[11px] font-semibold text-[#527078] block">Local Storage Mode</span>
            <span className="text-xs font-bold text-[#176f78]">Active Cache</span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleForceSyncAll}
              disabled={isSyncingAll || pendingCount === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                pendingCount > 0
                  ? 'bg-gradient-to-r from-[#176f78] to-[#007aff] text-white hover:opacity-95 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
              <span>{isSyncingAll ? 'Syncing to Server...' : `Force-Sync All Changes (${pendingCount})`}</span>
            </button>

            <button
              type="button"
              onClick={handleAddSampleOfflineChange}
              className="px-3 py-2 rounded-xl text-xs font-medium border border-[#d9d2c2] bg-white text-slate-700 hover:bg-[#f8f6f0] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Simulate recording another offline change"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#176f78]" />
              <span>Simulate Offline Change</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#d9d2c2] bg-white text-slate-700 hover:bg-[#f8f6f0] flex items-center gap-1 transition-colors cursor-pointer"
              title="Download CSV report of offline modifications"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#d9d2c2] bg-white text-slate-700 hover:bg-[#f8f6f0] flex items-center gap-1 transition-colors cursor-pointer"
              title="Download JSON audit log"
            >
              <Download className="w-3.5 h-3.5 text-[#176f78]" />
              <span>JSON</span>
            </button>

            {syncedCount > 0 && (
              <button
                type="button"
                onClick={handleClearSynced}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1 transition-colors cursor-pointer"
                title="Remove already synchronized logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Synced</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search offline changes by line, field, value, or operator..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#d9d2c2] rounded-xl pl-9 pr-8 py-2 text-xs text-[#17343a] placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-white border border-[#d9d2c2] rounded-xl px-2.5 py-1.5 text-xs text-[#17343a] focus:outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Modules</option>
            <option value="line">Sewing Lines</option>
            <option value="checklist">Checklists</option>
            <option value="todo">Floor Tasks</option>
            <option value="lean">Kaizen Actions</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="bg-white border border-[#d9d2c2] rounded-xl px-2.5 py-1.5 text-xs text-[#17343a] focus:outline-hidden font-medium cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Sync</option>
            <option value="synced">Synced</option>
          </select>
        </div>
      </div>

      {/* OFFLINE ACTIVITY LOG LIST */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-[#d9d2c2] space-y-2">
            <WifiOff className="w-8 h-8 text-slate-400 mx-auto" />
            <h5 className="text-sm font-bold text-[#17343a]">No Offline Activity Records Found</h5>
            <p className="text-xs text-[#527078] max-w-sm mx-auto">
              {searchQuery
                ? 'No offline modifications match your search criteria. Try clearing filters.'
                : 'Any manual changes made while offline will be logged here for review and force-synchronization.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                }}
                className="mt-2 text-xs font-bold text-[#176f78] hover:underline cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          filteredLogs.map(entry => {
            const isExpanded = expandedLogIds.has(entry.id);
            const isPending = entry.syncStatus === 'pending';

            return (
              <div
                key={entry.id}
                onClick={() => toggleExpand(entry.id)}
                className={`rounded-2xl border transition-all cursor-pointer bg-white p-3.5 sm:p-4 hover:border-[#176f78]/60 shadow-2xs ${
                  isPending
                    ? 'border-amber-400/60 bg-amber-500/5'
                    : 'border-[#d9d2c2]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {getCategoryBadge(entry.category)}

                    <span className="font-bold text-sm text-[#17343a] truncate">
                      {entry.entityTitle}
                    </span>

                    <span className="text-[11px] text-[#527078] hidden sm:inline">•</span>

                    <span className="text-[11px] font-mono text-[#527078] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {entry.formattedTime}
                    </span>
                  </div>

                  {/* Sync Status Badge & Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-700 border border-amber-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Sync
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                        <Check className="w-3 h-3" />
                        Synced
                      </span>
                    )}

                    {isPending && (
                      <button
                        type="button"
                        onClick={e => handleSyncSingle(entry.id, e)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#176f78] hover:bg-[#125860] text-white shadow-2xs cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95"
                        title="Force sync this single change to server"
                      >
                        <Send className="w-3 h-3" />
                        <span>Force Sync</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={e => handleCopyDetails(entry, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#f0ece1] cursor-pointer"
                      title="Copy diff details to clipboard"
                    >
                      {copiedId === entry.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <div className="text-slate-400 p-0.5">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary text */}
                <p className="text-xs text-[#527078] mt-2 leading-relaxed">
                  {entry.summary}
                </p>

                {/* Operator info */}
                <div className="flex items-center gap-2 mt-2 text-[11px] text-[#527078]">
                  <User className="w-3 h-3 text-[#176f78]" />
                  <span>Modified by: <strong className="text-[#17343a]">{entry.operatorName}</strong></span>
                  {entry.operatorRole && (
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                      {entry.operatorRole}
                    </span>
                  )}
                  {entry.syncedAt && (
                    <span className="text-emerald-700 ml-auto hidden sm:inline">
                      Synced on {new Date(entry.syncedAt).toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {/* SPECIFIC DATA POINTS MODIFIED (Diff view) */}
                <div className="mt-3 pt-2.5 border-t border-[#d9d2c2]/50 space-y-1.5">
                  <div className="text-[11px] font-bold text-[#17343a] uppercase tracking-wider flex items-center justify-between">
                    <span>Modified Data Points ({entry.dataPoints.length}):</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {isExpanded ? 'Click to collapse' : 'Click to inspect values'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entry.dataPoints.map((dp, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#f8f6f0] border border-[#d9d2c2]/50 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-slate-700 truncate min-w-0">
                          {dp.label}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                          {dp.previousValue !== undefined && (
                            <span className="line-through text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md">
                              {String(dp.previousValue)}
                            </span>
                          )}
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                            {String(dp.newValue)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER AUDIT NOTICE */}
      <div className="p-3 rounded-xl bg-[#f8f6f0] border border-[#d9d2c2]/60 text-xs text-[#527078] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#176f78] shrink-0" />
          <span>
            Offline audit trail records are saved locally with SHA cryptographic IDs and tamper-evident timestamps.
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            const restored = resetOfflineLogs();
            setLogs(restored);
            setSyncToast({ message: 'Reset logs to factory baseline.', type: 'info' });
            setTimeout(() => setSyncToast(null), 3000);
          }}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 hover:underline shrink-0 cursor-pointer"
        >
          Reset Baseline
        </button>
      </div>
    </div>
  );
};
