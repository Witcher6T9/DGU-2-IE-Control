/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Layers,
  ChevronDown,
  Check,
  X,
  Building2,
  Factory,
  Compass,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { LineEntry } from '../types';
import {
  WingBlockLineSelector,
  WingBlockLineDropdown,
  CANONICAL_WINGS,
  CANONICAL_BLOCKS,
  CANONICAL_LINES,
  normalizeLineNumber,
  getWingBlockLineMeta,
  matchesWingBlockLine,
  WingId,
  BlockDefinition,
  LineDefinition,
  WingBlockLineSelection
} from './WingBlockLineSelector';

export * from './WingBlockLineSelector';

export interface ProductionFloorOption {
  id: string;
  label: string;
  shortName: string;
  floorNo?: number;
  linesRange: string;
  lineCount: number;
  wing: 'All Wings' | 'Blue Wing' | 'Green Wing';
  colorClass: string;
  dotColor: string;
  badgeClass: string;
  matchPatterns: string[];
}

export const PRODUCTION_FLOOR_OPTIONS: ProductionFloorOption[] = [
  {
    id: 'all',
    label: 'All Production Floors',
    shortName: 'All Floors',
    linesRange: 'Lines 01 - 34',
    lineCount: 34,
    wing: 'All Wings',
    colorClass: 'text-[#176f78]',
    dotColor: 'bg-[#176f78]',
    badgeClass: 'bg-[#176f78]/10 text-[#176f78] border-[#176f78]/25',
    matchPatterns: ['all', 'all floors', 'all production floors']
  },
  {
    id: 'padma',
    label: 'Padma Floor',
    shortName: 'Padma',
    floorNo: 1,
    linesRange: 'Lines 01 - 06',
    lineCount: 6,
    wing: 'Blue Wing',
    colorClass: 'text-blue-700',
    dotColor: 'bg-blue-600',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    matchPatterns: ['padma', 'padma floor', 'floor 1', 'floor 01', 'unit 2 - padma']
  },
  {
    id: 'meghna',
    label: 'Meghna Floor',
    shortName: 'Meghna',
    floorNo: 2,
    linesRange: 'Lines 07 - 12',
    lineCount: 6,
    wing: 'Blue Wing',
    colorClass: 'text-emerald-700',
    dotColor: 'bg-emerald-600',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    matchPatterns: ['meghna', 'meghna floor', 'floor 2', 'floor 02', 'unit 2 - meghna']
  },
  {
    id: 'karnophuli',
    label: 'Karnophuli Floor',
    shortName: 'Karnophuli',
    floorNo: 3,
    linesRange: 'Lines 13 - 17',
    lineCount: 5,
    wing: 'Blue Wing',
    colorClass: 'text-amber-800',
    dotColor: 'bg-amber-500',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    matchPatterns: ['karnophuli', 'karnophuli floor', 'floor 3', 'floor 03', 'unit 2 - karnophuli']
  },
  {
    id: 'korotoya',
    label: 'Korotoya Floor',
    shortName: 'Korotoya',
    floorNo: 4,
    linesRange: 'Lines 18 - 23',
    lineCount: 6,
    wing: 'Green Wing',
    colorClass: 'text-purple-700',
    dotColor: 'bg-purple-600',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    matchPatterns: ['korotoya', 'korotoya floor', 'floor 4', 'floor 04', 'unit 2 - korotoya']
  },
  {
    id: 'shitalokshya',
    label: 'Shitalokshya Floor',
    shortName: 'Shitalokshya',
    floorNo: 5,
    linesRange: 'Lines 24 - 29',
    lineCount: 6,
    wing: 'Green Wing',
    colorClass: 'text-teal-700',
    dotColor: 'bg-teal-600',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
    matchPatterns: ['shitalokshya', 'shitalokshya floor', 'floor 5', 'floor 05', 'unit 2 - shitalokshya']
  },
  {
    id: 'turag',
    label: 'Turag Floor',
    shortName: 'Turag',
    floorNo: 6,
    linesRange: 'Lines 30 - 34',
    lineCount: 5,
    wing: 'Green Wing',
    colorClass: 'text-rose-700',
    dotColor: 'bg-rose-600',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    matchPatterns: ['turag', 'turag floor', 'floor 6', 'floor 06', 'unit 2 - turag']
  }
];

/**
 * Returns true if the line's floor string matches the selected floor option id
 */
export function matchesProductionFloor(lineFloor: string | undefined | null, selectedFloorId: string): boolean {
  if (!selectedFloorId || selectedFloorId === 'all') return true;
  if (!lineFloor) return false;

  const cleanFloor = lineFloor.trim().toLowerCase();
  const option = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === selectedFloorId);
  if (!option) {
    return cleanFloor.includes(selectedFloorId.toLowerCase());
  }

  return option.matchPatterns.some(pattern => cleanFloor.includes(pattern));
}

/**
 * Normalizes any floor string or id into its official label
 */
export function getProductionFloorLabel(floorIdOrName: string | undefined | null): string {
  if (!floorIdOrName || floorIdOrName === 'all') return 'All Production Floors';

  const clean = floorIdOrName.trim().toLowerCase();
  const exactOption = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === clean || f.label.toLowerCase() === clean);
  if (exactOption) return exactOption.label;

  const patternMatch = PRODUCTION_FLOOR_OPTIONS.find(f =>
    f.matchPatterns.some(p => clean.includes(p))
  );
  return patternMatch ? patternMatch.label : floorIdOrName;
}

/**
 * Maps any floor string or label to its option id ('all', 'padma', 'meghna', etc.)
 */
export function getProductionFloorId(floorIdOrName: string | undefined | null): string {
  if (!floorIdOrName || floorIdOrName === 'all') return 'all';

  const clean = floorIdOrName.trim().toLowerCase();
  const exactOption = PRODUCTION_FLOOR_OPTIONS.find(f => f.id === clean || f.label.toLowerCase() === clean);
  if (exactOption) return exactOption.id;

  const patternMatch = PRODUCTION_FLOOR_OPTIONS.find(f =>
    f.matchPatterns.some(p => clean.includes(p))
  );
  return patternMatch ? patternMatch.id : 'all';
}

export interface ProductionFloorCardProps {
  selectedFloor: string; // floor id ('all', 'padma', etc.) or label
  onSelectFloor: (floorId: string, floorLabel: string) => void;
  className?: string;
  showHeader?: boolean;
  onClose?: () => void;
  lines?: LineEntry[];
}

/**
 * Merged (Wings, Blocks, Lines) Production Floor Card:
 * Replaces the old unmerged floor-only card with the unified 3-tier hierarchy selector.
 */
export const ProductionFloorCard: React.FC<ProductionFloorCardProps> = ({
  selectedFloor,
  onSelectFloor,
  className = '',
  onClose,
  lines = []
}) => {
  return (
    <WingBlockLineSelector
      selectedFloorId={selectedFloor}
      onSelectFloor={(id, label) => onSelectFloor(id, label)}
      lines={lines}
      variant="card"
      className={className}
      onClose={onClose}
    />
  );
};

interface ProductionFloorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFloor: string;
  onSelectFloor: (floorId: string, floorLabel: string) => void;
  lines?: LineEntry[];
}

export const ProductionFloorModal: React.FC<ProductionFloorModalProps> = ({
  isOpen,
  onClose,
  selectedFloor,
  onSelectFloor,
  lines = []
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-full sm:max-w-xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        <WingBlockLineSelector
          selectedFloorId={selectedFloor}
          onSelectFloor={(id, label) => {
            onSelectFloor(id, label);
            onClose();
          }}
          lines={lines}
          variant="card"
          onClose={onClose}
        />
      </div>
    </div>
  );
};

export interface ProductionFloorDropdownProps {
  selectedFloor: string;
  onSelectFloor: (floorId: string, floorLabel: string) => void;
  selectedWing?: WingId;
  onSelectWing?: (wing: WingId) => void;
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string, block?: BlockDefinition) => void;
  selectedLineNo?: string;
  onSelectLineNo?: (lineNo: string) => void;
  onSelectionChange?: (selection: WingBlockLineSelection) => void;
  lines?: LineEntry[];
  variant?: 'header' | 'filter' | 'button';
  className?: string;
}

/**
 * Dropdown trigger button that pops open the unified (Wings, Blocks, Lines) Selector
 * - On Mobile (< sm): Slides up as an ergonomic native Bottom Sheet with backdrop
 * - On Tablet/Desktop (>= sm): Appears as an anchored popover dropdown
 */
export const ProductionFloorDropdown: React.FC<ProductionFloorDropdownProps> = ({
  selectedFloor,
  onSelectFloor,
  selectedWing = 'all',
  onSelectWing,
  selectedBlockId = 'all',
  onSelectBlock,
  selectedLineNo = 'all',
  onSelectLineNo,
  onSelectionChange,
  lines = [],
  variant = 'header',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel = getProductionFloorLabel(selectedFloor);
  const currentId = getProductionFloorId(selectedFloor);
  const selectedOption = PRODUCTION_FLOOR_OPTIONS.find(o => o.id === currentId) || PRODUCTION_FLOOR_OPTIONS[0];

  // Dynamic Trigger label reflecting active scope
  const displayLabel = (() => {
    if (selectedLineNo && selectedLineNo !== 'all') {
      const meta = getWingBlockLineMeta(selectedLineNo);
      return `${meta.lineNo} • ${meta.floorName.replace(' Floor', '')}`;
    }
    if (selectedBlockId && selectedBlockId !== 'all') {
      const b = CANONICAL_BLOCKS.find(b => b.id === selectedBlockId);
      if (b) return b.shortName;
    }
    if (currentId !== 'all') {
      return variant === 'header' ? selectedOption.shortName : currentLabel;
    }
    if (selectedWing && selectedWing !== 'all') {
      return selectedWing;
    }
    return variant === 'header' ? 'All Floors' : 'All Production Floors';
  })();

  const isScopeActive = currentId !== 'all' || (selectedWing && selectedWing !== 'all') || (selectedBlockId && selectedBlockId !== 'all') || (selectedLineNo && selectedLineNo !== 'all');

  // Close on outside click on desktop
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

  // Close on ESC key
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
          id="header-floor-selector-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          title={`Active Scope: ${displayLabel}`}
          className={`h-8.5 sm:h-9 px-2.5 sm:px-3 rounded-xl border flex items-center gap-1.5 sm:gap-2 transition-all text-xs font-bold cursor-pointer shadow-2xs touch-manipulation active:scale-95 shrink-0 ${
            isScopeActive
              ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
              : 'bg-white hover:bg-[#f1eee6] border-[#d9d2c2] text-[#17343a]'
          }`}
        >
          <Building2 className={`w-4 h-4 shrink-0 ${isScopeActive ? 'text-white' : 'text-[#176f78]'}`} />
          <span className="max-w-[120px] sm:max-w-[160px] md:max-w-[200px] truncate">
            {displayLabel}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
              isOpen ? 'rotate-180' : ''
            } ${isScopeActive ? 'text-white/80' : 'text-[#527078]'}`}
          />
        </button>
      )}

      {/* Filter Pill Variant (Line Data Page / Reports) */}
      {variant === 'filter' && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            id="btn-open-floor-selector"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs touch-manipulation active:scale-95 ${
              isScopeActive
                ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs'
                : 'bg-[#f1eee6] hover:bg-[#e7e1d5] border-[#d9d2c2] text-[#17343a]'
            }`}
            title="Filter lines by Wing, Block, or Line"
          >
            <Building2 className={`w-3.5 h-3.5 shrink-0 ${isScopeActive ? 'text-white' : 'text-[#176f78]'}`} />
            <span className="max-w-[130px] sm:max-w-none truncate">
              {displayLabel}
            </span>
            <span
              className={`text-[9.5px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                isScopeActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[#176f78]/10 text-[#176f78]'
              }`}
            >
              {currentId !== 'all' ? `${selectedOption.lineCount}L` : '34L'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              } ${isScopeActive ? 'text-white/80' : 'text-[#527078]'}`}
            />
          </button>

          {/* Quick Clear Reset Button when a scope is active */}
          {isScopeActive && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectFloor('all', 'All Production Floors');
                if (onSelectWing) onSelectWing('all');
                if (onSelectBlock) onSelectBlock('all');
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
              title="Clear filter (Show all 34 lines)"
              aria-label="Clear filter"
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
          <span>{displayLabel}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#527078] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Responsive Overlay Popover / Mobile Bottom Sheet with Merged WingBlockLineSelector */}
      {isOpen && (
        <>
          {/* Backdrop on Mobile */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs sm:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet (Mobile) / Popover (Desktop) */}
          <div className="fixed inset-x-0 bottom-0 z-50 sm:absolute sm:inset-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-full sm:w-[580px] max-w-full animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <WingBlockLineSelector
              selectedWing={selectedWing}
              onSelectWing={onSelectWing}
              selectedBlockId={selectedBlockId}
              onSelectBlock={onSelectBlock}
              selectedFloorId={selectedFloor}
              onSelectFloor={(id, label) => {
                onSelectFloor(id, label);
              }}
              selectedLineNo={selectedLineNo}
              onSelectLineNo={(lNo) => {
                if (onSelectLineNo) onSelectLineNo(lNo);
              }}
              onSelectionChange={(sel) => {
                onSelectFloor(sel.floorId, sel.floorLabel);
                if (onSelectWing) onSelectWing(sel.wing);
                if (onSelectBlock) onSelectBlock(sel.blockId);
                if (onSelectLineNo) onSelectLineNo(sel.lineNo);
                if (onSelectionChange) onSelectionChange(sel);
                if (sel.lineNo !== 'all' || sel.blockId !== 'all') {
                  setIsOpen(false);
                }
              }}
              lines={lines}
              variant="card"
              className="max-h-[85vh] sm:max-h-[620px] overflow-y-auto scrollbar-thin shadow-2xl"
              onClose={() => setIsOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
};
