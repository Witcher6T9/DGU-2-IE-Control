/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Factory,
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
  Layers,
  ArrowRight,
  HardDrive,
  Users,
  Activity,
  Target,
  Bell,
  Play,
  RotateCcw,
  CheckSquare,
  Wrench,
  Globe,
  Calculator,
  ArrowUpRight,
  ChevronLeft,
  Save,
  Check,
  Building,
  MapPin,
  Briefcase,
  AlertCircle,
  ExternalLink,
  Laptop,
  Layout,
  LayoutGrid,
  Monitor,
  Tablet,
  Radio,
  Tv,
  Sliders,
  Sparkles,
  Grid,
  List
} from 'lucide-react';
import {
  UserProfile,
  RoleTier,
  ThemeType,
  DashboardLayout,
  FactoryIndustryProfile,
  UserDailyBackupSettings,
  LineEntry,
  ChecklistMap,
  ChecklistStatus,
  TodoItem,
  ScheduleItem,
  LeanActionItem,
  AppPageLayoutConfig,
  LayoutPresetId,
  NavBarStyle,
  FloorGridColumns
} from '../types';
import {
  getStoredAppPageLayout,
  saveStoredAppPageLayout,
  applyLayoutStyling,
  DEFAULT_APP_PAGE_LAYOUT,
  BUILT_IN_LAYOUT_PRESETS
} from '../utils/layoutManager';
import {
  StationData,
  HourlyOutput,
  DowntimeIncident,
  ActionItem,
  FiveWhyInvestigation,
  AuditCheckItem,
  CenterlineAuditItem
} from '../types/dcs';
import { isMasterAdminOrAdmin, isSystemAdmin } from '../utils/rbac';
import { playBottleneckAlertSound, playWipAlertSound } from '../utils/audioAlert';
import { ActiveOperationalTiers } from './ActiveOperationalTiers';
import { Tier0CommandHub } from './tier0/Tier0CommandHub';
import { LineDataPage, LineDataSubTab } from './LineDataPage';
import { ChecklistPage, ChecklistSubTab } from './ChecklistPage';
import { LeanToolsPage, LeanToolsSubTab } from './LeanToolsPage';
import { WorldClassManufacturingSection } from './WorldClassManufacturingSection';
import { Reports } from './Reports';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';

export type SettingsPageSection =
  | 'control-center'
  | 'line-data'
  | 'checklist'
  | 'lean-tools'
  | 'capacity'
  | 'reports'
  | 'world'
  | 'preferences'
  | 'tier_0';

type SettingsCategory =
  | 'architecture'
  | 'factory'
  | 'display'
  | 'alerts'
  | 'backup'
  | 'security'
  | 'android'
  | 'hubs';

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

  // Controlled Section from App
  activeSection?: SettingsPageSection;
  onSelectSection?: (section: SettingsPageSection) => void;

  // Props for Line Data Operations Hub
  checklists?: ChecklistMap;
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onSaveLine?: (line: LineEntry) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (id: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onReorderLines?: (reordered: LineEntry[]) => void;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  activeFloor?: string;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  onImportLines?: (importedLines: LineEntry[], mode?: 'upsert' | 'append' | 'replace') => void;
  lineDataSubTab?: LineDataSubTab;
  stations?: StationData[];
  hourlyData?: HourlyOutput[];
  downtimeLog?: DowntimeIncident[];
  onOpenNewDowntime?: () => void;
  onUpdateHourNotes?: (hourIndex: number, notes: string) => void;
  onUpdateHourOutput?: (hourIndex: number, actual: number, scrap: number, downtimeMinutes: number) => void;

  // Props for Check List & Floor Compliance Hub
  selectedChecklistDate?: string;
  onSelectChecklistDate?: (date: string) => void;
  onUpdateTaskStatus?: (date: string, taskIndex: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist?: (date: string, statuses: ChecklistStatus[]) => void;
  todos?: TodoItem[];
  schedules?: ScheduleItem[];
  onUpdateTodos?: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  onUpdateSchedules?: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  actionItems?: ActionItem[];
  fiveWhys?: FiveWhyInvestigation[];
  onOpenNewAction?: () => void;
  onUpdateActionStatus?: (id: string, newStatus: 'Open' | 'In Progress' | 'Verified Closed') => void;
  onAddNewFiveWhy?: (newWhy: FiveWhyInvestigation) => void;
  auditChecks?: AuditCheckItem[];
  centerlines?: CenterlineAuditItem[];
  onToggleAuditItem?: (id: string, newStatus: 'pass' | 'warning' | 'fail') => void;
  onUpdateCenterlineValue?: (id: string, newValue: number) => void;
  onAddTodoFromAudit?: (item: Partial<TodoItem>) => void;
  checklistSubTab?: ChecklistSubTab;

  // Props for Lean Tools & IE Cockpit
  leanActions?: LeanActionItem[];
  onUpdateLeanActions?: React.Dispatch<React.SetStateAction<LeanActionItem[]>>;
  onApplySimulationToLine?: (lineNo: string, updates: Partial<LineEntry>) => void;
  onAddNewLineWithSimulation?: (lineData: Partial<LineEntry>) => void;
  leanToolsSubTab?: LeanToolsSubTab;

  // Auto-Refresh Engine
  onOpenAutoRefreshCustomizer?: () => void;
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
  onOpenAutoRefreshCustomizer,
  factoryProfile,
  onUpdateFactoryProfile,
  savedFactories,
  onSaveFactoryList,
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
  onNavigate,

  // Section handling
  activeSection: controlledSection,
  onSelectSection,

  // Line Data Hub
  checklists = {},
  selectedLineNo = '18',
  onSelectLineNo = () => {},
  onSaveLine = () => {},
  onAddNewLine = () => {},
  onDeleteLine = () => {},
  onDeleteFloor = () => {},
  onReorderLines = () => {},
  activeDate,
  onSelectDate = () => {},
  activeFloor = 'all',
  onSelectFloor,
  onImportLines,
  lineDataSubTab = 'lines',
  stations = [],
  hourlyData = [],
  downtimeLog = [],
  onOpenNewDowntime = () => {},
  onUpdateHourNotes = () => {},
  onUpdateHourOutput = () => {},

  // Checklist Hub
  selectedChecklistDate = activeDate || '2026-09-24',
  onSelectChecklistDate = () => {},
  onUpdateTaskStatus = () => {},
  onBatchUpdateChecklist = () => {},
  todos = [],
  schedules = [],
  onUpdateTodos = () => {},
  onUpdateSchedules = () => {},
  actionItems = [],
  fiveWhys = [],
  onOpenNewAction = () => {},
  onUpdateActionStatus = () => {},
  onAddNewFiveWhy = () => {},
  auditChecks = [],
  centerlines = [],
  onToggleAuditItem = () => {},
  onUpdateCenterlineValue = () => {},
  onAddTodoFromAudit = () => {},
  checklistSubTab = 'daily-checklist',

  // Lean Tools Hub
  leanActions = [],
  onUpdateLeanActions = () => {},
  onApplySimulationToLine = () => {},
  onAddNewLineWithSimulation = () => {},
  leanToolsSubTab = 'toolkit'
}) => {
  const isSysAdmin = isSystemAdmin(profile);

  const [internalSection, setInternalSection] = useState<SettingsPageSection>('control-center');
  const activeSection = controlledSection || internalSection;

  const handleSetSection = (sec: SettingsPageSection) => {
    if (onSelectSection) {
      onSelectSection(sec);
    }
    setInternalSection(sec);
  };

  useEffect(() => {
    if (controlledSection) {
      setInternalSection(controlledSection);
    }
  }, [controlledSection]);

  // Alive Layout Architecture State
  const [appLayout, setAppLayout] = useState<AppPageLayoutConfig>(() => getStoredAppPageLayout());
  const [layoutNotice, setLayoutNotice] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('tablet');

  // Synchronize layout if updated externally
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setAppLayout(e.detail);
      }
    };
    window.addEventListener('debonair:layout_changed', handler);
    return () => window.removeEventListener('debonair:layout_changed', handler);
  }, []);

  const handleApplyLayoutConfig = (newConfig: AppPageLayoutConfig, feedbackMessage?: string) => {
    setAppLayout(newConfig);
    saveStoredAppPageLayout(newConfig);
    applyLayoutStyling(newConfig);
    setLayoutNotice(feedbackMessage || `Applied ${newConfig.presetName || 'custom architecture'} live!`);
    setTimeout(() => setLayoutNotice(null), 3500);
  };

  const handleRestoreDefaultArchitecture = () => {
    const defaultConfig: AppPageLayoutConfig = {
      ...DEFAULT_APP_PAGE_LAYOUT,
      lastUpdated: new Date().toISOString()
    };
    handleApplyLayoutConfig(defaultConfig, 'Default Architecture "Debonair RMG Floor Standard" Restored!');
  };

  // Unified internal settings category
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
    if (activeSection === 'preferences') return 'display';
    return 'architecture';
  });

  useEffect(() => {
    if (activeSection === 'preferences') {
      setActiveCategory('display');
    }
  }, [activeSection]);

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

  // Editable Factory Profile State
  const [factoryName, setFactoryName] = useState(factoryProfile?.name || 'Debonair LTD');
  const [unitName, setUnitName] = useState(factoryProfile?.unitName || 'Unit-02');
  const [sector, setSector] = useState(factoryProfile?.industrySector || 'Apparel & Garment Manufacturing (RMG)');
  const [location, setLocation] = useState(factoryProfile?.addressLocation || 'Gorai, Mirzapur, Tangail, Bangladesh');
  const [factoryCode, setFactoryCode] = useState(factoryProfile?.factoryCode || 'DBN-U02');
  const [isSavedPlant, setIsSavedPlant] = useState(false);

  useEffect(() => {
    if (factoryProfile) {
      setFactoryName(factoryProfile.name || 'Debonair LTD');
      setUnitName(factoryProfile.unitName || 'Unit-02');
      setSector(factoryProfile.industrySector || 'Apparel & Garment Manufacturing (RMG)');
      setLocation(factoryProfile.addressLocation || 'Gorai, Mirzapur, Tangail, Bangladesh');
      setFactoryCode(factoryProfile.factoryCode || 'DBN-U02');
    }
  }, [factoryProfile]);

  const handleSavePlantIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateFactoryProfile) {
      onUpdateFactoryProfile({
        id: factoryProfile?.id || 'debonair-unit-02',
        name: factoryName.trim(),
        unitName: unitName.trim(),
        industrySector: sector.trim(),
        department: factoryProfile?.department || 'Industrial Engineering (IE) Dept.',
        factoryCode: factoryCode.trim(),
        addressLocation: location.trim(),
        shortTag: factoryCode.trim() || 'DBN-02'
      });
    }
    setIsSavedPlant(true);
    setTimeout(() => setIsSavedPlant(false), 2500);
  };

  // Compute checklist completion percentage
  const checklistProgress = useMemo(() => {
    const todayTasks = checklists[selectedChecklistDate] || {};
    const completed = Object.values(todayTasks).filter(v => v === 'yes').length;
    return Math.round((completed / 13) * 100);
  }, [checklists, selectedChecklistDate]);

  // Compute total active lines
  const totalActiveLines = useMemo(() => {
    const uniqueLineNumbers = new Set(
      lines
        .map(l => {
          const num = parseInt(String(l.lineNo).replace(/\D/g, ''), 10);
          return isNaN(num) ? String(l.lineNo).trim() : String(num);
        })
        .filter(Boolean)
    );
    return uniqueLineNumbers.size > 0 ? uniqueLineNumbers.size : 34;
  }, [lines]);

  const handleManualBackupClick = async () => {
    if (!onTriggerManualBackup) return;
    setIsBackingUp(true);
    setBackupMsg(null);
    try {
      await onTriggerManualBackup();
      setBackupMsg('Snapshot successfully verified and saved to local IndexedDB.');
      setTimeout(() => setBackupMsg(null), 4000);
    } catch {
      setBackupMsg('Backup failed. Storage quota or privacy lock active.');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Sound test states
  const [testingSound, setTestingSound] = useState<'bottleneck' | 'wip' | null>(null);

  const handleTestBottleneck = () => {
    setTestingSound('bottleneck');
    playBottleneckAlertSound();
    setTimeout(() => setTestingSound(null), 1200);
  };

  const handleTestWip = () => {
    setTestingSound('wip');
    playWipAlertSound();
    setTimeout(() => setTestingSound(null), 1200);
  };

  // Categories in the Settings Sidebar
  const categories = [
    {
      id: 'architecture' as SettingsCategory,
      label: 'Architecture & Alive Design',
      description: 'Default architecture, layout presets & ergonomics',
      icon: Layout
    },
    {
      id: 'factory' as SettingsCategory,
      label: 'Plant Identity & Floors',
      description: 'Enterprise name, operating floors, shift lines',
      icon: Factory
    },
    {
      id: 'display' as SettingsCategory,
      label: 'Display & Ergonomics',
      description: 'Daylight Cockpit vs Dark Studio themes',
      icon: Sun
    },
    {
      id: 'alerts' as SettingsCategory,
      label: 'Sound & Floor Alerts',
      description: 'Bottleneck alerts and WIP cycle chimes',
      icon: Volume2
    },
    {
      id: 'backup' as SettingsCategory,
      label: 'Data Vault & Storage',
      description: 'IndexedDB snapshots, backups, restore',
      icon: Database
    },
    {
      id: 'security' as SettingsCategory,
      label: 'Security & Access',
      description: 'Terminal lockout, RBAC clearances',
      icon: Lock
    },
    {
      id: 'android' as SettingsCategory,
      label: 'Mobile & PWA App',
      description: 'Offline service worker and APK package',
      icon: Smartphone
    },
    {
      id: 'hubs' as SettingsCategory,
      label: 'Operational Hubs',
      description: 'Datas, Checklist, Lean, WCM, Reports',
      icon: Layers
    }
  ];

  // If viewing a full sub-workspace component, show the sub-workspace with a clean header
  const isFullWorkspace =
    activeSection !== 'control-center' &&
    activeSection !== 'preferences';

  // Do not show "Back to Settings" return bar on primary standalone pages (Datas, Check List, Lean Tools)
  const hideBackToSettings =
    activeSection === 'line-data' ||
    activeSection === 'checklist' ||
    activeSection === 'lean-tools' ||
    activeSection === 'world';

  if (isFullWorkspace) {
    return (
      <div className="space-y-4">
        {/* Workspace Return Bar - Omitted on Datas, Check List, and Lean Tools pages */}
        {!hideBackToSettings && (
          <div className="bg-[#fbfaf6] dark:bg-[#1a1f26] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSetSection('control-center')}
                className="px-3 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-semibold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Settings</span>
              </button>
              <span className="text-slate-400 dark:text-slate-600">/</span>
              <span className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider">
                {activeSection === 'capacity' && 'Line Capacity & Pitch Calculator'}
                {activeSection === 'reports' && 'Reports & Production Analytics Hub'}
                {activeSection === 'tier_0' && 'Tier_0 Root Command Suite'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-[#527078] dark:text-slate-400">
              <span>{factoryProfile?.name || 'Debonair LTD'}</span>
              <span aria-hidden="true">·</span>
              <span>{totalActiveLines} Lines</span>
            </div>
          </div>
        )}

        {/* Render Workspace Content */}
        {activeSection === 'line-data' && (
          <LineDataPage
            lines={lines}
            checklists={checklists}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onSaveLine={onSaveLine}
            onAddNewLine={onAddNewLine}
            onDeleteLine={onDeleteLine}
            onDeleteFloor={onDeleteFloor}
            onReorderLines={onReorderLines}
            onNavigate={onNavigate}
            activeDate={activeDate}
            onSelectDate={onSelectDate}
            profile={profile}
            roleTiers={roleTiers}
            initialSubTab={lineDataSubTab}
            stations={stations}
            hourlyData={hourlyData}
            downtimeLog={downtimeLog}
            onOpenNewDowntime={onOpenNewDowntime}
            onUpdateHourNotes={onUpdateHourNotes}
            onUpdateHourOutput={onUpdateHourOutput}
            factoryProfile={factoryProfile}
            onUpdateFactoryProfile={onUpdateFactoryProfile}
            savedFactories={savedFactories}
            onSaveFactoryList={onSaveFactoryList}
            onOpenDatabase={onOpenDatabase}
            actions={leanActions}
            onUpdateActions={onUpdateLeanActions}
          />
        )}

        {activeSection === 'checklist' && (
          <ChecklistPage
            checklists={checklists}
            selectedDate={selectedChecklistDate}
            onSelectDate={onSelectChecklistDate}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onBatchUpdateChecklist={onBatchUpdateChecklist}
            profile={profile}
            roleTiers={roleTiers}
            onNavigate={onNavigate}
            todos={todos}
            schedules={schedules}
            onUpdateTodos={onUpdateTodos}
            onUpdateSchedules={onUpdateSchedules}
            actions={actionItems}
            fiveWhys={fiveWhys}
            onOpenNewAction={onOpenNewAction}
            onUpdateActionStatus={onUpdateActionStatus}
            onAddNewFiveWhy={onAddNewFiveWhy}
            auditItems={auditChecks}
            centerlines={centerlines}
            onToggleAuditItem={onToggleAuditItem}
            onUpdateCenterlineValue={onUpdateCenterlineValue}
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onAddTodoFromAudit={onAddTodoFromAudit}
            initialSubTab={checklistSubTab}
          />
        )}

        {activeSection === 'lean-tools' && (
          <LeanToolsPage
            actions={leanActions}
            onUpdateActions={onUpdateLeanActions}
            profile={profile}
            lines={lines}
            onSaveLine={onSaveLine}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onNavigate={onNavigate}
            onApplySimulationToLine={onApplySimulationToLine}
            onAddNewLineWithSimulation={onAddNewLineWithSimulation}
            initialSubTab={leanToolsSubTab}
          />
        )}

        {activeSection === 'capacity' && (
          <CapacityCalculatorWorkspace
            onBack={() => handleSetSection('control-center')}
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSaveLine={onSaveLine}
            actions={leanActions}
            onUpdateActions={actions => {
              if (typeof onUpdateLeanActions === 'function') {
                onUpdateLeanActions(actions);
              }
            }}
            profile={profile}
          />
        )}

        {activeSection === 'reports' && (
          <Reports
            lines={lines}
            checklists={checklists}
            onNavigate={onNavigate}
            todayDate={activeDate || '2026-09-24'}
            profile={profile}
          />
        )}

        {activeSection === 'world' && (
          <WorldClassManufacturingSection
            profile={profile}
            onNavigateToTool={tool => {
              if (tool === 'control-center') handleSetSection('control-center');
              else if (tool === 'checklist') handleSetSection('checklist');
              else if (tool === 'lean-tools') handleSetSection('lean-tools');
              else if (tool === 'line-data') handleSetSection('line-data');
            }}
          />
        )}

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
  }

  // CORE SETTINGS WORKSPACE (Clean, Apple/Linear-grade 2-column layout)
  return (
    <div className="space-y-6">
      {/* 1. Header Zone: Clean typography, unboxed metadata */}
      <header className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-2xs shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17343a] dark:text-slate-100 font-display">
                Settings
              </h1>
            </div>
            <p className="text-xs text-[#527078] dark:text-slate-400">
              Plant identity, floor distribution, audio alerts, and industrial data configuration.
            </p>
          </div>

          {/* Plant Metadata */}
          <div className="flex items-center gap-2 text-xs text-[#527078] dark:text-slate-400 font-mono">
            <span className="font-semibold text-[#17343a] dark:text-slate-200">
              {factoryProfile?.name || 'Debonair LTD'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{factoryProfile?.unitName || 'Unit-02'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
              {totalActiveLines} Lines Active
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Two-Column Settings Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Rail (Categories) */}
        <nav
          aria-label="Settings Categories"
          className="lg:col-span-4 xl:col-span-3 bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-2 sm:p-3 shadow-2xs flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 scrollbar-none"
        >
          {categories.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal w-full group ${
                  isActive
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#17343a] dark:text-slate-300 hover:bg-[#f1eee6] dark:hover:bg-[#252e3a]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#f1eee6] dark:bg-[#252e3a] text-[#176f78] dark:text-teal-400 group-hover:bg-[#e7e1d5] dark:group-hover:bg-[#2c3746]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="hidden min-[480px]:block">
                  <div className="text-xs font-bold leading-snug">
                    {cat.label}
                  </div>
                  <div
                    className={`text-[10px] hidden lg:block leading-tight ${
                      isActive ? 'text-white/80' : 'text-[#527078] dark:text-slate-400'
                    }`}
                  >
                    {cat.description}
                  </div>
                </div>
                <span className="min-[480px]:hidden text-xs font-bold">
                  {cat.label.split(' ')[0]}
                </span>
              </button>
            );
          })}

          {isSysAdmin && (
            <div className="pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] mt-1">
              <button
                type="button"
                onClick={() => handleSetSection('tier_0')}
                className="flex items-center gap-3 px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 w-full"
              >
                <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-bold">Tier_0 Root Suite</span>
              </button>
            </div>
          )}
        </nav>

        {/* Right Settings Content Area */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs">
          {/* Layout Change Feedback Notification */}
          {layoutNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{layoutNotice}</span>
            </div>
          )}

          {/* ========================================================
              CATEGORY 0: ARCHITECTURE & ALIVE DESIGN
          ======================================================== */}
          {activeCategory === 'architecture' && (
            <section className="space-y-6">
              {/* Header Zone */}
              <div className="border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#176f78]" />
                      <span>Default Architecture &amp; &ldquo;Alive Design&rdquo; Studio</span>
                    </h2>
                    <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                      Configure factory layout topology, responsive navigation geometry, and real-time floor ergonomics for Debonair Unit-02.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#527078] dark:text-slate-400 font-mono shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Alive Engine Active
                    </span>
                  </div>
                </div>

                {/* Clean Unboxed Metadata (Zero-Pill Discipline) */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#527078] dark:text-slate-400 font-mono mt-3">
                  <span className="font-semibold text-[#17343a] dark:text-slate-200">
                    {appLayout.presetName || 'Debonair RMG Floor Standard'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Nav: {appLayout.navBarStyle}</span>
                  <span aria-hidden="true">·</span>
                  <span>Grid: {appLayout.floorGridColumns} Cols</span>
                  <span aria-hidden="true">·</span>
                  <span>Density: {appLayout.density}</span>
                  <span aria-hidden="true">·</span>
                  <span>Font: {appLayout.fontScalePct}%</span>
                </div>
              </div>

              {/* 1. Official Default Architecture Spotlight */}
              <div className="p-5 rounded-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#176f78] dark:text-teal-400">
                        Factory Baseline Architecture
                      </span>
                      {appLayout.presetId === 'debonair-floor-default' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Default Active
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-[#17343a] dark:text-slate-100">
                      Debonair RMG Floor Standard (Unit-02)
                    </h3>
                    <p className="text-xs text-[#527078] dark:text-slate-400 leading-relaxed">
                      The certified industrial baseline configured for Debonair Unit-02: 2-column card view, Cupertino navigation dock, balanced 34-line telemetry, comfortable ergonomic spacing, and high-legibility tabular figures.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestoreDefaultArchitecture}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#135c64] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start md:self-center"
                    title="Reset all viewport geometry, navigation dock, and density settings to factory standard"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Default Architecture</span>
                  </button>
                </div>
              </div>

              {/* 2. Alive Presets Gallery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200">
                    Architectural Layout Presets
                  </h3>
                  <span className="text-[11px] text-[#527078] dark:text-slate-400">
                    Click any preset to apply live across the plant
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {BUILT_IN_LAYOUT_PRESETS.map(preset => {
                    const isActive = appLayout.presetId === preset.id;
                    const isDefault = preset.id === 'debonair-floor-default';
                    return (
                      <div
                        key={preset.id}
                        onClick={() =>
                          handleApplyLayoutConfig(
                            {
                              ...appLayout,
                              ...preset.config,
                              presetId: preset.id,
                              presetName: preset.name,
                              lastUpdated: new Date().toISOString()
                            } as AppPageLayoutConfig,
                            `Applied "${preset.name}" architecture live!`
                          )
                        }
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                          isActive
                            ? 'border-[#176f78] bg-white dark:bg-[#1c222b] shadow-xs ring-2 ring-[#176f78]/25'
                            : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#1f2732]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="font-bold text-xs text-[#17343a] dark:text-slate-100 flex items-center gap-1.5">
                              <span>{preset.name}</span>
                              {isDefault && (
                                <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#176f78]/10 text-[#176f78] dark:text-teal-300">
                                  Default
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <CheckCircle2 className="w-4 h-4 text-[#176f78] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#527078] dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {preset.desc}
                          </p>
                        </div>

                        {/* Quiet unboxed metadata */}
                        <div className="mt-3 pt-2.5 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center justify-between text-[10px] font-mono text-[#527078] dark:text-slate-400">
                          <span>{preset.config.floorGridColumns || 2} Cols</span>
                          <span aria-hidden="true">·</span>
                          <span>{preset.config.navBarStyle || 'cupertino'}</span>
                          <span aria-hidden="true">·</span>
                          <span>{preset.config.floorCardStyle === 'row' ? 'Rows' : 'Cards'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Alive Ergonomics & Custom Viewport Controls */}
              <div className="space-y-4 pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-200">
                  Ergonomics &amp; Viewport Geometry
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Navigation Architecture */}
                  <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] space-y-2">
                    <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200">
                      Navigation Architecture
                    </label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'bottom-cupertino' as NavBarStyle, label: 'Cupertino Dock', sub: 'Bottom standard' },
                        { id: 'floating-dock' as NavBarStyle, label: 'Floating Dock', sub: 'Tablet pill' },
                        { id: 'top-header' as NavBarStyle, label: 'Top Header', sub: 'Overhead TVs' },
                        { id: 'kiosk-minimal' as NavBarStyle, label: 'Kiosk Minimal', sub: 'Floor terminal' }
                      ].map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              navBarStyle: item.id,
                              presetId: 'custom',
                              presetName: 'Custom Architecture'
                            })
                          }
                          className={`p-2 rounded-lg text-left transition-all border cursor-pointer ${
                            appLayout.navBarStyle === item.id
                              ? 'bg-white dark:bg-[#252e3a] border-[#176f78] shadow-2xs text-[#17343a] dark:text-white ring-1 ring-[#176f78]'
                              : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-[#202732] text-[#527078] dark:text-slate-400'
                          }`}
                        >
                          <div className="text-xs font-bold">{item.label}</div>
                          <div className="text-[10px] text-[#527078] dark:text-slate-400">{item.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shop Floor Grid Columns */}
                  <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] space-y-2">
                    <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200">
                      Shop Floor Grid Geometry
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {([1, 2, 3, 4] as FloorGridColumns[]).map(cols => (
                        <button
                          key={cols}
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              floorGridColumns: cols,
                              presetId: 'custom',
                              presetName: 'Custom Architecture'
                            })
                          }
                          className={`py-2 px-1 text-center rounded-lg border transition-all cursor-pointer ${
                            appLayout.floorGridColumns === cols
                              ? 'bg-[#176f78] border-[#176f78] text-white shadow-2xs font-bold'
                              : 'bg-white dark:bg-[#252e3a] border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-300 hover:bg-[#f1eee6]'
                          }`}
                        >
                          <div className="text-xs">{cols} Col{cols > 1 ? 's' : ''}</div>
                          <div className="text-[9px] opacity-80 font-mono">
                            {cols === 1 ? 'Focus' : cols === 2 ? 'Default' : cols === 3 ? 'Dense' : 'Wide'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floor Card Representation Style */}
                  <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] space-y-2">
                    <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200">
                      Floor Card Presentation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleApplyLayoutConfig({
                            ...appLayout,
                            floorCardStyle: 'card',
                            presetId: 'custom',
                            presetName: 'Custom Architecture'
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          appLayout.floorCardStyle === 'card'
                            ? 'bg-white dark:bg-[#252e3a] border-[#176f78] text-[#17343a] dark:text-white ring-1 ring-[#176f78]'
                            : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-[#202732] text-[#527078] dark:text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <Grid className="w-3.5 h-3.5" /> Visual Cards (Default)
                        </div>
                        <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">
                          Tactile gauges, sparklines &amp; DHU meters
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleApplyLayoutConfig({
                            ...appLayout,
                            floorCardStyle: 'row',
                            presetId: 'custom',
                            presetName: 'Custom Architecture'
                          })
                        }
                        className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          appLayout.floorCardStyle === 'row'
                            ? 'bg-white dark:bg-[#252e3a] border-[#176f78] text-[#17343a] dark:text-white ring-1 ring-[#176f78]'
                            : 'bg-transparent border-transparent hover:bg-white/60 dark:hover:bg-[#202732] text-[#527078] dark:text-slate-400'
                        }`}
                      >
                        <div className="text-xs font-bold flex items-center gap-1.5">
                          <List className="w-3.5 h-3.5" /> Compact Rows
                        </div>
                        <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">
                          Dense high-throughput tabular strips
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* UI Density & Tactile Scale */}
                  <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] space-y-2">
                    <label className="block text-xs font-bold text-[#17343a] dark:text-slate-200">
                      Shop Floor Density
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact' as const, label: 'Compact', sub: 'Max density' },
                        { id: 'comfortable' as const, label: 'Comfortable', sub: 'Default' },
                        { id: 'spacious' as const, label: 'Spacious', sub: 'Tablet touch' }
                      ].map(d => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              density: d.id,
                              presetId: 'custom',
                              presetName: 'Custom Architecture'
                            })
                          }
                          className={`p-2 rounded-lg text-center border transition-all cursor-pointer ${
                            appLayout.density === d.id
                              ? 'bg-[#176f78] border-[#176f78] text-white shadow-2xs font-bold'
                              : 'bg-white dark:bg-[#252e3a] border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-300 hover:bg-[#f1eee6]'
                          }`}
                        >
                          <div className="text-xs">{d.label}</div>
                          <div className="text-[9px] opacity-80">{d.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Announcement Ribbon & Broadcast Ticker */}
                <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-[#17343a] dark:text-slate-200 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-[#176f78]" />
                        <span>Floor Announcement Ticker Ribbon</span>
                      </div>
                      <div className="text-[11px] text-[#527078] dark:text-slate-400">
                        Broadcast shift directives, quality alerts, or targets at the top of the floor
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appLayout.showAnnouncementTicker !== false}
                        onChange={e =>
                          handleApplyLayoutConfig({
                            ...appLayout,
                            showAnnouncementTicker: e.target.checked
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#176f78]" />
                    </label>
                  </div>

                  {appLayout.showAnnouncementTicker !== false && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="text"
                        value={appLayout.tickerText || ''}
                        onChange={e =>
                          handleApplyLayoutConfig({
                            ...appLayout,
                            tickerText: e.target.value
                          })
                        }
                        placeholder="Enter floor announcement..."
                        className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-[#252e3a] border border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-100 font-medium"
                      />

                      {/* Quick preset suggestions */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        <span className="text-[#527078] dark:text-slate-400">Quick Directives:</span>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              tickerText: 'Debonair LTD Unit-02 • 34 Active Sewing Lines • Standard Shift Running'
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#252e3a] border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-[#17343a] dark:text-slate-300 cursor-pointer"
                        >
                          Standard Shift
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              tickerText: '★ SHIFT TARGET: Green Wing 86.5% Eff • Benchmark Line 18 in Stability'
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#252e3a] border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-[#17343a] dark:text-slate-300 cursor-pointer"
                        >
                          Green Wing Target
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyLayoutConfig({
                              ...appLayout,
                              tickerText: 'AUDIT ALERT: 7/0 Traffic Light System active across All 6 Floors'
                            })
                          }
                          className="px-2 py-0.5 rounded-md bg-white dark:bg-[#252e3a] border border-[#d9d2c2] dark:border-[#2e3846] hover:border-[#176f78] text-[#17343a] dark:text-slate-300 cursor-pointer"
                        >
                          Quality Audit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Alive Interactive Architectural Blueprint Preview */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Alive Architectural Blueprint (Interactive Live Wireframe)
                    </span>
                  </div>

                  {/* Device Preview Switcher */}
                  <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        previewDevice === 'desktop' ? 'bg-[#176f78] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="w-3 h-3" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('tablet')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        previewDevice === 'tablet' ? 'bg-[#176f78] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Tablet className="w-3 h-3" />
                      <span>Tablet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                        previewDevice === 'mobile' ? 'bg-[#176f78] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-3 h-3" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Wireframe Box */}
                <div className="flex justify-center p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div
                    className={`transition-all duration-300 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex flex-col ${
                      previewDevice === 'desktop'
                        ? 'w-full max-w-xl h-52'
                        : previewDevice === 'tablet'
                        ? 'w-80 h-52'
                        : 'w-48 h-56'
                    }`}
                  >
                    {/* Top Ticker wireframe */}
                    {appLayout.showAnnouncementTicker !== false && (
                      <div className="bg-[#176f78] text-[9px] px-2 py-0.5 text-white flex items-center justify-between font-mono shrink-0">
                        <span className="truncate">{appLayout.tickerText || 'Debonair Unit-02'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      </div>
                    )}

                    {/* Top Header wireframe if top-header */}
                    {appLayout.navBarStyle === 'top-header' && (
                      <div className="bg-slate-800 border-b border-slate-700 px-2 py-1 flex items-center justify-between shrink-0">
                        <span className="text-[9px] font-bold text-teal-300">DGU-02</span>
                        <div className="flex gap-1 text-[8px] text-slate-300">
                          <span className="px-1 bg-slate-700 rounded">Dash</span>
                          <span className="px-1">Lines</span>
                          <span className="px-1">Lean</span>
                        </div>
                      </div>
                    )}

                    {/* Center area with optional sidebar */}
                    <div className="flex-1 flex overflow-hidden">
                      {appLayout.navBarStyle === 'kiosk-minimal' && (
                        <div className="w-10 bg-slate-800 border-r border-slate-700 p-1 flex flex-col items-center gap-1 shrink-0">
                          <div className="w-3 h-3 rounded bg-teal-500/40" />
                          <div className="w-4 h-1.5 rounded bg-slate-700" />
                          <div className="w-4 h-1.5 rounded bg-slate-700" />
                        </div>
                      )}

                      {/* Content grid */}
                      <div className="flex-1 p-2 overflow-y-auto space-y-1.5">
                        <div className="h-3 rounded bg-slate-800 border border-slate-700/50 flex items-center px-1">
                          <div className="w-1/3 h-1.5 bg-slate-600 rounded" />
                        </div>

                        {/* Columns simulation */}
                        <div
                          className="grid gap-1"
                          style={{
                            gridTemplateColumns: `repeat(${appLayout.floorGridColumns}, minmax(0, 1fr))`
                          }}
                        >
                          {Array.from({ length: appLayout.floorGridColumns * 2 }, (_, i) => (
                            <div
                              key={i}
                              className={`rounded border border-slate-700/60 p-1 bg-slate-800/80 ${
                                appLayout.floorCardStyle === 'row' ? 'h-4 flex items-center justify-between' : 'h-10 flex flex-col justify-between'
                              }`}
                            >
                              <div className="w-10 h-1.5 bg-slate-600 rounded" />
                              <div className="w-5 h-1.5 bg-teal-500/60 rounded" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Nav wireframe if cupertino or floating */}
                    {appLayout.navBarStyle === 'bottom-cupertino' && (
                      <div className="bg-slate-800/90 border-t border-slate-700 px-3 py-1 flex items-center justify-around shrink-0">
                        <div className="w-3 h-3 rounded bg-teal-500" />
                        <div className="w-3 h-3 rounded bg-slate-600" />
                        <div className="w-3 h-3 rounded bg-slate-600" />
                        <div className="w-3 h-3 rounded bg-slate-600" />
                      </div>
                    )}
                    {appLayout.navBarStyle === 'floating-dock' && (
                      <div className="p-1 flex justify-center shrink-0">
                        <div className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-full flex items-center gap-2 shadow-md">
                          <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 text-center font-mono">
                  Alive Architecture Engine • Instant live updates dispatched to all plant clients
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              CATEGORY 1: PLANT IDENTITY & OPERATING FLOORS
          ======================================================== */}
          {activeCategory === 'factory' && (
            <section className="space-y-6">
              <div className="border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-[#176f78]" />
                  <span>Plant Identity &amp; Enterprise Facility</span>
                </h2>
                <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                  Configure corporate plant identification, active complex unit, and floor distribution.
                </p>
              </div>

              {/* Plant Identity Form */}
              <form onSubmit={handleSavePlantIdentity} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#17343a] dark:text-slate-200 mb-1">
                      Company / Group Name
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={factoryName}
                        onChange={e => setFactoryName(e.target.value)}
                        placeholder="e.g. Debonair LTD"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17343a] dark:text-slate-200 mb-1">
                      Active Unit Designation
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={unitName}
                        onChange={e => setUnitName(e.target.value)}
                        placeholder="e.g. Unit-02 Manufacturing Complex"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17343a] dark:text-slate-200 mb-1">
                      Industry Sector
                    </label>
                    <input
                      type="text"
                      value={sector}
                      onChange={e => setSector(e.target.value)}
                      placeholder="e.g. Apparel & Garments (RMG)"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#17343a] dark:text-slate-200 mb-1">
                      Factory Facility Code
                    </label>
                    <input
                      type="text"
                      value={factoryCode}
                      onChange={e => setFactoryCode(e.target.value)}
                      placeholder="e.g. DBN-U02"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 font-mono focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[#17343a] dark:text-slate-200 mb-1">
                      Facility Location / Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="e.g. Gorai, Mirzapur, Tangail, Bangladesh"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#d9d2c2] dark:border-[#384454] bg-[#fbfaf6] dark:bg-[#151a21] text-[#17343a] dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-[#527078] dark:text-slate-400">
                    {isSavedPlant && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Changes saved successfully</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Plant Profile</span>
                  </button>
                </div>
              </form>

              {/* Operating Production Floors Section */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider">
                      Operating Production Floors ({totalActiveLines} Active Lines)
                    </h3>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400">
                      Standard unit divisions configured for floor supervision and balancing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSetSection('line-data')}
                    className="text-xs font-bold text-[#176f78] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View in Line Data</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { name: 'Padma', lines: 'Lines 01 - 06', count: 6, lineFilter: '1' },
                    { name: 'Meghna', lines: 'Lines 07 - 12', count: 6, lineFilter: '7' },
                    { name: 'Karnophuli', lines: 'Lines 13 - 17', count: 5, lineFilter: '13' },
                    { name: 'Korotoya', lines: 'Lines 18 - 23', count: 6, lineFilter: '18' },
                    { name: 'Shitalokshya', lines: 'Lines 24 - 29', count: 6, lineFilter: '24' },
                    { name: 'Turag', lines: 'Lines 30 - 34', count: 5, lineFilter: '30' }
                  ].map(f => (
                    <div
                      key={f.name}
                      onClick={() => {
                        handleSetSection('line-data');
                        onSelectLineNo(f.lineFilter);
                      }}
                      className="p-3.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] hover:border-[#176f78] transition-all cursor-pointer shadow-2xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#17343a] dark:text-slate-200 group-hover:text-[#176f78] transition-colors">
                          {f.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#527078] dark:text-slate-400">
                          {f.count} Lines
                        </span>
                      </div>
                      <div className="text-[11px] text-[#527078] dark:text-slate-400 font-mono mt-1">
                        {f.lines}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Working Hours & Shift Norms */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846] grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Standard Shift Hours
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    08:00 AM – 05:00 PM
                  </div>
                  <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">
                    9h duration · 1h lunch pause
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Target Efficiency Baseline
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    68.0% Benchmark
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    IE standard for RMG jackets
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Hourly Telemetry Slots
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    10 Production Hours
                  </div>
                  <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-0.5">
                    H1 (08-09) to H10 (18-19 OT)
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              CATEGORY 2: DISPLAY & VISUAL ERGONOMICS
          ======================================================== */}
          {activeCategory === 'display' && (
            <section className="space-y-6">
              <div className="border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#176f78]" />
                  <span>Display &amp; Visual Ergonomics</span>
                </h2>
                <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                  Select interface contrast mode tailored for daylight shop floors or night control rooms.
                </p>
              </div>

              {/* Theme Choice Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => onSelectTheme('light')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    currentTheme === 'light'
                      ? 'border-[#176f78] bg-[#176f78]/5 ring-2 ring-[#176f78]/20 shadow-xs'
                      : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    {currentTheme === 'light' && (
                      <CheckCircle2 className="w-5 h-5 text-[#176f78]" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-[#17343a] dark:text-slate-100">
                    Light Cockpit (Default)
                  </div>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-1 leading-relaxed">
                    Warm architectural canvas with deep industrial teal accents. Glare-resistant under factory fluorescent lighting.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTheme('dark')}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    currentTheme === 'dark'
                      ? 'border-[#176f78] bg-slate-900 text-white ring-2 ring-[#176f78]/20 shadow-xs'
                      : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-900 text-indigo-200 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    {currentTheme === 'dark' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="font-bold text-sm text-[#17343a] dark:text-slate-100">
                    Dark Studio (Night Shift)
                  </div>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-1 leading-relaxed">
                    Low-fatigue dark slate canvas designed for control room displays, night audits, and low-light environments.
                  </p>
                </button>
              </div>

              {/* Layout Density Controls */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider mb-2">
                  Shop Floor Viewport Density
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
                    <div className="font-bold text-xs text-[#17343a] dark:text-slate-200">
                      Standard Tablet Ergonomics
                    </div>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                      Touch targets 44px and above optimized for floor operators and tablet gloves.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
                    <div className="font-bold text-xs text-[#17343a] dark:text-slate-200">
                      High Contrast Numerals
                    </div>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                      Tabular figures (`font-mono tabular-nums`) enabled across all production tables.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              CATEGORY 3: SOUND & FLOOR ALERTS
          ======================================================== */}
          {activeCategory === 'alerts' && (
            <section className="space-y-6">
              <div className="border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#176f78]" />
                  <span>Auditory Alert Rules &amp; Floor Signals</span>
                </h2>
                <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                  Web Audio telemetry alerts when line bottlenecks choke or WIP starvation occurs.
                </p>
              </div>

              {/* Master Audio Toggle */}
              <div className="p-4 rounded-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    {auditoryAlertsEnabled ? (
                      <Volume2 className="w-4 h-4 text-[#176f78]" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-slate-400" />
                    )}
                    <span>Auditory Alerts Master Switch</span>
                  </div>
                  <p className="text-xs text-[#527078] dark:text-slate-400">
                    Enables synth chimes for floor supervisor tablet alerts.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
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

              {/* Real-Time Auto-Refresh Engine Customizer */}
              <div className="p-4 rounded-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#176f78]" />
                    <span>Real-Time Auto-Refresh Engine</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 uppercase">
                      Telemetry Heartbeat
                    </span>
                  </div>
                  <p className="text-xs text-[#527078] dark:text-slate-400">
                    Tune telemetry refresh intervals (3s–60s), pacing simulation intensity, countdown badges, and auditory ticks.
                  </p>
                </div>

                {onOpenAutoRefreshCustomizer && (
                  <button
                    type="button"
                    onClick={onOpenAutoRefreshCustomizer}
                    className="px-4 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Customize Engine</span>
                  </button>
                )}
              </div>

              {/* Specific Alert Channels */}
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#17343a] dark:text-slate-200">
                      Bottleneck Choke Frequency Chime
                    </div>
                    <div className="text-[11px] text-[#527078] dark:text-slate-400">
                      Harmonic alert fires when station cycle time exceeds line takt time by &gt;15%.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestBottleneck}
                    disabled={testingSound === 'bottleneck'}
                    className="px-3.5 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                  >
                    <Play className={`w-3.5 h-3.5 text-[#176f78] ${testingSound === 'bottleneck' ? 'animate-ping' : ''}`} />
                    <span>{testingSound === 'bottleneck' ? 'Playing...' : 'Test Sound'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-[#17343a] dark:text-slate-200">
                      WIP Buffer Starvation Chime
                    </div>
                    <div className="text-[11px] text-[#527078] dark:text-slate-400">
                      Subtle alert when downstream operations run out of bundle inventory.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestWip}
                    disabled={testingSound === 'wip'}
                    className="px-3.5 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 self-start sm:self-auto shrink-0"
                  >
                    <Play className={`w-3.5 h-3.5 text-amber-600 ${testingSound === 'wip' ? 'animate-ping' : ''}`} />
                    <span>{testingSound === 'wip' ? 'Playing...' : 'Test Sound'}</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              CATEGORY 4: DATA VAULT & STORAGE
          ======================================================== */}
          {activeCategory === 'backup' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#176f78]" />
                    <span>Data Vault, Snapshots &amp; Storage</span>
                  </h2>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                    Local IndexedDB database, automated daily backups, and factory reset recovery.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleManualBackupClick}
                  disabled={isBackingUp}
                  className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>{isBackingUp ? 'Verifying...' : 'Snapshot Now'}</span>
                </button>
              </div>

              {backupMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{backupMsg}</span>
                </div>
              )}

              {/* Status Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Local Storage Engine
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    {totalActiveLines} Lines Cached
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                    IndexedDB Online
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Automated Shift Snapshot
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    Daily at 05:00 PM
                  </div>
                  <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-1">
                    30-Day Rolling Vault
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400">
                    Factory Defaults
                  </div>
                  <button
                    type="button"
                    onClick={onResetFactoryDefaults}
                    className="mt-1 text-xs font-bold text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Debonair Set</span>
                  </button>
                  <div className="text-[10px] text-[#527078] dark:text-slate-400 mt-1">
                    Restores 24-Sep baseline
                  </div>
                </div>
              </div>

              {/* Advanced Hub Link */}
              {onOpenDatabase && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenDatabase('backup')}
                    className="w-full py-3 rounded-xl border border-[#176f78] text-[#176f78] dark:text-teal-400 hover:bg-[#176f78]/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Open Advanced Data &amp; Telemetry Hub</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ========================================================
              CATEGORY 5: SECURITY & RBAC CLEARANCE
          ======================================================== */}
          {activeCategory === 'security' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#176f78]" />
                    <span>Floor Terminal Security &amp; Access</span>
                  </h2>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                    Terminal lock screen, active session clearance, and RBAC tiers.
                  </p>
                </div>
                {onLockTerminal && (
                  <button
                    type="button"
                    onClick={onLockTerminal}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Terminal</span>
                  </button>
                )}
              </div>

              {/* Active Operator Clearance Card */}
              <div className="p-4 rounded-xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400 uppercase">
                    Authenticated Operator Session
                  </div>
                  <div className="text-base font-bold text-[#17343a] dark:text-slate-100 mt-0.5 font-display">
                    {profile.name}
                  </div>
                  <div className="text-xs text-[#527078] dark:text-slate-400 font-mono mt-0.5">
                    Role: {profile.jobTitle || 'Industrial Engineer'} · Tier ID: {profile.tierId || 'tier_1'}
                  </div>
                </div>

                {onOpenUserModal && (
                  <button
                    type="button"
                    onClick={() => onOpenUserModal('roles')}
                    className="px-3.5 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-white dark:bg-[#232a34] text-xs font-bold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-all cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <span>Manage Roles &amp; Permissions</span>
                  </button>
                )}
              </div>

              {/* Operational Tiers Integration */}
              <div className="pt-2">
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
                  onSelectLineFilter={lineNo => {
                    handleSetSection('line-data');
                    if (onSelectLineNo) onSelectLineNo(lineNo);
                  }}
                />
              </div>

              {onOpenPrivacySecurity && (
                <div className="pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846]">
                  <button
                    type="button"
                    onClick={onOpenPrivacySecurity}
                    className="text-xs font-bold text-[#176f78] dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>View Privacy &amp; Security Compliance Policy</span>
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ========================================================
              CATEGORY 6: MOBILE & ANDROID PWA INSTALL
          ======================================================== */}
          {activeCategory === 'android' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#176f78]" />
                    <span>Mobile PWA &amp; Android Tablet Deployment</span>
                  </h2>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                    Offline capabilities, service worker precache, and Android TWA packaging.
                  </p>
                </div>
                {onOpenAndroidPackage && (
                  <button
                    type="button"
                    onClick={onOpenAndroidPackage}
                    className="px-4 py-2 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Package Wizard</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400 uppercase">
                    Service Worker Precache
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    68 Assets Precached
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                    Zero-Network Offline Ready
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24]">
                  <div className="text-[11px] font-semibold text-[#527078] dark:text-slate-400 uppercase">
                    Android Package Identifier
                  </div>
                  <div className="text-sm font-bold text-[#17343a] dark:text-slate-200 mt-1 font-mono">
                    com.debonair.iedailycontrol
                  </div>
                  <div className="text-xs text-[#527078] dark:text-slate-400 mt-1">
                    Digital Asset Links Verified
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ========================================================
              CATEGORY 7: CENTRALIZED OPERATIONAL HUBS DIRECT JUMP
          ======================================================== */}
          {activeCategory === 'hubs' && (
            <section className="space-y-6">
              <div className="border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#176f78]" />
                  <span>Centralized Operational Hubs</span>
                </h2>
                <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                  Launch any frontline manufacturing or industrial engineering workspace directly.
                </p>
              </div>

              {/* 6 Hubs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    id: 'line-data' as SettingsPageSection,
                    title: 'Line Data Operations Hub',
                    desc: `${totalActiveLines} sewing lines telemetry, Yamazumi balancing, and hourly pacing.`,
                    icon: Layers,
                    badge: `${totalActiveLines} Lines`
                  },
                  {
                    id: 'checklist' as SettingsPageSection,
                    title: 'Check List & Floor Compliance',
                    desc: '13-point daily verification routine, action tracker, and 5-whys investigations.',
                    icon: CheckSquare,
                    badge: `${checklistProgress}% Done`
                  },
                  {
                    id: 'lean-tools' as SettingsPageSection,
                    title: 'Lean Tools & IE Simulator',
                    desc: '13 lean manufacturing methods, Kaizen workshops, SMV tuning, and flow simulator.',
                    icon: Wrench,
                    badge: '13 Methods'
                  },
                  {
                    id: 'capacity' as SettingsPageSection,
                    title: 'Capacity & Pitch Calculator',
                    desc: 'Theoretical daily output, pitch takt time, machine hours balance, and order delivery.',
                    icon: Calculator,
                    badge: 'IE Tool'
                  },
                  {
                    id: 'reports' as SettingsPageSection,
                    title: 'Reports & Production Analytics',
                    desc: 'Consolidated shift summaries, production matrix, and CSV / PDF exports.',
                    icon: FileSpreadsheet,
                    badge: 'Export'
                  },
                  {
                    id: 'world' as SettingsPageSection,
                    title: 'World Class Manufacturing (WCM)',
                    desc: '5 WCM pillars, TPM, SMED, Poka-Yoke, and zero-defect quality benchmarks.',
                    icon: Globe,
                    badge: 'WCM Audit'
                  }
                ].map(hub => {
                  const HubIcon = hub.icon;
                  return (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => handleSetSection(hub.id)}
                      className="p-4 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] hover:border-[#176f78] transition-all text-left group cursor-pointer shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-[#176f78]/10 text-[#176f78] dark:text-teal-400 flex items-center justify-center">
                            <HubIcon className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-mono text-[#527078] dark:text-slate-400 font-semibold">
                            {hub.badge}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-[#17343a] dark:text-slate-100 group-hover:text-[#176f78] transition-colors">
                          {hub.title}
                        </div>
                        <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-1 leading-relaxed">
                          {hub.desc}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center justify-between text-xs font-bold text-[#176f78] dark:text-teal-400">
                        <span>Launch Workspace</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
