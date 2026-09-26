/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  ArrowLeftRight,
  Move,
  Layers,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Building,
  User,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { DebonairOrgChart, LineIEMember, InchargeNode } from '../data/debonairOrgData';

interface RearrangeOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgChart: DebonairOrgChart;
  onSaveChart: (newChart: DebonairOrgChart) => void;
  onResetDefault: () => void;
}

type TabMode = 'swap_engineers' | 'transfer_floor' | 'line_assignments';

export const RearrangeOrgModal: React.FC<RearrangeOrgModalProps> = ({
  isOpen,
  onClose,
  orgChart,
  onSaveChart,
  onResetDefault
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('swap_engineers');
  const [memberAId, setMemberAId] = useState<string>('');
  const [memberBId, setMemberBId] = useState<string>('');
  const [swapMode, setSwapMode] = useState<'full' | 'personnel_only' | 'lines_only'>('full');

  // Transfer state
  const [transferMemberId, setTransferMemberId] = useState<string>('');
  const [targetInchargeId, setTargetInchargeId] = useState<string>('');

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(
    null
  );

  if (!isOpen) return null;

  // Gather all Line IEs flattened with parent incharge
  const allLineIEs: {
    lie: LineIEMember;
    inc: InchargeNode;
    mgrIndex: number;
    incIndex: number;
    lieIndex: number;
  }[] = [];

  orgChart.managers.forEach((mgr, mgrIndex) => {
    mgr.incharges.forEach((inc, incIndex) => {
      inc.lineIEs.forEach((lie, lieIndex) => {
        allLineIEs.push({ lie, inc, mgrIndex, incIndex, lieIndex });
      });
    });
  });

  const allIncharges: { inc: InchargeNode; mgrIndex: number; incIndex: number }[] = [];
  orgChart.managers.forEach((mgr, mgrIndex) => {
    mgr.incharges.forEach((inc, incIndex) => {
      allIncharges.push({ inc, mgrIndex, incIndex });
    });
  });

  // Set default selections if empty
  if (!memberAId && allLineIEs.length >= 2) {
    setMemberAId(allLineIEs[0].lie.id);
    setMemberBId(allLineIEs[1].lie.id);
  }
  if (!transferMemberId && allLineIEs.length > 0) {
    setTransferMemberId(allLineIEs[0].lie.id);
  }
  if (!targetInchargeId && allIncharges.length > 1) {
    setTargetInchargeId(allIncharges[1].inc.id);
  }

  // Handle Swap Execution
  const handleExecuteSwap = () => {
    if (!memberAId || !memberBId || memberAId === memberBId) {
      setNotification({
        text: 'Please select two distinct Line IEs to swap.',
        type: 'error'
      });
      return;
    }

    const itemA = allLineIEs.find(item => item.lie.id === memberAId);
    const itemB = allLineIEs.find(item => item.lie.id === memberBId);

    if (!itemA || !itemB) return;

    // Deep clone org chart
    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));

    if (swapMode === 'full') {
      // Swap entire Line IE objects in their respective arrays
      const tempLie = { ...newChart.managers[itemA.mgrIndex].incharges[itemA.incIndex].lineIEs[itemA.lieIndex] };
      newChart.managers[itemA.mgrIndex].incharges[itemA.incIndex].lineIEs[itemA.lieIndex] = {
        ...newChart.managers[itemB.mgrIndex].incharges[itemB.incIndex].lineIEs[itemB.lieIndex]
      };
      newChart.managers[itemB.mgrIndex].incharges[itemB.incIndex].lineIEs[itemB.lieIndex] = tempLie;

      setNotification({
        text: `Swapped ${itemA.lie.engineerName} (L-${itemA.lie.lines.join('&')}) with ${itemB.lie.engineerName} (L-${itemB.lie.lines.join('&')})!`,
        type: 'success'
      });
    } else if (swapMode === 'personnel_only') {
      // Keep line assignments, swap engineer names only
      const nameA = itemA.lie.engineerName;
      const nameB = itemB.lie.engineerName;

      newChart.managers[itemA.mgrIndex].incharges[itemA.incIndex].lineIEs[itemA.lieIndex].engineerName = nameB;
      newChart.managers[itemB.mgrIndex].incharges[itemB.incIndex].lineIEs[itemB.lieIndex].engineerName = nameA;

      setNotification({
        text: `Swapped engineer assignments: ${nameA} <-> ${nameB}`,
        type: 'success'
      });
    } else if (swapMode === 'lines_only') {
      // Keep engineers on their floor, swap their line pairs
      const linesA = [...itemA.lie.lines];
      const linesB = [...itemB.lie.lines];
      const lineNoA = itemA.lie.lineNo;
      const lineNoB = itemB.lie.lineNo;

      newChart.managers[itemA.mgrIndex].incharges[itemA.incIndex].lineIEs[itemA.lieIndex].lines = linesB;
      newChart.managers[itemA.mgrIndex].incharges[itemA.incIndex].lineIEs[itemA.lieIndex].lineNo = lineNoB;

      newChart.managers[itemB.mgrIndex].incharges[itemB.incIndex].lineIEs[itemB.lieIndex].lines = linesA;
      newChart.managers[itemB.mgrIndex].incharges[itemB.incIndex].lineIEs[itemB.lieIndex].lineNo = lineNoA;

      setNotification({
        text: `Swapped line pairs: L-${linesA.join('&')} <-> L-${linesB.join('&')}`,
        type: 'success'
      });
    }

    onSaveChart(newChart);
  };

  // Handle Floor Transfer
  const handleExecuteTransfer = () => {
    if (!transferMemberId || !targetInchargeId) return;

    const source = allLineIEs.find(item => item.lie.id === transferMemberId);
    const target = allIncharges.find(item => item.inc.id === targetInchargeId);

    if (!source || !target) return;
    if (source.inc.id === target.inc.id) {
      setNotification({
        text: 'The engineer is already assigned to this Incharge & Floor.',
        type: 'error'
      });
      return;
    }

    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));

    // Remove from source incharge
    const [movedLie] = newChart.managers[source.mgrIndex].incharges[source.incIndex].lineIEs.splice(
      source.lieIndex,
      1
    );

    // Update section and floor
    movedLie.section = target.inc.section;
    movedLie.floor = target.inc.assignedFloors;
    movedLie.floorName = target.inc.title.replace('IE Incharge - ', '') + ' Floor';

    // Add to target incharge
    newChart.managers[target.mgrIndex].incharges[target.incIndex].lineIEs.push(movedLie);

    onSaveChart(newChart);
    setNotification({
      text: `Transferred ${movedLie.engineerName} to ${target.inc.title} (${target.inc.assignedFloors})!`,
      type: 'success'
    });
  };

  // Handle Auto-Sequential Lines
  const handleAutoSequential = () => {
    if (
      !window.confirm(
        'Auto-sequence lines across all 18 Line IEs sequentially from Line 01 through Line 34 (2 lines per IE)?'
      )
    ) {
      return;
    }

    const newChart: DebonairOrgChart = JSON.parse(JSON.stringify(orgChart));
    let lineCounter = 1;

    newChart.managers.forEach(mgr => {
      mgr.incharges.forEach(inc => {
        inc.lineIEs.forEach(lie => {
          const l1 = String(lineCounter).padStart(2, '0');
          lineCounter++;
          const l2 = lineCounter <= 34 ? String(lineCounter).padStart(2, '0') : 'Pilot';
          if (lineCounter <= 34) lineCounter++;

          lie.lines = [l1, l2];
          lie.lineNo = `${l1} & ${l2}`;
        });
      });
    });

    onSaveChart(newChart);
    setNotification({
      text: 'Successfully sequenced production lines 01 - 34 evenly (2 lines per IE)!',
      type: 'success'
    });
  };

  const selectedMemberA = allLineIEs.find(item => item.lie.id === memberAId);
  const selectedMemberB = allLineIEs.find(item => item.lie.id === memberBId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#fcfbf9] rounded-3xl border border-[#d9d2c2] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e0d2] bg-[#f5f1e8]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white border border-[#d2c9b6] text-[#176f78] shadow-2xs">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17343a]">
                Organogram Rearrange & Reassignment Studio
              </h3>
              <p className="text-xs text-[#527078] mt-0.5">
                Debonair LTD (Unit-02) • Swap personnel, transfer floors, or reallocate lines
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#527078] hover:text-[#17343a] hover:bg-[#e8e2d4] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#e6e0d2] bg-[#faf8f4]">
          <button
            type="button"
            onClick={() => setActiveTab('swap_engineers')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'swap_engineers'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Swap Two Personnel</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer_floor')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'transfer_floor'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            <span>Floor / Incharge Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('line_assignments')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'line_assignments'
                ? 'border-[#176f78] text-[#176f78]'
                : 'border-transparent text-[#527078] hover:text-[#17343a]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Batch Line Sequencing</span>
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div
            className={`px-6 py-2.5 border-b text-xs font-semibold flex items-center justify-between ${
              notification.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  notification.type === 'error' ? 'text-rose-600' : 'text-emerald-600'
                }`}
              />
              <span>{notification.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className={`text-xs font-bold ${
                notification.type === 'error'
                  ? 'text-rose-700 hover:text-rose-900'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'swap_engineers' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#f4f1e8] border border-[#dcd4c3] text-xs text-[#527078] leading-relaxed">
                Choose any two Line IEs to perform an instantaneous swap. You can choose whether to swap
                their positions, just their assigned personnel names, or their allocated line pairs.
              </div>

              {/* Personnel A and B Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member A Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176f78] block">
                    Person 1
                  </span>
                  <select
                    value={memberAId}
                    onChange={e => setMemberAId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-[#faf8f4] cursor-pointer"
                  >
                    {allLineIEs.map(item => (
                      <option key={item.lie.id} value={item.lie.id}>
                        {item.lie.engineerName} (L-{item.lie.lines.join('&')}) - {item.lie.floorName}
                      </option>
                    ))}
                  </select>

                  {selectedMemberA && (
                    <div className="mt-2 text-xs space-y-1 p-2 rounded-lg bg-[#f8f6f0]">
                      <div className="font-semibold text-[#17343a]">
                        {selectedMemberA.lie.engineerName}
                      </div>
                      <div className="text-[11px] text-[#527078]">
                        Lines: <strong className="text-[#176f78]">L-{selectedMemberA.lie.lines.join(' & L-')}</strong>
                      </div>
                      <div className="text-[11px] text-[#527078]">
                        Supervisor: {selectedMemberA.inc.title}
                      </div>
                    </div>
                  )}
                </div>

                {/* Member B Card */}
                <div className="p-4 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#176f78] block">
                    Person 2
                  </span>
                  <select
                    value={memberBId}
                    onChange={e => setMemberBId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-[#faf8f4] cursor-pointer"
                  >
                    {allLineIEs.map(item => (
                      <option key={item.lie.id} value={item.lie.id}>
                        {item.lie.engineerName} (L-{item.lie.lines.join('&')}) - {item.lie.floorName}
                      </option>
                    ))}
                  </select>

                  {selectedMemberB && (
                    <div className="mt-2 text-xs space-y-1 p-2 rounded-lg bg-[#f8f6f0]">
                      <div className="font-semibold text-[#17343a]">
                        {selectedMemberB.lie.engineerName}
                      </div>
                      <div className="text-[11px] text-[#527078]">
                        Lines: <strong className="text-[#176f78]">L-{selectedMemberB.lie.lines.join(' & L-')}</strong>
                      </div>
                      <div className="text-[11px] text-[#527078]">
                        Supervisor: {selectedMemberB.inc.title}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Swap Mode Radio Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                  Swap Operation Mode
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSwapMode('full')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      swapMode === 'full'
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                        : 'bg-white text-[#17343a] border-[#d9d2c2] hover:bg-[#f8f6f0]'
                    }`}
                  >
                    <div className="font-bold text-xs">Full Swap</div>
                    <div className={`text-[10px] mt-0.5 ${swapMode === 'full' ? 'text-teal-100' : 'text-[#527078]'}`}>
                      Exchanges positions, lines & floor allocations.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapMode('personnel_only')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      swapMode === 'personnel_only'
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                        : 'bg-white text-[#17343a] border-[#d9d2c2] hover:bg-[#f8f6f0]'
                    }`}
                  >
                    <div className="font-bold text-xs">Personnel Only</div>
                    <div className={`text-[10px] mt-0.5 ${swapMode === 'personnel_only' ? 'text-teal-100' : 'text-[#527078]'}`}>
                      Swaps engineers; line slots stay stationary.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapMode('lines_only')}
                    className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                      swapMode === 'lines_only'
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                        : 'bg-white text-[#17343a] border-[#d9d2c2] hover:bg-[#f8f6f0]'
                    }`}
                  >
                    <div className="font-bold text-xs">Lines Only</div>
                    <div className={`text-[10px] mt-0.5 ${swapMode === 'lines_only' ? 'text-teal-100' : 'text-[#527078]'}`}>
                      Engineers stay; only their line pairs exchange.
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExecuteSwap}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#176f78] hover:bg-[#12555c] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Execute Swap Now</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'transfer_floor' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#f4f1e8] border border-[#dcd4c3] text-xs text-[#527078] leading-relaxed">
                Reassign an engineer from their current floor/incharge to a different production section
                or wing.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                    Select Line IE to Transfer
                  </label>
                  <select
                    value={transferMemberId}
                    onChange={e => setTransferMemberId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white cursor-pointer"
                  >
                    {allLineIEs.map(item => (
                      <option key={item.lie.id} value={item.lie.id}>
                        {item.lie.engineerName} - Currently {item.inc.title} (L-{item.lie.lines.join('&')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#527078] block">
                    Select Target Floor & Incharge
                  </label>
                  <select
                    value={targetInchargeId}
                    onChange={e => setTargetInchargeId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[#d9d2c2] text-xs font-bold text-[#17343a] bg-white cursor-pointer"
                  >
                    {allIncharges.map(item => (
                      <option key={item.inc.id} value={item.inc.id}>
                        {item.inc.title} - {item.inc.assignedFloors} [{item.inc.section.toUpperCase()} WING]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExecuteTransfer}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#176f78] hover:bg-[#12555c] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-98"
              >
                <Move className="w-4 h-4" />
                <span>Transfer Line IE to New Floor</span>
              </button>
            </div>
          )}

          {activeTab === 'line_assignments' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#f4f1e8] border border-[#dcd4c3] flex items-center justify-between gap-3">
                <div className="text-xs text-[#527078]">
                  <strong className="text-[#17343a] block">Quick Auto-Balance Tool</strong>
                  Automatically assign sequential pairs (01 & 02, 03 & 04, ... 33 & 34) across all 18 Line
                  IEs.
                </div>
                <button
                  type="button"
                  onClick={handleAutoSequential}
                  className="px-3.5 py-2 rounded-xl bg-[#17343a] hover:bg-slate-800 text-white text-xs font-bold shrink-0 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Auto-Sequence (01-34)</span>
                </button>
              </div>

              {/* Roster Table */}
              <div className="border border-[#d9d2c2] rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#f5f1e8] text-[#527078] font-bold uppercase text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Floor</th>
                        <th className="p-2.5">Incharge</th>
                        <th className="p-2.5">Engineer</th>
                        <th className="p-2.5">Assigned Lines</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee9dc]">
                      {allLineIEs.map(item => (
                        <tr key={item.lie.id} className="hover:bg-[#fbfaf6]">
                          <td className="p-2.5 font-medium text-[#17343a]">{item.lie.floorName}</td>
                          <td className="p-2.5 text-[#527078]">{item.inc.title.replace('IE Incharge - ', '')}</td>
                          <td className="p-2.5 font-semibold text-[#17343a]">
                            {item.lie.engineerName}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-[#176f78]">
                            L-{item.lie.lines.join(' & L-')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e6e0d2] bg-[#f5f1e8] flex items-center justify-between">
          <button
            type="button"
            onClick={onResetDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-[#d9d2c2] text-xs font-bold transition-colors cursor-pointer"
            title="Reset organogram back to factory regular data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Debonair Regular Data</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#17343a] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
