/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy, useRef, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BottomNav } from './components/BottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { FloorWipSparkline } from './components/FloorWipSparkline';
import { initAuth } from './lib/firebaseAuth';
import { Sparkles, Bot, MessageSquare, Activity, AlertTriangle, Flame, X, Video, Copy, Check, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import {
  LineEntry,
  ChecklistMap,
  ChecklistStatus,
  TodoItem,
  ScheduleItem,
  LeanActionItem,
  UserProfile,
  RoleTier,
  DashboardLayout,
  NotificationItem,
  SyncState,
  ThemeType,
  SaveStatus,
  PrivacySecuritySettings,
  SecurityAuditEntry,
  FactoryIndustryProfile,
  UserDailyBackupSettings,
  DailyBackupRecord,
  AppPageLayoutConfig,
  WorkspaceWidthMode,
  TopBarConfig,
  LineBookingRecord
} from './types';
import {
  DEFAULT_DAILY_BACKUP_SETTINGS,
  saveBackupToIndexedDB,
  shouldRunScheduledBackup,
  pruneOldBackups,
  AppBackupState
} from './utils/indexedDbBackup';
import {
  getStoredAppPageLayout,
  saveStoredAppPageLayout,
  applyLayoutStyling,
  initAutomaticSmallAreaObserver,
  getStoredTopBarConfig,
  saveStoredTopBarConfig
} from './utils/layoutManager';
import { TopBarCustomizationModal } from './components/TopBarCustomizationModal';
import { SystemUpdateReceiver } from './components/SystemUpdateReceiver';
import {
  getStoredActiveFactory,
  setStoredActiveFactory,
  getStoredSavedFactories,
  setStoredSavedFactories
} from './data/factoryProfiles';
import type { SettingsTab } from './components/SettingsModal';
import {
  ALL_IMPORTED_DEBONAIR_LINES,
  DEBONAIR_SEPTEMBER_24_DATE,
  DEBONAIR_SEPTEMBER_23_DATE,
  DEBONAIR_SEPTEMBER_22_DATE,
  DEBONAIR_SEPTEMBER_21_DATE,
  DEBONAIR_AVAILABLE_DATES
} from './data/importedDebonairData';
import {
  INITIAL_TODOS,
  SL_TASK_TODOS,
  INITIAL_SCHEDULES,
  INITIAL_LEAN_ACTIONS,
  INITIAL_NOTIFICATIONS,
  CHECKLIST_TASK_COUNT,
  ROLE_TIERS,
  DEFAULT_USER_PROFILE,
  SYSTEM_ADMIN_PROFILE,
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeChecklistStatuses
} from './mockData';
import { SYSTEM_ADMIN_EMAIL, isSystemAdmin } from './utils/rbac';
import {
  generateDefaultChecklists,
  getTodayDateStr,
  calculateScorecardMetrics,
  calculateStyleWipThreshold
} from './utils';
import { playAuditoryAlert } from './utils/audioAlert';
import { isSystemOffline, setSystemOffline, ensureOnlineReady, logOfflineActivity } from './utils/offlineSyncManager';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Code-split secondary tabs for fast initial boot with automatic retry on stale chunks
const DailyChecklist = lazyWithRetry(() => import('./components/DailyChecklist').then(m => ({ default: m.DailyChecklist })));
const TodoSchedule = lazyWithRetry(() => import('./components/TodoSchedule').then(m => ({ default: m.TodoSchedule })));
const LineData = lazyWithRetry(() => import('./components/LineData').then(m => ({ default: m.LineData })));
const LeanToolkit = lazyWithRetry(() => import('./components/LeanToolkit').then(m => ({ default: m.LeanToolkit })));
const MonthlySummary = lazyWithRetry(() => import('./components/MonthlySummary').then(m => ({ default: m.MonthlySummary })));
const IESimulator = lazyWithRetry(() => import('./components/IESimulator').then(m => ({ default: m.IESimulator })));
const FloorPlanLineSetup = lazyWithRetry(() => import('./components/FloorPlanLineSetup').then(m => ({ default: m.FloorPlanLineSetup })));
const LineProductionHistoryView = lazyWithRetry(() => import('./components/LineProductionHistoryView').then(m => ({ default: m.LineProductionHistoryView })));
const ActiveOperationalTiers = lazyWithRetry(() => import('./components/ActiveOperationalTiers').then(m => ({ default: m.ActiveOperationalTiers })));

// 5 Canonical Primary Page Components
const LineDataPage = lazyWithRetry(() => import('./components/LineDataPage').then(m => ({ default: m.LineDataPage })));
const ChecklistPage = lazyWithRetry(() => import('./components/ChecklistPage').then(m => ({ default: m.ChecklistPage })));
const LeanToolsPage = lazyWithRetry(() => import('./components/LeanToolsPage').then(m => ({ default: m.LeanToolsPage })));
const SettingsControlCenterPage = lazyWithRetry(() => import('./components/SettingsControlCenterPage').then(m => ({ default: m.SettingsControlCenterPage })));
const NewDowntimeModal = lazyWithRetry(() => import('./components/NewDowntimeModal').then(m => ({ default: m.NewDowntimeModal })));
const NewActionModal = lazyWithRetry(() => import('./components/NewActionModal').then(m => ({ default: m.NewActionModal })));
import {
  AutoRefreshEngineConfig,
  getStoredAutoRefreshConfig,
  saveStoredAutoRefreshConfig
} from './utils/autoRefreshConfig';
import { playTelemetryHeartbeatChime } from './utils/audioAlert';
import { AutoRefreshEngineCustomizerModal } from './components/AutoRefreshEngineCustomizerModal';
import { QuickHourlyProductionModal, HourlyProductionUpdatePayload } from './components/QuickHourlyProductionModal';
import { MobileQuickActionFAB } from './components/MobileQuickActionFAB';

import {
  INITIAL_STATIONS,
  INITIAL_HOURLY_DATA,
  INITIAL_DOWNTIME_LOG,
  INITIAL_ACTIONS,
  INITIAL_FIVE_WHYS,
  INITIAL_5S_AUDIT,
  INITIAL_CENTERLINES
} from './data/mockData';
import {
  StationData,
  HourlyOutput,
  DowntimeIncident,
  ActionItem,
  FiveWhyInvestigation,
  AuditCheckItem,
  CenterlineAuditItem
} from './types/dcs';
import type { LineDataSubTab } from './components/LineDataPage';
import type { ChecklistSubTab } from './components/ChecklistPage';
import type { LeanToolsSubTab } from './components/LeanToolsPage';
import type { SettingsPageSection } from './components/SettingsControlCenterPage';
import type { ZeroTrustAuthMode } from './components/AuthPage';

// Code-split modals loaded strictly on-demand
const AuthPage = lazyWithRetry(() => import('./components/AuthPage').then(m => ({ default: m.AuthPage })));
const SettingsModal = lazyWithRetry(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const UserModal = lazyWithRetry(() => import('./components/UserModal').then(m => ({ default: m.UserModal })));
const NotificationsModal = lazyWithRetry(() => import('./components/NotificationsModal').then(m => ({ default: m.NotificationsModal })));
const DatabaseModal = lazyWithRetry(() => import('./components/DatabaseModal').then(m => ({ default: m.DatabaseModal })));
const PerformanceScorecardModal = lazyWithRetry(() => import('./components/PerformanceScorecardModal').then(m => ({ default: m.PerformanceScorecardModal })));
const GoogleChatHubModal = lazyWithRetry(() => import('./components/GoogleChatHubModal').then(m => ({ default: m.GoogleChatHubModal })));
const PrivacySecurityModal = lazyWithRetry(() => import('./components/PrivacySecurityModal').then(m => ({ default: m.PrivacySecurityModal })));
const TerminalLockScreen = lazyWithRetry(() => import('./components/TerminalLockScreen').then(m => ({ default: m.TerminalLockScreen })));
const AndroidPackageModal = lazyWithRetry(() => import('./components/AndroidPackageModal').then(m => ({ default: m.AndroidPackageModal })));
const LineBookingAndBudgetModal = lazyWithRetry(() => import('./components/LineBookingAndBudgetModal').then(m => ({ default: m.LineBookingAndBudgetModal })));

function TabLoadingSkeleton() {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center gap-3 animate-pulse">
      <div className="w-11 h-11 rounded-2xl bg-[#176f78]/10 border border-[#176f78]/25 flex items-center justify-center shadow-xs">
        <div className="w-5 h-5 border-2 border-[#176f78] border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs font-semibold text-[#527078] tracking-wider uppercase">Loading Workspace Module...</p>
    </div>
  );
}

export default function App() {
  const todayStr = getTodayDateStr();

  // Navigation State
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'datas' || tab === 'data' || tab === 'linedata' || tab === 'lines') return 'settings';
      if (tab === 'components' || tab === 'visualizer' || tab === 'uiux' || tab === 'ui-ux') return 'settings';
      if (tab === 'tier_0' || tab === '0_tier' || tab === 'master-console' || tab === 'tier-0' || tab === 'forge') return 'settings';
      if (tab) return tab;
    } catch {}
    return 'dashboard';
  });
  const [selectedLineNo, setSelectedLineNo] = useState<string>('18');
  const [selectedChecklistDate, setSelectedChecklistDate] = useState<string>(DEBONAIR_SEPTEMBER_24_DATE);
  const [activeDate, setActiveDate] = useState<string>(DEBONAIR_SEPTEMBER_24_DATE);
  const [activeFloor, setActiveFloor] = useState<string>('all');
  const [activeDataset, setActiveDataset] = useState<string>('debonair_sep24');

  // Sub-tabs for the 5 Canonical Pages
  const [lineDataSubTab, setLineDataSubTab] = useState<LineDataSubTab>('lines');
  const [checklistSubTab, setChecklistSubTab] = useState<ChecklistSubTab>('daily-checklist');
  const [leanToolsSubTab, setLeanToolsSubTab] = useState<LeanToolsSubTab>('toolkit');
  const [settingsSection, setSettingsSection] = useState<SettingsPageSection>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'datas' || tab === 'data' || tab === 'linedata' || tab === 'lines') return 'line-data';
      if (tab === 'checklist') return 'checklist';
      if (tab === 'lean-tools' || tab === 'lean') return 'lean-tools';
      if (tab === 'components' || tab === 'visualizer' || tab === 'uiux' || tab === 'ui-ux') return 'components';
      if (tab === 'tier_0' || tab === '0_tier' || tab === 'master-console' || tab === 'tier-0' || tab === 'forge') return 'tier_0';
    } catch {}
    return 'control-center';
  });

  // DCS Interactive Data State
  const [stations, setStations] = useState<StationData[]>(INITIAL_STATIONS);
  const [hourlyData, setHourlyData] = useState<HourlyOutput[]>(INITIAL_HOURLY_DATA);
  const [downtimeLog, setDowntimeLog] = useState<DowntimeIncident[]>(INITIAL_DOWNTIME_LOG);
  const [actionItems, setActionItems] = useState<ActionItem[]>(INITIAL_ACTIONS);
  const [fiveWhys, setFiveWhys] = useState<FiveWhyInvestigation[]>(INITIAL_FIVE_WHYS);
  const [auditChecks, setAuditChecks] = useState<AuditCheckItem[]>(INITIAL_5S_AUDIT);
  const [centerlines, setCenterlines] = useState<CenterlineAuditItem[]>(INITIAL_CENTERLINES);

  // Modals for Downtime and Action Items
  const [isNewDowntimeModalOpen, setIsNewDowntimeModalOpen] = useState(false);
  const [isNewActionModalOpen, setIsNewActionModalOpen] = useState(false);

  // Line Booking for Upcoming Styles & Monthly Budget Modal State
  const [isLineBookingModalOpen, setIsLineBookingModalOpen] = useState(false);
  const [lineBookingInitialTab, setLineBookingInitialTab] = useState<'booking' | 'budget'>('booking');

  const handleOpenLineBookingModal = React.useCallback((tab: 'booking' | 'budget' = 'booking') => {
    setLineBookingInitialTab(tab);
    setIsLineBookingModalOpen(true);
  }, []);

  const handleSyncLinesWithBookings = React.useCallback((bookingsToSync: LineBookingRecord[]) => {
    if (!bookingsToSync || bookingsToSync.length === 0) return;

    setLines(prev => {
      const updated = [...prev];
      bookingsToSync.forEach(b => {
        const bLineNoNorm = b.lineNo.toLowerCase().replace(/[^0-9a-z]/g, '');
        const idx = updated.findIndex(
          l => l.lineNo.toLowerCase().replace(/[^0-9a-z]/g, '') === bLineNoNorm
        );
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            nextStyle: b.style,
            nextStyleDate: b.startDate,
            buyer: b.buyer || updated[idx].buyer,
            orderQty: b.orderQty || updated[idx].orderQty
          };
        }
      });
      return updated;
    });

    setNotifications(prev => [
      {
        id: `notif-sync-bookings-${Date.now()}`,
        title: `Bookings Synced: ${bookingsToSync.length} Schedule(s)`,
        message: `Synchronized upcoming style loading schedule and order quantities with active line registry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'sync'
      },
      ...prev
    ]);
  }, []);

  // Save Status Indicator for Header ('idle' | 'saving' | 'saved')
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const isInitialLinesMount = React.useRef(true);
  const isInitialChecklistsMount = React.useRef(true);
  const saveTimeoutRef = React.useRef<any>(null);
  const idleTimeoutRef = React.useRef<any>(null);

  const notifySave = React.useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus('saved');
      idleTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2500);
    }, 400);
  }, []);

  // Helper to identify and purge removed legacy unit floors
  const isLegacyUnitFloor = (floor?: string) => {
    if (!floor) return false;
    const f = floor.trim();
    return (
      f === 'Floor 02 / Unit A' ||
      f === 'Floor 01 / Unit B' ||
      f === 'Floor 01 / Unit A' ||
      f === 'Floor 02 / Unit B' ||
      /Floor 0[12]\s*\/\s*Unit\s*[AB]/i.test(f)
    );
  };

  // Core Data States with LocalStorage Persistence
  const [lines, setLines] = useState<LineEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ie_lines_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out any legacy dummy baseline sample entries and removed legacy unit floors
          const filtered = parsed.filter(
            (item: any) =>
              !isLegacyUnitFloor(item.floor) &&
              !(
                item.id >= 1 &&
                item.id <= 5 &&
                ['18', '19', '20', '21', '24'].includes(String(item.lineNo))
              )
          );
          // Check which imported dates are present
          const existingDates = new Set(filtered.map((item: any) => item.date));
          const missingImported = ALL_IMPORTED_DEBONAIR_LINES.filter(
            item => !existingDates.has(item.date)
          );
          const finalResult = missingImported.length > 0
            ? [...missingImported, ...filtered]
            : (filtered.length > 0 ? filtered : ALL_IMPORTED_DEBONAIR_LINES);

          // If legacy items were purged or new imported dates added, sync to localStorage
          if (finalResult.length !== parsed.length || missingImported.length > 0) {
            try {
              localStorage.setItem('ie_lines_data', JSON.stringify(finalResult));
            } catch {}
          }
          return finalResult;
        }
      }
      return ALL_IMPORTED_DEBONAIR_LINES;
    } catch {
      return ALL_IMPORTED_DEBONAIR_LINES;
    }
  });

  const [checklists, setChecklists] = useState<ChecklistMap>(() => {
    try {
      const saved = localStorage.getItem('ie_checklists_data');
      return saved ? JSON.parse(saved) : generateDefaultChecklists();
    } catch {
      return generateDefaultChecklists();
    }
  });

  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = localStorage.getItem('ie_todos_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const existingIds = new Set(parsed.map((todo: TodoItem) => todo.id));
          return [
            ...parsed,
            ...SL_TASK_TODOS.filter(todo => !existingIds.has(todo.id))
          ];
        }
      }
      return [...INITIAL_TODOS, ...SL_TASK_TODOS];
    } catch {
      return [...INITIAL_TODOS, ...SL_TASK_TODOS];
    }
  });

  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    try {
      const saved = localStorage.getItem('ie_schedules_data');
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  const [leanActions, setLeanActions] = useState<LeanActionItem[]>(() => {
    try {
      const saved = localStorage.getItem('ie_lean_actions');
      return saved ? JSON.parse(saved) : INITIAL_LEAN_ACTIONS;
    } catch {
      return INITIAL_LEAN_ACTIONS;
    }
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('ie_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email && parsed.email.toLowerCase().includes('realmec85pro231')) {
          localStorage.removeItem('ie_user_profile');
          return DEFAULT_USER_PROFILE;
        }
        return parsed;
      }
      return DEFAULT_USER_PROFILE;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  });

  const [theme, setTheme] = useState<ThemeType>(() => {
    try {
      return (localStorage.getItem('ie_theme') as ThemeType) || 'light';
    } catch {
      return 'light';
    }
  });

  const [layout, setLayout] = useState<DashboardLayout>(() => {
    try {
      const saved = localStorage.getItem('ie_dashboard_layout');
      return saved ? JSON.parse(saved) : DEFAULT_DASHBOARD_LAYOUT;
    } catch {
      return DEFAULT_DASHBOARD_LAYOUT;
    }
  });

  const [appPageLayout, setAppPageLayout] = useState<AppPageLayoutConfig>(() => getStoredAppPageLayout());

  useEffect(() => {
    applyLayoutStyling(appPageLayout);
    const cleanupAutoSmallArea = initAutomaticSmallAreaObserver();
    const handler = (e: any) => {
      if (e.detail) {
        setAppPageLayout(e.detail);
        if (e.detail.dashboard) {
          setLayout(e.detail.dashboard);
        }
      }
    };
    window.addEventListener('debonair:layout_changed', handler);
    return () => {
      cleanupAutoSmallArea();
      window.removeEventListener('debonair:layout_changed', handler);
    };
  }, []);

  const handleToggleDensity = () => {
    const currentDensity = appPageLayout.density || 'comfortable';
    const nextDensity: 'compact' | 'comfortable' = currentDensity === 'compact' ? 'comfortable' : 'compact';
    const updated: AppPageLayoutConfig = {
      ...appPageLayout,
      density: nextDensity,
      lastUpdated: new Date().toISOString()
    };
    setAppPageLayout(updated);
    saveStoredAppPageLayout(updated);
    applyLayoutStyling(updated);
  };

  const handleSelectDensity = (newDensity: 'compact' | 'comfortable' | 'spacious') => {
    const updated: AppPageLayoutConfig = {
      ...appPageLayout,
      density: newDensity,
      lastUpdated: new Date().toISOString()
    };
    setAppPageLayout(updated);
    saveStoredAppPageLayout(updated);
    applyLayoutStyling(updated);
  };

  const handleSelectWorkspaceWidth = (newWidth: WorkspaceWidthMode) => {
    const updated: AppPageLayoutConfig = {
      ...appPageLayout,
      workspaceWidth: newWidth,
      lastUpdated: new Date().toISOString()
    };
    setAppPageLayout(updated);
    saveStoredAppPageLayout(updated);
    applyLayoutStyling(updated);
  };

  const handleToggleSmallAreaFeatures = () => {
    const next = appPageLayout.smallAreaFeaturesEnabled === false ? true : false;
    const updated: AppPageLayoutConfig = {
      ...appPageLayout,
      smallAreaFeaturesEnabled: next,
      lastUpdated: new Date().toISOString()
    };
    setAppPageLayout(updated);
    saveStoredAppPageLayout(updated);
    applyLayoutStyling(updated);
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Auditory Floor Alert Settings (Acoustic alert for high WIP and bottleneck breaches)
  const [auditoryAlertsEnabled, setAuditoryAlertsEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('ie_auditory_alerts');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const knownActiveBreachesRef = React.useRef<Set<string>>(new Set());
  const isInitialMonitorRunRef = React.useRef<boolean>(true);

  useEffect(() => {
    try {
      localStorage.setItem('ie_auditory_alerts', JSON.stringify(auditoryAlertsEnabled));
    } catch {}
  }, [auditoryAlertsEnabled]);

  // Sync state (Initialized to Offline - Connection Off)
  const [syncState, setSyncState] = useState<SyncState>({
    status: isSystemOffline() ? 'offline' : 'connected',
    latencyMs: isSystemOffline() ? 0 : 24,
    lastSyncTime: new Date().toISOString()
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTab>('all');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState<'profile' | 'roles'>('profile');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const [databaseInitialTab, setDatabaseInitialTab] = useState<'backup' | 'csv-import' | 'cloud-vault' | 'offline-log'>('backup');
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFloorSnapshotOpen, setIsFloorSnapshotOpen] = useState(false);
  const [isSnapshotCopied, setIsSnapshotCopied] = useState(false);
  const [snapshotLastRefreshed, setSnapshotLastRefreshed] = useState<Date>(() => new Date());
  const [snapshotCountdown, setSnapshotCountdown] = useState<number>(10);
  const [isSnapshotRefreshing, setIsSnapshotRefreshing] = useState<boolean>(false);
  const [autoRefreshConfig, setAutoRefreshConfig] = useState<AutoRefreshEngineConfig>(() => getStoredAutoRefreshConfig());
  const [isAutoRefreshCustomizerOpen, setIsAutoRefreshCustomizerOpen] = useState(false);
  const [isHourlyProductionModalOpen, setIsHourlyProductionModalOpen] = useState(false);
  const longPressTimerRef = useRef<any>(null);
  const isLongPressTriggeredRef = useRef<boolean>(false);
  const [isPrivacySecurityOpen, setIsPrivacySecurityOpen] = useState(false);
  const [isAndroidPackageModalOpen, setIsAndroidPackageModalOpen] = useState(false);
  const [isAuthPageOpen, setIsAuthPageOpen] = useState(false);
  const [authPageInitialMode, setAuthPageInitialMode] = useState<ZeroTrustAuthMode>('sign_in');

  const handleOpenAuth = (mode: ZeroTrustAuthMode = 'sign_in') => {
    setAuthPageInitialMode(mode);
    setIsAuthPageOpen(true);
  };
  const [topBarConfig, setTopBarConfig] = useState<TopBarConfig>(() => getStoredTopBarConfig());
  const [isTopBarCustomizerOpen, setIsTopBarCustomizerOpen] = useState(false);

  useEffect(() => {
    const handleTopBarChanged = (e: any) => {
      if (e.detail) {
        setTopBarConfig(e.detail);
      }
    };
    window.addEventListener('ie_top_bar_config_changed', handleTopBarChanged);
    return () => window.removeEventListener('ie_top_bar_config_changed', handleTopBarChanged);
  }, []);

  const handleSaveTopBarConfig = (updated: TopBarConfig) => {
    setTopBarConfig(updated);
    saveStoredTopBarConfig(updated);
  };

  // Enterprise Factory & Industry Profile State
  const [factoryProfile, setFactoryProfile] = useState<FactoryIndustryProfile>(() => getStoredActiveFactory());
  const [savedFactories, setSavedFactories] = useState<FactoryIndustryProfile[]>(() => getStoredSavedFactories());
  const [floorSetupInitialSubView, setFloorSetupInitialSubView] = useState<'floor-plan' | 'line-setup' | 'drag-drop' | 'split-view' | 'factory'>('floor-plan');

  useEffect(() => {
    ensureOnlineReady();
  }, []);

  useEffect(() => {
    setStoredActiveFactory(factoryProfile);
  }, [factoryProfile]);

  useEffect(() => {
    setStoredSavedFactories(savedFactories);
  }, [savedFactories]);

  // Synchronize Auto-Refresh Engine config across components
  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail) {
        setAutoRefreshConfig(e.detail);
      }
    };
    window.addEventListener('debonair:autorefresh_config_changed', handler);
    return () => window.removeEventListener('debonair:autorefresh_config_changed', handler);
  }, []);

  const handleUpdateAutoRefreshConfig = (newConfig: AutoRefreshEngineConfig) => {
    setAutoRefreshConfig(newConfig);
    saveStoredAutoRefreshConfig(newConfig);
    setSnapshotCountdown(newConfig.intervalSeconds);
  };

  const handleUpdateFactoryProfile = (updated: FactoryIndustryProfile) => {
    setFactoryProfile(updated);
    setSavedFactories(prev => {
      const idx = prev.findIndex(f => f.id === updated.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  };

  const handleSaveFactoryList = (list: FactoryIndustryProfile[]) => {
    setSavedFactories(list);
  };

  const handleOpenFactorySettings = () => {
    setFloorSetupInitialSubView('factory');
    setLineDataSubTab('floor-plan');
    setSettingsSection('control-center');
    setCurrentTab('settings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Track peak production shift hours (08:00 - 19:00 floor operations)
  const [isPeakHour, setIsPeakHour] = useState<boolean>(() => {
    const hour = new Date().getHours();
    return hour >= 8 && hour < 19;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      setIsPeakHour(hour >= 8 && hour < 19);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Privacy & Security Controls
  const [privacySettings, setPrivacySettings] = useState<PrivacySecuritySettings>(() => {
    try {
      const saved = localStorage.getItem('ie_privacy_security_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      privacyModeEnabled: false,
      blurSensitiveProductionFigures: false,
      autoLockMinutes: 15,
      pinLockEnabled: true,
      pinCode: '1234',
      isLocked: false,
      dataEncryptionNoticeAcknowledged: true
    };
  });

  const [securityAuditTrail, setSecurityAuditTrail] = useState<SecurityAuditEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ie_security_audit_trail');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'audit-init-1',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'System Boot & Telemetry',
        details: 'IE Operational Cockpit initialized with factory local state encryption.',
        severity: 'info',
        user: 'Lead IE'
      },
      {
        id: 'audit-init-2',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Floor Telemetry Handshake',
        details: 'Debonair Unit-02 line registry verified with zero anomalies.',
        severity: 'info',
        user: 'System'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('ie_privacy_security_settings', JSON.stringify(privacySettings));
    } catch {}
  }, [privacySettings]);

  useEffect(() => {
    try {
      localStorage.setItem('ie_security_audit_trail', JSON.stringify(securityAuditTrail));
    } catch {}
  }, [securityAuditTrail]);

  // Automated IndexedDB Daily Backup State & Settings
  const [dailyBackupSettings, setDailyBackupSettings] = useState<UserDailyBackupSettings>(() => {
    try {
      const saved = localStorage.getItem('ie_daily_backup_settings');
      if (saved) return { ...DEFAULT_DAILY_BACKUP_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Error reading backup settings:', e);
    }
    return DEFAULT_DAILY_BACKUP_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ie_daily_backup_settings', JSON.stringify(dailyBackupSettings));
    } catch (e) {
      console.warn('Error saving backup settings:', e);
    }
  }, [dailyBackupSettings]);

  // Daily automated IndexedDB backup trigger worker
  const handleTriggerDailyBackup = React.useCallback(
    async (triggerType: 'scheduled' | 'manual' | 'startup' = 'scheduled') => {
      try {
        const backupState: AppBackupState = {
          lines,
          checklists,
          todos,
          leanActions,
          metadata: {
            appVersion: '2.4.0',
            factoryName: factoryProfile?.name ? `${factoryProfile.name} (${factoryProfile.unitName})` : 'Debonair Unit-02',
            activeDate: activeDate || todayStr,
            exportedBy: profile.name || 'IE Automation'
          }
        };

        const record = await saveBackupToIndexedDB(backupState, triggerType);

        // Prune older snapshots if retention limit is specified
        if (dailyBackupSettings.backupRetentionDays > 0) {
          await pruneOldBackups(dailyBackupSettings.backupRetentionDays);
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayDateStr = `${year}-${month}-${day}`;

        setDailyBackupSettings(prev => ({
          ...prev,
          lastBackupDate: todayDateStr,
          lastBackupTimestamp: now.getTime(),
          lastBackupStatus: 'success',
          lastBackupSummary: `${record.stats.linesCount} lines, ${record.stats.checklistsDaysCount} days checklists, ${record.stats.todosCount} tasks (${record.stats.sizeFormatted})`
        }));

        setNotifications(prev => [
          {
            id: `notif-backup-${Date.now()}`,
            title: triggerType === 'scheduled' ? 'Scheduled Daily Backup Complete' : 'Local IndexedDB Backup Saved',
            message: `Snapshot preserved ${record.stats.linesCount} lines, ${record.stats.checklistsDaysCount} checklist days, and ${record.stats.todosCount} floor tasks (${record.stats.sizeFormatted}) in browser IndexedDB.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            type: 'sync',
            lineNo: 'System'
          },
          ...prev
        ]);

        return record;
      } catch (err: any) {
        console.error('Automated IndexedDB backup error:', err);
        setDailyBackupSettings(prev => ({
          ...prev,
          lastBackupStatus: 'failed',
          lastBackupSummary: err?.message || 'Storage error'
        }));
        throw err;
      }
    },
    [lines, checklists, todos, leanActions, factoryProfile, activeDate, todayStr, profile.name, dailyBackupSettings.backupRetentionDays]
  );

  // Periodic scheduler check (runs every 30 seconds and on window focus)
  useEffect(() => {
    if (!dailyBackupSettings.autoDailyBackupEnabled) return;

    const runScheduledCheck = () => {
      if (shouldRunScheduledBackup(dailyBackupSettings, false)) {
        handleTriggerDailyBackup('scheduled');
      }
    };

    // Startup check (runs if app opened after the scheduled daily hour)
    if (shouldRunScheduledBackup(dailyBackupSettings, true)) {
      handleTriggerDailyBackup('startup');
    }

    const intervalId = setInterval(runScheduledCheck, 30000); // Check every 30 seconds
    window.addEventListener('focus', runScheduledCheck);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', runScheduledCheck);
    };
  }, [dailyBackupSettings, handleTriggerDailyBackup]);

  // Terminal Lockout Handlers
  const handleLockTerminal = () => {
    setPrivacySettings(prev => ({ ...prev, isLocked: true }));
    setSecurityAuditTrail(prev => [
      {
        id: `audit-lock-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Manual Terminal Lockout',
        details: 'User initiated quick security lockout on shop floor terminal.',
        severity: 'security',
        user: profile.name || 'Lead IE'
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleUnlockTerminal = (elevateToAdmin?: boolean) => {
    setPrivacySettings(prev => ({ ...prev, isLocked: false }));
    if (elevateToAdmin) {
      setProfile(SYSTEM_ADMIN_PROFILE);
      try {
        localStorage.setItem('ie_user_profile', JSON.stringify(SYSTEM_ADMIN_PROFILE));
      } catch (e) {
        console.warn('Profile persistence error:', e);
      }
      setSecurityAuditTrail(prev => [
        {
          id: `audit-unlock-admin-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'Terminal Unlocked (Master Admin Elevation)',
          details: 'Master Passcode verified. Elevated to System Admin (Ashikur Rahman).',
          severity: 'security',
          user: SYSTEM_ADMIN_PROFILE.name
        },
        ...prev.slice(0, 49)
      ]);
      return;
    }

    setSecurityAuditTrail(prev => [
      {
        id: `audit-unlock-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action: 'Terminal Unlocked',
        details: 'PIN verification successful. Workstation access resumed.',
        severity: 'info',
        user: profile.name || 'Lead IE'
      },
      ...prev.slice(0, 49)
    ]);
  };

  const handleClearCache = () => {
    localStorage.removeItem('ie_dashboard_lines');
    localStorage.removeItem('ie_daily_checklists');
    localStorage.removeItem('ie_floor_todos');
    window.location.reload();
  };

  // Auto-lock inactivity listener
  useEffect(() => {
    if (privacySettings.autoLockMinutes <= 0 || privacySettings.isLocked) return;

    let timeoutId: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setPrivacySettings(prev => ({ ...prev, isLocked: true }));
        setSecurityAuditTrail(prev => [
          {
            id: `audit-autolock-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            action: 'Inactivity Auto-Lock',
            details: `Workstation locked after ${privacySettings.autoLockMinutes} minutes of inactivity.`,
            severity: 'security',
            user: profile.name || 'Engineer'
          },
          ...prev.slice(0, 49)
        ]);
      }, privacySettings.autoLockMinutes * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [privacySettings.autoLockMinutes, privacySettings.isLocked, profile.name]);

  // Auto-sync authenticated Google user identity with active profile
  useEffect(() => {
    const unsubscribe = initAuth((authUser) => {
      if (authUser) {
        const isSysAdmin = isSystemAdmin({ email: authUser.email || '' });
        setProfile(prev => {
          const updated: UserProfile = {
            ...prev,
            name: isSysAdmin ? SYSTEM_ADMIN_PROFILE.name : (prev.googleUid === authUser.uid && prev.name ? prev.name : (authUser.displayName || prev.name)),
            email: authUser.email || prev.email,
            photoURL: authUser.photoURL || (isSysAdmin ? SYSTEM_ADMIN_PROFILE.photoURL : prev.photoURL),
            googleUid: authUser.uid,
            role: isSysAdmin ? 'admin' : prev.role,
            tierId: isSysAdmin ? 'tier_0' : prev.tierId,
            jobTitle: isSysAdmin ? 'System Administrator (Root Operations)' : prev.jobTitle,
            assignedUnit: isSysAdmin ? (SYSTEM_ADMIN_PROFILE.assignedUnit || 'Debonair LTD (Unit-02) — Master Administration') : prev.assignedUnit,
            shift: isSysAdmin ? (SYSTEM_ADMIN_PROFILE.shift || '24/7 Root Operations & System Control') : prev.shift,
            assignedWing: isSysAdmin ? 'All' : prev.assignedWing
          };
          try {
            localStorage.setItem('ie_user_profile', JSON.stringify(updated));
          } catch (e) {
            console.warn('Profile cache error:', e);
          }
          return updated;
        });
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // System Role Tiers (editable & persistent across app)
  const [roleTiers, setRoleTiers] = useState<RoleTier[]>(() => {
    try {
      const saved = localStorage.getItem('ie_role_tiers_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return ROLE_TIERS;
    } catch {
      return ROLE_TIERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ie_role_tiers_data', JSON.stringify(roleTiers));
    } catch (e) {
      console.error('Failed to persist role tiers:', e);
    }
  }, [roleTiers]);

  const handleUpdateRoleTiers = React.useCallback((updatedTiers: RoleTier[]) => {
    setRoleTiers(updatedTiers);
    notifySave();
  }, [notifySave]);

  const handleOpenUserModal = (tab: 'profile' | 'roles' = 'profile') => {
    setUserModalTab(tab);
    setIsUserModalOpen(true);
  };

  const handleOpenDatabase = (tab: 'backup' | 'csv-import' | 'cloud-vault' | 'offline-log' = 'backup') => {
    setDatabaseInitialTab(tab);
    setIsDatabaseOpen(true);
  };

  // Overall IE Effectiveness Scorecard Result
  const scorecardResult = React.useMemo(() => {
    return calculateScorecardMetrics(lines, checklists, selectedChecklistDate);
  }, [lines, checklists, selectedChecklistDate]);

  // Apply theme to body with smooth transition
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
      document.documentElement.classList.toggle('dark', theme !== 'light');
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      try {
        localStorage.setItem('ie_theme', theme);
      } catch {}
      const timer = setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [theme]);

  // One-time sanitization to purge removed legacy floors ('Floor 02 / Unit A', 'Floor 01 / Unit B', 'Floor 01 / Unit A')
  useEffect(() => {
    setLines(prev => {
      const hasLegacy = prev.some(l => isLegacyUnitFloor(l.floor));
      if (hasLegacy) {
        const cleaned = prev.filter(l => !isLegacyUnitFloor(l.floor));
        try {
          localStorage.setItem('ie_lines_data', JSON.stringify(cleaned));
        } catch {}
        return cleaned;
      }
      return prev;
    });
  }, []);

  // Persist lines with save indicator notification
  useEffect(() => {
    if (isInitialLinesMount.current) {
      isInitialLinesMount.current = false;
      return;
    }
    notifySave();
    try {
      localStorage.setItem('ie_lines_data', JSON.stringify(lines));
    } catch {}
  }, [lines, notifySave]);

  // Persist checklists with save indicator notification
  useEffect(() => {
    if (isInitialChecklistsMount.current) {
      isInitialChecklistsMount.current = false;
      return;
    }
    notifySave();
    try {
      localStorage.setItem('ie_checklists_data', JSON.stringify(checklists));
    } catch {}
  }, [checklists, notifySave]);

  // Persist todos
  useEffect(() => {
    try {
      localStorage.setItem('ie_todos_data', JSON.stringify(todos));
    } catch {}
  }, [todos]);

  // Persist schedules
  useEffect(() => {
    try {
      localStorage.setItem('ie_schedules_data', JSON.stringify(schedules));
    } catch {}
  }, [schedules]);

  // Persist lean actions
  useEffect(() => {
    try {
      localStorage.setItem('ie_lean_actions', JSON.stringify(leanActions));
    } catch {}
  }, [leanActions]);

  // Persist profile
  useEffect(() => {
    try {
      localStorage.setItem('ie_user_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  // Persist layout
  useEffect(() => {
    try {
      localStorage.setItem('ie_dashboard_layout', JSON.stringify(layout));
    } catch {}
  }, [layout]);

  // Periodic simulated telemetry ping - strictly respects offline status
  useEffect(() => {
    const updateStatus = () => {
      const offline = isSystemOffline();
      setSyncState({
        status: offline ? 'offline' : 'connected',
        latencyMs: offline ? 0 : Math.floor(18 + Math.random() * 16),
        lastSyncTime: new Date().toISOString()
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 12000);
    const handleStatusEvt = (e: any) => {
      const offline = typeof e.detail?.isOffline === 'boolean' ? e.detail.isOffline : isSystemOffline();
      setSyncState({
        status: offline ? 'offline' : 'connected',
        latencyMs: offline ? 0 : 24,
        lastSyncTime: new Date().toISOString()
      });
    };

    window.addEventListener('ie_offline_status_change', handleStatusEvt);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ie_offline_status_change', handleStatusEvt);
    };
  }, []);

  // WIP Level & Bottleneck Monitoring Notification & Auditory Alert Trigger
  // Monitors in-line WIP levels and critical workstation bottlenecks across all lines.
  // Flags alerts in NotificationsModal and triggers auditory alert chimes when enabled.
  useEffect(() => {
    let newlyBreachedType: 'bottleneck' | 'wip' | null = null;
    const currentBreachedSet = new Set<string>();

    setNotifications(prevNotifications => {
      let hasChanges = false;
      const updated = [...prevNotifications];

      lines.forEach(line => {
        // --- 1. Style WIP Buffer Threshold Monitoring ---
        const wipInfo = calculateStyleWipThreshold(line);
        const wipAlertId = `wip-alert-line-${line.lineNo}`;

        if (wipInfo.isBreached) {
          currentBreachedSet.add(wipAlertId);
          if (!knownActiveBreachesRef.current.has(wipAlertId) && !isInitialMonitorRunRef.current) {
            newlyBreachedType = newlyBreachedType || 'wip';
          }

          const existingIdx = updated.findIndex(n => n.id === wipAlertId);
          const alertItem: NotificationItem = {
            id: wipAlertId,
            title: `High WIP Alert: Line ${line.lineNo} (${line.style})`,
            message: `Current In-Line WIP (${line.wip} pcs) exceeds the calculated style buffer threshold of ${wipInfo.threshold} pcs by +${wipInfo.overloadPcs} pcs (Target: ${line.targetProd} pcs @ ${wipInfo.hourlyTarget} pcs/hr, ${wipInfo.bufferHours}h buffer allowance). Bottleneck station '${line.bottleneck?.station || 'Main'}' cycle time is ${line.bottleneck?.cycleTime || 0}s vs ${line.bottleneck?.targetCT || 0}s target. Immediate Kanban line rebalance required.`,
            type: 'alert',
            timestamp: existingIdx !== -1 ? updated[existingIdx].timestamp : new Date().toISOString(),
            read: existingIdx !== -1 ? updated[existingIdx].read : false,
            lineNo: line.lineNo,
            targetRole: 'Line IE / Production Supervisor'
          };

          if (existingIdx === -1) {
            updated.unshift(alertItem);
            hasChanges = true;
          } else {
            if (updated[existingIdx].message !== alertItem.message || updated[existingIdx].title !== alertItem.title) {
              updated[existingIdx] = {
                ...updated[existingIdx],
                title: alertItem.title,
                message: alertItem.message
              };
              hasChanges = true;
            }
          }
        } else {
          // If WIP was resolved / reduced below threshold, auto-resolve active alerts
          const existingIdx = updated.findIndex(n => n.id === wipAlertId);
          if (existingIdx !== -1 && !updated[existingIdx].read && updated[existingIdx].type === 'alert') {
            updated[existingIdx] = {
              ...updated[existingIdx],
              read: true,
              title: `WIP Buffer Normalized: Line ${line.lineNo} (${line.style})`,
              message: `In-line WIP (${line.wip} pcs) is now within the calculated buffer threshold (${wipInfo.threshold} pcs). Production flow stabilized.`,
              type: 'sync'
            };
            hasChanges = true;
          }
        }

        // --- 2. Critical Bottleneck Workstation Monitoring ---
        const isBottleneckBreached = Boolean(
          line.bottleneck && (
            line.bottleneck.status === 'critical' ||
            line.bottleneck.status === 'high' ||
            (line.bottleneck.cycleTime > line.bottleneck.targetCT && line.bottleneck.targetCT > 0)
          )
        );
        const bnAlertId = `bottleneck-alert-line-${line.lineNo}`;

        if (isBottleneckBreached) {
          currentBreachedSet.add(bnAlertId);
          if (!knownActiveBreachesRef.current.has(bnAlertId) && !isInitialMonitorRunRef.current) {
            newlyBreachedType = 'bottleneck'; // Prioritize urgent bottleneck chime if both trigger
          }

          const existingBnIdx = updated.findIndex(n => n.id === bnAlertId);
          const bnAlertItem: NotificationItem = {
            id: bnAlertId,
            title: `Bottleneck Alert: Line ${line.lineNo} (${line.bottleneck.station || 'Critical Station'})`,
            message: `Workstation '${line.bottleneck.station}' cycle time is ${line.bottleneck.cycleTime}s vs ${line.bottleneck.targetCT}s target (Variance: +${Math.max(0, line.bottleneck.cycleTime - line.bottleneck.targetCT)}s). Status: ${line.bottleneck.status.toUpperCase()}. Action: ${line.bottleneck.action || 'Line rebalancing and pitch intervention required'}.`,
            type: 'warning',
            timestamp: existingBnIdx !== -1 ? updated[existingBnIdx].timestamp : new Date().toISOString(),
            read: existingBnIdx !== -1 ? updated[existingBnIdx].read : false,
            lineNo: line.lineNo,
            targetRole: 'Line IE / Bottleneck Specialist'
          };

          if (existingBnIdx === -1) {
            updated.unshift(bnAlertItem);
            hasChanges = true;
          } else {
            if (updated[existingBnIdx].message !== bnAlertItem.message || updated[existingBnIdx].title !== bnAlertItem.title) {
              updated[existingBnIdx] = {
                ...updated[existingBnIdx],
                title: bnAlertItem.title,
                message: bnAlertItem.message
              };
              hasChanges = true;
            }
          }
        } else {
          // If bottleneck was resolved / stabilized, auto-resolve active bottleneck alerts
          const existingBnIdx = updated.findIndex(n => n.id === bnAlertId);
          if (existingBnIdx !== -1 && !updated[existingBnIdx].read && (updated[existingBnIdx].type === 'warning' || updated[existingBnIdx].type === 'alert')) {
            updated[existingBnIdx] = {
              ...updated[existingBnIdx],
              read: true,
              title: `Bottleneck Stabilized: Line ${line.lineNo} (${line.bottleneck?.station || 'Station'})`,
              message: `Station cycle time (${line.bottleneck?.cycleTime || 0}s) is within standard takt target (${line.bottleneck?.targetCT || 0}s). Line flow balanced.`,
              type: 'sync'
            };
            hasChanges = true;
          }
        }
      });

      return hasChanges ? updated : prevNotifications;
    });

    // Fire Auditory Alert if a new high WIP or bottleneck breach occurred and sound is enabled
    if (!isInitialMonitorRunRef.current && newlyBreachedType && auditoryAlertsEnabled) {
      playAuditoryAlert(newlyBreachedType);
    }

    knownActiveBreachesRef.current = currentBreachedSet;
    isInitialMonitorRunRef.current = false;
  }, [lines, auditoryAlertsEnabled]);

  // Today checklist completion calculation
  const todayStatuses = normalizeChecklistStatuses(checklists[todayStr]);
  const todayDone = todayStatuses.filter(s => s === 'yes').length;
  const todayPending = todayStatuses.filter(s => s === 'pending').length;
  const todayNotDone = todayStatuses.filter(s => s === 'no').length;
  const checklistCompletionPct = Math.round((todayDone / CHECKLIST_TASK_COUNT) * 100);

  // Pending todos count
  const pendingTodosCount = todos.filter(t => t.status !== 'completed').length;
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Active lines for currently selected production date
  const currentDayLines = useMemo(() => {
    const dayLines = lines.filter(l => l.date === activeDate);
    if (dayLines.length > 0) return dayLines;
    const map = new Map<string, LineEntry>();
    lines.forEach(l => {
      if (!map.has(l.lineNo) || (l.date && map.get(l.lineNo)!.date && l.date > map.get(l.lineNo)!.date)) {
        map.set(l.lineNo, l);
      }
    });
    return Array.from(map.values());
  }, [lines, activeDate]);

  // Active Bottlenecks & WIP Breaches calculation for Floor Status Snapshot
  const activeBottleneckLines = useMemo(() => {
    return currentDayLines.filter(line =>
      Boolean(
        line.bottleneck && (
          line.bottleneck.status === 'critical' ||
          line.bottleneck.status === 'high' ||
          (line.bottleneck.cycleTime > line.bottleneck.targetCT && line.bottleneck.targetCT > 0)
        )
      )
    );
  }, [currentDayLines]);

  const activeWipBreachedLines = useMemo(() => {
    return currentDayLines.filter(line => calculateStyleWipThreshold(line).isBreached);
  }, [currentDayLines]);

  const handleChatButtonPointerDown = () => {
    isLongPressTriggeredRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setIsFloorSnapshotOpen(prev => !prev);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([40, 30, 40]);
        } catch {}
      }
    }, 500);
  };

  const handleChatButtonPointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (!isLongPressTriggeredRef.current) {
      setIsChatOpen(true);
    }
  };

  const handleChatButtonPointerCancel = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Real-time metric refresh for Floor Status Snapshot
  const triggerSnapshotMetricsRefresh = useCallback(() => {
    setIsSnapshotRefreshing(true);
    setSnapshotLastRefreshed(new Date());

    if (autoRefreshConfig.playAudioChime) {
      playTelemetryHeartbeatChime();
    }
    if (autoRefreshConfig.enableHaptics && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(25);
      } catch {}
    }

    if (!autoRefreshConfig.enabled) {
      setTimeout(() => setIsSnapshotRefreshing(false), 300);
      return;
    }

    setLines(prevLines => {
      // Pick active lines for the active date
      const dayIndices = prevLines
        .map((l, idx) => (l.date === activeDate ? idx : -1))
        .filter(idx => idx !== -1);

      if (dayIndices.length === 0) return prevLines;

      // Realistic shop-floor variation: pick active lines based on configured intensity
      const countToPace = autoRefreshConfig.intensity === 'dynamic' ? Math.min(4, dayIndices.length) : autoRefreshConfig.intensity === 'subtle' ? 1 : 2;
      const targetIndices = [...dayIndices].sort(() => 0.5 - Math.random()).slice(0, countToPace);

      return prevLines.map((line, idx) => {
        if (targetIndices.includes(idx)) {
          let currentOutput = line.dailyOutput ?? line.achievedProd ?? 0;
          let newOutput = currentOutput;
          if (autoRefreshConfig.simulateOutputPace) {
            const target = line.targetProd || 600;
            newOutput = currentOutput < target ? currentOutput + 1 : currentOutput;
          }

          // Dynamically recalculate efficiency
          const newEff = line.workingHours && line.smv && line.plannedMP
            ? Math.min(100, Math.round(((newOutput * line.smv) / ((line.plannedMP || 40) * (line.workingHours || 8) * 60)) * 100))
            : line.efficiency;

          // Micro cycle time variation around target
          let newCT = line.bottleneck?.cycleTime || 45;
          if (autoRefreshConfig.simulateCycleJitter && line.bottleneck) {
            const jitter = (Math.random() - 0.5) * 0.4;
            newCT = Math.round((newCT + jitter) * 10) / 10;
          }

          return {
            ...line,
            dailyOutput: newOutput,
            achievedProd: newOutput,
            efficiency: newEff > 0 ? newEff : line.efficiency,
            bottleneck: line.bottleneck ? {
              ...line.bottleneck,
              cycleTime: newCT
            } : line.bottleneck,
            liveTelemetry: line.liveTelemetry ? {
              ...line.liveTelemetry,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            } : line.liveTelemetry
          };
        }
        return line;
      });
    });

    setTimeout(() => {
      setIsSnapshotRefreshing(false);
    }, 400);
  }, [activeDate, autoRefreshConfig]);

  // Auto-refresh mechanism for Floor Status Snapshot overlay: updates displayed metrics according to customizer configuration
  useEffect(() => {
    if (!isFloorSnapshotOpen || !autoRefreshConfig.enabled) {
      setSnapshotCountdown(autoRefreshConfig.intervalSeconds);
      setIsSnapshotRefreshing(false);
      return;
    }

    // Set initial timestamp on open
    setSnapshotLastRefreshed(new Date());
    setSnapshotCountdown(autoRefreshConfig.intervalSeconds);

    const intervalId = setInterval(() => {
      // Pause if tab is blurred and autoPauseOnTabBlur is enabled
      if (autoRefreshConfig.autoPauseOnTabBlur && typeof document !== 'undefined' && document.hidden) {
        return;
      }

      setSnapshotCountdown(prev => {
        if (prev <= 1) {
          triggerSnapshotMetricsRefresh();
          return autoRefreshConfig.intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isFloorSnapshotOpen, autoRefreshConfig.enabled, autoRefreshConfig.intervalSeconds, autoRefreshConfig.autoPauseOnTabBlur, triggerSnapshotMetricsRefresh]);

  // Convert current critical telemetry metrics into a text-based summary for clipboard copying
  const handleCopyFloorSnapshot = async () => {
    const totalLinesCount = currentDayLines.length;
    const avgEfficiency = totalLinesCount > 0
      ? Math.round(currentDayLines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / totalLinesCount)
      : 0;
    const totalWip = currentDayLines.reduce((acc, l) => acc + (l.wip || 0), 0);
    const totalProduced = currentDayLines.reduce((acc, l) => acc + (l.dailyOutput || l.achievedProd || 0), 0);
    const totalTarget = currentDayLines.reduce((acc, l) => acc + (l.targetProd || 0), 0);
    const totalManpower = currentDayLines.reduce((acc, l) => acc + (l.mp ? ((l.mp.Operator?.present || 0) + (l.mp.Helper?.present || 0)) : (l.plannedMP || 0)), 0);
    const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let summaryText = `📊 DEBONAIR LTD (UNIT-02) — FLOOR STATUS SNAPSHOT\n`;
    summaryText += `════════════════════════════════════════════════\n`;
    summaryText += `📅 Production Date: ${activeDate} | Captured: ${nowFormatted}\n`;
    summaryText += `🏭 Monitored Lines: ${totalLinesCount} Sewing Lines Active\n`;
    summaryText += `⚡ Average Efficiency: ${avgEfficiency}%\n`;
    summaryText += `📦 Total Floor WIP: ${totalWip.toLocaleString()} pcs\n`;
    summaryText += `🎯 Output / Target: ${totalProduced.toLocaleString()} / ${totalTarget.toLocaleString()} pcs (${totalTarget > 0 ? Math.round((totalProduced / totalTarget) * 100) : 0}%)\n`;
    summaryText += `👥 Active Floor Manpower: ${totalManpower} Operators & Helpers\n`;
    summaryText += `════════════════════════════════════════════════\n\n`;

    // Critical Bottleneck Stations
    summaryText += `🚨 CRITICAL BOTTLENECK STATIONS (${activeBottleneckLines.length}):\n`;
    if (activeBottleneckLines.length === 0) {
      summaryText += `  ✓ All stations balanced. No active bottleneck cycle overruns.\n`;
    } else {
      activeBottleneckLines.forEach((line) => {
        const bn = line.bottleneck;
        summaryText += `  • Line ${line.lineNo} [${line.style || line.buyer || 'Debonair'}]: `;
        if (bn) {
          summaryText += `Station ${bn.station || 'Critical'} | Actual CT: ${bn.cycleTime}s vs Target ${bn.targetCT}s (${bn.status.toUpperCase()})\n`;
        } else {
          summaryText += `Critical bottleneck flagged\n`;
        }
      });
    }
    summaryText += `\n`;

    // WIP Buffer Breaches
    summaryText += `📦 WIP BUFFER BREACHES & OVERLOADS (${activeWipBreachedLines.length}):\n`;
    if (activeWipBreachedLines.length === 0) {
      summaryText += `  ✓ WIP levels within standard buffer thresholds.\n`;
    } else {
      activeWipBreachedLines.forEach((line) => {
        const thresh = calculateStyleWipThreshold(line);
        summaryText += `  • Line ${line.lineNo} [${line.style || 'Standard'}]: Current WIP ${line.wip} pcs (Exceeds buffer limit of ${thresh.threshold} pcs by +${thresh.overloadPcs} pcs)\n`;
      });
    }
    summaryText += `\n`;

    // High Priority Floor Action Lines
    const criticalActionLines = currentDayLines.filter(
      l => (l.bottleneck?.status === 'critical') || (l.efficiency !== undefined && l.efficiency < 50)
    );
    if (criticalActionLines.length > 0) {
      summaryText += `⚠️ TOP IE ACTION PRIORITIES:\n`;
      criticalActionLines.slice(0, 5).forEach(line => {
        summaryText += `  ⚡ Line ${line.lineNo}: Efficiency ${line.efficiency || 0}% | WIP: ${line.wip} pcs | Station: ${line.bottleneck?.station || 'General'}\n`;
      });
      summaryText += `\n`;
    }

    summaryText += `— Generated from IE Daily Control Live Telemetry Gateway`;

    let success = false;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
        success = true;
      }
    } catch {}

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = summaryText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {}
    }

    setIsSnapshotCopied(true);
    setTimeout(() => {
      setIsSnapshotCopied(false);
    }, 2500);
  };

  // Handlers
  const handleUpdateChecklistTask = (date: string, idx: number, status: ChecklistStatus) => {
    const current = normalizeChecklistStatuses(checklists[date]);
    const previousStatus = current[idx] || 'pending';
    const updated = [...current];
    updated[idx] = status;
    setChecklists(prev => ({ ...prev, [date]: updated }));

    if (isSystemOffline()) {
      logOfflineActivity({
        category: 'checklist',
        action: 'update',
        entityId: `Task #${idx + 1}`,
        entityTitle: `IE Checklist Task #${idx + 1} (${date})`,
        dataPoints: [
          {
            field: 'status',
            label: 'Audit Status',
            previousValue: previousStatus.toUpperCase(),
            newValue: status.toUpperCase()
          }
        ],
        summary: `Verification status updated from ${previousStatus.toUpperCase()} to ${status.toUpperCase()}`,
        operatorName: profile.name || 'Debonair IE Admin',
        operatorRole: profile.role || 'SENIOR INDUSTRIAL ENGINEER'
      });
    }
  };

  const handleBatchUpdateChecklist = (date: string, statuses: ChecklistStatus[]) => {
    setChecklists(prev => ({ ...prev, [date]: statuses }));
  };

  const handleSaveLine = (updatedLine: LineEntry) => {
    if (isSystemOffline()) {
      const existing = lines.find(l => l.id === updatedLine.id);
      const diffs: Array<{ field: string; label: string; previousValue?: any; newValue: any }> = [];
      if (existing) {
        if (existing.targetProd !== updatedLine.targetProd) {
          diffs.push({ field: 'targetProd', label: 'Target Output', previousValue: `${existing.targetProd} pcs`, newValue: `${updatedLine.targetProd} pcs` });
        }
        if (existing.achievedProd !== updatedLine.achievedProd) {
          diffs.push({ field: 'achievedProd', label: 'Achieved Output', previousValue: `${existing.achievedProd} pcs`, newValue: `${updatedLine.achievedProd} pcs` });
        }
        if (existing.targetEff !== updatedLine.targetEff) {
          diffs.push({ field: 'targetEff', label: 'Target Eff%', previousValue: `${existing.targetEff}%`, newValue: `${updatedLine.targetEff}%` });
        }
        if (existing.efficiency !== updatedLine.efficiency) {
          diffs.push({ field: 'efficiency', label: 'Floor Eff%', previousValue: `${existing.efficiency}%`, newValue: `${updatedLine.efficiency}%` });
        }
        if (existing.plannedMP !== updatedLine.plannedMP) {
          diffs.push({ field: 'plannedMP', label: 'Planned Manpower', previousValue: `${existing.plannedMP} operators`, newValue: `${updatedLine.plannedMP} operators` });
        }
        if (existing.wip !== updatedLine.wip) {
          diffs.push({ field: 'wip', label: 'WIP Buffer', previousValue: `${existing.wip} pcs`, newValue: `${updatedLine.wip} pcs` });
        }
        if (existing.remarks !== updatedLine.remarks) {
          diffs.push({ field: 'remarks', label: 'IE Remarks', previousValue: existing.remarks || 'None', newValue: updatedLine.remarks || 'None' });
        }
        if (existing.style !== updatedLine.style) {
          diffs.push({ field: 'style', label: 'Style / Buyer', previousValue: existing.style, newValue: updatedLine.style });
        }
      }
      if (diffs.length > 0) {
        logOfflineActivity({
          category: 'line',
          action: 'update',
          entityId: `Line ${updatedLine.lineNo}`,
          entityTitle: `Sewing Line ${updatedLine.lineNo} (${updatedLine.floor || 'Floor 03'})`,
          dataPoints: diffs,
          summary: `Updated ${diffs.map(d => `${d.label} (${d.newValue})`).join(', ')} while connection was offline`,
          operatorName: profile.name || 'Debonair IE Admin',
          operatorRole: profile.role || 'SENIOR INDUSTRIAL ENGINEER'
        });
      }
    }
    setLines(prev => prev.map(l => (l.id === updatedLine.id ? updatedLine : l)));
  };

  const handleSaveMultipleLines = (updatedLines: LineEntry[]) => {
    const updatedMap = new Map(updatedLines.map(l => [l.id, l]));
    setLines(prev => prev.map(l => (updatedMap.has(l.id) ? updatedMap.get(l.id)! : l)));
  };

  const handleReorderLines = (reorderedFloorLines: LineEntry[]) => {
    const updatedMap = new Map(reorderedFloorLines.map((l, idx) => [l.id, { ...l, floorOrder: idx + 1 }]));
    setLines(prev => prev.map(l => (updatedMap.has(l.id) ? updatedMap.get(l.id)! : l)));
  };

  const handleDeleteLine = (identifier: string | number) => {
    setLines(prev => {
      const filtered = prev.filter(l =>
        typeof identifier === 'string'
          ? l.lineNo !== identifier
          : l.id !== identifier
      );
      const deletedLineNo =
        typeof identifier === 'string'
          ? identifier
          : prev.find(l => l.id === identifier)?.lineNo;
      if (deletedLineNo && deletedLineNo === selectedLineNo && filtered.length > 0) {
        setSelectedLineNo(filtered[0].lineNo);
      }
      return filtered;
    });
  };

  const handleDeleteFloor = (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => {
    const trimmed = floorName.trim().toLowerCase();
    if (mode === 'delete_all_lines') {
      setLines(prev => {
        const remaining = prev.filter(l => (l.floor?.trim().toLowerCase() || '') !== trimmed);
        const deletedLines = prev.filter(l => (l.floor?.trim().toLowerCase() || '') === trimmed);
        const hadSelected = deletedLines.some(l => l.lineNo === selectedLineNo);
        if (hadSelected && remaining.length > 0) {
          setSelectedLineNo(remaining[0].lineNo);
        }
        return remaining;
      });
    } else if (mode === 'reassign' && targetFloor) {
      const newFloor = targetFloor.trim();
      setLines(prev =>
        prev.map(l =>
          (l.floor?.trim().toLowerCase() || '') === trimmed
            ? { ...l, floor: newFloor }
            : l
        )
      );
    }
  };

  const handleAddNewLine = (customLineOrData?: LineEntry | Partial<LineEntry>) => {
    if (customLineOrData && 'id' in customLineOrData && customLineOrData.id && 'lineNo' in customLineOrData) {
      setLines(prev => [...prev, customLineOrData as LineEntry]);
      setSelectedLineNo((customLineOrData as LineEntry).lineNo);
      return;
    }

    const nextNumericLine = lines.reduce((max, l) => {
      const num = parseInt(l.lineNo.replace(/\D/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const newLineNo = customLineOrData?.lineNo || String(nextNumericLine > 0 ? nextNumericLine + 1 : 25);

    const newLine: LineEntry = {
      id: Date.now(),
      date: customLineOrData?.date || activeDate || todayStr,
      lineNo: newLineNo,
      floor: customLineOrData?.floor || 'Padma Floor',
      buyer: customLineOrData?.buyer || 'Target',
      style: customLineOrData?.style || 'BS-100 Basic Tee',
      smv: customLineOrData?.smv || 0.75,
      plannedMP: customLineOrData?.plannedMP || 35,
      workingHours: customLineOrData?.workingHours || 8,
      targetEff: customLineOrData?.targetEff || 85,
      targetProd: customLineOrData?.targetProd || 1200,
      achievedProd: customLineOrData?.achievedProd ?? 1020,
      efficiency: customLineOrData?.efficiency ?? 85,
      remarks: customLineOrData?.remarks || 'Newly commissioned line setup',
      orderQty: customLineOrData?.orderQty || 10000,
      dailyInput: customLineOrData?.dailyInput || 1100,
      dailyOutput: customLineOrData?.dailyOutput || 1020,
      wip: customLineOrData?.wip ?? 200,
      balancingGraph: 'day1',
      nextStyle: customLineOrData?.nextStyle || 'BS-200 V-Neck',
      nextStyleDate: customLineOrData?.nextStyleDate || todayStr,
      mp: customLineOrData?.mp || {
        Operator: { present: 26, absent: 2 },
        Helper: { present: 6, absent: 1 },
        'Iron Man': { present: 2, absent: 0 }
      },
      balanceMethod: customLineOrData?.balanceMethod || 'Overtime',
      balanceNotes: customLineOrData?.balanceNotes || 'New line ramp up',
      top5: customLineOrData?.top5 || {
        held: 'yes',
        attendance: 90,
        items: ['Initial machine inspection', 'Thread tension calibration'],
        notes: 'Shift kickoff meeting completed'
      },
      bottleneck: customLineOrData?.bottleneck || {
        station: 'Neckband attachment',
        cycleTime: 42.0,
        targetCT: 40.0,
        status: 'ok',
        action: 'Guide attachment aligned'
      },
      timeStudy: customLineOrData?.timeStudy || {
        done: 'yes',
        type: 'time',
        observedRate: 120,
        standardRate: 130
      },
      buildUp: customLineOrData?.buildUp || {
        day: '1',
        plannedPct: 60,
        achievedPct: 85,
        operators: 34
      },
      lineIE: customLineOrData?.lineIE || {
        name: profile.name,
        level: profile.role,
        period: 'daily'
      },
      ...customLineOrData
    };

    setLines(prev => [...prev, newLine]);
    setSelectedLineNo(newLineNo);
  };

  const handleApplySimulationToLine = (lineNo: string, updates: Partial<LineEntry>) => {
    setLines(prev =>
      prev.map(line => {
        if (line.lineNo === lineNo) {
          return {
            ...line,
            ...updates,
            mp: updates.mp ? { ...line.mp, ...updates.mp } : line.mp,
            bottleneck: updates.bottleneck ? { ...line.bottleneck, ...updates.bottleneck } : line.bottleneck
          };
        }
        return line;
      })
    );
    setSelectedLineNo(lineNo);
  };

  const handleAddNewLineWithSimulation = (lineData: Partial<LineEntry>) => {
    const newLineNo = lineData.lineNo || String(parseInt(lines[lines.length - 1]?.lineNo || '24') + 1);
    const newLine: LineEntry = {
      id: Date.now(),
      date: todayStr,
      lineNo: newLineNo,
      floor: lineData.floor || 'Padma Floor',
      buyer: lineData.buyer || 'H&M',
      style: lineData.style || 'TS-2401 Crewneck Basic',
      smv: lineData.smv || 12.5,
      plannedMP: lineData.plannedMP || 36,
      workingHours: lineData.workingHours || 8,
      targetEff: lineData.targetEff || 85,
      targetProd: lineData.targetProd || 1200,
      achievedProd: 0,
      efficiency: 0,
      remarks: lineData.remarks || 'Commissioned via IE Simulator',
      orderQty: 15000,
      dailyInput: lineData.targetProd || 1200,
      dailyOutput: 0,
      wip: 120,
      balancingGraph: 'day1',
      nextStyle: '',
      nextStyleDate: '',
      mp: lineData.mp || {
        Operator: { present: 28, absent: 0 },
        Helper: { present: 6, absent: 0 },
        'Iron Man': { present: 2, absent: 0 }
      },
      balanceMethod: 'IE Workstation Balancing',
      balanceNotes: 'Balanced with simulated pitch time',
      top5: {
        held: 'yes',
        attendance: 100,
        items: ['Trial run approved', 'Attachments verified'],
        notes: 'Line setup complete'
      },
      bottleneck: lineData.bottleneck || {
        station: 'Critical Assembly',
        cycleTime: 28,
        targetCT: 26.8,
        status: 'ok',
        action: 'IE plan implemented'
      },
      timeStudy: {
        done: 'yes',
        type: 'time',
        observedRate: 150,
        standardRate: 160
      },
      buildUp: {
        day: '1',
        plannedPct: 55,
        achievedPct: 55,
        operators: lineData.plannedMP || 36
      },
      lineIE: {
        name: profile.name,
        level: 'executive',
        period: 'daily'
      }
    };
    setLines(prev => [...prev, newLine]);
    setSelectedLineNo(newLineNo);
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleRestoreBackup = (data: any) => {
    if (data.lines) setLines(data.lines);
    if (data.checklists) setChecklists(data.checklists);
    if (data.todos) setTodos(data.todos);
    if (data.leanActions) setLeanActions(data.leanActions);
  };

  const handleImportLines = (
    importedLines: LineEntry[],
    mode: 'upsert' | 'append' | 'replace' = 'upsert'
  ) => {
    if (importedLines.length === 0) return;

    setLines(prev => {
      if (mode === 'replace') {
        return importedLines;
      }

      if (mode === 'append') {
        const existingLineNos = new Set(prev.map(l => l.lineNo.trim().toLowerCase()));
        const onlyNew = importedLines.filter(l => !existingLineNos.has(l.lineNo.trim().toLowerCase()));
        return [...prev, ...onlyNew];
      }

      // Default: 'upsert'
      const updated = [...prev];
      const newLinesToAdd: LineEntry[] = [];

      importedLines.forEach(imp => {
        const idx = updated.findIndex(
          l => l.lineNo.trim().toLowerCase() === imp.lineNo.trim().toLowerCase()
        );
        if (idx >= 0) {
          updated[idx] = {
            ...updated[idx],
            ...imp,
            id: updated[idx].id // maintain stable ID
          };
        } else {
          newLinesToAdd.push(imp);
        }
      });

      return [...updated, ...newLinesToAdd];
    });

    if (importedLines[0]?.lineNo) {
      setSelectedLineNo(importedLines[0].lineNo);
    }

    setNotifications(prev => [
      {
        id: `notif-csv-${Date.now()}`,
        title: `CSV Import: ${importedLines.length} Line(s) Integrated`,
        message: `Validated and added ${importedLines.length} line configurations into the factory registry.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        type: 'sync',
        lineNo: importedLines[0]?.lineNo
      },
      ...prev
    ]);
  };

  const handleResetFactoryDefaults = () => {
    setLines(ALL_IMPORTED_DEBONAIR_LINES);
    setChecklists(generateDefaultChecklists());
    setTodos(INITIAL_TODOS);
    setSchedules(INITIAL_SCHEDULES);
    setLeanActions(INITIAL_LEAN_ACTIONS);
    localStorage.clear();
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('theme-transitioning');
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      document.body.setAttribute('data-theme', nextTheme);

      if ('startViewTransition' in document) {
        (document as any).startViewTransition(() => {
          setTheme(nextTheme);
        });
      } else {
        setTheme(nextTheme);
      }

      setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
      }, 500);
    } else {
      setTheme(nextTheme);
    }
  };

  const handleAddTodoFromAudit = (item: Partial<TodoItem>) => {
    const fullItem: TodoItem = {
      id: item.id || `todo-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: item.title || 'Kaizen Task',
      description: item.description || '',
      category: item.category || 'kaizen_ci',
      priority: item.priority || 'medium',
      status: item.status || 'pending',
      targetDate: item.targetDate || todayStr,
      dueTime: item.dueTime || '05:00 PM',
      lineNo: item.lineNo || selectedLineNo,
      assignedToRole: item.assignedToRole || 'Line IE',
      assignedToName: item.assignedToName || profile.name,
      assignedByRole: item.assignedByRole || 'AI IE Diagnostic Agent',
      assignedByName: item.assignedByName || 'IE System',
      subtasks: item.subtasks || [],
      createdAt: new Date().toISOString()
    };
    setTodos(prev => [...prev, fullItem]);
  };

  const handleSelectDate = (date: string) => {
    setActiveDate(date);
    setSelectedChecklistDate(date);
    if (date === '2026-09-24') setActiveDataset('debonair_sep24');
    else if (date === '2026-09-23') setActiveDataset('debonair_sep23');
    else if (date === '2026-09-22') setActiveDataset('debonair_sep22');
    else if (date === '2026-09-21') setActiveDataset('debonair_sep21');
    else if (date === '2026-09-20') setActiveDataset('debonair_sep20');
    else if (date === '2026-09-19') setActiveDataset('debonair_sep19');
    else if (date === '2026-09-17') setActiveDataset('debonair_sep17');
    else setActiveDataset('custom');
  };

  const handleInitializeDateLines = (targetDate: string) => {
    const alreadyHas = lines.some(l => l.date === targetDate);
    if (alreadyHas) return;

    // Use 24-Sep regular dataset as clean operational template
    const regularTemplate = lines.filter(l => l.date === '2026-09-24');
    const source = regularTemplate.length > 0 ? regularTemplate : lines.slice(0, 34);

    const seeded: LineEntry[] = source.map(l => ({
      ...l,
      id: Date.now() + Math.floor(Math.random() * 1000000),
      date: targetDate,
      achievedProd: 0,
      efficiency: 0,
      dailyOutput: 0
    }));

    setLines(prev => [...seeded, ...prev]);
    setActiveDate(targetDate);
    setSelectedChecklistDate(targetDate);
    notifySave();
  };

  const handleSelectDataset = (dataset: string) => {
    setActiveDataset(dataset);
    let targetDate = '2026-09-24';
    if (dataset === 'debonair_sep23') targetDate = '2026-09-23';
    else if (dataset === 'debonair_sep22') targetDate = '2026-09-22';
    else if (dataset === 'debonair_sep21') targetDate = '2026-09-21';
    else if (dataset === 'debonair_sep20') targetDate = '2026-09-20';
    else if (dataset === 'debonair_sep19') targetDate = '2026-09-19';
    else if (dataset === 'debonair_sep17') targetDate = '2026-09-17';
    setActiveDate(targetDate);
    setSelectedChecklistDate(targetDate);
  };

  const handleReloadDebonair = () => {
    const importedDates = new Set([
      '2026-09-17',
      '2026-09-19',
      '2026-09-20',
      '2026-09-21',
      '2026-09-22',
      '2026-09-23',
      '2026-09-24'
    ]);
    const otherLines = lines.filter(
      l => !importedDates.has(l.date) && !isLegacyUnitFloor(l.floor)
    );
    const updated = [...ALL_IMPORTED_DEBONAIR_LINES, ...otherLines];
    setLines(updated);
    try {
      localStorage.setItem('ie_lines_data', JSON.stringify(updated));
    } catch {}
    setActiveDate(DEBONAIR_SEPTEMBER_24_DATE);
    setSelectedChecklistDate(DEBONAIR_SEPTEMBER_24_DATE);
    setActiveDataset('debonair_sep24');
  };

  // DCS Operations Handlers
  const handleUpdateHourNotes = (hourIndex: number, notes: string) => {
    setHourlyData(prev =>
      prev.map(h => (h.hourIndex === hourIndex ? { ...h, notes } : h))
    );
  };

  const handleUpdateHourOutput = (hourIndex: number, actual: number, scrap: number, downtimeMinutes: number) => {
    setHourlyData(prev =>
      prev.map(h => {
        if (h.hourIndex === hourIndex) {
          const delta = actual - h.targetUnits;
          const status = delta >= 0 ? 'above' : delta >= -20 ? 'on_track' : 'below';
          return { ...h, actualUnits: actual, scrapUnits: scrap, downtimeMinutes, delta, status };
        }
        return h;
      })
    );
  };

  const handleSaveHourlyProduction = (payload: HourlyProductionUpdatePayload) => {
    // 1. Update hourlyData
    setHourlyData(prev => {
      const exists = prev.some(h => h.hourIndex === payload.hourIndex);
      if (exists) {
        return prev.map(h => {
          if (h.hourIndex === payload.hourIndex) {
            const delta = payload.actualUnits - payload.targetUnits;
            const status = delta >= 0 ? 'above' : delta >= -20 ? 'on_track' : 'below';
            return {
              ...h,
              actualUnits: payload.actualUnits,
              scrapUnits: payload.scrapUnits,
              downtimeMinutes: payload.downtimeMinutes,
              notes: payload.notes || h.notes,
              delta,
              status
            };
          }
          return h;
        });
      } else {
        const delta = payload.actualUnits - payload.targetUnits;
        const status = delta >= 0 ? 'above' : delta >= -20 ? 'on_track' : 'below';
        return [
          ...prev,
          {
            hourIndex: payload.hourIndex,
            timeSlot: payload.timeSlot,
            targetUnits: payload.targetUnits,
            actualUnits: payload.actualUnits,
            scrapUnits: payload.scrapUnits,
            downtimeMinutes: payload.downtimeMinutes,
            cumulativeTarget: payload.targetUnits * payload.hourIndex,
            cumulativeActual: payload.actualUnits * payload.hourIndex,
            delta,
            status,
            notes: payload.notes
          }
        ];
      }
    });

    // 2. Update line dailyOutput and efficiency in lines
    setLines(prev =>
      prev.map(l => {
        if (l.lineNo === payload.lineNo && l.date === activeDate) {
          const prevOutput = l.dailyOutput ?? l.achievedProd ?? 0;
          const newOutput = Math.max(prevOutput, payload.actualUnits > 0 ? prevOutput + payload.actualUnits : prevOutput);
          const newEff = l.workingHours && l.smv && l.plannedMP
            ? Math.min(100, Math.round(((newOutput * l.smv) / ((l.plannedMP || 40) * (l.workingHours || 8) * 60)) * 100))
            : l.efficiency;

          return {
            ...l,
            dailyOutput: newOutput,
            achievedProd: newOutput,
            efficiency: newEff > 0 ? newEff : l.efficiency,
            bottleneck: l.bottleneck ? {
              ...l.bottleneck,
              station: payload.bottleneckStation || l.bottleneck.station,
            } : l.bottleneck,
            liveTelemetry: l.liveTelemetry ? {
              ...l.liveTelemetry,
              lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            } : l.liveTelemetry
          };
        }
        return l;
      })
    );

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        type: 'line',
        title: 'Hourly Production Logged (BN, Assembly, Output)',
        message: `Line ${payload.lineNo} (${payload.timeSlot}): Bottle Neck ${payload.bottleneckUnits} pcs, Assembly ${payload.assemblyUnits} pcs, Output ${payload.outputUnits} pcs`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        priority: 'low'
      },
      ...prev
    ]);
    notifySave();
  };

  const handleAddDowntimeIncident = (incident: DowntimeIncident) => {
    setDowntimeLog(prev => [incident, ...prev]);
    setIsNewDowntimeModalOpen(false);
    notifySave();
  };

  const handleAddNewAction = (action: ActionItem) => {
    setActionItems(prev => [action, ...prev]);
    setIsNewActionModalOpen(false);
    notifySave();
  };

  const handleUpdateActionStatus = (id: string, newStatus: 'Open' | 'In Progress' | 'Verified Closed') => {
    setActionItems(prev =>
      prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
    );
    notifySave();
  };

  const handleAddNewFiveWhy = (newWhy: FiveWhyInvestigation) => {
    setFiveWhys(prev => [newWhy, ...prev]);
    notifySave();
  };

  const handleToggleAuditItem = (id: string, newStatus: 'pass' | 'warning' | 'fail') => {
    setAuditChecks(prev =>
      prev.map(a => (a.id === id ? { ...a, status: newStatus } : a))
    );
    notifySave();
  };

  const handleUpdateCenterlineValue = (id: string, newValue: number) => {
    setCenterlines(prev =>
      prev.map(c => {
        if (c.id === id) {
          const inSpec = newValue >= c.lsl && newValue <= c.usl;
          const status = inSpec ? 'in_spec' : Math.abs(newValue - c.target) <= (c.usl - c.lsl) * 0.7 ? 'warning' : 'out_of_spec';
          return { ...c, currentValue: newValue, status, lastChecked: 'Just now' };
        }
        return c;
      })
    );
    notifySave();
  };

  // Canonical Navigation Router
  // Home • Settings Unified Cockpit (Line Data Operations Hub, Check List Compliance Hub, Lean Tools, World WCM)
  const handleNavigate = (tab: string, lineNo?: string) => {
    if (lineNo) setSelectedLineNo(lineNo);

    // 1. Home
    if (tab === 'dashboard' || tab === 'home') {
      setCurrentTab('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 2. Datas Operations Hub (Daily Data Collection)
    if (tab === 'datas' || tab === 'data' || tab === 'linedata' || tab === 'lines' || tab === 'line-data') {
      setLineDataSubTab('lines');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'balancing') {
      setLineDataSubTab('balancing');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'hourly') {
      setLineDataSubTab('hourly');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'loss-pareto' || tab === 'downtime') {
      setLineDataSubTab('loss-pareto');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (
      tab === 'floor-plan' ||
      tab === 'floorplan' ||
      tab === 'line-management' ||
      tab === 'line-configuration' ||
      tab === 'factory' ||
      tab === 'factory-setup' ||
      tab === 'factory-profile' ||
      tab === 'drag-drop' ||
      tab === 'drag-reallocate'
    ) {
      if (tab === 'factory' || tab === 'factory-setup' || tab === 'factory-profile' || lineNo === 'factory') {
        setFloorSetupInitialSubView('factory');
      } else if (tab === 'drag-drop' || tab === 'drag-reallocate' || lineNo === 'drag-drop') {
        setFloorSetupInitialSubView('drag-drop');
      }
      setLineDataSubTab('floor-plan');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'history' || tab === 'production-history' || tab === 'line-history') {
      setLineDataSubTab('history');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'capacity' || tab === 'capacity-calc') {
      setLineDataSubTab('capacity');
      setSettingsSection('line-data');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 3. Check List & Floor Compliance Hub (In Settings)
    if (tab === 'checklist' || tab === 'daily-checklist') {
      setChecklistSubTab('daily-checklist');
      setSettingsSection('checklist');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'todo-schedule' || tab === 'todos' || tab === 'schedule') {
      setChecklistSubTab('todo-schedule');
      setSettingsSection('checklist');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'actions' || tab === 'action-tracker' || tab === '5-whys') {
      setChecklistSubTab('actions');
      setSettingsSection('checklist');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'audits' || tab === '5s-audit' || tab === 'centerlines') {
      setChecklistSubTab('audits');
      setSettingsSection('checklist');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'monthly' || tab === 'monthly-summary' || tab === 'monthly-audit') {
      setChecklistSubTab('monthly-summary');
      setSettingsSection('checklist');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 4. Lean Tools & Industrial Engineering Cockpit (In Settings)
    if (tab === 'lean-tools' || tab === 'lean-toolkit' || tab === 'lean') {
      setLeanToolsSubTab('toolkit');
      setSettingsSection('lean-tools');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'workspace' || tab === 'lean-workspace') {
      setLeanToolsSubTab('workspace');
      setSettingsSection('lean-tools');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (tab === 'simulator' || tab === 'ie-simulator') {
      setLeanToolsSubTab('simulator');
      setSettingsSection('lean-tools');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5. World Class Manufacturing (WCM) (In Settings)
    if (tab === 'world' || tab === 'wcm' || tab === 'world-class') {
      setSettingsSection('world');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5b. UI & UX Component Visualizer
    if (tab === 'components' || tab === 'visualizer' || tab === 'uiux' || tab === 'ui-ux') {
      setSettingsSection('components');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 5c. 0_Tier Master Console
    if (
      tab === 'tier_0' ||
      tab === '0_tier' ||
      tab === 'master-console' ||
      tab === 'tier-0' ||
      tab === '0_tier-master-console' ||
      tab === 'forge'
    ) {
      setSettingsSection('tier_0');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 6. Settings (Control Center & Preferences)
    if (
      tab === 'settings' ||
      tab === 'control-center' ||
      tab === 'preferences' ||
      tab === 'roles' ||
      tab === 'tiers' ||
      tab === 'operational-tiers'
    ) {
      setSettingsSection(tab === 'preferences' ? 'preferences' : 'control-center');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // 7. Reports & Production Analytics Hub (In Settings)
    if (tab === 'reports' || tab === 'report' || tab === 'analytics' || tab === 'shift-reports') {
      setSettingsSection('reports');
      setCurrentTab('settings');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      data-theme={theme}
      data-privacy-shield={privacySettings.privacyModeEnabled || privacySettings.blurSensitiveProductionFigures}
      className="cockpit-shell min-h-[100dvh] flex flex-col bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased transition-colors duration-300"
    >
      <motion.div
        key={theme}
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 flex flex-col w-full"
      >
        {/* System Update Receiver (Live OTA Banner / Mandatory Modal) */}
        <SystemUpdateReceiver
          onLayoutApplied={(newLayout) => {
            setAppPageLayout(newLayout);
            if (newLayout.dashboard) setLayout(newLayout.dashboard);
          }}
        />

        {/* Live Announcement Marquee Ticker if configured in App Page Layout */}
        {appPageLayout.showAnnouncementTicker && (
          <div
            className="w-full px-4 py-1.5 text-xs font-bold text-white flex items-center justify-between shrink-0 shadow-xs"
            style={{ backgroundColor: appPageLayout.brandColor || '#176f78' }}
          >
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
              <span className="truncate">{appPageLayout.tickerText || 'Debonair Unit-02 • 34 Active Sewing Lines • Standard Shift Running'}</span>
            </div>
            <span className="text-[10px] font-mono opacity-80 uppercase shrink-0 pl-2">
              DISPATCH
            </span>
          </div>
        )}

        {/* Top Application Header */}
        <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        density={appPageLayout.density}
        onToggleDensity={handleToggleDensity}
        onSelectDensity={handleSelectDensity}
        workspaceWidth={appPageLayout.workspaceWidth || 'maximized'}
        onSelectWorkspaceWidth={handleSelectWorkspaceWidth}
        smallAreaFeaturesEnabled={appPageLayout.smallAreaFeaturesEnabled !== false}
        onToggleSmallAreaFeatures={handleToggleSmallAreaFeatures}
        unreadCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onLogoClick={() => handleNavigate('dashboard')}
        onOpenScorecard={() => setIsScorecardOpen(true)}
        scorecardScore={scorecardResult.overallScore}
        activeDataset={activeDataset}
        onSelectDataset={handleSelectDataset}
        onReloadDebonair={handleReloadDebonair}
        saveStatus={saveStatus}
        activeDate={activeDate}
        onSelectDate={handleSelectDate}
        activeFloor={activeFloor}
        onSelectFloor={setActiveFloor}
        onOpenRoles={() => handleOpenUserModal('roles')}
        onOpenChat={() => setIsChatOpen(true)}
        profile={profile}
        onOpenProfile={() => handleOpenUserModal('profile')}
        onOpenAuth={() => setIsAuthPageOpen(true)}
        onOpenDatabase={handleOpenDatabase}
        lines={lines}
        onInitializeDateLines={handleInitializeDateLines}
        onLockTerminal={handleLockTerminal}
        factoryProfile={factoryProfile}
        onOpenFactorySettings={handleOpenFactorySettings}
        onOpenAndroidPackage={() => setIsAndroidPackageModalOpen(true)}
        onOpenSettings={() => {
          setSettingsSection('control-center');
          setCurrentTab('settings');
        }}
        syncState={syncState}
        onToggleOnlineStatus={() => setSystemOffline(syncState.status === 'connected')}
        topBarConfig={topBarConfig}
      />

      {/* Main Content Area: Responsive padding with safe-area spacing and compact density footprint */}
      <main
        id="app-workspace-main"
        className={`flex-1 w-full mx-auto transition-all ${
          (appPageLayout.workspaceWidth === 'fluid' || (appPageLayout.density === 'compact' && appPageLayout.workspaceWidth !== 'standard'))
            ? 'max-w-none px-2 sm:px-4 lg:px-6'
            : appPageLayout.workspaceWidth === 'maximized'
            ? 'max-w-[97vw] 2xl:max-w-[1850px] px-2 sm:px-4 lg:px-5'
            : 'max-w-[1500px] px-2.5 sm:px-5'
        } ${
          appPageLayout.density === 'compact'
            ? 'py-1.5 sm:py-2.5 pb-18 md:pb-4'
            : 'py-3 sm:py-4.5 pb-22 md:pb-8'
        }`}
      >
        <Suspense fallback={<TabLoadingSkeleton />}>
          {/* Page 1: Home */}
          {currentTab === 'dashboard' && (
            <Dashboard
              lines={lines}
              todayDate={todayStr}
              activeDate={activeDate}
              onSelectDate={handleSelectDate}
              onInitializeDateLines={handleInitializeDateLines}
              layout={layout}
              onNavigate={handleNavigate}
              onSelectLine={setSelectedLineNo}
              selectedLineNo={selectedLineNo}
              onSaveLine={handleSaveLine}
              onChecklistCompleted={() => handleUpdateChecklistTask(activeDate || todayStr, 0, 'yes')}
              checklistCompletion={checklistCompletionPct}
              checklistCounts={{
                done: todayDone,
                pending: todayPending,
                notDone: todayNotDone,
                total: CHECKLIST_TASK_COUNT
              }}
              profile={profile}
              roleTiers={roleTiers}
              onOpenUserModal={() => handleOpenUserModal('profile')}
              onOpenScorecard={() => setIsScorecardOpen(true)}
              onOpenDatabase={handleOpenDatabase}
              checklists={checklists}
              onUpdateChecklistTask={handleUpdateChecklistTask}
              onBatchUpdateChecklist={handleBatchUpdateChecklist}
              onSaveMultipleLines={handleSaveMultipleLines}
              factoryProfile={factoryProfile}
              onOpenHourlyProduction={() => setIsHourlyProductionModalOpen(true)}
              onOpenLineBookingModal={handleOpenLineBookingModal}
            />
          )}

          {/* Unified Settings Section (Hosting Datas Operations Hub, Check List Compliance Hub, Lean Tools, Reports & Analytics, World WCM, Control Center & Preferences) */}
          {(currentTab === 'settings' || currentTab === 'datas' || currentTab === 'data' || currentTab === 'linedata' || currentTab === 'checklist' || currentTab === 'lean-tools' || currentTab === 'world' || currentTab === 'reports' || currentTab === 'components' || currentTab === 'visualizer') && (
            <SettingsControlCenterPage
              profile={profile}
              onUpdateProfile={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
              currentTheme={theme}
              onSelectTheme={setTheme}
              density={appPageLayout.density}
              onSelectDensity={handleSelectDensity}
              workspaceWidth={appPageLayout.workspaceWidth || 'maximized'}
              onSelectWorkspaceWidth={handleSelectWorkspaceWidth}
              smallAreaFeaturesEnabled={appPageLayout.smallAreaFeaturesEnabled !== false}
              onToggleSmallAreaFeatures={handleToggleSmallAreaFeatures}
              topBarConfig={topBarConfig}
              onSaveTopBarConfig={handleSaveTopBarConfig}
              onOpenTopBarCustomizer={() => setIsTopBarCustomizerOpen(true)}
              layout={layout}
              onUpdateLayout={setLayout}
              auditoryAlertsEnabled={auditoryAlertsEnabled}
              onToggleAuditoryAlerts={setAuditoryAlertsEnabled}
              onOpenAutoRefreshCustomizer={() => setIsAutoRefreshCustomizerOpen(true)}
              factoryProfile={factoryProfile}
              onUpdateFactoryProfile={handleUpdateFactoryProfile}
              savedFactories={savedFactories}
              onSaveFactoryList={handleSaveFactoryList}
              dailyBackupSettings={dailyBackupSettings}
              onUpdateDailyBackupSettings={setDailyBackupSettings}
              onTriggerManualBackup={() => handleTriggerDailyBackup('manual')}
              onOpenDatabase={handleOpenDatabase}
              onResetFactoryDefaults={handleResetFactoryDefaults}
              onLockTerminal={handleLockTerminal}
              onOpenAndroidPackage={() => setIsAndroidPackageModalOpen(true)}
              onOpenPrivacySecurity={() => setIsPrivacySecurityOpen(true)}
              onOpenUserModal={handleOpenUserModal}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenScorecard={() => setIsScorecardOpen(true)}
              roleTiers={roleTiers}
              lines={lines}
              onNavigate={handleNavigate}
              activeSection={settingsSection}
              onSelectSection={setSettingsSection}
              // Line Data Operations Hub Props
              checklists={checklists}
              selectedLineNo={selectedLineNo}
              onSelectLineNo={setSelectedLineNo}
              onSaveLine={handleSaveLine}
              onSaveMultipleLines={handleSaveMultipleLines}
              onAddNewLine={handleAddNewLine}
              onDeleteLine={handleDeleteLine}
              onDeleteFloor={handleDeleteFloor}
              onReorderLines={handleReorderLines}
              activeDate={activeDate}
              onSelectDate={handleSelectDate}
              activeFloor={activeFloor}
              onSelectFloor={setActiveFloor}
              onImportLines={handleImportLines}
              lineDataSubTab={lineDataSubTab}
              stations={stations}
              hourlyData={hourlyData}
              downtimeLog={downtimeLog}
              onOpenNewDowntime={() => setIsNewDowntimeModalOpen(true)}
              onUpdateHourNotes={handleUpdateHourNotes}
              onUpdateHourOutput={handleUpdateHourOutput}
              // Check List & Floor Compliance Hub Props
              selectedChecklistDate={selectedChecklistDate}
              onSelectChecklistDate={setSelectedChecklistDate}
              onUpdateTaskStatus={handleUpdateChecklistTask}
              onBatchUpdateChecklist={handleBatchUpdateChecklist}
              todos={todos}
              schedules={schedules}
              onUpdateTodos={setTodos}
              onUpdateSchedules={setSchedules}
              actionItems={actionItems}
              fiveWhys={fiveWhys}
              onOpenNewAction={() => setIsNewActionModalOpen(true)}
              onUpdateActionStatus={handleUpdateActionStatus}
              onAddNewFiveWhy={handleAddNewFiveWhy}
              auditChecks={auditChecks}
              centerlines={centerlines}
              onToggleAuditItem={handleToggleAuditItem}
              onUpdateCenterlineValue={handleUpdateCenterlineValue}
              onAddTodoFromAudit={handleAddTodoFromAudit}
              checklistSubTab={checklistSubTab}
              // Lean Tools & Industrial Engineering Cockpit Props
              leanActions={leanActions}
              onUpdateLeanActions={setLeanActions}
              onApplySimulationToLine={handleApplySimulationToLine}
              onAddNewLineWithSimulation={handleAddNewLineWithSimulation}
              leanToolsSubTab={leanToolsSubTab}
              onOpenLineBookingModal={handleOpenLineBookingModal}
            />
          )}
        </Suspense>
      </main>

      {/* Industrial Engineering Footer */}
      <footer className="mt-auto border-t border-[#d9d2c2] bg-[#fbfaf6] py-3.5 pb-20 md:pb-16 text-xs text-[#527078] cockpit-footer">
        <div className={`mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left ${
          appPageLayout.workspaceWidth === 'fluid'
            ? 'w-full max-w-none'
            : appPageLayout.workspaceWidth === 'maximized'
            ? 'w-full max-w-[97vw] 2xl:max-w-[1850px]'
            : 'max-w-[1500px]'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#17343a]">IE Daily Control</span>
            <span>•</span>
            <span>Garment Sewing Line Efficiency System</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline font-mono-numbers">Release v2.4.0</span>
          </div>

          <div className="flex items-center gap-4 font-mono-numbers text-[11px] flex-wrap">
            <span>Active Unit: Plant #1 ({profile.assignedUnit})</span>
            <span>•</span>
            <span className="text-[#176f78] font-bold">{profile.shift || 'General Shift (8:00 AM - 5:00 PM)'}</span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">Cloud Sync 100% OK</span>
          </div>
        </div>
      </footer>
      </motion.div>

      {/* Fixed Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={handleNavigate}
        checklistProgress={checklistCompletionPct}
        settingsSection={settingsSection}
        pendingTodosCount={pendingTodosCount}
        unreadNotificationsCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenDatabase={() => handleOpenDatabase('backup')}
        onOpenSettings={() => {
          handleNavigate('settings');
        }}
        onOpenUserModal={handleOpenUserModal}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAndroidPackage={() => setIsAndroidPackageModalOpen(true)}
        onOpenAuth={() => setIsAuthPageOpen(true)}
        profile={profile}
        navBarStyle={appPageLayout.navBarStyle}
      />

      {/* Modals - Lazy-loaded on-demand for lightning fast boot */}
      <Suspense fallback={null}>
        {isAuthPageOpen && (
          <AuthPage
            isOpen={isAuthPageOpen}
            currentProfile={profile}
            roleTiers={roleTiers}
            initialMode={authPageInitialMode}
            onSuccess={(updatedProfile) => {
              setProfile(updatedProfile);
              setIsAuthPageOpen(false);
              notifySave();
            }}
            onCancel={() => setIsAuthPageOpen(false)}
          />
        )}

        {isSettingsOpen && (
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            initialTab={settingsInitialTab}
            currentTab={currentTab}
            currentTheme={theme}
            onSelectTheme={setTheme}
            layout={layout}
            onUpdateLayout={setLayout}
            auditoryAlertsEnabled={auditoryAlertsEnabled}
            onToggleAuditoryAlerts={setAuditoryAlertsEnabled}
            onOpenPrivacySecurity={() => setIsPrivacySecurityOpen(true)}
            factoryProfile={factoryProfile}
            onUpdateFactoryProfile={handleUpdateFactoryProfile}
            savedFactories={savedFactories}
            onSaveFactoryList={handleSaveFactoryList}
            onNavigate={handleNavigate}
            dailyBackupSettings={dailyBackupSettings}
            onUpdateDailyBackupSettings={setDailyBackupSettings}
            onTriggerManualBackup={() => handleTriggerDailyBackup('manual')}
            onOpenDatabaseModal={(tab) => {
              setIsSettingsOpen(false);
              setDatabaseInitialTab(tab || 'backup');
              setIsDatabaseOpen(true);
            }}
            checklistProgress={checklistCompletionPct}
            pendingTodosCount={pendingTodosCount}
            unreadNotificationsCount={unreadNotificationsCount}
            scorecardScore={scorecardResult.overallScore}
            linesCount={currentDayLines.length}
            profile={profile}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenScorecard={() => setIsScorecardOpen(true)}
            onOpenUserModal={handleOpenUserModal}
            onOpenAuth={() => setIsAuthPageOpen(true)}
            onLockTerminal={handleLockTerminal}
            onOpenAndroidPackage={() => setIsAndroidPackageModalOpen(true)}
            onOpenDatabase={handleOpenDatabase}
            onOpenFactorySettings={handleOpenFactorySettings}
            lines={lines}
            roleTiers={roleTiers}
          />
        )}

        {isUserModalOpen && (
          <UserModal
            isOpen={isUserModalOpen}
            onClose={() => setIsUserModalOpen(false)}
            profile={profile}
            onUpdateProfile={setProfile}
            roleTiers={roleTiers}
            onUpdateRoleTiers={handleUpdateRoleTiers}
            initialTab={userModalTab}
            onLockTerminal={handleLockTerminal}
            onOpenPrivacySecurity={() => setIsPrivacySecurityOpen(true)}
            onOpenAuth={() => setIsAuthPageOpen(true)}
          />
        )}

        {isNotificationsOpen && (
          <NotificationsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            notifications={notifications}
            onMarkAsRead={handleMarkNotificationRead}
            onMarkAllAsRead={handleMarkAllNotificationsRead}
            onClearAll={handleClearNotifications}
            onNavigate={(tab, lineNo) => {
              setIsNotificationsOpen(false);
              handleNavigate(tab, lineNo);
            }}
          />
        )}

        {isDatabaseOpen && (
          <DatabaseModal
            isOpen={isDatabaseOpen}
            onClose={() => setIsDatabaseOpen(false)}
            profile={profile}
            lines={lines}
            checklists={checklists}
            todos={todos}
            leanActions={leanActions}
            onRestoreData={handleRestoreBackup}
            onResetFactoryData={handleResetFactoryDefaults}
            activeDataset={activeDataset}
            onLoadDebonairData={() => handleSelectDataset('debonair_sep17')}
            onImportLines={handleImportLines}
            activeDate={activeDate || todayStr}
            initialTab={databaseInitialTab}
            dailyBackupSettings={dailyBackupSettings}
            onUpdateDailyBackupSettings={setDailyBackupSettings}
            onOpenSettingsBackup={() => {
              setIsDatabaseOpen(false);
              setSettingsInitialTab('backup');
              setIsSettingsOpen(true);
            }}
            onTriggerManualBackup={() => handleTriggerDailyBackup('manual')}
            onOpenLineBookingModal={handleOpenLineBookingModal}
          />
        )}

        {isScorecardOpen && (
          <PerformanceScorecardModal
            isOpen={isScorecardOpen}
            onClose={() => setIsScorecardOpen(false)}
            lines={lines}
            checklists={checklists}
            selectedDate={selectedChecklistDate}
            onSelectDate={setSelectedChecklistDate}
            onNavigate={handleNavigate}
          />
        )}

        {isNewDowntimeModalOpen && (
          <NewDowntimeModal
            isOpen={isNewDowntimeModalOpen}
            onClose={() => setIsNewDowntimeModalOpen(false)}
            onAddDowntime={handleAddDowntimeIncident}
            preselectedStation="ST-02"
          />
        )}

        {isNewActionModalOpen && (
          <NewActionModal
            isOpen={isNewActionModalOpen}
            onClose={() => setIsNewActionModalOpen(false)}
            onAddAction={handleAddNewAction}
          />
        )}

        {isHourlyProductionModalOpen && (
          <QuickHourlyProductionModal
            isOpen={isHourlyProductionModalOpen}
            onClose={() => setIsHourlyProductionModalOpen(false)}
            lines={currentDayLines}
            hourlyData={hourlyData}
            selectedLineNo={selectedLineNo}
            onSaveHourlyUpdate={handleSaveHourlyProduction}
          />
        )}
      </Suspense>

      {/* Miniature 'Floor Status Snapshot' Overlay (Activated by long-press on floating chat button or quick trigger) */}
      {isFloorSnapshotOpen && (
        <div
          id="floor-status-snapshot-overlay"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-3.5 sm:bottom-24 sm:right-6 z-50 w-[330px] sm:w-[380px] max-h-[85vh] overflow-y-auto scrollbar-none rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#d9d2c2] dark:border-slate-700 shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200 select-none text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Activity className={`w-4 h-4 ${isSnapshotRefreshing ? 'text-emerald-500 animate-spin' : 'text-[#1a73e8]'}`} />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Floor Status Snapshot
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAutoRefreshCustomizerOpen(true)}
                    className={`inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold border transition-colors cursor-pointer ${
                      autoRefreshConfig.enabled
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 hover:bg-emerald-200'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300/60 hover:bg-amber-200'
                    }`}
                    title="Click to open Auto-Refresh Engine Customizer"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${autoRefreshConfig.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {autoRefreshConfig.enabled ? `LIVE ${autoRefreshConfig.intervalSeconds}s` : 'PAUSED'}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Unit-02 • {currentDayLines.length} Lines</span>
                  {autoRefreshConfig.showCountdown && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        {isSnapshotRefreshing
                          ? 'Refreshing...'
                          : autoRefreshConfig.enabled
                          ? `Auto-refreshes in ${snapshotCountdown}s`
                          : 'Refresh paused'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsAutoRefreshCustomizerOpen(true)}
                className="text-slate-400 hover:text-[#176f78] dark:hover:text-teal-400 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Customize Auto-Refresh Engine (Cadence, Intensity, Alerts)"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerSnapshotMetricsRefresh();
                  setSnapshotCountdown(autoRefreshConfig.intervalSeconds);
                }}
                disabled={isSnapshotRefreshing}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Refresh metrics now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSnapshotRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => setIsFloorSnapshotOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss snapshot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auto-Refresh Countdown Progress Bar */}
          {autoRefreshConfig.showProgressBar && autoRefreshConfig.enabled && (
            <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden my-1 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, ((autoRefreshConfig.intervalSeconds - snapshotCountdown) / autoRefreshConfig.intervalSeconds) * 100))}%` }}
              />
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-2.5 py-2.5">
            {/* Active Bottlenecks */}
            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                activeBottleneckLines.length > 0
                  ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Bottlenecks
                </span>
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${
                    activeBottleneckLines.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">
                {activeBottleneckLines.length}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5 truncate">
                {activeBottleneckLines.length > 0
                  ? `Lines: ${activeBottleneckLines.map(l => l.lineNo).join(', ')}`
                  : 'All stations balanced'}
              </div>
            </div>

            {/* WIP Breaches */}
            <div
              className={`p-2.5 rounded-2xl border transition-all ${
                activeWipBreachedLines.length > 0
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  WIP Breaches
                </span>
                <Flame
                  className={`w-3.5 h-3.5 ${
                    activeWipBreachedLines.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600'
                  }`}
                />
              </div>
              <div className="text-2xl font-black mt-1 font-mono">
                {activeWipBreachedLines.length}
              </div>
              <div className="text-[10px] opacity-80 mt-0.5 truncate">
                {activeWipBreachedLines.length > 0
                  ? `Lines: ${activeWipBreachedLines.map(l => l.lineNo).join(', ')}`
                  : 'Within buffer limits'}
              </div>
            </div>
          </div>

          {/* 4-Hour WIP Level Trend Mini Sparkline Chart */}
          <div className="pb-2">
            <FloorWipSparkline
              lines={currentDayLines}
              initialSelectedLineNo={selectedLineNo}
              onNavigateLine={(lineNo) => {
                setSelectedLineNo(lineNo);
              }}
            />
          </div>

          {/* Quick Line Tags if breached */}
          {(activeBottleneckLines.length > 0 || activeWipBreachedLines.length > 0) && (
            <div className="pb-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Attention: </span>
              {activeBottleneckLines.length > 0 && (
                <span>Bottlenecks on {activeBottleneckLines.slice(0, 3).map(l => `Line ${l.lineNo}`).join(', ')}. </span>
              )}
              {activeWipBreachedLines.length > 0 && (
                <span>WIP overload on {activeWipBreachedLines.slice(0, 3).map(l => `Line ${l.lineNo}`).join(', ')}.</span>
              )}
            </div>
          )}

          {/* Snapshot Footer & Quick Export Actions */}
          <div className="pt-2.5 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyFloorSnapshot}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-95 ${
                  isSnapshotCopied
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-[#176f78] hover:bg-[#12555c] text-white shadow-[#176f78]/20'
                }`}
                title="Convert current critical telemetry metrics into a text summary and copy to clipboard"
              >
                {isSnapshotCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Snapshot Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-300" />
                    <span>Quick Export Snapshot</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFloorSnapshotOpen(false);
                  setIsChatOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Open Shop Floor Google Chat"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span className="hidden sm:inline">Google Chat</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-0.5">
              <span>{isSnapshotCopied ? '✓ Telemetry summary on clipboard' : 'Click to copy text summary for chat / email'}</span>
              <span>Updated {snapshotLastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Refresh Engine Customizer Modal */}
      {isAutoRefreshCustomizerOpen && (
        <AutoRefreshEngineCustomizerModal
          isOpen={isAutoRefreshCustomizerOpen}
          onClose={() => setIsAutoRefreshCustomizerOpen(false)}
          config={autoRefreshConfig}
          onUpdateConfig={handleUpdateAutoRefreshConfig}
          onTriggerTestRefresh={() => {
            triggerSnapshotMetricsRefresh();
            setSnapshotCountdown(autoRefreshConfig.intervalSeconds);
          }}
          countdown={snapshotCountdown}
        />
      )}
      {/* Unified Floating Actions Dock (Frontline Quick Action FAB, Google Chat & Floor Snapshot) */}
      <div
        id="floating-actions-dock"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:bottom-20 right-3.5 sm:right-6 z-40 flex flex-col items-end gap-2.5 sm:flex-row sm:items-center sm:gap-2.5 select-none pointer-events-none"
      >
        {/* 1. Floor Status Snapshot Trigger (Desktop / Tablet view) */}
        <button
          id="floating-floor-snapshot-quick-btn"
          type="button"
          onClick={() => setIsFloorSnapshotOpen(prev => !prev)}
          title="Toggle Floor Status Snapshot (4-Hour WIP Trend & Bottlenecks)"
          aria-label="Floor Status Snapshot"
          className={`hidden sm:flex pointer-events-auto order-1 items-center justify-center gap-1.5 h-12 px-3.5 rounded-2xl transition-all cursor-pointer shadow-xl border touch-manipulation active:scale-95 ${
            isFloorSnapshotOpen
              ? 'bg-[#176f78] text-white border-[#176f78] ring-2 ring-[#176f78]/30 shadow-[#176f78]/20'
              : 'bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-200 border-[#d9d2c2] dark:border-slate-700 hover:border-[#176f78]'
          }`}
        >
          <Activity className="w-4 h-4 text-[#176f78] dark:text-teal-400 shrink-0" />
          <span className="text-xs font-bold font-display whitespace-nowrap">Floor Snapshot</span>
          {activeWipBreachedLines.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
              {activeWipBreachedLines.length}
            </span>
          )}
        </button>

        {/* 2. Floating Google Chat Trigger Button (Click to open, Long-press to toggle Floor Status Snapshot) */}
        <button
          id="floating-ie-ai-chat-btn"
          onPointerDown={handleChatButtonPointerDown}
          onPointerUp={handleChatButtonPointerUp}
          onPointerCancel={handleChatButtonPointerCancel}
          onPointerLeave={handleChatButtonPointerCancel}
          title="Google Chat • Click to open Google Chat, or long-press to toggle Floor Status Snapshot"
          aria-label="Google Chat Workspace & Floor Status Snapshot"
          className="pointer-events-auto order-2 sm:order-2 flex items-center justify-center gap-2 sm:gap-2.5 h-12 w-12 min-w-[48px] min-h-[48px] sm:w-auto sm:px-4 rounded-full sm:rounded-2xl bg-gradient-to-r from-[#1e8e3e] to-[#1a73e8] hover:from-[#188038] hover:to-[#1557b0] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer border border-blue-400/30 group animate-subtle-breathe touch-manipulation"
        >
          {/* Subtle breathing aura glow */}
          <span className="absolute -inset-1 rounded-full sm:rounded-2xl bg-blue-400/25 blur-xs pointer-events-none animate-ai-pulse-aura -z-10" />

          <div className="relative">
            <MessageSquare className="w-5 h-5 text-white fill-white shrink-0" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1a73e8] animate-ping" />
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold leading-tight font-display tracking-wider whitespace-nowrap">Google Chat</span>
              {isPeakHour && (
                <span className="text-[9px] font-black uppercase px-1 py-0.2 rounded bg-amber-300 text-amber-950 leading-none shadow-2xs">
                  Peak
                </span>
              )}
            </div>
            <span className="text-[10px] text-blue-100 leading-tight whitespace-nowrap">Spaces • AI</span>
          </div>
        </button>

        {/* 3. Frontline Quick Action FAB Speed Dial */}
        <div className="pointer-events-auto order-1 sm:order-3">
          <MobileQuickActionFAB
            onOpenHourlyProduction={() => setIsHourlyProductionModalOpen(true)}
            onOpenNewDowntime={() => setIsNewDowntimeModalOpen(true)}
            onOpenNewAction={() => setIsNewActionModalOpen(true)}
            onToggleFloorSnapshot={() => setIsFloorSnapshotOpen(prev => !prev)}
            onNavigate={handleNavigate}
          />
        </div>
      </div>

      {/* Heavy Subsystems - Lazy Loaded on Demand */}
      <Suspense fallback={null}>
        {/* Integrated Shop Floor Google Chat & Gemini AI Hub Modal */}
        {isChatOpen && (
          <GoogleChatHubModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            profile={profile}
            lines={lines}
          />
        )}

        {/* Enterprise Privacy & Security Controls Modal */}
        {isPrivacySecurityOpen && (
          <PrivacySecurityModal
            isOpen={isPrivacySecurityOpen}
            onClose={() => setIsPrivacySecurityOpen(false)}
            settings={privacySettings}
            onUpdateSettings={setPrivacySettings}
            onLockTerminal={handleLockTerminal}
            auditTrail={securityAuditTrail}
            onClearCache={handleClearCache}
            profile={profile}
            roleTiers={roleTiers}
          />
        )}

        {/* Terminal Workstation Lock Screen */}
        {privacySettings.isLocked && (
          <TerminalLockScreen
            isLocked={privacySettings.isLocked}
            onUnlock={handleUnlockTerminal}
            pinCode={privacySettings.pinCode}
            profile={profile}
          />
        )}

        {/* Android Package & Mobile Installation Hub Modal */}
        {isAndroidPackageModalOpen && (
          <AndroidPackageModal
            isOpen={isAndroidPackageModalOpen}
            onClose={() => setIsAndroidPackageModalOpen(false)}
          />
        )}

        {/* Top Bar & Mobile UX Polish Customizer Modal */}
        {isTopBarCustomizerOpen && (
          <TopBarCustomizationModal
            isOpen={isTopBarCustomizerOpen}
            onClose={() => setIsTopBarCustomizerOpen(false)}
            config={topBarConfig}
            onSaveConfig={handleSaveTopBarConfig}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          />
        )}

        {/* Line Booking for Upcoming Styles & Monthly Budget Modal */}
        {isLineBookingModalOpen && (
          <LineBookingAndBudgetModal
            isOpen={isLineBookingModalOpen}
            onClose={() => setIsLineBookingModalOpen(false)}
            initialTab={lineBookingInitialTab}
            lines={lines}
            onSyncLinesWithBookings={handleSyncLinesWithBookings}
            profile={profile}
          />
        )}
      </Suspense>

      {/* Real-Time Connectivity Offline Indicator with Direct Access to Activity Log */}
      <OfflineIndicator
        profile={profile}
        onOpenOfflineLog={() => {
          setDatabaseInitialTab('offline-log');
          setIsDatabaseOpen(true);
        }}
      />
    </div>
  );
}
