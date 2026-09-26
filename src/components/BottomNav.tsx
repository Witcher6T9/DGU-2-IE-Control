/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Activity,
  Layers,
  CheckSquare,
  Wrench,
  Settings,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';
import { isMasterAdminOrAdmin } from '../utils/rbac';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  checklistProgress: number;
  pendingTodosCount?: number;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  onOpenSettings?: () => void;
  onOpenUserModal?: (tab?: 'profile' | 'roles') => void;
  onOpenChat?: () => void;
  onOpenAndroidPackage?: () => void;
  onOpenAuth?: () => void;
  profile?: UserProfile;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onTabChange,
  checklistProgress,
  onOpenSettings,
  profile
}) => {
  const isMasterAdmin = isMasterAdminOrAdmin(profile);

  // 5 Canonical Primary Pages as specified:
  // Home • Line Data • Check List • Lean Tools - Settings(Control Center & Preferences)
  const primaryTabs = [
    {
      id: 'dashboard',
      label: 'Home',
      fullLabel: 'Executive & Floor Cockpit',
      icon: Activity,
      badge: undefined
    },
    {
      id: 'linedata',
      label: 'Line Data',
      fullLabel: 'Workstation & Line Balancing',
      icon: Layers,
      badge: undefined
    },
    {
      id: 'checklist',
      label: 'Check List',
      fullLabel: 'Daily Activity Tracking & Audits',
      icon: CheckSquare,
      badge: `${checklistProgress}%`
    },
    {
      id: 'lean-tools',
      label: 'Lean Tools',
      fullLabel: 'Lean 13 Methods & IE Simulator',
      icon: Wrench,
      badge: '13 WCM'
    },
    {
      id: 'settings',
      label: 'Settings',
      fullLabel: 'Control Center & Preferences',
      icon: Settings,
      badge: undefined
    }
  ];

  const isTabActive = (tabId: string) => {
    if (tabId === 'dashboard') {
      return currentTab === 'dashboard' || currentTab === 'home';
    }
    if (tabId === 'linedata') {
      return (
        currentTab === 'linedata' ||
        currentTab === 'lines' ||
        currentTab === 'floor-plan' ||
        currentTab === 'floorplan' ||
        currentTab === 'line-management' ||
        currentTab === 'line-configuration' ||
        currentTab === 'line-history' ||
        currentTab === 'history' ||
        currentTab === 'production-history'
      );
    }
    if (tabId === 'checklist') {
      return (
        currentTab === 'checklist' ||
        currentTab === 'daily-checklist' ||
        currentTab === 'todo-schedule' ||
        currentTab === 'actions' ||
        currentTab === 'audits' ||
        currentTab === 'monthly'
      );
    }
    if (tabId === 'lean-tools') {
      return (
        currentTab === 'lean-tools' ||
        currentTab === 'lean-toolkit' ||
        currentTab === 'simulator' ||
        currentTab === 'ie-simulator' ||
        currentTab === 'workspace'
      );
    }
    if (tabId === 'settings') {
      return (
        currentTab === 'settings' ||
        currentTab === 'control-center' ||
        currentTab === 'preferences' ||
        currentTab === 'roles' ||
        currentTab === 'operational-tiers' ||
        currentTab === 'tiers'
      );
    }
    return currentTab === tabId;
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <nav
      id="bottom-navigation-bar"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 inset-x-0 z-40 bg-[#fbfaf6]/95 backdrop-blur-md border-t border-[#d9d2c2] shadow-[0_-4px_20px_rgba(12,28,45,0.10)] pb-[env(safe-area-inset-bottom)] cockpit-nav"
    >
      <div className="max-w-[1500px] mx-auto px-2 sm:px-6">
        {/* Mobile View: 5 Canonical Slots */}
        {/* Home • Line Data • Check List • Lean Tools - Settings(Control Center & Preferences) */}
        <div className="grid grid-cols-5 md:hidden items-center h-16 select-none px-1 gap-0.5">
          {primaryTabs.map(tab => {
            const Icon = tab.icon;
            const active = isTabActive(tab.id);
            return (
              <button
                key={tab.id}
                id={`bottom-nav-mobile-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center justify-center py-1 min-h-[52px] rounded-xl transition-all cursor-pointer touch-manipulation active:scale-95 w-full"
              >
                <div
                  className={`relative px-3 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                    active
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-[#176f78]'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? 'scale-105 stroke-[2.2]' : 'stroke-[1.8]'
                    }`}
                  />
                  {tab.badge && (
                    <span
                      className={`absolute -top-1 -right-2 px-1.5 py-0.5 rounded-full text-[8.5px] font-mono font-bold leading-none shadow-xs ${
                        active
                          ? 'bg-amber-400 text-slate-900 ring-1 ring-white'
                          : 'bg-[#176f78] text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight mt-1 leading-none text-center truncate w-full px-0.5 ${
                    active
                      ? 'font-bold text-[#176f78]'
                      : 'font-medium text-slate-600'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tablet & Desktop View: Cockpit Bottom Navigation Dock */}
        <div className="hidden md:flex items-center justify-between h-14">
          {/* Left status indicator */}
          <div className="flex items-center gap-2 text-xs text-[#527078]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#17343a]">Debonair Unit-02:</span>
            <span>34 Lines Active</span>
          </div>

          {/* Center 5 Primary Navigation Tabs */}
          <div
            id="bottom-nav-desktop-tabs"
            className="flex items-center gap-1.5 bg-[#f1eee6] p-1 rounded-2xl border border-[#d9d2c2]"
          >
            {primaryTabs.map(tab => {
              const Icon = tab.icon;
              const active = isTabActive(tab.id);
              return (
                <button
                  key={tab.id}
                  id={`bottom-nav-desktop-${tab.id}`}
                  onClick={() => handleTabClick(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  title={`${tab.label} • ${tab.fullLabel}`}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all relative cursor-pointer touch-manipulation active:scale-95 ${
                    active
                      ? 'bg-[#176f78] text-white shadow-xs'
                      : 'text-slate-600 hover:text-[#176f78] hover:bg-[#e7e1d5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-[#dceceb] text-[#176f78]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Control Center Tag & Fast Action */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTabClick('settings')}
              title="Open Settings & Control Center"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-[#d9d2c2] text-[11px] font-bold text-[#176f78] hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Settings className="w-3 h-3" />
              <span>Control Center</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
