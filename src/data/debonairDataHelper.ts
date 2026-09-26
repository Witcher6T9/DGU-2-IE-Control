/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LineEntry } from '../types';

export interface DebonairRowInput {
  lineNo: string;
  chief: string;
  buyer: string;
  style: string;
  smv: number;
  daysRun: number;
  wh: number;
  mp: number;
  dayTarget: number;
  dayProduction: number;
  planEff: number;
  achvEff: number;
  effPrf: number;
  availableMin: number;
  produceMin: number;
  remarks?: string;
  bottleneckStation?: string;
}

export function getFloorForLine(lineNoStr: string): { floor: string; apartment: string; floorOrder: number } {
  const num = parseInt(lineNoStr, 10);
  if (num >= 1 && num <= 6) {
    return { floor: 'Padma Floor', apartment: 'Unit 2 - Padma', floorOrder: num };
  } else if (num >= 7 && num <= 12) {
    return { floor: 'Meghna Floor', apartment: 'Unit 2 - Meghna', floorOrder: num };
  } else if (num >= 13 && num <= 17) {
    return { floor: 'Karnophuli Floor', apartment: 'Unit 2 - Karnophuli', floorOrder: num };
  } else if (num >= 18 && num <= 23) {
    return { floor: 'Korotoya Floor', apartment: 'Unit 2 - Korotoya', floorOrder: num };
  } else if (num >= 24 && num <= 29) {
    return { floor: 'Shitalokshya Floor', apartment: 'Unit 2 - Shitalokshya', floorOrder: num };
  } else {
    return { floor: 'Turag Floor', apartment: 'Unit 2 - Turag', floorOrder: num };
  }
}

export function buildDebonairLineEntry(
  baseId: number,
  dateStr: string,
  row: DebonairRowInput
): LineEntry {
  const { floor, apartment, floorOrder } = getFloorForLine(row.lineNo);
  const diff = row.dayProduction - row.dayTarget;
  const shortOrExc = diff < 0 ? `Shortage: ${diff}` : `Excess: +${diff}`;

  // Breakdown of MP into Operator, Helper, and Iron Man
  const totalMP = row.mp;
  const opCount = Math.max(1, Math.round(totalMP * 0.8));
  const helperCount = Math.max(1, Math.round(totalMP * 0.15));
  const ironCount = Math.max(1, totalMP - opCount - helperCount);

  // Derive balancing graph stage from days run
  let balancingGraph: 'day1' | 'day2' | 'day3' | 'day4' | 'complete' = 'complete';
  if (row.daysRun === 1) balancingGraph = 'day1';
  else if (row.daysRun === 2) balancingGraph = 'day2';
  else if (row.daysRun === 3) balancingGraph = 'day3';
  else if (row.daysRun <= 6) balancingGraph = 'day4';

  const defaultStation = row.bottleneckStation || (
    row.style.toLowerCase().includes('bomber') ? 'Lining collar attach & zip join' :
    row.style.toLowerCase().includes('padded') ? 'Padding quilt attach & seam join' :
    row.style.toLowerCase().includes('hood') ? 'Hood padding assembly' :
    'Main zipper insertion'
  );

  const targetCT = Math.round((row.smv / totalMP) * 60 * 10) / 10;
  const cycleTime = row.achvEff > 0
    ? Math.round((targetCT * (row.planEff / row.achvEff)) * 10) / 10
    : Math.round(targetCT * 2.5 * 10) / 10;

  const bottleneckStatus: 'ok' | 'high' | 'critical' =
    row.achvEff >= 55 ? 'ok' : row.achvEff >= 30 ? 'high' : 'critical';

  const fullRemarks = row.remarks
    ? `${shortOrExc}. Avail: ${row.availableMin}m, Produce: ${row.produceMin}m. Chief: ${row.chief}. Days: ${row.daysRun}. ${row.remarks}`
    : `${shortOrExc}. Avail: ${row.availableMin}m, Produce: ${row.produceMin}m. Line Chief: ${row.chief}. Days Run: ${row.daysRun}.`;

  const calculatedWip = Math.max(40, Math.round(row.dayTarget * 0.45) + (diff < 0 ? Math.min(250, Math.abs(diff)) : 0));

  return {
    id: baseId,
    date: dateStr,
    lineNo: row.lineNo,
    floor,
    apartment,
    isActive: true,
    status: 'Active',
    floorOrder,
    buyer: row.buyer,
    style: row.style,
    smv: row.smv,
    plannedMP: totalMP,
    workingHours: row.wh,
    targetEff: row.planEff,
    targetProd: row.dayTarget,
    achievedProd: row.dayProduction,
    efficiency: row.achvEff,
    remarks: fullRemarks,
    orderQty: 12000,
    dailyInput: row.dayTarget,
    dailyOutput: row.dayProduction,
    wip: calculatedWip,
    balancingGraph,
    nextStyle: row.style,
    nextStyleDate: '2026-09-30',
    mp: {
      Operator: { present: opCount, absent: 0 },
      Helper: { present: helperCount, absent: 0 },
      'Iron Man': { present: ironCount, absent: 0 }
    },
    balanceMethod: row.daysRun > 10 ? 'Continuous Flow' : 'Target Pacing',
    balanceNotes: `Day ${row.daysRun} running. Produced ${row.dayProduction} pcs vs ${row.dayTarget} target (${row.achvEff}% eff / ${row.effPrf}% eff perf).`,
    top5: {
      held: 'yes',
      attendance: 100,
      items: [
        'Quality critical seam alignment check',
        'Hourly target pacing verification',
        'End-line bundle flow and buffer review',
        `Line Chief ${row.chief} shift synchronization`,
        'Operator ergonomics & needle safety check'
      ],
      notes: `Chief ${row.chief} maintaining floor pacing.`
    },
    bottleneck: {
      station: defaultStation,
      cycleTime,
      targetCT,
      status: bottleneckStatus,
      action: bottleneckStatus === 'critical'
        ? 'Assign floater and inspect feed tension'
        : bottleneckStatus === 'high'
        ? 'Adjust seam guide and cycle monitoring'
        : 'Pacing steady and within tolerance',
      notes: `Efficiency achieved at ${row.achvEff}%`
    },
    timeStudy: {
      done: 'yes',
      type: 'both',
      observedRate: Math.round(row.dayProduction / (row.wh || 10)),
      standardRate: Math.round(row.dayTarget / (row.wh || 10)),
      findings: `Line operated at ${row.achvEff}% efficiency with ${row.effPrf}% performance to plan.`
    },
    buildUp: {
      day: String(row.daysRun),
      plannedPct: row.planEff,
      achievedPct: row.achvEff,
      operators: opCount,
      notes: `Day ${row.daysRun} ramp-up record`
    },
    lineIE: {
      name: `${row.chief} (Line Chief) / IE Lead`,
      level: row.achvEff >= 50 ? 'sr_executive' : 'executive',
      period: 'daily'
    }
  };
}
