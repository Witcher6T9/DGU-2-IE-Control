/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout,
  Layers,
  Sliders,
  Palette,
  Eye,
  Check,
  Copy,
  RotateCcw,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Download,
  Upload,
  Radio,
  Send,
  Lock,
  Grid,
  List,
  Type,
  Maximize2,
  Tv,
  Volume2
} from 'lucide-react';
import {
  AppPageLayoutConfig,
  LayoutPresetId,
  AppPageTabConfig,
  DashboardWidgetConfig,
  FloorGridColumns,
  NavBarStyle,
  UserProfile,
  LineEntry
} from '../../types';
import {
  getStoredAppPageLayout,
  saveStoredAppPageLayout,
  DEFAULT_APP_PAGE_LAYOUT,
  DEFAULT_APP_TABS,
  DEFAULT_DASHBOARD_WIDGETS,
  BUILT_IN_LAYOUT_PRESETS,
  STORAGE_KEY_CUSTOM_PRESETS
} from '../../utils/layoutManager';

interface LayoutCustomizerModuleProps {
  profile: UserProfile;
  lines?: LineEntry[];
  showToast: (m: string) => void;
  onNavigateToUpdatesPusher?: (layoutPayload?: Partial<AppPageLayoutConfig>) => void;
}

export const LayoutCustomizerModule: React.FC<LayoutCustomizerModuleProps> = ({
  profile,
  lines = [],
  showToast,
  onNavigateToUpdatesPusher
}) => {
  // Current editing layout config state
  const [layoutConfig, setLayoutConfig] = useState<AppPageLayoutConfig>(() => getStoredAppPageLayout());
  const [activeSubTab, setActiveSubTab] = useState<'navigation' | 'dashboard' | 'ergonomics' | 'presets' | 'preview'>('navigation');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('tablet');
  const [savedPresets, setSavedPresets] = useState<typeof BUILT_IN_LAYOUT_PRESETS>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
      if (raw) {
        const parsed = JSON.parse(raw);
        return [...BUILT_IN_LAYOUT_PRESETS, ...parsed];
      }
    } catch (e) {
      // fallback
    }
    return BUILT_IN_LAYOUT_PRESETS;
  });
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePresetInput, setShowSavePresetInput] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync state if external change happens
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) setLayoutConfig(e.detail);
    };
    window.addEventListener('debonair:layout_changed', handler);
    return () => window.removeEventListener('debonair:layout_changed', handler);
  }, []);

  const handleApplyLayout = (newConfig: AppPageLayoutConfig, notifyMsg = 'Layout configuration applied live!') => {
    setLayoutConfig(newConfig);
    saveStoredAppPageLayout(newConfig);
    showToast(notifyMsg);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all page layouts, widget matrices, and navigation order back to factory defaults?')) {
      handleApplyLayout(DEFAULT_APP_PAGE_LAYOUT, 'Layout reset to Debonair factory standard.');
    }
  };

  // Reordering helpers for tabs
  const handleMoveTab = (index: number, direction: 'up' | 'down') => {
    const newTabs = [...layoutConfig.tabs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTabs.length) return;

    const temp = newTabs[index];
    newTabs[index] = newTabs[targetIndex];
    newTabs[targetIndex] = temp;

    // re-assign orders
    const reordered = newTabs.map((t, i) => ({ ...t, order: i + 1 }));
    handleApplyLayout({ ...layoutConfig, tabs: reordered });
  };

  const handleToggleTabVisibility = (tabId: string) => {
    const updated = layoutConfig.tabs.map(t => {
      if (t.id === tabId) return { ...t, visible: !t.visible };
      return t;
    });
    handleApplyLayout({ ...layoutConfig, tabs: updated });
  };

  const handleUpdateTabLabel = (tabId: string, newLabel: string) => {
    const updated = layoutConfig.tabs.map(t => {
      if (t.id === tabId) return { ...t, label: newLabel };
      return t;
    });
    setLayoutConfig({ ...layoutConfig, tabs: updated });
  };

  const handleUpdateTabBadge = (tabId: string, newBadge: string) => {
    const updated = layoutConfig.tabs.map(t => {
      if (t.id === tabId) return { ...t, badge: newBadge };
      return t;
    });
    setLayoutConfig({ ...layoutConfig, tabs: updated });
  };

  // Reordering helpers for dashboard widgets
  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const widgets = layoutConfig.dashboardWidgets ? [...layoutConfig.dashboardWidgets] : [...DEFAULT_DASHBOARD_WIDGETS];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const temp = widgets[index];
    widgets[index] = widgets[targetIndex];
    widgets[targetIndex] = temp;

    const reordered = widgets.map((w, i) => ({ ...w, order: i + 1 }));
    handleApplyLayout({ ...layoutConfig, dashboardWidgets: reordered });
  };

  const handleToggleWidget = (widgetId: string) => {
    const widgets = layoutConfig.dashboardWidgets ? [...layoutConfig.dashboardWidgets] : [...DEFAULT_DASHBOARD_WIDGETS];
    const updatedWidgets = widgets.map(w => {
      if (w.id === widgetId) return { ...w, visible: !w.visible };
      return w;
    });

    // Also sync the legacy dashboard boolean map for backward compatibility
    const legacyKeyMap: Record<string, keyof typeof layoutConfig.dashboard> = {
      hero: 'showHero',
      stats: 'showStats',
      sparklines: 'showStats',
      quickReports: 'showQuickReports',
      quickActions: 'showQuickActions',
      absents: 'showAbsents',
      balancingGraph: 'showBalancingGraph',
      ioPacing: 'showIO',
      wipThresholds: 'showUpcoming'
    };

    const updatedDashboard = { ...layoutConfig.dashboard };
    const legacyKey = legacyKeyMap[widgetId];
    if (legacyKey) {
      const widget = updatedWidgets.find(w => w.id === widgetId);
      (updatedDashboard as any)[legacyKey] = widget ? widget.visible : true;
    }

    handleApplyLayout({
      ...layoutConfig,
      dashboard: updatedDashboard,
      dashboardWidgets: updatedWidgets
    });
  };

  // Presets handlers
  const handleLoadPreset = (preset: (typeof BUILT_IN_LAYOUT_PRESETS)[0]) => {
    const merged: AppPageLayoutConfig = {
      ...layoutConfig,
      ...preset.config,
      presetId: preset.id,
      presetName: preset.name
    };
    handleApplyLayout(merged, `Loaded "${preset.name}" preset!`);
  };

  const handleSaveCustomPreset = () => {
    if (!newPresetName.trim()) {
      showToast('Please enter a preset name');
      return;
    }
    const newPreset = {
      id: `custom-${Date.now()}` as LayoutPresetId,
      name: newPresetName.trim(),
      desc: `Custom user layout saved on ${new Date().toLocaleDateString()}`,
      config: { ...layoutConfig }
    };
    const customList = savedPresets.filter(p => !BUILT_IN_LAYOUT_PRESETS.some(bp => bp.id === p.id));
    const updatedCustom = [...customList, newPreset];
    localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(updatedCustom));
    setSavedPresets([...BUILT_IN_LAYOUT_PRESETS, ...updatedCustom]);
    setNewPresetName('');
    setShowSavePresetInput(false);
    showToast(`Preset "${newPreset.name}" saved!`);
  };

  const handleExportJson = () => {
    const json = JSON.stringify(layoutConfig, null, 2);
    navigator.clipboard.writeText(json);
    setCopiedKey('layout-json');
    showToast('Layout JSON copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleImportJson = () => {
    const input = prompt('Paste layout configuration JSON:');
    if (!input) return;
    try {
      const parsed = JSON.parse(input);
      if (parsed && parsed.tabs && parsed.dashboard) {
        handleApplyLayout({ ...layoutConfig, ...parsed }, 'Layout JSON imported and applied successfully!');
      } else {
        alert('Invalid layout JSON structure.');
      }
    } catch (e: any) {
      alert(`Invalid JSON format: ${e.message}`);
    }
  };

  const colorPalettes = [
    { name: 'Debonair Teal', hex: '#176f78', tag: 'Standard' },
    { name: 'Ocean Sky', hex: '#0284c7', tag: 'Cool' },
    { name: 'Emerald Clean', hex: '#10b981', tag: 'Compliance' },
    { name: 'High-Vis Amber', hex: '#f59e0b', tag: 'Shop Floor' },
    { name: 'Deep Indigo', hex: '#6366f1', tag: 'IE Work Study' },
    { name: 'Crimson Alert', hex: '#f43f5e', tag: 'Emergency' },
    { name: 'Royal Purple', hex: '#8b5cf6', tag: 'Executive' },
    { name: 'Industrial Slate', hex: '#475569', tag: 'Neutral' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              TIER_0 EXCLUSIVE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              LAYOUT ENGINE v2.4
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Layout className="w-5 h-5 text-purple-500" />
            <span>App Page Layout Customizer</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Configure primary navigation tabs, executive dashboard widget matrix, floor density, visual ergonomics, and push live blueprints across shop floor terminals.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer shadow-xs"
          >
            {copiedKey === 'layout-json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleImportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          {onNavigateToUpdatesPusher && (
            <button
              onClick={() => onNavigateToUpdatesPusher(layoutConfig)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-sm active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Push to Terminals</span>
            </button>
          )}
        </div>
      </div>

      {/* Target Role Tier Context Selector */}
      <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
              Active Scope: {layoutConfig.presetName || 'Custom Configuration'}
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400">
              Target Tier: <span className="font-semibold uppercase">{layoutConfig.targetTier || 'All Terminals'}</span> • Updated: {new Date(layoutConfig.lastUpdated).toLocaleTimeString()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {['all', 'tier_0', 'tier_1', 'tier_2', 'tier_3', 'tier_4'].map(tier => (
            <button
              key={tier}
              type="button"
              onClick={() => handleApplyLayout({ ...layoutConfig, targetTier: tier })}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-all cursor-pointer ${
                layoutConfig.targetTier === tier
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50'
              }`}
            >
              {tier === 'all' ? 'All Roles' : tier.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Nav Pill Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'navigation', label: 'Primary Pages & Navigation', icon: Layers, badge: `${layoutConfig.tabs.filter(t => t.visible).length} Active` },
          { id: 'dashboard', label: 'Dashboard Widget Matrix', icon: Layout, badge: `${layoutConfig.floorGridColumns} Cols` },
          { id: 'ergonomics', label: 'Visual Branding & Ergonomics', icon: Palette, badge: `${layoutConfig.fontScalePct}% Font` },
          { id: 'presets', label: 'Layout Presets Library', icon: Sparkles, badge: `${savedPresets.length} Templates` },
          { id: 'preview', label: 'Live Device Sandbox', icon: Eye, badge: 'Interactive' }
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
                  ? 'bg-purple-600 text-white shadow-xs'
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

      {/* SUB-VIEW 1: NAVIGATION & PRIMARY PAGES */}
      {activeSubTab === 'navigation' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Nav Presentation Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'bottom-cupertino' as NavBarStyle,
                title: 'iOS Cupertino Dock',
                desc: 'Bottom tactile navigation bar with squircle indicators and active pills.',
                icon: Smartphone
              },
              {
                id: 'floating-dock' as NavBarStyle,
                title: 'Floating Action Dock',
                desc: 'Centered compact floating island dock, optimal for floor tablets and scanners.',
                icon: Tablet
              },
              {
                id: 'top-header' as NavBarStyle,
                title: 'Desktop & Floor TV Bar',
                desc: 'Header-mounted horizontal links for wide overhead displays and office PCs.',
                icon: Tv
              },
              {
                id: 'kiosk-minimal' as NavBarStyle,
                title: 'Kiosk Minimalist Mode',
                desc: 'Hidden navigation with single-line lock; emergency unlock trigger on header.',
                icon: Lock
              }
            ].map(mode => {
              const Icon = mode.icon;
              const isSelected = layoutConfig.navBarStyle === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => handleApplyLayout({ ...layoutConfig, navBarStyle: mode.id })}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-purple-600' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{mode.title}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{mode.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Default Landing Tab Picker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Maximize2 className="w-4 h-4 text-purple-500" />
                <span>Default Landing Workspace on Launch</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The primary tab automatically activated when an operator launches the terminal or switches sessions.
              </p>
            </div>
            <select
              value={layoutConfig.defaultLandingTab}
              onChange={e => handleApplyLayout({ ...layoutConfig, defaultLandingTab: e.target.value })}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {layoutConfig.tabs.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.id})
                </option>
              ))}
            </select>
          </div>

          {/* Workspaces List & Drag Reorder */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Primary Workspaces &amp; Order
              </h3>
              <span className="text-[11px] text-slate-400">
                Use arrows to rearrange tab sequence on floor terminals
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {layoutConfig.tabs.map((tab, idx) => (
                <div
                  key={tab.id}
                  className={`p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors ${
                    tab.visible ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>

                    <input
                      type="checkbox"
                      checked={tab.visible}
                      onChange={() => handleToggleTabVisibility(tab.id)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                      title="Toggle tab visibility"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={tab.label}
                          onChange={e => handleUpdateTabLabel(tab.id, e.target.value)}
                          onBlur={() => handleApplyLayout(layoutConfig)}
                          className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-purple-500 outline-none px-1 py-0.5 rounded"
                          placeholder="Tab Label"
                        />
                        <span className="text-[10px] font-mono text-slate-400">({tab.id})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={tab.badge || ''}
                      onChange={e => handleUpdateTabBadge(tab.id, e.target.value)}
                      onBlur={() => handleApplyLayout(layoutConfig)}
                      placeholder="Badge"
                      className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-20 text-center border-0 outline-none focus:ring-1 focus:ring-purple-500"
                    />

                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveTab(idx, 'up')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === layoutConfig.tabs.length - 1}
                      onClick={() => handleMoveTab(idx, 'down')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: DASHBOARD WIDGET MATRIX */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Floor Grid Layout & Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-4 h-4 text-purple-500" />
                  <span>Floor Lines Grid Columns</span>
                </span>
                <span className="text-[11px] font-mono text-purple-600 font-bold">
                  {layoutConfig.floorGridColumns} COLUMNS
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Number of sewing line cards displayed per row on the active floor display.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(cols => (
                  <button
                    key={cols}
                    type="button"
                    onClick={() => handleApplyLayout({ ...layoutConfig, floorGridColumns: cols as FloorGridColumns })}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      layoutConfig.floorGridColumns === cols
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {cols} {cols === 1 ? 'Col' : 'Cols'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <List className="w-4 h-4 text-purple-500" />
                  <span>Floor Line Card Style</span>
                </span>
                <span className="text-[11px] font-mono text-purple-600 font-bold uppercase">
                  {layoutConfig.floorCardStyle}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Detailed tactical card presentation vs dense single-line table row.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'card', label: 'Tactical Card' },
                  { id: 'row', label: 'Compact Row' },
                  { id: 'compact-chip', label: 'Mini Chip' }
                ].map(style => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => handleApplyLayout({ ...layoutConfig, floorCardStyle: style.id as any })}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      layoutConfig.floorCardStyle === style.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dashboard Widget Reorder Matrix */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Executive Dashboard Widgets &amp; Section Sequence
              </h3>
              <span className="text-[11px] text-slate-400">
                Toggle and sequence components appearing on Home Dashboard
              </span>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {(layoutConfig.dashboardWidgets || DEFAULT_DASHBOARD_WIDGETS).map((widget, idx) => (
                <div
                  key={widget.id}
                  className={`p-3 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors ${
                    widget.visible ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-950/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>

                    <input
                      type="checkbox"
                      checked={widget.visible}
                      onChange={() => handleToggleWidget(widget.id)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                      title="Toggle widget visibility"
                    />

                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {widget.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        ID: {widget.id} • Span: {widget.columnSpan || 'full'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveWidget(idx, 'up')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (layoutConfig.dashboardWidgets || DEFAULT_DASHBOARD_WIDGETS).length - 1}
                      onClick={() => handleMoveWidget(idx, 'down')}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: VISUAL BRANDING & ERGONOMICS */}
      {activeSubTab === 'ergonomics' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Brand Accent Palette */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-500" />
                <span>Primary Brand Accent Color</span>
              </span>
              <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                {layoutConfig.brandColor}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colorPalettes.map(palette => (
                <button
                  key={palette.hex}
                  type="button"
                  onClick={() => handleApplyLayout({ ...layoutConfig, brandColor: palette.hex })}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    layoutConfig.brandColor.toLowerCase() === palette.hex.toLowerCase()
                      ? 'border-purple-500 ring-2 ring-purple-500/20 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-800/60 hover:bg-white'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: palette.hex }} />
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{palette.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{palette.hex}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Scale & Density */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Font Scaling */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-purple-500" />
                  <span>Industrial Font Scale</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-600">
                  {layoutConfig.fontScalePct}%
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Adjust typography size for operators viewing tablets with PPE gloves or from across the sewing aisle.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { pct: 90, label: 'Compact (90%)' },
                  { pct: 100, label: 'Standard (100%)' },
                  { pct: 115, label: 'Large (115%)' }
                ].map(scale => (
                  <button
                    key={scale.pct}
                    type="button"
                    onClick={() => handleApplyLayout({ ...layoutConfig, fontScalePct: scale.pct })}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      layoutConfig.fontScalePct === scale.pct
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Density */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-500" />
                  <span>UI Element Spacing</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-600 uppercase">
                  {layoutConfig.density}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Control padding, margins, and card elevations across all workspaces.
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'Dense Compact' },
                  { id: 'comfortable', label: 'Comfortable' },
                  { id: 'spacious', label: 'Spacious / TV' }
                ].map(den => (
                  <button
                    key={den.id}
                    type="button"
                    onClick={() => handleApplyLayout({ ...layoutConfig, density: den.id as any })}
                    className={`py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      layoutConfig.density === den.id
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {den.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Marquee Announcement Ticker */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-purple-500" />
                  <span>Shift Announcement Ticker Marquee</span>
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  Displays a live ticker banner across the top of all workstations.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={layoutConfig.showAnnouncementTicker}
                  onChange={e => handleApplyLayout({ ...layoutConfig, showAnnouncementTicker: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
              </label>
            </div>

            {layoutConfig.showAnnouncementTicker && (
              <div className="pt-2">
                <input
                  type="text"
                  value={layoutConfig.tickerText || ''}
                  onChange={e => setLayoutConfig({ ...layoutConfig, tickerText: e.target.value })}
                  onBlur={() => handleApplyLayout(layoutConfig)}
                  placeholder="e.g. Debonair LTD Unit-02 • 34 Active Sewing Lines • Standard Shift Running"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: PRESETS LIBRARY */}
      {activeSubTab === 'presets' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pre-Engineered Factory Layout Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch whole-app configurations instantly with tailored floor presets.
              </p>
            </div>
            <button
              onClick={() => setShowSavePresetInput(!showSavePresetInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Current as Preset</span>
            </button>
          </div>

          {showSavePresetInput && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2">
              <input
                type="text"
                value={newPresetName}
                onChange={e => setNewPresetName(e.target.value)}
                placeholder="Enter custom preset name (e.g. Padma Floor Shift A Kiosk)..."
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 outline-none"
              />
              <button
                onClick={handleSaveCustomPreset}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 cursor-pointer shadow-xs shrink-0"
              >
                Save Preset
              </button>
              <button
                onClick={() => setShowSavePresetInput(false)}
                className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedPresets.map(preset => {
              const isCurrent = layoutConfig.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{preset.name}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{preset.desc}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {preset.id}
                    </span>
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-purple-600 text-white opacity-80'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-purple-100'
                      }`}
                    >
                      {isCurrent ? 'Re-Apply' : 'Load Preset'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: LIVE DEVICE SANDBOX */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Interactive Live Viewport Preview
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'mobile', icon: Smartphone, label: 'Mobile (375px)' },
                { id: 'tablet', icon: Tablet, label: 'Tablet (768px)' },
                { id: 'desktop', icon: Monitor, label: 'Desktop / TV' }
              ].map(dev => {
                const Icon = dev.icon;
                const isSelected = previewDevice === dev.id;
                return (
                  <button
                    key={dev.id}
                    onClick={() => setPreviewDevice(dev.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{dev.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Simulated Device Frame */}
          <div className="p-6 rounded-3xl bg-slate-950 flex justify-center items-center overflow-x-auto min-h-[460px]">
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 transition-all duration-300 flex flex-col ${
                previewDevice === 'mobile'
                  ? 'w-[375px] h-[580px]'
                  : previewDevice === 'tablet'
                  ? 'w-[720px] h-[520px]'
                  : 'w-[960px] h-[480px]'
              }`}
            >
              {/* Marquee preview if enabled */}
              {layoutConfig.showAnnouncementTicker && (
                <div
                  className="px-3 py-1 text-[11px] font-bold text-white flex items-center justify-between shrink-0"
                  style={{ backgroundColor: layoutConfig.brandColor }}
                >
                  <span className="truncate">{layoutConfig.tickerText || 'Debonair Unit-02 Active'}</span>
                  <span className="text-[9px] opacity-80 uppercase font-mono">LIVE MARQUEE</span>
                </div>
              )}

              {/* Mock Header */}
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: layoutConfig.brandColor }}>
                    D
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">Debonair Unit-02</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-mono text-slate-500">34 Lines Online</span>
                </div>
              </div>

              {/* Mock Body with Configured Widgets */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100 dark:bg-slate-950">
                {(layoutConfig.dashboardWidgets || DEFAULT_DASHBOARD_WIDGETS)
                  .filter(w => w.visible)
                  .map(widget => (
                    <div
                      key={widget.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: layoutConfig.brandColor }} />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{widget.label}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {widget.columnSpan || 'Full Span'}
                      </span>
                    </div>
                  ))}

                {/* Mock Floor Cards Grid */}
                <div
                  className="grid gap-2 pt-2"
                  style={{
                    gridTemplateColumns: `repeat(${previewDevice === 'mobile' ? 1 : layoutConfig.floorGridColumns}, minmax(0, 1fr))`
                  }}
                >
                  {[1, 2, 3, 4].map(idx => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs ${
                        layoutConfig.floorCardStyle === 'row' ? 'flex items-center justify-between' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Line {String(idx).padStart(2, '0')}</span>
                        <span className="text-[10px] text-emerald-600 font-bold">85.4% Eff</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Target: 850 pcs</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock Navigation Bar */}
              <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around shrink-0">
                {layoutConfig.tabs.filter(t => t.visible).slice(0, 5).map(tab => (
                  <div key={tab.id} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold" style={{ color: tab.id === layoutConfig.defaultLandingTab ? layoutConfig.brandColor : undefined }}>
                      {tab.label}
                    </span>
                    {tab.id === layoutConfig.defaultLandingTab && (
                      <span className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: layoutConfig.brandColor }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
