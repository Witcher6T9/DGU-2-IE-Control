/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ChevronLeft
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

  return (
    <div className="space-y-4">
      {/* Return to Lean Toolkit banner when viewing an interactive operational workspace */}
      {subTab !== 'toolkit' && (
        <div className="flex items-center justify-between bg-[#fbfaf6] border border-[#d9d2c2] rounded-xl px-3 py-2 text-xs">
          <button
            type="button"
            onClick={() => setSubTab('toolkit')}
            className="flex items-center gap-1.5 font-bold text-[#176f78] hover:underline cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Lean 13 Methods</span>
          </button>
          <span className="font-semibold text-[#527078] capitalize">{subTab.replace('-', ' ')} Workspace</span>
        </div>
      )}

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
