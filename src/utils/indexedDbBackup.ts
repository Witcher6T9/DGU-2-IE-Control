/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineEntry, ChecklistMap, TodoItem, LeanActionItem } from '../types';

export interface UserDailyBackupSettings {
  autoDailyBackupEnabled: boolean;
  dailyBackupTime: string; // "HH:mm" in 24-hour format, e.g. "18:00"
  backupOnAppLaunch: boolean;
  backupRetentionDays: number; // e.g. 30
  lastBackupDate: string | null; // e.g. "2026-09-25"
  lastBackupTimestamp: number | null;
  lastBackupStatus?: 'success' | 'failed' | null;
  lastBackupSummary?: string | null;
}

export const DEFAULT_DAILY_BACKUP_SETTINGS: UserDailyBackupSettings = {
  autoDailyBackupEnabled: true,
  dailyBackupTime: '18:00', // 6:00 PM standard shift end
  backupOnAppLaunch: true,
  backupRetentionDays: 30,
  lastBackupDate: null,
  lastBackupTimestamp: null,
  lastBackupStatus: null,
  lastBackupSummary: null
};

export interface AppBackupState {
  lines: LineEntry[];
  checklists: ChecklistMap;
  todos: TodoItem[];
  leanActions?: LeanActionItem[];
  metadata?: {
    appVersion?: string;
    factoryName?: string;
    activeDate?: string;
    exportedBy?: string;
  };
}

export interface DailyBackupRecord {
  id: string; // e.g., "backup_2026-09-25_180000_w8x"
  date: string; // "2026-09-25"
  timestamp: number; // Unix epoch ms
  timeStr: string; // Formatted local time, e.g. "06:00 PM"
  triggerType: 'scheduled' | 'manual' | 'startup';
  appVersion: string;
  stats: {
    linesCount: number;
    checklistsDaysCount: number;
    todosCount: number;
    leanActionsCount: number;
    sizeBytes: number;
    sizeFormatted: string;
  };
  data: AppBackupState;
}

const DB_NAME = 'DGU2_IE_DailyControl_IndexedDB';
const DB_VERSION = 1;
const STORE_NAME = 'daily_backups';

/**
 * Initialize or upgrade the IndexedDB database
 */
export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('triggerType', 'triggerType', { unique: false });
      }
    };

    request.onsuccess = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };

    request.onerror = event => {
      reject((event.target as IDBOpenDBRequest).error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Save an entire application state JSON snapshot to IndexedDB
 */
export async function saveBackupToIndexedDB(
  state: AppBackupState,
  triggerType: 'scheduled' | 'manual' | 'startup' = 'scheduled'
): Promise<DailyBackupRecord> {
  const db = await initDB();

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const id = `backup_${dateStr}_${hours}${minutes}${seconds}_${randomSuffix}`;

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Calculate size
  const serialized = JSON.stringify(state);
  const sizeBytes = new Blob([serialized]).size;

  const record: DailyBackupRecord = {
    id,
    date: dateStr,
    timestamp: now.getTime(),
    timeStr,
    triggerType,
    appVersion: '2.4.0',
    stats: {
      linesCount: state.lines?.length || 0,
      checklistsDaysCount: Object.keys(state.checklists || {}).length,
      todosCount: state.todos?.length || 0,
      leanActionsCount: state.leanActions?.length || 0,
      sizeBytes,
      sizeFormatted: formatBytes(sizeBytes)
    },
    data: {
      lines: state.lines || [],
      checklists: state.checklists || {},
      todos: state.todos || [],
      leanActions: state.leanActions || [],
      metadata: {
        appVersion: '2.4.0',
        factoryName: state.metadata?.factoryName || 'Debonair Unit-02',
        activeDate: state.metadata?.activeDate || dateStr,
        exportedBy: state.metadata?.exportedBy || 'IE Daily Control Auto-Scheduler'
      }
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => {
        resolve(record);
      };

      request.onerror = event => {
        reject((event.target as IDBRequest).error || new Error('Failed to store backup record in IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieve all backup snapshots from IndexedDB, sorted newest first
 */
export async function getAllBackupsFromIndexedDB(): Promise<DailyBackupRecord[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const records: DailyBackupRecord[] = request.result || [];
        // Sort descending by timestamp
        records.sort((a, b) => b.timestamp - a.timestamp);
        resolve(records);
      };

      request.onerror = event => {
        reject((event.target as IDBRequest).error || new Error('Failed to retrieve backups from IndexedDB'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Retrieve a specific backup by ID
 */
export async function getBackupByIdFromIndexedDB(id: string): Promise<DailyBackupRecord | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = event => {
        reject((event.target as IDBRequest).error || new Error(`Failed to get backup ${id}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Delete a single backup record by ID
 */
export async function deleteBackupFromIndexedDB(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = event => {
        reject((event.target as IDBRequest).error || new Error(`Failed to delete backup ${id}`));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Clear all backups from IndexedDB
 */
export async function clearAllBackupsFromIndexedDB(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = event => {
        reject((event.target as IDBRequest).error || new Error('Failed to clear backups store'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Estimate storage quota used by the browser
 */
export async function getIndexedDBStorageInfo(): Promise<{
  usageBytes: number;
  quotaBytes: number;
  formattedUsage: string;
  formattedQuota: string;
  usagePercent: number;
}> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        usageBytes: usage,
        quotaBytes: quota,
        formattedUsage: formatBytes(usage),
        formattedQuota: formatBytes(quota),
        usagePercent: quota > 0 ? (usage / quota) * 100 : 0
      };
    } catch (e) {
      // ignore
    }
  }
  return {
    usageBytes: 0,
    quotaBytes: 0,
    formattedUsage: 'Unknown',
    formattedQuota: 'Unknown',
    usagePercent: 0
  };
}

/**
 * Download a backup record as a JSON file to disk
 */
export function downloadBackupRecordAsJSON(record: DailyBackupRecord): void {
  const filename = `ie_daily_control_${record.date}_${record.triggerType}.json`;
  const exportPayload = {
    backupId: record.id,
    version: record.appVersion,
    exportedAt: new Date(record.timestamp).toISOString(),
    triggerType: record.triggerType,
    stats: record.stats,
    ...record.data
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Checks if a scheduled backup should run right now.
 * Criteria:
 * 1. Auto-backup enabled in settings.
 * 2. Current time >= configured backup time (e.g. "18:00").
 * 3. Today's date has NOT yet been backed up (lastBackupDate !== todayStr).
 */
export function shouldRunScheduledBackup(
  settings: UserDailyBackupSettings,
  isStartupCheck = false
): boolean {
  if (!settings.autoDailyBackupEnabled) {
    return false;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  // Already backed up today
  if (settings.lastBackupDate === todayStr) {
    return false;
  }

  // Parse target time
  const [targetH, targetM] = (settings.dailyBackupTime || '18:00').split(':').map(Number);
  const currentH = now.getHours();
  const currentM = now.getMinutes();

  const currentMinutesTotal = currentH * 60 + currentM;
  const targetMinutesTotal = (targetH || 0) * 60 + (targetM || 0);

  // If this is a startup check, and backupOnAppLaunch is true, and we are past the target time today
  if (isStartupCheck) {
    return settings.backupOnAppLaunch && currentMinutesTotal >= targetMinutesTotal;
  }

  // Normal periodic check: has the clock reached or passed target time today?
  return currentMinutesTotal >= targetMinutesTotal;
}

/**
 * Prune old backups exceeding retention days
 */
export async function pruneOldBackups(retentionDays = 30): Promise<number> {
  if (retentionDays <= 0) return 0;
  try {
    const backups = await getAllBackupsFromIndexedDB();
    const cutoffMs = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    for (const b of backups) {
      if (b.timestamp < cutoffMs) {
        await deleteBackupFromIndexedDB(b.id);
        deletedCount++;
      }
    }
    return deletedCount;
  } catch (err) {
    console.error('Error pruning old backups:', err);
    return 0;
  }
}
