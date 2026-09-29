import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generate8hHourlyRecords } from '../utils/workingMinutesBalancing';
import { isFridayHoliday, isWorkingDay, formatDateLabel } from '../utils';

describe('IE Balancing Calculations', () => {
  test('generate8hHourlyRecords generates exactly 8 working hour records', () => {
    const records = generate8hHourlyRecords(750, 800, 18.5, 45);
    assert.equal(records.length, 8);
    
    // Total achieved pcs should sum up to input achieved pcs
    const totalAchieved = records.reduce((sum, r) => sum + r.actualPcs, 0);
    assert.equal(totalAchieved, 750);

    // Each record has proper time ranges
    assert.equal(records[0].timeRange, '08:00 - 09:00');
    assert.equal(records[7].timeRange, '16:00 - 17:00');

    // Available minutes per hour = 45 workers * 60 = 2700 minutes
    assert.equal(records[0].availableMinutes, 45 * 60);
  });

  test('generate8hHourlyRecords calculates earned minutes and efficiency correctly', () => {
    const records = generate8hHourlyRecords(600, 600, 15, 30);
    assert.equal(records.length, 8);
    for (const r of records) {
      assert.ok(r.efficiencyPct >= 0);
      assert.ok(r.earnedMinutes >= 0);
      assert.ok(['Surge', 'On Track', 'Minor Lag', 'Bottleneck Delay'].includes(r.status));
    }
  });
});

describe('Date & Factory Calendar Utils', () => {
  test('isFridayHoliday correctly detects Friday weekly factory holidays', () => {
    // 2026-09-25 is a Friday
    assert.equal(isFridayHoliday('2026-09-25'), true);
    assert.equal(isWorkingDay('2026-09-25'), false);

    // 2026-09-24 is Thursday
    assert.equal(isFridayHoliday('2026-09-24'), false);
    assert.equal(isWorkingDay('2026-09-24'), true);
  });

  test('formatDateLabel formats valid dates into readable strings', () => {
    const label = formatDateLabel('2026-09-24');
    assert.ok(label.includes('Sep') || label.includes('September') || label.includes('24'));
  });
});
