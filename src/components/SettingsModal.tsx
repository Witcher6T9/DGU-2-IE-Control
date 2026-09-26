/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Settings,
  Layout,
  Palette,
  Check,
  Volume2,
  VolumeX,
  BellRing,
  Play,
  Shield,
  Factory,
  CheckCircle2,
  Layers,
  ArrowRight,
  HardDrive,
  Clock,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sliders,
  Code2,
  Copy,
  Terminal,
  Database,
  Smartphone,
  CheckSquare,
  Activity,
  LayoutGrid,
  Wrench,
  FileSpreadsheet,
  TrendingUp,
  Network,
  Upload,
  MessageSquare,
  Award,
  Lock,
  User,
  Search,
  ExternalLink,
  ShieldCheck,
  Bell,
  Eye,
  Flame,
  Zap,
  Gauge,
  Sun,
  Moon,
  Info,
  SmartphoneNfc,
  DownloadCloud,
  RotateCcw
} from 'lucide-react';
import { AndroidLogoIcon } from './AndroidLogoIcon';
import {
  ThemeType,
  DashboardLayout,
  FactoryIndustryProfile,
  UserDailyBackupSettings,
  DailyBackupRecord,
  UserProfile,
  LineEntry,
  RoleTier
} from '../types';
import { DEFAULT_DAILY_BACKUP_SETTINGS } from '../utils/indexedDbBackup';
import { DEFAULT_DASHBOARD_LAYOUT, SYSTEM_ADMIN_PROFILE } from '../mockData';
import { playWipAlertSound, playBottleneckAlertSound } from '../utils/audioAlert';
import { isMasterAdminOrAdmin, isSystemAdmin, SYSTEM_ADMIN_EMAIL } from '../utils/rbac';
import { Tier0CommandHub, TIER_0_MODULES, Tier0ModuleId } from './tier0/Tier0CommandHub';

export type SettingsTab =
  | 'all'
  | 'modules'
  | 'utilities'
  | 'backup'
  | 'themes'
  | 'alerts'
  | 'layout'
  | 'updates'
  | 'tier_0';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeType;
  onSelectTheme: (theme: ThemeType) => void;
  layout: DashboardLayout;
  onUpdateLayout: (layout: DashboardLayout) => void;
  auditoryAlertsEnabled?: boolean;
  onToggleAuditoryAlerts?: (enabled: boolean) => void;
  onOpenPrivacySecurity?: () => void;
  initialTab?: SettingsTab;
  currentTab?: string;
  onNavigate?: (tab: string, lineNo?: string) => void;
  factoryProfile?: FactoryIndustryProfile;
  onUpdateFactoryProfile?: (updated: FactoryIndustryProfile) => void;
  savedFactories?: FactoryIndustryProfile[];
  onSaveFactoryList?: (list: FactoryIndustryProfile[]) => void;
  dailyBackupSettings?: UserDailyBackupSettings;
  onUpdateDailyBackupSettings?: (updated: UserDailyBackupSettings) => void;
  onTriggerManualBackup?: () => Promise<DailyBackupRecord>;
  onOpenDatabaseModal?: (tab?: 'backup' | 'csv-import') => void;
  // Quick Utilities Handlers
  checklistProgress?: number;
  pendingTodosCount?: number;
  unreadNotificationsCount?: number;
  scorecardScore?: number;
  linesCount?: number;
  profile?: UserProfile;
  onOpenNotifications?: () => void;
  onOpenChat?: () => void;
  onOpenScorecard?: () => void;
  onOpenUserModal?: (tab?: 'profile' | 'roles') => void;
  onOpenAuth?: () => void;
  onLockTerminal?: () => void;
  onOpenAndroidPackage?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  onOpenFactorySettings?: () => void;
  lines?: LineEntry[];
  roleTiers?: RoleTier[];
}

/**
 * Authentic iOS Cupertino Switch (UISwitch / SwiftUI Toggle)
 * 51px x 31px with 27px thumb and smooth native transition
 */
const CupertinoSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}> = ({ checked, onChange, disabled, ariaLabel }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-label={ariaLabel || 'Toggle switch'}
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange(!checked);
      }}
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-200 ease-in-out focus:outline-hidden touch-manipulation ${
        checked ? 'bg-[#34c759]' : 'bg-[#e9e9ea] dark:bg-[#39393d]'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'}`}
    >
      <span
        className={`pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.18),0_1px_1px_rgba(0,0,0,0.06)] ring-0 transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-[20px]' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

/**
 * iOS SF Symbol Style Squircle Icon with subtle depth
 */
const SquircleIcon: React.FC<{
  bgColor: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}> = ({ bgColor, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-[7px]',
    md: 'w-8 h-8 rounded-[8px]',
    lg: 'w-10 h-10 rounded-[10px]'
  };

  return (
    <div
      className={`${sizeClasses[size]} ${bgColor} text-white flex items-center justify-center shrink-0 shadow-2xs`}
    >
      {children}
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  layout,
  onUpdateLayout,
  auditoryAlertsEnabled = false,
  onToggleAuditoryAlerts,
  onOpenPrivacySecurity,
  initialTab = 'all',
  currentTab = 'dashboard',
  onNavigate,
  factoryProfile,
  dailyBackupSettings = DEFAULT_DAILY_BACKUP_SETTINGS,
  onUpdateDailyBackupSettings,
  onTriggerManualBackup,
  onOpenDatabaseModal,
  checklistProgress = 0,
  pendingTodosCount = 0,
  unreadNotificationsCount = 0,
  scorecardScore,
  linesCount = 34,
  profile,
  onOpenNotifications,
  onOpenChat,
  onOpenScorecard,
  onOpenUserModal,
  onOpenAuth,
  onLockTerminal,
  onOpenAndroidPackage,
  onOpenDatabase,
  onOpenFactorySettings,
  lines = [],
  roleTiers = []
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);
  const isSysAdmin = isSystemAdmin(profile);
  const [selectedTier0Module, setSelectedTier0Module] = useState<Tier0ModuleId>('schema-forge');

  // Navigation stack state: 'root' (all settings list) or a sub-page id
  const [activeSubPage, setActiveSubPage] = useState<SettingsTab>(() => {
    const target = initialTab === 'modules' ? 'modules' : (initialTab || 'all');
    if ((target === 'backup' || target === 'updates') && !isMasterAdmin) {
      return 'all';
    }
    if (target === 'tier_0' && !isSysAdmin) {
      return 'all';
    }
    return target;
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingTestSound, setPlayingTestSound] = useState<'wip' | 'bottleneck' | null>(null);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState<boolean>(false);
  const [backupToast, setBackupToast] = useState<string | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatusMsg, setUpdateStatusMsg] = useState<string | null>(null);
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState<boolean>(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleCheckForUpdates = () => {
    setIsCheckingUpdate(true);
    setUpdateStatusMsg(null);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      setUpdateStatusMsg('DGU-2 IE Control is up to date (Version 2.4.0).');
      setTimeout(() => setUpdateStatusMsg(null), 4500);
    }, 1200);
  };

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      const target = initialTab || 'all';
      if ((target === 'backup' || target === 'updates') && !isMasterAdmin) {
        setActiveSubPage('all');
      } else if (target === 'tier_0' && !isSysAdmin) {
        setActiveSubPage('all');
      } else {
        setActiveSubPage(target);
      }
      setSearchQuery('');
    }
  }, [isOpen, initialTab, isMasterAdmin, isSysAdmin]);

  if (!isOpen) return null;

  const handleTestSound = (type: 'wip' | 'bottleneck') => {
    setPlayingTestSound(type);
    if (type === 'wip') {
      playWipAlertSound(true);
    } else {
      playBottleneckAlertSound(true);
    }
    setTimeout(() => {
      setPlayingTestSound(null);
    }, 700);
  };

  const handleToggleAudio = () => {
    if (onToggleAuditoryAlerts) {
      const nextState = !auditoryAlertsEnabled;
      onToggleAuditoryAlerts(nextState);
      if (nextState) {
        playWipAlertSound(true);
      }
    }
  };

  const handleUpdateBackup = (partial: Partial<UserDailyBackupSettings>) => {
    if (onUpdateDailyBackupSettings) {
      onUpdateDailyBackupSettings({
        ...dailyBackupSettings,
        ...partial
      });
    }
  };

  const handleManualBackupClick = async () => {
    if (!onTriggerManualBackup) return;
    setIsTriggeringBackup(true);
    setBackupToast(null);
    try {
      const record = await onTriggerManualBackup();
      setBackupToast(`Snapshot saved to IndexedDB! (${record.stats.sizeFormatted})`);
      setTimeout(() => setBackupToast(null), 3000);
    } catch (err: any) {
      setBackupToast(`Backup failed: ${err?.message || 'Storage error'}`);
      setTimeout(() => setBackupToast(null), 3000);
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  const handleModuleLaunch = (tabId: string) => {
    if (onNavigate) {
      onNavigate(tabId);
    }
    onClose();
  };

  // 1. ALL IE NAVIGATION MODULES
  const ieNavigationModules = [
    {
      id: 'dashboard',
      title: 'Production Dashboard',
      subtitle: 'Real-time Line Overview, OEE & Attainment Strip',
      category: 'Floor Operations',
      icon: Activity,
      color: 'bg-[#176f78]',
      badge: 'Active Hub',
      badgeColor: 'text-[#176f78] dark:text-teal-400 font-bold',
      description: 'Command center for real-time plant KPIs, hourly output, WIP buffers, and frontline status.'
    },
    {
      id: 'linedata',
      title: 'Workstation & Line Balancing',
      subtitle: '34 Sewing Lines, Cycle Times & DHU Defect Rates',
      category: 'Floor Operations',
      icon: Layers,
      color: 'bg-[#007aff]',
      badge: `${linesCount} Lines`,
      badgeColor: 'text-[#007aff] dark:text-blue-400 font-bold',
      description: 'Granular workstation-by-workstation cycle time tracking, Yamazumi charts, and bottleneck alarms.'
    },
    {
      id: 'floor-plan',
      title: 'Visual Floor Plan & Line Setup',
      subtitle: 'Spatial Layout, Machine Types & Team Layouts',
      category: 'Floor Operations',
      icon: LayoutGrid,
      color: 'bg-[#5856d6]',
      badge: 'Spatial Map',
      badgeColor: 'text-[#5856d6] dark:text-indigo-400 font-bold',
      description: 'Interactive graphical representation of sewing floors, machine assignments, and operator stations.'
    },
    {
      id: 'simulator',
      title: 'IE Line Setup & Flow Simulator',
      subtitle: 'Takt Time, SMV Balancing & Manpower Tuning',
      category: 'Engineering & Setup',
      icon: Sliders,
      color: 'bg-[#ff9500]',
      badge: 'Pro Flow',
      badgeColor: 'text-[#ff9500] dark:text-amber-400 font-bold',
      description: 'Simulate line balancing scenarios, calculate operator requirements, and tune SMV targets.'
    },
    {
      id: 'checklist',
      title: 'IE Daily Activity Tracking',
      subtitle: 'Morning Huddle, Hourly Pacing & Shift Audits',
      category: 'Daily Frontline',
      icon: CheckSquare,
      color: 'bg-[#34c759]',
      badge: `${checklistProgress}% Done`,
      badgeColor: 'text-[#34c759] dark:text-emerald-400 font-bold',
      description: '12-point daily industrial engineering verification checklist with audit compliance logs.'
    },
    {
      id: 'todo-schedule',
      title: 'Floor Tasks & Shift Timeline',
      subtitle: 'Line Action Items, 5-Whys & Floor Priorities',
      category: 'Daily Frontline',
      icon: Clock,
      color: 'bg-[#ff2d55]',
      badge: `${pendingTodosCount} Open`,
      badgeColor: 'text-[#ff2d55] dark:text-rose-400 font-bold',
      description: 'Frontline action item tracker, 5-Whys root cause resolution, and shift time-blocking calendar.'
    },
    {
      id: 'lean-toolkit',
      title: 'Lean 13 Methods & Kaizens',
      subtitle: '5S Audits, SMED Changeover, 7 Wastes & Poka-Yoke',
      category: 'Lean & Quality',
      icon: Wrench,
      color: 'bg-[#af52de]',
      badge: '13 Methods',
      badgeColor: 'text-[#af52de] dark:text-purple-400 font-bold',
      description: 'Interactive Kaizen workshops, 5S scorecards, SMED quick changeover timers, and waste analysis.'
    },
    {
      id: 'monthly',
      title: 'Monthly Efficiency Analytics',
      subtitle: 'Plant Attainment, Efficiency Trends & Month-to-Date',
      category: 'Analytics & Reporting',
      icon: Calendar,
      color: 'bg-[#30b0c7]',
      badge: 'MTD Trends',
      badgeColor: 'text-[#30b0c7] dark:text-cyan-400 font-bold',
      description: 'Long-term statistical efficiency modeling, operator curve progression, and historical comparisons.'
    },
    {
      id: 'reports',
      title: 'Shift Audit Reports & CSV',
      subtitle: 'Executive Daily Summary, PDF & Excel Exports',
      category: 'Analytics & Reporting',
      icon: FileSpreadsheet,
      color: 'bg-[#107c41]',
      badge: 'Export Hub',
      badgeColor: 'text-[#107c41] dark:text-emerald-400 font-bold',
      description: 'Instant generation of daily floor summaries, printable PDF reports, and structured CSV spreadsheets.'
    },
    {
      id: 'line-history',
      title: 'Line Production History & Charts',
      subtitle: 'Trendlines, Day-over-Day Attainment & Curves',
      category: 'Analytics & Reporting',
      icon: TrendingUp,
      color: 'bg-[#007aff]',
      badge: 'Charts',
      badgeColor: 'text-[#007aff] dark:text-blue-400 font-bold',
      description: 'Historical line-by-line performance trajectories, output pacing, and DHU quality trends.'
    },
    ...(isMasterAdmin
      ? [
          {
            id: 'roles',
            title: 'Debonair Unit-02 IE Org & Roles',
            subtitle: '4-Tier Hierarchy, Line Assignments & Permissions',
            category: 'Governance & RBAC',
            icon: Network,
            color: 'bg-[#1e3a8a]',
            badge: 'RBAC 4 Tiers',
            badgeColor: 'text-[#1e3a8a] dark:text-indigo-400 font-bold',
            description: 'Frontline organogram mapping Sr. Managers, Wing Managers, Incharges, and Line Engineers.'
          }
        ]
      : [])
  ];

  // 2. ALL FRONTLINE QUICK UTILITIES (Filtered for Master Admin / Admin only)
  const quickUtilities = [
    ...(isMasterAdmin
      ? [
          {
            id: 'util-import-csv',
            title: 'Import Line Data (CSV / Excel)',
            subtitle: 'Bulk upload 34 lines, SMV targets and styles',
            category: 'Data Management',
            icon: Upload,
            color: 'bg-[#107c41]',
            actionLabel: 'Import',
            onClick: () => {
              onClose();
              if (onOpenDatabase) onOpenDatabase('csv-import');
              else if (onOpenDatabaseModal) onOpenDatabaseModal('csv-import');
            }
          },
          {
            id: 'util-backup-db',
            title: 'Automated Daily Backup (IndexedDB)',
            subtitle: 'Configure daily snapshot schedule & local flash restore',
            category: 'Data Management',
            icon: HardDrive,
            color: 'bg-[#ff9500]',
            actionLabel: 'Manage',
            badge: dailyBackupSettings.autoDailyBackupEnabled ? 'Active' : 'Off',
            onClick: () => {
              setActiveSubPage('backup');
            }
          }
        ]
      : []),
    {
      id: 'util-floor-chat',
      title: 'Google Chat Workspace',
      subtitle: 'Shop floor Google Chat spaces and Gemini AI guidance',
      category: 'Frontline Operations',
      icon: MessageSquare,
      color: 'bg-[#1a73e8]',
      actionLabel: 'Open Spaces',
      badge: 'Live Spaces',
      onClick: () => {
        onClose();
        if (onOpenChat) onOpenChat();
      }
    },
    {
      id: 'util-scorecard',
      title: 'IE Performance Scorecard',
      subtitle: 'Daily operational effectiveness KPI calculation',
      category: 'Governance & Quality',
      icon: Award,
      color: 'bg-[#176f78]',
      actionLabel: 'View',
      badge: typeof scorecardScore === 'number' ? `${scorecardScore}%` : undefined,
      onClick: () => {
        onClose();
        if (onOpenScorecard) onOpenScorecard();
      }
    },
    ...(isMasterAdmin
      ? [
          {
            id: 'util-rbac-roles',
            title: 'RBAC Roles, Tiers & Organogram',
            subtitle: 'Configure hierarchy, wing managers & permissions',
            category: 'Governance & Quality',
            icon: ShieldCheck,
            color: 'bg-[#1e3a8a]',
            actionLabel: 'Manage',
            onClick: () => {
              onClose();
              if (onOpenUserModal) onOpenUserModal('roles');
            }
          }
        ]
      : []),
    {
      id: 'util-user-profile',
      title: 'Operator & Engineering Profile',
      subtitle: profile?.name ? `${profile.name} (${profile.jobTitle})` : 'View profile details & credentials',
      category: 'Governance & Quality',
      icon: User,
      color: 'bg-[#007aff]',
      actionLabel: 'Edit',
      onClick: () => {
        onClose();
        if (onOpenUserModal) onOpenUserModal('profile');
      }
    },
    {
      id: 'util-sign-in',
      title: 'Frontline Sign-In & SSO Session',
      subtitle: 'Authenticate or switch operator station session',
      category: 'Security & Access',
      icon: Lock,
      color: 'bg-[#34c759]',
      actionLabel: 'Login',
      onClick: () => {
        onClose();
        if (onOpenAuth) onOpenAuth();
      }
    },
    ...(isMasterAdmin
      ? [
          {
            id: 'util-lock-terminal',
            title: 'Lock Workstation Terminal',
            subtitle: 'PIN-secured terminal lock for shop floor stations',
            category: 'Security & Access',
            icon: Shield,
            color: 'bg-[#ff3b30]',
            actionLabel: 'Lock',
            onClick: () => {
              onClose();
              if (onLockTerminal) onLockTerminal();
            }
          },
          {
            id: 'util-android-package',
            title: 'System Updates & Install (Android APK)',
            subtitle: 'Version 2.4.0 • Download standalone APK or install PWA to home screen',
            category: 'Mobile & Terminal',
            icon: DownloadCloud,
            color: 'bg-[#007aff]',
            actionLabel: 'Updates',
            badge: 'v2.4.0 Up to date',
            onClick: () => {
              setActiveSubPage('updates');
            }
          }
        ]
      : []),
    ...(isSysAdmin
      ? [
          {
            id: 'util-tier0-hub',
            title: 'Tier_0 Only • Root Suite',
            subtitle: 'Schema Forge • Access Matrix • Security Loop • Plant Security • Privacy Vault • Backup Forge • Audit Forensics • Maintenance Hub',
            category: 'Tier_0 Root Operations',
            icon: ShieldCheck,
            color: 'bg-teal-600',
            actionLabel: 'Tier 0',
            badge: 'ROOT ACTIVE',
            onClick: () => {
              setSelectedTier0Module('schema-forge');
              setActiveSubPage('tier_0');
            }
          },
          ...TIER_0_MODULES.map(m => ({
            id: `util-tier0-${m.id}`,
            title: m.name,
            subtitle: m.shortDesc,
            category: 'Tier_0 Root Operations',
            icon: m.icon,
            color: 'bg-teal-600',
            actionLabel: 'Launch',
            badge: m.badge,
            onClick: () => {
              setSelectedTier0Module(m.id);
              setActiveSubPage('tier_0');
            }
          }))
        ]
      : []),
    {
      id: 'util-alerts-notifications',
      title: 'Production Alerts & Notifications',
      subtitle: 'Floor notifications, WIP threshold warnings, and sync logs',
      category: 'Frontline Operations',
      icon: Bell,
      color: 'bg-[#ff2d55]',
      actionLabel: 'Alerts',
      badge: unreadNotificationsCount > 0 ? `${unreadNotificationsCount} New` : undefined,
      onClick: () => {
        onClose();
        if (onOpenNotifications) onOpenNotifications();
      }
    },
    ...(isMasterAdmin
      ? [
          {
            id: 'util-factory-profile',
            title: 'Plant & Industry Enterprise Setup',
            subtitle: `${factoryProfile?.name || 'Debonair LTD'} • ${factoryProfile?.unitName || 'Unit-02'} (${factoryProfile?.industrySector || 'Garments'})`,
            category: 'Data Management',
            icon: Factory,
            color: 'bg-[#176f78]',
            actionLabel: 'Setup',
            onClick: () => {
              onClose();
              if (onOpenFactorySettings) onOpenFactorySettings();
            }
          }
        ]
      : [])
  ];

  // Search filtering
  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return ieNavigationModules;
    const q = searchQuery.toLowerCase();
    return ieNavigationModules.filter(
      m =>
        m.title.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }, [searchQuery, ieNavigationModules]);

  const filteredUtilities = useMemo(() => {
    if (!searchQuery.trim()) return quickUtilities;
    const q = searchQuery.toLowerCase();
    return quickUtilities.filter(
      u =>
        u.title.toLowerCase().includes(q) ||
        u.subtitle.toLowerCase().includes(q) ||
        u.category.toLowerCase().includes(q)
    );
  }, [searchQuery, quickUtilities]);

  const themes: { id: ThemeType; label: string; desc: string; previewClass: string; colorDot: string }[] = [
    {
      id: 'light',
      label: 'Warm Cream (Standard)',
      desc: 'Eye-comfortable neutral canvas for long shifts',
      previewClass: 'bg-[#f5f3ec] border-[#176f78] text-[#17343a]',
      colorDot: 'bg-[#f5f3ec] border-[#176f78]'
    },
    {
      id: 'dark',
      label: 'Night Shift Darkroom',
      desc: 'Low-glare high contrast slate theme for dim monitoring rooms',
      previewClass: 'bg-[#182026] border-teal-500 text-slate-100',
      colorDot: 'bg-[#182026] border-teal-500'
    },
    {
      id: 'forest',
      label: 'Lean Emerald Kaizen',
      desc: 'Crisp green hues highlighting continuous improvement and zero defects',
      previewClass: 'bg-[#f0f7f3] border-emerald-700 text-emerald-950',
      colorDot: 'bg-[#107c41] border-emerald-700'
    },
    {
      id: 'sunset',
      label: 'Amber Production Floor',
      desc: 'Warm amber tones for high-density line management',
      previewClass: 'bg-[#fffaf2] border-amber-600 text-amber-950',
      colorDot: 'bg-[#ff9500] border-amber-600'
    },
    {
      id: 'industrial',
      label: 'Industrial Steel & Monolith',
      desc: 'Technical steel and graphite theme inspired by modern machinery',
      previewClass: 'bg-[#eef2f5] border-slate-700 text-slate-900',
      colorDot: 'bg-[#475569] border-slate-700'
    }
  ];

  const currentThemeLabel = useMemo(() => {
    return themes.find(t => t.id === currentTheme)?.label || 'Warm Cream';
  }, [currentTheme]);

  const layoutToggles: { key: keyof DashboardLayout; label: string; desc: string }[] = [
    {
      key: 'showHero',
      label: 'Executive Overview Header Card',
      desc: 'Top summary banner with live date and real-time operational status badge'
    },
    {
      key: 'showStats',
      label: 'KPI Metrics & Attainment Strip',
      desc: '6 core factory indicators: Factory Eff %, Target vs Achieved, WIP buffer, Attendance'
    },
    {
      key: 'showQuickActions',
      label: 'Frontline Quick Actions Bar',
      desc: 'Fast shortcuts for checklist logging, daily report downloads, and team setup'
    },
    {
      key: 'showAbsents',
      label: 'Operator & Helper Absenteeism',
      desc: 'Floor-by-floor manpower attendance rates with shortage impact analysis'
    },
    {
      key: 'showBalancingGraph',
      label: 'Balancing Loss & Bottleneck Alerts',
      desc: 'Real-time bottleneck warnings, cycle time deviations, and balancing status'
    },
    {
      key: 'showIO',
      label: 'Input / Output (I/O) Production Flow',
      desc: 'Hourly pacing tracking input vs output pieces with WIP threshold monitoring'
    },
    {
      key: 'showUpcoming',
      label: 'Upcoming Style Transitions',
      desc: 'Notice board for next scheduled style inputs and sample readiness'
    },
    {
      key: 'showQuickReports',
      label: 'Quick Reports & Executive Rollup',
      desc: '3-pillar rollup of plant efficiency, WIP count, and manpower across lines'
    }
  ];

  const handleToggleLayout = (key: keyof DashboardLayout) => {
    onUpdateLayout({
      ...layout,
      [key]: !layout[key]
    });
  };

  // Get active subpage title for top bar navigation
  const getSubPageTitle = (subPage: SettingsTab) => {
    switch (subPage) {
      case 'modules':
        return 'IE Workspaces';
      case 'utilities':
        return 'Quick Utilities';
      case 'backup':
        return 'Daily Backup';
      case 'themes':
        return 'Themes';
      case 'alerts':
        return 'Sound & Alerts';
      case 'layout':
        return 'Widgets Layout';
      case 'updates':
        return 'System Updates & Install';
      case 'tier_0':
        return 'Tier_0 Only • Root Suite';
      default:
        return 'Settings';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/65 backdrop-blur-xs animate-fadeIn overflow-hidden">
      {/* 
        Native Mobile Settings Container:
        - Full-screen on mobile (< 640px) with safe area insets (edge-to-edge iOS Settings feel)
        - Inset modal window on tablet/desktop (>= 640px) with rounded corners & shadow
      */}
      <div className="w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-[#f2f2f7] dark:bg-[#000000] sm:rounded-3xl sm:border border-[#d1d1d6] dark:border-[#38383a] shadow-2xl flex flex-col overflow-hidden text-[#1c1c1e] dark:text-[#f2f2f7] transition-all">
        
        {/* iOS / Material Settings Navigation Bar (Top Sticky App Bar - Settings Default Header) */}
        <header className="sticky top-0 z-30 px-4 sm:px-6 py-3.5 bg-[#fbfbfd]/95 dark:bg-[#1c1c1e]/95 backdrop-blur-xl border-b border-[#c6c6c8]/60 dark:border-[#38383a]/60 flex items-center justify-between shrink-0 select-none pt-safe transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            {activeSubPage !== 'all' ? (
              <button
                type="button"
                onClick={() => setActiveSubPage('all')}
                className="flex items-center gap-1 text-[#007aff] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer font-medium text-[16px] py-1 -ml-1 touch-manipulation"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                <span>Settings</span>
              </button>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#176f78] via-[#007aff] to-[#5856d6] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Settings className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[18px] tracking-tight text-[#000000] dark:text-white leading-tight">
                      Settings
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#007aff]/15 text-[#007aff] dark:text-blue-400 font-mono">
                      DEFAULT
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8e8e93] font-medium leading-none">
                    IE Control Center &amp; Preferences
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center Title (shown when drilled into a sub-page on mobile) */}
          {activeSubPage !== 'all' && (
            <div className="absolute inset-x-24 text-center pointer-events-none">
              <span className="font-semibold text-[16px] text-[#000000] dark:text-white truncate block">
                {getSubPageTitle(activeSubPage)}
              </span>
            </div>
          )}

          {activeSubPage === 'all' && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#8e8e93]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{factoryProfile?.name || 'Debonair'} ({factoryProfile?.unitName || 'Unit-02'})</span>
              <span>•</span>
              <span className="font-mono text-[#007aff]">{linesCount} Lines</span>
            </div>
          )}

          {/* Right Action: Done Button (Apple iOS Style) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[#007aff] font-bold text-[17px] hover:opacity-80 active:opacity-60 transition-opacity cursor-pointer px-2 py-1 touch-manipulation"
            >
              Done
            </button>
          </div>
        </header>

        {/* Search Bar - Native iOS Spotlight / Android Settings Search Style */}
        <div className="px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#000000] border-b border-[#e5e5ea]/80 dark:border-[#2c2c2e]/80 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-[#8e8e93] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search settings..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#e3e3e8] dark:bg-[#1c1c1e] text-[#1c1c1e] dark:text-white text-[14px] rounded-xl pl-9 pr-8 py-2.5 placeholder-[#8e8e93] border-0 focus:ring-2 focus:ring-[#007aff] transition-all touch-manipulation shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 p-1 text-[#8e8e93] hover:text-[#1c1c1e] dark:hover:text-white cursor-pointer active:scale-90"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification Banner */}
        {backupToast && (
          <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between shadow-md animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{backupToast}</span>
            </div>
            <button
              onClick={() => setBackupToast(null)}
              className="text-white/80 hover:text-white cursor-pointer font-bold px-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Settings Body - Inset Grouped Table Layout (Settings Default Page) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 space-y-5 pb-safe scrollbar-thin">
          
          {/* SEARCH RESULTS VIEW */}
          {searchQuery.trim().length > 0 && (
            <div className="space-y-4">
              <div className="px-3 flex items-center justify-between text-[12px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                <span>Search Results</span>
                <span className="font-mono text-[#007aff]">
                  {filteredModules.length + filteredUtilities.length} Found
                </span>
              </div>

              {filteredModules.length === 0 && filteredUtilities.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[#e5e5ea] dark:border-[#2c2c2e]">
                  <p className="text-sm text-[#8e8e93]">No settings or modules match "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-xs text-[#007aff] font-semibold hover:underline"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Modules Matches */}
                  {filteredModules.length > 0 && (
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                      <div className="px-4 py-2 bg-[#f9f9fb] dark:bg-[#252528] text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">
                        Workspaces &amp; Modules
                      </div>
                      {filteredModules.map(m => {
                        const Icon = m.icon;
                        return (
                          <div
                            key={m.id}
                            onClick={() => handleModuleLaunch(m.id)}
                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] active:bg-[#e5e5ea] dark:active:bg-[#343438] transition-colors cursor-pointer touch-manipulation min-h-[52px]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <SquircleIcon bgColor={m.color} size="md">
                                <Icon className="w-4 h-4 text-white" />
                              </SquircleIcon>
                              <div className="min-w-0">
                                <div className="text-[15px] font-semibold text-[#1c1c1e] dark:text-white leading-tight truncate">
                                  {m.title}
                                </div>
                                <div className="text-[12px] text-[#8e8e93] truncate">{m.subtitle}</div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#c7c7cc] shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Utilities Matches */}
                  {filteredUtilities.length > 0 && (
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                      <div className="px-4 py-2 bg-[#f9f9fb] dark:bg-[#252528] text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">
                        Frontline Utilities
                      </div>
                      {filteredUtilities.map(u => {
                        const Icon = u.icon;
                        return (
                          <div
                            key={u.id}
                            onClick={u.onClick}
                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] active:bg-[#e5e5ea] dark:active:bg-[#343438] transition-colors cursor-pointer touch-manipulation min-h-[52px]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <SquircleIcon bgColor={u.color} size="md">
                                <Icon className="w-4 h-4 text-white" />
                              </SquircleIcon>
                              <div className="min-w-0">
                                <div className="text-[15px] font-semibold text-[#1c1c1e] dark:text-white leading-tight truncate">
                                  {u.title}
                                </div>
                                <div className="text-[12px] text-[#8e8e93] truncate">{u.subtitle}</div>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#c7c7cc] shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MAIN ROOT VIEW (when searchQuery is empty) */}
          {!searchQuery && activeSubPage === 'all' && (
            <div className="space-y-5">
              
              {/* 1. APPLE ID / USER ACCOUNT HERO CARD */}
              <div
                onClick={() => {
                  onClose();
                  if (onOpenUserModal) onOpenUserModal('profile');
                }}
                className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors touch-manipulation"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative">
                    <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#176f78] via-[#007aff] to-[#5856d6] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      {profile?.name
                        ? profile.name
                            .split(' ')
                            .map(n => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'IE'}
                    </div>
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#1c1c1e]" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[17px] font-bold text-[#000000] dark:text-white leading-tight truncate">
                        {profile?.name || 'Debonair IE Admin'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#176f78]/15 text-[#176f78] dark:text-teal-300 font-mono shrink-0">
                        {profile?.tierId ? profile.tierId.replace('_', ' ').toUpperCase() : (profile?.role ? profile.role.toUpperCase() : 'IE STAFF')}
                      </span>
                    </div>
                    <p className="text-[13px] text-[#8e8e93] truncate mt-0.5">
                      {profile?.jobTitle || 'Industrial Engineering Incharge'} • {profile?.email || 'realmec85pro231@gmail.com'}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-[#176f78] dark:text-teal-400 mt-1 font-medium">
                      <span>{factoryProfile?.name || 'Debonair LTD'} ({factoryProfile?.unitName || 'Unit-02'})</span>
                      <span>•</span>
                      <span>{linesCount} Active Lines</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[#c7c7cc] shrink-0">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>

              {/* TIER_0 ONLY EXCLUSIVE ENTRY - STRICTLY VISIBLE ONLY WHEN isSystemAdmin(profile) === true */}
              {isSysAdmin && (
                <div className="space-y-2">
                  <div className="px-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-[12px] font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider font-mono">
                        Tier_0 Only (entry from Settings)
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                      ROOT CLEARANCE
                    </span>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-linear-to-r from-slate-950 via-[#0e272c] to-[#09353b] text-white p-4 sm:p-5 border border-teal-500/30 shadow-lg">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
                          <h3 className="text-base font-bold text-white font-display">
                            Tier_0 Master Console
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 font-medium">
                          Schema Forge • Access Matrix • Security Loop • Plant Security • Privacy Vault • Backup Forge • Audit Forensics • Maintenance Hub
                        </p>
                        <p className="text-[11px] text-teal-300/80 font-mono mt-0.5">
                          (Visible only when isSystemAdmin(profile) === true)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTier0Module('schema-forge');
                          setActiveSubPage('tier_0');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 cursor-pointer shadow-md transition-all active:scale-95 shrink-0 self-start sm:self-auto"
                      >
                        <span>Open Tier_0 Suite</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 8 Quick Tools Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5">
                      {TIER_0_MODULES.map(mod => {
                        const Icon = mod.icon;
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => {
                              setSelectedTier0Module(mod.id);
                              setActiveSubPage('tier_0');
                            }}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 transition-all text-left cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[12px] font-bold text-white truncate">
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
                </div>
              )}

              {/* 2. CONTROL CENTER QUICK TILES GRID (iOS Control Center / Android Quick Settings) */}
              <div>
                <div className="px-3 mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    Control Center Quick Actions
                  </span>
                  <span className="text-[11px] text-[#007aff] font-medium">Tactile Quick Controls</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                  {/* Tile 1: Acoustic Sound Alert Toggle */}
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      auditoryAlertsEnabled
                        ? 'bg-[#34c759]/15 border-[#34c759]/30 text-[#34c759] dark:bg-[#34c759]/20'
                        : 'bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-[#8e8e93]'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      auditoryAlertsEnabled ? 'bg-[#34c759] text-white' : 'bg-[#e3e3e8] dark:bg-[#2c2c2e] text-[#8e8e93]'
                    }`}>
                      {auditoryAlertsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight">
                      {auditoryAlertsEnabled ? 'Sound On' : 'Muted'}
                    </span>
                    <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">Floor Alerts</span>
                  </button>

                  {/* Tile 2: Night Shift Dark Theme Toggle */}
                  <button
                    type="button"
                    onClick={() => onSelectTheme(currentTheme === 'dark' ? 'light' : 'dark')}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer touch-manipulation active:scale-95 ${
                      currentTheme === 'dark'
                        ? 'bg-amber-400/15 border-amber-400/30 text-amber-500 dark:bg-amber-400/20'
                        : 'bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-[#1c1c1e] dark:text-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      currentTheme === 'dark' ? 'bg-amber-400 text-amber-950' : 'bg-[#e3e3e8] dark:bg-[#2c2c2e] text-[#1c1c1e]'
                    }`}>
                      {currentTheme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight">
                      {currentTheme === 'dark' ? 'Night Shift' : 'Warm Cream'}
                    </span>
                    <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">Visual Mode</span>
                  </button>

                  {/* Tile 3: Lock Terminal - ONLY for Master Administration/Admin Role */}
                  {isMasterAdmin && onLockTerminal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onLockTerminal) onLockTerminal();
                      }}
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl border bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer touch-manipulation active:scale-95"
                    >
                      <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mb-1">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-center leading-tight">Lock Screen</span>
                      <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">PIN Security</span>
                    </button>
                  )}

                  {/* Tile 4: Manual Snapshot Backup - ONLY for Master Administration/Admin Role */}
                  {isMasterAdmin && (
                    <button
                      type="button"
                      onClick={handleManualBackupClick}
                      disabled={isTriggeringBackup}
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl border bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-[#ff9500] hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all cursor-pointer touch-manipulation active:scale-95 disabled:opacity-60"
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center mb-1">
                        {isTriggeringBackup ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <HardDrive className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-center leading-tight">
                        {isTriggeringBackup ? 'Backing Up' : 'Snapshot'}
                      </span>
                      <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">IndexedDB</span>
                    </button>
                  )}

                  {/* Tile 5: Google Chat Workspace */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenChat) onOpenChat();
                    }}
                    className="flex flex-col items-center justify-center p-2.5 rounded-2xl border bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-[#1a73e8] hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all cursor-pointer touch-manipulation active:scale-95"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#1a73e8] flex items-center justify-center mb-1 relative">
                      <MessageSquare className="w-4 h-4" />
                      {unreadNotificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-center leading-tight">Google Chat</span>
                    <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">Spaces &bull; AI</span>
                  </button>

                  {/* Tile 6: System Updates & Install - ONLY for Master Administration/Admin Role */}
                  {isMasterAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveSubPage('updates')}
                      className="flex flex-col items-center justify-center p-2.5 rounded-2xl border bg-white dark:bg-[#1c1c1e] border-[#e5e5ea] dark:border-[#2c2c2e] text-[#007aff] hover:bg-blue-50/70 dark:hover:bg-blue-950/30 transition-all cursor-pointer touch-manipulation active:scale-95 group relative"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#007aff] flex items-center justify-center mb-1 relative">
                        <DownloadCloud className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#34c759] ring-2 ring-white dark:ring-[#1c1c1e]" />
                      </div>
                      <span className="text-[11px] font-bold text-center leading-tight truncate w-full px-0.5">
                        System Update
                      </span>
                      <span className="text-[9px] text-[#8e8e93] leading-none mt-0.5">Install &amp; APK</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 3. SECTION: PREFERENCES & DISPLAY */}
              <div>
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    Preferences &amp; Display
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                  {/* Theme Selector Row */}
                  <div
                    onClick={() => setActiveSubPage('themes')}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px]"
                  >
                    <div className="flex items-center gap-3">
                      <SquircleIcon bgColor="bg-[#af52de]">
                        <Palette className="w-4 h-4" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Theme &amp; Appearance
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          {currentThemeLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8e8e93] font-medium hidden sm:inline">
                        {currentThemeLabel}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                    </div>
                  </div>

                  {/* Sound Alerts Row */}
                  <div
                    onClick={() => setActiveSubPage('alerts')}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px]"
                  >
                    <div className="flex items-center gap-3">
                      <SquircleIcon bgColor="bg-[#ff2d55]">
                        <BellRing className="w-4 h-4" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Acoustic Alerts &amp; Chimes
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          {auditoryAlertsEnabled ? 'High WIP & bottleneck alarms enabled' : 'Muted'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#8e8e93] font-medium hidden sm:inline">
                        {auditoryAlertsEnabled ? 'Active' : 'Muted'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                    </div>
                  </div>

                  {/* Executive Dashboard Widgets Row */}
                  <div
                    onClick={() => setActiveSubPage('layout')}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px]"
                  >
                    <div className="flex items-center gap-3">
                      <SquircleIcon bgColor="bg-[#5856d6]">
                        <Layout className="w-4 h-4" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Dashboard Widgets &amp; Sections
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          Configure KPI strips, WIP curves, &amp; absenteeism
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                  </div>
                </div>
              </div>

              {/* 4. SECTION: PRODUCTION CONTROL WORKSPACES (Primary 5 + View All) */}
              <div>
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    IE Workspaces &amp; Workstations ({ieNavigationModules.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSubPage('modules')}
                    className="text-[12px] text-[#007aff] font-semibold hover:underline cursor-pointer"
                  >
                    See All
                  </button>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                  {ieNavigationModules.slice(0, 5).map(m => {
                    const Icon = m.icon;
                    const isCurrent = currentTab === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleModuleLaunch(m.id)}
                        className={`px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[52px] ${
                          isCurrent ? 'bg-[#007aff]/5 dark:bg-[#007aff]/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <SquircleIcon bgColor={m.color}>
                            <Icon className="w-4 h-4 text-white" />
                          </SquircleIcon>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[15px] font-semibold text-[#1c1c1e] dark:text-white leading-tight truncate">
                                {m.title}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#007aff] text-white">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[12px] text-[#8e8e93] truncate">{m.subtitle}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.badge && !isCurrent && (
                            <span className="text-[11px] font-semibold text-[#8e8e93] font-mono">
                              {m.badge}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                        </div>
                      </div>
                    );
                  })}

                  {/* View All Workspaces Row */}
                  <div
                    onClick={() => setActiveSubPage('modules')}
                    className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation text-[#007aff]"
                  >
                    <div className="flex items-center gap-3">
                      <SquircleIcon bgColor="bg-[#007aff]">
                        <LayoutGrid className="w-4 h-4 text-white" />
                      </SquircleIcon>
                      <span className="text-[15px] font-semibold">
                        View All 11 IE Workspaces &amp; Setup
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#007aff]" />
                  </div>
                </div>
              </div>

              {/* 5. SECTION: DATA & LOCAL SNAPSHOT BACKUP - ONLY for Master Administration/Admin Role */}
              {isMasterAdmin && (
                <div>
                  <div className="px-3 mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                      Data Persistence &amp; Storage
                    </span>
                    <span className="text-[11px] font-mono text-[#007aff] font-medium">IndexedDB</span>
                  </div>

                  <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                    {/* Master Backup Switch */}
                    <div className="px-4 py-3 flex items-center justify-between min-h-[50px]">
                      <div className="flex items-center gap-3">
                        <SquircleIcon bgColor="bg-[#ff9500]">
                          <HardDrive className="w-4 h-4" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                            Automated Daily Backup
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">
                            Local IndexedDB snapshot at {dailyBackupSettings.dailyBackupTime || '18:00'}
                          </div>
                        </div>
                      </div>

                      <CupertinoSwitch
                        checked={dailyBackupSettings.autoDailyBackupEnabled}
                        onChange={val => handleUpdateBackup({ autoDailyBackupEnabled: val })}
                        ariaLabel="Toggle Automated Daily Backup"
                      />
                    </div>

                    {/* Backup Details Page Link */}
                    <div
                      onClick={() => setActiveSubPage('backup')}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px]"
                    >
                      <div className="flex items-center gap-3">
                        <SquircleIcon bgColor="bg-[#34c759]">
                          <Clock className="w-4 h-4" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                            Backup Schedule &amp; Repository
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">
                            Configure retention, run snapshot, or restore
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                    </div>

                    {/* CSV Line Data Import Link */}
                    <div
                      onClick={() => {
                        onClose();
                        if (onOpenDatabase) onOpenDatabase('csv-import');
                        else if (onOpenDatabaseModal) onOpenDatabaseModal('csv-import');
                      }}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px]"
                    >
                      <div className="flex items-center gap-3">
                        <SquircleIcon bgColor="bg-[#107c41]">
                          <Upload className="w-4 h-4" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                            Import Line Data (CSV / Excel)
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">
                            Bulk load SMVs, styles &amp; workstation targets
                          </div>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SECTION: ABOUT & DEVICE SPECS */}
              <div>
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    About &amp; Mobile Architecture
                  </span>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <span className="text-[15px] text-[#1c1c1e] dark:text-white">Platform System</span>
                    <span className="text-[14px] text-[#8e8e93] font-medium">DGU-2 IE Daily Control</span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <span className="text-[15px] text-[#1c1c1e] dark:text-white">Build Version</span>
                    <span className="text-[14px] text-[#8e8e93] font-mono">v2.4.0 (PWA + TWA)</span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between min-h-[48px]">
                    <span className="text-[15px] text-[#1c1c1e] dark:text-white">Active Plant</span>
                    <span className="text-[14px] text-[#8e8e93] font-medium">
                      {factoryProfile?.name || 'Debonair'} ({factoryProfile?.unitName || 'Unit-02'})
                    </span>
                  </div>

                  {/* System Updates & Install - ONLY for Master Administration/Admin Role */}
                  {isMasterAdmin && (
                    <div
                      onClick={() => setActiveSubPage('updates')}
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[50px] text-[#007aff]"
                    >
                      <div className="flex items-center gap-3">
                        <SquircleIcon bgColor="bg-[#007aff]">
                          <DownloadCloud className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[16px] text-[#1c1c1e] dark:text-white font-medium leading-tight">
                            System Updates &amp; Install
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">
                            v2.4.0 • Android APK package &amp; PWA install
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#34c759]/15 text-[#34c759] border border-[#34c759]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] animate-pulse" />
                          Up to Date
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                      </div>
                    </div>
                  )}

                  {/* Reset Settings to Factory Defaults - ONLY for Master Administration/Admin Role */}
                  {isMasterAdmin && (
                    <div
                      onClick={() => {
                        if (onSelectTheme) onSelectTheme('light');
                        if (onToggleAuditoryAlerts) onToggleAuditoryAlerts(true);
                        if (onUpdateLayout) onUpdateLayout(DEFAULT_DASHBOARD_LAYOUT);
                        setBackupToast('Settings restored to factory defaults (Theme, Layout, Alerts)');
                        setTimeout(() => setBackupToast(null), 3500);
                      }}
                      className="px-4 py-3 flex items-center justify-between hover:bg-rose-500/5 active:bg-rose-500/10 transition-colors cursor-pointer touch-manipulation min-h-[50px] text-rose-600 dark:text-rose-400"
                    >
                      <div className="flex items-center gap-3">
                        <SquircleIcon bgColor="bg-rose-500">
                          <RotateCcw className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[16px] font-medium leading-tight text-rose-600 dark:text-rose-400">
                            Reset Settings to Defaults
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">
                            Restores default theme, widget layout &amp; alert tones
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SUB-PAGE 1: ALL IE NAVIGATION MODULES */}
          {activeSubPage === 'modules' && (
            <div className="space-y-4">
              <div className="px-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    All 11 IE Workspaces &amp; Floor Workbenches
                  </h4>
                  <p className="text-[12px] text-[#8e8e93] mt-0.5">
                    Tap any workstation module to switch your production floor view.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {filteredModules.map(module => {
                  const Icon = module.icon;
                  const isCurrent = currentTab === module.id;
                  return (
                    <div
                      key={module.id}
                      onClick={() => handleModuleLaunch(module.id)}
                      className={`px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] touch-manipulation min-h-[58px] ${
                        isCurrent ? 'bg-[#007aff]/5 dark:bg-[#007aff]/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor={module.color} size="md">
                          <Icon className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[15px] font-semibold text-[#1c1c1e] dark:text-white leading-tight">
                              {module.title}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#007aff] text-white">
                                Active Now
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5 line-clamp-1">
                            {module.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {module.badge && !isCurrent && (
                          <span className={`text-[11px] font-mono hidden sm:inline ${module.badgeColor}`}>
                            {module.badge}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PAGE 2: ALL QUICK UTILITIES */}
          {activeSubPage === 'utilities' && (
            <div className="space-y-4">
              <div className="px-3 flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    Frontline Quick Utilities &amp; Tools ({quickUtilities.length})
                  </h4>
                  <p className="text-[12px] text-[#8e8e93] mt-0.5">
                    Fast operational triggers for shop floor engineers and line incharge.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {filteredUtilities.map(util => {
                  const Icon = util.icon;
                  return (
                    <div
                      key={util.id}
                      onClick={util.onClick}
                      className="px-4 py-3.5 flex items-center justify-between gap-3 transition-colors cursor-pointer hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] touch-manipulation min-h-[58px]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <SquircleIcon bgColor={util.color} size="md">
                          <Icon className="w-4 h-4 text-white" />
                        </SquircleIcon>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-[#1c1c1e] dark:text-white leading-tight truncate">
                              {util.title}
                            </span>
                            {util.badge && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#007aff]/15 text-[#007aff] font-mono shrink-0">
                                {util.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[12px] text-[#8e8e93] truncate mt-0.5">
                            {util.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-[#007aff]">
                          {util.actionLabel}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PAGE 3: THEMES & APPEARANCE */}
          {activeSubPage === 'themes' && (
            <div className="space-y-4">
              <div className="px-3">
                <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                  Factory Visual Themes
                </h4>
                <p className="text-[12px] text-[#8e8e93] mt-0.5">
                  Select high-contrast palettes designed for various shop floor and lighting environments.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {themes.map(t => {
                  const isSelected = currentTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => onSelectTheme(t.id)}
                      className="px-4 py-3.5 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[56px]"
                    >
                      <div className="flex items-center gap-3.5">
                        <span className={`w-6 h-6 rounded-full border shadow-xs shrink-0 ${t.previewClass}`} />
                        <div>
                          <div className="text-[16px] text-[#1c1c1e] dark:text-white font-medium leading-tight">
                            {t.label}
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5">{t.desc}</div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#007aff] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PAGE 4: ACOUSTIC ALERTS & SOUNDS */}
          {activeSubPage === 'alerts' && (
            <div className="space-y-4">
              <div className="px-3">
                <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                  Acoustic Floor Warnings &amp; Chimes
                </h4>
                <p className="text-[12px] text-[#8e8e93] mt-0.5">
                  Instant audible alerts when high WIP buffers (&gt;3,500 pcs) or bottleneck cycle times spike.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {/* Master Sound Switch */}
                <div className="px-4 py-3.5 flex items-center justify-between min-h-[56px]">
                  <div className="flex items-center gap-3.5">
                    <SquircleIcon bgColor="bg-[#ff2d55]">
                      <BellRing className="w-4 h-4" />
                    </SquircleIcon>
                    <div>
                      <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                        Master Acoustic Warnings
                      </div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">
                        {auditoryAlertsEnabled ? 'Acoustic warnings active' : 'Audio muted'}
                      </div>
                    </div>
                  </div>

                  <CupertinoSwitch
                    checked={auditoryAlertsEnabled}
                    onChange={handleToggleAudio}
                    ariaLabel="Toggle Master Sound Alerts"
                  />
                </div>

                {/* Sound 1: WIP Buffer Chime */}
                <div className="px-4 py-3 flex items-center justify-between min-h-[50px]">
                  <div className="text-[15px] text-[#1c1c1e] dark:text-white pl-11">
                    High WIP Buffer Warning Chime
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestSound('wip')}
                    disabled={playingTestSound === 'wip'}
                    className="px-3 py-1.5 rounded-xl bg-[#007aff]/10 text-[#007aff] hover:bg-[#007aff]/20 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{playingTestSound === 'wip' ? 'Playing...' : 'Test Sound'}</span>
                  </button>
                </div>

                {/* Sound 2: Bottleneck Tone */}
                <div className="px-4 py-3 flex items-center justify-between min-h-[50px]">
                  <div className="text-[15px] text-[#1c1c1e] dark:text-white pl-11">
                    Bottleneck Station Tone
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestSound('bottleneck')}
                    disabled={playingTestSound === 'bottleneck'}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer touch-manipulation"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{playingTestSound === 'bottleneck' ? 'Playing...' : 'Test Sound'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PAGE 5: DASHBOARD WIDGETS */}
          {activeSubPage === 'layout' && (
            <div className="space-y-4">
              <div className="px-3">
                <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                  Executive Dashboard Widgets &amp; Sections
                </h4>
                <p className="text-[12px] text-[#8e8e93] mt-0.5">
                  Toggle which modules and KPI strips appear on your primary plant dashboard.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {layoutToggles.map(item => {
                  const isChecked = !!layout[item.key];
                  return (
                    <div
                      key={item.key}
                      className="px-4 py-3 flex items-center justify-between min-h-[52px]"
                    >
                      <div className="flex items-center gap-3.5 pr-2">
                        <SquircleIcon bgColor="bg-[#5856d6]">
                          <Layout className="w-4 h-4" />
                        </SquircleIcon>
                        <div>
                          <div className="text-[15px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[12px] text-[#8e8e93] mt-0.5 leading-snug">
                            {item.desc}
                          </div>
                        </div>
                      </div>

                      <CupertinoSwitch
                        checked={isChecked}
                        onChange={() => handleToggleLayout(item.key)}
                        ariaLabel={`Toggle ${item.label}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PAGE 6: AUTOMATED BACKUP ENGINE - Master Admin Only */}
          {activeSubPage === 'backup' && isMasterAdmin && (
            <div className="space-y-4">
              <div className="px-3">
                <h4 className="text-[13px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                  Automated Local Backup (IndexedDB)
                </h4>
                <p className="text-[12px] text-[#8e8e93] mt-0.5">
                  Full plant state snapshots saved locally in the browser sandbox. Resilient to network outages.
                </p>
              </div>

              <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                {/* Master Daily Backup Toggle */}
                <div className="px-4 py-3.5 flex items-center justify-between min-h-[54px]">
                  <div className="flex items-center gap-3.5">
                    <SquircleIcon bgColor="bg-[#ff9500]">
                      <Clock className="w-4 h-4" />
                    </SquircleIcon>
                    <div>
                      <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                        Daily Auto-Backup
                      </div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">
                        IndexedDB snapshot of 34 lines &amp; checklists
                      </div>
                    </div>
                  </div>

                  <CupertinoSwitch
                    checked={dailyBackupSettings.autoDailyBackupEnabled}
                    onChange={val => handleUpdateBackup({ autoDailyBackupEnabled: val })}
                    ariaLabel="Toggle Daily Auto-Backup"
                  />
                </div>

                {/* Scheduled Backup Time */}
                {dailyBackupSettings.autoDailyBackupEnabled && (
                  <div className="px-4 py-3 flex items-center justify-between min-h-[52px]">
                    <div className="flex items-center gap-3.5">
                      <SquircleIcon bgColor="bg-[#007aff]">
                        <Calendar className="w-4 h-4" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[15px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Scheduled Backup Time
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          Triggers once daily at shift end (24-Hour)
                        </div>
                      </div>
                    </div>

                    <input
                      type="time"
                      value={dailyBackupSettings.dailyBackupTime || '18:00'}
                      onChange={e => handleUpdateBackup({ dailyBackupTime: e.target.value })}
                      className="bg-[#e3e3e8] dark:bg-[#2c2c2e] text-[#1c1c1e] dark:text-white font-mono font-semibold text-[14px] px-3 py-1.5 rounded-xl border-0 focus:ring-2 focus:ring-[#007aff] cursor-pointer"
                    />
                  </div>
                )}

                {/* Catch-up on Launch */}
                {dailyBackupSettings.autoDailyBackupEnabled && (
                  <div className="px-4 py-3 flex items-center justify-between min-h-[52px]">
                    <div className="flex items-center gap-3.5">
                      <SquircleIcon bgColor="bg-[#30b0c7]">
                        <RefreshCw className="w-4 h-4" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[15px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Catch-Up on App Launch
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          Run if opened after the scheduled daily hour
                        </div>
                      </div>
                    </div>

                    <CupertinoSwitch
                      checked={dailyBackupSettings.backupOnAppLaunch}
                      onChange={val => handleUpdateBackup({ backupOnAppLaunch: val })}
                      ariaLabel="Toggle Catch-Up on Launch"
                    />
                  </div>
                )}

                {/* Retention Picker */}
                <div className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3.5">
                    <SquircleIcon bgColor="bg-[#af52de]">
                      <Layers className="w-4 h-4" />
                    </SquircleIcon>
                    <div>
                      <div className="text-[15px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                        Retention Policy
                      </div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">
                        Prune historical snapshots older than
                      </div>
                    </div>
                  </div>

                  <div className="inline-flex p-1 rounded-xl bg-[#e3e3e8] dark:bg-[#2c2c2e] text-[12px] font-semibold self-start sm:self-auto">
                    {[
                      { label: '14D', val: 14 },
                      { label: '30D', val: 30 },
                      { label: '90D', val: 90 },
                      { label: 'All', val: 0 }
                    ].map(item => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleUpdateBackup({ backupRetentionDays: item.val })}
                        className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          dailyBackupSettings.backupRetentionDays === item.val
                            ? 'bg-white dark:bg-[#1c1c1e] text-[#000000] dark:text-white shadow-xs font-bold'
                            : 'text-[#8e8e93]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Row - Trigger Backup Now */}
                <div
                  onClick={handleManualBackupClick}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[56px]"
                >
                  <div className="flex items-center gap-3.5">
                    <SquircleIcon bgColor="bg-[#34c759]">
                      <HardDrive className="w-4 h-4" />
                    </SquircleIcon>
                    <div>
                      <div className="text-[16px] text-[#007aff] font-semibold leading-tight">
                        {isTriggeringBackup ? 'Backing Up to IndexedDB...' : 'Trigger Local Snapshot Now'}
                      </div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">
                        {dailyBackupSettings.lastBackupDate
                          ? `Last backed up: ${dailyBackupSettings.lastBackupDate}`
                          : 'No backup recorded yet today'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-[#007aff] font-semibold">
                    {isTriggeringBackup ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[#007aff]" />
                    ) : (
                      <span className="px-3 py-1 rounded-xl bg-[#007aff]/10 text-[#007aff] font-bold">
                        Run
                      </span>
                    )}
                  </div>
                </div>

                {/* Browse Repository */}
                <div
                  onClick={() => {
                    onClose();
                    if (onOpenDatabase) onOpenDatabase('backup');
                    else if (onOpenDatabaseModal) onOpenDatabaseModal('backup');
                  }}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation min-h-[56px]"
                >
                  <div className="flex items-center gap-3.5">
                    <SquircleIcon bgColor="bg-[#8e8e93]">
                      <Database className="w-4 h-4" />
                    </SquircleIcon>
                    <div>
                      <div className="text-[16px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                        Browse IndexedDB Snapshots &amp; Restore
                      </div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">
                        1-click restore, download JSON, or inspect lines
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[#c7c7cc]" />
                </div>
              </div>
            </div>
          )}

          {/* SUB-PAGE 7: SYSTEM UPDATES & INSTALL (Mobile Phone OS Style) - Master Admin Only */}
          {activeSubPage === 'updates' && isMasterAdmin && (
            <div className="space-y-4">
              {/* System OS Hero Status Banner */}
              <div className="p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#1c1c1e] border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#007aff] to-[#30b0c7] flex items-center justify-center text-white shadow-md">
                    <DownloadCloud className="w-8 h-8" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#34c759] border-2 border-white dark:border-[#1c1c1e] flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  </span>
                </div>

                <h3 className="text-[19px] font-bold text-[#1c1c1e] dark:text-white leading-tight">
                  DGU-2 IE Control OS 2.4
                </h3>
                <p className="text-[13px] text-[#8e8e93] mt-1">
                  Your system and frontline software are up to date.
                </p>

                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#6e6e73] dark:text-[#a1a1a6] text-[11px] font-mono">
                  <span>Version 2.4.0 (Build 2026.09.25-LTS)</span>
                </div>

                {/* Check for updates button */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCheckForUpdates}
                    disabled={isCheckingUpdate}
                    className="px-4 py-2 rounded-full bg-[#007aff] hover:bg-[#0066d6] active:scale-95 text-white text-[13px] font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60 touch-manipulation"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                    <span>{isCheckingUpdate ? 'Checking for Updates...' : 'Check for Updates'}</span>
                  </button>
                  <span className="text-[11px] text-[#8e8e93]">
                    Last checked: Today at 04:45 AM
                  </span>
                </div>

                {updateStatusMsg && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[12px] font-medium flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{updateStatusMsg}</span>
                  </div>
                )}
              </div>

              {/* Install & Distribution Channels */}
              <div>
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    Installation &amp; Device Setup
                  </span>
                  <span className="text-[11px] text-[#007aff] font-medium">Frontline Ready</span>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] shadow-2xs overflow-hidden divide-y divide-[#e5e5ea] dark:divide-[#2c2c2e]">
                  {/* Option 1: Android APK Package */}
                  <div
                    onClick={() => {
                      onClose();
                      if (onOpenAndroidPackage) onOpenAndroidPackage();
                    }}
                    className="p-4 flex items-start justify-between gap-3 hover:bg-[#fbfbfd] dark:hover:bg-[#252528] active:bg-[#e5e5ea] dark:active:bg-[#2c2c2e] transition-colors cursor-pointer touch-manipulation"
                  >
                    <div className="flex items-start gap-3">
                      <SquircleIcon bgColor="bg-[#107c41]">
                        <AndroidLogoIcon className="w-5 h-5 text-white" />
                      </SquircleIcon>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] text-[#1c1c1e] dark:text-white font-semibold leading-tight">
                            Android APK Package
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#107c41]/15 text-[#107c41] border border-[#107c41]/30">
                            v2.4.0 APK
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8e8e93] mt-1 leading-relaxed">
                          Standalone application package for Android phones, tablets, and rugged floor scanners. Includes barcode hardware bridge and kiosk lock mode.
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[11px] font-mono text-[#527078] dark:text-[#80a0a8]">
                          <span>ID: com.debonair.iedailycontrol</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[#007aff] shrink-0 mt-1">
                      <span className="text-[13px] font-semibold hidden sm:inline">Package &amp; Download</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Option 2: Progressive Web App (PWA) Direct Install */}
                  <div className="p-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <SquircleIcon bgColor="bg-[#007aff]">
                        <Smartphone className="w-5 h-5 text-white" />
                      </SquircleIcon>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[16px] text-[#1c1c1e] dark:text-white font-semibold leading-tight">
                            Progressive Web App (PWA)
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#007aff]/15 text-[#007aff] border border-[#007aff]/30">
                            Instant
                          </span>
                        </div>
                        <p className="text-[12px] text-[#8e8e93] mt-1 leading-relaxed">
                          Add DGU-2 directly to your phone or desktop home screen. Launches fullscreen with zero installation overhead and full offline data storage.
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onOpenAndroidPackage) onOpenAndroidPackage();
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#007aff]/10 hover:bg-[#007aff]/20 active:scale-95 text-[#007aff] text-[12px] font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <DownloadCloud className="w-3.5 h-3.5" />
                            <span>Install App Guide</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Option 3: Auto-Update Service Worker Settings */}
                  <div className="px-4 py-3 flex items-center justify-between min-h-[50px]">
                    <div className="flex items-center gap-3">
                      <SquircleIcon bgColor="bg-[#5856d6]">
                        <RefreshCw className="w-4 h-4 text-white" />
                      </SquircleIcon>
                      <div>
                        <div className="text-[15px] text-[#1c1c1e] dark:text-white font-normal leading-tight">
                          Automatic Shift Updates
                        </div>
                        <div className="text-[12px] text-[#8e8e93] mt-0.5">
                          Silent background updates via PWA service worker
                        </div>
                      </div>
                    </div>

                    <CupertinoSwitch
                      checked={autoUpdateEnabled}
                      onChange={setAutoUpdateEnabled}
                      ariaLabel="Toggle Automatic Shift Updates"
                    />
                  </div>
                </div>
              </div>

              {/* Release Notes Card */}
              <div>
                <div className="px-3 mb-1.5 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#6e6e73] dark:text-[#8e8e93] uppercase tracking-wider">
                    What's New in Version 2.4.0
                  </span>
                  <span className="text-[11px] font-mono text-[#8e8e93]">LTS Release</span>
                </div>

                <div className="bg-white dark:bg-[#1c1c1e] rounded-2xl sm:rounded-3xl border border-[#e5e5ea] dark:border-[#2c2c2e] p-4 shadow-2xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#007aff] mt-2 shrink-0" />
                    <div>
                      <strong className="text-[13px] text-[#1c1c1e] dark:text-white block font-semibold">
                        Mobile Phone Settings &amp; IE Control Center
                      </strong>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">
                        Brand-new mobile phone UI inspired by iOS Settings and Android Quick Settings with full-bleed touch layout and instant tactile actions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34c759] mt-2 shrink-0" />
                    <div>
                      <strong className="text-[13px] text-[#1c1c1e] dark:text-white block font-semibold">
                        Resilient Firestore Long-Polling Sync
                      </strong>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">
                        Configured long-polling transport preventing 10s connection hangs in proxy and iframe environments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff9500] mt-2 shrink-0" />
                    <div>
                      <strong className="text-[13px] text-[#1c1c1e] dark:text-white block font-semibold">
                        Automated Daily IndexedDB Backups
                      </strong>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">
                        Scheduled automated daily snapshots at end-of-shift hours with zero server dependencies.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#af52de] mt-2 shrink-0" />
                    <div>
                      <strong className="text-[13px] text-[#1c1c1e] dark:text-white block font-semibold">
                        Acoustic Warnings &amp; Alarms
                      </strong>
                      <p className="text-[12px] text-[#8e8e93] mt-0.5">
                        Frontline auditory chimes for high WIP accumulations and cycle time pitch bottlenecks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-PAGE: TIER_0 ONLY SUITE - Strictly Visible only when isSystemAdmin(profile) === true */}
          {activeSubPage === 'tier_0' && isSysAdmin && (
            <div className="space-y-4">
              <Tier0CommandHub
                profile={profile || SYSTEM_ADMIN_PROFILE}
                lines={lines}
                roleTiers={roleTiers}
                factoryProfile={factoryProfile}
                dailyBackupSettings={dailyBackupSettings}
                onUpdateDailyBackupSettings={onUpdateDailyBackupSettings}
                onTriggerManualBackup={onTriggerManualBackup}
                onLockTerminal={onLockTerminal}
                onNavigate={onNavigate}
                initialModule={selectedTier0Module}
                onClose={() => setActiveSubPage('all')}
              />
            </div>
          )}

        </div>

        {/* Bottom Bar: Quick Plant Info Footer */}
        <footer className="px-4 sm:px-6 py-3 border-t border-[#c6c6c8]/60 dark:border-[#38383a]/60 bg-[#fbfbfd]/90 dark:bg-[#1c1c1e]/90 flex items-center justify-between gap-3 shrink-0 select-none pb-safe">
          <div className="text-[12px] text-[#8e8e93] flex items-center gap-1.5 truncate">
            <span>Plant:</span>
            <strong className="text-[#1c1c1e] dark:text-white truncate">
              {factoryProfile?.name || 'Debonair LTD'} ({factoryProfile?.unitName || 'Unit-02'})
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#007aff] hover:bg-[#0066d6] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95 touch-manipulation"
          >
            Done
          </button>
        </footer>

      </div>
    </div>
  );
};
