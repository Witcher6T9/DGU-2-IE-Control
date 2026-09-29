import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLineMetrics,
  calculateFactoryOverall,
  calculateDayWiseSummaries,
  getTodayDateStr,
  getOffsetDateStr
} from '../utils';
import { LineEntry } from '../types';

describe('IE Factory & Line Metrics Calculations', () => {
  const mockLine1: LineEntry = {
    id: 1,
    date: '2026-09-24',
    lineNo: '18',
    floor: 'Padma Floor',
    buyer: 'H&M',
    style: 'TS-2401 Crewneck',
    smv: 1.0,
    plannedMP: 40,
    workingHours: 8,
    targetEff: 85,
    targetProd: 1200,
    achievedProd: 1080,
    efficiency: 90,
    remarks: 'Smooth run',
    orderQty: 15000,
    dailyInput: 1150,
    dailyOutput: 1080,
    wip: 320,
    balancingGraph: 'day4',
    nextStyle: 'TS-2501 Winter Thermal',
    nextStyleDate: '2026-09-29',
    mp: {
      Operator: { present: 28, absent: 2 },
      Helper: { present: 8, absent: 1 },
      'Iron Man': { present: 4, absent: 0 }
    },
    balanceMethod: 'Overtime',
    balanceNotes: '',
    top5: { held: 'yes', attendance: 95, items: [], notes: '' },
    bottleneck: { station: 'Cuff & Hem', cycleTime: 48.5, targetCT: 45, status: 'ok', action: '', notes: '' },
    timeStudy: { done: 'yes', type: 'time', observedRate: 142, standardRate: 150, findings: '' },
    buildUp: { day: '4', plannedPct: 90, achievedPct: 90, operators: 39, notes: '' },
    lineIE: { name: 'Mahmudul Hoque', level: 'sr_executive', period: 'daily' }
  };

  const mockLine2: LineEntry = {
    id: 2,
    date: '2026-09-24',
    lineNo: '19',
    floor: 'Padma Floor',
    buyer: 'Zara',
    style: 'JK-1180 Windbreaker',
    smv: 1.25,
    plannedMP: 45,
    workingHours: 8,
    targetEff: 80,
    targetProd: 900,
    achievedProd: 720,
    efficiency: 80,
    remarks: 'Zipper bottleneck',
    orderQty: 8500,
    dailyInput: 750,
    dailyOutput: 720,
    wip: 410,
    balancingGraph: 'day2',
    nextStyle: 'JK-1200 Bomber',
    nextStyleDate: '2026-09-26',
    mp: {
      Operator: { present: 32, absent: 3 },
      Helper: { present: 7, absent: 1 },
      'Iron Man': { present: 3, absent: 0 }
    },
    balanceMethod: 'Helper Support',
    balanceNotes: '',
    top5: { held: 'yes', attendance: 90, items: [], notes: '' },
    bottleneck: { station: 'Zipper Attach', cycleTime: 58.0, targetCT: 52, status: 'high', action: '', notes: '' },
    timeStudy: { done: 'yes', type: 'time', observedRate: 85, standardRate: 100, findings: '' },
    buildUp: { day: '2', plannedPct: 75, achievedPct: 80, operators: 42, notes: '' },
    lineIE: { name: 'Tanvir Ahmed', level: 'executive', period: 'daily' }
  };

  test('calculateLineMetrics computes present manpower and available minutes accurately', () => {
    const metrics = calculateLineMetrics(mockLine1);
    // 28 + 8 + 4 = 40 present
    assert.equal(metrics.totalPresentMP, 40);
    // 2 + 1 + 0 = 3 absent
    assert.equal(metrics.totalAbsentMP, 3);
    assert.equal(metrics.totalAllocatedMP, 43);
    // 40 workers * 8h * 60 min = 19200 minutes
    assert.equal(metrics.availableMinutes, 40 * 8 * 60);
    // 1080 pcs * 1.0 SMV = 1080 minutes
    assert.equal(metrics.standardProducedMinutes, 1080);
    assert.ok(metrics.efficiencyPct > 0);
  });

  test('calculateFactoryOverall aggregates multi-line performance', () => {
    const factory = calculateFactoryOverall([mockLine1, mockLine2]);
    assert.equal(factory.totalAchievedProd, 1080 + 720);
    assert.equal(factory.totalTargetProd, 1200 + 900);
    assert.equal(factory.targetVariance, (1080 + 720) - (1200 + 900));
    assert.equal(factory.activeLinesCount, 2);
    assert.ok(factory.overallEfficiency > 0);
  });

  test('calculateDayWiseSummaries returns sorted summaries across calendar', () => {
    const summaries = calculateDayWiseSummaries([mockLine1, mockLine2]);
    assert.ok(Array.isArray(summaries));
    assert.ok(summaries.length > 0);
    const sep24 = summaries.find(s => s.date === '2026-09-24');
    assert.ok(sep24);
    assert.equal(sep24?.totalAchievedProd, 1080 + 720);
  });

  test('date offset calculations maintain ISO yyyy-mm-dd format', () => {
    const today = getTodayDateStr();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    const tomorrow = getOffsetDateStr(1);
    assert.match(tomorrow, /^\d{4}-\d{2}-\d{2}$/);
  });
});
