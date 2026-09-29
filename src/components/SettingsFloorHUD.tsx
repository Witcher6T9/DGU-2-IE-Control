/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Factory,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Database,
  Lock,
  Smartphone,
  Layers,
  Play,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Activity,
  Terminal,
  Cpu
} from 'lucide-react';
import { UserProfile, ThemeType, FactoryIndustryProfile } from '../types';
import type { SettingsPageSection } from './SettingsControlCenterPage';

interface SettingsFloorHUDProps {
  factoryProfile?: FactoryIndustryProfile;
  factoryName: string;
  unitName: string;
  totalActiveLines: number;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  auditoryAlertsEnabled: boolean;
  onToggleAuditoryAlerts: (enabled: boolean) => void;
  testingSound: 'bottleneck' | 'wip' | null;
  onTestBottleneck: () => void;
  onTestWip: () => void;
  isBackingUp: boolean;
  backupMsg: string | null;
  onTriggerBackup: () => void;
  profile: UserProfile;
  onLockTerminal?: () => void;
  onOpenAndroidPackage?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  onOpenUserModal?: (tab?: 'profile' | 'roles') => void;
  onNavigateToSection: (section: SettingsPageSection) => void;
  onSwitchToInspector: (category: string) => void;
  isSysAdmin: boolean;
}

export const SettingsFloorHUD: React.FC<SettingsFloorHUDProps> = ({
  factoryProfile,
  factoryName,
  unitName,
  totalActiveLines,
  currentTheme,
  onSelectTheme,
  auditoryAlertsEnabled,
  onToggleAuditoryAlerts,
  testingSound,
  onTestBottleneck,
  onTestWip,
  isBackingUp,
  backupMsg,
  onTriggerBackup,
  profile,
  onLockTerminal,
  onOpenAndroidPackage,
  onOpenDatabase,
  onOpenUserModal,
  onNavigateToSection,
  onSwitchToInspector,
  isSysAdmin
}) => {
  return (
    <div className="space-y-4">
      {/* Top HUD Telemetry Ribbon */}
      <div className="bg-[#12161c] text-slate-100 rounded-xl p-3 border border-[#2b3543] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 font-bold uppercase tracking-wider">HUD Floor Terminal v2.4</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">{factoryProfile?.factoryCode || 'DBN-U02'}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">{totalActiveLines} Lines Active</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-semibold">IndexedDB Local</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-[11px] text-slate-300">
            Shift: <span className="text-amber-400 font-bold">08:00 - 17:00</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="text-[11px] text-slate-300">
            Target Eff: <span className="text-emerald-400 font-bold">68.0%</span>
          </div>
        </div>
      </div>

      {/* 2x3 Compact HUD Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
        {/* HUD Tile 1: Plant & Rivers Matrix */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">01. Plant Facility</span>
            </div>
            <button
              type="button"
              onClick={() => onSwitchToInspector('factory')}
              className="text-[10px] font-bold text-[#176f78] dark:text-teal-400 hover:underline cursor-pointer"
            >
              Configure
            </button>
          </div>
          <div className="text-xs font-bold text-[#17343a] dark:text-slate-200 truncate">
            {factoryName} · {unitName}
          </div>
          <div className="text-[10px] text-[#527078] dark:text-slate-400 truncate mt-0.5">
            {factoryProfile?.addressLocation || 'Mirzapur, Tangail, Bangladesh'}
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#ece6d9] dark:border-[#2b3543] flex flex-wrap gap-1 text-[9px] font-mono">
            {['Padma (6)', 'Meghna (6)', 'Karnophuli (5)', 'Korotoya (6)', 'Shitalokshya (6)', 'Turag (5)'].map(r => (
              <span key={r} className="px-1.5 py-0.5 rounded bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-300">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* HUD Tile 2: Visual Contrast HUD */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">02. Display Mode</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              {currentTheme === 'dark' ? 'Dark Studio' : 'Daylight'}
            </span>
          </div>
          <p className="text-[10px] text-[#527078] dark:text-slate-400 mb-2">
            Glare resistance tailored for factory shop floor fluorescent lighting.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onSelectTheme('light')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentTheme === 'light'
                  ? 'bg-[#176f78] text-white shadow-2xs'
                  : 'bg-[#f4efe4] dark:bg-[#252e3b] text-[#17343a] dark:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Daylight</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTheme('dark')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                currentTheme === 'dark'
                  ? 'bg-[#176f78] text-white shadow-2xs'
                  : 'bg-[#f4efe4] dark:bg-[#252e3b] text-[#17343a] dark:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Studio Dark</span>
            </button>
          </div>
        </div>

        {/* HUD Tile 3: Auditory Telemetry HUD */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">03. Audio Alerts</span>
            </div>
            <button
              type="button"
              onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                auditoryAlertsEnabled ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  auditoryAlertsEnabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <div className="text-[10px] text-[#527078] dark:text-slate-400 mb-2">
            Web Audio synth triggers for supervisor tablet headphone &amp; line chimes.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onTestBottleneck}
              disabled={testingSound === 'bottleneck'}
              className="py-1 px-2 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#232a34] text-[10px] font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 text-[#176f78]" />
              <span>Bottleneck</span>
            </button>
            <button
              type="button"
              onClick={onTestWip}
              disabled={testingSound === 'wip'}
              className="py-1 px-2 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#232a34] text-[10px] font-bold text-[#17343a] dark:text-slate-200 hover:text-amber-600 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-600" />
              <span>WIP Starve</span>
            </button>
          </div>
        </div>

        {/* HUD Tile 4: Local Storage Engine */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">04. Local Storage</span>
            </div>
            <button
              type="button"
              onClick={onTriggerBackup}
              disabled={isBackingUp}
              className="px-2 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isBackingUp ? 'animate-spin' : ''}`} />
              <span>Snapshot</span>
            </button>
          </div>
          {backupMsg ? (
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mb-1 truncate">
              {backupMsg}
            </div>
          ) : (
            <div className="text-[10px] text-[#527078] dark:text-slate-400 mb-2">
              Browser IndexedDB local vault · 30-day automated rolling window.
            </div>
          )}
          <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-[#ece6d9] dark:border-[#2b3543]">
            <span className="text-slate-500">Status: <strong className="text-emerald-600">Online</strong></span>
            <button
              type="button"
              onClick={() => onOpenDatabase && onOpenDatabase('backup')}
              className="text-[#176f78] dark:text-teal-400 font-semibold hover:underline"
            >
              Open Vault
            </button>
          </div>
        </div>

        {/* HUD Tile 5: Security & Session HUD */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">05. Security Session</span>
            </div>
            {onLockTerminal && (
              <button
                type="button"
                onClick={onLockTerminal}
                className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>Lock</span>
              </button>
            )}
          </div>
          <div className="text-xs font-bold text-[#17343a] dark:text-slate-100 truncate">
            {profile.name}
          </div>
          <div className="text-[10px] font-mono text-[#527078] dark:text-slate-400 mt-0.5">
            Role: {profile.jobTitle || 'IE Engineer'} · Clearance: {profile.tierId || 'tier_1'}
          </div>
          <div className="mt-2 pt-1.5 border-t border-[#ece6d9] dark:border-[#2b3543] flex items-center justify-between text-[10px]">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Session Authenticated</span>
            {onOpenUserModal && (
              <button
                type="button"
                onClick={() => onOpenUserModal('roles')}
                className="text-[#176f78] dark:text-teal-400 font-bold hover:underline cursor-pointer"
              >
                Roles
              </button>
            )}
          </div>
        </div>

        {/* HUD Tile 6: Mobile PWA HUD */}
        <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">06. Mobile PWA</span>
            </div>
            {onOpenAndroidPackage && (
              <button
                type="button"
                onClick={onOpenAndroidPackage}
                className="px-2 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-bold hover:bg-[#12555c] transition-colors cursor-pointer"
              >
                APK
              </button>
            )}
          </div>
          <div className="text-[10px] text-[#527078] dark:text-slate-400 mb-1">
            Service worker active with zero-network local fallback.
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-[#ece6d9] dark:border-[#2b3543]">
            <span className="text-slate-500">Cache: <strong className="text-emerald-600">68 Assets</strong></span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Offline Ready</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Strip */}
      <div className="bg-white dark:bg-[#1a2028] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
            <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">Direct Workspace Dispatch</span>
          </div>
          <span className="text-[10px] font-mono text-[#527078] dark:text-slate-400">6 Engineering Portals</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { id: 'line-data' as SettingsPageSection, label: 'Line Data' },
            { id: 'checklist' as SettingsPageSection, label: 'Checklist' },
            { id: 'lean-tools' as SettingsPageSection, label: 'Lean Tools' },
            { id: 'capacity' as SettingsPageSection, label: 'Capacity' },
            { id: 'reports' as SettingsPageSection, label: 'Reports' },
            { id: 'world' as SettingsPageSection, label: 'WCM Pillar' }
          ].map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => onNavigateToSection(h.id)}
              className="py-1.5 px-2 rounded-lg bg-[#fbfaf6] dark:bg-[#232a34] border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-xs font-semibold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] transition-colors text-center cursor-pointer truncate"
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Super Admin HUD Banner */}
      {isSysAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="font-bold text-amber-950 dark:text-amber-200">Tier_0 Super Admin Infrastructure</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('tier_0')}
            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] hover:bg-amber-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>Launch Root</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
