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
  Sliders,
  SlidersHorizontal,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { SaveStatus, UserProfile, LineEntry, FactoryIndustryProfile, WorkspaceWidthMode, SyncState, TopBarConfig } from '../types';
import { CustomDateSelector } from './CustomDateSelector';
import { ProductionFloorDropdown } from './ProductionFloorSelector';
import { isMasterAdminOrAdmin } from '../utils/rbac';
import { DEFAULT_TOP_BAR_CONFIG } from '../utils/layoutManager';

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
  density?: string;
  onToggleDensity?: () => void;
  onSelectDensity?: (density: 'compact' | 'comfortable' | 'spacious') => void;
  workspaceWidth?: WorkspaceWidthMode;
  onSelectWorkspaceWidth?: (width: WorkspaceWidthMode) => void;
  smallAreaFeaturesEnabled?: boolean;
  onToggleSmallAreaFeatures?: () => void;
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
  syncState?: SyncState;
  onToggleOnlineStatus?: () => void;
  topBarConfig?: TopBarConfig;
  onOpenTopBarCustomizer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  density = 'comfortable',
  onToggleDensity,
  onSelectDensity,
  workspaceWidth = 'maximized',
  onSelectWorkspaceWidth,
  smallAreaFeaturesEnabled = true,
  onToggleSmallAreaFeatures,
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
  onOpenSettings,
  syncState,
  onToggleOnlineStatus,
  topBarConfig,
  onOpenTopBarCustomizer
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const cfg = topBarConfig || DEFAULT_TOP_BAR_CONFIG;

  const handlePrevDay = () => {
    if (!activeDate || !onSelectDate) return;
    try {
      const parts = activeDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      onSelectDate(`${y}-${m}-${day}`);
    } catch (e) {
      console.warn('Error navigating to prev day', e);
    }
  };

  const handleNextDay = () => {
    if (!activeDate || !onSelectDate) return;
    try {
      const parts = activeDate.split('-').map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      d.setDate(d.getDate() + 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      onSelectDate(`${y}-${m}-${day}`);
    } catch (e) {
      console.warn('Error navigating to next day', e);
    }
  };

  const isFloating = cfg.mobileStyle === 'floating';
  const stickyClass = cfg.sticky ? 'sticky top-0 z-40' : 'relative z-20';

  const accentBorderClass =
    cfg.accentTheme === 'emerald'
      ? 'border-emerald-600/40 dark:border-emerald-500/40'
      : cfg.accentTheme === 'amber'
      ? 'border-amber-500/50 dark:border-amber-500/50'
      : cfg.accentTheme === 'indigo'
      ? 'border-indigo-500/40 dark:border-indigo-500/40'
      : cfg.accentTheme === 'slate'
      ? 'border-slate-300 dark:border-slate-700'
      : 'border-[#d9d2c2] dark:border-[#2e3846]';

  const heightClass =
    cfg.mobileStyle === 'compact'
      ? 'h-11 sm:h-14'
      : cfg.mobileStyle === 'minimal'
      ? 'h-9 sm:h-12'
      : cfg.mobileStyle === 'floating'
      ? 'h-12 sm:h-15'
      : 'h-14 sm:h-16';

  return (
    <header
      id="app-top-header"
      className={`${stickyClass} ${accentBorderClass} ${
        isFloating
          ? 'mx-2 sm:mx-4 mt-2 mb-1 rounded-2xl border shadow-md bg-[#fbfaf6]/95 dark:bg-[#181d24]/95 backdrop-blur-md'
          : 'border-b bg-[#fbfaf6]/95 dark:bg-[#181d24]/95 backdrop-blur-md'
      } transition-colors cockpit-header`}
    >
      <div className={`transition-all ${
        workspaceWidth === 'fluid'
          ? 'w-full px-2.5 sm:px-6'
          : workspaceWidth === 'maximized'
          ? 'w-full max-w-[97vw] 2xl:max-w-[1850px] mx-auto px-2.5 sm:px-6'
          : 'mx-auto max-w-[1500px] px-2.5 sm:px-6'
      }`}>
        <div className={`flex ${heightClass} items-center justify-between gap-1.5 sm:gap-4 w-full`}>
          {/* Logo & Brand */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              id="top-brand-logo-btn"
              onClick={onLogoClick}
              title={`${factoryProfile?.name || 'Debonair LTD'} • ${factoryProfile?.unitName || 'Unit-02'} - IE Daily Control Home`}
              aria-label="IE Daily Control Home"
              className="flex items-center gap-1.5 sm:gap-2.5 text-left group focus:outline-hidden cursor-pointer touch-manipulation active:scale-95 transition-transform"
            >
              <div
                id="top-brand-logo-icon"
                className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#176f78] to-[#0f4e55] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:from-[#1b7f89] group-hover:to-[#135d65] group-hover:shadow-md transition-all duration-200 border border-[#176f78]/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-transparent pointer-events-none" />
                <Gauge className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] text-[#fbfaf6] drop-shadow-xs transition-transform duration-200 group-hover:scale-105" />
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <span className={`font-extrabold tracking-tight text-[#17343a] dark:text-slate-100 leading-none uppercase font-display max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate ${
                      cfg.brandDisplayMode === 'badge-only'
                        ? 'hidden sm:inline text-xs sm:text-sm'
                        : cfg.brandDisplayMode === 'compact'
                        ? 'text-[11px] sm:text-sm'
                        : 'text-[11px] sm:text-sm'
                    }`}>
                      {cfg.brandDisplayMode === 'compact'
                        ? (factoryProfile?.name ? factoryProfile.name.split(' ')[0] : 'IE')
                        : (factoryProfile?.name || 'IE / DAILY')}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase font-mono bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 border border-[#176f78]/30 shrink-0">
                      {factoryProfile?.unitName || 'UNIT-02'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-black uppercase tracking-wider bg-[#fef7ce] text-[#78350f] border border-[#eed78e] shadow-2xs font-sans leading-none">
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

          {/* Center: Active Production Date & Floor Selector (Desktop/Tablet) */}
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

          {/* Right Action Icons: Telemetry, Scorecard, Profile, Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
            {/* Auto Save Micro Indicator */}
            {cfg.showAutoSaveIndicator && (
              <div
                id="header-save-status-container"
                className="flex items-center justify-center shrink-0 w-5 h-5 sm:w-6 sm:h-6 mr-0.5"
                role="status"
                aria-live="polite"
                title={
                  saveStatus === 'saving'
                    ? 'Auto-saving: persisting line & checklist updates...'
                    : saveStatus === 'saved'
                    ? 'Auto-saved: all changes saved to local storage'
                    : 'Auto-save: in sync'
                }
              >
                {saveStatus === 'saving' ? (
                  <div
                    id="header-save-status-indicator"
                    className="w-4 h-4 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center animate-pulse"
                  >
                    <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-600 dark:text-amber-400" />
                    <span className="sr-only">Auto-saving...</span>
                  </div>
                ) : saveStatus === 'saved' ? (
                  <div
                    id="header-save-status-indicator"
                    className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center transition-all duration-200"
                  >
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                    <span className="sr-only">Auto-saved</span>
                  </div>
                ) : (
                  <div
                    id="header-save-status-indicator"
                    className="w-4 h-4 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600/70 dark:bg-emerald-400/70" />
                    <span className="sr-only">Auto-save synced</span>
                  </div>
                )}
              </div>
            )}

            {/* Online Live Connectivity Status Pill (Responsive mobile & desktop) */}
            {cfg.showOnlinePill && (
              <button
                id="header-online-status-pill"
                type="button"
                onClick={onToggleOnlineStatus}
                title={
                  syncState?.status === 'connected'
                    ? `System Online • Real-time telemetry connected (${syncState.latencyMs || 22}ms latency)\nClick to toggle offline mode test`
                    : 'System Offline • Local cache active\nClick to reconnect online'
                }
                className={`flex h-7 sm:h-8.5 px-1.5 sm:px-2.5 rounded-xl border items-center gap-1 sm:gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0 ${
                  syncState?.status === 'connected'
                    ? 'border-emerald-600/30 dark:border-emerald-500/30 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300'
                }`}
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {syncState?.status === 'connected' ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </>
                  ) : (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </>
                  )}
                </span>
                {syncState?.status === 'connected' ? (
                  <Wifi className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <WifiOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                {/* On mobile show ON/OFF, on desktop show ONLINE/OFFLINE */}
                <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider font-extrabold">
                  {syncState?.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                </span>
                <span className="sm:hidden font-mono text-[9px] uppercase font-extrabold">
                  {syncState?.status === 'connected' ? 'ON' : 'OFF'}
                </span>
                {syncState?.status === 'connected' && syncState.latencyMs ? (
                  <span className="hidden xl:inline text-[9px] font-mono opacity-70">
                    {syncState.latencyMs}ms
                  </span>
                ) : null}
              </button>
            )}

            {/* RBAC Role & Scope Button - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onOpenRoles && (
              <button
                id="top-rbac-role-pill"
                type="button"
                onClick={onOpenRoles}
                title={`Debonair LTD RBAC: ${profile?.jobTitle || 'Sr. Manager'} - Click to open RBAC Controls & Organogram`}
                className="hidden lg:flex h-8.5 sm:h-9 px-2 sm:px-2.5 rounded-xl border border-[#1e3a8a]/30 dark:border-blue-500/30 bg-[#1e3a8a]/10 dark:bg-blue-500/20 hover:bg-[#1e3a8a] text-[#1e3a8a] dark:text-blue-300 hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#1e3a8a] dark:text-blue-300 group-hover:text-white" />
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
                <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-[#1e3a8a]/20 dark:bg-blue-400/20 group-hover:bg-white group-hover:text-[#1e3a8a] text-[#1e3a8a] dark:text-blue-200">
                  RBAC
                </span>
              </button>
            )}

            {/* IE Scorecard Button */}
            {cfg.showScorecard && onOpenScorecard && (
              <button
                id="top-scorecard-btn"
                type="button"
                onClick={onOpenScorecard}
                title={`Open IE Performance Scorecard ${typeof scorecardScore === 'number' ? `(${scorecardScore}%)` : ''}`}
                aria-label="IE Scorecard"
                className="flex h-8 sm:h-9 min-h-[32px] sm:min-h-[36px] max-h-[36px] px-1.5 sm:px-2.5 md:px-3 rounded-xl border border-[#176f78]/30 dark:border-teal-500/30 bg-[#176f78]/10 dark:bg-teal-500/20 hover:bg-[#176f78] text-[#176f78] dark:text-teal-300 hover:text-white items-center gap-1 sm:gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-500 dark:text-amber-400 group-hover:text-amber-200 transition-colors" />
                <span className="hidden sm:inline font-display uppercase tracking-wide">IE Scorecard</span>
                {typeof scorecardScore === 'number' && (
                  <span className="px-1 sm:px-1.5 py-0.5 rounded-md bg-[#176f78] dark:bg-teal-700 text-white text-[9px] sm:text-[10px] font-mono-numbers group-hover:bg-white group-hover:text-[#176f78] transition-colors">
                    {scorecardScore}%
                  </span>
                )}
              </button>
            )}

            {/* User Profile / OAuth Button */}
            {cfg.showUserProfile && onOpenProfile && (
              <button
                id="top-user-profile-btn"
                onClick={onOpenProfile}
                title={`Profile: ${profile?.name || 'Engineer'} (${profile?.jobTitle || 'IE'})`}
                className="flex h-8 sm:h-9 min-h-[32px] sm:min-h-[36px] max-h-[36px] px-1.5 sm:px-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] hover:bg-[#f1eee6] dark:hover:bg-[#28323f] text-[#17343a] dark:text-slate-100 items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0 justify-center"
              >
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.name}
                    className="w-5 h-5 rounded-full object-cover border border-[#d9d2c2] dark:border-[#2e3846]"
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
                className="hidden sm:flex h-9 min-h-[36px] max-h-[36px] px-2.5 sm:px-3 rounded-xl border border-emerald-600/30 bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 hover:text-white items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-2xs group touch-manipulation active:scale-95 shrink-0"
              >
                <Upload className="w-4 h-4 shrink-0 text-emerald-700 group-hover:text-white" />
                <span className="hidden md:inline font-display uppercase tracking-wide">Import Data</span>
              </button>
            )}

            {/* Quick Dark / Light Theme Switcher */}
            {cfg.showThemeToggle && onToggleTheme && (
              <button
                id="header-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                title={`Theme: ${theme}. Click to switch dark/light`}
                aria-label="Toggle Theme"
                className="flex relative w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] text-amber-500 dark:text-amber-300 hover:text-[#176f78] dark:hover:text-teal-300 hover:border-[#176f78] items-center justify-center transition-all shadow-2xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            )}

            {/* Team Chat & Floor Hub Button */}
            {cfg.showTeamChat && onOpenChat && (
              <button
                id="header-team-chat-btn"
                onClick={onOpenChat}
                title="Shop Floor Communications & AI Advisor"
                aria-label="Shop Floor Chat"
                className="flex relative w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] text-slate-700 dark:text-slate-300 hover:text-[#176f78] dark:hover:text-teal-300 hover:border-[#176f78] items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1f2630]" />
              </button>
            )}

            {/* Settings Button */}
            {cfg.showQuickSettings && onOpenSettings && (
              <button
                id="header-control-preferences-btn"
                type="button"
                onClick={onOpenSettings}
                title="Settings & Control Center"
                aria-label="Settings"
                className="hidden sm:flex relative w-9 h-9 min-w-[36px] max-w-[36px] min-h-[36px] max-h-[36px] rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] text-slate-700 dark:text-slate-300 hover:text-[#176f78] dark:hover:text-teal-300 hover:border-[#176f78] items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <Sliders className="w-4 h-4 transition-transform group-hover:rotate-45" />
              </button>
            )}

            {/* Notifications Button */}
            {cfg.showNotifications && (
              <button
                id="top-notifications-btn"
                onClick={onOpenNotifications}
                title="Notifications & Floor Alerts"
                aria-label="Notifications"
                className="relative w-8 h-8 sm:w-9 sm:h-9 min-w-[32px] sm:min-w-[36px] min-h-[32px] sm:min-h-[36px] rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] text-slate-700 dark:text-slate-300 hover:text-[#176f78] dark:hover:text-teal-300 hover:border-[#176f78] flex items-center justify-center transition-colors shadow-2xs cursor-pointer focus:outline-hidden touch-manipulation active:scale-95 shrink-0"
              >
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 sm:w-4 h-3.5 sm:h-4 rounded-full bg-rose-500 text-white font-bold text-[8px] sm:text-[9px] flex items-center justify-center shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Lock Terminal Quick Button - ONLY for Master Administration/Admin Role */}
            {isMasterAdmin && onLockTerminal && (
              <button
                id="header-lock-terminal-btn"
                type="button"
                onClick={onLockTerminal}
                title="Lock Terminal Workstation"
                aria-label="Lock Workstation"
                className="hidden md:flex relative w-9 h-9 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] text-slate-700 dark:text-slate-300 hover:text-amber-600 hover:border-amber-400 items-center justify-center transition-all shadow-2xs cursor-pointer group touch-manipulation active:scale-95 shrink-0"
              >
                <Lock className="w-4 h-4 transition-transform group-hover:scale-110" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Ergonomic Sub-Header Strip (Fast Date & Floor Selectors) */}
      {cfg.showSubHeaderOnMobile && (onSelectDate || onSelectFloor) && (
        <div
          id="mobile-top-sub-header"
          className="sm:hidden border-t border-[#d9d2c2]/70 dark:border-[#2e3846]/70 px-2 py-1 bg-[#f5f3ec]/95 dark:bg-[#151920]/95 backdrop-blur-md flex items-center justify-between gap-1.5 transition-all text-xs"
        >
          {/* Quick Date Switcher with Day Jump Arrows */}
          {cfg.showDateSelectorOnMobile && onSelectDate && (
            <div className="flex items-center gap-0.5 bg-white dark:bg-[#1f2630] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl px-1 py-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={handlePrevDay}
                title="Previous Day"
                aria-label="Previous Day"
                className="w-5 h-5 flex items-center justify-center text-[#527078] dark:text-slate-300 hover:text-[#176f78] dark:hover:text-teal-300 rounded active:scale-90 transition-transform cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center gap-1 px-1 font-mono text-[10px] font-bold text-[#17343a] dark:text-slate-200">
                <Calendar className="w-3 h-3 text-[#176f78] dark:text-teal-400 shrink-0" />
                <span>{activeDate || '2026-09-21'}</span>
              </div>
              <button
                type="button"
                onClick={handleNextDay}
                title="Next Day"
                aria-label="Next Day"
                className="w-5 h-5 flex items-center justify-center text-[#527078] dark:text-slate-300 hover:text-[#176f78] dark:hover:text-teal-300 rounded active:scale-90 transition-transform cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Floor Selector Dropdown on Mobile */}
          {cfg.showFloorSelectorOnMobile && onSelectFloor && (
            <div className="min-w-0 flex-1 max-w-[140px]">
              <ProductionFloorDropdown
                selectedFloor={activeFloor}
                onSelectFloor={onSelectFloor}
                lines={lines}
                variant="header"
              />
            </div>
          )}

          {/* Right Status */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#176f78]/10 text-[#176f78] dark:text-teal-300 border border-[#176f78]/20">
              {lines.length}L
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
