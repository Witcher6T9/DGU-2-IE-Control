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
  ChevronRight,
  Search,
  X,
  SlidersHorizontal,
  LayoutGrid,
  Columns2,
  Rows3,
  ScrollText,
  Gauge,
  PanelTop
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
  LeanActionItem
} from '../types';
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
import { SettingsBentoOverview } from './SettingsBentoOverview';
import { SettingsFloorHUD } from './SettingsFloorHUD';
import { SettingsTabbedDeck } from './SettingsTabbedDeck';
import { SettingsAuditStream } from './SettingsAuditStream';
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

  // Unified internal settings category
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
    if (activeSection === 'preferences') return 'display';
    return 'factory';
  });

  useEffect(() => {
    if (activeSection === 'preferences') {
      setActiveCategory('display');
    }
  }, [activeSection]);

  const [categoryQuery, setCategoryQuery] = useState('');
  type SettingsLayoutMode = 'bento' | 'split' | 'deck' | 'hud' | 'stream';
  const [settingsLayoutMode, setSettingsLayoutMode] = useState<SettingsLayoutMode>(() => {
    try {
      const saved = localStorage.getItem('debonair_settings_layout_mode');
      if (
        saved === 'bento' ||
        saved === 'split' ||
        saved === 'deck' ||
        saved === 'hud' ||
        saved === 'stream'
      ) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'bento';
  });

  const handleSelectLayoutMode = (mode: SettingsLayoutMode) => {
    setSettingsLayoutMode(mode);
    try {
      localStorage.setItem('debonair_settings_layout_mode', mode);
    } catch {
      // ignore
    }
  };

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

  // Categories in the Settings Sidebar with industrial metadata and section groupings
  const categories = useMemo(() => [
    {
      id: 'factory' as SettingsCategory,
      section: 'Plant Operations',
      index: '01',
      label: 'Plant Identity & Floors',
      description: 'Enterprise facility, complex unit, active floors',
      badge: factoryProfile?.name ? factoryProfile.name.split(' ')[0] : 'Debonair',
      icon: Factory
    },
    {
      id: 'display' as SettingsCategory,
      section: 'Environment',
      index: '02',
      label: 'Display & Ergonomics',
      description: 'Daylight Cockpit vs Dark Studio visual themes',
      badge: currentTheme === 'dark' ? 'Dark' : 'Daylight',
      icon: Sun
    },
    {
      id: 'alerts' as SettingsCategory,
      section: 'Environment',
      index: '03',
      label: 'Sound & Floor Alerts',
      description: 'Bottleneck alerts and WIP cycle chimes',
      badge: auditoryAlertsEnabled ? 'Audio On' : 'Muted',
      icon: Volume2
    },
    {
      id: 'backup' as SettingsCategory,
      section: 'Storage & System',
      index: '04',
      label: 'Data Vault & Storage',
      description: 'IndexedDB snapshots, backups, restore points',
      badge: 'Local Vault',
      icon: Database
    },
    {
      id: 'security' as SettingsCategory,
      section: 'Storage & System',
      index: '05',
      label: 'Security & Access',
      description: 'Terminal lockout, RBAC tier clearances',
      badge: profile?.role || 'Operator',
      icon: Lock
    },
    {
      id: 'android' as SettingsCategory,
      section: 'Storage & System',
      index: '06',
      label: 'Mobile & PWA App',
      description: 'Offline service worker and APK package',
      badge: 'PWA v2.4',
      icon: Smartphone
    },
    {
      id: 'hubs' as SettingsCategory,
      section: 'Plant Operations',
      index: '07',
      label: 'Operational Hubs',
      description: 'Datas, Checklist, Lean, WCM, Reports',
      badge: '5 Hubs',
      icon: Layers
    }
  ], [factoryProfile?.name, currentTheme, auditoryAlertsEnabled, profile?.role]);

  const filteredCategories = useMemo(() => {
    if (!categoryQuery.trim()) return categories;
    const q = categoryQuery.toLowerCase().trim();
    return categories.filter(
      c =>
        c.label.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.badge.toLowerCase().includes(q)
    );
  }, [categories, categoryQuery]);

  // If viewing a full sub-workspace component, show the sub-workspace with a clean header
  const isFullWorkspace =
    activeSection !== 'control-center' &&
    activeSection !== 'preferences';

  if (isFullWorkspace) {
    return (
      <div className="space-y-4">
        {/* Workspace Return Bar */}
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
              {activeSection === 'line-data' && 'Line Data Operations Hub'}
              {activeSection === 'checklist' && 'Check List & Floor Compliance Hub'}
              {activeSection === 'lean-tools' && 'Lean Tools & Industrial Engineering Cockpit'}
              {activeSection === 'capacity' && 'Line Capacity & Pitch Calculator'}
              {activeSection === 'reports' && 'Reports & Production Analytics Hub'}
              {activeSection === 'world' && 'World Class Manufacturing (WCM)'}
              {activeSection === 'tier_0' && 'Tier_0 Root Command Suite'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-[#527078] dark:text-slate-400">
            <span>{factoryProfile?.name || 'Debonair LTD'}</span>
            <span aria-hidden="true">·</span>
            <span>{totalActiveLines} Lines</span>
          </div>
        </div>

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
      {/* 1. Header Zone: Clean typography, layout mode selector, unboxed metadata */}
      <header className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-2xs shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17343a] dark:text-slate-100 font-display">
                Quick Settings / Control Center
              </h1>
            </div>
            <p className="text-xs text-[#527078] dark:text-slate-400">
              Plant identity, floor distribution, audio alerts, and industrial data configuration.
            </p>
          </div>

          {/* Plant Metadata & Layout Mode Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Unboxed Metadata */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#527078] dark:text-slate-400 font-mono">
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

            {/* Layout Mode Segmented Selector */}
            <div className="flex items-center gap-1 p-1 bg-[#f0eae0] dark:bg-[#151a22] border border-[#d9d2c2] dark:border-[#2e3846] rounded-xl">
              <button
                type="button"
                onClick={() => handleSelectLayoutMode('bento')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  settingsLayoutMode === 'bento'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Bento Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectLayoutMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  settingsLayoutMode === 'split'
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-slate-200'
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Split Rail</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Bento Matrix Mode (Panoramic Overview of all Settings UI components) */}
      {settingsLayoutMode === 'bento' ? (
        <SettingsBentoOverview
          factoryProfile={factoryProfile}
          factoryName={factoryName}
          unitName={unitName}
          totalActiveLines={totalActiveLines}
          currentTheme={currentTheme}
          onSelectTheme={onSelectTheme}
          auditoryAlertsEnabled={auditoryAlertsEnabled}
          onToggleAuditoryAlerts={onToggleAuditoryAlerts}
          testingSound={testingSound}
          onTestBottleneck={handleTestBottleneck}
          onTestWip={handleTestWip}
          isBackingUp={isBackingUp}
          backupMsg={backupMsg}
          onTriggerBackup={handleManualBackupClick}
          profile={profile}
          onLockTerminal={onLockTerminal}
          onOpenAndroidPackage={onOpenAndroidPackage}
          onOpenDatabase={onOpenDatabase}
          onOpenUserModal={onOpenUserModal}
          onNavigateToSection={handleSetSection}
          onSwitchToInspector={cat => {
            setActiveCategory(cat as SettingsCategory);
            handleSelectLayoutMode('split');
          }}
          isSysAdmin={isSysAdmin}
        />
      ) : (
        /* 3. Split Rail Mode (Classic Inspector 2-Column Layout) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Navigation Rail (Categories) */}
        <nav
          aria-label="Settings Categories"
          className="lg:col-span-4 xl:col-span-3 bg-white/95 dark:bg-[#1c222b]/95 backdrop-blur-sm border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-2.5 sm:p-3.5 shadow-2xs flex flex-col gap-2 transition-all duration-200"
        >
          {/* Rail Header on Desktop */}
          <div className="hidden lg:flex items-center justify-between pb-2.5 mb-0.5 border-b border-[#ece6d9] dark:border-[#2a3442]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#176f78] dark:bg-teal-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 font-mono">
                Control Rail
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#f4efe4] dark:bg-[#252e3b] text-[#527078] dark:text-slate-400">
              {filteredCategories.length}/{categories.length}
            </span>
          </div>

          {/* Quick Search Filter on Desktop */}
          <div className="hidden lg:block mb-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#527078] dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={categoryQuery}
                onChange={e => setCategoryQuery(e.target.value)}
                placeholder="Filter settings..."
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-[#f8f6f0] dark:bg-[#141920] border border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-[#176f78] transition-all"
              />
              {categoryQuery && (
                <button
                  type="button"
                  onClick={() => setCategoryQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Mobile Horizontal Scroll Strip */}
          <div className="lg:hidden flex overflow-x-auto gap-2 py-1 scrollbar-none snap-x -mx-1 px-1">
            {categories.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`snap-start shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none whitespace-nowrap min-h-[44px] ${
                    isActive
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'bg-[#f4efe4] dark:bg-[#222934] text-[#17343a] dark:text-slate-300 hover:bg-[#eae3d5] dark:hover:bg-[#2b3543]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#176f78] dark:text-teal-400'}`} />
                  <span>{cat.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white ml-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Desktop Categories List */}
          <div className="hidden lg:flex flex-col gap-1.5">
            {filteredCategories.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 space-y-2">
                <SlidersHorizontal className="w-5 h-5 mx-auto opacity-50" />
                <p>No modules match &quot;{categoryQuery}&quot;</p>
                <button
                  type="button"
                  onClick={() => setCategoryQuery('')}
                  className="text-xs text-[#176f78] dark:text-teal-400 font-semibold underline cursor-pointer"
                >
                  Reset filter
                </button>
              </div>
            ) : (
              filteredCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer w-full select-none ${
                      isActive
                        ? 'bg-gradient-to-r from-[#176f78] to-[#125860] text-white shadow-xs ring-1 ring-[#176f78]/30 dark:from-[#176f78] dark:to-[#0f464d]'
                        : 'text-[#17343a] dark:text-slate-300 hover:bg-[#f6f2e8] dark:hover:bg-[#232c38] border border-transparent hover:border-[#dfd8cb] dark:hover:border-[#333e4e]'
                    }`}
                  >
                    {/* Active Accent Bar on Left */}
                    {isActive && (
                      <span className="absolute left-1 top-2.5 bottom-2.5 w-1 rounded-full bg-white/90 shadow-2xs" />
                    )}

                    {/* Icon Container with Dual-Tone State */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-2xs'
                          : 'bg-[#f0eae0] dark:bg-[#252e3b] text-[#176f78] dark:text-teal-400 group-hover:bg-[#e6dfd3] dark:group-hover:bg-[#2c3746]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Module Title & Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-xs font-bold truncate">
                          {cat.label}
                        </span>
                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md shrink-0 tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white font-medium'
                              : 'bg-[#eae4d7] dark:bg-[#283240] text-[#527078] dark:text-slate-400'
                          }`}
                        >
                          {cat.badge}
                        </span>
                      </div>
                      <p
                        className={`text-[10px] leading-tight truncate mt-0.5 ${
                          isActive
                            ? 'text-teal-100/85'
                            : 'text-[#527078] dark:text-slate-400'
                        }`}
                      >
                        {cat.description}
                      </p>
                    </div>

                    {/* Interactive Right Chevron Indicator */}
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive
                          ? 'text-white/90 translate-x-0'
                          : 'text-slate-400/40 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Super Admin Tier_0 Root Suite */}
          {isSysAdmin && (
            <div className="pt-2 border-t border-[#ece6d9] dark:border-[#2a3442] mt-1 hidden lg:block">
              <button
                type="button"
                onClick={() => handleSetSection('tier_0')}
                className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer text-amber-950 dark:text-amber-100 bg-gradient-to-r from-amber-50 to-amber-100/60 dark:from-amber-950/40 dark:to-amber-900/30 hover:from-amber-100 hover:to-amber-200/60 dark:hover:from-amber-900/50 dark:hover:to-amber-800/40 border border-amber-300/80 dark:border-amber-700/60 shadow-2xs w-full"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/80 dark:bg-amber-800/60 flex items-center justify-center shrink-0 text-amber-800 dark:text-amber-200">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                      <span>Tier_0 Root Suite</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    </div>
                    <div className="text-[10px] text-amber-800/80 dark:text-amber-300/80 truncate">
                      Full privileged infrastructure
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Desktop Telemetry Strip at Bottom of Rail */}
          <div className="hidden lg:flex items-center justify-between pt-2.5 mt-auto border-t border-[#ece6d9] dark:border-[#2a3442] text-[10px] text-[#527078] dark:text-slate-400 font-mono">
            <span className="truncate">IndexedDB Vault</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
              Ready
            </span>
          </div>
        </nav>

        {/* Right Settings Content Area */}
        <main className="lg:col-span-8 xl:col-span-9 bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-7 shadow-2xs">
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
      )}
    </div>
  );
};
