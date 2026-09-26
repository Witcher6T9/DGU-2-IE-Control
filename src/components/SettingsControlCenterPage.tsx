/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Sliders,
  Factory,
  Network,
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
  Sparkles,
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
  ArrowUpRight
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
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
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

  const [activeSubTab, setActiveSubTab] = useState<string>('factory');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupMsg, setBackupMsg] = useState<string | null>(null);

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

  const masterSections = [
    {
      id: 'control-center' as SettingsPageSection,
      label: 'Control Center & Plant',
      shortLabel: 'Control Center',
      icon: Sliders,
      badge: 'Core'
    },
    {
      id: 'line-data' as SettingsPageSection,
      label: 'Line Data Operations Hub',
      shortLabel: 'Line Data Hub',
      icon: Layers,
      badge: `${totalActiveLines} Lines`
    },
    {
      id: 'checklist' as SettingsPageSection,
      label: 'Check List & Floor Compliance Hub',
      shortLabel: 'Check List Hub',
      icon: CheckSquare,
      badge: `${checklistProgress}%`
    },
    {
      id: 'lean-tools' as SettingsPageSection,
      label: 'Lean Tools & Industrial Engineering Cockpit',
      shortLabel: 'Lean Tools & IE',
      icon: Wrench,
      badge: '13 WCM'
    },
    {
      id: 'capacity' as SettingsPageSection,
      label: 'Line Capacity & Pitch Calculator',
      shortLabel: 'Capacity Calc',
      icon: Calculator,
      badge: 'IE Tool'
    },
    {
      id: 'reports' as SettingsPageSection,
      label: 'Reports & Production Analytics',
      shortLabel: 'Reports Hub',
      icon: FileSpreadsheet,
      badge: 'CSV/PDF'
    },
    {
      id: 'world' as SettingsPageSection,
      label: 'World Class Manufacturing (WCM)',
      shortLabel: 'World (WCM)',
      icon: Globe,
      badge: 'Global'
    },
    {
      id: 'preferences' as SettingsPageSection,
      label: 'Preferences & Display',
      shortLabel: 'Preferences',
      icon: Settings,
      badge: undefined
    },
    ...(isSysAdmin
      ? [
          {
            id: 'tier_0' as SettingsPageSection,
            label: 'Tier_0 Root Command',
            shortLabel: 'Tier_0 Only',
            icon: ShieldCheck,
            badge: 'Root'
          }
        ]
      : [])
  ];

  return (
    <div className="space-y-4">
      {/* Top Page Header with Settings & Tools Hub Navigation - Shown for Control Center, Preferences & Tier 0, clean full-screen for operational workspaces */}
      {(activeSection === 'control-center' || activeSection === 'preferences' || activeSection === 'tier_0') && (
        <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-3 sm:p-4 shadow-2xs">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#176f78] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display flex items-center gap-2">
                    <span>Settings &amp; Operations Cockpit</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-[#176f78]/10 text-[#176f78] font-bold border border-[#176f78]/25">
                      All Modules Integrated
                    </span>
                  </h1>
                  <p className="text-xs text-[#527078]">
                    Plant configuration, Line Data, Floor Checklists, Lean Tools, Reports &amp; Analytics, World Class (WCM), and Preferences.
                  </p>
                </div>
              </div>

              {/* Quick Plant Badge */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-xl bg-white border border-[#d9d2c2] text-xs flex items-center gap-1.5 shadow-2xs">
                  <Factory className="w-3.5 h-3.5 text-[#176f78]" />
                  <span className="font-bold text-[#17343a]">{factoryProfile?.name || 'Debonair LTD'}</span>
                  <span className="text-[#527078] font-mono">({factoryProfile?.unitName || 'Unit-02'})</span>
                </div>
              </div>
            </div>

            {/* Master Section Selector Pills: Line Data, Checklist, Lean Tools, World WCM, Control Center, Preferences */}
            <div className="flex items-center gap-1 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2] overflow-x-auto scrollbar-none">
              {masterSections.map(tab => {
                const Icon = tab.icon;
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      handleSetSection(tab.id);
                      if (tab.id === 'control-center') setActiveSubTab('factory');
                      if (tab.id === 'preferences') setActiveSubTab('theme');
                    }}
                    title={tab.label}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap touch-manipulation active:scale-95 ${
                      isActive
                        ? 'bg-[#176f78] text-white shadow-xs'
                        : 'text-slate-600 hover:text-[#176f78] hover:bg-white/50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden min-[480px]:inline">{tab.shortLabel}</span>
                    <span className="min-[480px]:hidden">{tab.shortLabel.split(' ')[0]}</span>
                    {tab.badge && (
                      <span
                        className={`text-[9.5px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-[#176f78] border border-[#d9d2c2]'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1: LINE DATA OPERATIONS HUB */}
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

      {/* SECTION 2: CHECK LIST & FLOOR COMPLIANCE HUB */}
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
          onAddTodoFromAudit={onAddTodoFromAudit}
          initialSubTab={checklistSubTab}
        />
      )}

      {/* SECTION 3: LEAN TOOLS & INDUSTRIAL ENGINEERING COCKPIT */}
      {activeSection === 'lean-tools' && (
        <LeanToolsPage
          actions={leanActions}
          onUpdateActions={onUpdateLeanActions}
          profile={profile}
          lines={lines}
          onSaveLine={onSaveLine}
          selectedLineNo={selectedLineNo}
          onSelectLineNo={onSelectLineNo}
          onApplySimulationToLine={onApplySimulationToLine}
          onAddNewLineWithSimulation={onAddNewLineWithSimulation}
          onNavigate={onNavigate}
          initialSubTab={leanToolsSubTab}
        />
      )}

      {/* SECTION 4: WORLD CLASS MANUFACTURING (WCM) & STANDARDS */}
      {activeSection === 'world' && (
        <WorldClassManufacturingSection
          lines={lines}
          profile={profile}
          onNavigateToTool={toolId => {
            if (toolId === 'lean-tools') handleSetSection('lean-tools');
            if (toolId === 'line-data') handleSetSection('line-data');
            if (toolId === 'checklist') handleSetSection('checklist');
            if (toolId === 'reports') handleSetSection('reports');
          }}
        />
      )}

      {/* SECTION 5: REPORTS & PRODUCTION ANALYTICS HUB */}
      {activeSection === 'reports' && (
        <Reports
          lines={lines}
          todayDate={activeDate || '2026-09-24'}
          activeDate={activeDate}
          onSelectDate={onSelectDate}
          activeFloor={activeFloor}
          onSelectFloor={onSelectFloor}
          checklists={checklists}
          profile={profile}
          onNavigate={onNavigate}
          onDeleteFloor={onDeleteFloor}
          onImportLines={onImportLines}
          onOpenDatabase={onOpenDatabase}
        />
      )}

      {/* SECTION 6: CAPACITY CALCULATOR WORKSPACE (TRANSFERRED FROM LEAN TOOLS) */}
      {activeSection === 'capacity' && (
        <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
          <CapacityCalculatorWorkspace
            onBack={() => handleSetSection('control-center')}
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSaveLine={onSaveLine}
            actions={leanActions}
            onUpdateActions={onUpdateLeanActions}
            profile={profile}
          />
        </div>
      )}

      {/* SECTION 7: CONTROL CENTER & PLANT PROFILE */}
      {activeSection === 'control-center' && (
        <div className="space-y-4">
          {/* Sub-navigation bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'factory', label: 'Plant & Factory Profile', icon: Factory },
              { id: 'rbac', label: 'IE Org & RBAC Tiers', icon: Network },
              { id: 'backup', label: 'Data Hub & Backup', icon: Database },
              { id: 'security', label: 'Floor Security & Lock', icon: Lock }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#176f78] border border-[#176f78] shadow-xs'
                      : 'bg-[#fbfaf6] text-slate-600 border border-[#d9d2c2] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Plant Profile Sub-view */}
          {activeSubTab === 'factory' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Factory className="w-4 h-4 text-[#176f78]" />
                    <span>Enterprise Plant Identity</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Unit-02 manufacturing facility configuration and active floor buildings.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-[#176f78]/10 text-[#176f78] border border-[#176f78]/25">
                  UNIT-02 ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078] uppercase">Company / Group</div>
                  <div className="text-base font-bold text-[#17343a] mt-1 font-display">
                    {factoryProfile?.name || 'Debonair LTD'}
                  </div>
                  <div className="text-xs text-[#527078] mt-0.5">
                    Sector: {factoryProfile?.industrySector || 'Apparel & Garment Manufacturing (RMG)'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078] uppercase">Active Unit</div>
                  <div className="text-base font-bold text-[#17343a] mt-1 font-display">
                    {factoryProfile?.unitName || 'Unit-02 Manufacturing Complex'}
                  </div>
                  <div className="text-xs text-[#527078] mt-0.5">
                    Location: Gorai, Mirzapur, Tangail, Bangladesh
                  </div>
                </div>
              </div>

              {/* Floors Overview */}
              <div>
                <h3 className="text-xs font-bold text-[#17343a] uppercase tracking-wider mb-2">
                  Operating Production Floors ({totalActiveLines} Lines)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { name: 'Padma', lines: 'Lines 01 - 06', color: 'bg-blue-50 border-blue-200 text-blue-900' },
                    { name: 'Meghna', lines: 'Lines 07 - 12', color: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
                    { name: 'Karnophuli', lines: 'Lines 13 - 17', color: 'bg-amber-50 border-amber-200 text-amber-900' },
                    { name: 'Korotoya', lines: 'Lines 18 - 23', color: 'bg-purple-50 border-purple-200 text-purple-900' },
                    { name: 'Shitalokshya', lines: 'Lines 24 - 29', color: 'bg-teal-50 border-teal-200 text-teal-900' },
                    { name: 'Turag', lines: 'Lines 30 - 34', color: 'bg-rose-50 border-rose-200 text-rose-900' }
                  ].map(f => (
                    <div key={f.name} className={`p-3 rounded-xl border ${f.color} text-center`}>
                      <div className="font-bold text-xs">{f.name}</div>
                      <div className="text-[10px] opacity-80 mt-0.5">{f.lines}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Featured Transferred Tool: Line Capacity Calculator */}
              <div
                id="featured-capacity-calculator-banner"
                onClick={() => handleSetSection('capacity')}
                className="p-4 sm:p-5 rounded-3xl bg-linear-to-r from-[#0c4a60] via-[#176f78] to-[#12555c] text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                    <Calculator className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase tracking-wide">
                        CENTRALIZED IN SETTINGS
                      </span>
                      <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">
                        Production Planning &amp; Pitch Takt
                      </span>
                    </div>
                    <h2 className="text-lg font-extrabold text-white tracking-tight">
                      Line Capacity Calculator
                    </h2>
                    <p className="text-xs text-cyan-100 max-w-xl">
                      Input total machine hours and planned SMV to determine theoretical daily production capacity, pitch takt time, and delivery targets.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="px-4 py-2 rounded-xl bg-white text-[#0c4a60] font-extrabold text-xs shadow-xs group-hover:bg-cyan-50 transition-colors flex items-center gap-1.5">
                    <span>Launch Calculator</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* Integrated Operational Hubs Directory (Transferred to Settings) */}
              <div className="pt-2 border-t border-[#e7e1d5]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#17343a] uppercase tracking-wider">
                      Integrated Operational Hubs
                    </h3>
                    <p className="text-[11px] text-[#527078]">
                      All frontline manufacturing and engineering tools centralized in Settings.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    6 Hubs Centralized
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'line-data' as SettingsPageSection,
                      title: 'Line Data Operations Hub',
                      desc: `${totalActiveLines} sewing lines telemetry, Yamazumi balancing, hourly pacing, and loss Pareto.`,
                      icon: Layers,
                      badge: `${totalActiveLines} Lines`,
                      color: 'text-[#176f78] bg-[#176f78]/10'
                    },
                    {
                      id: 'checklist' as SettingsPageSection,
                      title: 'Check List & Floor Compliance',
                      desc: '12-point daily verification routine, action tracker, 5-whys, and 5S centerline audits.',
                      icon: CheckSquare,
                      badge: `${checklistProgress}% Complete`,
                      color: 'text-emerald-700 bg-emerald-50'
                    },
                    {
                      id: 'lean-tools' as SettingsPageSection,
                      title: 'Lean Tools & IE Simulator',
                      desc: '13 lean manufacturing methods, Kaizen workshops, SMV tuning, and flow simulator.',
                      icon: Wrench,
                      badge: '13 Methods',
                      color: 'text-amber-700 bg-amber-50'
                    },
                    {
                      id: 'capacity' as SettingsPageSection,
                      title: 'Capacity & Pitch Calculator',
                      desc: 'Theoretical daily output, pitch takt time, machine hours balance, and order delivery planning.',
                      icon: Calculator,
                      badge: 'IE Tool',
                      color: 'text-amber-700 bg-amber-50'
                    },
                    {
                      id: 'reports' as SettingsPageSection,
                      title: 'Reports & Production Analytics',
                      desc: 'Consolidated executive shift summaries, production matrix, and CSV / PDF exports.',
                      icon: FileSpreadsheet,
                      badge: 'Export Hub',
                      color: 'text-teal-700 bg-teal-50'
                    },
                    {
                      id: 'world' as SettingsPageSection,
                      title: 'World Class Manufacturing (WCM)',
                      desc: '5 WCM pillars, TPM, SMED, Poka-Yoke, and zero-defect quality benchmarks.',
                      icon: Globe,
                      badge: 'Global WCM',
                      color: 'text-indigo-700 bg-indigo-50'
                    }
                  ].map(hub => {
                    const HubIcon = hub.icon;
                    return (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => handleSetSection(hub.id)}
                        className="p-3.5 rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] hover:bg-white hover:border-[#176f78] transition-all text-left group cursor-pointer shadow-2xs hover:shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${hub.color}`}>
                              <HubIcon className="w-4 h-4" />
                            </div>
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white border border-[#d9d2c2] text-[#17343a]">
                              {hub.badge}
                            </span>
                          </div>
                          <div className="font-bold text-xs text-[#17343a] group-hover:text-[#176f78] transition-colors">
                            {hub.title}
                          </div>
                          <p className="text-[11px] text-[#527078] mt-1 leading-relaxed">
                            {hub.desc}
                          </p>
                        </div>
                        <div className="pt-2.5 mt-2.5 border-t border-[#e7e1d5] flex items-center justify-between text-[11px] font-bold text-[#176f78]">
                          <span>Launch Operational Hub</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* RBAC Sub-view */}
          {activeSubTab === 'rbac' && (
            <div className="space-y-4">
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
          )}

          {/* Backup Sub-view */}
          {activeSubTab === 'backup' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#176f78]" />
                    <span>Local Data Management &amp; Snapshots</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    IndexedDB storage, automated hourly snapshots, and CSV/Excel backup.
                  </p>
                </div>
                <button
                  onClick={handleManualBackupClick}
                  disabled={isBackingUp}
                  className="px-3.5 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? 'animate-spin' : ''}`} />
                  <span>Snapshot Now</span>
                </button>
              </div>

              {backupMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{backupMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">IndexedDB State</div>
                  <div className="text-sm font-bold text-[#17343a] mt-1 font-mono">{totalActiveLines} Lines Loaded</div>
                  <div className="text-[10px] text-emerald-700 font-bold mt-1">Status: Synced &amp; Clean</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">Auto-Backup Interval</div>
                  <div className="text-sm font-bold text-[#17343a] mt-1 font-mono">Daily (05:00 PM)</div>
                  <div className="text-[10px] text-[#527078] mt-1">Retention: 30 snapshots</div>
                </div>

                <div className="p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <div className="text-[11px] font-bold text-[#527078]">Factory Defaults</div>
                  <button
                    onClick={onResetFactoryDefaults}
                    className="mt-1 text-xs font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Debonair Set</span>
                  </button>
                  <div className="text-[10px] text-[#527078] mt-1">Restores 24-Sep baseline</div>
                </div>
              </div>

              {onOpenDatabase && (
                <div className="pt-2">
                  <button
                    onClick={() => onOpenDatabase('backup')}
                    className="w-full py-2.5 rounded-xl border border-[#176f78] text-[#176f78] hover:bg-[#176f78]/10 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4" />
                    <span>Open Advanced Data &amp; Telemetry Hub</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Security Sub-view */}
          {activeSubTab === 'security' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#176f78]" />
                    <span>Floor Terminal Security &amp; Access</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Terminal lockout, PIN protection, and operator shift clearance.
                  </p>
                </div>
                {onLockTerminal && (
                  <button
                    onClick={onLockTerminal}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Terminal Now</span>
                  </button>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700" />
                <span>
                  Current active session authenticated for: <strong>{profile.name}</strong> ({profile.jobTitle || 'Industrial Engineer'}).
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 6: PREFERENCES & DISPLAY */}
      {activeSection === 'preferences' && (
        <div className="space-y-4">
          {/* Sub-navigation bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'theme', label: 'Theme & Display', icon: Sun },
              { id: 'alerts', label: 'Audio & Alerts', icon: Volume2 },
              { id: 'android', label: 'PWA & Android App', icon: Smartphone }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#176f78] border border-[#176f78] shadow-xs'
                      : 'bg-[#fbfaf6] text-slate-600 border border-[#d9d2c2] hover:bg-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Sub-view */}
          {activeSubTab === 'theme' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e1d5] pb-4">
                <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                  <Sun className="w-4 h-4 text-[#176f78]" />
                  <span>Theme &amp; Visual Appearance</span>
                </h2>
                <p className="text-xs text-[#527078] mt-0.5">
                  Choose the optimal color palette for shop floor visibility or office audit reviews.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => onSelectTheme('light')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    currentTheme === 'light'
                      ? 'border-[#176f78] bg-[#176f78]/5 ring-2 ring-[#176f78]/20'
                      : 'border-[#d9d2c2] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17343a] flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" /> Light Cockpit (Default)
                    </span>
                    {currentTheme === 'light' && <CheckCircle2 className="w-4 h-4 text-[#176f78]" />}
                  </div>
                  <p className="text-xs text-[#527078] mt-1">
                    Warm ergonomic shop floor daylight mode optimized for factory tablets.
                  </p>
                </button>

                <button
                  onClick={() => onSelectTheme('dark')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    currentTheme === 'dark'
                      ? 'border-[#176f78] bg-slate-900 text-white ring-2 ring-[#176f78]/20'
                      : 'border-[#d9d2c2] bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17343a] flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-400" /> Dark Studio
                    </span>
                    {currentTheme === 'dark' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-[#527078] mt-1">
                    Low-glare high contrast theme for night shifts and control room monitors.
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Audio Alerts Sub-view */}
          {activeSubTab === 'alerts' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="border-b border-[#e7e1d5] pb-4">
                <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-[#176f78]" />
                  <span>Auditory Alert Settings</span>
                </h2>
                <p className="text-xs text-[#527078] mt-0.5">
                  Real-time audio signals when line efficiency drops below threshold or bottleneck chokes.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#17343a]">Sound on Bottleneck Choke</div>
                  <div className="text-xs text-[#527078]">Plays harmonic chime when cycle time exceeds takt</div>
                </div>
                <button
                  onClick={() => onToggleAuditoryAlerts(!auditoryAlertsEnabled)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    auditoryAlertsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {auditoryAlertsEnabled ? 'ENABLED' : 'MUTED'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => playBottleneckAlertSound()}
                  className="px-3.5 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-[#176f78]" />
                  <span>Test Bottleneck Alert Sound</span>
                </button>
                <button
                  onClick={() => playWipAlertSound()}
                  className="px-3.5 py-2 rounded-xl bg-[#f1eee6] border border-[#d9d2c2] text-xs font-bold text-[#17343a] hover:bg-[#e7e1d5] flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 text-amber-600" />
                  <span>Test WIP Alert Sound</span>
                </button>
              </div>
            </div>
          )}

          {/* Android & PWA Sub-view */}
          {activeSubTab === 'android' && (
            <div className="bg-white rounded-2xl border border-[#d9d2c2] p-5 sm:p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-[#e7e1d5] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#17343a] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#176f78]" />
                    <span>Android TWA &amp; PWA Installation</span>
                  </h2>
                  <p className="text-xs text-[#527078] mt-0.5">
                    Deploy as native Android APK on floor tablets with Digital Asset Links.
                  </p>
                </div>
                {onOpenAndroidPackage && (
                  <button
                    onClick={onOpenAndroidPackage}
                    className="px-3.5 py-1.5 rounded-xl bg-[#176f78] text-white text-xs font-bold hover:bg-[#12555c] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Package Wizard</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <span className="font-bold text-[#17343a]">Package ID:</span>
                  <div className="font-mono text-slate-600 mt-1">com.debonair.iedailycontrol</div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#fbfaf6] border border-[#d9d2c2]">
                  <span className="font-bold text-[#17343a]">Digital Asset Links:</span>
                  <div className="font-mono text-emerald-700 mt-1">Verified SHA-256 Fingerprint</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: TIER_0 ONLY ROOT CONTROL - STRICTLY VISIBLE ONLY WHEN isSystemAdmin(profile) === true */}
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
};
