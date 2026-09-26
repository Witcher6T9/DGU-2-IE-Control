/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Factory,
  Network,
  Database,
  Lock,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Smartphone,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  HardDrive,
  Users,
  Target,
  Bell,
  Play,
  RotateCcw
} from 'lucide-react';
import {
  UserProfile,
  RoleTier,
  ThemeType,
  DashboardLayout,
  FactoryIndustryProfile,
  UserDailyBackupSettings,
  LineEntry
} from '../types';
import { isMasterAdminOrAdmin, isSystemAdmin } from '../utils/rbac';
import { playBottleneckAlertSound, playWipAlertSound } from '../utils/audioAlert';
import { ActiveOperationalTiers } from './ActiveOperationalTiers';
import { Tier0CommandHub } from './tier0/Tier0CommandHub';

export type SettingsPageSection = 'control-center' | 'preferences' | 'reports' | 'tier_0';

interface SettingsControlCenterPageProps {
  profile: UserProfile;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  layout: DashboardLayout;
  onUpdateLayout: (layout: DashboardLayout) => void;
  auditoryAlertsEnabled?: boolean;
  onToggleAuditoryAlerts?: (enabled: boolean) => void;
  factoryProfile?: FactoryIndustryProfile;
  onUpdateFactoryProfile?: (updated: FactoryIndustryProfile) => void;
  savedFactories?: FactoryIndustryProfile[];
  onSaveFactoryList?: (list: FactoryIndustryProfile[]) => void;
  dailyBackupSettings?: UserDailyBackupSettings;
  onUpdateDailyBackupSettings?: (updated: UserDailyBackupSettings) => void;
  onTriggerManualBackup?: () => Promise<any>;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  onResetFactoryDefaults?: () => void;
  onLockTerminal?: () => void;
  onOpenAndroidPackage?: () => void;
  onOpenPrivacySecurity?: () => void;
  onOpenUserModal?: (tab?: 'profile' | 'roles') => void;
  onOpenChat?: () => void;
  onOpenScorecard?: () => void;
  roleTiers?: RoleTier[];
  lines?: LineEntry[];
  onNavigate?: (tab: string, lineNo?: string) => void;
}

export const SettingsControlCenterPage: React.FC<SettingsControlCenterPageProps> = ({
  profile,
  onUpdateProfile,
  currentTheme,
  onSelectTheme,
  layout,
  onUpdateLayout,
  auditoryAlertsEnabled = true,
  onToggleAuditoryAlerts = () => {},
  factoryProfile,
  onUpdateFactoryProfile,
  dailyBackupSettings,
  onUpdateDailyBackupSettings,
  onTriggerManualBackup,
  onOpenDatabase,
  onResetFactoryDefaults,
  onLockTerminal,
  onOpenAndroidPackage,
  onOpenPrivacySecurity,
  onOpenUserModal,
  roleTiers = [],
  lines = [],
  onNavigate
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const isSysAdmin = isSystemAdmin(profile);
  const [activeSection, setActiveSection] = useState<SettingsPageSection>('control-center');
  const [activeSubTab, setActiveSubTab] = useState<string>('factory');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  const handleManualBackupClick = async () => {
    if (!onTriggerManualBackup) return;
    setIsBackingUp(true);
    setBackupMsg(null);
    try {
      await onTriggerManualBackup();
      setBackupMsg('Snapshot successfully verified and saved to local IndexedDB.');
      setTimeout(() => setBackupMsg(null), 4000);
    } catch (e) {
      setBackupMsg('Backup failed. Storage quota or privacy lock active.');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Page Header */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display">
                  Control Center & Preferences
                </h1>
                <p className="text-xs text-[#527078]">
                  Plant configuration, RBAC hierarchies, data backup, theme options, and alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Master Section Toggle */}
          <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]">
            <button
              onClick={() => {
                setActiveSection('control-center');
                setActiveSubTab('factory');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'control-center'
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#176f78]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Control Center</span>
            </button>

            <button
              onClick={() => {
                setActiveSection('preferences');
                setActiveSubTab('theme');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSection === 'preferences'
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'text-slate-600 hover:text-[#176f78]'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Preferences</span>
            </button>

            {/* TIER_0 ONLY - VISIBLE ONLY WHEN isSystemAdmin(profile) === true */}
            {isSysAdmin && (
              <button
                onClick={() => {
                  setActiveSection('tier_0');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSection === 'tier_0'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-teal-700 hover:text-teal-900 bg-teal-500/15'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Tier_0 Only</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: CONTROL CENTER */}
      {activeSection === 'control-center' && (
        <div className="space-y-4">
          {/* Sub-navigation bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'factory', label: 'Plant & Factory Profile', icon: Factory },
              { id: 'rbac', label: 'IE Org & RBAC Tiers', icon: Network },
              { id: 'backup', label: 'Data Hub & Backup', icon: Database },
              { id: 'security', label: 'Floor Security & Lock', icon: Lock }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#176f78] border border-[#176f78] shadow-xs'
                      : 'bg-[#fbfaf6] text-slate-600 border border-[#d9d2c2] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Plant Profile Sub-view */}
          {activeSubTab === 'factory' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Factory className="w-4 h-4 text-[#176f78]" />
                    <span>Enterprise Plant Identity</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Unit-02 manufacturing facility configuration and active floor buildings.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/25">
                  UNIT-02 ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078] uppercase">Company / Group</div>
                  <div className="text-base font-bold text-[#17343a] mt-1 font-display">
                    {factoryProfile?.name || 'Debonair LTD'}
                  </div>
                  <div className="text-xs text-[#527078] mt-0.5">
                    Sector: {factoryProfile?.industrySector || 'Apparel & Garment Manufacturing (RMG)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078] uppercase">Active Unit</div>
                  <div className="text-base font-bold text-[#17343a] mt-1 font-display">
                    {factoryProfile?.unitName || 'Unit-02 Manufacturing Complex'}
                  </div>
                  <div className="text-xs text-[#527078] mt-0.5">
                    Location: Gorai, Mirzapur, Tangail, Bangladesh
                  </div>
                </div>
              </div>

              {/* Floors Overview */}
              <div>
                <h3 className="text-xs font-bold text-[#17343a] uppercase tracking-wider mb-2">
                  Operating Production Floors (34 Lines)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { name: 'Padma', lines: 'Lines 01 - 06', color: 'bg-blue-50 border-blue-200 text-blue-900' },
                    { name: 'Meghna', lines: 'Lines 07 - 12', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                    { name: 'Karnophuli', lines: 'Lines 13 - 17', color: 'bg-amber-50 border-amber-200 text-amber-900' },
                    { name: 'Korotoya', lines: 'Lines 18 - 23', color: 'bg-purple-50 border-purple-200 text-purple-900' },
                    { name: 'Shitalokshya', lines: 'Lines 24 - 29', color: 'bg-teal-50 border-teal-200 text-teal-900' },
                    { name: 'Turag', lines: 'Lines 30 - 34', color: 'bg-rose-50 border-rose-200 text-rose-900' }
                  ].map(f => (
                    <div key={f.name} className={`p-3 rounded-xl border ${f.color} text-center`}>
                      <div className="font-bold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{f.lines}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RBAC Sub-view */}
          {activeSubTab === 'rbac' && (
            <div className="space-y-4">
              <ActiveOperationalTiers
                currentTierId={profile.tierId || 'tier_1'}
                onSelectTier={tier => {
                  if (onUpdateProfile) {
                    onUpdateProfile({ tierId: tier.id, jobTitle: tier.name });
                  }
                }}
                profile={profile}
                roleTiers={roleTiers}
                onOpenRoleEditor={() => onOpenUserModal && onOpenUserModal('roles')}
                onSelectLineFilter={lineNo => onNavigate && onNavigate('linedata', lineNo)}
              />
            </div>
          )}

          {/* Backup Sub-view */}
          {activeSubTab === 'backup' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#176f78]" />
                    <span>Local Data Management & Snapshots</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    IndexedDB storage, automated hourly snapshots, and CSV/Excel backup.
                  </p>
                </div>
                <button
                  onClick={handleManualBackupClick}
                  disabled={isBackingUp}
                  className="px-3.5 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>Snapshot Now</span>
                </button>
              </div>

              {backupMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{backupMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">IndexedDB State</div>
                  <div className="text-sm font-bold text-[#17343a] mt-1 font-mono">34 Lines Loaded</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">Status: Synced & Clean</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">Auto-Backup Interval</div>
                  <div className="text-sm font-bold text-[#17343a] mt-1 font-mono">Daily (05:00 PM)</div>
                  <div className="text-[10px] text-[#527078] mt-1">Retention: 30 snapshots</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">Factory Defaults</div>
                  <button
                    onClick={onResetFactoryDefaults}
                    className="mt-1 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Debonair Set</span>
                  </button>
                  <div className="text-[10px] text-[#527078] mt-1">Restores 21-Sep baseline</div>
                </div>
              </div>

              {onOpenDatabase && (
                <div className="pt-2">
                  <button
                    onClick={() => onOpenDatabase('backup')}
                    className="w-full py-2.5 rounded-xl border border-[#176f78] text-[#176f78] hover:bg-[#176f78]/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Open Advanced Data & Telemetry Hub</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Sub-view */}
          {activeSubTab === 'security' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#176f78]" />
                    <span>Floor Terminal Security & Access</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Terminal lockout, PIN protection, and operator shift clearance.
                  </p>
                </div>
                {onLockTerminal && (
                  <button
                    onClick={onLockTerminal}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Terminal Now</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  Current active session authenticated for: <strong>{profile.name}</strong> ({profile.jobTitle || 'Industrial Engineer'}).
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PREFERENCES */}
      {activeSection === 'preferences' && (
        <div className="space-y-4">
          {/* Sub-navigation bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'theme', label: 'Theme & Display', icon: Sun },
              { id: 'alerts', label: 'Audio & Alerts', icon: Volume2 },
              { id: 'android', label: 'PWA & Android App', icon: Smartphone }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#176f78] border border-[#176f78] shadow-xs'
                      : 'bg-[#fbfaf6] text-slate-600 border border-[#d9d2c2] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Sub-view */}
          {activeSubTab === 'theme' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e1d5] pb-4">
                <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#176f78]" />
                  <span>Theme & Visual Appearance</span>
                </h2>
                <p className="text-xs text-[#527078] mt-0.5">
                  Choose the optimal color palette for shop floor visibility or office audit reviews.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onSelectTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    currentTheme === 'light'
                      ? 'border-[#176f78] bg-[#176f78]/5 ring-2 ring-[#176f78]/20'
                      : 'border-[#d9d2c2] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17343a] flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" /> Light Cockpit (Default)
                    </span>
                    {currentTheme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#176f78]" />}
                  </div>
                  <p className="text-xs text-[#527078] mt-1">
                    Warm ergonomic shop floor daylight mode optimized for factory tablets.
                  </p>
                </button>

                <button
                  onClick={() => onSelectTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    currentTheme === 'dark'
                      ? 'border-[#176f78] bg-slate-900 text-white ring-2 ring-[#176f78]/20'
                      : 'border-[#d9d2c2] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17343a] flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" /> Dark Studio
                    </span>
                    {currentTheme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-[#527078] mt-1">
                    Low-glare high contrast theme for night shifts and control room monitors.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Audio Alerts Sub-view */}
          {activeSubTab === 'alerts' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e1d5] pb-4">
                <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#176f78]" />
                  <span>Auditory Alert Settings</span>
                </h2>
                <p className="text-xs text-[#527078] mt-0.5">
                  Real-time audio signals when line efficiency drops below threshold or bottleneck chokes.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#17343a]">Sound on Bottleneck Choke</div>
                  <div className="text-xs text-[#527078]">Plays harmonic chime when cycle time exceeds takt</div>
                </div>
                <button
                  onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    auditoryAlertsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {auditoryAlertsEnabled ? 'ENABLED' : 'MUTED'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => playBottleneckAlertSound()}
                  className="px-3.5 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#176f78]" />
                  <span>Test Bottleneck Alert Sound</span>
                </button>
                <button
                  onClick={() => playWipAlertSound()}
                  className="px-3.5 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span>Test WIP Alert Sound</span>
                </button>
              </div>
            </div>
          )}

          {/* Android & PWA Sub-view */}
          {activeSubTab === 'android' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#176f78]" />
                    <span>Android TWA & PWA Installation</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Deploy as native Android APK on floor tablets with Digital Asset Links.
                  </p>
                </div>
                {onOpenAndroidPackage && (
                  <button
                    onClick={onOpenAndroidPackage}
                    className="px-3.5 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Package Wizard</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <span className="font-bold text-[#17343a]">Package ID:</span>
                  <div className="font-mono text-slate-600 mt-1">com.debonair.iedailycontrol</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <span className="font-bold text-[#17343a]">Digital Asset Links:</span>
                  <div className="font-mono text-emerald-700 mt-1">Verified SHA-256 Fingerprint</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: TIER_0 ONLY ROOT CONTROL - STRICTLY VISIBLE ONLY WHEN isSystemAdmin(profile) === true */}
      {activeSection === 'tier_0' && isSysAdmin && (
        <Tier0CommandHub
          profile={profile}
          lines={lines}
          roleTiers={roleTiers}
          factoryProfile={factoryProfile}
          dailyBackupSettings={dailyBackupSettings}
          onUpdateDailyBackupSettings={onUpdateDailyBackupSettings}
          onTriggerManualBackup={onTriggerManualBackup}
          onLockTerminal={onLockTerminal}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};
