/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Clock,
  ShieldCheck,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  ChecklistMap,
  ChecklistStatus,
  UserProfile,
  RoleTier,
  TodoItem,
  ScheduleItem,
  LineEntry
} from '../types';
import {
  ActionItem,
  FiveWhyInvestigation,
  AuditCheckItem,
  CenterlineAuditItem
} from '../types/dcs';
import { DailyChecklist } from './DailyChecklist';
import { TodoSchedule } from './TodoSchedule';
import { ActionTrackerTab } from './ActionTrackerTab';
import { AuditsTab } from './AuditsTab';
import { MonthlySummary } from './MonthlySummary';

export type ChecklistSubTab =
  | 'daily-checklist'
  | 'todo-schedule'
  | 'actions'
  | 'audits'
  | 'monthly-summary';

interface ChecklistPageProps {
  checklists: ChecklistMap;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onUpdateTaskStatus: (date: string, taskIndex: number, status: ChecklistStatus) => void;
  onBatchUpdateChecklist?: (date: string, statuses: ChecklistStatus[]) => void;
  profile: UserProfile;
  roleTiers?: RoleTier[];
  onNavigate?: (tab: string, lineNo?: string) => void;
  todos: TodoItem[];
  schedules: ScheduleItem[];
  onUpdateTodos: React.Dispatch<React.SetStateAction<TodoItem[]>>;
  onUpdateSchedules: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  actions?: ActionItem[];
  fiveWhys?: FiveWhyInvestigation[];
  onOpenNewAction?: () => void;
  onUpdateActionStatus?: (id: string, newStatus: 'Open' | 'In Progress' | 'Verified Closed') => void;
  onAddNewFiveWhy?: (newWhy: FiveWhyInvestigation) => void;
  auditItems?: AuditCheckItem[];
  centerlines?: CenterlineAuditItem[];
  onToggleAuditItem?: (id: string, newStatus: 'pass' | 'warning' | 'fail') => void;
  onUpdateCenterlineValue?: (id: string, newValue: number) => void;
  lines?: LineEntry[];
  onAddTodoFromAudit?: (item: Partial<TodoItem>) => void;
  initialSubTab?: ChecklistSubTab;
}

export const ChecklistPage: React.FC<ChecklistPageProps> = ({
  checklists,
  selectedDate,
  onSelectDate,
  onUpdateTaskStatus,
  onBatchUpdateChecklist,
  profile,
  roleTiers,
  onNavigate,
  todos,
  schedules,
  onUpdateTodos,
  onUpdateSchedules,
  actions = [],
  fiveWhys = [],
  onOpenNewAction = () => {},
  onUpdateActionStatus = () => {},
  onAddNewFiveWhy = () => {},
  auditItems = [],
  centerlines = [],
  onToggleAuditItem = () => {},
  onUpdateCenterlineValue = () => {},
  lines = [],
  onAddTodoFromAudit = () => {},
  initialSubTab = 'daily-checklist'
}) => {
  const [subTab, setSubTab] = useState<ChecklistSubTab>(initialSubTab);

  // Compute checklist progress for header
  const todayTasks = checklists[selectedDate] || {};
  const totalTasks = 13;
  const completedCount = Object.values(todayTasks).filter(v => v === 'yes').length;
  const progressPct = Math.round((completedCount / totalTasks) * 100);

  const subTabs = [
    {
      id: 'daily-checklist' as ChecklistSubTab,
      label: '13-Point IE Checklist',
      shortLabel: 'Daily Checklist',
      icon: CheckSquare,
      badge: `${progressPct}%`
    },
    {
      id: 'todo-schedule' as ChecklistSubTab,
      label: 'Floor Tasks & Shift Timeline',
      shortLabel: 'Tasks & Timeline',
      icon: Clock,
      badge: todos.filter(t => t.status === 'pending').length > 0 ? `${todos.filter(t => t.status === 'pending').length}` : undefined
    },
    {
      id: 'actions' as ChecklistSubTab,
      label: 'Action Tracker & 5-Whys',
      shortLabel: 'Actions & 5-Whys',
      icon: HelpCircle,
      badge: actions.filter(a => a.status === 'Open').length > 0 ? `${actions.filter(a => a.status === 'Open').length}` : undefined
    },
    {
      id: 'audits' as ChecklistSubTab,
      label: 'Centerlines & 5S Audits',
      shortLabel: '5S & Centerlines',
      icon: ShieldCheck
    },
    {
      id: 'monthly-summary' as ChecklistSubTab,
      label: 'Monthly Audit Analytics',
      shortLabel: 'Monthly Analytics',
      icon: Calendar
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Segmented Sub-Navigation for Checklist Hub */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-2 sm:p-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display">
                Check List & Floor Compliance Hub
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                Score: {progressPct}% Complete
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5 hidden sm:block">
              Daily IE verification routine, supervisory sign-offs, action tracker, and 5S centerlines.
            </p>
          </div>

          {/* Sub-tab pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {subTabs.map(item => {
              const Icon = item.icon;
              const isActive = subTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSubTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 ${
                    isActive
                      ? 'bg-[#176f78] text-white shadow-2xs'
                      : 'bg-white hover:bg-[#f1eee6] text-slate-600 border border-[#d9d2c2]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.shortLabel}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#dceceb] text-[#176f78]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-View Content */}
      <div>
        {subTab === 'daily-checklist' && (
          <DailyChecklist
            checklists={checklists}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onUpdateTaskStatus={onUpdateTaskStatus}
            onBatchUpdateChecklist={onBatchUpdateChecklist || (() => {})}
            profile={profile}
            roleTiers={roleTiers}
            onNavigate={onNavigate}
          />
        )}

        {subTab === 'todo-schedule' && (
          <TodoSchedule
            todos={todos}
            schedules={schedules}
            onUpdateTodos={onUpdateTodos}
            onUpdateSchedules={onUpdateSchedules}
            profile={profile}
          />
        )}

        {subTab === 'actions' && (
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <ActionTrackerTab
              actions={actions}
              fiveWhys={fiveWhys}
              onOpenNewAction={onOpenNewAction}
              onUpdateActionStatus={onUpdateActionStatus}
              onAddNewFiveWhy={onAddNewFiveWhy}
            />
          </div>
        )}

        {subTab === 'audits' && (
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <AuditsTab
              auditItems={auditItems}
              centerlines={centerlines}
              onToggleAuditItem={onToggleAuditItem}
              onUpdateCenterlineValue={onUpdateCenterlineValue}
            />
          </div>
        )}

        {subTab === 'monthly-summary' && (
          <MonthlySummary
            lines={lines}
            checklists={checklists}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            onNavigate={onNavigate}
            profile={profile}
            onAddTodo={onAddTodoFromAudit}
          />
        )}
      </div>
    </div>
  );
};
