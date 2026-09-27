/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bell,
  Gauge,
  Award,
  CheckCircle2,
  Loader2,
  Check,
  ShieldCheck,
  Sparkles,
  User,
  Upload,
  MessageSquare,
  Lock,
  Factory,
  Building2,
  Sliders
} from 'lucide-react';
import { SaveStatus, UserProfile, LineEntry, FactoryIndustryProfile } from '../types';
import { CustomDateSelector } from './CustomDateSelector';
import { ProductionFloorDropdown } from './ProductionFloorSelector';
import { isMasterAdminOrAdmin } from '../utils/rbac';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onLogoClick?: () => void;
  onOpenScorecard?: () => void;
  scorecardScore?: number;
  activeDataset?: string;
  onSelectDataset?: (dataset: string) => void;
  onReloadDebonair?: () => void;
  saveStatus?: SaveStatus;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  activeFloor?: string;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  onOpenRoles?: () => void;
  onOpenChat?: () => void;
  profile?: UserProfile;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  lines?: LineEntry[];
  onInitializeDateLines?: (date: string) => void;
  onLockTerminal?: () => void;
  factoryProfile?: FactoryIndustryProfile;
  onOpenFactorySettings?: () => void;
  onOpenAndroidPackage?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  unreadCount,
  onOpenNotifications,
  onLogoClick,
  onOpenScorecard,
  scorecardScore,
  saveStatus = 'idle',
  activeDate,
  onSelectDate,
  activeFloor = 'all',
  onSelectFloor,
  onOpenRoles,
  onOpenChat,
  profile,
  onOpenProfile,
  onOpenAuth,
  onOpenDatabase,
  lines = [],
  onInitializeDateLines,
  onLockTerminal,
  factoryProfile,
  onOpenFactorySettings,
  onOpenAndroidPackage,
  onOpenSettings
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);

  return (
    <header
      id="app-top-header"
      className="sticky top-0 z-40 border-b border-[#d9d2c2] bg-[#fbfaf6]/95 backdrop-blur-md transition-colors cockpit-header"
    >
      <div className="mx-auto max-w-[1500px] px-3 sm:px-6">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-1.5 sm:gap-4 w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              id="top-brand-logo-btn"
              onClick={onLogoClick}
              title={`${factoryProfile?.name || 'Debonair LTD'} • ${factoryProfile?.unitName || 'Unit-02'} - IE Daily Control Home`}
              aria-label="IE Daily Control Home"
              className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-hidden cursor-pointer touch-manipulation active:scale-95 transition-transform"
            >
              <div
                id="top-brand-logo-icon"
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#176f78] to-[#0f4e55] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:from-[#1b7f89] group-hover:to-[#135d65] group-hover:shadow-md transition-all duration-200 border border-[#176f78]/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] text-[#fbfaf6] drop-shadow-xs transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[11px] sm:text-sm tracking-tight text-[#17343a] leading-none uppercase font-display max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate">
                      {factoryProfile?.name || 'IE / DAILY'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase font-mono bg-[#176f78]/15 text-[#176f78] border border-[#176f78]/30 shrink-0">
                      {factoryProfile?.unitName || 'UNIT-02'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-[#fef7ce] text-[#78350f] border border-[#eed78e] shadow-2xs font-sans leading-none">
                      PROD
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Enterprise Factory / Industry Identity Pill - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onOpenFactorySettings && (
              <button
                id="top-factory-settings-pill"
                type="button"
                onClick={onOpenFactorySettings}
                title={`Enterprise Plant: ${factoryProfile?.name || 'Debonair LTD'} (${factoryProfile?.unitName || 'Unit-02'})\nSector: ${factoryProfile?.industrySector || 'Apparel & Garments (RMG)'}\nClick to configure Factory & Industry Name in Floor & Setup`}
                className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl border border-[#176f78]/25 bg-white hover:bg-gradient-to-r hover:from-white hover:to-[#f5f3ec] hover:border-[#176f78] shadow-2xs hover:shadow-xs transition-all cursor-pointer group shrink-0"
              >
                <div className="w-6 h-6 rounded-lg bg-[#176f78]/10 text-[#176f78] group-hover:bg-[#176f78] group-hover:text-white flex items-center justify-center transition-colors">
                  <Factory className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#527078] leading-none">
                    Industry Plant
                  </span>
                  <span className="font-bold text-[11px] text-[#17343a] group-hover:text-[#176f78] transition-colors max-w-[110px] lg:max-w-[160px] truncate leading-tight mt-0.5">
                    {factoryProfile?.name || 'Debonair LTD'}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#f1eee6] text-[#176f78] border border-[#d9d2c2] group-hover:border-[#176f78]">
                  Floor &amp; Setup 🏭
                </span>
              </button>
            )}
          </div>

          {/* Center: Active Production Date & Floor Selector */}
          <div id="top-date-selector-wrapper" className="hidden sm:flex items-center gap-2">
            {onSelectDate && (
              <CustomDateSelector
                selectedDate={activeDate || '2026-09-21'}
                onSelectDate={onSelectDate}
                lines={lines}
                onInitializeDateLines={onInitializeDateLines}
                compact={true}
              />
            )}
            {onSelectFloor && (
              <ProductionFloorDropdown
                selectedFloor={activeFloor}
                onSelectFloor={onSelectFloor}
                lines={lines}
                variant="header"
              />
            )}
          </div>

          {/* Center-Right: Live Status Indicator */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {saveStatus === 'saving' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-[11px] sm:text-xs font-bold animate-pulse shadow-2xs"
                title="Saving line and checklist updates to local storage"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden min-[420px]:inline">Saving...</span>
              </div>
            )}

            {saveStatus === 'saved' && (
              <div
                id="header-save-status-indicator"
                role="status"
                aria-live="polite"
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-800 dark:text-emerald-200 text-[11px] sm:text-xs font-bold shadow-2xs transition-all duration-300"
                title="All updates successfully saved"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="hidden min-[420px]:inline">Saved</span>
              </div>
            )}

            {saveStatus === 'idle' && (
              <div
                id="header-save-status-indicator"
                className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] text-[#527078] opacity-75 hover:opacity-100 transition-opacity"
                title="LocalStorage state synced"
              >
                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Saved</span>
              </div>
            )}
          </div>

          {/* Right Action Icons: Scorecard, User Profile & Notifications */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* RBAC Role & Scope Button - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onOpenRoles && (
              <button
                id="top-rbac-role-pill"
                type="button"
                onClick={onOpenRoles}
                title={`Debonair LTD RBAC: ${profile?.jobTitle || 'Sr. Manager'} - Click to open RBAC Controls & Organogram`}
                className="hidden lg:flex h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-[#1e3a8a]/30 bg-[#1e3a8a]/10 hover:bg-[#1e3a8a] text-[#1e3a8a] hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#1e3a8a] group-hover:text-white" />
                <span className="font-display uppercase tracking-wider text-[11px]">
                  {profile?.tierId === 'tier_0' || isMasterAdmin
                    ? 'Tier 0: Root Admin'
                    : profile?.tierId === 'tier_1'
                    ? 'Tier 1: Sr. Mgr'
                    : profile?.tierId === 'tier_2'
                    ? `Tier 2: Mgr (${profile.assignedWing?.replace(' Wing', '') || 'Wing'})`
                    : profile?.tierId === 'tier_3'
                    ? 'Tier 3: Incharge'
                    : profile?.tierId === 'tier_4'
                    ? 'Tier 4: Line IE'
                    : 'RBAC Roles'}
                </span>
                <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-[#1e3a8a]/20 group-hover:bg-white group-hover:text-[#1e3a8a] text-[#1e3a8a]">
                  RBAC
                </span>
              </button>
            )}

            {/* IE Scorecard Button - Transferred to Header for quick global access */}
            {onOpenScorecard && (
              <button
                id="top-scorecard-btn"
                type="button"
                onClick={onOpenScorecard}
                title={`Open IE Performance Scorecard ${typeof scorecardScore === 'number' ? `(${scorecardScore}%)` : ''}`}
                aria-label="IE Scorecard"
                className="flex h-9 px-2 sm:px-2.5 md:px-3 rounded-xl border border-[#176f78]/30 bg-[#176f78]/10 hover:bg-[#176f78] text-[#176f78] hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Award className="w-4 h-4 shrink-0 text-amber-500 group-hover:text-amber-200 transition-colors" />
                <span className="hidden sm:inline font-display uppercase tracking-wide">IE Scorecard</span>
                {typeof scorecardScore === 'number' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#176f78] text-white text-[10px] font-mono-numbers group-hover:bg-white group-hover:text-[#176f78] transition-colors">
                    {scorecardScore}%
                  </span>
                )}
              </button>
            )}

            {/* User Profile / OAuth Button */}
            {onOpenProfile && (
              <button
                id="top-user-profile-btn"
                onClick={onOpenProfile}
                title={`Profile: ${profile?.name || 'Engineer'} (${profile?.jobTitle || 'IE'})`}
                className="h-10 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-[#d9d2c2] bg-white hover:bg-[#f1eee6] text-[#17343a] flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0 min-w-[40px] justify-center"
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#d9d2c2]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-md bg-[#176f78] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                    {profile?.name ? profile.name.slice(0, 1).toUpperCase() : 'IE'}
                  </div>
                )}
                <span className="hidden md:inline max-w-[100px] truncate text-[11px] font-semibold">
                  {profile?.name ? profile.name.split(' ')[0] : 'Profile'}
                </span>
                {profile?.googleUid && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Google OAuth Linked" />
                )}
              </button>
            )}

            {/* Import Data Button - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onOpenDatabase && (
              <button
                id="top-import-data-btn"
                type="button"
                onClick={() => onOpenDatabase('csv-import')}
                title="Import Line Data from CSV / Excel or Restore Backup"
                className="hidden sm:flex h-9 px-2.5 sm:px-3 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Upload className="w-4 h-4 shrink-0 text-emerald-700 group-hover:text-white" />
                <span className="hidden md:inline font-display uppercase tracking-wide">Import Data</span>
              </button>
            )}

            {/* Team Chat & Floor Hub Button */}
            {onOpenChat && (
              <button
                id="header-team-chat-btn"
                onClick={onOpenChat}
                title="Shop Floor Communications & AI Advisor"
                aria-label="Shop Floor Chat"
                className="hidden sm:flex relative w-9 h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <MessageSquare className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            )}

            {/* Control Center & Preferences Button */}
            {onOpenSettings && (
              <button
                id="header-control-preferences-btn"
                type="button"
                onClick={onOpenSettings}
                title="Control Center & Preferences"
                aria-label="Control Center & Preferences"
                className="hidden sm:flex relative w-9 h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <Sliders className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </button>
            )}

            {/* Notifications Button */}
            <button
              id="top-notifications-btn"
              onClick={onOpenNotifications}
              title="Notifications & Floor Alerts"
              aria-label="Notifications"
              className="relative w-10 h-10 sm:w-9 sm:h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-[#176f78] hover:border-[#176f78] flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-hidden touch-manipulation active:scale-95 shrink-0"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Lock Terminal Quick Button - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onLockTerminal && (
              <button
                id="header-lock-terminal-btn"
                type="button"
                onClick={onLockTerminal}
                title="Lock Terminal Workstation"
                aria-label="Lock Workstation"
                className="hidden md:flex relative w-9 h-9 rounded-xl border border-[#d9d2c2] bg-white text-slate-700 hover:text-amber-600 hover:border-amber-400 items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <Lock className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
