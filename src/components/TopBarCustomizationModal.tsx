/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  SlidersHorizontal,
  Smartphone,
  Eye,
  Calendar,
  Layers,
  Wifi,
  Award,
  Bell,
  User,
  MessageSquare,
  Sun,
  Moon,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Maximize2,
  Minimize2,
  Anchor,
  Palette,
  Check
} from 'lucide-react';
import { TopBarConfig, TopBarMobileStyle, TopBarAccentTheme } from '../types';
import { DEFAULT_TOP_BAR_CONFIG } from '../utils/layoutManager';

interface TopBarCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: TopBarConfig;
  onSaveConfig: (updated: TopBarConfig) => void;
  theme?: string;
  onToggleTheme?: () => void;
}

const PRESETS: {
  id: string;
  name: string;
  desc: string;
  config: Partial<TopBarConfig>;
}[] = [
  {
    id: 'industrial-default',
    name: 'Industrial Standard',
    desc: 'Balanced 56px header with mobile sub-header date & floor bar and all telemetry pinned.',
    config: {
      mobileStyle: 'standard',
      sticky: true,
      showSubHeaderOnMobile: true,
      showDateSelectorOnMobile: true,
      showFloorSelectorOnMobile: true,
      showOnlinePill: true,
      showScorecard: true,
      showAutoSaveIndicator: true,
      showNotifications: true,
      showUserProfile: true,
      showTeamChat: false,
      showQuickSettings: true,
      showThemeToggle: true,
      accentTheme: 'brand',
      brandDisplayMode: 'compact'
    }
  },
  {
    id: 'compact-frontline',
    name: 'Frontline Ultra-Compact',
    desc: '46px condensed bar, streamlined icons, and quick date/floor jump for mobile supervisors.',
    config: {
      mobileStyle: 'compact',
      sticky: true,
      showSubHeaderOnMobile: true,
      showDateSelectorOnMobile: true,
      showFloorSelectorOnMobile: true,
      showOnlinePill: true,
      showScorecard: false,
      showAutoSaveIndicator: true,
      showNotifications: true,
      showUserProfile: true,
      showTeamChat: false,
      showQuickSettings: true,
      showThemeToggle: false,
      accentTheme: 'brand',
      brandDisplayMode: 'badge-only'
    }
  },
  {
    id: 'minimal-micro',
    name: 'Minimalist Micro',
    desc: '38px ultra-low footprint for maximum vertical sewing line visibility on small screens.',
    config: {
      mobileStyle: 'minimal',
      sticky: true,
      showSubHeaderOnMobile: false,
      showDateSelectorOnMobile: true,
      showFloorSelectorOnMobile: true,
      showOnlinePill: true,
      showScorecard: false,
      showAutoSaveIndicator: true,
      showNotifications: true,
      showUserProfile: false,
      showTeamChat: false,
      showQuickSettings: false,
      showThemeToggle: false,
      accentTheme: 'slate',
      brandDisplayMode: 'badge-only'
    }
  },
  {
    id: 'executive-floating',
    name: 'Executive Floating Dock',
    desc: 'Modern floating pill dock with Scorecard, theme switcher, and rich telemetry.',
    config: {
      mobileStyle: 'floating',
      sticky: true,
      showSubHeaderOnMobile: true,
      showDateSelectorOnMobile: true,
      showFloorSelectorOnMobile: true,
      showOnlinePill: true,
      showScorecard: true,
      showAutoSaveIndicator: true,
      showNotifications: true,
      showUserProfile: true,
      showTeamChat: true,
      showQuickSettings: true,
      showThemeToggle: true,
      accentTheme: 'indigo',
      brandDisplayMode: 'full'
    }
  }
];

export const TopBarCustomizationModal: React.FC<TopBarCustomizationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  theme = 'light',
  onToggleTheme
}) => {
  const [localConfig, setLocalConfig] = useState<TopBarConfig>(config);
  const [activeTab, setActiveTab] = useState<'layout' | 'buttons' | 'accents'>('layout');
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleUpdate = <K extends keyof TopBarConfig>(key: K, value: TopBarConfig[K]) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
  };

  const handleApplyPreset = (presetConfig: Partial<TopBarConfig>) => {
    const updated = { ...localConfig, ...presetConfig };
    setLocalConfig(updated);
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 400);
  };

  const handleReset = () => {
    setLocalConfig(DEFAULT_TOP_BAR_CONFIG);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-all text-[#17343a] dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#e7e1d5] dark:border-[#2e3846] flex items-center justify-between bg-white dark:bg-[#1f2630] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 flex items-center justify-center border border-[#176f78]/30 shadow-2xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight text-[#17343a] dark:text-white uppercase font-display">
                  Top Bar &amp; Mobile UX Polish
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 border border-[#176f78]/30">
                  Customizer
                </span>
              </div>
              <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                Optimize header height, mobile date/floor sub-strip, and pinned quick actions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer text-[#527078] dark:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Interactive Header Preview */}
        <div className="p-3 sm:p-4 bg-[#f2eee3] dark:bg-[#12161c] border-b border-[#e7e1d5] dark:border-[#2e3846] shrink-0">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
              <span>Live Mobile Header Preview</span>
            </span>
            <span className="font-mono text-[9px] bg-white/70 dark:bg-slate-800/80 px-2 py-0.5 rounded-md border border-[#d9d2c2] dark:border-slate-700">
              Style: {localConfig.mobileStyle.toUpperCase()} • {localConfig.accentTheme}
            </span>
          </div>

          {/* Scaled Preview Box */}
          <div className="rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] p-2 sm:p-2.5 shadow-xs overflow-x-auto">
            <div className={`flex items-center justify-between gap-1.5 transition-all ${
              localConfig.mobileStyle === 'compact'
                ? 'h-10'
                : localConfig.mobileStyle === 'minimal'
                ? 'h-8'
                : localConfig.mobileStyle === 'floating'
                ? 'h-11 px-2.5 rounded-xl border border-[#176f78]/30 shadow-xs bg-white dark:bg-[#1f2630]'
                : 'h-12'
            }`}>
              {/* Brand Logo in Preview */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-6 h-6 rounded-lg bg-[#176f78] text-white flex items-center justify-center font-bold text-[9px]">
                  IE
                </div>
                {localConfig.brandDisplayMode === 'full' && (
                  <div className="flex flex-col text-[10px] font-extrabold uppercase leading-none">
                    <span>IE / DAILY</span>
                    <span className="text-[8px] text-[#176f78] dark:text-teal-400 font-mono">UNIT-02</span>
                  </div>
                )}
                {localConfig.brandDisplayMode === 'compact' && (
                  <span className="text-[10px] font-extrabold uppercase">
                    IE-02
                  </span>
                )}
              </div>

              {/* Action buttons preview */}
              <div className="flex items-center gap-1 shrink-0 ml-auto">
                {localConfig.showAutoSaveIndicator && (
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[8px]" title="Auto-save">
                    ✓
                  </span>
                )}

                {localConfig.showOnlinePill && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>ON</span>
                  </span>
                )}

                {localConfig.showScorecard && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 border border-[#176f78]/30">
                    <Award className="w-2.5 h-2.5 text-amber-500" />
                    <span>94%</span>
                  </span>
                )}

                {localConfig.showUserProfile && (
                  <div className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold">
                    U
                  </div>
                )}

                {localConfig.showNotifications && (
                  <div className="relative w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                    <Bell className="w-3 h-3" />
                  </div>
                )}

                {localConfig.showThemeToggle && (
                  <div className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-amber-500">
                    <Sun className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>

            {/* Sub-Header Strip in Preview if enabled */}
            {localConfig.showSubHeaderOnMobile && (
              <div className="mt-1.5 pt-1.5 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center justify-between gap-1 text-[9px] font-mono">
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 font-bold flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5 text-[#176f78]" />
                    <span>2026-09-21</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 font-bold flex items-center gap-1">
                    <Layers className="w-2.5 h-2.5 text-[#176f78]" />
                    <span>All Floors</span>
                  </span>
                </div>
                <span className="text-[8px] font-bold text-[#176f78] dark:text-teal-400">
                  34 Lines Active
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-2 bg-[#fbfaf6] dark:bg-[#181d24] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'layout'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-300'
                : 'border-transparent text-[#527078] dark:text-slate-400 hover:text-[#17343a]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile Geometry &amp; Sub-Bar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'buttons'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-300'
                : 'border-transparent text-[#527078] dark:text-slate-400 hover:text-[#17343a]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Quick Action Pinned Items</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accents')}
            className={`pb-2.5 text-xs font-bold transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'accents'
                ? 'border-[#176f78] text-[#176f78] dark:text-teal-300'
                : 'border-transparent text-[#527078] dark:text-slate-400 hover:text-[#17343a]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Accents &amp; Presets</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          
          {/* TAB 1: Layout & Sub-Header Geometry */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              {/* Header Mobile Style */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200 block mb-2">
                  Mobile Header Layout Height &amp; Form Factor
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'standard', label: 'Standard (56px)', desc: 'Full touch target 56px height with standard spacing' },
                    { id: 'compact', label: 'Compact (46px)', desc: '46px tactile footprint for modern phone screens' },
                    { id: 'minimal', label: 'Minimal (38px)', desc: '38px micro bar to maximize vertical sewing data' },
                    { id: 'floating', label: 'Floating Dock', desc: 'Island floating pill with rounded borders' }
                  ].map((styleOption) => (
                    <button
                      key={styleOption.id}
                      type="button"
                      onClick={() => handleUpdate('mobileStyle', styleOption.id as TopBarMobileStyle)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        localConfig.mobileStyle === styleOption.id
                          ? 'border-[#176f78] bg-[#176f78]/10 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-2xs font-bold'
                          : 'border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] hover:bg-[#f5f3ec] text-[#527078] dark:text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold mb-1 flex items-center justify-between">
                        <span>{styleOption.label}</span>
                        {localConfig.mobileStyle === styleOption.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#527078] dark:text-slate-400 leading-tight">
                        {styleOption.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Header Strip Toggle (Crucial Mobile Ergonomics) */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1f2630] border border-[#d9d2c2] dark:border-[#2e3846] space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#176f78]" />
                      <span>Mobile Date &amp; Floor Sub-Header Strip</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                        Recommended
                      </span>
                    </div>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400">
                      Renders an ergonomic sub-strip right below the header on phones, enabling one-tap date and floor switches without scrolling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate('showSubHeaderOnMobile', !localConfig.showSubHeaderOnMobile)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      localConfig.showSubHeaderOnMobile ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        localConfig.showSubHeaderOnMobile ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {localConfig.showSubHeaderOnMobile && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.showDateSelectorOnMobile}
                        onChange={(e) => handleUpdate('showDateSelectorOnMobile', e.target.checked)}
                        className="rounded border-[#d9d2c2] text-[#176f78] focus:ring-[#176f78]"
                      />
                      <span>Quick Date Switcher &amp; Day Jump Arrows</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localConfig.showFloorSelectorOnMobile}
                        onChange={(e) => handleUpdate('showFloorSelectorOnMobile', e.target.checked)}
                        className="rounded border-[#d9d2c2] text-[#176f78] focus:ring-[#176f78]"
                      />
                      <span>Shop Floor Dropdown Chip</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Sticky Top Bar & Brand Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1f2630] border border-[#d9d2c2] dark:border-[#2e3846] flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Sticky Header</span>
                    </span>
                    <p className="text-[10px] text-[#527078] dark:text-slate-400">
                      Anchor top bar to viewport during floor scrolling
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUpdate('sticky', !localConfig.sticky)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      localConfig.sticky ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        localConfig.sticky ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#1f2630] border border-[#d9d2c2] dark:border-[#2e3846] space-y-1.5">
                  <span className="text-xs font-bold block">
                    Mobile Brand Identity
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'full', label: 'Full Title' },
                      { id: 'compact', label: 'IE-02' },
                      { id: 'badge-only', label: 'Icon Only' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => handleUpdate('brandDisplayMode', mode.id as any)}
                        className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold border text-center transition-colors cursor-pointer ${
                          localConfig.brandDisplayMode === mode.id
                            ? 'bg-[#176f78] text-white border-[#176f78]'
                            : 'bg-[#fbfaf6] dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-[#527078] dark:text-slate-300'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Quick Action Pinned Buttons */}
          {activeTab === 'buttons' && (
            <div className="space-y-3">
              <p className="text-xs text-[#527078] dark:text-slate-400">
                Choose which shortcuts appear in the top right of the mobile and desktop header. Turn off unneeded buttons to keep mobile headers spacious and clean.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    key: 'showOnlinePill',
                    label: 'Live Online Status Pill',
                    desc: 'Real-time telemetry connection status with latency',
                    icon: Wifi
                  },
                  {
                    key: 'showScorecard',
                    label: 'IE Scorecard Attainment Badge',
                    desc: '1-tap launch of IE Performance Scorecard with % badge',
                    icon: Award
                  },
                  {
                    key: 'showAutoSaveIndicator',
                    label: 'Auto-Save Micro Status',
                    desc: 'Discrete syncing spinner and saved checkmark',
                    icon: CheckCircle2
                  },
                  {
                    key: 'showNotifications',
                    label: 'Notifications & Alerts Bell',
                    desc: 'Shop floor alerts with unread counter badge',
                    icon: Bell
                  },
                  {
                    key: 'showUserProfile',
                    label: 'User Profile & Tier Avatar',
                    desc: 'Direct access to role, tier permissions, and logout',
                    icon: User
                  },
                  {
                    key: 'showThemeToggle',
                    label: 'Dark / Light Theme Switcher',
                    desc: 'Instant 1-tap shift between dark and industrial light theme',
                    icon: Sun
                  },
                  {
                    key: 'showTeamChat',
                    label: 'Floor Team Chat Shortcut',
                    desc: 'Quick launch for operator chat & floor messaging',
                    icon: MessageSquare
                  },
                  {
                    key: 'showQuickSettings',
                    label: 'Quick Settings Gear',
                    desc: 'Direct shortcut to Control Center preferences',
                    icon: SlidersHorizontal
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  const isChecked = !!localConfig[item.key as keyof TopBarConfig];
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleUpdate(item.key as any, !isChecked)}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#176f78]/35 bg-white dark:bg-[#1f2630] shadow-2xs'
                          : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-[#176f78]/15 text-[#176f78] dark:text-teal-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold block truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-[#527078] dark:text-slate-400 block truncate">
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        aria-label={item.label}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          isChecked ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Accents & Ready-to-Use Presets */}
          {activeTab === 'accents' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200 block mb-2">
                  Top Bar Mobile UX Presets
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.config)}
                      className="p-3 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] hover:border-[#176f78] text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#17343a] dark:text-slate-100 group-hover:text-[#176f78] transition-colors">
                          {preset.name}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[#176f78]/10 text-[#176f78] dark:text-teal-300">
                          Apply
                        </span>
                      </div>
                      <p className="text-[10px] text-[#527078] dark:text-slate-400 leading-tight">
                        {preset.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Border */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1f2630] border border-[#d9d2c2] dark:border-[#2e3846] space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200 block">
                  Header Accent Trim Palette
                </label>
                <p className="text-[11px] text-[#527078] dark:text-slate-400">
                  Subtle color highlight for bottom border and status pills.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  {[
                    { id: 'brand', label: 'Debonair Teal', color: 'bg-[#176f78]' },
                    { id: 'slate', label: 'Industrial Slate', color: 'bg-slate-600' },
                    { id: 'emerald', label: 'Floor Emerald', color: 'bg-emerald-600' },
                    { id: 'amber', label: 'Attainment Amber', color: 'bg-amber-500' },
                    { id: 'indigo', label: 'Executive Indigo', color: 'bg-indigo-600' }
                  ].map((colorOpt) => (
                    <button
                      key={colorOpt.id}
                      type="button"
                      onClick={() => handleUpdate('accentTheme', colorOpt.id as TopBarAccentTheme)}
                      title={colorOpt.label}
                      className={`flex-1 py-1.5 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        localConfig.accentTheme === colorOpt.id
                          ? 'border-[#176f78] ring-2 ring-[#176f78]/30 shadow-xs font-bold'
                          : 'border-[#d9d2c2] dark:border-[#2e3846] hover:bg-[#f5f3ec]'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full ${colorOpt.color}`} />
                      <span className="text-[9px] truncate max-w-full px-1">{colorOpt.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#e7e1d5] dark:border-[#2e3846] bg-white dark:bg-[#1f2630] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] text-xs font-bold text-[#527078] dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer ${
                justSaved ? 'bg-emerald-600' : 'bg-[#176f78] hover:bg-[#145d65]'
              }`}
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apply &amp; Save</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
