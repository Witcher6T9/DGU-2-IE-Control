/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppPageLayoutConfig, LayoutPresetId, AppPageTabConfig, DashboardWidgetConfig } from '../types';
import { DEFAULT_DASHBOARD_LAYOUT } from '../mockData';

export const STORAGE_KEY_APP_LAYOUT = 'debonair_app_page_layout_v1';
export const STORAGE_KEY_CUSTOM_PRESETS = 'debonair_app_layout_custom_presets_v1';

export const DEFAULT_APP_TABS: AppPageTabConfig[] = [
  { id: 'overview', label: 'Dashboard', visible: true, order: 1, iconName: 'Activity' },
  { id: 'datas', label: 'Line Data', visible: true, order: 2, iconName: 'Layers', badge: '34 Lines' },
  { id: 'checklist', label: 'Check List', visible: true, order: 3, iconName: 'CheckSquare' },
  { id: 'lean-tools', label: 'Lean Tools', visible: true, order: 4, iconName: 'Wrench', badge: '13 Methods' },
  { id: 'simulator', label: 'IE Simulator', visible: true, order: 5, iconName: 'Sliders' },
  { id: 'floor-plan', label: 'Floor Plan', visible: true, order: 6, iconName: 'LayoutGrid' },
  { id: 'monthly', label: 'Monthly Summary', visible: true, order: 7, iconName: 'Calendar' },
  { id: 'reports', label: 'Shift Reports', visible: true, order: 8, iconName: 'FileSpreadsheet' },
  { id: 'line-history', label: 'Line History', visible: true, order: 9, iconName: 'TrendingUp' },
  { id: 'roles', label: 'IE Org & Roles', visible: true, order: 10, iconName: 'Network', allowedTiers: ['tier_0', 'tier_1'] },
  { id: 'settings', label: 'Settings & Control', visible: true, order: 11, iconName: 'Settings' }
];

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  { id: 'hero', label: 'Plant Hero Banner & Attainment Gauge', visible: true, order: 1, columnSpan: 'full' },
  { id: 'stats', label: '4-KPI Summary Strip (Output, Eff, MP, Variance)', visible: true, order: 2, columnSpan: 'full' },
  { id: 'sparklines', label: 'Floor Line Sparklines & DHU Metrics', visible: true, order: 3, columnSpan: 'full' },
  { id: 'quickReports', label: 'Quick Reports & Shift Insights Bar', visible: true, order: 4, columnSpan: 'full' },
  { id: 'quickActions', label: 'Top 5 Floor Meeting & Action Priorities', visible: true, order: 5, columnSpan: 'half' },
  { id: 'absents', label: 'Manpower Breakdown & Attendance Tracking', visible: true, order: 6, columnSpan: 'half' },
  { id: 'balancingGraph', label: 'Yamazumi Line Balancing Variance Chart', visible: true, order: 7, columnSpan: 'full' },
  { id: 'ioPacing', label: 'Hourly Input / Output Pacing Matrix', visible: true, order: 8, columnSpan: 'full' },
  { id: 'wipThresholds', label: 'WIP Buffer Warnings & Choke Alarms', visible: true, order: 9, columnSpan: 'half' },
  { id: 'offlineSync', label: 'Offline Sync & Cache Health Sentinel', visible: true, order: 10, columnSpan: 'half' }
];

export const DEFAULT_APP_PAGE_LAYOUT: AppPageLayoutConfig = {
  version: '2.4.0',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Tier_0 System Admin',
  presetId: 'debonair-floor-default',
  presetName: 'Debonair RMG Floor Standard (Unit-02)',
  targetTier: 'all',
  defaultLandingTab: 'overview',
  navBarStyle: 'bottom-cupertino',
  tabs: DEFAULT_APP_TABS,
  dashboard: DEFAULT_DASHBOARD_LAYOUT,
  dashboardWidgets: DEFAULT_DASHBOARD_WIDGETS,
  floorGridColumns: 2,
  floorCardStyle: 'card',
  brandColor: '#176f78',
  fontScalePct: 100,
  density: 'comfortable',
  showAnnouncementTicker: true,
  tickerText: 'Debonair LTD Unit-02 • 34 Active Sewing Lines • Standard Shift Running',
  highContrastMode: false,
  kioskLockEnabled: false,
  kioskAllowedLine: ''
};

export const BUILT_IN_LAYOUT_PRESETS: { id: LayoutPresetId; name: string; desc: string; config: Partial<AppPageLayoutConfig> }[] = [
  {
    id: 'debonair-floor-default',
    name: 'Debonair RMG Floor Standard (Unit-02)',
    desc: 'Ergonomic 2-column card view, Cupertino navigation, and balanced 34-line floor telemetry.',
    config: {
      ...DEFAULT_APP_PAGE_LAYOUT,
      presetId: 'debonair-floor-default',
      presetName: 'Debonair RMG Floor Standard (Unit-02)'
    }
  },
  {
    id: 'executive-attainment',
    name: 'Executive Attainment & Overhead TV Display',
    desc: '4-column ultra-wide card grid, top navigation bar, high-visibility KPIs, and bold attainment gauges for shop floor monitors.',
    config: {
      ...DEFAULT_APP_PAGE_LAYOUT,
      presetId: 'executive-attainment',
      presetName: 'Executive Attainment & Overhead TV Display',
      navBarStyle: 'top-header',
      floorGridColumns: 4,
      floorCardStyle: 'card',
      brandColor: '#0284c7',
      fontScalePct: 115,
      density: 'spacious',
      highContrastMode: true,
      showAnnouncementTicker: true,
      tickerText: '★ EXECUTIVE DISPATCH: Plant Target 85.0% Eff • Shift Attainment On Track'
    }
  },
  {
    id: 'operator-tablet-kiosk',
    name: 'Frontline Tablet Operator Kiosk',
    desc: 'High-contrast amber theme, 115% tactile button scaling, floating action dock, and simplified navigation for tablet operators.',
    config: {
      ...DEFAULT_APP_PAGE_LAYOUT,
      presetId: 'operator-tablet-kiosk',
      presetName: 'Frontline Tablet Operator Kiosk',
      navBarStyle: 'floating-dock',
      floorGridColumns: 1,
      floorCardStyle: 'card',
      brandColor: '#f59e0b',
      fontScalePct: 115,
      density: 'compact',
      kioskLockEnabled: false,
      showAnnouncementTicker: false,
      tabs: DEFAULT_APP_TABS.map(t => ({
        ...t,
        visible: ['overview', 'datas', 'checklist', 'lean-tools', 'settings'].includes(t.id)
      }))
    }
  },
  {
    id: 'ie-engineering-focus',
    name: 'IE Balancing & Work Study Cockpit',
    desc: 'Deep indigo theme, compact row lists, prioritized Yamazumi balancing, takt time simulators, and hourly pacing matrices.',
    config: {
      ...DEFAULT_APP_PAGE_LAYOUT,
      presetId: 'ie-engineering-focus',
      presetName: 'IE Balancing & Work Study Cockpit',
      navBarStyle: 'bottom-cupertino',
      floorGridColumns: 3,
      floorCardStyle: 'row',
      brandColor: '#6366f1',
      fontScalePct: 100,
      density: 'compact',
      showAnnouncementTicker: true,
      tickerText: 'IE STUDY ACTIVE: Balancing variance target < 5% • Pitch Takt Time: 36.4s'
    }
  },
  {
    id: 'auditor-minimalist',
    name: 'Auditor & Compliance Sandbox',
    desc: 'Clean emerald theme, read-only 12-point checklists, 5S centerline scorecards, and exportable shift audit summaries.',
    config: {
      ...DEFAULT_APP_PAGE_LAYOUT,
      presetId: 'auditor-minimalist',
      presetName: 'Auditor & Compliance Sandbox',
      navBarStyle: 'bottom-cupertino',
      floorGridColumns: 2,
      floorCardStyle: 'card',
      brandColor: '#10b981',
      fontScalePct: 100,
      density: 'comfortable',
      showAnnouncementTicker: true,
      tickerText: 'EXTERNAL AUDIT SANDBOX: Debonair Unit-02 Compliance Mode'
    }
  }
];

export function getStoredAppPageLayout(): AppPageLayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APP_LAYOUT);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_APP_PAGE_LAYOUT,
        ...parsed,
        dashboard: {
          ...DEFAULT_DASHBOARD_LAYOUT,
          ...(parsed.dashboard || {})
        },
        tabs: parsed.tabs && parsed.tabs.length > 0 ? parsed.tabs : DEFAULT_APP_TABS,
        dashboardWidgets: parsed.dashboardWidgets && parsed.dashboardWidgets.length > 0 ? parsed.dashboardWidgets : DEFAULT_DASHBOARD_WIDGETS
      };
    }
  } catch (e) {
    console.warn('Failed to parse stored layout config:', e);
  }
  return DEFAULT_APP_PAGE_LAYOUT;
}

export function saveStoredAppPageLayout(config: AppPageLayoutConfig): void {
  try {
    const payload = {
      ...config,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_APP_LAYOUT, JSON.stringify(payload));
    applyLayoutStyling(payload);
    window.dispatchEvent(new CustomEvent('debonair:layout_changed', { detail: payload }));
  } catch (e) {
    console.error('Failed to save layout config:', e);
  }
}

export function applyLayoutStyling(config: AppPageLayoutConfig): void {
  try {
    const root = document.documentElement;
    if (config.brandColor) {
      root.style.setProperty('--brand-accent-color', config.brandColor);
    }
    if (config.fontScalePct) {
      root.style.setProperty('--app-font-scale', `${config.fontScalePct}%`);
    }
    if (config.density) {
      root.setAttribute('data-layout-density', config.density);
    }
    if (config.highContrastMode) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
  } catch (e) {
    console.warn('Failed to apply layout styling:', e);
  }
}

export function resetToDefaultLayout(): AppPageLayoutConfig {
  saveStoredAppPageLayout(DEFAULT_APP_PAGE_LAYOUT);
  return DEFAULT_APP_PAGE_LAYOUT;
}
