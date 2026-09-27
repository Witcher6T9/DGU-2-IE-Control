/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SystemUpdatePush, UserProfile } from '../types';
import { playBottleneckAlertSound, playWipAlertSound } from './audioAlert';

export const STORAGE_KEY_SYSTEM_UPDATES = 'debonair_system_updates_list_v1';
export const STORAGE_KEY_ACTIVE_UPDATE = 'debonair_system_active_update_v1';
export const STORAGE_KEY_ACKNOWLEDGED_UPDATES = 'debonair_acknowledged_updates_v1';

export const INITIAL_UPDATES_HISTORY: SystemUpdatePush[] = [
  {
    id: 'upd-2026-0925-01',
    version: 'v2.4.0',
    title: 'Mobile Phone Settings & Long-Polling Firestore Engine',
    category: 'ota_hotfix',
    severity: 'important',
    targetScope: 'all_terminals',
    releaseNotes: [
      'Introduced authentic iOS-style settings modal with subpage stack navigation',
      'Configured resilient Firestore long-polling to prevent proxy timeout disconnects',
      'Centralized automated shift-end IndexedDB snapshots with 30-day retention'
    ],
    pushedAt: '2026-09-25T14:30:00.000Z',
    pushedByEmail: 'ashikur.rahman.0971@gmail.com',
    pushedByName: 'Ashikur Rahman (Tier 0 Root)',
    status: 'delivered',
    actionLabel: 'Up to Date',
    acknowledgedCount: 34,
    totalTerminalsTargeted: 34
  },
  {
    id: 'upd-2026-0924-02',
    version: 'v2.3.9',
    title: 'Debonair Unit-02 34-Line Production Baseline Data Sync',
    category: 'operational_directive',
    severity: 'normal',
    targetScope: 'all_terminals',
    releaseNotes: [
      'Calibrated baseline line entries across 6 production floors (Padma, Meghna, Karnophuli, Korotoya, Shitalokshya, Turag)',
      'Added automated bottleneck cycle time audio warning chimes',
      'Locked station pitch calculations to 36.4s target takt'
    ],
    pushedAt: '2026-09-24T09:00:00.000Z',
    pushedByEmail: 'ashashikhossain77@gmail.com',
    pushedByName: 'Ashik Hossain (Master Admin)',
    status: 'delivered',
    actionLabel: 'Synced',
    acknowledgedCount: 34,
    totalTerminalsTargeted: 34
  }
];

export function getSystemUpdatesHistory(): SystemUpdatePush[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SYSTEM_UPDATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load system updates history:', e);
  }
  return INITIAL_UPDATES_HISTORY;
}

export function saveSystemUpdatesHistory(updates: SystemUpdatePush[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SYSTEM_UPDATES, JSON.stringify(updates));
  } catch (e) {
    console.error('Failed to save system updates history:', e);
  }
}

export function getActiveSystemUpdate(): SystemUpdatePush | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_UPDATE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.status === 'active') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to get active system update:', e);
  }
  return null;
}

export function pushSystemUpdate(
  updateData: Omit<SystemUpdatePush, 'id' | 'pushedAt' | 'status' | 'acknowledgedCount' | 'pushedByEmail' | 'pushedByName'>,
  profile?: UserProfile
): SystemUpdatePush {
  const newId = `upd-${Date.now()}`;
  const newUpdate: SystemUpdatePush = {
    ...updateData,
    id: newId,
    pushedAt: new Date().toISOString(),
    pushedByEmail: profile?.email || 'ashikur.rahman.0971@gmail.com',
    pushedByName: profile?.name ? `${profile.name} (Tier 0 Root)` : 'Tier_0 System Administrator',
    status: 'active',
    acknowledgedCount: 1,
    totalTerminalsTargeted: 34
  };

  // 1. Set as active update in storage
  localStorage.setItem(STORAGE_KEY_ACTIVE_UPDATE, JSON.stringify(newUpdate));

  // 2. Append to history
  const history = getSystemUpdatesHistory();
  const updatedHistory = [newUpdate, ...history];
  saveSystemUpdatesHistory(updatedHistory);

  // 3. Play auditory chime if configured
  try {
    if (newUpdate.severity === 'mandatory') {
      playBottleneckAlertSound();
    } else {
      playWipAlertSound();
    }
  } catch (e) {
    // Audio might fail if user has not interacted yet
  }

  // 4. Dispatch live browser window event for all listening components
  window.dispatchEvent(new CustomEvent('debonair:system_update_pushed', { detail: newUpdate }));

  return newUpdate;
}

export function rollbackSystemUpdate(updateId: string, profile?: UserProfile): void {
  const history = getSystemUpdatesHistory();
  const updatedHistory = history.map(item => {
    if (item.id === updateId || item.status === 'active') {
      return {
        ...item,
        status: 'rolled_back' as const
      };
    }
    return item;
  });

  saveSystemUpdatesHistory(updatedHistory);
  localStorage.removeItem(STORAGE_KEY_ACTIVE_UPDATE);

  window.dispatchEvent(
    new CustomEvent('debonair:system_update_rolled_back', {
      detail: {
        updateId,
        rolledBackBy: profile?.email || 'Tier_0 Administrator',
        timestamp: new Date().toISOString()
      }
    })
  );
}

export function acknowledgeSystemUpdate(updateId: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACKNOWLEDGED_UPDATES);
    const set = raw ? JSON.parse(raw) : [];
    if (!set.includes(updateId)) {
      set.push(updateId);
      localStorage.setItem(STORAGE_KEY_ACKNOWLEDGED_UPDATES, JSON.stringify(set));
    }

    // Increment acknowledged count on active update if matches
    const active = getActiveSystemUpdate();
    if (active && active.id === updateId) {
      active.acknowledgedCount = (active.acknowledgedCount || 1) + 1;
      localStorage.setItem(STORAGE_KEY_ACTIVE_UPDATE, JSON.stringify(active));
    }
  } catch (e) {
    console.warn('Failed to acknowledge system update:', e);
  }
}

export function hasAcknowledgedUpdate(updateId: string): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACKNOWLEDGED_UPDATES);
    if (raw) {
      const set = JSON.parse(raw);
      return Array.isArray(set) && set.includes(updateId);
    }
  } catch (e) {
    // ignore
  }
  return false;
}
