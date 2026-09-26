/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OfflineDataPointDiff {
  field: string;
  label: string;
  previousValue?: any;
  newValue: any;
}

export interface OfflineActivityLogEntry {
  id: string;
  timestamp: string; // ISO String
  formattedTime: string; // Readable local date & time
  category: 'line' | 'checklist' | 'todo' | 'lean' | 'factory' | 'import';
  action: 'create' | 'update' | 'delete' | 'batch_edit' | 'import';
  entityId: string;
  entityTitle: string;
  dataPoints: OfflineDataPointDiff[];
  summary: string;
  operatorName: string;
  operatorRole?: string;
  syncStatus: 'pending' | 'synced';
  syncedAt?: string;
}

const OFFLINE_MODE_KEY = 'ie_system_offline';
const OFFLINE_LOGS_KEY = 'ie_offline_activity_log';

/**
 * Check if the system is currently in Offline mode (Online Connection Off)
 * Defaults to true as requested.
 */
export function isSystemOffline(): boolean {
  try {
    const val = localStorage.getItem(OFFLINE_MODE_KEY);
    if (val === null) {
      // Default to Offline (Online Connection Off)
      localStorage.setItem(OFFLINE_MODE_KEY, 'true');
      return true;
    }
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set the system offline/online state
 */
export function setSystemOffline(offline: boolean): void {
  try {
    localStorage.setItem(OFFLINE_MODE_KEY, offline ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('ie_offline_status_change', { detail: { isOffline: offline } }));
  } catch (e) {
    console.error('Failed to set offline state:', e);
  }
}

/**
 * Format timestamp into readable format
 */
export function formatTimestamp(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch {
    return isoStr;
  }
}

/**
 * Initial seed entries so the IE team immediately has rich data to review
 */
function getInitialSeedLogs(): OfflineActivityLogEntry[] {
  const now = new Date();
  
  const timeOffset = (minsAgo: number) => {
    const d = new Date(now.getTime() - minsAgo * 60 * 1000);
    return {
      iso: d.toISOString(),
      fmt: formatTimestamp(d.toISOString())
    };
  };

  const t1 = timeOffset(65);
  const t2 = timeOffset(42);
  const t3 = timeOffset(28);
  const t4 = timeOffset(12);

  return [
    {
      id: 'off-log-seed-4',
      timestamp: t4.iso,
      formattedTime: t4.fmt,
      category: 'line',
      action: 'update',
      entityId: 'Line 04',
      entityTitle: 'Sewing Line 04 (Floor 03 / Unit A)',
      dataPoints: [
        { field: 'target', label: 'Hourly Target', previousValue: '110 pcs/hr', newValue: '125 pcs/hr' },
        { field: 'output', label: 'Current Output', previousValue: '98 pcs', newValue: '118 pcs' },
        { field: 'dhu', label: 'DHU Defect Rate', previousValue: '2.8%', newValue: '1.9%' },
        { field: 'remarks', label: 'IE Floor Remarks', previousValue: 'Minor thread tension issue', newValue: 'Guide folder aligned & needle replaced' }
      ],
      summary: 'Adjusted hourly target from 110 to 125 pcs/hr, reduced DHU to 1.9%',
      operatorName: 'Debonair IE Admin',
      operatorRole: 'SENIOR INDUSTRIAL ENGINEER',
      syncStatus: 'pending'
    },
    {
      id: 'off-log-seed-3',
      timestamp: t3.iso,
      formattedTime: t3.fmt,
      category: 'line',
      action: 'update',
      entityId: 'Line 12',
      entityTitle: 'Sewing Line 12 (Floor 04 / Unit B)',
      dataPoints: [
        { field: 'bottleneck.station', label: 'Bottleneck Workstation', previousValue: 'Collar joining', newValue: 'Armhole topstitch' },
        { field: 'bottleneck.cycleTime', label: 'Cycle Time', previousValue: '48.5 sec', newValue: '42.0 sec' },
        { field: 'bottleneck.action', label: 'Corrective Action', previousValue: 'Operator coaching needed', newValue: 'Workstation re-balanced with secondary helper' }
      ],
      summary: 'Resolved collar bottleneck; cycle time reduced by 6.5s via helper reallocation',
      operatorName: 'Debonair IE Admin',
      operatorRole: 'LEAD WORK-STUDY SPECIALIST',
      syncStatus: 'pending'
    },
    {
      id: 'off-log-seed-2',
      timestamp: t2.iso,
      formattedTime: t2.fmt,
      category: 'checklist',
      action: 'update',
      entityId: 'Checklist Task 4',
      entityTitle: 'IE Checklist: Hourly Pacing & WIP Audit',
      dataPoints: [
        { field: 'status', label: 'Audit Status', previousValue: 'Pending', newValue: 'Completed (YES)' },
        { field: 'lineWipBuffer', label: 'Floor WIP Buffer', previousValue: '620 pcs (High)', newValue: '430 pcs (Optimal)' },
        { field: 'compliance', label: 'Pacing Compliance', previousValue: '88%', newValue: '96%' }
      ],
      summary: 'Task 4 marked Completed: In-line WIP rebalanced within 450-piece target buffer',
      operatorName: 'Floor Supervisor',
      operatorRole: 'IE OPERATIONS',
      syncStatus: 'pending'
    },
    {
      id: 'off-log-seed-1',
      timestamp: t1.iso,
      formattedTime: t1.fmt,
      category: 'todo',
      action: 'update',
      entityId: 'Task #104',
      entityTitle: 'Floor Task: Re-calibrate Folder Attachment on Line 08',
      dataPoints: [
        { field: 'status', label: 'Task Status', previousValue: 'Pending', newValue: 'In Progress' },
        { field: 'priority', label: 'Priority Level', previousValue: 'Medium', newValue: 'High' },
        { field: 'assignee', label: 'Technician Assignee', previousValue: 'Unassigned', newValue: 'Maintenance Team A' }
      ],
      summary: 'Escalated priority to High & assigned Maintenance Team A for Line 08 folder calibration',
      operatorName: 'Debonair IE Admin',
      operatorRole: 'LINE BALANCER',
      syncStatus: 'synced',
      syncedAt: t2.iso
    }
  ];
}

/**
 * Retrieve all offline activity logs from storage
 */
export function getOfflineActivityLogs(): OfflineActivityLogEntry[] {
  try {
    const raw = localStorage.getItem(OFFLINE_LOGS_KEY);
    if (!raw) {
      const initial = getInitialSeedLogs();
      localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const initial = getInitialSeedLogs();
      localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to parse offline logs:', err);
    return getInitialSeedLogs();
  }
}

/**
 * Save logs to localStorage and dispatch change event
 */
function saveLogs(logs: OfflineActivityLogEntry[]) {
  try {
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('ie_offline_log_change', { detail: { logs } }));
  } catch (e) {
    console.error('Failed to save offline logs:', e);
  }
}

/**
 * Log a manual change made while the app was offline
 */
export function logOfflineActivity(
  entry: Omit<OfflineActivityLogEntry, 'id' | 'timestamp' | 'formattedTime' | 'syncStatus'>
): OfflineActivityLogEntry {
  const currentLogs = getOfflineActivityLogs();
  const now = new Date();
  const isoStr = now.toISOString();

  const newEntry: OfflineActivityLogEntry = {
    id: `off-log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    timestamp: isoStr,
    formattedTime: formatTimestamp(isoStr),
    syncStatus: 'pending',
    ...entry
  };

  const updatedLogs = [newEntry, ...currentLogs];
  saveLogs(updatedLogs);
  return newEntry;
}

/**
 * Force-sync a single log entry
 */
export function syncSingleLogEntry(id: string): OfflineActivityLogEntry[] {
  const currentLogs = getOfflineActivityLogs();
  const now = new Date().toISOString();
  const updated = currentLogs.map(l => {
    if (l.id === id) {
      return {
        ...l,
        syncStatus: 'synced' as const,
        syncedAt: now
      };
    }
    return l;
  });
  saveLogs(updated);
  return updated;
}

/**
 * Force-sync all pending log entries once connectivity is restored
 */
export function syncAllPendingLogs(): { syncedCount: number; logs: OfflineActivityLogEntry[] } {
  const currentLogs = getOfflineActivityLogs();
  const now = new Date().toISOString();
  let count = 0;

  const updated = currentLogs.map(l => {
    if (l.syncStatus === 'pending') {
      count++;
      return {
        ...l,
        syncStatus: 'synced' as const,
        syncedAt: now
      };
    }
    return l;
  });

  saveLogs(updated);
  return { syncedCount: count, logs: updated };
}

/**
 * Clear synced logs to keep audit history lean
 */
export function clearSyncedLogs(): OfflineActivityLogEntry[] {
  const currentLogs = getOfflineActivityLogs();
  const remaining = currentLogs.filter(l => l.syncStatus === 'pending');
  saveLogs(remaining);
  return remaining;
}

/**
 * Reset all logs back to seed state
 */
export function resetOfflineLogs(): OfflineActivityLogEntry[] {
  const seeds = getInitialSeedLogs();
  saveLogs(seeds);
  return seeds;
}

/**
 * Export offline activity logs as JSON string
 */
export function exportOfflineLogsAsJSON(): string {
  const logs = getOfflineActivityLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Export offline activity logs as CSV string
 */
export function exportOfflineLogsAsCSV(): string {
  const logs = getOfflineActivityLogs();
  const headers = ['ID', 'Timestamp', 'Category', 'Action', 'Entity', 'Summary', 'Modified Data Points', 'Operator', 'Sync Status', 'Synced At'];
  
  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.formattedTime}"`,
    `"${l.category.toUpperCase()}"`,
    `"${l.action.toUpperCase()}"`,
    `"${l.entityTitle.replace(/"/g, '""')}"`,
    `"${l.summary.replace(/"/g, '""')}"`,
    `"${l.dataPoints.map(d => `${d.label}: ${d.previousValue ?? 'N/A'} -> ${d.newValue}`).join('; ').replace(/"/g, '""')}"`,
    `"${l.operatorName || 'IE Operator'}"`,
    `"${l.syncStatus.toUpperCase()}"`,
    `"${l.syncedAt ? formatTimestamp(l.syncedAt) : 'Pending'}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
