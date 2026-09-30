# Industrial IoT & Live Line Telemetry Sensor Integration Roadmap

## Executive Summary
This architectural implementation plan defines the complete engineering specification for integrating Industrial IoT (IIoT) edge sensor telemetry into the Debonair LTD (Unit-02) Industrial Engineering Cockpit. Focusing on the **Line Data & Hourly Production Tracking** module, this architecture bridges hardware edge-station sensors (photoelectric cycle counters, pneumatic needle-stroke timers, and IoT clamp ammeters) with real-time browser streams, automated takt bottleneck detection, and Firestore cloud synchronization.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of Confirmed Choices from Phase 1 Consultation:**
> - **Primary Objective**: Industrial IoT and live line telemetry sensor integration across 34 active sewing lines.
> - **Immediate Priority Module**: Line Data and Hourly Production tracking (takt cycle observation, station pacing, live WIP accumulation).
> - **Architectural Scope**: Phased execution roadmap with end-to-end UX flows, ASCII telemetry architecture diagrams, and Firestore schema definitions.
>
> **Recommended Decision Gates for Implementation:**
> 1. **Sensor Transport Protocol**: We recommend an HTTP/WebSocket Edge Gateway emulator with Firestore document stream synchronization (`/factories/unit-02/telemetry_streams/{lineNo}`) to provide zero-latency local updates with robust cloud persistence.
> 2. **Telemetry Sampling Rate**: 1-second rolling window client aggregation with 10-second batch flushes to avoid Firestore write-quota exhaustion while maintaining sub-second UI tactile responsiveness.

---

## 1. Overview & Core Concept

### 1.1 What It Does
Transforms the manual line-data entry paradigm into an **IIoT-Augmented Live Manufacturing Execution Hub**. Edge optical/switch sensors installed across key sewing stations (e.g., ST-01 Input Loader, ST-02 Key Bottleneck, ST-03 Mid-Assembly, ST-04 Inspection) stream live piece passes and needle run-time directly into the workstation UI. Operators and line IEs see live cycle times, automatic bottleneck alerts, running hourly outputs, and WIP buffer health without requiring manual stopwatch studies.

### 1.2 Target Audience & Personas
- **Floor Line IEs & Supervisors**: Carry tablets or smartphones on the floor to monitor real-time cycle variances against SMV targets and unblock starving stations.
- **Station Operators**: Receive instant visual pacing cues (tactile green/amber/red indicators) to maintain line balancing.
- **IE Department Executives & Wing Managers**: View aggregated plant-wide telemetry, throughput paces, and loss Pareto trends in the Executive Cockpit.

### 1.3 Key Value Delivered
- **Zero-Latency Bottleneck Isolation**: Identifies station cycle overrun within 3 piece cycles instead of waiting for end-of-shift audits.
- **Automated Hourly Production Logging**: Pre-populates hourly slots with verified sensor output counts, eliminating double-entry discrepancy between production and IE records.
- **Predictive Floor Balancing**: Compares live station pitch times against theoretical SMV targets in real time.

---

## 2. User Experience & Visual Design

### 2.1 Key User Flows

#### Flow A: Live Line Telemetry HUD Walkthrough
1. **Zero State / Navigation**: User opens **Line Data** (`LineDataPage.tsx`). Lines with active IIoT telemetry streams exhibit a glowing emerald pulse beacon with real-time cycle ticks.
2. **Telemetry Console Activation**: User taps the **"Live Telemetry HUD"** toggle on any line. An asymmetric split console expands showing:
   - Live Takt Gauge (current observed cycle time vs. target SMV pitch time).
   - Real-Time Hourly Output Pacing sparkline (actual vs. takt target line).
   - Sub-Assembly Station Pipeline (Input $\rightarrow$ Bottleneck $\rightarrow$ Assembly $\rightarrow$ Inspection) with live piece counters.
3. **Manual Override & Calibration**: An authorized Line IE can tap any sensor node to calibrate trigger thresholds, flag machine maintenance, or override counts if optical sensors detect bundle skips.

#### Flow B: IIoT Sensor Stream Simulation & Edge Device Pairing
1. **IoT Edge Hub Modal**: Accessible via the Settings / Line Data toolbar. Shows all 34 line controller gateways with connection status (Online / Emulated / Signal Weak).
2. **Live Feed Injection**: For testing and floor dry-runs, an industrial stream emulator allows simulating cycle delays, motor stoppages, and surge scenarios with slider controls.

### 2.2 Visual Identity & Theme (Domain: Science & Industrial Telemetry)
Adhering to the **Science, Space & Biotech / Precision Telemetry** design constitution:
- **60-30-10 Color Hierarchy**:
  - **60% Neutral Canvas**: Pristine factory canvas (`#fbfaf6` in light mode, `#0d131a` obsidian slate in dark mode).
  - **30% Structural Panels**: Hairline-bordered technical console panels (`#f1eee6` / `#16202c`), crisp 1px borders (`#d9d2c2` / `#233245`), no heavy blurred drop shadows.
  - **10% Calibrated Telemetry Accents**:
    - Phosphor Emerald (`#10b981`): Balanced takt, running nominal.
    - Telemetry Amber (`#f59e0b`): Station cycle nearing $+15\%$ over pitch.
    - Alert Crimson (`#ef4444`): Severe bottleneck choke ($>+20\%$ cycle overrun, station starved).
    - Deep Debonair Teal (`#176f78`): Brand primary controls and active selectors.
- **Zero-Pill Discipline**: Metadata (timestamps, sensor IDs, baud rates, packet health) are styled as quiet unboxed text separated by typographic middots (`·` or `/`), never wrapped in pill badges.
- **Tabular Monospace Numerals**: All live outputs, cycle seconds, SMV decimal minutes, and variance metrics strictly use `font-mono tabular-nums` to eliminate numeric layout jitter.
- **Layout Integrity & Ergonomics**:
  - Minimum 44px touch hitboxes for all interactive sensor toggles.
  - Asymmetric console structure: Left sticky line selector and parameter column, right expansive live stream telemetry grid.

---

## 3. Key Product Decisions & Trade-Offs

### 3.1 Edge Gateway Communication & Cloud Persistence
- **Chosen Approach**: Hybrid Local State Aggregator + Firestore Snapshot Stream. The client application connects to a simulated/Websocket Edge Gateway service for high-frequency 1Hz sensor ticks, while committing debounced 10-second summaries and hourly rollups to Firestore (`/factories/unit-02/telemetry_streams/{lineNo}`).
- **Why**: Keeps the UI ultra-smooth at 60fps without overwhelming Firestore write limits or billing quotas, while guaranteeing multi-user synchronized visibility for executives.
- **Alternatives Considered**: Direct Firestore write on every sensor pulse (discarded: exceeds free/standard tier write limits at 34 lines $\times$ 4 stations).

### 3.2 Sensor Fallback & Operator Trust
- **Chosen Approach**: Bi-directional reconciliation. If an IoT sensor goes offline or an operator reports miscounts, the Line IE can toggle **"Manual Calibration"** mode to adjust the baseline count while retaining an audit trail in the change log.
- **Why**: Factory floor environments frequently experience physical obstructions, thread lint on optical sensors, or power trips. Trust requires easy manual calibration.

---

## 4. Technical Architecture & Data Strategy

### 4.1 System & Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SHOP FLOOR PHYSICAL / SENSOR LAYER                    │
│                                                                             │
│  [Station 1: Input]       [Station 2: Bottleneck]    [Station 4: Off-Line] │
│   Photoelectric Optic       Needle Stroke Sensor       QC Barcode Scanner   │
│         │                           │                          │            │
└─────────┼───────────────────────────┼──────────────────────────┼────────────┘
          │ (GPIO Pulse / Modbus)     │                          │
          ▼                           ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IIoT EDGE CONTROLLER GATEWAY (Node/C++)                │
│  - Debounces switch contacts (150ms lockout window)                         │
│  - Computes instantaneous cycle time (t_last_pulse - t_current)             │
│  - Broadcasts WebSocket JSON packet: { lineNo, stationId, cycleSec, count } │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BROWSER APPLICATION ENGINE (React/TS)                  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ useLiveTelemetryStream Hook (Local Ring Buffer & 1Hz Aggregator)    │   │
│   └───────────────────┬─────────────────────────────┬───────────────────┘   │
│                       │                             │                       │
│                       ▼                             ▼                       │
│   ┌──────────────────────────────┐ ┌────────────────────────────────────┐   │
│   │ LineDataPage Telemetry HUD   │ │ QuickHourlyProductionModal Sync    │   │
│   │ - Live Takt Gauge & Waves    │ │ - Pre-populates actual hourly pcs  │   │
│   │ - Station Pipeline Status    │ │ - Auto-computes bottleneck pace    │   │
│   │ - Bottleneck Severity Radar  │ │ - 1-tap submission to shift report │   │
│   └──────────────────────────────┘ └────────────────────────────────────┘   │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Debounced Batch Sync (10s)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  FIRESTORE PERSISTENT CLUSTER (Unit-02 DB)                  │
│                                                                             │
│   Collection: telemetry_live/{lineNo}  -> Instantaneous sensor states       │
│   Collection: line_hourly_records      -> Permanent hourly IE logs          │
│   Collection: downtime_incidents       -> Automated sensor stoppage flags   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Models & TypeScript Schema

```typescript
// Live Sensor Pulse Event
export interface IotSensorPulseEvent {
  lineNo: string;
  stationId: string;
  stationName: string;
  pulseTimestamp: number;
  observedCycleSec: number;
  standardPitchSec: number;
  pulseType: 'piece_complete' | 'needle_run' | 'downtime_stop';
}

// Aggregated Line Telemetry State
export interface LiveLineTelemetryState {
  lineNo: string;
  lastUpdated: string;
  isStreaming: boolean;
  activeSensorsCount: number;
  instantRunRatePcsPerHour: number;
  targetTaktRatePcsPerHour: number;
  averageCycleTimeSec: number;
  pitchTimeSec: number;
  bottleneckStation: {
    stationId: string;
    stationName: string;
    observedCycleSec: number;
    severity: 'optimal' | 'warning' | 'critical';
  };
  stations: Array<{
    stationId: string;
    stationName: string;
    operatorName: string;
    currentCycleSec: number;
    standardCycleSec: number;
    pieceCountToday: number;
    status: 'optimal' | 'surging' | 'bottleneck' | 'starved' | 'offline';
  }>;
  hourlyBuckets: Record<number, {
    targetPcs: number;
    sensorActualPcs: number;
    verifiedPcs: number;
    downtimeMinutes: number;
  }>;
}
```

---

## 5. Phased Execution Roadmap

### Phase 1: Telemetry Stream Core & Sensor Gateway Simulation
- Implement `useLiveTelemetryStream` custom hook with configurable sensor intervals and realistic garment sewing variance algorithms.
- Establish Firestore listener and synchronization service for real-time document pushes.
- Provide edge gateway status indicator (Signal Quality, Baud Rate, Last Packet).

### Phase 2: Line Data Telemetry HUD & Station Pipeline Widget
- Upgrade `LineData.tsx` and `LineDataPage.tsx` with the collapsible **Live Telemetry HUD**.
- Build the 4-Stage Visual Station Pipeline (Input $\rightarrow$ Front Body $\rightarrow$ Assembly $\rightarrow$ QC) showing live piece flow and buffer accumulation.
- Add live bottleneck severity beacon with real-time overrun alerts.

### Phase 3: Automated Hourly Production Table Integration
- Wire `QuickHourlyProductionModal.tsx` and `HourlyPacingTab.tsx` directly to the live sensor aggregates.
- Enable auto-fill for hourly slots so Line IEs simply verify and sign off rather than manually typing counts.
- Add sensor variance flag when manual entry deviates significantly from sensor telemetry.

### Phase 4: Field Calibration & Industrial Sensor Settings Console
- Create `IotSensorCalibrationModal.tsx` allowing supervisors to adjust debounce times, sensor optical sensitivities, and station assignments.
- Test under mobile and tablet viewports to guarantee 44px+ touch compliance and zero layout jitter.

---

## 6. Verification & Quality Acceptance Criteria
1. **Zero Layout Jitter**: Fluctuating cycle values use `font-mono tabular-nums` and fixed column widths; no DOM elements shift position during 1Hz updates.
2. **Quota & Performance Safety**: Firestore writes are batched and debounced; memory footprint of the live pulse ring buffer is strictly capped at 120 samples per line.
3. **Responsive Ergonomics**: Full usability across 390px (mobile), 768px (tablet), and 1440px (desktop console).
4. **Complete Compilation**: Codebase builds cleanly with `compile_applet` and zero TypeScript/lint errors (`tsc --noEmit`).
