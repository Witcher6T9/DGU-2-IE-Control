/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair Industrial IE Control Center — UI/UX Component Visualizer & Design System Showcase
 */

import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sliders,
  Contrast,
  Hash,
  Vibrate,
  Zap,
  Eye,
  Sparkles,
  Smartphone,
  Check,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Bell,
  RefreshCw,
  Play,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Search,
  X,
  SlidersHorizontal,
  Activity,
  Clock,
  ShieldCheck,
  Award,
  TrendingUp,
  TrendingDown,
  Copy,
  CheckCheck,
  Sun,
  Maximize2,
  Minimize2,
  LayoutGrid,
  Layers,
  Sparkle
} from 'lucide-react';
import {
  ThemeType,
  FontFamilyStyle,
  CardRadiusMode,
  SurfaceStyleMode,
  ClickPhysicsMode,
  FontWeightMode,
  LayoutDensity,
  WorkspaceWidthMode
} from '../types';
import { triggerHaptic } from '../utils/haptics';

interface UiUxComponentVisualizerProps {
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  fontFamily: FontFamilyStyle;
  onSelectFontFamily: (font: FontFamilyStyle) => void;
  fontScale: number;
  onSelectFontScale: (scale: number) => void;
  brandAccent: string;
  onSelectBrandAccent: (accent: string) => void;
  cardRadius: CardRadiusMode;
  onSelectCardRadius: (radius: CardRadiusMode) => void;
  surfaceStyle: SurfaceStyleMode;
  onSelectSurfaceStyle: (surface: SurfaceStyleMode) => void;
  clickPhysics: ClickPhysicsMode;
  onSelectClickPhysics: (physics: ClickPhysicsMode) => void;
  hapticFeedback: boolean;
  onToggleHaptics: () => void;
  tabularNumerals: boolean;
  onToggleTabularNumerals: () => void;
  fontWeightMode: FontWeightMode;
  onSelectFontWeightMode: (mode: FontWeightMode) => void;
  scannerFocusRing: boolean;
  onToggleScannerFocus: () => void;
  liveAlertPulses: boolean;
  onToggleLiveAlertPulses: () => void;
  density: LayoutDensity;
  onSelectDensity: (density: LayoutDensity) => void;
  workspaceWidth: WorkspaceWidthMode;
  onSelectWorkspaceWidth: (width: WorkspaceWidthMode) => void;
  onBackToOverview?: () => void;
}

type VisualizerCategory =
  | 'overview'
  | 'buttons'
  | 'badges'
  | 'kpis'
  | 'inputs'
  | 'toggles'
  | 'tables'
  | 'alerts'
  | 'typography'
  | 'themes';

export const UiUxComponentVisualizer: React.FC<UiUxComponentVisualizerProps> = ({
  currentTheme,
  onSelectTheme,
  fontFamily,
  onSelectFontFamily,
  fontScale,
  onSelectFontScale,
  brandAccent,
  onSelectBrandAccent,
  cardRadius,
  onSelectCardRadius,
  surfaceStyle,
  onSelectSurfaceStyle,
  clickPhysics,
  onSelectClickPhysics,
  hapticFeedback,
  onToggleHaptics,
  tabularNumerals,
  onToggleTabularNumerals,
  fontWeightMode,
  onSelectFontWeightMode,
  scannerFocusRing,
  onToggleScannerFocus,
  liveAlertPulses,
  onToggleLiveAlertPulses,
  density,
  onSelectDensity,
  workspaceWidth,
  onSelectWorkspaceWidth,
  onBackToOverview
}) => {
  const [activeCategory, setActiveCategory] = useState<VisualizerCategory>('overview');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Interactive playground state
  const [btnCounter, setBtnCounter] = useState(1450);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [inputTextDemo, setInputTextDemo] = useState('Line 18 - Polo Shirt Front Placket');
  const [sliderVal, setSliderVal] = useState(88);
  const [stepperVal, setStepperVal] = useState(42);
  const [toggleDemo1, setToggleDemo1] = useState(true);
  const [toggleDemo2, setToggleDemo2] = useState(false);
  const [customTypoText, setCustomTypoText] = useState(
    'DEBONAIR UNIT-02: Target 1,450 pcs • Actual 1,380 pcs • Attainment 95.2% • SMV: 24.50s'
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    item1: true,
    item2: true,
    item3: false,
    item4: true
  });
  const [segmentedChoice, setSegmentedChoice] = useState<'hourly' | 'daily' | 'weekly'>('hourly');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('Floor Notification: Line 18 Attainment Exceeded Target!');

  const handleCopyCode = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedToken(text);
      triggerHaptic('success');
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {}
  };

  const handleSimulateLoading = () => {
    setIsLoadingDemo(true);
    triggerHaptic('light');
    setTimeout(() => {
      setIsLoadingDemo(false);
      triggerHaptic('success');
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 3500);
    }, 1200);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
    triggerHaptic('selection');
  };

  const categories: { id: VisualizerCategory; label: string; count: number; icon: any }[] = [
    { id: 'overview', label: 'All Components Showcase', count: 48, icon: LayoutGrid },
    { id: 'typography', label: 'Font Studio & Scaling', count: 5, icon: Type },
    { id: 'themes', label: 'Theme Tokens & Palette', count: 7, icon: Palette },
    { id: 'buttons', label: 'Buttons & Actions', count: 8, icon: Play },
    { id: 'badges', label: 'Badges & Status Sentinels', count: 12, icon: Sparkles },
    { id: 'kpis', label: 'KPI Cards & Gauges', count: 6, icon: Activity },
    { id: 'inputs', label: 'Inputs & Form Controls', count: 7, icon: Search },
    { id: 'toggles', label: 'Switches & Checklists', count: 6, icon: SlidersHorizontal },
    { id: 'tables', label: 'Data Tables & Tabular', count: 4, icon: Hash },
    { id: 'alerts', label: 'Alerts, Banners & Toasts', count: 5, icon: Bell }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {onBackToOverview && (
              <button
                type="button"
                onClick={onBackToOverview}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#d9d2c2] dark:border-[#2e3846] text-xs font-semibold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-colors cursor-pointer mr-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#176f78]/10 text-[#176f78] dark:text-teal-300 border border-[#176f78]/25">
              Interactive Design System Visualizer
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              48 Live Components
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#17343a] dark:text-slate-100 flex items-center gap-2.5">
            <Sparkle className="w-6 h-6 text-[#176f78] dark:text-teal-400" />
            <span>UI, UX &amp; Typography Component Visualizer</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#527078] dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Live interactive laboratory demonstrating all atomic controls, industrial telemetry gauges, typography scales, tactile feedback, and theme tokens across the Debonair Industrial IE Control Center.
          </p>
        </div>

        {/* Live Active Profile Pill */}
        <div className="flex flex-wrap md:flex-col items-end gap-1.5 shrink-0 text-right">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#17343a] dark:text-slate-200">
              {currentTheme.toUpperCase()} • {fontFamily.toUpperCase()}
            </span>
            <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: brandAccent }} />
          </div>
          <div className="text-[11px] text-[#527078] dark:text-slate-400 font-mono">
            Scale: <span className="font-bold text-[#176f78] dark:text-teal-300">{fontScale}%</span> | Radius: <span className="font-bold">{cardRadius}</span> | Density: <span className="font-bold">{density}</span>
          </div>
        </div>
      </div>

      {/* 2. REAL-TIME INTERACTIVE CUSTOMIZER DOCK */}
      <div className="p-4 rounded-2xl border border-[#176f78]/25 dark:border-teal-500/25 bg-[#176f78]/5 dark:bg-teal-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
            <h2 className="text-xs font-bold text-[#17343a] dark:text-slate-100 uppercase tracking-wider">
              Live Customizer Dock (Changes Apply Dynamically Across All Components Below)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            Real-time DOM attribute updates
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Quick Theme Selector */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Theme (7)</label>
            <select
              value={currentTheme}
              onChange={(e) => {
                onSelectTheme(e.target.value as ThemeType);
                triggerHaptic('selection');
              }}
              className="w-full text-xs font-semibold bg-transparent text-[#17343a] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="light">Daylight Cockpit</option>
              <option value="dark">Night Shift Dark</option>
              <option value="industrial">Steel & Charcoal</option>
              <option value="forest">Emerald Kaizen</option>
              <option value="sunset">Foundry Amber</option>
              <option value="nordic">Nordic Glacier</option>
              <option value="oled">True Black OLED</option>
            </select>
          </div>

          {/* Quick Font Selector */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Typeface (5)</label>
            <select
              value={fontFamily}
              onChange={(e) => {
                onSelectFontFamily(e.target.value as FontFamilyStyle);
                triggerHaptic('selection');
              }}
              className="w-full text-xs font-semibold bg-transparent text-[#17343a] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="sans">Inter Dynamic Sans</option>
              <option value="mono">JetBrains Mono</option>
              <option value="dyslexic">Factory ClearView</option>
              <option value="grotesk">Space Grotesk</option>
              <option value="serif">Editorial Serif</option>
            </select>
          </div>

          {/* Font Scale Stepper */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col justify-between">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Scale ({fontScale}%)
            </label>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => onSelectFontScale(Math.max(85, fontScale - 5))}
                disabled={fontScale <= 85}
                className="w-6 h-6 rounded-md bg-[#f1eee6] dark:bg-[#28323f] flex items-center justify-center font-mono font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                -
              </button>
              <span className="text-xs font-mono font-bold text-[#176f78] dark:text-teal-300">{fontScale}%</span>
              <button
                type="button"
                onClick={() => onSelectFontScale(Math.min(115, fontScale + 5))}
                disabled={fontScale >= 115}
                className="w-6 h-6 rounded-md bg-[#f1eee6] dark:bg-[#28323f] flex items-center justify-center font-mono font-bold text-xs disabled:opacity-40 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Corner Radius */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Corner Radius</label>
            <select
              value={cardRadius}
              onChange={(e) => {
                onSelectCardRadius(e.target.value as CardRadiusMode);
                triggerHaptic('selection');
              }}
              className="w-full text-xs font-semibold bg-transparent text-[#17343a] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="sharp">Sharp (6px)</option>
              <option value="modern">Modern (12px)</option>
              <option value="squircle">Squircle (16px)</option>
              <option value="soft">Pillowed (24px)</option>
            </select>
          </div>

          {/* Surface Finish */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Surface Finish</label>
            <select
              value={surfaceStyle}
              onChange={(e) => {
                onSelectSurfaceStyle(e.target.value as SurfaceStyleMode);
                triggerHaptic('selection');
              }}
              className="w-full text-xs font-semibold bg-transparent text-[#17343a] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="opaque">Solid Opaque</option>
              <option value="glass">Frosted Glass</option>
              <option value="high-contrast">2px Outlines</option>
            </select>
          </div>

          {/* Density Mode */}
          <div className="p-2.5 rounded-xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Floor Density</label>
            <select
              value={density}
              onChange={(e) => {
                onSelectDensity(e.target.value as LayoutDensity);
                triggerHaptic('selection');
              }}
              className="w-full text-xs font-semibold bg-transparent text-[#17343a] dark:text-slate-100 focus:outline-hidden cursor-pointer"
            >
              <option value="compact">Compact (Tight)</option>
              <option value="comfortable">Comfortable (44px)</option>
              <option value="spacious">Spacious (TV)</option>
            </select>
          </div>
        </div>

        {/* Toggles Strip */}
        <div className="pt-2 border-t border-[#176f78]/15 dark:border-teal-500/15 flex flex-wrap items-center gap-3 text-xs">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={tabularNumerals}
              onChange={onToggleTabularNumerals}
              className="accent-[#176f78] rounded"
            />
            <span className="font-semibold text-[#17343a] dark:text-slate-200">Tabular Numbers (TNUM)</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={fontWeightMode === 'crisp-contrast'}
              onChange={() => onSelectFontWeightMode(fontWeightMode === 'crisp-contrast' ? 'regular' : 'crisp-contrast')}
              className="accent-[#176f78] rounded"
            />
            <span className="font-semibold text-[#17343a] dark:text-slate-200">High-Glare Crisp Weight</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={scannerFocusRing}
              onChange={onToggleScannerFocus}
              className="accent-emerald-600 rounded"
            />
            <span className="font-semibold text-[#17343a] dark:text-slate-200">Barcode Scanner Focus Ring</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={liveAlertPulses}
              onChange={onToggleLiveAlertPulses}
              className="accent-amber-500 rounded"
            />
            <span className="font-semibold text-[#17343a] dark:text-slate-200">Live Pulse Sentinels</span>
          </label>

          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={hapticFeedback}
              onChange={onToggleHaptics}
              className="accent-[#176f78] rounded"
            />
            <span className="font-semibold text-[#17343a] dark:text-slate-200">Haptics Engine</span>
          </label>

          {/* Quick Accent Dot Pickers */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Accent:</span>
            {[
              { hex: '#176f78', name: 'Teal' },
              { hex: '#1e40af', name: 'Royal' },
              { hex: '#059669', name: 'Emerald' },
              { hex: '#d97706', name: 'Amber' },
              { hex: '#dc2626', name: 'Crimson' },
              { hex: '#0891b2', name: 'Cyan' },
              { hex: '#7c3aed', name: 'Amethyst' }
            ].map((col) => (
              <button
                key={col.hex}
                type="button"
                onClick={() => {
                  onSelectBrandAccent(col.hex);
                  triggerHaptic('selection');
                }}
                title={col.name}
                style={{ backgroundColor: col.hex }}
                className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                  brandAccent.toLowerCase() === col.hex.toLowerCase()
                    ? 'ring-2 ring-black/40 dark:ring-white/40 scale-125'
                    : 'border-black/20 hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. CATEGORY NAVIGATION TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-[#e7e1d5] dark:border-[#2e3846]">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                triggerHaptic('selection');
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
                isActive
                  ? 'bg-[#176f78] text-white shadow-xs'
                  : 'bg-white dark:bg-[#181d24] text-slate-600 dark:text-slate-300 border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. COMPONENT SHOWCASE PANELS */}

      {/* CATEGORY: OVERVIEW OR SPECIFIC SECTION */}

      {/* SECTION 1: BUTTONS & ACTION CONTROLS */}
      {(activeCategory === 'overview' || activeCategory === 'buttons') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Play className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>1. Buttons &amp; Interactive Action Controls</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Engineered with 44px min touch targets, active spring physics, loading animations, and tactile haptic clicks.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">8 Button Variants</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Primary Action Button */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Primary Industrial Action</span>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setBtnCounter(c => c + 1);
                    triggerHaptic('light');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#176f78] hover:bg-[#135a62] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-97 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Shift (pcs: {btnCounter})</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Teal brand background with 97% touch scale physics.</p>
            </div>

            {/* Secondary Outline Button */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Secondary Outline</span>
              <div>
                <button
                  type="button"
                  onClick={() => triggerHaptic('selection')}
                  className="w-full py-2.5 px-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] hover:bg-[#f1eee6] dark:hover:bg-[#202732] text-[#17343a] dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-97 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-slate-500" />
                  <span>Sync Line Telemetry</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Subtle border with neutral elevation background.</p>
            </div>

            {/* High-Alert Destructive Button */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-500">Destructive Emergency Action</span>
              <div>
                <button
                  type="button"
                  onClick={() => triggerHaptic('warning')}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-97 cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Trigger Line Stop Alert</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">High-visibility crimson alert with warning haptics.</p>
            </div>

            {/* Async Loading Simulator Button */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Async Spinner State</span>
              <div>
                <button
                  type="button"
                  onClick={handleSimulateLoading}
                  disabled={isLoadingDemo}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-97 cursor-pointer"
                >
                  {isLoadingDemo ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating Report...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Generate Shift Report</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Click to preview animated spinner &amp; toast completion.</p>
            </div>
          </div>

          {/* Squircle Icon Buttons & Segmented Buttons */}
          <div className="pt-3 border-t border-[#e7e1d5] dark:border-[#2e3846] grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-2">Squircle Icon Buttons (Sm, Md, Lg)</span>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[8px] bg-[#176f78] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="w-10 h-10 rounded-[10px] bg-[#059669] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="w-12 h-12 rounded-[13px] bg-[#d97706] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
                  <Award className="w-6 h-6" />
                </div>
                <div className="w-10 h-10 rounded-[10px] bg-[#dc2626] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="w-8 h-8 rounded-[8px] bg-[#7c3aed] text-white flex items-center justify-center shadow-xs cursor-pointer hover:opacity-90">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-2">Segmented Time Pacing Controls</span>
              <div className="p-1 rounded-xl bg-[#f1eee6] dark:bg-[#12161c] border border-[#d9d2c2] dark:border-[#2e3846] flex items-center">
                {(['hourly', 'daily', 'weekly'] as const).map((seg) => (
                  <button
                    key={seg}
                    type="button"
                    onClick={() => {
                      setSegmentedChoice(seg);
                      triggerHaptic('selection');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      segmentedChoice === seg
                        ? 'bg-white dark:bg-[#202732] text-[#17343a] dark:text-slate-100 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {seg}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BADGES & STATUS SENTINELS */}
      {(activeCategory === 'overview' || activeCategory === 'badges') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>2. Badges, Chips &amp; Live Status Sentinels</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Breathing pulse indicators, operational attainment chips, and industrial role tags.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">12 Status Styles</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Live Sentinel 1: Running Green */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase">Line Active</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 ${liveAlertPulses ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-200">Running 98.4%</span>
              </div>
            </div>

            {/* Live Sentinel 2: Bottleneck Amber */}
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold uppercase">WIP Warning</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-amber-500 ${liveAlertPulses ? 'animate-ping' : ''}`} />
                <span className="text-xs font-bold text-amber-800 dark:text-amber-200">Takt +2.4s</span>
              </div>
            </div>

            {/* Live Sentinel 3: Stoppage Red */}
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-rose-700 dark:text-rose-400 font-bold uppercase">Emergency</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-rose-500 ${liveAlertPulses ? 'animate-bounce' : ''}`} />
                <span className="text-xs font-bold text-rose-800 dark:text-rose-200">Line 04 Down</span>
              </div>
            </div>

            {/* Live Sentinel 4: Blue Sync */}
            <div className="p-3 rounded-xl border border-sky-500/20 bg-sky-500/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-sky-700 dark:text-sky-400 font-bold uppercase">Telemetry</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-sky-500 ${liveAlertPulses ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-bold text-sky-800 dark:text-sky-200">Auto-Refreshed</span>
              </div>
            </div>

            {/* RBAC Tier 0 Badge */}
            <div className="p-3 rounded-xl border border-teal-500/20 bg-[#176f78]/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-[#176f78] dark:text-teal-300 font-bold uppercase">Clearance</span>
              <div className="mt-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#176f78] text-white">
                  TIER_0: ROOT
                </span>
              </div>
            </div>

            {/* Floor Tag Chip */}
            <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-purple-700 dark:text-purple-400 font-bold uppercase">Facility Floor</span>
              <div className="mt-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                  2nd Floor • Wing B
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: KPI CARDS & OPERATIONAL METRICS */}
      {(activeCategory === 'overview' || activeCategory === 'kpis') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>3. Industrial KPI Cards &amp; Metric Telemetry</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Real-time line productivity, OEE ratios, hourly pacing, and inline sparkline visualizations.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Production Dashboard Units</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* KPI Card 1: Line Efficiency */}
            <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">Line 18 Efficiency</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  Target: 85%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black font-mono text-[#17343a] dark:text-slate-100">
                  88.5<span className="text-lg text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+3.5% vs Prev Shift</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '88.5%' }} />
              </div>

              {/* Mini Sparkline Simulation */}
              <div className="flex items-end justify-between h-8 gap-1 pt-1">
                {[65, 72, 70, 81, 84, 88, 86, 89, 91, 88].map((val, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${val}%` }}
                    className="w-full bg-[#176f78] dark:bg-teal-500 rounded-t-xs opacity-80 hover:opacity-100 transition-opacity"
                    title={`Hour ${idx + 1}: ${val}%`}
                  />
                ))}
              </div>
            </div>

            {/* KPI Card 2: Hourly Pacing & Attainment */}
            <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">Hourly Output Pacing</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                  Shift Hour 06/08
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black font-mono text-[#17343a] dark:text-slate-100">
                  1,380 <span className="text-sm font-normal text-slate-500">/ 1,450 pcs</span>
                </div>
                <div className="text-xs font-bold text-[#176f78] dark:text-teal-300 font-mono">
                  95.2% Attained
                </div>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div className="h-full bg-[#176f78] rounded-full" style={{ width: '95.2%' }} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">SMV</div>
                  <div className="text-xs font-bold font-mono text-[#17343a] dark:text-slate-200">24.50s</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">TAKT</div>
                  <div className="text-xs font-bold font-mono text-[#17343a] dark:text-slate-200">36.40s</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-mono">OPERATORS</div>
                  <div className="text-xs font-bold font-mono text-[#17343a] dark:text-slate-200">54 M/P</div>
                </div>
              </div>
            </div>

            {/* KPI Card 3: Overall OEE Score */}
            <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">Total Plant OEE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  World Class: 85%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-black font-mono text-[#17343a] dark:text-slate-100">
                  87.4<span className="text-lg text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                  <span>WCM Gold Standard</span>
                </div>
              </div>

              {/* 3 Pillar Micro Meters */}
              <div className="space-y-1.5 pt-1">
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                    <span>Availability (A)</span>
                    <span className="font-bold text-emerald-600">94.8%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94.8%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                    <span>Performance (P)</span>
                    <span className="font-bold text-sky-600">92.6%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-sky-500 rounded-full" style={{ width: '92.6%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 mb-0.5">
                    <span>Quality Yield (Q)</span>
                    <span className="font-bold text-purple-600">99.4%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '99.4%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: FORM INPUTS, SEARCH & SCANNER CONTROLS */}
      {(activeCategory === 'overview' || activeCategory === 'inputs') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>4. Form Inputs, Barcode Scanners &amp; Controls</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Frontline inputs with stylus-friendly touch clearing, numeric steppers, and range sliders.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">7 Input Components</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Input 1: Barcode Scanner Focus Field */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Scanner Focused Input</span>
              <div className="relative">
                <input
                  type="text"
                  value={inputTextDemo}
                  onChange={(e) => setInputTextDemo(e.target.value)}
                  className={`w-full px-3 py-2 pr-8 rounded-xl border text-xs font-semibold bg-white dark:bg-[#181d24] text-[#17343a] dark:text-slate-100 focus:outline-hidden transition-all ${
                    scannerFocusRing
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'border-[#d9d2c2] dark:border-[#2e3846] focus:border-[#176f78]'
                  }`}
                  placeholder="Scan bundle barcode..."
                />
                {inputTextDemo && (
                  <button
                    type="button"
                    onClick={() => {
                      setInputTextDemo('');
                      triggerHaptic('light');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-slate-400">High-visibility emerald ring for warehouse scanners.</p>
            </div>

            {/* Input 2: Numeric Stepper */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Tactile Stepper (+ / -)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStepperVal(v => Math.max(0, v - 1));
                    triggerHaptic('light');
                  }}
                  className="w-10 h-10 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] text-base font-bold flex items-center justify-center cursor-pointer active:scale-95"
                >
                  -
                </button>
                <div className="flex-1 text-center py-2 px-3 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] font-mono font-bold text-sm text-[#17343a] dark:text-slate-100">
                  {stepperVal} Stations
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStepperVal(v => v + 1);
                    triggerHaptic('light');
                  }}
                  className="w-10 h-10 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] text-base font-bold flex items-center justify-center cursor-pointer active:scale-95"
                >
                  +
                </button>
              </div>
              <p className="text-[10px] text-slate-400">Quick increments for line layout balancing.</p>
            </div>

            {/* Input 3: Interactive Slider */}
            <div className="p-3.5 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-slate-500">Efficiency Threshold</span>
                <span className="text-xs font-mono font-bold text-[#176f78] dark:text-teal-300">{sliderVal}%</span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={sliderVal}
                onChange={(e) => setSliderVal(parseInt(e.target.value, 10))}
                className="w-full accent-[#176f78] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>50% Min</span>
                <span>85% Benchmark</span>
                <span>100% Max</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: SWITCHES, RADIOS & CHECKLISTS */}
      {(activeCategory === 'overview' || activeCategory === 'toggles') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>5. Switches, iOS Toggles &amp; Daily Checklists</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Physical state toggles, audit verification rows, and strike-through checklist states.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">6 Interactive Controls</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* iOS Industrial Toggles */}
            <div className="p-4 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-3">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block">Industrial iOS Toggles</span>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#181d24] border border-[#e7e1d5] dark:border-[#2e3846]">
                <div>
                  <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Automatic Shift Backup</div>
                  <div className="text-[10px] text-slate-400">Upload encrypted SQLite snapshot at 17:00</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToggleDemo1(!toggleDemo1);
                    triggerHaptic('selection');
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    toggleDemo1 ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      toggleDemo1 ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#181d24] border border-[#e7e1d5] dark:border-[#2e3846]">
                <div>
                  <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">Auditory Bottleneck Chimes</div>
                  <div className="text-[10px] text-slate-400">Play factory chime when WIP variance exceeds 5%</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setToggleDemo2(!toggleDemo2);
                    triggerHaptic('selection');
                  }}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    toggleDemo2 ? 'bg-[#176f78]' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      toggleDemo2 ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Checklist Verification Items */}
            <div className="p-4 rounded-xl border border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] space-y-2">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-500 block mb-1">
                13-Point Checklist Interactive Taps
              </span>

              {[
                { id: 'item1', text: 'Line Layout Verified with SMV & Machine Pitch' },
                { id: 'item2', text: '5S Cleaning & Needle Guards in Place' },
                { id: 'item3', text: 'Critical Quality Mockup Sample Signed by Quality Lead' },
                { id: 'item4', text: 'Hour 1 Output Logged in Telemetry System' }
              ].map((item) => {
                const isChecked = checkedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isChecked
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#181d24] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-400 bg-transparent'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-semibold select-none ${isChecked ? 'line-through opacity-70' : ''}`}>
                      {item.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: DATA TABLES & TABULAR NUMERALS */}
      {(activeCategory === 'overview' || activeCategory === 'tables') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Hash className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>6. Tabular Numerals (TNUM) Decimal Alignment Table</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Comparing tabular fixed-width digits where columns and decimals stay rigidly aligned regardless of number value.
              </p>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {tabularNumerals ? 'TNUM Feature Active' : 'Proportional (Default)'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#d9d2c2] dark:border-[#2e3846]">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#f1eee6] dark:bg-[#12161c] border-b border-[#d9d2c2] dark:border-[#2e3846] font-mono text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Line #</th>
                  <th className="py-2.5 px-3">Style / Order</th>
                  <th className="py-2.5 px-3 text-right">Target (pcs)</th>
                  <th className="py-2.5 px-3 text-right">Output (pcs)</th>
                  <th className="py-2.5 px-3 text-right">Efficiency %</th>
                  <th className="py-2.5 px-3 text-right">SMV (sec)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7e1d5] dark:divide-[#2e3846] bg-white dark:bg-[#181d24]">
                {[
                  { line: 'Line 01', style: 'Men Polo Knit', target: 1450, output: 1410, eff: '97.24%', smv: '24.50s', badge: 'Surplus', bg: 'text-emerald-600' },
                  { line: 'Line 02', style: 'Crewneck Tee', target: 1800, output: 1620, eff: '90.00%', smv: '18.25s', badge: 'On Track', bg: 'text-sky-600' },
                  { line: 'Line 03', style: 'Zip Hoodie Fleece', target: 1100, output: 1105, eff: '100.45%', smv: '32.10s', badge: 'Exceeded', bg: 'text-purple-600' },
                  { line: 'Line 04', style: 'Chino Pant Twill', target: 950, output: 780, eff: '82.11%', smv: '44.80s', badge: 'Bottleneck', bg: 'text-amber-600' }
                ].map((row) => (
                  <tr key={row.line} className="hover:bg-[#fbfaf6] dark:hover:bg-[#202732] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-[#17343a] dark:text-slate-100">{row.line}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{row.style}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold">{row.target.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#176f78] dark:text-teal-300">{row.output.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{row.eff}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{row.smv}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-slate-100 dark:bg-slate-800 ${row.bg}`}>
                        {row.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 7: ALERTS, BANNERS & TOAST SIMULATOR */}
      {(activeCategory === 'overview' || activeCategory === 'alerts') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#ff2d55]" />
                <span>7. Industrial Alert Banners &amp; Toast Notifications</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Standardized notification states for shop floor compliance, downtime alerts, and Kaizen celebrations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setToastVisible(true);
                triggerHaptic('success');
                setTimeout(() => setToastVisible(false), 3500);
              }}
              className="text-xs font-bold font-mono text-[#176f78] dark:text-teal-300 hover:underline cursor-pointer"
            >
              Trigger Test Toast
            </button>
          </div>

          <div className="space-y-3">
            {/* Info Banner */}
            <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/5 text-sky-900 dark:text-sky-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-xs font-semibold">
                  Shift Handover: Day Shift to Evening Shift rotation scheduled at 17:00 (15 minutes remaining).
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-sky-500/10 px-2 py-0.5 rounded-md shrink-0">
                Informational
              </span>
            </div>

            {/* Success Banner */}
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold">
                  Kaizen Achievement: Line 18 eliminated collar pressing bottleneck, saving 1.20s per garment.
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0">
                Kaizen Solved
              </span>
            </div>

            {/* Warning Banner */}
            <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-semibold">
                  Material Alert: Fabric roll lot #B28 has 1.5% shade variance on Line 07 back panel.
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-amber-500/10 px-2 py-0.5 rounded-md shrink-0">
                Pacing Risk
              </span>
            </div>

            {/* Critical Banner */}
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-900 dark:text-rose-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-semibold">
                  Machine Breakdown: Automated eyelet buttonhole machine #M-14 pneumatic valve pressure fault.
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded-md shrink-0">
                Urgent Action
              </span>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 8: TYPOGRAPHY & FONT STUDIO */}
      {(activeCategory === 'overview' || activeCategory === 'typography') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Type className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
                <span>8. Interactive Font Studio &amp; Side-by-Side Comparison</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                Type any custom machine name, time study string, or garment style to compare all 5 typefaces in real time.
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-[#176f78] dark:text-teal-300">
              Active: {fontFamily.toUpperCase()}
            </span>
          </div>

          {/* Custom Editable Text Box */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">
              Interactive Test String (Edit below to preview live in all 5 typefaces):
            </label>
            <input
              type="text"
              value={customTypoText}
              onChange={(e) => setCustomTypoText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] text-xs font-semibold text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:border-[#176f78]"
            />
          </div>

          {/* 5 Fonts Comparison Strip */}
          <div className="space-y-3 pt-2">
            {[
              {
                id: 'sans' as FontFamilyStyle,
                name: 'Inter & Dynamic Sans',
                role: 'Modern Cockpit UI (Default)',
                fontStyle: 'font-sans'
              },
              {
                id: 'mono' as FontFamilyStyle,
                name: 'JetBrains Industrial Monospace',
                role: 'High-Precision IE Studies & SMV Time Analysis',
                fontStyle: 'font-mono'
              },
              {
                id: 'dyslexic' as FontFamilyStyle,
                name: 'High-Legibility Factory ClearView',
                role: 'Vibration & Glare Resistant for Shop Floor Tablets',
                fontStyle: 'tracking-wide font-sans'
              },
              {
                id: 'grotesk' as FontFamilyStyle,
                name: 'Geometric Modern Grotesk',
                role: 'Command Hub & Big Screen Multi-Monitor Operations',
                fontStyle: 'tracking-tight font-sans'
              },
              {
                id: 'serif' as FontFamilyStyle,
                name: 'Editorial Executive Serif',
                role: 'Boardroom Ledgers, PDF Dossiers & Executive Summaries',
                fontStyle: 'font-serif'
              }
            ].map((f) => {
              const isSelected = fontFamily === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelectFontFamily(f.id);
                    triggerHaptic('selection');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#176f78] dark:border-teal-400 bg-[#176f78]/5 dark:bg-teal-950/30 ring-1 ring-[#176f78]/30 shadow-2xs'
                      : 'border-[#e7e1d5] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] hover:bg-white dark:hover:bg-[#181d24]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#17343a] dark:text-slate-100">{f.name}</span>
                      <span className="text-[10px] font-mono text-[#176f78] dark:text-teal-300 font-semibold">• {f.role}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] font-mono font-bold bg-[#176f78] text-white px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className={`text-sm text-[#17343a] dark:text-slate-200 ${f.fontStyle} py-1 truncate`}>
                    {customTypoText}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 9: THEMES MATRIX & PALETTE */}
      {(activeCategory === 'overview' || activeCategory === 'themes') && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#e7e1d5] dark:border-[#2e3846] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#af52de]" />
                <span>9. Industrial Theme Matrix &amp; Color Tokens</span>
              </h3>
              <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                7 custom shift profiles engineered for daylight anti-glare, dark control rooms, and battery efficiency.
              </p>
            </div>
            <span className="text-[10px] font-mono text-slate-400">7 Full Themes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'light' as ThemeType, name: 'Daylight Cockpit', desc: 'Warm cream canvas with teal accents.', swatches: ['#fbfaf6', '#17343a', '#176f78', '#d9d2c2'] },
              { id: 'dark' as ThemeType, name: 'Night Shift Dark', desc: 'Low-fatigue dark slate canvas.', swatches: ['#10141a', '#f1f5f9', '#1ea2af', '#2e3846'] },
              { id: 'industrial' as ThemeType, name: 'Steel & Charcoal', desc: 'High-contrast CNC cyan on charcoal.', swatches: ['#161c24', '#ffffff', '#14b8a6', '#374354'] },
              { id: 'forest' as ThemeType, name: 'Emerald Kaizen', desc: 'Continuous 5S improvement green.', swatches: ['#0d1f18', '#f0fdf4', '#10b981', '#27483b'] },
              { id: 'sunset' as ThemeType, name: 'Foundry Amber', desc: 'Copper foundry palette for sewing.', swatches: ['#1f140e', '#fffbeb', '#f59e0b', '#4a3427'] },
              { id: 'nordic' as ThemeType, name: 'Nordic Glacier', desc: 'Ice blue accents for executive reviews.', swatches: ['#0d1527', '#f0f9ff', '#0ea5e9', '#2a3b63'] },
              { id: 'oled' as ThemeType, name: 'True Black OLED', desc: 'Pure black to save frontline battery.', swatches: ['#000000', '#ffffff', '#10b981', '#222222'] }
            ].map((thm) => {
              const isSelected = currentTheme === thm.id;
              return (
                <div
                  key={thm.id}
                  onClick={() => {
                    onSelectTheme(thm.id);
                    triggerHaptic('selection');
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#176f78] dark:border-teal-400 bg-[#176f78]/10 dark:bg-teal-950/40 ring-2 ring-[#176f78]/30 shadow-xs'
                      : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#12161c] hover:bg-white dark:hover:bg-[#181d24]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center -space-x-1">
                        {thm.swatches.map((c, i) => (
                          <span
                            key={i}
                            style={{ backgroundColor: c }}
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs"
                          />
                        ))}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400 stroke-[3]" />}
                    </div>
                    <div className="text-xs font-bold text-[#17343a] dark:text-slate-100">{thm.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">{thm.desc}</div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] text-[10px] font-mono text-[#176f78] dark:text-teal-300 font-bold uppercase">
                    {isSelected ? 'Currently Applied' : 'Click to Apply'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FLOATING TOAST SIMULATION */}
      {toastVisible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-[#17343a] text-white shadow-xl flex items-center gap-3 max-w-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs font-semibold">{toastMessage}</div>
            <button
              type="button"
              onClick={() => setToastVisible(false)}
              className="text-white/60 hover:text-white cursor-pointer ml-auto"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
