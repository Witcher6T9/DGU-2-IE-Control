/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft
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

  return (
    <div className="space-y-4">
      {/* Return to Daily Checklist banner when viewing a deep operational sub-workspace */}
      {subTab !== 'daily-checklist' && (
        <div className="flex items-center justify-between bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('daily-checklist')}
            className="flex items-center gap-1.5 font-bold text-[#176f78] hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Daily Checklist</span>
          </button>
          <span className="font-semibold text-[#527078] capitalize">{subTab.replace('-', ' ')} Workspace</span>
        </div>
      )}

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
