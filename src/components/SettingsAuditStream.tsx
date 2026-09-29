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
  FileCheck,
  Printer,
  ArrowUp,
  Building,
  MapPin,
  Clock,
  HardDrive
} from 'lucide-react';
import { UserProfile, ThemeType, FactoryIndustryProfile } from '../types';
import type { SettingsPageSection } from './SettingsControlCenterPage';

interface SettingsAuditStreamProps {
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

export const SettingsAuditStream: React.FC<SettingsAuditStreamProps> = ({
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
  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Sticky Table of Contents Jump Bar */}
      <div className="sticky top-2 z-20 bg-white/95 dark:bg-[#1a2028]/95 backdrop-blur-md border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-2.5 sm:p-3 shadow-md flex items-center justify-between gap-3 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 shrink-0">
          <FileCheck className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200 hidden md:inline">
            Audit Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-400">
            7 Sections
          </span>
        </div>

        {/* Anchor Jump Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { id: 'factory', label: '01. Plant' },
            { id: 'display', label: '02. Display' },
            { id: 'alerts', label: '03. Audio' },
            { id: 'backup', label: '04. Storage' },
            { id: 'security', label: '05. Security' },
            { id: 'android', label: '06. Mobile' },
            { id: 'hubs', label: '07. Hubs' }
          ].map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => scrollToAnchor(`audit-sec-${sec.id}`)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#17343a] dark:text-slate-200 hover:bg-[#f2ede1] dark:hover:bg-[#242c38] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {sec.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="p-1.5 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] hover:bg-[#f4efe4] dark:hover:bg-[#252e3b] text-[#527078] dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
          title="Scroll to top"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Section 01: Plant Identity Audit */}
      <section
        id="audit-sec-factory"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 01</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#176f78]" />
              <span>Plant Identity &amp; Enterprise Facility</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onSwitchToInspector('factory')}
            className="text-xs font-bold text-[#176f78] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Inspector</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Corporate Facility</span>
            <p className="text-sm font-bold text-[#17343a] dark:text-slate-100 mt-0.5">{factoryName}</p>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">{unitName}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Division &amp; Sector</span>
            <p className="text-sm font-bold text-[#17343a] dark:text-slate-100 mt-0.5">{factoryProfile?.shortTag || 'DBN-02'}</p>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5 truncate">{factoryProfile?.industrySector || 'Apparel RMG'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Active Floor Lines</span>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">{totalActiveLines} Sewing Lines</p>
            <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">6 River Divisions active</p>
          </div>
        </div>
      </section>

      {/* Section 02: Visual Ergonomics Audit */}
      <section
        id="audit-sec-display"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 02</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-600" />
              <span>Display &amp; Visual Ergonomics Audit</span>
            </h2>
          </div>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>WCAG AA Contrast Compliant</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Active Theme State</div>
              <div className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                Current mode: <strong className="text-[#176f78] dark:text-teal-400">{currentTheme === 'dark' ? 'Studio Dark' : 'Daylight Cockpit'}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onSelectTheme('light')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  currentTheme === 'light' ? 'bg-[#176f78] text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                Daylight
              </button>
              <button
                type="button"
                onClick={() => onSelectTheme('dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  currentTheme === 'dark' ? 'bg-[#176f78] text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
            <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Touch Target Density</div>
            <div className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
              Minimum touch bounding box &ge; 44px for gloved factory operators.
            </div>
          </div>
        </div>
      </section>

      {/* Section 03: Audio Alerts Audit */}
      <section
        id="audit-sec-alerts"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 03</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#176f78]" />
              <span>Auditory Alerts &amp; Floor Signals</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
              auditoryAlertsEnabled ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {auditoryAlertsEnabled ? 'Audio Alerts Enabled' : 'Muted'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Bottleneck Frequency Chime</div>
              <div className="text-[10px] text-[#527078] dark:text-slate-400">Fires when station takt delta exceeds &gt;15%</div>
            </div>
            <button
              type="button"
              onClick={onTestBottleneck}
              disabled={testingSound === 'bottleneck'}
              className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold hover:text-[#176f78] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 text-[#176f78]" />
              <span>Test</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">WIP Starvation Chime</div>
              <div className="text-[10px] text-[#527078] dark:text-slate-400">Fires when buffer inventory depletes</div>
            </div>
            <button
              type="button"
              onClick={onTestWip}
              disabled={testingSound === 'wip'}
              className="px-2.5 py-1 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3 h-3 text-amber-600" />
              <span>Test</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 04: Data Vault Audit */}
      <section
        id="audit-sec-backup"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 04</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>Data Vault &amp; IndexedDB Storage Health</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onTriggerBackup}
            disabled={isBackingUp}
            className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
            <span>{isBackingUp ? 'Backing Up...' : 'Trigger Snapshot Now'}</span>
          </button>
        </div>

        {backupMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
            {backupMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Engine</span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">IndexedDB Online</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Rolling Window</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100 mt-0.5">30-Day Snapshots</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Scheduled Time</span>
            <p className="text-xs font-bold text-[#17343a] dark:text-slate-100 mt-0.5">Daily 05:00 PM</p>
          </div>
        </div>
      </section>

      {/* Section 05: Security Audit */}
      <section
        id="audit-sec-security"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 05</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-600" />
              <span>Floor Terminal Security &amp; RBAC Clearance</span>
            </h2>
          </div>
          {onLockTerminal && (
            <button
              type="button"
              onClick={onLockTerminal}
              className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Terminal</span>
            </button>
          )}
        </div>

        <div className="p-4 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Authenticated Operator</div>
            <div className="text-sm font-bold text-[#17343a] dark:text-slate-100 mt-0.5">{profile.name}</div>
            <div className="text-xs font-mono text-[#527078] dark:text-slate-400 mt-0.5">
              Role: {profile.jobTitle || 'IE Engineer'} · Tier ID: {profile.tierId || 'tier_1'}
            </div>
          </div>
          {onOpenUserModal && (
            <button
              type="button"
              onClick={() => onOpenUserModal('roles')}
              className="px-3.5 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] transition-colors cursor-pointer self-start sm:self-auto"
            >
              Manage Clearance
            </button>
          )}
        </div>
      </section>

      {/* Section 06: Mobile PWA Audit */}
      <section
        id="audit-sec-android"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 06</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Mobile PWA &amp; Android Tablet Deployment</span>
            </h2>
          </div>
          {onOpenAndroidPackage && (
            <button
              type="button"
              onClick={onOpenAndroidPackage}
              className="px-3 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors cursor-pointer"
            >
              Package Wizard
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Service Worker Precache</span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">68 Assets Precached (Offline Ready)</p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#f8f6f0] dark:bg-[#151a22] border border-[#e4decfa0] dark:border-[#273240]">
            <span className="text-[10px] text-[#527078] dark:text-slate-400 uppercase font-semibold">Package Identifier</span>
            <p className="text-xs font-mono text-[#17343a] dark:text-slate-200 mt-0.5">com.debonair.iedailycontrol</p>
          </div>
        </div>
      </section>

      {/* Section 07: Centralized Hubs Audit */}
      <section
        id="audit-sec-hubs"
        className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs scroll-mt-20 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#ece6d9] dark:border-[#2a3442]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#176f78] dark:text-teal-400">SECTION 07</span>
            <span className="text-slate-400">·</span>
            <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176f78]" />
              <span>Centralized Operational Hubs</span>
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">6 Workspaces Configured</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {[
            { id: 'line-data' as SettingsPageSection, label: 'Line Data' },
            { id: 'checklist' as SettingsPageSection, label: 'Checklist' },
            { id: 'lean-tools' as SettingsPageSection, label: 'Lean Tools' },
            { id: 'capacity' as SettingsPageSection, label: 'Capacity' },
            { id: 'reports' as SettingsPageSection, label: 'Reports' },
            { id: 'world' as SettingsPageSection, label: 'WCM Pillars' }
          ].map(h => (
            <button
              key={h.id}
              type="button"
              onClick={() => onNavigateToSection(h.id)}
              className="p-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:border-[#176f78] text-xs font-semibold text-[#17343a] dark:text-slate-200 transition-colors text-center cursor-pointer truncate"
            >
              {h.label}
            </button>
          ))}
        </div>
      </section>

      {/* Super Admin Section */}
      {isSysAdmin && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold text-amber-950 dark:text-amber-200">Tier_0 Super Admin Clearance</span>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                Low-level terminal lock, database schema resets, and full system management.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToSection('tier_0')}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs"
          >
            Launch Root Suite
          </button>
        </div>
      )}
    </div>
  );
};
