/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Tests for Line Booking for Upcoming Styles & Monthly Operating Budget Utilities
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  parseLineBookingFromTextOrBuffer,
  exportLineBookingsToCSV,
  generateLineBookingTemplateCSV,
  parseMonthlyBudgetFromTextOrBuffer,
  exportMonthlyBudgetsToCSV,
  generateMonthlyBudgetTemplateCSV,
  INITIAL_LINE_BOOKINGS,
  INITIAL_MONTHLY_BUDGETS
} from '../utils/bookingAndBudgetCsv';

describe('Line Booking for Upcoming Styles CSV & Excel Importer/Exporter', () => {
  it('parses valid CSV text for line bookings correctly', () => {
    const csvSample = `LineNo,Floor,UpcomingStyle,Buyer,OrderQty,StartDate,EndDate,SAM,PlannedOperators,PlannedHelpers,TargetEfficiencyPct,DailyTargetPcs,TRSampleStatus,TrimsStatus,BookingStatus,Notes
L01,Floor 03,HERBERT LIGHT PADDED HOOD,ZARA,18500,2026-10-05,2026-10-25,18.2,42,8,72,1150,Ready,In House,Confirmed,"Test Notes"
L02,Floor 03,JAF 1156 PADDED PARKA,H&M,14000,2026-10-06,2026-10-24,21.0,44,9,68,980,In Development,Partial,Tentative,"Fusing test"`;

    const result = parseLineBookingFromTextOrBuffer(csvSample);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.bookings.length, 2);

    const b1 = result.bookings[0];
    assert.strictEqual(b1.lineNo, 'L01');
    assert.strictEqual(b1.style, 'HERBERT LIGHT PADDED HOOD');
    assert.strictEqual(b1.buyer, 'ZARA');
    assert.strictEqual(b1.orderQty, 18500);
    assert.strictEqual(b1.sam, 18.2);
    assert.strictEqual(b1.trSampleStatus, 'Ready');
    assert.strictEqual(b1.bookingStatus, 'Confirmed');

    const b2 = result.bookings[1];
    assert.strictEqual(b2.lineNo, 'L02');
    assert.strictEqual(b2.trSampleStatus, 'In Development');
    assert.strictEqual(b2.bookingStatus, 'Tentative');
  });

  it('exports line bookings to valid CSV string', () => {
    const exportedCSV = exportLineBookingsToCSV(INITIAL_LINE_BOOKINGS.slice(0, 3));
    assert.ok(exportedCSV.includes('LineNo,Floor,UpcomingStyle'));
    assert.ok(exportedCSV.includes('HERBERT LIGHT PADDED HOOD'));
    assert.ok(exportedCSV.includes('ZARA'));
  });

  it('generates a downloadable CSV template with prefilled headers and rows', () => {
    const template = generateLineBookingTemplateCSV();
    assert.ok(template.includes('LineNo,Floor,UpcomingStyle,Buyer,OrderQty'));
    assert.ok(template.split('\n').length >= 4);
  });
});

describe('Monthly Operating Budget CSV Importer/Exporter', () => {
  it('parses valid monthly budget CSV ledger correctly', () => {
    const csvSample = `Month,Category,Department,Floor,AllocatedBudget_USD,ActualSpend_USD,Status,ResponsiblePerson,Notes
2026-10,Direct Labor Wages (Sewing Operators),Sewing Operations,All Floors,85000,81200,Within Budget,"Mr. Farhan","Direct line wages"
2026-10,Machine Spare Parts & Maintenance,Plant Engineering,All Floors,12000,13500,Over Budget,"Chief Engineer","Motor replacements"`;

    const result = parseMonthlyBudgetFromTextOrBuffer(csvSample);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.budgets.length, 2);

    const item1 = result.budgets[0];
    assert.strictEqual(item1.month, '2026-10');
    assert.strictEqual(item1.category, 'Direct Labor Wages (Sewing Operators)');
    assert.strictEqual(item1.allocatedBudget, 85000);
    assert.strictEqual(item1.actualSpend, 81200);
    assert.strictEqual(item1.variance, 3800);
    assert.strictEqual(item1.status, 'Within Budget');

    const item2 = result.budgets[1];
    assert.strictEqual(item2.allocatedBudget, 12000);
    assert.strictEqual(item2.actualSpend, 13500);
    assert.strictEqual(item2.variance, -1500);
    assert.strictEqual(item2.status, 'Over Budget');
  });

  it('exports monthly budget ledger with summary metadata', () => {
    const exportedCSV = exportMonthlyBudgetsToCSV(INITIAL_MONTHLY_BUDGETS, '2026-10');
    assert.ok(exportedCSV.includes('Monthly Operating Budget Export'));
    assert.ok(exportedCSV.includes('AllocatedBudget_USD,ActualSpend_USD'));
    assert.ok(exportedCSV.includes('Direct Labor Wages'));
  });

  it('generates a downloadable Monthly Budget CSV template', () => {
    const template = generateMonthlyBudgetTemplateCSV();
    assert.ok(template.includes('Month,Category,Department,Floor,AllocatedBudget_USD'));
    assert.ok(template.split('\n').length >= 4);
  });
});
