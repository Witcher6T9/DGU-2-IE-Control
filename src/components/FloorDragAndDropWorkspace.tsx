/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Floor Setup: Drag and Drop Line Reallocation Workspace
 * Allows drag-and-drop movement of lines between production floors, automatically updating line.floor in state
 */

import React, { useState, useMemo } from 'react';
import {
  Layers,
  GripVertical,
  CheckCircle2,
  Search,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Users,
  Target,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Building2,
  Move,
  Check,
  RotateCcw
} from 'lucide-react';
import { LineEntry } from '../types';
import { CustomFloor, getEffectiveFloors, isLineOnFloor } from '../utils/floorManager';

interface FloorDragAndDropWorkspaceProps {
  lines: LineEntry[];
  floors?: CustomFloor[];
  onSaveLine: (updatedLine: LineEntry) => void;
  onSaveMultipleLines?: (updatedLines: LineEntry[]) => void;
  onSelectLineNo?: (lineNo: string) => void;
  onNavigate?: (tab: string, lineNo?: string) => void;
}

export const FloorDragAndDropWorkspace: React.FC<FloorDragAndDropWorkspaceProps> = ({
  lines,
  floors: propFloors,
  onSaveLine,
  onSaveMultipleLines,
  onSelectLineNo,
  onNavigate
}) => {
  const effectiveFloors = useMemo(() => {
    return propFloors && propFloors.length > 0 ? propFloors : getEffectiveFloors(lines);
  }, [propFloors, lines]);

  // Drag state
  const [draggedLineNo, setDraggedLineNo] = useState<string | null>(null);
  const [dragOverFloorName, setDragOverFloorName] = useState<string | null>(null);
  const [lastMovedNotification, setLastMovedNotification] = useState<string | null>(null);
  const [activeMoveMenuLineNo, setActiveMoveMenuLineNo] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [cardDensity, setCardDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Compute floor groups
  const floorGroups = useMemo(() => {
    return effectiveFloors.map(floor => {
      const matchedLines = lines.filter(l => isLineOnFloor(l.floor, floor.name));

      // Apply search filter if query is entered
      const filtered = matchedLines.filter(l => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          l.lineNo.toLowerCase().includes(q) ||
          (l.style && l.style.toLowerCase().includes(q)) ||
          (l.buyer && l.buyer.toLowerCase().includes(q))
        );
      });

      const sorted = [...filtered].sort((a, b) => {
        const numA = parseInt(String(a.lineNo).replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(String(b.lineNo).replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });

      const totalPlanned = matchedLines.reduce((acc, l) => acc + (l.targetProd || 0), 0);
      const totalAchieved = matchedLines.reduce((acc, l) => acc + (l.achievedProd || 0), 0);
      const totalMP = matchedLines.reduce((acc, l) => acc + (l.plannedMP || 0), 0);
      const avgEff =
        matchedLines.length > 0
          ? Math.round(matchedLines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / matchedLines.length)
          : 0;

      return {
        floor,
        lines: sorted,
        rawMatchedCount: matchedLines.length,
        totalPlanned,
        totalAchieved,
        totalMP,
        avgEff
      };
    });
  }, [effectiveFloors, lines, searchQuery]);

  // Total lines across all floors
  const totalMappedLines = useMemo(() => {
    return floorGroups.reduce((acc, g) => acc + g.rawMatchedCount, 0);
  }, [floorGroups]);

  // Execute reallocation of line to target floor
  const reallocateLineToFloor = (lineNo: string, targetFloorName: string) => {
    const cleanFloor = targetFloorName.trim();
    const targetLine = lines.find(l => l.lineNo === lineNo);
    if (!targetLine) return;

    // Check if line is already on this floor
    if (isLineOnFloor(targetLine.floor, cleanFloor)) {
      return;
    }

    const previousFloor = targetLine.floor || 'Unassigned';

    // Automatically update the `floor` property of the LineEntry object in state
    const updatedLine: LineEntry = {
      ...targetLine,
      floor: cleanFloor
    };

    onSaveLine(updatedLine);

    if (onSaveMultipleLines) {
      const allUpdated = lines.map(l => (l.lineNo === lineNo ? { ...l, floor: cleanFloor } : l));
      onSaveMultipleLines(allUpdated);
    }

    setLastMovedNotification(`Line ${lineNo} reallocated from "${previousFloor}" to "${cleanFloor}".`);
    setActiveMoveMenuLineNo(null);
    setTimeout(() => setLastMovedNotification(null), 4000);
  };

  // Handle Drag Start
  const handleDragStart = (e: React.DragEvent, line: LineEntry) => {
    setDraggedLineNo(line.lineNo);
    e.dataTransfer.setData('text/plain', line.lineNo);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent, floorName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverFloorName !== floorName) {
      setDragOverFloorName(floorName);
    }
  };

  // Handle Drag Leave
  const handleDragLeave = (e: React.DragEvent, floorName: string) => {
    e.preventDefault();
    if (dragOverFloorName === floorName) {
      setDragOverFloorName(null);
    }
  };

  // Handle Drop onto Floor
  const handleDrop = (e: React.DragEvent, targetFloorName: string) => {
    e.preventDefault();
    setDragOverFloorName(null);

    const lineNo = e.dataTransfer.getData('text/plain') || draggedLineNo;
    setDraggedLineNo(null);

    if (!lineNo) return;
    reallocateLineToFloor(lineNo, targetFloorName);
  };

  return (
    <div id="floor-drag-and-drop-workspace" className="space-y-4">
      {/* Top Banner & Search Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 p-4 sm:p-5 rounded-2xl bg-white border border-[#d9d2c2] shadow-2xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-lg bg-teal-50 text-[#176f78]">
              <Move className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#17343a] font-display uppercase tracking-wide">
              Drag &amp; Drop Floor Line Allocation
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live State Sync Active
            </span>
          </div>
          <p className="text-xs text-[#527078] mt-1 max-w-2xl">
            Drag any sewing line tile and drop it into another floor column to immediately reassign its{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-[#176f78]">floor</code> property in state.
            You can also use the quick &ldquo;Move&rdquo; button on any card.
          </p>
        </div>

        {/* Search, Density & Stats Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[190px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search line #, style, buyer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#d9d2c2] bg-[#fbfaf6] text-[#17343a] focus:outline-hidden focus:ring-2 focus:ring-[#176f78]"
            />
          </div>

          <div className="flex items-center p-0.5 bg-[#f1eee6] rounded-xl border border-[#d9d2c2]">
            <button
              type="button"
              onClick={() => setCardDensity('comfortable')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardDensity === 'comfortable'
                  ? 'bg-white text-[#176f78] shadow-2xs font-extrabold'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setCardDensity('compact')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                cardDensity === 'compact'
                  ? 'bg-white text-[#176f78] shadow-2xs font-extrabold'
                  : 'text-[#527078] hover:text-[#17343a]'
              }`}
            >
              Compact
            </button>
          </div>

          <div className="text-[11px] font-mono px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-[#17343a] font-bold">
            {totalMappedLines} Lines / {effectiveFloors.length} Floors
          </div>
        </div>
      </div>

      {/* Real-time feedback notification */}
      {lastMovedNotification && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{lastMovedNotification}</span>
            <span className="text-[10px] font-mono font-normal opacity-80">(State updated in real-time)</span>
          </div>
          <button
            type="button"
            onClick={() => setLastMovedNotification(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Drag & Drop Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5 overflow-x-auto pb-4">
        {floorGroups.map(({ floor, lines: floorLines, rawMatchedCount, avgEff, totalAchieved, totalPlanned, totalMP }) => {
          const isDropTarget = dragOverFloorName === floor.name;

          return (
            <div
              key={floor.id || floor.name}
              onDragOver={e => handleDragOver(e, floor.name)}
              onDragLeave={e => handleDragLeave(e, floor.name)}
              onDrop={e => handleDrop(e, floor.name)}
              className={`rounded-2xl border transition-all flex flex-col min-h-[420px] shadow-2xs ${
                isDropTarget
                  ? 'border-[#176f78] bg-teal-50/80 ring-2 ring-[#176f78] ring-offset-2 scale-[1.01]'
                  : 'border-[#d9d2c2] bg-[#fbfaf6]'
              }`}
            >
              {/* Floor Column Header */}
              <div className="p-4 border-b border-[#e7e1d5] bg-white rounded-t-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-2xs"
                      style={{ backgroundColor: floor.color || '#176f78' }}
                    />
                    <h4 className="font-bold text-sm sm:text-base text-[#17343a] font-display">
                      {floor.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#dceceb] text-[#176f78]">
                    {rawMatchedCount} Lines
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#527078] font-mono">
                  <span>Eff: <strong className="text-[#176f78]">{avgEff}%</strong></span>
                  <span>•</span>
                  <span>MP: <strong>{totalMP}</strong></span>
                  <span>•</span>
                  <span>Out: <strong>{totalAchieved}</strong>/{totalPlanned}</span>
                </div>

                {/* Drop Zone Indicator Cue */}
                <div
                  className={`text-xs py-1.5 px-2.5 rounded-xl border-2 border-dashed text-center font-bold transition-all ${
                    isDropTarget
                      ? 'border-[#176f78] bg-white text-[#176f78] animate-pulse shadow-xs'
                      : 'border-[#d9d2c2]/60 text-slate-400 bg-white/50 text-[11px]'
                  }`}
                >
                  {isDropTarget
                    ? `Drop Line ${draggedLineNo ? `L${draggedLineNo}` : ''} Here to Assign to ${floor.name}`
                    : `Drop lines here to move to ${floor.name}`}
                </div>
              </div>

              {/* Draggable Lines List */}
              <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[560px]">
                {floorLines.length === 0 ? (
                  <div className="h-44 border-2 border-dashed border-[#d9d2c2] rounded-xl flex flex-col items-center justify-center text-center p-4 text-[#527078] text-xs">
                    <Layers className="w-6 h-6 text-slate-300 mb-1" />
                    <span className="font-bold">No Lines on this Floor</span>
                    <span className="text-[11px] opacity-75 mt-0.5">Drag lines here to populate this floor</span>
                  </div>
                ) : (
                  floorLines.map(line => {
                    const isDraggingThis = draggedLineNo === line.lineNo;
                    const eff = line.efficiency ?? 0;
                    const isHighEff = eff >= (line.targetEff || 80);
                    const isCritBN = line.bottleneck && (line.bottleneck.status === 'critical' || line.bottleneck.status === 'high');
                    const isMenuOpen = activeMoveMenuLineNo === line.lineNo;

                    if (cardDensity === 'compact') {
                      return (
                        <div
                          key={line.id || line.lineNo}
                          draggable
                          onDragStart={e => handleDragStart(e, line)}
                          className={`p-2 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing select-none group touch-manipulation relative ${
                            isDraggingThis
                              ? 'opacity-40 border-dashed border-teal-500 scale-95'
                              : 'border-[#d9d2c2] hover:border-[#176f78]'
                          }`}
                        >
                          <div
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              if (onSelectLineNo) onSelectLineNo(line.lineNo);
                            }}
                          >
                            <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 shrink-0" />
                            <span className="font-mono font-black text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                              L{line.lineNo}
                            </span>
                            <span className="text-xs font-semibold text-[#17343a] truncate max-w-[120px]">
                              {line.style || 'Standard'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isHighEff ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                            }`}>
                              {eff}%
                            </span>

                            {/* Quick Move Floor Button */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveMoveMenuLineNo(isMenuOpen ? null : line.lineNo);
                                }}
                                title="Move line to another floor"
                                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#176f78] cursor-pointer"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#d9d2c2] p-1.5 z-30 space-y-1">
                                  <div className="text-[10px] font-bold text-[#527078] px-2 py-1 uppercase tracking-wider border-b border-slate-100">
                                    Move L{line.lineNo} to:
                                  </div>
                                  {effectiveFloors.map(fl => {
                                    const isCurrent = isLineOnFloor(line.floor, fl.name);
                                    return (
                                      <button
                                        key={fl.id || fl.name}
                                        type="button"
                                        disabled={isCurrent}
                                        onClick={e => {
                                          e.stopPropagation();
                                          reallocateLineToFloor(line.lineNo, fl.name);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                                          isCurrent
                                            ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                                            : 'text-[#17343a] hover:bg-teal-50 hover:text-[#176f78]'
                                        }`}
                                      >
                                        <span className="truncate">{fl.name}</span>
                                        {isCurrent && <Check className="w-3 h-3 text-slate-400 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Comfortable Card View
                    return (
                      <div
                        key={line.id || line.lineNo}
                        draggable
                        onDragStart={e => handleDragStart(e, line)}
                        className={`p-3.5 rounded-xl border bg-white shadow-2xs hover:shadow-xs transition-all space-y-2.5 cursor-grab active:cursor-grabbing select-none group touch-manipulation relative ${
                          isDraggingThis
                            ? 'opacity-40 border-dashed border-teal-500 scale-95'
                            : 'border-[#d9d2c2] hover:border-[#176f78]'
                        }`}
                      >
                        {/* Header: Grip Handle, Line Number, Buyer & Efficiency */}
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => {
                              if (onSelectLineNo) onSelectLineNo(line.lineNo);
                            }}
                          >
                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-[#176f78] shrink-0 transition-colors" />
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-[#f1eee6] text-[#17343a]">
                              Line {line.lineNo}
                            </span>
                            {line.buyer && (
                              <span className="text-[10px] font-bold text-[#527078] uppercase truncate max-w-[85px]">
                                {line.buyer}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                isHighEff
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {eff}% Eff
                            </span>

                            {/* Move Menu Dropdown */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setActiveMoveMenuLineNo(isMenuOpen ? null : line.lineNo);
                                }}
                                title="Move line to another floor"
                                className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-[#f1eee6] hover:bg-[#e7e1d5] text-[#176f78] flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>Move</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-[#d9d2c2] p-1.5 z-30 space-y-1">
                                  <div className="text-[10px] font-bold text-[#527078] px-2 py-1 uppercase tracking-wider border-b border-slate-100">
                                    Reallocate Line {line.lineNo} to:
                                  </div>
                                  {effectiveFloors.map(fl => {
                                    const isCurrent = isLineOnFloor(line.floor, fl.name);
                                    return (
                                      <button
                                        key={fl.id || fl.name}
                                        type="button"
                                        disabled={isCurrent}
                                        onClick={e => {
                                          e.stopPropagation();
                                          reallocateLineToFloor(line.lineNo, fl.name);
                                        }}
                                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between cursor-pointer ${
                                          isCurrent
                                            ? 'text-slate-400 bg-slate-50 cursor-not-allowed'
                                            : 'text-[#17343a] hover:bg-teal-50 hover:text-[#176f78]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 truncate">
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: fl.color || '#176f78' }}
                                          />
                                          <span className="truncate">{fl.name}</span>
                                        </div>
                                        {isCurrent && <Check className="w-3 h-3 text-slate-400 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Style Name */}
                        <div
                          className="text-xs font-semibold text-[#17343a] truncate cursor-pointer"
                          onClick={() => {
                            if (onSelectLineNo) onSelectLineNo(line.lineNo);
                          }}
                        >
                          {line.style || 'Running Style Unspecified'}
                        </div>

                        {/* Footer Metrics */}
                        <div className="flex items-center justify-between text-[10px] text-[#527078] font-mono pt-1.5 border-t border-[#f1eee6]">
                          <span>
                            Output: <strong className="text-[#176f78]">{line.achievedProd || line.dailyOutput || 0}</strong>/
                            {line.targetProd || 0}
                          </span>
                          <span>
                            MP: <strong>{line.plannedMP || line.mp?.Operator?.present || 35}</strong>
                          </span>
                          {isCritBN && (
                            <span className="text-rose-600 font-bold flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              <span>BN</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
