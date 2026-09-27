/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft,
  Sparkles,
  Layers,
  Sliders,
  Clock,
  History,
  LayoutGrid,
  BarChart2,
  PieChart
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
import { AiOptimizationAssistant } from './AiOptimizationAssistant';

export type LineDataSubTab =
  | 'lines'
  | 'optimizer'
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
      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setSubTab('lines')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'lines'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Lines Telemetry</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('optimizer')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'optimizer'
              ? 'bg-gradient-to-r from-[#176f78] to-[#1a73e8] text-white shadow-2xs ring-2 ring-[#176f78]/30'
              : 'bg-gradient-to-r from-amber-50 to-teal-50 border border-amber-300/80 text-[#17343a] hover:border-[#176f78]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>AI Optimization Assistant</span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-slate-950">
            AI
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('balancing')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'balancing'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Line Balancing</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('hourly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'hourly'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Hourly Pacing</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('capacity')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'capacity'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Capacity Calculator</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('floor-plan')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'floor-plan'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Floor Plan</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('history')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'history'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Production History</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('loss-pareto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
            subTab === 'loss-pareto'
              ? 'bg-[#176f78] text-white shadow-2xs'
              : 'bg-white border border-[#d9d2c2] text-slate-700 hover:border-[#176f78]'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Loss Pareto</span>
        </button>
      </div>

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
            onOpenOptimizer={() => setSubTab('optimizer')}
          />
        )}

        {subTab === 'optimizer' && (
          <AiOptimizationAssistant
            lines={lines}
            onSaveLine={onSaveLine}
            onNavigateToLine={onSelectLineNo}
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
