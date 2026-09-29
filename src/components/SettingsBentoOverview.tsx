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
  CheckCircle2,
  Play,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  Wrench,
  Calculator,
  FileSpreadsheet,
  Globe,
  HardDrive
} from 'lucide-react';
import { UserProfile, ThemeType, FactoryIndustryProfile } from '../types';
import type { SettingsPageSection } from './SettingsControlCenterPage';

interface SettingsBentoOverviewProps {
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

export const SettingsBentoOverview: React.FC<SettingsBentoOverviewProps> = ({
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
      {/* 1. Plant Identity & Active Floor Lines (Spans 2 cols on XL) */}
      <div className="xl:col-span-2 bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-2xs shrink-0">
              <Factory className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">01</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Plant Identity &amp; Enterprise Facility
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Operating divisions, facility nomenclature, and shift distribution.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSwitchToInspector('factory')}
            className="text-xs font-bold text-[#176f78] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Edit Identity</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Enterprise</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100 truncate mt-0.5">{factoryName}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Unit</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100 truncate mt-0.5">{unitName}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Active Lines</span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">{totalActiveLines} Lines</p>
          </div>
          <div className="p-3 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Division</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100 truncate mt-0.5">{factoryProfile?.shortTag || 'DBN-02'}</p>
          </div>
        </div>

        {/* 6 Floor Rivers Grid */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider block mb-2">
            Supervisory Floor Divisions
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            {[
              { name: 'Padma', lines: '01-06' },
              { name: 'Meghna', lines: '07-12' },
              { name: 'Karnophuli', lines: '13-17' },
              { name: 'Korotoya', lines: '18-23' },
              { name: 'Shitalokshya', lines: '24-29' },
              { name: 'Turag', lines: '30-34' }
            ].map(f => (
              <div
                key={f.name}
                onClick={() => onSwitchToInspector('factory')}
                className="p-2 rounded-lg bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] text-center cursor-pointer hover:border-[#176f78] transition-colors"
              >
                <div className="text-[11px] font-bold text-[#17343a] dark:text-slate-200 truncate">{f.name}</div>
                <div className="text-[9px] font-mono text-[#527078] dark:text-slate-400">{f.lines}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Visual Ergonomics & Display Themes */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">02</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Visual Ergonomics
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                1-click theme contrast selection.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-400">
            {currentTheme === 'dark' ? 'Studio Dark' : 'Daylight'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            type="button"
            onClick={() => onSelectTheme('light')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              currentTheme === 'light'
                ? 'border-[#176f78] bg-[#176f78]/10 ring-2 ring-[#176f78]/20'
                : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Sun className="w-4 h-4 text-amber-600" />
              {currentTheme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#176f78]" />}
            </div>
            <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Daylight Cockpit</div>
            <p className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">Glare-resistant</p>
          </button>

          <button
            type="button"
            onClick={() => onSelectTheme('dark')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              currentTheme === 'dark'
                ? 'border-[#176f78] bg-slate-900 text-white ring-2 ring-[#176f78]/20'
                : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              {currentTheme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Dark Studio</div>
            <p className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">Night shift audit</p>
          </button>
        </div>

        <div className="p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240] text-[10px] text-[#527078] dark:text-slate-400 flex items-center justify-between">
          <span>Target Density: Tablet 44px</span>
          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">Active</span>
        </div>
      </div>

      {/* 3. Auditory Alerts & Chimes */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-[#176f78] dark:text-teal-400 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">03</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Auditory Alerts &amp; Chimes
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Bottleneck harmonic frequency alerts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              auditoryAlertsEnabled ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                auditoryAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
            <span className="text-xs font-semibold text-[#17343a] dark:text-slate-200">Bottleneck Chime</span>
            <button
              type="button"
              onClick={onTestBottleneck}
              disabled={testingSound === 'bottleneck'}
              className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-[11px] font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play className={`w-3 h-3 text-[#176f78] ${testingSound === 'bottleneck' ? 'animate-ping' : ''}`} />
              <span>{testingSound === 'bottleneck' ? 'Playing' : 'Test'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
            <span className="text-xs font-semibold text-[#17343a] dark:text-slate-200">WIP Starvation</span>
            <button
              type="button"
              onClick={onTestWip}
              disabled={testingSound === 'wip'}
              className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-[11px] font-bold text-[#17343a] dark:text-slate-200 hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play className={`w-3 h-3 text-amber-600 ${testingSound === 'wip' ? 'animate-ping' : ''}`} />
              <span>{testingSound === 'wip' ? 'Playing' : 'Test'}</span>
            </button>
          </div>
        </div>

        <div className="text-[10px] text-[#527078] dark:text-slate-400">
          Master Audio Status: <span className="font-semibold text-emerald-700 dark:text-emerald-400">{auditoryAlertsEnabled ? 'Enabled (Web Audio API)' : 'Muted'}</span>
        </div>
      </div>

      {/* 4. Data Vault & Snapshot Storage */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">04</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Data Vault &amp; Storage
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Local-first IndexedDB persistence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onTriggerBackup}
            disabled={isBackingUp}
            className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white text-[11px] font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Backing Up' : 'Snapshot'}</span>
          </button>
        </div>

        {backupMsg && (
          <div className="p-2 mb-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-800 dark:text-emerald-300">
            {backupMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[9px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Engine</span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">IndexedDB Online</p>
          </div>
          <div className="p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[9px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Schedule</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100">Daily 05:00 PM</p>
          </div>
        </div>

        {onOpenDatabase && (
          <button
            type="button"
            onClick={() => onOpenDatabase('backup')}
            className="w-full py-1.5 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-[11px] font-semibold text-[#176f78] dark:text-teal-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Open Advanced Database Hub</span>
          </button>
        )}
      </div>

      {/* 5. Terminal Security & RBAC Access */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">05</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Security &amp; Terminal Lock
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Session clearance and kiosk protection.
              </p>
            </div>
          </div>
          {onLockTerminal && (
            <button
              type="button"
              onClick={onLockTerminal}
              className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Lock Now</span>
            </button>
          )}
        </div>

        <div className="p-3 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240] mb-3">
          <div className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Active Session</div>
          <div className="text-xs font-bold text-[#17343a] dark:text-slate-100 mt-0.5">{profile.name}</div>
          <div className="text-[10px] font-mono text-[#527078] dark:text-slate-400 mt-0.5">
            Role: {profile.jobTitle || 'IE Engineer'} · Tier: {profile.tierId || 'tier_1'}
          </div>
        </div>

        {onOpenUserModal && (
          <button
            type="button"
            onClick={() => onOpenUserModal('roles')}
            className="w-full py-1.5 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-[11px] font-semibold text-[#17343a] dark:text-slate-200 transition-colors cursor-pointer"
          >
            Manage Clearance &amp; Roles
          </button>
        )}
      </div>

      {/* 6. Mobile & Android PWA App */}
      <div className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">06</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Mobile &amp; Android PWA
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Offline precache and APK installer.
              </p>
            </div>
          </div>
          {onOpenAndroidPackage && (
            <button
              type="button"
              onClick={onOpenAndroidPackage}
              className="px-2.5 py-1 rounded-lg bg-[#176f78] text-white text-[11px] font-bold hover:bg-[#12555c] transition-colors cursor-pointer"
            >
              APK Wizard
            </button>
          )}
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240] text-xs">
            <span className="text-[#527078] dark:text-slate-400">Precache Assets</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">68 Ready</span>
          </div>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240] text-xs">
            <span className="text-[#527078] dark:text-slate-400">Package Id</span>
            <span className="font-mono text-[10px] truncate max-w-[140px] text-[#17343a] dark:text-slate-200">com.debonair.iedaily</span>
          </div>
        </div>

        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Offline Service Worker Activated</span>
        </div>
      </div>

      {/* 7. Centralized Operational Hubs Launchpad (Spans 3 cols on XL) */}
      <div className="xl:col-span-3 bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-2xs shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#527078] dark:text-slate-400 font-bold">07</span>
                <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100">
                  Centralized Operational Hubs Launchpad
                </h3>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400">
                Direct access to core engineering, compliance, and analytics modules.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-400">
            6 Operational Portals
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'line-data' as SettingsPageSection, title: 'Line Data Hub', icon: Layers, desc: `${totalActiveLines} sewing lines telemetry` },
            { id: 'checklist' as SettingsPageSection, title: 'Check List & Compliance', icon: CheckSquare, desc: 'Daily verification routine' },
            { id: 'lean-tools' as SettingsPageSection, title: 'Lean Tools & Simulator', icon: Wrench, desc: '13 methods & SMV balancing' },
            { id: 'capacity' as SettingsPageSection, title: 'Capacity Calculator', icon: Calculator, desc: 'Pitch takt & daily quotas' },
            { id: 'reports' as SettingsPageSection, title: 'Shift Reports & Analytics', icon: FileSpreadsheet, desc: 'Matrix summaries & exports' },
            { id: 'world' as SettingsPageSection, title: 'World Class Mfg (WCM)', icon: Globe, desc: 'TPM, SMED & 5S pillars' }
          ].map(hub => {
            const Icon = hub.icon;
            return (
              <button
                key={hub.id}
                type="button"
                onClick={() => onNavigateToSection(hub.id)}
                className="p-3 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] hover:border-[#176f78] transition-all text-left group cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#176f78]/10 text-[#176f78] dark:text-teal-400 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#17343a] dark:text-slate-100 group-hover:text-[#176f78] transition-colors truncate">
                      {hub.title}
                    </div>
                    <div className="text-[10px] text-[#527078] dark:text-slate-400 truncate">
                      {hub.desc}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#176f78] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 8. Super Admin Tier_0 Suite */}
      {isSysAdmin && (
        <div className="xl:col-span-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Tier_0 Root Command Suite
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                Privileged infrastructure settings, terminal audit log, and low-level schema management.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('tier_0')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <span>Launch Root Suite</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
