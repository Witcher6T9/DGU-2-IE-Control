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
  LayoutGrid,
  Radio,
  Tv,
  Sliders,
  Sparkles,
  Grid,
  List,
  ChevronRight,
  Search,
  X,
  MessageSquare,
  DownloadCloud,
  Palette,
  Shield,
  Award,
  Minimize2,
  SlidersHorizontal,
  Maximize2
} from 'lucide-react';
import {
  getStoredAppPageLayout,
  saveStoredAppPageLayout,
  applyLayoutStyling
} from '../utils/layoutManager';
import { TIER_0_MODULES } from './tier0/Tier0CommandHub';
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
  WorkspaceWidthMode
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
import { Tier0CommandHub } from './tier0/Tier0CommandHub';
import { LineDataPage, LineDataSubTab } from './LineDataPage';
import { ChecklistPage, ChecklistSubTab } from './ChecklistPage';
import { LeanToolsPage, LeanToolsSubTab } from './LeanToolsPage';
import { WorldClassManufacturingSection } from './WorldClassManufacturingSection';
import { Reports } from './Reports';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';
import { ZipUpdateInjector } from './ZipUpdateInjector';

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
  | 'all'
  | 'factory'
  | 'display'
  | 'alerts'
  | 'backup'
  | 'security'
  | 'android'
  | 'hubs';

const SquircleIcon: React.FC<{
  bgColor: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ bgColor, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 rounded-[7px] text-[12px]',
    md: 'w-7.5 h-7.5 rounded-[9px] text-[14px]',
    lg: 'w-9 h-9 rounded-[11px] text-[16px]'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} text-white flex items-center justify-center shrink-0 shadow-xs`}
    >
      {children}
    </div>
  );
};

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

  // Global Density & Small Area Modes
  density?: 'compact' | 'comfortable' | 'spacious';
  onSelectDensity?: (density: 'compact' | 'comfortable' | 'spacious') => void;
  workspaceWidth?: WorkspaceWidthMode;
  onSelectWorkspaceWidth?: (width: WorkspaceWidthMode) => void;
  smallAreaFeaturesEnabled?: boolean;
  onToggleSmallAreaFeatures?: () => void;
}

export const SettingsControlCenterPage: React.FC<SettingsControlCenterPageProps> = ({
  profile,
  onUpdateProfile,
  currentTheme,
  onSelectTheme,
  density: propDensity,
  onSelectDensity,
  workspaceWidth: propWorkspaceWidth,
  onSelectWorkspaceWidth,
  smallAreaFeaturesEnabled: propSmallAreaEnabled,
  onToggleSmallAreaFeatures,
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
  onOpenChat,
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
  const isMasterAdmin = isMasterAdminOrAdmin(profile);

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

  // Search filter query across all settings & modules
  const [searchQuery, setSearchQuery] = useState('');

  // Unified internal settings category - defaults to 'all' (Control Center & Overview)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(() => {
    if (activeSection === 'preferences') return 'display';
    return 'all';
  });

  // Global Compact Density & Small Area Mode state
  const [currentDensity, setCurrentDensity] = useState<'compact' | 'comfortable' | 'spacious'>(() => {
    if (propDensity) return propDensity;
    try {
      const cfg = getStoredAppPageLayout();
      return cfg.density || 'comfortable';
    } catch {
      return 'comfortable';
    }
  });

  useEffect(() => {
    if (propDensity) setCurrentDensity(propDensity);
  }, [propDensity]);

  const handleApplyDensity = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    setCurrentDensity(newDensity);
    try {
      const cfg = getStoredAppPageLayout();
      const updated = {
        ...cfg,
        density: newDensity,
        lastUpdated: new Date().toISOString()
      };
      saveStoredAppPageLayout(updated);
      applyLayoutStyling(updated);
    } catch {}
    if (onSelectDensity) onSelectDensity(newDensity);
  };

  // Workspace Width (Adjust blank workspace area on the pages)
  const [currentWorkspaceWidth, setCurrentWorkspaceWidth] = useState<WorkspaceWidthMode>(() => {
    if (propWorkspaceWidth) return propWorkspaceWidth;
    try {
      const cfg = getStoredAppPageLayout();
      return cfg.workspaceWidth || (cfg.density === 'compact' ? 'fluid' : 'maximized');
    } catch {
      return 'maximized';
    }
  });

  useEffect(() => {
    if (propWorkspaceWidth) setCurrentWorkspaceWidth(propWorkspaceWidth);
  }, [propWorkspaceWidth]);

  const handleApplyWorkspaceWidth = (newWidth: WorkspaceWidthMode) => {
    setCurrentWorkspaceWidth(newWidth);
    try {
      const cfg = getStoredAppPageLayout();
      const updated = {
        ...cfg,
        workspaceWidth: newWidth,
        lastUpdated: new Date().toISOString()
      };
      saveStoredAppPageLayout(updated);
      applyLayoutStyling(updated);
    } catch {}
    if (onSelectWorkspaceWidth) onSelectWorkspaceWidth(newWidth);
  };

  // Small Area Features Suite
  const [currentSmallArea, setCurrentSmallArea] = useState<boolean>(() => {
    if (typeof propSmallAreaEnabled === 'boolean') return propSmallAreaEnabled;
    try {
      const cfg = getStoredAppPageLayout();
      return cfg.smallAreaFeaturesEnabled !== false;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (typeof propSmallAreaEnabled === 'boolean') setCurrentSmallArea(propSmallAreaEnabled);
  }, [propSmallAreaEnabled]);

  const handleToggleSmallArea = () => {
    const next = !currentSmallArea;
    setCurrentSmallArea(next);
    try {
      const cfg = getStoredAppPageLayout();
      const updated = {
        ...cfg,
        smallAreaFeaturesEnabled: next,
        lastUpdated: new Date().toISOString()
      };
      saveStoredAppPageLayout(updated);
      applyLayoutStyling(updated);
    } catch {}
    if (onToggleSmallAreaFeatures) onToggleSmallAreaFeatures();
  };

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
      id: 'all' as SettingsCategory,
      label: 'Control Center & Overview',
      description: 'Quick actions, user account, sound & plant summary',
      icon: Settings,
      color: 'bg-gradient-to-br from-[#176f78] via-[#007aff] to-[#5856d6]',
      badge: 'Hub'
    },
    {
      id: 'factory' as SettingsCategory,
      label: 'Plant Identity & Floors',
      description: 'Enterprise name, operating floors, shift lines',
      icon: Factory,
      color: 'bg-[#176f78]',
      badge: `${totalActiveLines} Lines`
    },
    {
      id: 'display' as SettingsCategory,
      label: 'Display & Ergonomics',
      description: 'Daylight Cockpit vs Dark Studio, Compact Density & Small Area modes',
      icon: Sun,
      color: 'bg-[#af52de]',
      badge: currentDensity === 'compact' ? 'Compact' : currentTheme === 'dark' ? 'Night Shift' : 'Light'
    },
    {
      id: 'alerts' as SettingsCategory,
      label: 'Sound & Floor Alerts',
      description: 'Bottleneck alerts and WIP cycle chimes',
      icon: Volume2,
      color: 'bg-[#ff2d55]',
      badge: auditoryAlertsEnabled ? 'Sound On' : 'Muted'
    },
    {
      id: 'backup' as SettingsCategory,
      label: 'Data Vault & Storage',
      description: 'IndexedDB snapshots, backups, restore',
      icon: Database,
      color: 'bg-[#34c759]',
      badge: 'IndexedDB'
    },
    {
      id: 'security' as SettingsCategory,
      label: 'Security & Access',
      description: 'Terminal lockout, RBAC clearances',
      icon: Lock,
      color: 'bg-[#ff3b30]',
      badge: profile.tierId ? profile.tierId.replace('_', ' ').toUpperCase() : 'RBAC'
    },
    {
      id: 'android' as SettingsCategory,
      label: 'System Updates',
      description: 'Platform version, OTA hotfixes, & PWA offline cache',
      icon: DownloadCloud,
      color: 'bg-[#ff9500]',
      badge: 'Up to Date'
    },
    {
      id: 'hubs' as SettingsCategory,
      label: 'Operational Hubs',
      description: 'Datas, Checklist, Lean, WCM, Reports',
      icon: Layers,
      color: 'bg-[#007aff]',
      badge: '6 Hubs'
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
      {/* 1. Header Zone: Clean typography, unboxed metadata, and Spotlight search */}
      <header className="bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-2xs shrink-0">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17343a] dark:text-slate-100 font-display">
                Settings &amp; Control Center
              </h1>
            </div>
            <p className="text-xs text-[#527078] dark:text-slate-400">
              Plant identity, floor topology, live audio alarms, and industrial workspace parameters.
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

        {/* Spotlight Search Bar */}
        <div className="mt-4 pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#527078] dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search settings, plant parameters, floor alerts, tools & workspaces..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] text-xs text-[#17343a] dark:text-slate-100 placeholder:text-[#527078] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#176f78]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Settings Workspace (Full-Width Card-Style System without blank workspace voids) */}
      <div className="w-full max-w-[1500px] mx-auto">
        {/* Settings Content Area */}
        <main className="w-full bg-white dark:bg-[#1c222b] border border-[#d9d2c2] dark:border-[#2e3846] rounded-2xl sm:rounded-3xl p-4 sm:p-5.5 shadow-2xs">
          {/* Backup Msg Banner */}
          {backupMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-semibold text-teal-900 dark:text-teal-200 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span>{backupMsg}</span>
            </div>
          )}

          {/* ========================================================
              SEARCH RESULTS VIEW
          ======================================================== */}
          {searchQuery.trim().length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#527078] dark:text-slate-400 uppercase tracking-wider">
                <span>Search Results</span>
                <span className="font-mono text-[#176f78] dark:text-teal-400">
                  Matches for &ldquo;{searchQuery}&rdquo;
                </span>
              </div>

              {(() => {
                const query = searchQuery.toLowerCase().trim();
                const matchedCategories = categories.filter(
                  c => c.id !== 'all' && (c.label.toLowerCase().includes(query) || c.description.toLowerCase().includes(query))
                );

                const quickActions = [
                  { id: 'sound-toggle', title: 'Acoustic Sound Floor Alerts', subtitle: auditoryAlertsEnabled ? 'Active (Click to Mute)' : 'Muted (Click to Activate)', icon: Volume2, color: 'bg-[#ff2d55]', action: () => onToggleAuditoryAlerts(!auditoryAlertsEnabled), badge: auditoryAlertsEnabled ? 'Active' : 'Muted' },
                  { id: 'theme-toggle', title: 'Night Shift Dark Theme', subtitle: currentTheme === 'dark' ? 'Dark Studio (Click for Daylight)' : 'Daylight Cockpit (Click for Dark)', icon: Sun, color: 'bg-[#af52de]', action: () => onSelectTheme(currentTheme === 'dark' ? 'light' : 'dark'), badge: currentTheme === 'dark' ? 'Night Shift' : 'Light' },
                  { id: 'capacity-calc', title: 'Line Capacity & Pitch Calculator', subtitle: 'Takt time balancing, pitch time, and SAM allocation', icon: Calculator, color: 'bg-[#10b981]', action: () => handleSetSection('capacity'), badge: 'IE Engine' },
                  { id: 'reports-hub', title: 'Shift End Summary & Analytics Reports', subtitle: 'Compile final WIP status, total achieved output, and bottleneck stage names', icon: FileSpreadsheet, color: 'bg-[#007aff]', action: () => handleSetSection('reports'), badge: 'PDF Ready' },
                  { id: 'db-backup', title: 'IndexedDB Vault Snapshot', subtitle: 'Local indexed storage backup and data restore', icon: Database, color: 'bg-[#34c759]', action: handleManualBackupClick, badge: 'IndexedDB' },
                  { id: 'pwa-android', title: 'System Updates & PWA Offline', subtitle: 'OTA hotfixes, service worker precache, and installation package', icon: DownloadCloud, color: 'bg-[#ff9500]', action: () => setActiveCategory('android'), badge: 'Up to Date' }
                ].filter(a => a.title.toLowerCase().includes(query) || a.subtitle.toLowerCase().includes(query));

                const totalMatches = matchedCategories.length + quickActions.length;

                if (totalMatches === 0) {
                  return (
                    <div className="p-8 text-center bg-[#fbfaf6] dark:bg-[#181d24] rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846]">
                      <p className="text-xs text-[#527078] dark:text-slate-400">
                        No settings, tools, or configurations match &ldquo;{searchQuery}&rdquo;
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-3 text-xs text-[#176f78] dark:text-teal-400 font-semibold hover:underline cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {matchedCategories.length > 0 && (
                      <div className="bg-white dark:bg-[#181d24] rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                        <div className="px-4 py-2.5 bg-[#fbfaf6] dark:bg-[#1f2630] text-[11px] font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider">
                          Settings Categories ({matchedCategories.length})
                        </div>
                        {matchedCategories.map(cat => {
                          const Icon = cat.icon;
                          return (
                            <div
                              key={cat.id}
                              onClick={() => {
                                setActiveCategory(cat.id);
                                setSearchQuery('');
                              }}
                              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <SquircleIcon bgColor={cat.color}>
                                  <Icon className="w-4 h-4 text-white" />
                                </SquircleIcon>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                                    {cat.label}
                                  </div>
                                  <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                                    {cat.description}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#176f78]/10 text-[#176f78] dark:text-teal-300">
                                  {cat.badge}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {quickActions.length > 0 && (
                      <div className="bg-white dark:bg-[#181d24] rounded-2xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                        <div className="px-4 py-2.5 bg-[#fbfaf6] dark:bg-[#1f2630] text-[11px] font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider">
                          Quick Controls &amp; Actions ({quickActions.length})
                        </div>
                        {quickActions.map(act => {
                          const Icon = act.icon;
                          return (
                            <div
                              key={act.id}
                              onClick={() => {
                                act.action();
                                setSearchQuery('');
                              }}
                              className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <SquircleIcon bgColor={act.color}>
                                  <Icon className="w-4 h-4 text-white" />
                                </SquircleIcon>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                                    {act.title}
                                  </div>
                                  <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                                    {act.subtitle}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#176f78]/10 text-[#176f78] dark:text-teal-300">
                                  {act.badge}
                                </span>
                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ========================================================
              CARD-STYLE UI DESIGN SYSTEM (Settings Root Overview)
              Grouped card layout with icons, titles, status badges, & navigation arrows
              (Guidelines for Flutter / Jetpack Compose / React Native)
          ======================================================== */}
          {!searchQuery && activeCategory === 'all' && (
            <div className="space-y-6">
              {/* 1. Profile Hero Card (Flutter/Cupertino Card System) */}
              <div
                onClick={() => {
                  if (onOpenUserModal) onOpenUserModal('profile');
                }}
                className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4 cursor-pointer hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#176f78] via-[#007aff] to-[#5856d6] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      {profile?.name
                        ? profile.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'IE'}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181d24]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-[#17343a] dark:text-slate-100 truncate">
                        {profile?.name || 'Ashikur Rahman'}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono tracking-wide bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 border border-[#176f78]/30 shrink-0">
                        {profile?.tierId ? profile.tierId.replace('_', ' ').toUpperCase() : (profile?.role ? profile.role.toUpperCase() : 'IE STAFF')}
                      </span>
                    </div>
                    <p className="text-xs text-[#527078] dark:text-slate-400 truncate mt-0.5">
                      {profile?.jobTitle || 'Industrial Engineering Incharge'} • {profile?.email || 'ashikur.rahman.0971@gmail.com'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#176f78] dark:text-teal-400 mt-1 font-medium">
                      <span>{factoryProfile?.name || 'Debonair LTD'} ({factoryProfile?.unitName || 'Unit-02'})</span>
                      <span>•</span>
                      <span>{totalActiveLines} Active Production Lines</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* 2. Tier_0 Master Suite Banner (System Admin Only) */}
              {isSysAdmin && (
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-950 via-[#0e272c] to-[#09353b] text-white p-4 sm:p-5 border border-teal-500/30 shadow-md space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                          <span>Tier_0 Master Console</span>
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                          ROOT CLEARANCE
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        Schema Forge • Access Matrix • Security Loop • Plant Security • Privacy Vault • Backup Forge • Audit Forensics • Maintenance Hub
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSetSection('tier_0')}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer shadow-sm transition-all shrink-0 self-start sm:self-auto"
                    >
                      <span>Open Tier_0 Suite</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 8 Quick Tools Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIER_0_MODULES.map(mod => {
                      const Icon = mod.icon;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleSetSection('tier_0')}
                          className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-left cursor-pointer group"
                        >
                          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                            <Icon className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">
                              {mod.name}
                            </div>
                            <div className="text-[9px] text-slate-400 font-mono truncate">
                              {mod.badge}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Tactile Quick Controls Grid (iOS Control Center / Android Quick Settings style) */}
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider">
                    Control Center Quick Actions
                  </span>
                  <span className="text-[11px] text-[#176f78] dark:text-teal-400 font-medium">
                    Tactile Floor Controls
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* Sound Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      auditoryAlertsEnabled
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-[#527078] dark:text-slate-400'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                      auditoryAlertsEnabled ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      {auditoryAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">
                      {auditoryAlertsEnabled ? 'Sound On' : 'Muted'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Floor Alerts</span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    type="button"
                    onClick={() => onSelectTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      currentTheme === 'dark'
                        ? 'bg-amber-400/15 border-amber-400/30 text-amber-600 dark:text-amber-400'
                        : 'bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-[#17343a] dark:text-slate-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
                      currentTheme === 'dark' ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {currentTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">
                      {currentTheme === 'dark' ? 'Night Shift' : 'Warm Cream'}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Visual Mode</span>
                  </button>

                  {/* Lock Screen (Admin) */}
                  {isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() => onLockTerminal && onLockTerminal()}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-center leading-tight">Lock Screen</span>
                      <span className="text-[9px] text-slate-400 mt-0.5">PIN Security</span>
                    </button>
                  )}

                  {/* Manual Snapshot */}
                  {isMasterAdmin && (
                    <button
                      type="button"
                      onClick={handleManualBackupClick}
                      disabled={isBackingUp}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                        {isBackingUp ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <HardDrive className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-center leading-tight">
                        {isBackingUp ? 'Backing Up' : 'Snapshot'}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">IndexedDB</span>
                    </button>
                  )}

                  {/* Google Chat */}
                  <button
                    type="button"
                    onClick={() => onOpenChat && onOpenChat()}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] flex items-center justify-center mb-1.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">Google Chat</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Spaces &bull; IE</span>
                  </button>

                  {/* Mobile App & Updates */}
                  <button
                    type="button"
                    onClick={() => setActiveCategory('android')}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border bg-white dark:bg-[#181d24] border-[#d9d2c2] dark:border-[#2e3846] text-[#ff9500] hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[#ff9500] flex items-center justify-center mb-1.5">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">PWA &amp; APK</span>
                    <span className="text-[9px] text-slate-400 mt-0.5">Offline Ready</span>
                  </button>
                </div>
              </div>

              {/* 4. GROUPED CARD SECTIONS (Flutter / Jetpack Compose / React Native Card System) */}
              <div className="space-y-5">
                
                {/* Section 1: Display & Ergonomics */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      Display &amp; Ergonomics
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    {/* Display & Appearance */}
                    <div
                      onClick={() => setActiveCategory('display')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#af52de]">
                          <Palette className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Display &amp; Ergonomics
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Daylight Cockpit vs Dark Studio visual themes &amp; high-contrast modes
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#af52de]/10 text-[#af52de] dark:text-purple-300 border border-[#af52de]/20">
                          {currentTheme === 'dark' ? 'Night Shift' : 'Warm Cream'} · {currentDensity === 'compact' ? 'Compact' : 'Standard'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 2: Factory Operations & Analytics */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      Factory Operations &amp; Production Flow
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    {/* Row 1: Plant Identity */}
                    <div
                      onClick={() => setActiveCategory('factory')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#176f78]">
                          <Factory className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Plant Identity &amp; Operating Floors
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Enterprise name, operating unit designation &amp; floor distribution
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-[#176f78]/10 text-[#176f78] dark:text-teal-300 border border-[#176f78]/20">
                          {totalActiveLines} Lines Active
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>

                    {/* Row 2: Pitch Calculator */}
                    <div
                      onClick={() => handleSetSection('capacity')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#10b981]">
                          <Calculator className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Line Capacity &amp; Pitch Calculator
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Pitch time analysis, takt balancing, and SAM allocation
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Pitch Engine
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>

                    {/* Row 3: Reports & Shift End Summary */}
                    <div
                      onClick={() => handleSetSection('reports')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#007aff]">
                          <FileSpreadsheet className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Shift End Summary &amp; Analytics Reports
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Compile final WIP status, total achieved output, and bottleneck stage names into PDF
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Shift End PDF
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Sound & Acoustic Floor Alerts */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      Floor Alarms &amp; Sound Alerts
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    <div
                      onClick={() => setActiveCategory('alerts')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#ff2d55]">
                          <Volume2 className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Acoustic Chimes &amp; Floor Warnings
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Bottleneck alert tone and high WIP buffer cycle chimes with audio test
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                          auditoryAlertsEnabled
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-transparent'
                        }`}>
                          {auditoryAlertsEnabled ? 'Active' : 'Muted'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Data Vault & Storage Systems */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      Data Vault &amp; Storage Systems
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    <div
                      onClick={() => setActiveCategory('backup')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#34c759]">
                          <Database className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            IndexedDB Storage &amp; JSON Snapshots
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Local encrypted vault, scheduled snapshots, CSV exports, &amp; zero-loss restore
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          IndexedDB
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 5: Security & Governance */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      Security &amp; Governance
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    {/* Row 1: Security & RBAC */}
                    <div
                      onClick={() => setActiveCategory('security')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#ff3b30]">
                          <Lock className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            Security Clearances &amp; Terminal Lockdown
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Role-based access controls (RBAC), PIN screen protection, &amp; session timers
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          {profile.tierId ? profile.tierId.replace('_', ' ').toUpperCase() : 'RBAC'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>

                    {/* Row 2: Tier_0 Root Command (System Admin Only) */}
                    {isSysAdmin && (
                      <div
                        onClick={() => handleSetSection('tier_0')}
                        className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-teal-500/5 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <SquircleIcon bgColor="bg-[#09353b]">
                            <ShieldCheck className="w-4 h-4 text-teal-400" />
                          </SquircleIcon>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-teal-900 dark:text-teal-300 truncate group-hover:text-teal-600 dark:group-hover:text-teal-200 transition-colors">
                              Tier_0 Root Command Suite
                            </div>
                            <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                              Schema Forge, Access Matrix, Plant Security, &amp; Deep System Controls
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                            Root Active
                          </span>
                          <ChevronRight className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 6: System Updates & Workspaces */}
                <div>
                  <div className="px-1 mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#527078] dark:text-slate-400 uppercase tracking-wider font-mono">
                      System Updates &amp; Workspaces
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#181d24] rounded-2xl sm:rounded-3xl border border-[#d9d2c2] dark:border-[#2e3846] shadow-2xs overflow-hidden divide-y divide-[#e7e1d5] dark:divide-[#2e3846]">
                    {/* Row 1: System Updates */}
                    <div
                      onClick={() => setActiveCategory('android')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#ff9500]">
                          <DownloadCloud className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            System Updates
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Offline service worker cache, OTA updates, &amp; APK package
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          Up to Date
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>

                    {/* Row 2: Operational Hubs */}
                    <div
                      onClick={() => setActiveCategory('hubs')}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#fbfaf6] dark:hover:bg-[#232a34] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor="bg-[#007aff]">
                          <Layers className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#17343a] dark:text-slate-100 truncate group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors">
                            IE Operational Workspaces &amp; Launchpad
                          </div>
                          <div className="text-xs text-[#527078] dark:text-slate-400 truncate">
                            Direct jump into Line Data, Check List, Lean Tools, WCM, Reports, &amp; Capacity
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          6 Hubs
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#176f78] dark:group-hover:text-teal-400 transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Return Breadcrumb Bar when drilled into a specific category */}
          {!searchQuery && activeCategory !== 'all' && (
            <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#e7e1d5] dark:border-[#2e3846]">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] text-xs font-semibold text-[#17343a] dark:text-slate-200 hover:text-[#176f78] hover:border-[#176f78] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Settings Overview</span>
              </button>
              <div className="flex items-center gap-2 text-xs font-mono text-[#527078] dark:text-slate-400">
                <span>Settings</span>
                <span>/</span>
                <span className="font-bold text-[#17343a] dark:text-slate-200">
                  {categories.find(c => c.id === activeCategory)?.label}
                </span>
              </div>
            </div>
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

              {/* Shop Floor Density & Small Area Mode Selector */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Shop Floor Density &amp; Small Area Modes</span>
                    </h3>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                      Adjust workspace density, eliminate empty blank voids, and enable small area features for multi-line tracking.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#176f78]/10 text-[#176f78] dark:text-teal-300 border border-[#176f78]/25 self-start sm:self-auto">
                    Active: {currentDensity === 'compact' ? 'Compact / Small Area' : currentDensity === 'spacious' ? 'Spacious / Wall TV' : 'Standard Comfortable'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Mode 1: Compact Density (Small Area View) */}
                  <button
                    type="button"
                    onClick={() => handleApplyDensity('compact')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentDensity === 'compact'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <Minimize2 className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Compact (Small Area)</span>
                      </div>
                      {currentDensity === 'compact' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      Tight padding, zero wasted blank space, compact multi-station micro-meters, condensed tables, and 34-line single-screen oversight.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-[#176f78] dark:text-teal-300 font-bold">
                      <span>• Tight Margins</span>
                      <span>• Small Area</span>
                    </div>
                  </button>

                  {/* Mode 2: Comfortable Standard */}
                  <button
                    type="button"
                    onClick={() => handleApplyDensity('comfortable')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentDensity === 'comfortable'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Standard Comfortable</span>
                      </div>
                      {currentDensity === 'comfortable' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      Balanced spatial rhythm, standard touch target padding (44px), comfortable spacing for frontline tablet operations.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span>• Balanced Touch</span>
                      <span>• 44px Targets</span>
                    </div>
                  </button>

                  {/* Mode 3: Spacious */}
                  <button
                    type="button"
                    onClick={() => handleApplyDensity('spacious')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentDensity === 'spacious'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <Maximize2 className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Spacious (Wall Display)</span>
                      </div>
                      {currentDensity === 'spacious' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      Expanded padding and large metric numerals tailored for high-mounted shop floor TV screens and executive briefings.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span>• Overhead TVs</span>
                      <span>• Large Text</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Adjust Blank Workspace Area on Pages Section */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-[#176f78]" />
                      <span>Adjust Blank Workspace Area on Pages</span>
                    </h3>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                      Control page width and margins to eliminate empty dead space on laptops, monitors, and shop displays.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 self-start sm:self-auto">
                    Layout: {currentWorkspaceWidth === 'fluid' ? 'Full Width Fluid (Zero Blank Margins)' : currentWorkspaceWidth === 'maximized' ? 'Maximized (97% Screen Width)' : 'Centered Standard (1500px Boxed)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Full Width Fluid */}
                  <button
                    type="button"
                    onClick={() => handleApplyWorkspaceWidth('fluid')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentWorkspaceWidth === 'fluid'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <Maximize2 className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Full Width Fluid</span>
                      </div>
                      {currentWorkspaceWidth === 'fluid' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      100% Edge-to-edge layout. Completely eliminates empty left and right blank borders. Ideal for multi-column data grids and line plans.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-[#176f78] dark:text-teal-300 font-bold">
                      <span>• Zero Blank Margins</span>
                      <span>• 100% Screen</span>
                    </div>
                  </button>

                  {/* Option 2: Maximized Ultra-Wide */}
                  <button
                    type="button"
                    onClick={() => handleApplyWorkspaceWidth('maximized')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentWorkspaceWidth === 'maximized'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <Sliders className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Maximized (97% Wide)</span>
                      </div>
                      {currentWorkspaceWidth === 'maximized' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      Slim micro-gutters with 97% width coverage. Expansive layout that removes dead space while maintaining clean visual framing.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span>• Slim Gutters</span>
                      <span>• Optimal Cockpit</span>
                    </div>
                  </button>

                  {/* Option 3: Centered Standard */}
                  <button
                    type="button"
                    onClick={() => handleApplyWorkspaceWidth('standard')}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative ${
                      currentWorkspaceWidth === 'standard'
                        ? 'border-[#176f78] bg-[#176f78]/10 dark:bg-teal-950/40 text-[#17343a] dark:text-white ring-2 ring-[#176f78]/30 shadow-xs'
                        : 'border-[#d9d2c2] dark:border-[#2e3846] bg-[#fbfaf6] dark:bg-[#181d24] hover:bg-white dark:hover:bg-[#202732] text-[#527078] dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#17343a] dark:text-slate-100">
                        <Minimize2 className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                        <span>Centered Standard</span>
                      </div>
                      {currentWorkspaceWidth === 'standard' && (
                        <CheckCircle2 className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#527078] dark:text-slate-400">
                      Traditional 1500px centered canvas with standard side gutters. Suitable for smaller laptop displays or reading workflows.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#e7e1d5] dark:border-[#2e3846] flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                      <span>• 1500px Boxed</span>
                      <span>• Classic Margins</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Small Area Features System-Wide Suite */}
              <div className="pt-4 border-t border-[#e7e1d5] dark:border-[#2e3846] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Small Area Features System-Wide Suite</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase font-mono bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                        Automatic
                      </span>
                    </h3>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5">
                      Automatically detects viewport dimensions and device constraints to engage micro-chips, collapsible selectors, and zero-void data cards without manual intervention.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleSmallArea}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer self-start sm:self-auto flex items-center gap-1.5 ${
                      currentSmallArea
                        ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35 ring-1 ring-emerald-500/20'
                        : 'bg-slate-100 dark:bg-[#181d24] text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${currentSmallArea ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                    <span>{currentSmallArea ? 'Automatic (Active)' : 'Manual Mode'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17343a] dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collapsible Small Area Selector Bar</span>
                    </div>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 leading-relaxed">
                      Merges plant scope, wings, blocks, and 34 line tags into an expandable 28px micro-strip that folds away to preserve screen space.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-[#181d24] border border-[#d9d2c2] dark:border-[#2e3846] space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#17343a] dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Zero Void &amp; Blank Space Reduction</span>
                    </div>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 leading-relaxed">
                      Removes empty margins between widgets, tightens table cell paddings to 0.3rem, and compresses headers so 34 lines fit without excessive scrolling.
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
              CATEGORY 6: SYSTEM UPDATES
          ======================================================== */}
          {activeCategory === 'android' && (
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#e7e1d5] dark:border-[#2e3846] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] dark:text-slate-100 flex items-center gap-2">
                    <DownloadCloud className="w-4 h-4 text-[#176f78]" />
                    <span>System Updates</span>
                  </h2>
                  <p className="text-xs text-[#527078] dark:text-slate-400 mt-0.5">
                    Platform version, OTA hotfixes, service worker cache, and Android deployment.
                  </p>
                </div>
                {onOpenAndroidPackage && (
                  <button
                    type="button"
                    onClick={onOpenAndroidPackage}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Direct OTA Install</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-white text-emerald-900 font-black">
                      v2.4.2
                    </span>
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

              {/* Zip File Injector on System Updates Pusher */}
              <div className="mt-4">
                <ZipUpdateInjector
                  variant="embedded"
                  onOpenAndroidPackageModal={onOpenAndroidPackage}
                />
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
