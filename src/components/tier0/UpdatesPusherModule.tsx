/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DownloadCloud,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
  Radio,
  Sliders,
  ShieldAlert,
  Smartphone,
  Check,
  Copy,
  Plus,
  Trash2,
  Clock,
  Activity,
  Flame,
  Volume2,
  FileCode,
  Users,
  Layout,
  Play
} from 'lucide-react';
import {
  SystemUpdatePush,
  UpdateCategory,
  UpdateSeverity,
  UpdateTargetScope,
  UserProfile,
  LineEntry,
  AppPageLayoutConfig
} from '../../types';
import {
  getSystemUpdatesHistory,
  getActiveSystemUpdate,
  pushSystemUpdate,
  rollbackSystemUpdate
} from '../../utils/systemUpdateManager';
import { getStoredAppPageLayout } from '../../utils/layoutManager';
import { playBottleneckAlertSound, playWipAlertSound } from '../../utils/audioAlert';

interface UpdatesPusherModuleProps {
  profile: UserProfile;
  lines?: LineEntry[];
  showToast: (m: string) => void;
  initialAttachedLayout?: Partial<AppPageLayoutConfig>;
}

export const UpdatesPusherModule: React.FC<UpdatesPusherModuleProps> = ({
  profile,
  lines = [],
  showToast,
  initialAttachedLayout
}) => {
  const [history, setHistory] = useState<SystemUpdatePush[]>(() => getSystemUpdatesHistory());
  const [activeUpdate, setActiveUpdate] = useState<SystemUpdatePush | null>(() => getActiveSystemUpdate());
  const [activeSubTab, setActiveSubTab] = useState<'pusher' | 'history' | 'preview'>('pusher');
  const [isPushing, setIsPushing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State for Composing a New Update
  const [targetVersion, setTargetVersion] = useState<string>('v2.4.1');
  const [title, setTitle] = useState<string>(
    initialAttachedLayout
      ? 'New Floor Page Layout Blueprint Deployed by Tier 0'
      : 'Critical Shift Attainment & Telemetry Engine Hotfix'
  );
  const [category, setCategory] = useState<UpdateCategory>(
    initialAttachedLayout ? 'layout_push' : 'ota_hotfix'
  );
  const [severity, setSeverity] = useState<UpdateSeverity>('important');
  const [targetScope, setTargetScope] = useState<UpdateTargetScope>('all_terminals');
  const [actionLabel, setActionLabel] = useState<string>(
    initialAttachedLayout ? 'Apply New Layout Now' : 'Update & Reload Workspace'
  );
  const [bulletPoints, setBulletPoints] = useState<string[]>(
    initialAttachedLayout
      ? [
          'Updated workspace navigation order and custom floor card density',
          'Synchronized industrial typography scaling and high-visibility branding',
          'Calibrated executive dashboard widget sequence for shift attainment'
        ]
      : [
          'Optimized IndexedDB query latency across 34 active lines',
          'Configured resilient fallback for offline shop floor tablet sessions',
          'Synchronized SMV bottleneck variance alarms to 36.4s target pitch'
        ]
  );
  const [newBulletText, setNewBulletText] = useState('');
  const [includeActiveLayout, setIncludeActiveLayout] = useState<boolean>(!!initialAttachedLayout);

  // Sync active update listener
  useEffect(() => {
    const handlePushed = (e: any) => {
      setActiveUpdate(e.detail);
      setHistory(getSystemUpdatesHistory());
    };
    const handleRolledBack = () => {
      setActiveUpdate(null);
      setHistory(getSystemUpdatesHistory());
    };

    window.addEventListener('debonair:system_update_pushed', handlePushed);
    window.addEventListener('debonair:system_update_rolled_back', handleRolledBack);
    return () => {
      window.removeEventListener('debonair:system_update_pushed', handlePushed);
      window.removeEventListener('debonair:system_update_rolled_back', handleRolledBack);
    };
  }, []);

  // Version bump helpers
  const handleBumpVersion = (type: 'patch' | 'minor' | 'major') => {
    const match = targetVersion.match(/v?(\d+)\.(\d+)\.(\d+)/);
    if (match) {
      let [_, major, minor, patch] = match.map(Number);
      if (type === 'patch') patch += 1;
      if (type === 'minor') {
        minor += 1;
        patch = 0;
      }
      if (type === 'major') {
        major += 1;
        minor = 0;
        patch = 0;
      }
      setTargetVersion(`v${major}.${minor}.${patch}`);
    } else {
      setTargetVersion('v2.4.1');
    }
  };

  const handleAddBullet = () => {
    if (!newBulletText.trim()) return;
    setBulletPoints([...bulletPoints, newBulletText.trim()]);
    setNewBulletText('');
  };

  const handleRemoveBullet = (index: number) => {
    setBulletPoints(bulletPoints.filter((_, i) => i !== index));
  };

  // Push Dispatch Action
  const handleExecutePush = () => {
    if (!title.trim()) {
      showToast('Please specify an update title.');
      return;
    }
    if (bulletPoints.length === 0) {
      showToast('Please include at least one release note bullet.');
      return;
    }

    setIsPushing(true);

    setTimeout(() => {
      let layoutPayload: Partial<AppPageLayoutConfig> | undefined = undefined;
      if (includeActiveLayout || category === 'layout_push') {
        layoutPayload = initialAttachedLayout || getStoredAppPageLayout();
      }

      const created = pushSystemUpdate(
        {
          version: targetVersion,
          title: title.trim(),
          category,
          severity,
          targetScope,
          releaseNotes: bulletPoints,
          actionLabel: actionLabel.trim() || 'Acknowledge',
          actionPayload: {
            layoutConfig: layoutPayload,
            reloadRequired: severity === 'mandatory',
            clearCache: category === 'ota_hotfix'
          }
        },
        profile
      );

      setActiveUpdate(created);
      setHistory(getSystemUpdatesHistory());
      setIsPushing(false);
      showToast(`System Update ${created.version} successfully pushed to fleet!`);
    }, 800);
  };

  const handleRollbackActive = () => {
    if (!activeUpdate) return;
    if (window.confirm(`Roll back active update ${activeUpdate.version}? This will notify all terminals to revert to the previous baseline.`)) {
      rollbackSystemUpdate(activeUpdate.id, profile);
      setActiveUpdate(null);
      setHistory(getSystemUpdatesHistory());
      showToast(`Update ${activeUpdate.version} rolled back.`);
    }
  };

  const handleRePing = () => {
    try {
      playBottleneckAlertSound();
    } catch (e) {
      // ignore
    }
    showToast('Re-broadcast nudge ping sent to all 34 line terminals!');
  };

  const handleCopyHistory = () => {
    navigator.clipboard.writeText(JSON.stringify(history, null, 2));
    setCopiedKey('history-json');
    showToast('Update push history JSON copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              TIER_0 ROOT ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              OTA BROADCASTER
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <DownloadCloud className="w-5 h-5 text-blue-500" />
            <span>System Updates Pusher</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Broadcast live firmware updates, custom layout pushes, cache purges, and operational directives directly to all shop floor tablets and terminals.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleCopyHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer shadow-xs"
          >
            {copiedKey === 'history-json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Export Push Log</span>
          </button>
        </div>
      </div>

      {/* Active Broadcast Fleet Telemetry Monitor */}
      {activeUpdate && (
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border border-blue-500/30 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  BROADCAST ACTIVE &amp; LIVE
                </span>
                <span className="text-[11px] font-mono text-blue-200">{activeUpdate.version}</span>
                <span className="text-[11px] text-slate-400">• Scope: {activeUpdate.targetScope.replace('_', ' ')}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                {activeUpdate.title}
              </h3>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Pushed by {activeUpdate.pushedByName} ({activeUpdate.pushedByEmail}) at{' '}
                {new Date(activeUpdate.pushedAt).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                type="button"
                onClick={handleRePing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white cursor-pointer shadow-xs active:scale-95"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400" />
                <span>Re-Ping Terminals</span>
              </button>
              <button
                type="button"
                onClick={handleRollbackActive}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-sm active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Roll Back Update</span>
              </button>
            </div>
          </div>

          {/* Delivery & Acknowledgment Progress Bar */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between text-xs text-blue-200 mb-1.5">
              <span>Terminal Acknowledgment &amp; Sync Status</span>
              <span className="font-mono font-bold text-white">
                {activeUpdate.acknowledgedCount || 1} / {activeUpdate.totalTerminalsTargeted || 34} Terminals
                ({Math.round(((activeUpdate.acknowledgedCount || 1) / (activeUpdate.totalTerminalsTargeted || 34)) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      10,
                      Math.round(((activeUpdate.acknowledgedCount || 1) / (activeUpdate.totalTerminalsTargeted || 34)) * 100)
                    )
                  )}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sub-Nav Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'pusher', label: 'Compose & Push OTA Update', icon: Send, badge: 'READY' },
          { id: 'preview', label: 'Terminal Banner Preview', icon: Radio, badge: 'SIMULATOR' },
          { id: 'history', label: 'Broadcast History Ledger', icon: Activity, badge: `${history.length} Logs` }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* SUB-VIEW 1: COMPOSE & PUSH STUDIO */}
      {activeSubTab === 'pusher' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Version, Category, and Scope Card */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Version & Bump */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Target Build Version
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={targetVersion}
                    onChange={e => setTargetVersion(e.target.value)}
                    className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-blue-600 dark:text-blue-400 outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="v2.4.1"
                  />
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('patch')}
                    className="px-2 py-2 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-blue-50 text-slate-700 dark:text-slate-300 cursor-pointer shrink-0"
                    title="Increment Patch"
                  >
                    +Patch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('minor')}
                    className="px-2 py-2 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-blue-50 text-slate-700 dark:text-slate-300 cursor-pointer shrink-0"
                    title="Increment Minor"
                  >
                    +Minor
                  </button>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Update Classification
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as UpdateCategory)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="layout_push">UI &amp; Page Layout Push (Includes Blueprint)</option>
                  <option value="ota_hotfix">Critical OTA Firmware Hotfix (Purge &amp; Reload)</option>
                  <option value="operational_directive">Operational Directive &amp; Pitch Commitment</option>
                  <option value="schema_migration">Data Schema &amp; Security Rules Sync</option>
                  <option value="maintenance_advisory">Plant Maintenance &amp; Floor Inspection</option>
                </select>
              </div>

              {/* Target Deployment Scope */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  Deployment Fleet Scope
                </label>
                <select
                  value={targetScope}
                  onChange={e => setTargetScope(e.target.value as UpdateTargetScope)}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all_terminals">All 34 Floor Terminals (Global Broadcast)</option>
                  <option value="building_a">Building A (Padma &amp; Meghna: Lines 01 - 18)</option>
                  <option value="building_b">Building B (Karnophuli to Turag: Lines 19 - 34)</option>
                  <option value="tier_1_2_managers">Tier 1 &amp; 2 Senior IE &amp; Wing Managers Only</option>
                  <option value="tier_3_4_operators">Tier 3 &amp; 4 Floor Incharges &amp; Workstations</option>
                </select>
              </div>
            </div>

            {/* Update Title */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Broadcast Headline / Update Subject
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Critical SMV Pacing Update &amp; New Floor Layout Blueprint"
              />
            </div>

            {/* Urgency / Severity Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                Enforcement Urgency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'normal' as UpdateSeverity,
                    title: 'Normal (Background)',
                    desc: 'Silent background service worker update. Refreshes on next natural app launch.'
                  },
                  {
                    id: 'important' as UpdateSeverity,
                    title: 'Important (Banner Alert)',
                    desc: 'Displays top banner with chime. One-click apply button on all floor tablets.'
                  },
                  {
                    id: 'mandatory' as UpdateSeverity,
                    title: 'Mandatory (Instant Lockout)',
                    desc: 'Interrupts floor terminal with high-priority modal and automatic reload timer.'
                  }
                ].map(sev => (
                  <button
                    key={sev.id}
                    type="button"
                    onClick={() => setSeverity(sev.id)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      severity === sev.id
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{sev.title}</span>
                      {severity === sev.id && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{sev.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Attachment Bridge Toggle */}
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Layout className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
                    Attach Active Page Layout Blueprint
                  </div>
                  <div className="text-[11px] text-purple-700 dark:text-purple-400">
                    Includes current App Page Layout Customizer blueprint to automatically reconfigure receiving terminals.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeActiveLayout || category === 'layout_push'}
                  onChange={e => setIncludeActiveLayout(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>
          </div>

          {/* Release Notes & Changelog Bullet Point Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Release Notes &amp; Change Directives ({bulletPoints.length} items)
              </label>
              <span className="text-[11px] text-slate-400">
                Shown to operators on update arrival
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {bulletPoints.map((bullet, i) => (
                <div key={i} className="p-3 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-xs text-slate-800 dark:text-slate-200">{bullet}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(i)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Bullet Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newBulletText}
                onChange={e => setNewBulletText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddBullet();
                  }
                }}
                placeholder="Add new change note item (e.g. Line 18 target adjusted to 850 pcs)..."
                className="flex-1 text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddBullet}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>
          </div>

          {/* Action Trigger Button Bar */}
          <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Ready to Broadcast to 34 Floor Terminals</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Triggering broadcast will transmit payload immediately to all active tablets and floor monitors.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setActiveSubTab('preview')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 cursor-pointer shadow-xs"
              >
                Simulate Preview
              </button>
              <button
                type="button"
                onClick={handleExecutePush}
                disabled={isPushing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-md active:scale-95 disabled:opacity-60"
              >
                <DownloadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                <span>{isPushing ? 'Blasting Fleet Update...' : 'Push System Update Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: TERMINAL BANNER PREVIEW SIMULATOR */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Frontline Terminal Display Simulation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How this update will appear to operators on their sewing floor tablets.
              </p>
            </div>
            <button
              onClick={() => {
                try {
                  if (severity === 'mandatory') playBottleneckAlertSound();
                  else playWipAlertSound();
                } catch (e) {
                  // ignore
                }
                showToast('Chime tested!');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Test Audio Alert</span>
            </button>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 flex flex-col items-center justify-center min-h-[380px] space-y-4">
            {/* Simulated Banner */}
            <div className="w-full max-w-xl p-4 rounded-2xl bg-white dark:bg-[#1c1c1e] border-2 border-blue-500 shadow-2xl space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <DownloadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {targetVersion}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {severity.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                      {title}
                    </h4>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-400">Just Now</span>
              </div>

              <div className="pl-12 space-y-1">
                {bulletPoints.map((pt, i) => (
                  <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 pl-12 flex items-center gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-xs"
                >
                  {actionLabel || 'Apply Now'}
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: BROADCAST HISTORY LEDGER */}
      {activeSubTab === 'history' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Chronological Push Ledger &amp; Rollback History
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              {history.length} recorded deployments
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
            {history.map(item => (
              <div
                key={item.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    item.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : item.status === 'rolled_back'
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {item.status === 'active' ? 'LIVE' : item.status === 'rolled_back' ? 'REV' : 'OK'}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {item.version}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        item.severity === 'mandatory'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.severity}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 mt-1">
                      Pushed by {item.pushedByName} • Scope: {item.targetScope.replace('_', ' ')} •{' '}
                      {new Date(item.pushedAt).toLocaleString()}
                    </div>

                    {item.releaseNotes && item.releaseNotes.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                        {item.releaseNotes.map((rn, rni) => (
                          <span key={rni} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            • {rn}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.status === 'active' && (
                    <button
                      onClick={handleRollbackActive}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
                    >
                      Rollback
                    </button>
                  )}
                  <span className={`text-xs font-bold capitalize ${
                    item.status === 'active'
                      ? 'text-emerald-600'
                      : item.status === 'rolled_back'
                      ? 'text-rose-600'
                      : 'text-slate-500'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
