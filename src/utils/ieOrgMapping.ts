/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — Industrial Engineering Department
 * Org Hierarchy & Line Mapping Helper Engine
 */

import { DEBONAIR_IE_ORG_CHART, InchargeNode, LineIEMember, ManagerNode } from '../data/debonairOrgData';
import { normalizeLineNo } from './rbac';
import { LineEntry } from '../types';

export interface LineIEMeta {
  lineNo: string;
  cleanNumber: number;
  normalizedLine: string;
  wing: 'Blue Wing' | 'Green Wing';
  wingSection: 'blue' | 'green';
  wingCode: 'A' | 'B';
  wingTitle: string;
  managerName: string;
  managerCode: string;
  inchargeNo: number;
  inchargeName: string;
  inchargeCode: string;
  inchargeColor: string;
  floorName: string;
  floorLabel: string;
  lineIEName: string;
  lineIECode: string;
  blockNo: number;
  blockId: string;
  blockLabel: string;
}

/**
 * Maps any line number to its exact place in the Debonair IE Org Hierarchy
 */
export function getLineIEMeta(lineNo: string | number): LineIEMeta {
  const norm = normalizeLineNo(lineNo);
  const digits = parseInt(norm.replace(/[^0-9]/g, ''), 10) || 1;
  const cleanNumber = digits;

  // Blue Wing: 01 to 17
  // Green Wing: 18 to 34
  const isBlueWing = digits <= 17;
  const wing = isBlueWing ? 'Blue Wing' : 'Green Wing';
  const wingSection = isBlueWing ? 'blue' : 'green';
  const wingCode = isBlueWing ? 'A' : 'B';
  const wingTitle = isBlueWing ? 'Section Wing A (Blue Wing)' : 'Section Wing B (Green Wing)';
  const managerName = isBlueWing ? 'Tanvir Ahmed' : 'Mahmudul Hasan';
  const managerCode = isBlueWing ? 'MGR-01' : 'MGR-02';

  let inchargeNo = 1;
  let inchargeName = 'Md. Rafiqul Islam';
  let inchargeCode = 'INC-01';
  let inchargeColor = '#3b82f6';
  let floorName = 'Padma Floor';
  let floorLabel = 'Floor 01 (Padma Floor)';
  let blockNo = 1;
  let blockId = 'block_1';
  let blockLabel = 'Block 1 — Floor 01';
  let lineIEName = 'Sabbir Ahmed';
  let lineIECode = 'LIE-01';

  if (digits >= 1 && digits <= 6) {
    inchargeNo = 1;
    inchargeName = 'Md. Rafiqul Islam';
    inchargeCode = 'INC-01';
    inchargeColor = '#3b82f6';
    floorName = 'Padma Floor';
    floorLabel = 'Floor 01 (Padma Floor)';
    blockNo = 1;
    blockId = 'block_1';
    blockLabel = 'Block 1 — Floor 01';
    if (digits <= 2) {
      lineIEName = 'Sabbir Ahmed';
      lineIECode = 'LIE-01';
    } else if (digits <= 4) {
      lineIEName = 'Fahim Faisal';
      lineIECode = 'LIE-02';
    } else {
      lineIEName = 'Naimur Rahman';
      lineIECode = 'LIE-03';
    }
  } else if (digits >= 7 && digits <= 12) {
    inchargeNo = 2;
    inchargeName = 'Kazi Nazmul';
    inchargeCode = 'INC-02';
    inchargeColor = '#0284c7';
    floorName = 'Meghna Floor';
    floorLabel = 'Floor 02 (Meghna Floor)';
    blockNo = 2;
    blockId = 'block_2';
    blockLabel = 'Block 2 — Floor 02';
    if (digits <= 8) {
      lineIEName = 'Mehedi Hasan';
      lineIECode = 'LIE-04';
    } else if (digits <= 10) {
      lineIEName = 'Tariqul Islam';
      lineIECode = 'LIE-05';
    } else {
      lineIEName = 'Shakil Mahmud';
      lineIECode = 'LIE-06';
    }
  } else if (digits >= 13 && digits <= 17) {
    inchargeNo = 3;
    inchargeName = 'Sharif Hossain';
    inchargeCode = 'INC-03';
    inchargeColor = '#0891b2';
    floorName = 'Karnophuli Floor';
    floorLabel = 'Floor 03 (Karnophuli Floor)';
    blockNo = 3;
    blockId = 'block_3';
    blockLabel = 'Block 3 — Floor 03';
    if (digits <= 14) {
      lineIEName = 'Imran Khan';
      lineIECode = 'LIE-07';
    } else if (digits <= 16) {
      lineIEName = 'Anwarul Azim';
      lineIECode = 'LIE-08';
    } else {
      lineIEName = 'Rashedul Islam';
      lineIECode = 'LIE-09';
    }
  } else if (digits >= 18 && digits <= 23) {
    inchargeNo = 4;
    inchargeName = 'Arifur Rahman';
    inchargeCode = 'INC-04';
    inchargeColor = '#16a34a';
    floorName = 'Korotoya Floor';
    floorLabel = 'Floor 04 (Korotoya Floor)';
    blockNo = 4;
    blockId = 'block_4';
    blockLabel = 'Block 4 — Floor 04';
    if (digits <= 19) {
      lineIEName = 'Masum Billah';
      lineIECode = 'LIE-10';
    } else if (digits <= 21) {
      lineIEName = 'Al-Amin Hossain';
      lineIECode = 'LIE-11';
    } else {
      lineIEName = 'Tanvir Hasan';
      lineIECode = 'LIE-12';
    }
  } else if (digits >= 24 && digits <= 29) {
    inchargeNo = 5;
    inchargeName = 'Kamrul Hasan';
    inchargeCode = 'INC-05';
    inchargeColor = '#84cc16';
    floorName = 'Shitalokshya Floor';
    floorLabel = 'Floor 05 (Shitalokshya Floor)';
    blockNo = 5;
    blockId = 'block_5';
    blockLabel = 'Block 5 — Floor 05';
    if (digits <= 25) {
      lineIEName = 'Mostafizur Rahman';
      lineIECode = 'LIE-13';
    } else if (digits <= 27) {
      lineIEName = 'Shahadat Hossain';
      lineIECode = 'LIE-14';
    } else {
      lineIEName = 'Mehedi Miraj';
      lineIECode = 'LIE-15';
    }
  } else {
    // 30 to 34+
    inchargeNo = 6;
    inchargeName = 'Tariqul Islam';
    inchargeCode = 'INC-06';
    inchargeColor = '#ca8a04';
    floorName = 'Turag Floor';
    floorLabel = 'Floor 06 (Turag Floor)';
    blockNo = 6;
    blockId = 'block_6';
    blockLabel = 'Block 6 — Floor 06';
    if (digits <= 31) {
      lineIEName = 'Ashraful Islam';
      lineIECode = 'LIE-16';
    } else if (digits <= 33) {
      lineIEName = 'Jahid Hasan';
      lineIECode = 'LIE-17';
    } else {
      lineIEName = 'Nazmul Huda';
      lineIECode = 'LIE-18';
    }
  }

  return {
    lineNo: String(lineNo),
    cleanNumber,
    normalizedLine: norm,
    wing,
    wingSection,
    wingCode,
    wingTitle,
    managerName,
    managerCode,
    inchargeNo,
    inchargeName,
    inchargeCode,
    inchargeColor,
    floorName,
    floorLabel,
    lineIEName,
    lineIECode,
    blockNo,
    blockId,
    blockLabel
  };
}

export interface InchargeGroupData {
  inchargeNo: number;
  inchargeName: string;
  inchargeCode: string;
  inchargeColor: string;
  floorLabel: string;
  assignedLinesRange: string;
  wing: 'Blue Wing' | 'Green Wing';
  managerName: string;
  lines: LineEntry[];
  totalTarget: number;
  totalActual: number;
  totalVariance: number;
  averageEfficiency: number;
  bottlenecksCount: number;
  criticalBottlenecksCount: number;
  totalOperators: number;
  totalHelpers: number;
}

export interface WingGroupData {
  wing: 'Blue Wing' | 'Green Wing';
  wingCode: 'A' | 'B';
  wingTitle: string;
  managerName: string;
  managerCode: string;
  colorHex: string;
  incharges: InchargeGroupData[];
  totalLines: number;
  totalTarget: number;
  totalActual: number;
  totalVariance: number;
  averageEfficiency: number;
  bottlenecksCount: number;
}

/**
 * Groups lines into Wing and Incharge hierarchy for the IE Org & RBAC layout
 */
export function groupLinesByIEOrg(lines: LineEntry[]): WingGroupData[] {
  const inchargeMap: { [key: number]: LineEntry[] } = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: []
  };

  // Group lines into incharge buckets
  lines.forEach(line => {
    const meta = getLineIEMeta(line.lineNo);
    if (inchargeMap[meta.inchargeNo]) {
      inchargeMap[meta.inchargeNo].push(line);
    }
  });

  // Helper to calculate incharge metrics
  const createInchargeGroup = (incNo: number): InchargeGroupData => {
    const incLines = inchargeMap[incNo] || [];
    // Sort lines by line number
    incLines.sort((a, b) => {
      const na = parseInt(String(a.lineNo).replace(/[^0-9]/g, ''), 10) || 0;
      const nb = parseInt(String(b.lineNo).replace(/[^0-9]/g, ''), 10) || 0;
      return na - nb;
    });

    const meta = getLineIEMeta(incNo === 1 ? 1 : incNo === 2 ? 7 : incNo === 3 ? 13 : incNo === 4 ? 18 : incNo === 5 ? 24 : 30);

    let totalTarget = 0;
    let totalActual = 0;
    let sumEff = 0;
    let bottlenecksCount = 0;
    let criticalBottlenecksCount = 0;
    let totalOperators = 0;
    let totalHelpers = 0;

    incLines.forEach(l => {
      totalTarget += Number(l.targetProd) || 0;
      totalActual += Number(l.achievedProd) || 0;
      sumEff += Number(l.efficiency) || 0;
      if (l.bottleneck && l.bottleneck.station && l.bottleneck.station !== 'No Bottleneck Reported') {
        bottlenecksCount++;
        if (l.bottleneck.status === 'critical') {
          criticalBottlenecksCount++;
        }
      }
      totalOperators += Number(l.mp?.Operator?.present) || 0;
      totalHelpers += Number(l.mp?.Helper?.present) || 0;
    });

    const averageEfficiency = incLines.length > 0 ? Math.round((sumEff / incLines.length) * 10) / 10 : 0;
    const totalVariance = totalActual - totalTarget;

    const ranges = {
      1: 'Lines 01–06',
      2: 'Lines 07–12',
      3: 'Lines 13–17',
      4: 'Lines 18–23',
      5: 'Lines 24–29',
      6: 'Lines 30–34'
    };

    return {
      inchargeNo: incNo,
      inchargeName: meta.inchargeName,
      inchargeCode: meta.inchargeCode,
      inchargeColor: meta.inchargeColor,
      floorLabel: meta.floorLabel,
      assignedLinesRange: ranges[incNo as keyof typeof ranges] || '',
      wing: meta.wing,
      managerName: meta.managerName,
      lines: incLines,
      totalTarget,
      totalActual,
      totalVariance,
      averageEfficiency,
      bottlenecksCount,
      criticalBottlenecksCount,
      totalOperators,
      totalHelpers
    };
  };

  const wingAIncharges = [createInchargeGroup(1), createInchargeGroup(2), createInchargeGroup(3)];
  const wingBIncharges = [createInchargeGroup(4), createInchargeGroup(5), createInchargeGroup(6)];

  const summarizeWing = (
    wing: 'Blue Wing' | 'Green Wing',
    wingCode: 'A' | 'B',
    wingTitle: string,
    managerName: string,
    managerCode: string,
    colorHex: string,
    incharges: InchargeGroupData[]
  ): WingGroupData => {
    let totalLines = 0;
    let totalTarget = 0;
    let totalActual = 0;
    let sumEff = 0;
    let bottlenecksCount = 0;

    incharges.forEach(inc => {
      totalLines += inc.lines.length;
      totalTarget += inc.totalTarget;
      totalActual += inc.totalActual;
      sumEff += inc.averageEfficiency * inc.lines.length;
      bottlenecksCount += inc.bottlenecksCount;
    });

    const averageEfficiency = totalLines > 0 ? Math.round((sumEff / totalLines) * 10) / 10 : 0;
    const totalVariance = totalActual - totalTarget;

    return {
      wing,
      wingCode,
      wingTitle,
      managerName,
      managerCode,
      colorHex,
      incharges,
      totalLines,
      totalTarget,
      totalActual,
      totalVariance,
      averageEfficiency,
      bottlenecksCount
    };
  };

  return [
    summarizeWing('Blue Wing', 'A', 'Section Wing A (Blue Wing)', 'Tanvir Ahmed', 'MGR-01', '#2563eb', wingAIncharges),
    summarizeWing('Green Wing', 'B', 'Section Wing B (Green Wing)', 'Mahmudul Hasan', 'MGR-02', '#16a34a', wingBIncharges)
  ];
}
