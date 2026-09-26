/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Layers,
  Sliders,
  BarChart2,
  TrendingDown,
  LayoutGrid,
  TrendingUp,
  Calculator,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { LineEntry, ChecklistMap, UserProfile, RoleTier, LeanActionItem } from '../types';
import { StationData, HourlyOutput, DowntimeIncident } from '../types/dcs';
import { LineData } from './LineData';
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

  // Debonair LTD (Unit-02) operates exactly 34 active sewing lines (Lines 01 to 34 across 6 factory floors)
  const totalActiveLines = React.useMemo(() => {
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

  const subTabs = [
    {
      id: 'lines' as LineDataSubTab,
      label: 'Lines Telemetry',
      shortLabel: 'Lines Table',
      icon: Layers,
      count: totalActiveLines
    },
    {
      id: 'balancing' as LineDataSubTab,
      label: 'Line Balancing (Yamazumi)',
      shortLabel: 'Balancing',
      icon: Sliders
    },
    {
      id: 'hourly' as LineDataSubTab,
      label: 'Hourly Pacing (UPH)',
      shortLabel: 'Hourly Pacing',
      icon: BarChart2
    },
    {
      id: 'loss-pareto' as LineDataSubTab,
      label: 'Loss Pareto & Downtimes',
      shortLabel: 'Loss Pareto',
      icon: TrendingDown,
      badge: downtimeLog.length > 0 ? `${downtimeLog.length}` : undefined
    },
    {
      id: 'floor-plan' as LineDataSubTab,
      label: 'Floor Plan & Setup',
      shortLabel: 'Floor Plan',
      icon: LayoutGrid
    },
    {
      id: 'history' as LineDataSubTab,
      label: 'History & Learning Curves',
      shortLabel: 'History',
      icon: TrendingUp
    },
    {
      id: 'capacity' as LineDataSubTab,
      label: 'Capacity Calculator',
      shortLabel: 'Capacity',
      icon: Calculator
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Segmented Sub-Navigation for Line Data Page */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-2 sm:p-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#176f78] animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display">
                Line Data Operations Hub
              </h1>
              <span className="text-[10.5px] uppercase font-mono px-2.5 py-0.5 rounded-lg bg-[#176f78]/10 text-[#176f78] font-bold border border-[#176f78]/25 tracking-wide shadow-2xs inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#176f78] inline-block animate-pulse" />
                {totalActiveLines} Sewing Lines Active
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5 hidden sm:block">
              Real-time workstation balancing, hourly pacing, downtime loss analysis, and floor configurations.
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
                        isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
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
