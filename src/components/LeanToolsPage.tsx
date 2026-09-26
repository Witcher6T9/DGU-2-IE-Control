/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  Sliders,
  Calculator,
  LayoutGrid,
  Zap,
  Timer,
  BarChart3,
  Columns3,
  Award,
  Sparkles
} from 'lucide-react';
import {
  LeanActionItem,
  UserProfile,
  LineEntry,
  LeanMethod
} from '../types';
import { LEAN_METHODS } from '../mockData';
import { LeanToolkit } from './LeanToolkit';
import { LeanToolWorkspace } from './LeanToolWorkspace';
import { IESimulator } from './IESimulator';
import { CapacityCalculatorWorkspace } from './CapacityCalculatorWorkspace';

export type LeanToolsSubTab =
  | 'toolkit'
  | 'workspace'
  | 'simulator'
  | 'capacity';

interface LeanToolsPageProps {
  actions: LeanActionItem[];
  onUpdateActions: React.Dispatch<React.SetStateAction<LeanActionItem[]>>;
  profile: UserProfile;
  lines: LineEntry[];
  onSaveLine: (line: LineEntry) => void;
  selectedLineNo: string;
  onSelectLineNo: (lineNo: string) => void;
  onApplySimulationToLine?: (lineNo: string, updates: Partial<LineEntry>) => void;
  onAddNewLineWithSimulation?: (lineData: Partial<LineEntry>) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
  initialSubTab?: LeanToolsSubTab;
}

export const LeanToolsPage: React.FC<LeanToolsPageProps> = ({
  actions,
  onUpdateActions,
  profile,
  lines,
  onSaveLine,
  selectedLineNo,
  onSelectLineNo,
  onApplySimulationToLine = () => {},
  onAddNewLineWithSimulation = () => {},
  onNavigate = () => {},
  initialSubTab = 'toolkit'
}) => {
  const [subTab, setSubTab] = useState<LeanToolsSubTab>(initialSubTab);
  const [activeMethod, setActiveMethod] = useState<LeanMethod>(LEAN_METHODS[0]);

  const subTabs = [
    {
      id: 'toolkit' as LeanToolsSubTab,
      label: 'Lean 13 Methods & Kaizen',
      shortLabel: '13 Methods',
      icon: Wrench,
      badge: '13 WCM'
    },
    {
      id: 'workspace' as LeanToolsSubTab,
      label: 'Interactive Lean Workspaces',
      shortLabel: 'Workspaces',
      icon: LayoutGrid
    },
    {
      id: 'simulator' as LeanToolsSubTab,
      label: 'IE Flow & Line Simulator',
      shortLabel: 'IE Simulator',
      icon: Sliders,
      badge: 'PRO'
    },
    {
      id: 'capacity' as LeanToolsSubTab,
      label: 'Capacity & Pitch Calculator',
      shortLabel: 'Capacity Calc',
      icon: Calculator
    }
  ];

  return (
    <div className="space-y-4">
      {/* Top Segmented Sub-Navigation for Lean Tools Hub */}
      <div className="bg-[#fbfaf6] border border-[#d9d2c2] rounded-2xl p-2 sm:p-2.5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold text-[#17343a] font-display">
                Lean Tools & Industrial Engineering Cockpit
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200">
                World Class Manufacturing (WCM)
              </span>
            </div>
            <p className="text-xs text-[#527078] mt-0.5 hidden sm:block">
              5S audits, SMED quick changeovers, VSM, 8 Wastes DOWNTIME, line simulation, and OEE.
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
                        isActive ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
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
        {subTab === 'toolkit' && (
          <LeanToolkit
            actions={actions}
            onUpdateActions={onUpdateActions}
            profile={profile}
            lines={lines}
            onSaveLine={onSaveLine}
            selectedLineNo={selectedLineNo}
          />
        )}

        {subTab === 'workspace' && (
          <LeanToolWorkspace
            method={activeMethod}
            onBack={() => setSubTab('toolkit')}
            actions={actions}
            onUpdateActions={onUpdateActions}
            profile={profile}
          />
        )}

        {subTab === 'simulator' && (
          <IESimulator
            lines={lines}
            selectedLineNo={selectedLineNo}
            onSelectLineNo={onSelectLineNo}
            onApplyToLine={onApplySimulationToLine}
            onAddNewLineWithSimulation={onAddNewLineWithSimulation}
            onNavigate={(tab) => onNavigate(tab)}
            profile={profile}
          />
        )}

        {subTab === 'capacity' && (
          <CapacityCalculatorWorkspace
            onBack={() => setSubTab('toolkit')}
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
