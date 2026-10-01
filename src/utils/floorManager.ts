/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Plant Floor Topology & Customization Manager
 * Handles floor configurations, metadata, renaming, line reassignment, and persistence
 */

import { LineEntry } from '../types';

export interface CustomFloor {
  id: string;
  name: string; // e.g. "Padma", "Meghna", "Floor 01", "Level 2"
  building?: string; // e.g. "Main Complex Unit-02", "Building A"
  floorCode?: string; // e.g. "FL-01"
  targetEfficiency?: number; // e.g. 70 (%)
  standardWorkingHours?: number; // e.g. 8.0
  floorManager?: string; // e.g. "Engr. Mahmudul Hasan"
  color?: string; // hex or tailwind accent
  notes?: string;
  order?: number;
  createdAt?: string;
}

export const STORAGE_KEY_CUSTOM_FLOORS = 'ie_custom_floors_config_v1';

export const DEFAULT_PLANT_FLOORS: CustomFloor[] = [
  {
    id: 'floor-padma',
    name: 'Padma',
    building: 'Building A (South Wing)',
    floorCode: 'FL-PADMA',
    targetEfficiency: 70,
    standardWorkingHours: 8,
    floorManager: 'Engr. Mahmudul Hasan',
    color: '#176f78',
    notes: 'Outerwear & Padded Jacket Assembly lines (L01 - L06)',
    order: 1
  },
  {
    id: 'floor-meghna',
    name: 'Meghna',
    building: 'Building A (North Wing)',
    floorCode: 'FL-MEGHNA',
    targetEfficiency: 72,
    standardWorkingHours: 8,
    floorManager: 'Engr. Tanvir Ahmed',
    color: '#0284c7',
    notes: 'Technical Windbreaker & Seam-Seal lines (L07 - L12)',
    order: 2
  },
  {
    id: 'floor-karnophuli',
    name: 'Karnophuli',
    building: 'Building B (East Wing)',
    floorCode: 'FL-KARNO',
    targetEfficiency: 68,
    standardWorkingHours: 8,
    floorManager: 'Engr. Shariful Islam',
    color: '#059669',
    notes: 'Heavy Winter Coat & Down-Filling lines (L13 - L17)',
    order: 3
  },
  {
    id: 'floor-korotoya',
    name: 'Korotoya',
    building: 'Building B (West Wing)',
    floorCode: 'FL-KORO',
    targetEfficiency: 68,
    standardWorkingHours: 8,
    floorManager: 'Engr. Nazmul Huda',
    color: '#7c3aed',
    notes: 'Casual Outerwear & Hooded Jackets (L18 - L23)',
    order: 4
  },
  {
    id: 'floor-shitalokshya',
    name: 'Shitalokshya',
    building: 'Building C (Annex Module)',
    floorCode: 'FL-SHITA',
    targetEfficiency: 65,
    standardWorkingHours: 8,
    floorManager: 'Engr. Kamrul Islam',
    color: '#d97706',
    notes: 'Multi-Pocket Utility Vests & Parkas (L24 - L29)',
    order: 5
  },
  {
    id: 'floor-turag',
    name: 'Turag',
    building: 'Building C (Pilot & Heavy)',
    floorCode: 'FL-TURAG',
    targetEfficiency: 65,
    standardWorkingHours: 8,
    floorManager: 'Engr. Ahsan Habib',
    color: '#e11d48',
    notes: 'Pilot Runs, Quick Sample Loading & Critical Styles (L30 - L34)',
    order: 6
  }
];

export const FLOOR_COLOR_PALETTES = [
  { name: 'Teal Deep', value: '#176f78', border: 'border-teal-500', bg: 'bg-teal-50 text-teal-800' },
  { name: 'Ocean Sky', value: '#0284c7', border: 'border-sky-500', bg: 'bg-sky-50 text-sky-800' },
  { name: 'Emerald Forest', value: '#059669', border: 'border-emerald-500', bg: 'bg-emerald-50 text-emerald-800' },
  { name: 'Royal Purple', value: '#7c3aed', border: 'border-purple-500', bg: 'bg-purple-50 text-purple-800' },
  { name: 'Amber Warm', value: '#d97706', border: 'border-amber-500', bg: 'bg-amber-50 text-amber-800' },
  { name: 'Rose Coral', value: '#e11d48', border: 'border-rose-500', bg: 'bg-rose-50 text-rose-800' },
  { name: 'Indigo Night', value: '#4338ca', border: 'border-indigo-500', bg: 'bg-indigo-50 text-indigo-800' },
  { name: 'Slate Steel', value: '#475569', border: 'border-slate-500', bg: 'bg-slate-50 text-slate-800' }
];

export function getStoredCustomFloors(): CustomFloor[] {
  if (typeof window === 'undefined') return DEFAULT_PLANT_FLOORS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_FLOORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse custom floors from localStorage:', e);
  }
  return DEFAULT_PLANT_FLOORS;
}

export function saveStoredCustomFloors(floors: CustomFloor[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOM_FLOORS, JSON.stringify(floors));
  } catch (e) {
    console.error('Failed to save custom floors to localStorage:', e);
  }
}

/**
 * Returns merged floors combining custom configured floors with any floors detected dynamically in lines data
 */
export function getEffectiveFloors(lines: LineEntry[] = []): CustomFloor[] {
  const configured = getStoredCustomFloors();
  const configuredMap = new Map<string, CustomFloor>();

  configured.forEach(f => {
    configuredMap.set(f.name.trim().toLowerCase(), f);
  });

  // Discover any unique floor in active lines that might not be in configured
  const discoveredFloors = new Set<string>();
  lines.forEach(l => {
    if (l.floor && l.floor.trim()) {
      discoveredFloors.add(l.floor.trim());
    }
  });

  const merged: CustomFloor[] = [...configured];

  discoveredFloors.forEach(floorName => {
    const key = floorName.toLowerCase();
    if (!configuredMap.has(key)) {
      const fallbackColor = FLOOR_COLOR_PALETTES[merged.length % FLOOR_COLOR_PALETTES.length].value;
      const newFloor: CustomFloor = {
        id: `floor-${floorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`,
        name: floorName,
        building: 'Production Floor Unit',
        floorCode: `FL-${floorName.toUpperCase().slice(0, 5)}`,
        targetEfficiency: 70,
        standardWorkingHours: 8,
        color: fallbackColor,
        order: merged.length + 1,
        createdAt: new Date().toISOString()
      };
      merged.push(newFloor);
      configuredMap.set(key, newFloor);
    }
  });

  return merged.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Calculates live summary metrics for each floor from active line entries
 */
export interface FloorMetricSummary {
  floor: CustomFloor;
  lines: LineEntry[];
  linesCount: number;
  linesRangeText: string;
  totalPresentMP: number;
  totalPlannedOutput: number;
  totalAchievedOutput: number;
  avgEfficiency: number;
  criticalBottlenecksCount: number;
  wipBreachesCount: number;
  totalWip: number;
}

export function computeFloorMetricSummaries(floors: CustomFloor[], lines: LineEntry[]): FloorMetricSummary[] {
  return floors.map(floor => {
    const floorKey = floor.name.trim().toLowerCase();
    const matchedLines = lines.filter(l => (l.floor?.trim().toLowerCase() || '') === floorKey);

    const sortedLines = [...matchedLines].sort((a, b) => {
      const numA = parseInt(String(a.lineNo).replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(String(b.lineNo).replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    const linesCount = matchedLines.length;

    let linesRangeText = 'No Lines Assigned';
    if (sortedLines.length === 1) {
      linesRangeText = `Line ${sortedLines[0].lineNo}`;
    } else if (sortedLines.length > 1) {
      linesRangeText = `Lines ${sortedLines[0].lineNo} - ${sortedLines[sortedLines.length - 1].lineNo}`;
    }

    const totalPresentMP = matchedLines.reduce((acc, l) => acc + (l.plannedMP || 0), 0);
    const totalPlannedOutput = matchedLines.reduce((acc, l) => acc + (l.targetProd || 0), 0);
    const totalAchievedOutput = matchedLines.reduce((acc, l) => acc + (l.achievedProd || 0), 0);

    const avgEfficiency =
      matchedLines.length > 0
        ? Math.round(matchedLines.reduce((acc, l) => acc + (l.efficiency || 0), 0) / matchedLines.length)
        : 0;

    const criticalBottlenecksCount = matchedLines.filter(
      l => l.bottleneck && (l.bottleneck.status === 'critical' || l.bottleneck.status === 'high')
    ).length;

    const wipBreachesCount = matchedLines.filter(
      l => (l.wip || 0) > (l.targetProd || 0) * 0.45 && (l.wip || 0) > 300
    ).length;

    const totalWip = matchedLines.reduce((acc, l) => acc + (l.wip || 0), 0);

    return {
      floor,
      lines: matchedLines,
      linesCount,
      linesRangeText,
      totalPresentMP,
      totalPlannedOutput,
      totalAchievedOutput,
      avgEfficiency,
      criticalBottlenecksCount,
      wipBreachesCount,
      totalWip
    };
  });
}

/**
 * Updates all lines on an existing floor when the floor is renamed
 */
export function renameFloorInLines(lines: LineEntry[], oldName: string, newName: string): LineEntry[] {
  const oldKey = oldName.trim().toLowerCase();
  const cleanNewName = newName.trim();
  return lines.map(line => {
    if ((line.floor?.trim().toLowerCase() || '') === oldKey) {
      return { ...line, floor: cleanNewName };
    }
    return line;
  });
}

/**
 * Reassigns designated lines to a new floor
 */
export function reassignLinesToFloor(lines: LineEntry[], lineNumbers: string[], targetFloor: string): LineEntry[] {
  const lineNoSet = new Set(lineNumbers.map(n => String(n).trim().toLowerCase()));
  const cleanFloor = targetFloor.trim();
  return lines.map(line => {
    if (lineNoSet.has(String(line.lineNo).trim().toLowerCase())) {
      return { ...line, floor: cleanFloor };
    }
    return line;
  });
}
