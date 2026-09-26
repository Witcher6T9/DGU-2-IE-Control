/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  LineEntry,
  Shift8hWorkingMinutesBalance,
  HourlyMinutesRecord,
  WorkstationMinutesBalance,
  Shift8hLostMinutesBreakdown,
  PostShiftOtBalancing
} from '../types';

/**
 * Standard Garment Workstation templates by Garment Type for 8-Hour Line Balancing
 */
const STANDARD_OPERATIONS_TEMPLATES = [
  { name: 'Front Placket Make / Welt', machine: 'Single Needle Lockstitch', weight: 0.11 },
  { name: 'Collar Band Run & Turn', machine: 'Single Needle Lockstitch', weight: 0.09 },
  { name: 'Collar Band Attach to Body', machine: 'Single Needle Lockstitch', weight: 0.12, isKeyBottleneck: true },
  { name: 'Shoulder Join with Tape', machine: '4-Thread Overlock', weight: 0.08 },
  { name: 'Sleeve Hemming with Folder', machine: '3-Needle Interlock / Coverstitch', weight: 0.09 },
  { name: 'Sleeve Set in Armhole', machine: '4-Thread Overlock', weight: 0.13, isKeyBottleneck: true },
  { name: 'Side Seam Overlock Join', machine: '4-Thread Overlock', weight: 0.10 },
  { name: 'Bottom Hem Folder Finish', machine: 'Coverstitch Flatlock', weight: 0.09 },
  { name: 'Buttonhole Indexing & Sew', machine: 'Electronic Buttonhole Machine', weight: 0.07 },
  { name: 'Button Attach & Thread Trim', machine: 'Button Sewer & Trimmer', weight: 0.05 },
  { name: 'In-Line End Inspection & Alteration', machine: 'Inspection Light Table', weight: 0.07 }
];

/**
 * Generates an 8-hour shift hour-by-hour working minutes breakdown
 * Shift hours: 08:00 to 17:00 (with 1-hour lunch from 12:00-13:00 excluded)
 */
export function generate8hHourlyRecords(
  totalAchievedPcs: number,
  totalTargetPcs: number,
  smv: number,
  presentMP: number
): HourlyMinutesRecord[] {
  const safeAchieved = Math.max(1, totalAchievedPcs);
  const safeTarget = Math.max(1, totalTargetPcs);
  const safeSmv = Math.max(1, smv);
  const safeMP = Math.max(1, presentMP);

  // Hourly curve distribution weights based on garment production psychology & ergonomics:
  // H1: Morning Ramp-up & Bundle Feed (10.0%)
  // H2: Accelerated Flow (13.0%)
  // H3: Peak Morning Cadence (14.0%)
  // H4: Pre-Lunch Flow (13.5%)
  // H5: Post-Lunch Resumption (12.0%)
  // H6: Afternoon Rhythm (13.5%)
  // H7: Afternoon Sprint (13.0%)
  // H8: Shift Wind-Down & Audit (11.0%)
  const hourPacingWeights = [0.10, 0.13, 0.14, 0.135, 0.12, 0.135, 0.13, 0.11];
  const hourTimeRanges = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00'
  ];

  const hourNotes = [
    'Shift start: Morning 10m huddle completed. Line bundle feeding ramp-up.',
    'Flow stabilized; operators reaching target cycle pace.',
    'Peak performance window; minimal needle micro-stops.',
    'High consistency prior to scheduled lunch break.',
    'Post-lunch resumption; warming up back to takt pace.',
    'Steady continuous throughput across assembly stations.',
    'Target sprint: floaters assigned to collar bottleneck.',
    'Shift closing: final inspection, WIP count tally & bundle clearance.'
  ];

  let accumulatedActual = 0;
  let accumulatedTarget = 0;

  return hourPacingWeights.map((weight, idx) => {
    const isLast = idx === 7;
    const hourNumber = idx + 1;

    let actualPcs = isLast
      ? Math.max(0, safeAchieved - accumulatedActual)
      : Math.round(safeAchieved * weight);
    accumulatedActual += isLast ? 0 : actualPcs;

    let targetPcs = isLast
      ? Math.max(0, safeTarget - accumulatedTarget)
      : Math.round(safeTarget * weight);
    accumulatedTarget += isLast ? 0 : targetPcs;

    const availableMinutes = safeMP * 60; // 60 minutes per worker per hour
    const earnedMinutes = Math.round(actualPcs * safeSmv);
    const lostMinutes = Math.max(0, availableMinutes - earnedMinutes);
    const hourlyEffPct = availableMinutes > 0 ? Math.round((earnedMinutes / availableMinutes) * 1000) / 10 : 0;
    const targetEffRef = targetPcs > 0 ? (targetPcs * safeSmv) / availableMinutes : 0.85;
    const varianceMinutes = Math.round(earnedMinutes - (availableMinutes * targetEffRef));

    let status: HourlyMinutesRecord['status'] = 'On Track';
    if (hourlyEffPct >= 85) {
      status = 'Surge';
    } else if (hourlyEffPct >= 72) {
      status = 'On Track';
    } else if (hourlyEffPct >= 58) {
      status = 'Minor Lag';
    } else {
      status = 'Bottleneck Delay';
    }

    return {
      hourNumber,
      hourLabel: `Hour ${hourNumber} (${hourTimeRanges[idx]})`,
      timeRange: hourTimeRanges[idx],
      targetPcs,
      actualPcs,
      smv: safeSmv,
      availableMinutes,
      earnedMinutes,
      varianceMinutes,
      lostMinutes,
      efficiencyPct: hourlyEffPct,
      status,
      notes: hourNotes[idx]
    };
  });
}

/**
 * Generates the Station-by-Station 480-minute working minutes balance diagram
 */
export function generateWorkstationBalancingRecords(
  smv: number,
  presentMP: number,
  achievedProd8h: number,
  bottleneckStationName?: string,
  bottleneckCycleSec?: number
): WorkstationMinutesBalance[] {
  const safeSmv = Math.max(1, smv);
  const safeMP = Math.max(1, presentMP);
  const totalWorkContentSec = safeSmv * 60;
  const pitchTimeSeconds = Math.round((totalWorkContentSec / safeMP) * 10) / 10;

  return STANDARD_OPERATIONS_TEMPLATES.map((tmpl, idx) => {
    const stationNumber = idx + 1;
    const opSmvSec = Math.round(totalWorkContentSec * tmpl.weight);

    // If it's the designated bottleneck, apply actual bottleneck cycle time or a higher cycle time
    let cycleTimeSeconds = Math.round((opSmvSec / Math.max(1, Math.round(safeMP * tmpl.weight))) * 10) / 10;
    if (tmpl.isKeyBottleneck) {
      cycleTimeSeconds = bottleneckCycleSec && bottleneckCycleSec > 0
        ? bottleneckCycleSec
        : Math.round(pitchTimeSeconds * 1.28 * 10) / 10;
    } else if (idx % 3 === 0) {
      cycleTimeSeconds = Math.round(pitchTimeSeconds * 0.88 * 10) / 10;
    }

    const taktVarianceSeconds = Math.round((cycleTimeSeconds - pitchTimeSeconds) * 10) / 10;
    const isBottleneck = taktVarianceSeconds > 2.0;
    const isStarved = taktVarianceSeconds < -3.5;

    let status: WorkstationMinutesBalance['status'] = 'Optimal';
    if (isBottleneck) {
      status = 'Bottleneck';
    } else if (isStarved) {
      status = 'Starved';
    } else if (tmpl.isKeyBottleneck) {
      status = 'Relief Active';
    }

    // 480 working minutes allocation across 8-hour shift
    const availableMinutes480 = 480;
    const balancingEffRatio = cycleTimeSeconds > 0 ? Math.min(1.0, pitchTimeSeconds / cycleTimeSeconds) : 0.9;
    const productiveMinutes = Math.round(availableMinutes480 * balancingEffRatio);
    const lostBalancingMinutes = Math.max(0, availableMinutes480 - productiveMinutes);
    const balancingEfficiencyPct = Math.round((productiveMinutes / availableMinutes480) * 1000) / 10;

    let recommendedAction = 'Maintain current feeding pace and SPI tolerance.';
    if (isBottleneck) {
      recommendedAction = `Bottleneck exceeds pitch by ${taktVarianceSeconds}s. Split operation into 2 passes or assign multi-skill floater for relief.`;
    } else if (isStarved) {
      recommendedAction = `Starved by upstream backlog (${Math.abs(taktVarianceSeconds)}s idle margin). Pre-load buffer boxes or merge trim step.`;
    } else if (status === 'Relief Active') {
      recommendedAction = 'Floater assistance stabilized cycle time within 5% of line pitch.';
    }

    return {
      stationNumber,
      operationName: tmpl.name,
      operatorName: `OP-${stationNumber.toString().padStart(2, '0')} (Stn ${stationNumber})`,
      machineType: tmpl.machine,
      cycleTimeSeconds,
      pitchTimeSeconds,
      taktVarianceSeconds,
      status,
      availableMinutes480,
      productiveMinutes,
      lostBalancingMinutes,
      balancingEfficiencyPct,
      recommendedAction
    };
  });
}

/**
 * Computes the complete 8-hour shift working minutes balancing reconciliation
 */
export function calculate8hShiftWorkingMinutesBalancing(
  line: LineEntry,
  overrides?: Partial<Shift8hWorkingMinutesBalance>
): Shift8hWorkingMinutesBalance {
  // 1. Manpower determination
  const operatorsPresent = line.mp?.Operator?.present || Math.round(line.plannedMP * 0.82) || 40;
  const helpersPresent = line.mp?.Helper?.present || Math.round(line.plannedMP * 0.14) || 6;
  const ironManPresent = line.mp?.['Iron Man']?.present || Math.round(line.plannedMP * 0.04) || 2;
  const totalPresentMP = operatorsPresent + helpersPresent + ironManPresent;

  // 2. Standard 8-Hour working minutes baseline
  const shiftDurationHours = 8.0;
  const shiftMinutesPerWorker = 480; // 8 * 60
  const grossAvailableMinutes = totalPresentMP * shiftMinutesPerWorker;

  // 3. Output pieces and standard minutes
  const smv = line.smv > 0 ? line.smv : 18.5;
  const targetProd8h = line.targetProd > 0 ? line.targetProd : Math.round((grossAvailableMinutes * 0.82) / smv);
  const achievedProd8h = line.achievedProd > 0 ? line.achievedProd : Math.round(targetProd8h * 0.88);

  const earnedStandardMinutes = Math.round(achievedProd8h * smv);
  const targetStandardMinutes = Math.round(targetProd8h * smv);
  const netVarianceMinutes = earnedStandardMinutes - targetStandardMinutes;

  const realizedShiftEfficiencyPct =
    grossAvailableMinutes > 0
      ? Math.round((earnedStandardMinutes / grossAvailableMinutes) * 1000) / 10
      : 0;

  const minuteUtilizationPct =
    grossAvailableMinutes > 0
      ? Math.min(100, Math.round((earnedStandardMinutes / grossAvailableMinutes) * 1000) / 10)
      : 0;

  // 4. Lost Working Minutes Breakdown (accounting for the difference: Gross Available - Earned Standard)
  const totalUnearnedMinutes = Math.max(0, grossAvailableMinutes - earnedStandardMinutes);

  // Proportions based on standard Debonair IE audit benchmarks:
  // - Line Balancing Loss: ~35%
  // - Needle Downtime: ~22%
  // - Machine Breakdown: ~12%
  // - Material Waiting: ~14%
  // - Quality Rework: ~10%
  // - Morning Briefing: ~5%
  // - Other/Unaccounted: remainder
  const balancingDelayMin = Math.round(totalUnearnedMinutes * 0.35);
  const needleDowntimeMin = Math.round(totalUnearnedMinutes * 0.22);
  const breakdownMin = Math.round(totalUnearnedMinutes * 0.11);
  const materialWaitMin = Math.round(totalUnearnedMinutes * 0.14);
  const reworkMin = Math.round(totalUnearnedMinutes * 0.10);
  const briefingMin = Math.round(totalUnearnedMinutes * 0.05);
  const otherMin = Math.max(
    0,
    totalUnearnedMinutes - (balancingDelayMin + needleDowntimeMin + breakdownMin + materialWaitMin + reworkMin + briefingMin)
  );

  const lostMinutes: Shift8hLostMinutesBreakdown = overrides?.lostMinutes || {
    lineBalancingDelayMinutes: balancingDelayMin,
    needleDowntimeMinutes: needleDowntimeMin,
    machineBreakdownMinutes: breakdownMin,
    materialFeedingDelayMinutes: materialWaitMin,
    reworkAndAlterationMinutes: reworkMin,
    morningBriefingAndSetupMinutes: briefingMin,
    otherUnaccountedMinutes: otherMin
  };

  // 5. Hourly Records (Hour 1 to Hour 8)
  const hourlyBreakdown = overrides?.hourlyBreakdown || generate8hHourlyRecords(
    achievedProd8h,
    targetProd8h,
    smv,
    totalPresentMP
  );

  // 6. Workstation Pitch Balancing Analysis (480 min)
  const workstations = overrides?.workstations || generateWorkstationBalancingRecords(
    smv,
    totalPresentMP,
    achievedProd8h,
    line.bottleneck?.station,
    line.bottleneck?.cycleTime
  );

  // 7. Post-8h Shift Deficit & OT Balancing Engine
  const deficitPcs = Math.max(0, targetProd8h - achievedProd8h);
  const deficitStandardMinutes = Math.round(deficitPcs * smv);
  const requiresOvertime = deficitPcs > 20;

  // Calculate needed OT minutes:
  // OT Minutes = Deficit Minutes / (Present MP * (Realized Efficiency / 100))
  const rawOtMinutes =
    realizedShiftEfficiencyPct > 0 && totalPresentMP > 0
      ? Math.round(deficitStandardMinutes / (totalPresentMP * (realizedShiftEfficiencyPct / 100)))
      : 0;

  // Standard factory overtime intervals in garment units: 30, 45, 60, 90, 120, or 180 min
  let recommendedOtMinutes = 0;
  if (rawOtMinutes > 0) {
    if (rawOtMinutes <= 35) recommendedOtMinutes = 30;
    else if (rawOtMinutes <= 50) recommendedOtMinutes = 45;
    else if (rawOtMinutes <= 75) recommendedOtMinutes = 60;
    else if (rawOtMinutes <= 105) recommendedOtMinutes = 90;
    else if (rawOtMinutes <= 140) recommendedOtMinutes = 120;
    else recommendedOtMinutes = 180;
  }

  // Recommended OT Manpower: We don't always need 100% of workers for OT!
  // Rebalanced lean OT crew focuses on bottlenecks + assembly, reducing indirect cost
  const recommendedOtManpower = requiresOvertime ? Math.round(totalPresentMP * 0.78) : 0;

  const otHourlyRatePcs = realizedShiftEfficiencyPct > 0
    ? Math.round((recommendedOtManpower * 60 * (realizedShiftEfficiencyPct / 100)) / smv)
    : Math.round(achievedProd8h / 8);

  const estimatedOtOutputPcs = Math.round((otHourlyRatePcs * recommendedOtMinutes) / 60);

  const rebalanceActionPlan: string[] = [];
  if (deficitPcs === 0) {
    rebalanceActionPlan.push('Shift target fully achieved within regular 8h schedule. Zero overtime required.');
    rebalanceActionPlan.push('Carry forward 150 WIP buffer pieces for tomorrow Hour 1 instantaneous startup.');
  } else {
    rebalanceActionPlan.push(
      `Shift closed with a ${deficitPcs} pcs deficit (${deficitStandardMinutes.toLocaleString()} earned minutes variance).`
    );
    if (recommendedOtMinutes > 0) {
      rebalanceActionPlan.push(
        `Execute ${recommendedOtMinutes} minutes lean overtime with ${recommendedOtManpower} operators (78% manpower) to recover target without line over-staffing.`
      );
    }
    rebalanceActionPlan.push(
      `Reassign 2 floaters to Station: "${line.bottleneck?.station || 'Collar Band Attach'}" to eliminate station starvation.`
    );
    rebalanceActionPlan.push(
      'Issue Pre-Feeding alert to Cutting Section to deliver 300 waistband pieces before 08:00 AM next day.'
    );
  }

  const postShiftBalancing: PostShiftOtBalancing = overrides?.postShiftBalancing || {
    target8hPcs: targetProd8h,
    achieved8hPcs: achievedProd8h,
    deficitPcs,
    deficitStandardMinutes,
    requiresOvertime,
    recommendedOtMinutes,
    recommendedOtManpower,
    rebalanceActionPlan,
    estimatedOtOutputPcs,
    otHourlyRatePcs
  };

  // 8. Sign-off Verdict
  let shiftVerdict: Shift8hWorkingMinutesBalance['signOff']['shiftVerdict'] = 'Met Target';
  if (achievedProd8h >= targetProd8h * 1.05) {
    shiftVerdict = 'Exceeded Target';
  } else if (achievedProd8h >= targetProd8h) {
    shiftVerdict = 'Met Target';
  } else if (achievedProd8h >= targetProd8h * 0.90) {
    shiftVerdict = 'Minor Deficit - Rebalanced';
  } else {
    shiftVerdict = 'OT Required';
  }

  const signOff: Shift8hWorkingMinutesBalance['signOff'] = overrides?.signOff || {
    isSignedOff: false,
    shiftVerdict,
    ieNotes: `Full 8-hour shift balancing closed. Total available: ${grossAvailableMinutes.toLocaleString()} min. Earned: ${earnedStandardMinutes.toLocaleString()} min (${realizedShiftEfficiencyPct}% efficiency). Balancing delay accounted for ${balancingDelayMin.toLocaleString()} lost minutes.`
  };

  return {
    shiftDurationHours,
    shiftMinutesPerWorker,
    totalPresentMP,
    operatorsPresent,
    helpersPresent,
    ironManPresent,
    grossAvailableMinutes,
    achievedProd8h,
    targetProd8h,
    smv,
    earnedStandardMinutes,
    targetStandardMinutes,
    netVarianceMinutes,
    realizedShiftEfficiencyPct,
    minuteUtilizationPct,
    lostMinutes,
    hourlyBreakdown,
    workstations,
    postShiftBalancing,
    signOff,
    lastUpdatedAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Simulates customized post-shift overtime working minutes scenario
 */
export function simulatePostShiftOvertimeScenario(
  base: Shift8hWorkingMinutesBalance,
  otMinutes: number,
  otManpower: number,
  expectedEfficiencyPct: number
) {
  const safeMinutes = Math.max(0, otMinutes);
  const safeMP = Math.max(1, otManpower);
  const safeEff = Math.max(1, Math.min(120, expectedEfficiencyPct));
  const safeSmv = Math.max(1, base.smv);

  const otAvailableMinutes = safeMP * safeMinutes;
  const otEarnedMinutes = Math.round(otAvailableMinutes * (safeEff / 100));
  const otExpectedOutputPcs = Math.round(otEarnedMinutes / safeSmv);

  const newTotalAchievedPcs = base.achievedProd8h + otExpectedOutputPcs;
  const newNetDeficitPcs = Math.max(0, base.targetProd8h - newTotalAchievedPcs);
  const isTargetAchievedWithOt = newTotalAchievedPcs >= base.targetProd8h;

  const combinedGrossAvailableMin = base.grossAvailableMinutes + otAvailableMinutes;
  const combinedEarnedMin = base.earnedStandardMinutes + otEarnedMinutes;
  const combinedOverallEffPct =
    combinedGrossAvailableMin > 0
      ? Math.round((combinedEarnedMin / combinedGrossAvailableMin) * 1000) / 10
      : 0;

  return {
    otMinutes: safeMinutes,
    otManpower: safeMP,
    expectedEfficiencyPct: safeEff,
    otAvailableMinutes,
    otEarnedMinutes,
    otExpectedOutputPcs,
    newTotalAchievedPcs,
    newNetDeficitPcs,
    isTargetAchievedWithOt,
    combinedGrossAvailableMin,
    combinedEarnedMin,
    combinedOverallEffPct
  };
}

/**
 * Formats a clean, text-based 8h Shift Working Minutes Balancing Audit Report for copying/printing
 */
export function generate8hBalancingReportText(
  line: LineEntry,
  balance: Shift8hWorkingMinutesBalance,
  userName: string = 'IE Engineer'
): string {
  const dateStr = line.date || 'Today';
  const totalLost =
    balance.lostMinutes.lineBalancingDelayMinutes +
    balance.lostMinutes.needleDowntimeMinutes +
    balance.lostMinutes.machineBreakdownMinutes +
    balance.lostMinutes.materialFeedingDelayMinutes +
    balance.lostMinutes.reworkAndAlterationMinutes +
    balance.lostMinutes.morningBriefingAndSetupMinutes +
    balance.lostMinutes.otherUnaccountedMinutes;

  return `===============================================================
DEBONAIR GROUP • UNIT-02 INDUSTRIAL ENGINEERING
FULL 8-HOUR SHIFT WORKING MINUTES BALANCING REPORT
===============================================================
Date: ${dateStr} | Shift: Full 8.0 Hours (08:00 - 17:00)
Line: ${line.lineNo} | Floor: ${line.floor}
Buyer: ${line.buyer} | Style: ${line.style}
Standard Minute Value (SMV): ${balance.smv} min
Audit Sign-off Status: ${balance.signOff.isSignedOff ? 'OFFICIALLY SIGNED OFF' : 'AUDIT PENDING REVIEW'}
Evaluated By: ${userName}

---------------------------------------------------------------
1. 8-HOUR WORKING MINUTES RECONCILIATION
---------------------------------------------------------------
• Present Manpower (MP): ${balance.totalPresentMP} (Operators: ${balance.operatorsPresent}, Helpers: ${balance.helpersPresent}, Iron: ${balance.ironManPresent})
• Gross Available Working Minutes: ${balance.grossAvailableMinutes.toLocaleString()} min (${balance.totalPresentMP} MP × 480 min)
• Target Production (8h): ${balance.targetProd8h.toLocaleString()} pcs (${balance.targetStandardMinutes.toLocaleString()} std min)
• Achieved Production (8h): ${balance.achievedProd8h.toLocaleString()} pcs (${balance.earnedStandardMinutes.toLocaleString()} std min)
• 8-Hour Realized Efficiency: ${balance.realizedShiftEfficiencyPct}% (Target: ${line.targetEff}%)
• Working Minutes Utilization: ${balance.minuteUtilizationPct}%
• Shift Net Variance: ${balance.netVarianceMinutes >= 0 ? '+' : ''}${balance.netVarianceMinutes.toLocaleString()} standard minutes

---------------------------------------------------------------
2. MINUTES DOWNTIME & BALANCING LOSS BREAKDOWN
---------------------------------------------------------------
Total Unearned / Lost Working Minutes: ${totalLost.toLocaleString()} min
1. Line Balancing Delay (Starvation/Blocking): ${balance.lostMinutes.lineBalancingDelayMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.lineBalancingDelayMinutes / (totalLost || 1)) * 100)}%)
2. Needle Downtime & Thread Breaks: ${balance.lostMinutes.needleDowntimeMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.needleDowntimeMinutes / (totalLost || 1)) * 100)}%)
3. Machine Breakdown & TPM Stops: ${balance.lostMinutes.machineBreakdownMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.machineBreakdownMinutes / (totalLost || 1)) * 100)}%)
4. Material Feeding / Cut Parts Delay: ${balance.lostMinutes.materialFeedingDelayMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.materialFeedingDelayMinutes / (totalLost || 1)) * 100)}%)
5. Quality Alteration & Rework: ${balance.lostMinutes.reworkAndAlterationMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.reworkAndAlterationMinutes / (totalLost || 1)) * 100)}%)
6. Morning Huddle & Startup/Clean: ${balance.lostMinutes.morningBriefingAndSetupMinutes.toLocaleString()} min (${Math.round((balance.lostMinutes.morningBriefingAndSetupMinutes / (totalLost || 1)) * 100)}%)
7. Other / Unaccounted Transit: ${balance.lostMinutes.otherUnaccountedMinutes.toLocaleString()} min

---------------------------------------------------------------
3. HOUR-BY-HOUR (H1 - H8) WORKING MINUTES AUDIT
---------------------------------------------------------------
${balance.hourlyBreakdown
  .map(
    h =>
      `[${h.hourLabel}] Actual: ${h.actualPcs} pcs | Target: ${h.targetPcs} pcs | Earned: ${h.earnedMinutes}m | Eff: ${h.efficiencyPct}% (${h.status})`
  )
  .join('\n')}

---------------------------------------------------------------
4. POST-8H SHIFT DEFICIT & OVERTIME (OT) BALANCING
---------------------------------------------------------------
• Deficit Output: ${balance.postShiftBalancing.deficitPcs} pcs (${balance.postShiftBalancing.deficitStandardMinutes.toLocaleString()} min needed)
• Overtime Decision: ${balance.postShiftBalancing.requiresOvertime ? `RECOMMENDED (${balance.postShiftBalancing.recommendedOtMinutes} min OT)` : 'NOT REQUIRED'}
• Recommended OT Manpower: ${balance.postShiftBalancing.recommendedOtManpower} workers (Lean Rebalance)
• Estimated OT Output: ${balance.postShiftBalancing.estimatedOtOutputPcs} pcs at ${balance.postShiftBalancing.otHourlyRatePcs} pcs/hr pace
• Rebalancing Directives:
${balance.postShiftBalancing.rebalanceActionPlan.map(a => `  - ${a}`).join('\n')}

Sign-Off Verdict: ${balance.signOff.shiftVerdict.toUpperCase()}
IE Remarks: ${balance.signOff.ieNotes || 'None'}
Generated: ${new Date().toLocaleString()}
===============================================================`;
}
