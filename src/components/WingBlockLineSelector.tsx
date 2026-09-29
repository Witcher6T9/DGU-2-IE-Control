/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * Unified Merged (Wings, Blocks, Lines) Selector Component
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Layers,
  ChevronDown,
  Check,
  X,
  Building2,
  Factory,
  Search,
  ArrowRight,
  Filter,
  AlertTriangle,
  Zap,
  Activity,
  ChevronRight,
  Compass,
  SlidersHorizontal,
  RotateCcw,
  ChevronUp,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { LineEntry } from '../types';

export type WingId = 'all' | 'Blue Wing' | 'Green Wing';

export interface WingDefinition {
  id: WingId;
  name: string;
  code: 'ALL' | 'A' | 'B';
  shortName: string;
  linesRange: string;
  lineCount: number;
  blockCount: number;
  managerName?: string;
  managerCode?: string;
  badgeClass: string;
  activeClass: string;
  borderClass: string;
  dotColor: string;
}

export interface BlockDefinition {
  id: string; // 'block_1' .. 'block_6'
  blockNo: number;
  shortName: string;
  label: string;
  floorId: string; // 'padma', 'meghna', etc.
  floorName: string;
  floorNo: number;
  wing: 'Blue Wing' | 'Green Wing';
  lineCount: number;
  linesRange: string;
  lineNumbers: number[];
  lines: string[];
  inchargeName: string;
  inchargeCode: string;
  colorClass: string;
  dotColor: string;
  badgeClass: string;
}

export interface LineDefinition {
  lineNo: string;
  number: number;
  wing: 'Blue Wing' | 'Green Wing';
  blockId: string;
  blockNo: number;
  floorId: string;
  floorName: string;
  inchargeName: string;
  inchargeCode: string;
}

export const CANONICAL_WINGS: WingDefinition[] = [
  {
    id: 'all',
    name: 'All Factory Wings',
    code: 'ALL',
    shortName: 'All Wings',
    linesRange: 'Lines 01 - 34',
    lineCount: 34,
    blockCount: 6,
    badgeClass: 'bg-[#176f78]/10 text-[#176f78] border-[#176f78]/25',
    activeClass: 'bg-[#176f78] text-white shadow-xs',
    borderClass: 'border-[#176f78]',
    dotColor: 'bg-[#176f78]'
  },
  {
    id: 'Blue Wing',
    name: 'Section Wing A (Blue Wing)',
    code: 'A',
    shortName: 'Blue Wing',
    linesRange: 'Lines 01 - 17',
    lineCount: 17,
    blockCount: 3,
    managerName: 'Tanvir Ahmed',
    managerCode: 'MGR-01',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    activeClass: 'bg-blue-600 text-white shadow-xs',
    borderClass: 'border-blue-500',
    dotColor: 'bg-blue-500'
  },
  {
    id: 'Green Wing',
    name: 'Section Wing B (Green Wing)',
    code: 'B',
    shortName: 'Green Wing',
    linesRange: 'Lines 18 - 34',
    lineCount: 17,
    blockCount: 3,
    managerName: 'Mahmudul Hasan',
    managerCode: 'MGR-02',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeClass: 'bg-emerald-600 text-white shadow-xs',
    borderClass: 'border-emerald-500',
    dotColor: 'bg-emerald-500'
  }
];

export const CANONICAL_BLOCKS: BlockDefinition[] = [
  {
    id: 'block_1',
    blockNo: 1,
    shortName: 'B1 • Padma',
    label: 'Block 1 — Floor 1 (Padma)',
    floorId: 'padma',
    floorName: 'Padma Floor',
    floorNo: 1,
    wing: 'Blue Wing',
    lineCount: 6,
    linesRange: 'Lines 01 - 06',
    lineNumbers: [1, 2, 3, 4, 5, 6],
    lines: ['Line 01', 'Line 02', 'Line 03', 'Line 04', 'Line 05', 'Line 06'],
    inchargeName: 'Md. Rafiqul Islam',
    inchargeCode: 'INC-01',
    colorClass: 'text-blue-700',
    dotColor: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  {
    id: 'block_2',
    blockNo: 2,
    shortName: 'B2 • Meghna',
    label: 'Block 2 — Floor 2 (Meghna)',
    floorId: 'meghna',
    floorName: 'Meghna Floor',
    floorNo: 2,
    wing: 'Blue Wing',
    lineCount: 6,
    linesRange: 'Lines 07 - 12',
    lineNumbers: [7, 8, 9, 10, 11, 12],
    lines: ['Line 07', 'Line 08', 'Line 09', 'Line 10', 'Line 11', 'Line 12'],
    inchargeName: 'Kazi Nazmul',
    inchargeCode: 'INC-02',
    colorClass: 'text-emerald-700',
    dotColor: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  {
    id: 'block_3',
    blockNo: 3,
    shortName: 'B3 • Karnophuli',
    label: 'Block 3 — Floor 3 (Karnophuli)',
    floorId: 'karnophuli',
    floorName: 'Karnophuli Floor',
    floorNo: 3,
    wing: 'Blue Wing',
    lineCount: 5,
    linesRange: 'Lines 13 - 17',
    lineNumbers: [13, 14, 15, 16, 17],
    lines: ['Line 13', 'Line 14', 'Line 15', 'Line 16', 'Line 17'],
    inchargeName: 'Sharif Hossain',
    inchargeCode: 'INC-03',
    colorClass: 'text-amber-800',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'block_4',
    blockNo: 4,
    shortName: 'B4 • Korotoya',
    label: 'Block 4 — Floor 4 (Korotoya)',
    floorId: 'korotoya',
    floorName: 'Korotoya Floor',
    floorNo: 4,
    wing: 'Green Wing',
    lineCount: 6,
    linesRange: 'Lines 18 - 23',
    lineNumbers: [18, 19, 20, 21, 22, 23],
    lines: ['Line 18', 'Line 19', 'Line 20', 'Line 21', 'Line 22', 'Line 23'],
    inchargeName: 'Jahangir Alam',
    inchargeCode: 'INC-04',
    colorClass: 'text-purple-700',
    dotColor: 'bg-purple-600',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  {
    id: 'block_5',
    blockNo: 5,
    shortName: 'B5 • Shitalokshya',
    label: 'Block 5 — Floor 5 (Shitalokshya)',
    floorId: 'shitalokshya',
    floorName: 'Shitalokshya Floor',
    floorNo: 5,
    wing: 'Green Wing',
    lineCount: 6,
    linesRange: 'Lines 24 - 29',
    lineNumbers: [24, 25, 26, 27, 28, 29],
    lines: ['Line 24', 'Line 25', 'Line 26', 'Line 27', 'Line 28', 'Line 29'],
    inchargeName: 'Tariq Hasan',
    inchargeCode: 'INC-05',
    colorClass: 'text-teal-700',
    dotColor: 'bg-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200'
  },
  {
    id: 'block_6',
    blockNo: 6,
    shortName: 'B6 • Turag',
    label: 'Block 6 — Floor 6 (Turag)',
    floorId: 'turag',
    floorName: 'Turag Floor',
    floorNo: 6,
    wing: 'Green Wing',
    lineCount: 5,
    linesRange: 'Lines 30 - 34',
    lineNumbers: [30, 31, 32, 33, 34],
    lines: ['Line 30', 'Line 31', 'Line 32', 'Line 33', 'Line 34'],
    inchargeName: 'Mizanur Rahman',
    inchargeCode: 'INC-06',
    colorClass: 'text-rose-700',
    dotColor: 'bg-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200'
  }
];

export const CANONICAL_LINES: LineDefinition[] = Array.from({ length: 34 }, (_, i) => {
  const num = i + 1;
  const lineNo = num < 10 ? `Line 0${num}` : `Line ${num}`;
  const block = CANONICAL_BLOCKS.find(b => b.lineNumbers.includes(num)) || CANONICAL_BLOCKS[0];
  return {
    lineNo,
    number: num,
    wing: block.wing,
    blockId: block.id,
    blockNo: block.blockNo,
    floorId: block.floorId,
    floorName: block.floorName,
    inchargeName: block.inchargeName,
    inchargeCode: block.inchargeCode
  };
});

/**
 * Normalizes any line number string to 2-digit format "Line 01", "Line 18", etc.
 */
export function normalizeLineNumber(lineNo: string | number | undefined | null): string {
  if (!lineNo) return 'Line 01';
  const clean = String(lineNo).trim();
  const digits = clean.replace(/[^0-9]/g, '');
  const n = parseInt(digits, 10);
  if (isNaN(n)) return clean;
  return n < 10 ? `Line 0${n}` : `Line ${n}`;
}

/**
 * Returns metadata for any line number
 */
export function getWingBlockLineMeta(lineNo: string | number): LineDefinition {
  const norm = normalizeLineNumber(lineNo);
  const found = CANONICAL_LINES.find(l => l.lineNo === norm);
  if (found) return found;
  const num = parseInt(norm.replace(/[^0-9]/g, ''), 10) || 1;
  const block = CANONICAL_BLOCKS.find(b => b.lineNumbers.includes(num)) || CANONICAL_BLOCKS[0];
  return {
    lineNo: norm,
    number: num,
    wing: block.wing,
    blockId: block.id,
    blockNo: block.blockNo,
    floorId: block.floorId,
    floorName: block.floorName,
    inchargeName: block.inchargeName,
    inchargeCode: block.inchargeCode
  };
}

/**
 * Checks if a line matches the current Wing, Block, and Line filter criteria
 */
export function matchesWingBlockLine(
  line: LineEntry | { lineNo: string; floor?: string; wing?: string },
  criteria: {
    wing?: string;
    blockId?: string;
    floorId?: string;
    lineNo?: string;
  }
): boolean {
  const meta = getWingBlockLineMeta(line.lineNo);

  // 1. Line match
  if (criteria.lineNo && criteria.lineNo !== 'all') {
    const normReq = normalizeLineNumber(criteria.lineNo);
    if (meta.lineNo !== normReq && line.lineNo !== criteria.lineNo) {
      return false;
    }
  }

  // 2. Wing match
  if (criteria.wing && criteria.wing !== 'all') {
    const rawWing = 'wing' in line ? (line as { wing?: string }).wing : undefined;
    if (meta.wing !== criteria.wing && rawWing !== criteria.wing) {
      return false;
    }
  }

  // 3. Block match
  if (criteria.blockId && criteria.blockId !== 'all') {
    if (meta.blockId !== criteria.blockId) {
      return false;
    }
  }

  // 4. Floor match
  if (criteria.floorId && criteria.floorId !== 'all') {
    if (meta.floorId !== criteria.floorId) {
      // Also check raw string matching
      const cleanFloor = (line.floor || '').toLowerCase();
      if (!cleanFloor.includes(criteria.floorId.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

export interface WingBlockLineSelection {
  wing: WingId;
  blockId: string; // 'all' or 'block_1'..'block_6'
  floorId: string; // 'all' or 'padma'..'turag'
  floorLabel: string;
  lineNo: string; // 'all' or 'Line 01'..'Line 34'
}

export interface WingBlockLineSelectorProps {
  selectedWing?: WingId;
  onSelectWing?: (wing: WingId) => void;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string, block?: BlockDefinition) => void;
  selectedFloorId?: string;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onSelectionChange?: (selection: WingBlockLineSelection) => void;
  lines?: LineEntry[];
  variant?: 'inline' | 'compact' | 'card' | 'bar';
  density?: 'compact' | 'comfortable' | 'spacious';
  smallAreaFeaturesEnabled?: boolean;
  showLines?: boolean;
  showBlocks?: boolean;
  showWings?: boolean;
  className?: string;
  onClose?: () => void;
}

/**
 * Unified Merged (Wings, Blocks, Lines) Selector Component
 * Provides seamless 3-tier hierarchy navigation:
 * [1. Wing Segment] -> [2. Block / Floor Cards] -> [3. Line Badges]
 */
export const WingBlockLineSelector: React.FC<WingBlockLineSelectorProps> = ({
  selectedWing = 'all',
  onSelectWing,
  selectedBlockId = 'all',
  onSelectBlock,
  selectedFloorId = 'all',
  onSelectFloor,
  selectedLineNo = 'all',
  onSelectLineNo,
  onSelectionChange,
  lines = [],
  variant = 'inline',
  showLines = true,
  showBlocks = true,
  showWings = true,
  density,
  smallAreaFeaturesEnabled,
  className = '',
  onClose
}) => {
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Small Area Features: Compact density & Collapse/Expand toggle
  const [isCollapsed, setIsCollapsed] = useState<boolean>(variant === 'bar');
  const [displayDensity, setDisplayDensity] = useState<'compact' | 'full'>(() => {
    if (density === 'spacious') return 'full';
    return 'compact';
  });

  useEffect(() => {
    if (density === 'compact') {
      setDisplayDensity('compact');
    } else if (density === 'spacious') {
      setDisplayDensity('full');
    }
  }, [density]);

  // Local state synced with props
  const [localWing, setLocalWing] = useState<WingId>(selectedWing);
  const [localBlockId, setLocalBlockId] = useState<string>(() => {
    if (selectedBlockId && selectedBlockId !== 'all') return selectedBlockId;
    if (selectedFloorId && selectedFloorId !== 'all') {
      const b = CANONICAL_BLOCKS.find(b => b.floorId === selectedFloorId || b.floorName.toLowerCase().includes(selectedFloorId.toLowerCase()));
      return b ? b.id : 'all';
    }
    return 'all';
  });
  const [localLineNo, setLocalLineNo] = useState<string>(selectedLineNo);

  // Keep synced with incoming props
  useEffect(() => {
    setLocalWing(selectedWing);
  }, [selectedWing]);

  useEffect(() => {
    if (selectedBlockId) setLocalBlockId(selectedBlockId);
    else if (selectedFloorId) {
      const b = CANONICAL_BLOCKS.find(b => b.floorId === selectedFloorId || b.floorName.toLowerCase().includes(selectedFloorId.toLowerCase()));
      setLocalBlockId(b ? b.id : 'all');
    }
  }, [selectedBlockId, selectedFloorId]);

  useEffect(() => {
    setLocalLineNo(selectedLineNo);
  }, [selectedLineNo]);

  // Propagate change
  const notifyChange = (newWing: WingId, newBlockId: string, newLineNo: string) => {
    const block = CANONICAL_BLOCKS.find(b => b.id === newBlockId);
    const floorId = block ? block.floorId : 'all';
    const floorLabel = block ? block.floorName : 'All Production Floors';

    if (onSelectWing) onSelectWing(newWing);
    if (onSelectBlock) onSelectBlock(newBlockId, block);
    if (onSelectFloor) onSelectFloor(floorId, floorLabel);
    if (onSelectLineNo) onSelectLineNo(newLineNo);

    if (onSelectionChange) {
      onSelectionChange({
        wing: newWing,
        blockId: newBlockId,
        floorId,
        floorLabel,
        lineNo: newLineNo
      });
    }
  };

  // Actions
  const handleSelectWing = (wing: WingId) => {
    setLocalWing(wing);
    // If current block doesn't belong to newly selected wing, reset block
    let newBlock = localBlockId;
    if (wing !== 'all') {
      const currentBlockDef = CANONICAL_BLOCKS.find(b => b.id === localBlockId);
      if (currentBlockDef && currentBlockDef.wing !== wing) {
        newBlock = 'all';
        setLocalBlockId('all');
      }
    }
    // If current line doesn't belong to newly selected wing, reset line
    let newLine = localLineNo;
    if (wing !== 'all' && localLineNo !== 'all') {
      const lineMeta = getWingBlockLineMeta(localLineNo);
      if (lineMeta.wing !== wing) {
        newLine = 'all';
        setLocalLineNo('all');
      }
    }

    notifyChange(wing, newBlock, newLine);
  };

  const handleSelectBlock = (blockId: string) => {
    setLocalBlockId(blockId);
    let newWing = localWing;
    let newLine = localLineNo;

    if (blockId !== 'all') {
      const blockDef = CANONICAL_BLOCKS.find(b => b.id === blockId);
      if (blockDef) {
        newWing = blockDef.wing;
        setLocalWing(blockDef.wing);
        // If current line is not in this block, reset line
        if (localLineNo !== 'all' && !blockDef.lines.includes(localLineNo)) {
          newLine = 'all';
          setLocalLineNo('all');
        }
      }
    }

    notifyChange(newWing, blockId, newLine);
  };

  const handleSelectLine = (lineNo: string) => {
    setLocalLineNo(lineNo);
    let newWing = localWing;
    let newBlock = localBlockId;

    if (lineNo !== 'all') {
      const meta = getWingBlockLineMeta(lineNo);
      newWing = meta.wing;
      newBlock = meta.blockId;
      setLocalWing(meta.wing);
      setLocalBlockId(meta.blockId);
    }

    notifyChange(newWing, newBlock, lineNo);
  };

  const handleResetAll = () => {
    setLocalWing('all');
    setLocalBlockId('all');
    setLocalLineNo('all');
    setSearchQuery('');
    notifyChange('all', 'all', 'all');
  };

  // Filtered blocks based on selected wing
  const visibleBlocks = useMemo(() => {
    return CANONICAL_BLOCKS.filter(b => {
      if (localWing === 'all') return true;
      return b.wing === localWing;
    });
  }, [localWing]);

  // Filtered lines based on selected wing, block, and search query
  const visibleLines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return CANONICAL_LINES.filter(l => {
      // 1. Search Query
      if (q) {
        const matchesNo = l.lineNo.toLowerCase().includes(q) || String(l.number).includes(q);
        const matchesFloor = l.floorName.toLowerCase().includes(q);
        const matchesWing = l.wing.toLowerCase().includes(q);
        const matchesIncharge = l.inchargeName.toLowerCase().includes(q);
        return matchesNo || matchesFloor || matchesWing || matchesIncharge;
      }

      // 2. Wing Filter
      if (localWing !== 'all' && l.wing !== localWing) {
        return false;
      }

      // 3. Block Filter
      if (localBlockId !== 'all' && l.blockId !== localBlockId) {
        return false;
      }

      return true;
    });
  }, [localWing, localBlockId, searchQuery]);

  // Map live line metrics if provided
  const lineMetricsMap = useMemo(() => {
    const map = new Map<string, { efficiency: number; hasBottleneck: boolean; isCritical: boolean; status: string }>();
    lines.forEach(l => {
      const norm = normalizeLineNumber(l.lineNo);
      const hasBottleneck = Boolean(l.bottleneck && l.bottleneck.station && l.bottleneck.station !== 'No Bottleneck Reported');
      const isCritical = Boolean(hasBottleneck && (l.bottleneck?.status === 'critical' || l.bottleneck?.status === 'high'));
      map.set(norm, {
        efficiency: l.efficiency || 0,
        hasBottleneck,
        isCritical,
        status: l.status || (l.isActive === false ? 'Stopped' : 'Active')
      });
    });
    return map;
  }, [lines]);

  // Current active summary label
  const activeSelectionLabel = useMemo(() => {
    if (localLineNo !== 'all') {
      const meta = getWingBlockLineMeta(localLineNo);
      return `${meta.wing} • ${meta.floorName} • ${meta.lineNo}`;
    }
    if (localBlockId !== 'all') {
      const b = CANONICAL_BLOCKS.find(b => b.id === localBlockId);
      return b ? `${b.wing} • ${b.label}` : 'Filtered Block';
    }
    if (localWing !== 'all') {
      return `${localWing} (17 Lines)`;
    }
    return 'All Wings • All 6 Blocks • 34 Lines';
  }, [localWing, localBlockId, localLineNo]);

  const isFiltered = localWing !== 'all' || localBlockId !== 'all' || localLineNo !== 'all' || searchQuery !== '';

  return (
    <div
      className={`bg-white rounded-2xl border border-[#d9d2c2] shadow-xs select-none transition-all ${className}`}
      id="unified-wing-block-line-selector"
    >
      {/* SECTION 1: HEADER & WING SELECTOR */}
      {showWings && (
        <div
          className={`border-b border-[#ece7dc] bg-[#faf8f4] transition-all ${
            isCollapsed
              ? 'rounded-2xl border-b-0 p-2 sm:p-2.5'
              : displayDensity === 'compact'
              ? 'rounded-t-2xl p-2 sm:p-2.5'
              : 'rounded-t-2xl p-3 sm:p-4'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Left: Facility Brand & Active Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#176f78]/10 text-[#176f78] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#176f78]/20 transition-colors"
                title={isCollapsed ? 'Click to expand selector' : 'Click to minimize to small area'}
              >
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs sm:text-sm font-extrabold text-[#17343a] font-display uppercase tracking-tight">
                    Plant Scope
                  </span>
                  {/* Active selection chip badge */}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#176f78]/15 text-[#176f78] font-bold border border-[#176f78]/25 truncate max-w-[280px]">
                    {activeSelectionLabel}
                  </span>
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={handleResetAll}
                      className="text-[10px] text-[#176f78] hover:underline font-bold cursor-pointer flex items-center gap-0.5 ml-0.5"
                      title="Reset all filters to full facility"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                {!isCollapsed && displayDensity === 'full' && (
                  <div className="text-[11px] text-[#527078] flex items-center gap-1.5 mt-0.5 truncate">
                    <span>Wings • Blocks • Lines 3-Tier Hierarchy</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Wing Segment Tabs + Compact/Density Controls */}
            <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto shrink-0">
              {/* Wing Segment Tabs */}
              <div className="flex items-center bg-[#f1eee6] p-0.5 rounded-xl border border-[#d9d2c2] gap-0.5">
                {CANONICAL_WINGS.map(w => {
                  const isSelected = localWing === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => handleSelectWing(w.id)}
                      className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95 ${
                        isSelected
                          ? w.activeClass
                          : 'text-slate-600 hover:text-[#17343a] hover:bg-white/60'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${w.dotColor}`} />
                      <span>{w.shortName}</span>
                      <span
                        className={`text-[9px] font-mono px-1 rounded ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {w.lineCount}L
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Density Toggle (Small Area Mode vs Full Grid) */}
              <button
                type="button"
                onClick={() => setDisplayDensity(d => d === 'compact' ? 'full' : 'compact')}
                className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  displayDensity === 'compact'
                    ? 'bg-[#176f78]/10 text-[#176f78] border-[#176f78]/30 hover:bg-[#176f78]/20'
                    : 'bg-white text-slate-600 border-[#d9d2c2] hover:bg-[#faf8f4]'
                }`}
                title={displayDensity === 'compact' ? 'Switch to Full Grid mode' : 'Switch to Small Area / Compact view'}
              >
                <SlidersHorizontal className="w-3 h-3 text-[#176f78]" />
                <span>{displayDensity === 'compact' ? 'Dense' : 'Grid'}</span>
              </button>

              {/* Master Collapse / Expand Button for Small Area Footprint */}
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer touch-manipulation active:scale-95 ${
                  isCollapsed
                    ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                    : 'bg-white hover:bg-[#faf8f4] text-[#17343a] border-[#d9d2c2]'
                }`}
                title={isCollapsed ? 'Expand all selector controls' : 'Collapse into small area single-line bar'}
              >
                {isCollapsed ? (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    <span>Expand</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3 h-3 text-[#176f78]" />
                    <span className="hidden sm:inline">Mini Bar</span>
                    <ChevronUp className="w-3.5 h-3.5 text-[#176f78]" />
                  </>
                )}
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#ece7dc] transition-colors cursor-pointer"
                  title="Close selector"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: BLOCKS (FLOORS) ROW */}
      {showBlocks && (
        <div
          className={`${
            isCollapsed
              ? 'hidden'
              : displayDensity === 'compact'
              ? 'p-2 sm:p-2.5 border-b border-[#ece7dc] bg-[#fbfaf6]'
              : 'p-3 sm:p-3.5 border-b border-[#ece7dc] bg-[#fbfaf6]'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase text-[#527078] tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#176f78]" />
              <span>Production Blocks (Floors)</span>
              <span className="text-[9.5px] font-normal text-slate-400 font-mono">({visibleBlocks.length} available)</span>
            </span>

            {/* Quick block reset button */}
            {localBlockId !== 'all' && (
              <button
                type="button"
                onClick={() => handleSelectBlock('all')}
                className="text-[10.5px] text-[#176f78] hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <span>Show All Blocks</span>
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {displayDensity === 'compact' ? (
            /* Small Area Footprint: Horizontal compact chips */
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 max-w-full scrollbar-thin">
              {/* All Blocks Chip */}
              <button
                type="button"
                onClick={() => handleSelectBlock('all')}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border touch-manipulation active:scale-95 ${
                  localBlockId === 'all'
                    ? 'bg-[#176f78] text-white border-[#176f78] shadow-2xs'
                    : 'bg-white text-[#17343a] hover:bg-[#faf8f4] border-[#d9d2c2]'
                }`}
              >
                <span>All Blocks</span>
                <span className={`text-[9px] font-mono px-1 rounded ${localBlockId === 'all' ? 'bg-white/20 text-white' : 'bg-[#f1eee6] text-slate-600'}`}>
                  {localWing === 'all' ? '6B' : '3B'}
                </span>
              </button>

              {/* Individual Block Chips */}
              {visibleBlocks.map(block => {
                const isSelected = localBlockId === block.id;
                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => handleSelectBlock(block.id)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border touch-manipulation active:scale-95 ${
                      isSelected
                        ? 'bg-[#176f78] text-white border-[#176f78] shadow-2xs ring-1 ring-[#176f78]'
                        : 'bg-white text-[#17343a] hover:bg-[#faf8f4] border-[#d9d2c2]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${block.dotColor}`} />
                    <span>B{block.blockNo}</span>
                    <span className="opacity-75 font-normal">({block.floorName.replace(' Floor', '')})</span>
                    <span
                      className={`text-[9px] font-mono px-1 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {block.lineCount}L
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Full Grid Mode */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* Master All Blocks Card */}
              <button
                type="button"
                onClick={() => handleSelectBlock('all')}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group touch-manipulation active:scale-[0.98] ${
                  localBlockId === 'all'
                    ? 'bg-[#176f78]/10 border-[#176f78] shadow-2xs'
                    : 'bg-white hover:bg-[#faf8f4] border-[#d9d2c2]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#527078]">
                    All Blocks
                  </span>
                  {localBlockId === 'all' ? (
                    <Check className="w-3.5 h-3.5 text-[#176f78] stroke-[2.5]" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-[#176f78]" />
                  )}
                </div>
                <div className="font-bold text-xs text-[#17343a] mt-1 truncate">
                  Full Facility
                </div>
                <div className="text-[10px] text-[#527078] font-mono mt-0.5">
                  {localWing === 'all' ? '6 Blocks • 34L' : '3 Blocks • 17L'}
                </div>
              </button>

              {/* Individual Block Cards */}
              {visibleBlocks.map(block => {
                const isSelected = localBlockId === block.id;

                return (
                  <button
                    key={block.id}
                    type="button"
                    onClick={() => handleSelectBlock(block.id)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between group touch-manipulation active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#176f78]/10 border-[#176f78] shadow-2xs ring-1 ring-[#176f78]'
                        : 'bg-white hover:bg-[#faf8f4] border-[#d9d2c2]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold uppercase text-[#527078] flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${block.dotColor}`} />
                        <span>B{block.blockNo}</span>
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#176f78] stroke-[2.5]" />
                      ) : (
                        <span className="text-[9.5px] font-mono px-1 rounded bg-[#f1eee6] text-slate-600 font-bold">
                          {block.lineCount}L
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-[#17343a] mt-1 truncate">
                      {block.floorName.replace(' Floor', '')}
                    </div>
                    <div className="text-[10px] text-[#527078] font-mono mt-0.5 truncate">
                      {block.linesRange}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: LINES ROW & QUICK JUMP */}
      {showLines && (
        <div
          className={`${
            isCollapsed
              ? 'hidden'
              : displayDensity === 'compact'
              ? 'p-2 sm:p-2.5'
              : 'p-3 sm:p-3.5'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-extrabold uppercase text-[#527078] tracking-wider flex items-center gap-1">
                <Compass className="w-3 h-3 text-[#176f78]" />
                <span>Sewing Lines</span>
                <span className="text-[9.5px] font-normal text-slate-400 font-mono">
                  ({visibleLines.length} of 34)
                </span>
              </span>

              {localLineNo !== 'all' && (
                <span className="px-1.5 py-0.2 rounded-md bg-[#176f78] text-white text-[10px] font-bold font-mono shadow-2xs">
                  Active: {localLineNo}
                </span>
              )}
            </div>

            {/* Quick Search Input */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search line #, floor..."
                className="w-full bg-[#faf8f4] hover:bg-white focus:bg-white border border-[#d9d2c2] focus:border-[#176f78] rounded-lg pl-7 pr-6 py-0.5 text-xs text-[#17343a] focus:outline-hidden transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Line Selector Pills Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full snap-x snap-mandatory scrollbar-thin">
            {/* Master All Lines Pill */}
            <button
              type="button"
              onClick={() => handleSelectLine('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95 ${
                localLineNo === 'all'
                  ? 'bg-[#17343a] text-white shadow-xs'
                  : 'bg-[#f1eee6] text-[#527078] hover:bg-[#e7e1d5] border border-[#d9d2c2]'
              }`}
            >
              <span>All Lines</span>
              <span className="text-[9px] font-mono px-1 rounded bg-white/20 text-current">
                {visibleLines.length}
              </span>
            </button>

            {/* Line Pills */}
            {visibleLines.map(line => {
              const isSelected = localLineNo === line.lineNo;
              const metrics = lineMetricsMap.get(line.lineNo);

              return (
                <button
                  key={line.lineNo}
                  type="button"
                  onClick={() => handleSelectLine(line.lineNo)}
                  className={`px-2 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 touch-manipulation active:scale-95 border ${
                    isSelected
                      ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                      : metrics?.isCritical
                      ? 'bg-rose-50/90 text-rose-900 border-rose-300 hover:bg-rose-100'
                      : 'bg-white text-[#17343a] hover:bg-[#faf8f4] border-[#d9d2c2]'
                  }`}
                  title={`${line.lineNo} • ${line.floorName} (${line.wing})\nIncharge: ${line.inchargeName}`}
                >
                  {/* Status dot or bottleneck flag */}
                  {metrics?.isCritical ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
                  ) : metrics?.hasBottleneck ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        line.wing === 'Blue Wing' ? 'bg-blue-500' : 'bg-emerald-500'
                      }`}
                    />
                  )}

                  <span>Line {String(line.number).padStart(2, '0')}</span>

                  {/* Efficiency badge if available */}
                  {metrics && metrics.efficiency > 0 && (
                    <span
                      className={`text-[8.5px] font-mono px-1 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : metrics.efficiency >= 60
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {Math.round(metrics.efficiency)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: FOOTER STATUS & BREADCRUMB */}
      <div
        className={`${
          isCollapsed
            ? 'hidden'
            : 'px-3 sm:px-4 py-1.5 sm:py-2 bg-[#faf8f4] border-t border-[#ece7dc] rounded-b-2xl flex items-center justify-between text-xs'
        }`}
      >
        <div className="flex items-center gap-2 text-[#527078] text-[11px] truncate">
          <span className="font-semibold text-[#17343a]">Scope:</span>
          <span className="truncate">{activeSelectionLabel}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Collapse to Mini Bar button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-[11px] font-bold text-[#527078] hover:text-[#176f78] cursor-pointer flex items-center gap-1 transition-colors"
            title="Collapse into small area bar"
          >
            <Minimize2 className="w-2.5 h-2.5" />
            <span>Mini Bar</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-bold text-[#176f78] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Reset (34L)</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-2 py-0.5 rounded-lg bg-[#17343a] text-white text-[11px] font-bold cursor-pointer hover:bg-[#1f434b] transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface WingBlockLineDropdownProps {
  selectedWing?: WingId;
  onSelectWing?: (wing: WingId) => void;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string, block?: BlockDefinition) => void;
  selectedFloorId?: string;
  onSelectFloor?: (floorId: string, floorLabel: string) => void;
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onSelectionChange?: (selection: WingBlockLineSelection) => void;
  lines?: LineEntry[];
  variant?: 'header' | 'filter' | 'button';
  className?: string;
}

/**
 * Dropdown & Mobile Bottom Sheet Trigger for the Merged (Wings, Blocks, Lines) Selector
 */
export const WingBlockLineDropdown: React.FC<WingBlockLineDropdownProps> = ({
  selectedWing = 'all',
  onSelectWing,
  selectedBlockId = 'all',
  onSelectBlock,
  selectedFloorId = 'all',
  onSelectFloor,
  selectedLineNo = 'all',
  onSelectLineNo,
  onSelectionChange,
  lines = [],
  variant = 'header',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute label for trigger button
  const triggerLabel = useMemo(() => {
    if (selectedLineNo && selectedLineNo !== 'all') {
      const meta = getWingBlockLineMeta(selectedLineNo);
      return `${meta.lineNo} (${meta.floorName.replace(' Floor', '')})`;
    }
    if (selectedBlockId && selectedBlockId !== 'all') {
      const b = CANONICAL_BLOCKS.find(b => b.id === selectedBlockId);
      return b ? b.shortName : 'Filtered Block';
    }
    if (selectedFloorId && selectedFloorId !== 'all') {
      const b = CANONICAL_BLOCKS.find(b => b.floorId === selectedFloorId || b.floorName.toLowerCase().includes(selectedFloorId.toLowerCase()));
      return b ? b.shortName : selectedFloorId;
    }
    if (selectedWing && selectedWing !== 'all') {
      return selectedWing;
    }
    return 'All Wings • Lines 01-34';
  }, [selectedWing, selectedBlockId, selectedFloorId, selectedLineNo]);

  const isFiltered = (selectedWing && selectedWing !== 'all') ||
    (selectedBlockId && selectedBlockId !== 'all') ||
    (selectedFloorId && selectedFloorId !== 'all') ||
    (selectedLineNo && selectedLineNo !== 'all');

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Header Pill Variant */}
      {variant === 'header' && (
        <button
          type="button"
          id="header-scope-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title={`Active Scope: ${triggerLabel}`}
          className={`h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0 ${
            isFiltered
              ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
              : 'bg-white hover:bg-[#f1eee6] border-[#d9d2c2] text-[#17343a]'
          }`}
        >
          <Building2 className={`w-4 h-4 shrink-0 ${isFiltered ? 'text-white' : 'text-[#176f78]'}`} />
          <span className="max-w-[130px] sm:max-w-[180px] md:max-w-[220px] truncate">
            {triggerLabel}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            } ${isFiltered ? 'text-white/80' : 'text-[#527078]'}`}
          />
        </button>
      )}

      {/* Filter Pill Variant */}
      {variant === 'filter' && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-open-scope-selector"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs touch-manipulation active:scale-95 ${
              isFiltered
                ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                : 'bg-[#f1eee6] hover:bg-[#e7e1d5] border-[#d9d2c2] text-[#17343a]'
            }`}
            title="Filter by Wing, Block, or Line"
          >
            <Layers className={`w-3.5 h-3.5 shrink-0 ${isFiltered ? 'text-white' : 'text-[#176f78]'}`} />
            <span className="max-w-[140px] sm:max-w-none truncate">
              {triggerLabel}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              } ${isFiltered ? 'text-white/80' : 'text-[#527078]'}`}
            />
          </button>

          {isFiltered && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectWing) onSelectWing('all');
                if (onSelectBlock) onSelectBlock('all');
                if (onSelectFloor) onSelectFloor('all', 'All Production Floors');
                if (onSelectLineNo) onSelectLineNo('all');
                if (onSelectionChange) {
                  onSelectionChange({
                    wing: 'all',
                    blockId: 'all',
                    floorId: 'all',
                    floorLabel: 'All Production Floors',
                    lineNo: 'all'
                  });
                }
              }}
              className="p-1.5 rounded-xl bg-white hover:bg-rose-50 border border-[#d9d2c2] hover:border-rose-200 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs touch-manipulation active:scale-95"
              title="Reset all filters to full plant"
              aria-label="Reset scope filters"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Button Variant */}
      {variant === 'button' && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#d9d2c2] hover:bg-slate-50 text-xs font-bold text-[#17343a] transition-all cursor-pointer shadow-2xs touch-manipulation active:scale-95"
        >
          <Building2 className="w-4 h-4 text-[#176f78]" />
          <span>{triggerLabel}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Responsive Overlay Popover / Mobile Bottom Sheet */}
      {isOpen && (
        <>
          {/* Backdrop on Mobile */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet (Mobile) / Popover (Desktop) */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-[620px] max-w-full animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <WingBlockLineSelector
              selectedWing={selectedWing}
              onSelectWing={onSelectWing}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
              selectedFloorId={selectedFloorId}
              onSelectFloor={onSelectFloor}
              selectedLineNo={selectedLineNo}
              onSelectLineNo={onSelectLineNo}
              onSelectionChange={onSelectionChange}
              lines={lines}
              variant="card"
              className="max-h-[85vh] sm:max-h-[600px] overflow-y-auto scrollbar-thin shadow-2xl"
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};
