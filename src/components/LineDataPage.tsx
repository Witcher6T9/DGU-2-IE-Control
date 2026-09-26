/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft
} from 'lucide-react';
import { LineEntry, ChecklistMap, UserProfile, RoleTier, LeanActionItem } from '../types';
import { StationData, HourlyOutput, DowntimeIncident } from '../types/dcs';
import { LineData, LineSortCriterion, SortDirection } from './LineData';
import { LineBalancingTab } from './LineBalancingTab';
import { HourlyPacingTab } from './HourlyPacingTab';
import { LossParetoTab } from './LossParetoTab';
import { FloorPlanLineSetup } from './FloorPlanLineSetup';
import { LineProductionHistoryView } from './LineProductionHistoryView';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';

export type LineDataSubTab =
  | 'lines'
  | 'balancing'
  | 'hourly'
  | 'loss-pareto'
  | 'floor-plan'
  | 'history'
  | 'capacity';

interface LineDataPageProps {
  lines: LineEntry[];
  checklists?: ChecklistMap;
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onSaveLine: (line: LineEntry) => void;
  onAddNewLine?: (customLine?: LineEntry | Partial<LineEntry>) => void;
  onDeleteLine?: (identifier: string | number) => void;
  onDeleteFloor?: (floorName: string, mode: 'delete_all_lines' | 'reassign', targetFloor?: string) => void;
  onReorderLines?: (reordered: LineEntry[]) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  activeDate?: string;
  onSelectDate?: (date: string) => void;
  profile?: UserProfile;
  roleTiers?: RoleTier[];
  initialSubTab?: LineDataSubTab;
  initialSortBy?: LineSortCriterion;
  initialSortDirection?: SortDirection;
  stations?: StationData[];
  hourlyData?: HourlyOutput[];
  downtimeLog?: DowntimeIncident[];
  onOpenNewDowntime?: () => void;
  onUpdateHourNotes?: (hourIndex: number, notes: string) => void;
  onUpdateHourOutput?: (hourIndex: number, actual: number, scrap: number, downtimeMinutes: number) => void;
  factoryProfile?: any;
  onUpdateFactoryProfile?: (updated: any) => void;
  savedFactories?: any[];
  onSaveFactoryList?: (list: any[]) => void;
  onOpenDatabase?: (tab?: 'backup' | 'csv-import') => void;
  actions?: LeanActionItem[];
  onUpdateActions?: (actions: LeanActionItem[]) => void;
}

export const LineDataPage: React.FC<LineDataPageProps> = ({
  lines,
  checklists,
  selectedLineNo,
  onSelectLineNo,
  onSaveLine,
  onAddNewLine,
  onDeleteLine,
  onDeleteFloor,
  onReorderLines,
  onNavigate,
  activeDate,
  onSelectDate,
  profile,
  roleTiers,
  initialSubTab = 'lines',
  initialSortBy,
  initialSortDirection,
  stations = [],
  hourlyData = [],
  downtimeLog = [],
  onOpenNewDowntime = () => {},
  onUpdateHourNotes = () => {},
  factoryProfile,
  onUpdateFactoryProfile,
  savedFactories,
  onSaveFactoryList,
  onOpenDatabase,
  actions = [],
  onUpdateActions = () => {}
}) => {
  const [subTab, setSubTab] = useState<LineDataSubTab>(initialSubTab);
  const [hubSortBy, setHubSortBy] = useState<LineSortCriterion>(initialSortBy || 'lineNo');
  const [hubSortDirection, setHubSortDirection] = useState<SortDirection>(initialSortDirection || 'asc');

  return (
    <div className="space-y-4">
      {/* Return to Lines telemetry banner when viewing a deep operational workspace */}
      {subTab !== 'lines' && (
        <div className="flex items-center justify-between bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('lines')}
            className="flex items-center gap-1.5 font-bold text-[#176f78] hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Lines Telemetry</span>
          </button>
          <span className="font-semibold text-[#527078] capitalize">{subTab.replace('-', ' ')} Workspace</span>
        </div>
      )}

      {/* Active Sub-Tab View Rendering */}
      <div>
        {subTab === 'lines' && (
          <LineData
            lines={lines}
            checklists={checklists}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onSaveLine={onSaveLine}
            onAddNewLine={onAddNewLine}
            onDeleteLine={onDeleteLine}
            onDeleteFloor={onDeleteFloor}
            onNavigate={onNavigate}
            activeDate={activeDate}
            onSelectDate={onSelectDate}
            profile={profile}
            roleTiers={roleTiers}
            initialSortBy={hubSortBy}
            initialSortDirection={hubSortDirection}
          />
        )}

        {subTab === 'balancing' && (
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <LineBalancingTab stations={stations} />
          </div>
        )}

        {subTab === 'hourly' && (
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <HourlyPacingTab
              hourlyData={hourlyData}
              onUpdateHourNotes={onUpdateHourNotes}
            />
          </div>
        )}

        {subTab === 'loss-pareto' && (
          <div className="bg-white rounded-2xl border border-[#d9d2c2] p-4 sm:p-6 shadow-2xs">
            <LossParetoTab
              downtimeLog={downtimeLog}
              onOpenNewDowntime={onOpenNewDowntime}
            />
          </div>
        )}

        {subTab === 'floor-plan' && (
          <FloorPlanLineSetup
            lines={lines}
            onSaveLine={onSaveLine}
            onAddNewLine={(newLine: LineEntry) => onAddNewLine && onAddNewLine(newLine)}
            onDeleteLine={onDeleteLine}
            onDeleteFloor={onDeleteFloor}
            onReorderLines={onReorderLines}
            onNavigate={(tab, lineNo) => onNavigate && onNavigate(tab, lineNo)}
            activeDate={activeDate}
            profile={profile}
            initialLineNo={selectedLineNo}
            onOpenDatabase={onOpenDatabase}
            factoryProfile={factoryProfile}
            onUpdateFactoryProfile={onUpdateFactoryProfile}
            savedFactories={savedFactories}
            onSaveFactoryList={onSaveFactoryList}
          />
        )}

        {subTab === 'history' && (
          <LineProductionHistoryView
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onNavigate={onNavigate}
            onSelectDate={onSelectDate}
            profile={profile}
          />
        )}

        {subTab === 'capacity' && (
          <CapacityCalculatorWorkspace
            onBack={() => setSubTab('lines')}
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSaveLine={onSaveLine}
            actions={actions}
            onUpdateActions={onUpdateActions}
            profile={profile}
          />
        )}
      </div>
    </div>
  );
};
