/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Line Booking for Upcoming Styles & Monthly Operating Budget Utilities
 * Provides full parsing, validation, multi-format import (CSV & Excel) and export
 */

import * as XLSX from 'xlsx';
import { LineBookingRecord, MonthlyBudgetRecord } from '../types';

/* -------------------------------------------------------------------------- */
/*                          INITIAL / DEFAULT DATASETS                        */
/* -------------------------------------------------------------------------- */

export const INITIAL_LINE_BOOKINGS: LineBookingRecord[] = [
  {
    id: 'book-l01-herbert',
    lineNo: 'L01',
    floor: 'Floor 03',
    style: 'HERBERT LIGHT PADDED HOOD',
    buyer: 'ZARA',
    orderQty: 18500,
    startDate: '2026-09-25',
    endDate: '2026-10-15',
    sam: 18.2,
    plannedOperators: 42,
    plannedHelpers: 8,
    targetEfficiency: 72,
    dailyTarget: 1150,
    totalTarget: 18500,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Technical file confirmed. 100% fabric inspected and approved by buyer auditor.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l02-jaf1156',
    lineNo: 'L02',
    floor: 'Floor 03',
    style: 'JAF 1156 PADDED PARKA',
    buyer: 'H&M',
    orderQty: 14000,
    startDate: '2026-09-24',
    endDate: '2026-10-10',
    sam: 21.0,
    plannedOperators: 44,
    plannedHelpers: 9,
    targetEfficiency: 68,
    dailyTarget: 980,
    totalTarget: 14000,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Pilot run completed with 98.4% first pass yield.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l03-quinn',
    lineNo: 'L03',
    floor: 'Floor 03',
    style: 'QUINN LIGHT BOMBER JKT',
    buyer: 'PULL&BEAR',
    orderQty: 22000,
    startDate: '2026-09-28',
    endDate: '2026-10-20',
    sam: 16.5,
    plannedOperators: 40,
    plannedHelpers: 8,
    targetEfficiency: 75,
    dailyTarget: 1350,
    totalTarget: 22000,
    trSampleStatus: 'Ready',
    trimsStatus: 'Partial',
    bookingStatus: 'Confirmed',
    notes: 'Zipper pullers arriving Sep 26th via priority courier.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l04-quinn',
    lineNo: 'L04',
    floor: 'Floor 03',
    style: 'QUINN LIGHT BOMBER JKT',
    buyer: 'BERSHKA',
    orderQty: 25000,
    startDate: '2026-09-30',
    endDate: '2026-10-25',
    sam: 16.5,
    plannedOperators: 40,
    plannedHelpers: 8,
    targetEfficiency: 74,
    dailyTarget: 1300,
    totalTarget: 25000,
    trSampleStatus: 'In Development',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Pre-production size set submitted to brand technical hub.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l05-danny',
    lineNo: 'L05',
    floor: 'Floor 03',
    style: 'DANNY MID PADDED JKT',
    buyer: 'MANGO',
    orderQty: 30000,
    startDate: '2026-10-15',
    endDate: '2026-11-05',
    sam: 24.5,
    plannedOperators: 48,
    plannedHelpers: 10,
    targetEfficiency: 65,
    dailyTarget: 850,
    totalTarget: 30000,
    trSampleStatus: 'In Development',
    trimsStatus: 'Pending Shipment',
    bookingStatus: 'Tentative',
    notes: 'Awaiting lab dip approval for Navy Blue contrast lining.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l06-danny',
    lineNo: 'L06',
    floor: 'Floor 03',
    style: 'DANNY MID PADDED JKT',
    buyer: 'MANGO',
    orderQty: 28000,
    startDate: '2026-10-10',
    endDate: '2026-11-02',
    sam: 24.5,
    plannedOperators: 48,
    plannedHelpers: 10,
    targetEfficiency: 66,
    dailyTarget: 870,
    totalTarget: 28000,
    trSampleStatus: 'Pending Approval',
    trimsStatus: 'Partial',
    bookingStatus: 'Confirmed',
    notes: 'Fusing machine centerline dialed in for 220g insulation wadding.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l07-jaf434',
    lineNo: 'L07',
    floor: 'Floor 04',
    style: 'JAF 434 TECHNICAL VEST',
    buyer: 'H&M',
    orderQty: 16000,
    startDate: '2026-09-24',
    endDate: '2026-10-08',
    sam: 14.0,
    plannedOperators: 36,
    plannedHelpers: 6,
    targetEfficiency: 78,
    dailyTarget: 1500,
    totalTarget: 16000,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'In Production',
    notes: 'Running smoothly on Floor 04. Pacing at 102% of hourly target.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l08-jam1144',
    lineNo: 'L08',
    floor: 'Floor 04',
    style: 'JAM 1144 ZIP WINDBREAKER',
    buyer: 'NEXT',
    orderQty: 19500,
    startDate: '2026-09-27',
    endDate: '2026-10-14',
    sam: 17.5,
    plannedOperators: 38,
    plannedHelpers: 8,
    targetEfficiency: 70,
    dailyTarget: 1200,
    totalTarget: 19500,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Seam sealing tape machines pre-calibrated.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l11-bowie',
    lineNo: 'L11',
    floor: 'Floor 04',
    style: 'ONS BOWIE SOFTSHELL BOMBER',
    buyer: 'ONLY & SONS',
    orderQty: 21000,
    startDate: '2026-09-30',
    endDate: '2026-10-22',
    sam: 19.0,
    plannedOperators: 42,
    plannedHelpers: 8,
    targetEfficiency: 70,
    dailyTarget: 1100,
    totalTarget: 21000,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Tech pack approved. Special roller press assigned.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l14-cb2703',
    lineNo: 'L14',
    floor: 'Floor 05',
    style: 'CB2703 8415 WINTER JACKET',
    buyer: 'C&A',
    orderQty: 17200,
    startDate: '2026-09-28',
    endDate: '2026-10-18',
    sam: 22.0,
    plannedOperators: 44,
    plannedHelpers: 9,
    targetEfficiency: 67,
    dailyTarget: 950,
    totalTarget: 17200,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Heavy duty needle sets staged in tool crib.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l15-lando',
    lineNo: 'L15',
    floor: 'Floor 05',
    style: 'LANDO LIFE BOMBER',
    buyer: 'JACK & JONES',
    orderQty: 26000,
    startDate: '2026-10-08',
    endDate: '2026-10-30',
    sam: 18.0,
    plannedOperators: 40,
    plannedHelpers: 8,
    targetEfficiency: 72,
    dailyTarget: 1200,
    totalTarget: 26000,
    trSampleStatus: 'In Development',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Rib knitting collar delivery verified.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l16-basic',
    lineNo: 'L16',
    floor: 'Floor 05',
    style: '2268995 BASIC PADDED BOMBER',
    buyer: 'TOM TAILOR',
    orderQty: 24000,
    startDate: '2026-10-05',
    endDate: '2026-10-28',
    sam: 20.0,
    plannedOperators: 42,
    plannedHelpers: 8,
    targetEfficiency: 69,
    dailyTarget: 1050,
    totalTarget: 24000,
    trSampleStatus: 'In Development',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Pre-production size trial scheduled for Oct 2nd.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l18-jam433',
    lineNo: 'L18',
    floor: 'Floor 05',
    style: 'JAM 433 LIGHTWEIGHT PUFFER',
    buyer: 'TARGET',
    orderQty: 27500,
    startDate: '2026-10-01',
    endDate: '2026-10-24',
    sam: 19.5,
    plannedOperators: 42,
    plannedHelpers: 8,
    targetEfficiency: 71,
    dailyTarget: 1120,
    totalTarget: 27500,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Target compliance inspection completed without non-conformance.',
    updatedAt: '2026-09-24T10:00:00Z'
  },
  {
    id: 'book-l20-tb2268',
    lineNo: 'L20',
    floor: 'Floor 05',
    style: '2268450 TB30274205 B',
    buyer: 'BESTSELLER',
    orderQty: 20000,
    startDate: '2026-09-26',
    endDate: '2026-10-16',
    sam: 18.8,
    plannedOperators: 40,
    plannedHelpers: 8,
    targetEfficiency: 70,
    dailyTarget: 1100,
    totalTarget: 20000,
    trSampleStatus: 'Ready',
    trimsStatus: 'In House',
    bookingStatus: 'Confirmed',
    notes: 'Buyer representative signed off technical specifications.',
    updatedAt: '2026-09-24T10:00:00Z'
  }
];

export const INITIAL_MONTHLY_BUDGETS: MonthlyBudgetRecord[] = [
  // October 2026 (Active Forecast Period)
  {
    id: 'bud-202610-direct-labor',
    month: '2026-10',
    category: 'Direct Labor Wages (Sewing Operators)',
    department: 'Sewing Operations',
    floor: 'All Floors',
    allocatedBudget: 85000,
    actualSpend: 81200,
    variance: 3800,
    variancePercent: 4.47,
    status: 'Within Budget',
    responsiblePerson: 'Production Manager (Mr. Farhan)',
    notes: 'Direct wage budget allocated across 24 active sewing lines.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-indirect-labor',
    month: '2026-10',
    category: 'Indirect Labor & Helpers',
    department: 'Sewing & QA Prep',
    floor: 'All Floors',
    allocatedBudget: 24500,
    actualSpend: 23100,
    variance: 1400,
    variancePercent: 5.71,
    status: 'Within Budget',
    responsiblePerson: 'HR & Floor Admin',
    notes: 'Covers line helpers, feeders, and end-of-line QA checkers.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-maintenance',
    month: '2026-10',
    category: 'Machine Spare Parts & Maintenance',
    department: 'Plant Engineering & Mechanics',
    floor: 'All Floors',
    allocatedBudget: 12000,
    actualSpend: 13400,
    variance: -1400,
    variancePercent: -11.67,
    status: 'Over Budget',
    responsiblePerson: 'Chief Maintenance Engineer',
    notes: 'Emergency overhaul of multi-needle smocking motors and looping arms.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-overtime',
    month: '2026-10',
    category: 'Overtime & Extended Shift Hours',
    department: 'Sewing Operations',
    floor: 'Floor 03 & 04',
    allocatedBudget: 14000,
    actualSpend: 12850,
    variance: 1150,
    variancePercent: 8.21,
    status: 'Within Budget',
    responsiblePerson: 'Floor Operations Commander',
    notes: 'Controlled 1-hour overtime window for expedited H&M jacket ship window.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-utilities',
    month: '2026-10',
    category: 'Utility & Power (Electricity / Compressors / Steam)',
    department: 'Plant Utilities',
    floor: 'All Floors',
    allocatedBudget: 18500,
    actualSpend: 18100,
    variance: 400,
    variancePercent: 2.16,
    status: 'Within Budget',
    responsiblePerson: 'Utilities In-Charge',
    notes: 'VSD compressors and LED retrofit running at peak thermal efficiency.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-quality-trims',
    month: '2026-10',
    category: 'Quality Consumables & Trims Storage',
    department: 'Quality Assurance',
    floor: 'All Floors',
    allocatedBudget: 6800,
    actualSpend: 6250,
    variance: 550,
    variancePercent: 8.09,
    status: 'Within Budget',
    responsiblePerson: 'QA Lead Auditor',
    notes: 'Needle detection calibration tags and clean zone dust covers.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-ie-training',
    month: '2026-10',
    category: 'IE Training & Line Balancing Ramp-up',
    department: 'Industrial Engineering',
    floor: 'All Floors',
    allocatedBudget: 5500,
    actualSpend: 4900,
    variance: 600,
    variancePercent: 10.91,
    status: 'Within Budget',
    responsiblePerson: 'Head of Industrial Engineering',
    notes: 'Multi-skilling matrix workshops and GSD motion analysis licenses.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-safety-5s',
    month: '2026-10',
    category: 'Health, Safety & 5S Facility Audits',
    department: 'Safety & Compliance',
    floor: 'All Floors',
    allocatedBudget: 3200,
    actualSpend: 3050,
    variance: 150,
    variancePercent: 4.69,
    status: 'Within Budget',
    responsiblePerson: 'EHS Compliance Officer',
    notes: 'Monthly fire safety drills and floor centerline demarcation coatings.',
    updatedAt: '2026-09-25T08:00:00Z'
  },
  {
    id: 'bud-202610-digital-it',
    month: '2026-10',
    category: 'Digital Tablet & Telemetry Infrastructure',
    department: 'IT & Systems',
    floor: 'All Floors',
    allocatedBudget: 4000,
    actualSpend: 3800,
    variance: 200,
    variancePercent: 5.0,
    status: 'Within Budget',
    responsiblePerson: 'Systems Administrator',
    notes: 'Industrial tablet mounts, barcode scanners, and wireless mesh APs.',
    updatedAt: '2026-09-25T08:00:00Z'
  },

  // September 2026 (Historical Benchmark Period)
  {
    id: 'bud-202609-direct-labor',
    month: '2026-09',
    category: 'Direct Labor Wages (Sewing Operators)',
    department: 'Sewing Operations',
    floor: 'All Floors',
    allocatedBudget: 84000,
    actualSpend: 83500,
    variance: 500,
    variancePercent: 0.6,
    status: 'Within Budget',
    responsiblePerson: 'Production Manager (Mr. Farhan)',
    notes: 'Standard shift wages across September operating calendar.',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bud-202609-indirect-labor',
    month: '2026-09',
    category: 'Indirect Labor & Helpers',
    department: 'Sewing & QA Prep',
    floor: 'All Floors',
    allocatedBudget: 24000,
    actualSpend: 24450,
    variance: -450,
    variancePercent: -1.88,
    status: 'Warning',
    responsiblePerson: 'HR & Floor Admin',
    notes: 'Additional feeder helpers deployed during style changeover peak.',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bud-202609-maintenance',
    month: '2026-09',
    category: 'Machine Spare Parts & Maintenance',
    department: 'Plant Engineering & Mechanics',
    floor: 'All Floors',
    allocatedBudget: 11500,
    actualSpend: 11200,
    variance: 300,
    variancePercent: 2.61,
    status: 'Within Budget',
    responsiblePerson: 'Chief Maintenance Engineer',
    notes: 'Regular bi-weekly preventative machine servicing.',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bud-202609-overtime',
    month: '2026-09',
    category: 'Overtime & Extended Shift Hours',
    department: 'Sewing Operations',
    floor: 'All Floors',
    allocatedBudget: 13500,
    actualSpend: 14200,
    variance: -700,
    variancePercent: -5.19,
    status: 'Warning',
    responsiblePerson: 'Floor Operations Commander',
    notes: 'Saturday catch-up overtime to cover delayed fabric clearance.',
    updatedAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'bud-202609-utilities',
    month: '2026-09',
    category: 'Utility & Power (Electricity / Compressors / Steam)',
    department: 'Plant Utilities',
    floor: 'All Floors',
    allocatedBudget: 18000,
    actualSpend: 17650,
    variance: 350,
    variancePercent: 1.94,
    status: 'Within Budget',
    responsiblePerson: 'Utilities In-Charge',
    notes: 'Steam boiler fuel consumption optimized with automatic blowdown.',
    updatedAt: '2026-09-01T08:00:00Z'
  }
];

/* -------------------------------------------------------------------------- */
/*                     LOCAL STORAGE PERSISTENCE HELPERS                      */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY_BOOKINGS = 'debonair_line_bookings_v1';
const STORAGE_KEY_BUDGETS = 'debonair_monthly_budgets_v1';

export function loadStoredLineBookings(): LineBookingRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored line bookings:', err);
  }
  return INITIAL_LINE_BOOKINGS;
}

export function saveStoredLineBookings(bookings: LineBookingRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(bookings));
  } catch (err) {
    console.error('Error saving line bookings:', err);
  }
}

export function loadStoredMonthlyBudgets(): MonthlyBudgetRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BUDGETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored monthly budgets:', err);
  }
  return INITIAL_MONTHLY_BUDGETS;
}

export function saveStoredMonthlyBudgets(budgets: MonthlyBudgetRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  } catch (err) {
    console.error('Error saving monthly budgets:', err);
  }
}

/* -------------------------------------------------------------------------- */
/*                     LINE BOOKINGS CSV & EXCEL PARSER                       */
/* -------------------------------------------------------------------------- */

// Standardize header strings: trim, lowercase, strip punctuation
function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export interface LineBookingParseResult {
  bookings: LineBookingRecord[];
  errors: string[];
  warnings: string[];
  totalRowsProcessed: number;
}

export function parseLineBookingFromTextOrBuffer(data: string | ArrayBuffer): LineBookingParseResult {
  const result: LineBookingParseResult = {
    bookings: [],
    errors: [],
    warnings: [],
    totalRowsProcessed: 0
  };

  try {
    let workbook: XLSX.WorkBook;
    if (typeof data === 'string') {
      workbook = XLSX.read(data, { type: 'string' });
    } else {
      workbook = XLSX.read(data, { type: 'array' });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      result.errors.push('No worksheets found in provided file.');
      return result;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      result.errors.push('The file does not contain any data rows.');
      return result;
    }

    result.totalRowsProcessed = rawRows.length;

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      const normalizedRow: Record<string, string> = {};

      for (const [key, val] of Object.entries(row)) {
        normalizedRow[normalizeHeaderKey(key)] = String(val ?? '').trim();
      }

      // Extract Line Number
      const lineNoRaw =
        normalizedRow['lineno'] ||
        normalizedRow['line'] ||
        normalizedRow['lineid'] ||
        normalizedRow['linenumber'] ||
        normalizedRow['sewingline'];

      if (!lineNoRaw) {
        result.warnings.push(`Row ${rowNum}: Skipped row due to missing Line Number.`);
        return;
      }

      // Format lineNo as e.g. L01, L18 or Line 18
      let lineNo = lineNoRaw;
      if (/^\d+$/.test(lineNo)) {
        lineNo = `L${lineNo.padStart(2, '0')}`;
      } else if (/^line\s*\d+$/i.test(lineNo)) {
        const num = lineNo.replace(/\D/g, '');
        lineNo = `L${num.padStart(2, '0')}`;
      }

      // Style
      const style =
        normalizedRow['style'] ||
        normalizedRow['stylecode'] ||
        normalizedRow['stylename'] ||
        normalizedRow['styleno'] ||
        normalizedRow['upcomingstyle'] ||
        normalizedRow['nextstyle'] ||
        'Standard Style';

      // Floor
      const floor =
        normalizedRow['floor'] ||
        normalizedRow['floorno'] ||
        normalizedRow['location'] ||
        'Floor 03';

      // Buyer
      const buyer =
        normalizedRow['buyer'] ||
        normalizedRow['customer'] ||
        normalizedRow['brand'] ||
        'General Buyer';

      // Order Qty
      const orderQtyRaw =
        normalizedRow['orderqty'] ||
        normalizedRow['orderquantity'] ||
        normalizedRow['qty'] ||
        normalizedRow['quantity'] ||
        '10000';
      const orderQty = Math.max(1, parseInt(orderQtyRaw.replace(/[^0-9]/g, ''), 10) || 10000);

      // Start & End Dates
      const startDate =
        normalizedRow['startdate'] ||
        normalizedRow['start'] ||
        normalizedRow['bookeddate'] ||
        normalizedRow['from'] ||
        new Date().toISOString().split('T')[0];

      const endDate =
        normalizedRow['enddate'] ||
        normalizedRow['end'] ||
        normalizedRow['completiondate'] ||
        normalizedRow['to'] ||
        new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];

      // SAM / SMV
      const samRaw =
        normalizedRow['sam'] ||
        normalizedRow['smv'] ||
        normalizedRow['standardallowedminutes'] ||
        '18.0';
      const sam = Math.max(1, parseFloat(samRaw.replace(/[^0-9.]/g, '')) || 18.0);

      // Target Efficiency
      const effRaw =
        normalizedRow['targetefficiency'] ||
        normalizedRow['efficiency'] ||
        normalizedRow['targeteff'] ||
        normalizedRow['eff'] ||
        '70';
      const targetEfficiency = Math.min(100, Math.max(20, parseFloat(effRaw.replace(/[^0-9.]/g, '')) || 70));

      // Operators & Helpers
      const opRaw =
        normalizedRow['plannedoperators'] ||
        normalizedRow['operators'] ||
        normalizedRow['sewingoperators'] ||
        '40';
      const plannedOperators = Math.max(1, parseInt(opRaw.replace(/[^0-9]/g, ''), 10) || 40);

      const helperRaw =
        normalizedRow['plannedhelpers'] ||
        normalizedRow['helpers'] ||
        normalizedRow['helpercount'] ||
        '8';
      const plannedHelpers = Math.max(0, parseInt(helperRaw.replace(/[^0-9]/g, ''), 10) || 8);

      // Daily Target
      const dailyTargetRaw =
        normalizedRow['dailytarget'] ||
        normalizedRow['targetperday'] ||
        normalizedRow['dailyoutput'] ||
        '';
      const dailyTarget = dailyTargetRaw
        ? parseInt(dailyTargetRaw.replace(/[^0-9]/g, ''), 10)
        : Math.round((plannedOperators * 480 * (targetEfficiency / 100)) / (sam || 1));

      // TR Sample Status
      const trRaw = (
        normalizedRow['trsamplestatus'] ||
        normalizedRow['trstatus'] ||
        normalizedRow['trsample'] ||
        normalizedRow['sample'] ||
        'Ready'
      ).toLowerCase();
      let trSampleStatus: LineBookingRecord['trSampleStatus'] = 'Ready';
      if (trRaw.includes('dev') || trRaw.includes('prog')) trSampleStatus = 'In Development';
      else if (trRaw.includes('pend') || trRaw.includes('wait')) trSampleStatus = 'Pending Approval';
      else if (trRaw.includes('rev') || trRaw.includes('reject')) trSampleStatus = 'Revision Required';

      // Trims Status
      const trimsRaw = (
        normalizedRow['trimsstatus'] ||
        normalizedRow['trims'] ||
        normalizedRow['materialstatus'] ||
        'In House'
      ).toLowerCase();
      let trimsStatus: LineBookingRecord['trimsStatus'] = 'In House';
      if (trimsRaw.includes('part')) trimsStatus = 'Partial';
      else if (trimsRaw.includes('ship') || trimsRaw.includes('trans')) trimsStatus = 'Pending Shipment';
      else if (trimsRaw.includes('delay') || trimsRaw.includes('late')) trimsStatus = 'Delayed';

      // Booking Status
      const statusRaw = (
        normalizedRow['bookingstatus'] ||
        normalizedRow['status'] ||
        normalizedRow['stage'] ||
        'Confirmed'
      ).toLowerCase();
      let bookingStatus: LineBookingRecord['bookingStatus'] = 'Confirmed';
      if (statusRaw.includes('tent') || statusRaw.includes('draft')) bookingStatus = 'Tentative';
      else if (statusRaw.includes('prod') || statusRaw.includes('run')) bookingStatus = 'In Production';
      else if (statusRaw.includes('comp') || statusRaw.includes('done')) bookingStatus = 'Completed';

      // Notes
      const notes =
        normalizedRow['notes'] ||
        normalizedRow['remarks'] ||
        normalizedRow['comment'] ||
        normalizedRow['comments'] ||
        'Imported via Line Booking CSV / Excel schedule.';

      result.bookings.push({
        id: `book-${lineNo.toLowerCase()}-${Date.now()}-${idx}`,
        lineNo,
        floor,
        style,
        buyer,
        orderQty,
        startDate,
        endDate,
        sam,
        plannedOperators,
        plannedHelpers,
        targetEfficiency,
        dailyTarget: Math.max(1, dailyTarget || 1000),
        totalTarget: orderQty,
        trSampleStatus,
        trimsStatus,
        bookingStatus,
        notes,
        updatedAt: new Date().toISOString()
      });
    });

    if (result.bookings.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid line booking records could be extracted.');
    }
  } catch (err: any) {
    result.errors.push(`Parse error: ${err.message || 'Corrupted file format'}`);
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                     LINE BOOKING CSV EXPORTER & TEMPLATE                   */
/* -------------------------------------------------------------------------- */

export function exportLineBookingsToCSV(bookings: LineBookingRecord[]): string {
  const headers = [
    'LineNo',
    'Floor',
    'UpcomingStyle',
    'Buyer',
    'OrderQty',
    'StartDate',
    'EndDate',
    'SAM',
    'PlannedOperators',
    'PlannedHelpers',
    'TargetEfficiencyPct',
    'DailyTargetPcs',
    'TRSampleStatus',
    'TrimsStatus',
    'BookingStatus',
    'Notes'
  ];

  const rows = bookings.map(b => [
    `"${b.lineNo}"`,
    `"${b.floor}"`,
    `"${b.style.replace(/"/g, '""')}"`,
    `"${b.buyer.replace(/"/g, '""')}"`,
    b.orderQty,
    `"${b.startDate}"`,
    `"${b.endDate}"`,
    b.sam,
    b.plannedOperators,
    b.plannedHelpers,
    b.targetEfficiency,
    b.dailyTarget,
    `"${b.trSampleStatus}"`,
    `"${b.trimsStatus}"`,
    `"${b.bookingStatus}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

export function generateLineBookingTemplateCSV(): string {
  const templateRows = [
    'LineNo,Floor,UpcomingStyle,Buyer,OrderQty,StartDate,EndDate,SAM,PlannedOperators,PlannedHelpers,TargetEfficiencyPct,DailyTargetPcs,TRSampleStatus,TrimsStatus,BookingStatus,Notes',
    'L01,Floor 03,HERBERT LIGHT PADDED HOOD,ZARA,18500,2026-10-05,2026-10-25,18.2,42,8,72,1150,Ready,In House,Confirmed,"Pilot run approved by brand IE auditor"',
    'L02,Floor 03,JAF 1156 PADDED PARKA,H&M,14000,2026-10-06,2026-10-24,21.0,44,9,68,980,Ready,In House,Confirmed,"Fusing machine temperature dialed in"',
    'L03,Floor 03,QUINN LIGHT BOMBER JKT,PULL&BEAR,22000,2026-10-10,2026-10-31,16.5,40,8,75,1350,In Development,Partial,Confirmed,"Zipper shipment in transit"',
    'L05,Floor 03,DANNY MID PADDED JKT,MANGO,30000,2026-10-15,2026-11-10,24.5,48,10,65,850,Pending Approval,Pending Shipment,Tentative,"Awaiting size grading clearance"'
  ];

  return templateRows.join('\n');
}

/* -------------------------------------------------------------------------- */
/*                     MONTHLY BUDGET CSV & EXCEL PARSER                      */
/* -------------------------------------------------------------------------- */

export interface MonthlyBudgetParseResult {
  budgets: MonthlyBudgetRecord[];
  errors: string[];
  warnings: string[];
  totalRowsProcessed: number;
}

export function parseMonthlyBudgetFromTextOrBuffer(data: string | ArrayBuffer): MonthlyBudgetParseResult {
  const result: MonthlyBudgetParseResult = {
    budgets: [],
    errors: [],
    warnings: [],
    totalRowsProcessed: 0
  };

  try {
    let workbook: XLSX.WorkBook;
    if (typeof data === 'string') {
      workbook = XLSX.read(data, { type: 'string', raw: true, cellDates: false });
    } else {
      workbook = XLSX.read(data, { type: 'array', raw: true, cellDates: false });
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      result.errors.push('No worksheets found in provided file.');
      return result;
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '', raw: true });

    if (rawRows.length === 0) {
      result.errors.push('The file does not contain any data rows.');
      return result;
    }

    result.totalRowsProcessed = rawRows.length;

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const normalizedRow: Record<string, string> = {};

      for (const [key, val] of Object.entries(row)) {
        normalizedRow[normalizeHeaderKey(key)] = String(val ?? '').trim();
      }

      // Extract Category
      const category =
        normalizedRow['category'] ||
        normalizedRow['budgetcategory'] ||
        normalizedRow['costitem'] ||
        normalizedRow['item'] ||
        normalizedRow['expense'] ||
        normalizedRow['description'];

      if (!category) {
        result.warnings.push(`Row ${rowNum}: Skipped due to missing Budget Category.`);
        return;
      }

      // Month
      let month =
        normalizedRow['month'] ||
        normalizedRow['period'] ||
        normalizedRow['monthyear'] ||
        '2026-10';

      // If month is Excel date serial number (e.g. 46296)
      if (/^\d{5}$/.test(month)) {
        const serial = parseInt(month, 10);
        const parsedDate = new Date((serial - 25569) * 86400 * 1000);
        if (!isNaN(parsedDate.getTime())) {
          month = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      // Standardize month to YYYY-MM if possible
      if (/^[a-zA-Z]+\s*\d{4}$/.test(month)) {
        // e.g. "October 2026"
        const dateObj = new Date(month + ' 1');
        if (!isNaN(dateObj.getTime())) {
          month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        }
      }

      // Department
      const department =
        normalizedRow['department'] ||
        normalizedRow['dept'] ||
        normalizedRow['division'] ||
        normalizedRow['team'] ||
        'General Manufacturing';

      // Floor
      const floor =
        normalizedRow['floor'] ||
        normalizedRow['floorno'] ||
        normalizedRow['location'] ||
        'All Floors';

      // Allocated Budget
      const budgetRaw =
        normalizedRow['allocatedbudget'] ||
        normalizedRow['budget'] ||
        normalizedRow['budgetamount'] ||
        normalizedRow['plannedbudget'] ||
        normalizedRow['allocated'] ||
        '0';
      const allocatedBudget = Math.max(0, parseFloat(budgetRaw.replace(/[^0-9.-]/g, '')) || 0);

      // Actual Spend
      const spendRaw =
        normalizedRow['actualspend'] ||
        normalizedRow['actual'] ||
        normalizedRow['spent'] ||
        normalizedRow['actualamount'] ||
        normalizedRow['expenditure'] ||
        '0';
      const actualSpend = Math.max(0, parseFloat(spendRaw.replace(/[^0-9.-]/g, '')) || 0);

      const variance = allocatedBudget - actualSpend;
      const variancePercent = allocatedBudget > 0 ? ((allocatedBudget - actualSpend) / allocatedBudget) * 100 : 0;

      // Status derivation
      let status: MonthlyBudgetRecord['status'] = 'Within Budget';
      const statusRaw = (
        normalizedRow['status'] ||
        normalizedRow['budgetstatus'] ||
        ''
      ).toLowerCase();

      if (statusRaw.includes('over') || actualSpend > allocatedBudget) {
        status = 'Over Budget';
      } else if (statusRaw.includes('warn') || actualSpend >= allocatedBudget * 0.9) {
        status = 'Warning';
      } else {
        status = 'Within Budget';
      }

      // Responsible Person
      const responsiblePerson =
        normalizedRow['responsibleperson'] ||
        normalizedRow['responsible'] ||
        normalizedRow['owner'] ||
        normalizedRow['manager'] ||
        normalizedRow['incharge'] ||
        'Department Head';

      // Notes
      const notes =
        normalizedRow['notes'] ||
        normalizedRow['remarks'] ||
        normalizedRow['comment'] ||
        'Imported via Monthly Budget CSV / Excel ledger.';

      result.budgets.push({
        id: `bud-${month.replace(/[^0-9a-zA-Z]/g, '')}-${idx}-${Date.now()}`,
        month,
        category,
        department,
        floor,
        allocatedBudget,
        actualSpend,
        variance,
        variancePercent: parseFloat(variancePercent.toFixed(2)),
        status,
        responsiblePerson,
        notes,
        updatedAt: new Date().toISOString()
      });
    });

    if (result.budgets.length === 0 && result.errors.length === 0) {
      result.errors.push('No valid monthly budget records could be extracted.');
    }
  } catch (err: any) {
    result.errors.push(`Parse error: ${err.message || 'Corrupted file format'}`);
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*                     MONTHLY BUDGET CSV EXPORTER & TEMPLATE                 */
/* -------------------------------------------------------------------------- */

export function exportMonthlyBudgetsToCSV(budgets: MonthlyBudgetRecord[], targetMonth?: string): string {
  const filtered = targetMonth ? budgets.filter(b => b.month === targetMonth) : budgets;

  const totalAllocated = filtered.reduce((acc, b) => acc + b.allocatedBudget, 0);
  const totalActual = filtered.reduce((acc, b) => acc + b.actualSpend, 0);
  const netVariance = totalAllocated - totalActual;
  const burnPct = totalAllocated > 0 ? Math.round((totalActual / totalAllocated) * 100) : 0;

  const summaryHeader = [
    `# Debonair Unit-02 Garments Ltd. - Monthly Operating Budget Export`,
    `# Export Date: ${new Date().toISOString()}`,
    `# Target Period: ${targetMonth || 'All Periods'}`,
    `# Total Budget Allocated: $${totalAllocated.toLocaleString()}`,
    `# Total Actual Spent: $${totalActual.toLocaleString()}`,
    `# Net Variance: $${netVariance.toLocaleString()} (${burnPct}% Utilized)`,
    `#`
  ].join('\n');

  const headers = [
    'Month',
    'Category',
    'Department',
    'Floor',
    'AllocatedBudget_USD',
    'ActualSpend_USD',
    'Variance_USD',
    'VariancePercent',
    'Status',
    'ResponsiblePerson',
    'Notes'
  ];

  const rows = filtered.map(b => [
    `"${b.month}"`,
    `"${b.category.replace(/"/g, '""')}"`,
    `"${b.department.replace(/"/g, '""')}"`,
    `"${(b.floor || 'All Floors').replace(/"/g, '""')}"`,
    b.allocatedBudget,
    b.actualSpend,
    b.variance,
    b.variancePercent,
    `"${b.status}"`,
    `"${(b.responsiblePerson || '').replace(/"/g, '""')}"`,
    `"${(b.notes || '').replace(/"/g, '""')}"`
  ]);

  return `${summaryHeader}\n${headers.join(',')}\n${rows.map(r => r.join(',')).join('\n')}`;
}

export function generateMonthlyBudgetTemplateCSV(): string {
  const templateRows = [
    'Month,Category,Department,Floor,AllocatedBudget_USD,ActualSpend_USD,Status,ResponsiblePerson,Notes',
    '2026-10,Direct Labor Wages (Sewing Operators),Sewing Operations,All Floors,85000,81200,Within Budget,"Production Manager (Mr. Farhan)","Direct wages for 24 sewing lines"',
    '2026-10,Indirect Labor & Helpers,Sewing & QA Prep,All Floors,24500,23100,Within Budget,"HR & Floor Admin","Helpers, feeders, and inline inspection staff"',
    '2026-10,Machine Spare Parts & Maintenance,Plant Engineering,All Floors,12000,13400,Over Budget,"Chief Maintenance Engineer","Motor replacements & needle supplies"',
    '2026-10,Overtime & Extended Shift Hours,Sewing Operations,Floor 03 & 04,14000,12850,Within Budget,"Floor Operations Commander","Targeted 1-hour overtime window"',
    '2026-10,Utility & Power (Electricity / Compressors / Steam),Plant Utilities,All Floors,18500,18100,Within Budget,"Utilities In-Charge","Compressor & boiler gas allocations"',
    '2026-10,Quality Consumables & Trims Storage,Quality Assurance,All Floors,6800,6250,Within Budget,"QA Lead Auditor","Needle tags, calibration kits, packaging"',
    '2026-10,IE Training & Line Balancing Ramp-up,Industrial Engineering,All Floors,5500,4900,Within Budget,"Head of IE","GSD motion analysis and operator skill matrix"'
  ];

  return templateRows.join('\n');
}

/* -------------------------------------------------------------------------- */
/*                         CLIENT DOWNLOAD TRIGGER HELPER                     */
/* -------------------------------------------------------------------------- */

export function downloadTextAsFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
