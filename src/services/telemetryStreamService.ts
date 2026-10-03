/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) Industrial Engineering Department
 * Industrial IoT & Live Telemetry Stream Engine
 */

import { LineEntry, LiveLineTelemetry, LiveStationCycleTime, LiveWipStation } from '../types';
import {
  IotSensorNode,
  IotLineGateway,
  IotPulseEvent,
  IotLineStreamState,
  LiveStreamHourlyBucket
} from '../types/telemetry';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const DEFAULT_HOURLY_SLOTS = [
  { index: 1, time: '08:00 - 09:00' },
  { index: 2, time: '09:00 - 10:00' },
  { index: 3, time: '10:00 - 11:00' },
  { index: 4, time: '11:00 - 12:00' },
  { index: 5, time: '12:00 - 01:00' },
  { index: 6, time: '01:00 - 02:00' },
  { index: 7, time: '02:00 - 03:00' },
  { index: 8, time: '03:00 - 04:00' },
  { index: 9, time: '04:00 - 05:00' },
  { index: 10, time: '05:00 - 06:00' },
  { index: 11, time: '06:00 - 07:00' },
  { index: 12, time: '07:00 - 08:00' }
];

/**
 * Normalizes line string into standard zero-padded 2-digit format
 */
function normalizeLineKey(lineNo: string): string {
  const digits = lineNo.replace(/\D/g, '');
  return digits.padStart(2, '0');
}

class TelemetryStreamService {
  private lineStates: Map<string, IotLineStreamState> = new Map();
  private subscribers: Map<string, Set<(state: IotLineStreamState) => void>> = new Map();
  private timer: number | null = null;
  private stationElapsedSec: Map<string, number> = new Map();
  private lastFirestoreSync: Map<string, number> = new Map();

  constructor() {
    this.startGlobalTick();
  }

  /**
   * Initializes default gateway & 4 station edge sensor nodes for a sewing line
   */
  public getOrCreateLineState(lineNo: string, baseLine?: LineEntry): IotLineStreamState {
    const key = normalizeLineKey(lineNo);
    const existing = this.lineStates.get(key);
    if (existing) {
      if (baseLine && (!existing.liveTelemetry.pitchTimeSec || existing.liveTelemetry.pitchTimeSec === 0)) {
        this.recalibrateWithLine(key, baseLine);
      }
      return existing;
    }

    const smv = baseLine?.smv || 14.5;
    const workingHours = baseLine?.workingHours || 8;
    const targetProd = baseLine?.targetProd || 600;
    const targetHourly = Math.round(targetProd / workingHours) || 75;
    const operatorMP = baseLine?.plannedMP || 28;
    const standardPitchSec = Math.max(12, Math.round((smv * 60) / Math.max(1, operatorMP))) || 38;

    const bnName = baseLine?.bottleneck?.station || 'ST-02 Front Placket Join';
    const bnCycle = baseLine?.bottleneck?.cycleTime || Math.round(standardPitchSec * 1.22);

    const initialSensors: IotSensorNode[] = [
      {
        id: `sen-${key}-01`,
        stationId: 'st-01',
        stationName: 'ST-01 Input Loading & Batch Feed',
        sensorType: 'optic_counter',
        operatorName: 'Operator 01 (Batch Feeder)',
        connectionStatus: 'online',
        signalDbm: -56,
        ipAddress: `192.168.10.${parseInt(key, 10) * 4 + 1}`,
        debounceMs: 150,
        opticalSensitivityPct: 92,
        lastPulseTimestamp: Date.now() - 12000,
        lastObservedCycleSec: Math.round(standardPitchSec * 0.95),
        standardPitchSec: standardPitchSec,
        pulsesTodayCount: Math.round(targetHourly * 3.4),
        isBottleneckStation: false
      },
      {
        id: `sen-${key}-02`,
        stationId: 'st-02',
        stationName: bnName,
        sensorType: 'needle_pulse',
        operatorName: 'Operator 08 (Key Specialist)',
        connectionStatus: 'warning',
        signalDbm: -62,
        ipAddress: `192.168.10.${parseInt(key, 10) * 4 + 2}`,
        debounceMs: 180,
        opticalSensitivityPct: 88,
        lastPulseTimestamp: Date.now() - 18000,
        lastObservedCycleSec: bnCycle,
        standardPitchSec: standardPitchSec,
        pulsesTodayCount: Math.round(targetHourly * 3.2),
        isBottleneckStation: true,
        lastFaultAlert: bnCycle > standardPitchSec * 1.15 ? 'Cycle Overrun +22% vs Pitch' : undefined
      },
      {
        id: `sen-${key}-03`,
        stationId: 'st-03',
        stationName: 'ST-03 Mid-Line Section Joining',
        sensorType: 'current_sensor',
        operatorName: 'Operator 16 (Assembly)',
        connectionStatus: 'online',
        signalDbm: -58,
        ipAddress: `192.168.10.${parseInt(key, 10) * 4 + 3}`,
        debounceMs: 140,
        opticalSensitivityPct: 95,
        lastPulseTimestamp: Date.now() - 8000,
        lastObservedCycleSec: Math.round(standardPitchSec * 1.04),
        standardPitchSec: standardPitchSec,
        pulsesTodayCount: Math.round(targetHourly * 3.15),
        isBottleneckStation: false
      },
      {
        id: `sen-${key}-04`,
        stationId: 'st-04',
        stationName: 'ST-04 End-Line Inspection & QC Off-Line',
        sensorType: 'barcode_scanner',
        operatorName: 'QC Inspector 01',
        connectionStatus: 'online',
        signalDbm: -51,
        ipAddress: `192.168.10.${parseInt(key, 10) * 4 + 4}`,
        debounceMs: 200,
        opticalSensitivityPct: 98,
        lastPulseTimestamp: Date.now() - 5000,
        lastObservedCycleSec: Math.round(standardPitchSec * 0.98),
        standardPitchSec: standardPitchSec,
        pulsesTodayCount: baseLine?.achievedProd || Math.round(targetHourly * 3.1),
        isBottleneckStation: false
      }
    ];

    const gateway: IotLineGateway = {
      gatewayId: `GW-U02-L${key}`,
      lineNo: key,
      ipAddress: `192.168.10.${parseInt(key, 10) * 4}`,
      connectionStatus: 'connected',
      baudRate: 115200,
      packetRateHz: 1.25,
      signalQualityPct: 94,
      connectedSensorsCount: initialSensors.length,
      lastHeartbeatTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      firmwareVersion: 'v2.8.4-DebonairRTU'
    };

    const initialStations: LiveStationCycleTime[] = initialSensors.map(s => ({
      stationId: s.stationId,
      operationName: s.stationName,
      operatorName: s.operatorName,
      observedCycleTimeSec: s.lastObservedCycleSec,
      standardCycleTimeSec: s.standardPitchSec,
      pitchTimeSec: s.standardPitchSec,
      status: s.isBottleneckStation ? 'bottleneck' : s.lastObservedCycleSec < s.standardPitchSec * 0.9 ? 'optimal' : 'optimal',
      lastLoggedAt: 'IIoT Edge Gateway'
    }));

    const initialWip: LiveWipStation[] = [
      { stage: 'input_loading', label: '1. Input Loading & Cut Bundle Feed', wipPcs: Math.round(targetHourly * 0.4), bufferHours: 0.4, status: 'balanced' },
      { stage: 'front_assembly', label: '2. Front Body & Placket Bottleneck', wipPcs: Math.round(targetHourly * 0.65), bufferHours: 0.7, status: 'surging' },
      { stage: 'collar_cuff', label: '3. Collar, Cuff & Sleeve Joining', wipPcs: Math.round(targetHourly * 0.35), bufferHours: 0.35, status: 'balanced' },
      { stage: 'end_line_qco', label: '4. End-Line QC & Off-Line Transfer', wipPcs: Math.round(targetHourly * 0.25), bufferHours: 0.25, status: 'balanced' }
    ];

    const currentRate = baseLine?.achievedProd
      ? Math.round(baseLine.achievedProd / Math.max(1, workingHours))
      : Math.round(targetHourly * 0.92);

    const liveTelemetry: LiveLineTelemetry = {
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      isLiveMonitoring: true,
      averageCycleTimeSec: Math.round(initialSensors.reduce((acc, s) => acc + s.lastObservedCycleSec, 0) / initialSensors.length),
      targetCycleTimeSec: standardPitchSec,
      bottleneckCycleTimeSec: bnCycle,
      pitchTimeSec: standardPitchSec,
      cycleTimeStations: initialStations,
      currentHourlyRatePcs: currentRate,
      targetHourlyRatePcs: targetHourly,
      runRatePcsPerHour: Math.round(currentRate * 1.02),
      pacingVariancePcs: currentRate - targetHourly,
      pacingStatus: currentRate >= targetHourly ? 'on_pace' : currentRate >= targetHourly * 0.85 ? 'behind' : 'critical_lag',
      currentWipTotalPcs: baseLine?.wip || Math.round(targetHourly * 1.65),
      standardWipBufferPcs: Math.round(targetHourly * 1.5),
      wipBufferHours: parseFloat(((baseLine?.wip || targetHourly * 1.65) / currentRate).toFixed(1)),
      wipHealthStatus: 'buffer_safe',
      wipStations: initialWip,
      telemetryNotes: `IIoT Edge Gateway connected. 4 sensors active on Line ${key}.`
    };

    const hourlyBuckets: Record<number, LiveStreamHourlyBucket> = {};
    DEFAULT_HOURLY_SLOTS.forEach(slot => {
      const isPast = slot.index <= 4;
      const count = isPast ? Math.round(targetHourly * (0.88 + (slot.index % 3) * 0.05)) : 0;
      hourlyBuckets[slot.index] = {
        hourIndex: slot.index,
        timeSlot: slot.time,
        targetPcs: targetHourly,
        sensorCountPcs: count,
        manualVerifiedPcs: isPast ? count : undefined,
        divergencePcs: 0,
        downtimeMinutes: slot.index === 3 ? 4 : 0,
        isVerified: isPast
      };
    });

    const state: IotLineStreamState = {
      lineNo: key,
      isStreaming: true,
      simulationSpeedMultiplier: 1,
      gateway,
      sensors: initialSensors,
      liveTelemetry,
      recentPulses: [],
      hourlyBuckets
    };

    this.lineStates.set(key, state);
    return state;
  }

  private recalibrateWithLine(key: string, baseLine: LineEntry) {
    const state = this.lineStates.get(key);
    if (!state) return;
    const smv = baseLine.smv || 14.5;
    const operatorMP = baseLine.plannedMP || 28;
    const standardPitchSec = Math.max(12, Math.round((smv * 60) / Math.max(1, operatorMP))) || 38;
    const bnCycle = baseLine.bottleneck?.cycleTime || Math.round(standardPitchSec * 1.2);

    state.sensors.forEach(s => {
      s.standardPitchSec = standardPitchSec;
      if (s.isBottleneckStation) {
        s.lastObservedCycleSec = bnCycle;
      }
    });
    state.liveTelemetry.pitchTimeSec = standardPitchSec;
    state.liveTelemetry.targetCycleTimeSec = standardPitchSec;
    state.liveTelemetry.bottleneckCycleTimeSec = bnCycle;
  }

  /**
   * Subscribes a React component to live line updates
   */
  public subscribe(lineNo: string, callback: (state: IotLineStreamState) => void): () => void {
    const key = normalizeLineKey(lineNo);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback);

    // Initial state trigger
    const current = this.getOrCreateLineState(key);
    callback(current);

    return () => {
      const set = this.subscribers.get(key);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  /**
   * Toggles streaming mode on/off
   */
  public toggleStreaming(lineNo: string, force?: boolean): boolean {
    const key = normalizeLineKey(lineNo);
    const state = this.getOrCreateLineState(key);
    state.isStreaming = force !== undefined ? force : !state.isStreaming;
    state.liveTelemetry.isLiveMonitoring = state.isStreaming;
    state.gateway.connectionStatus = state.isStreaming ? 'connected' : 'offline';
    this.notifySubscribers(key);
    return state.isStreaming;
  }

  /**
   * Calibrates sensor parameters (debounce, sensitivity, operator)
   */
  public calibrateSensor(lineNo: string, sensorId: string, updates: Partial<IotSensorNode>): void {
    const key = normalizeLineKey(lineNo);
    const state = this.getOrCreateLineState(key);
    const sensor = state.sensors.find(s => s.id === sensorId);
    if (sensor) {
      Object.assign(sensor, updates);
      this.notifySubscribers(key);
    }
  }

  /**
   * Injects a piece pulse event into the station stream
   */
  public triggerManualPulse(lineNo: string, stationId: string): IotPulseEvent {
    const key = normalizeLineKey(lineNo);
    const state = this.getOrCreateLineState(key);
    const sensor = state.sensors.find(s => s.stationId === stationId) || state.sensors[0];

    sensor.pulsesTodayCount += 1;
    sensor.lastPulseTimestamp = Date.now();
    const cycleSec = sensor.lastObservedCycleSec;
    const variance = cycleSec - sensor.standardPitchSec;

    const pulseEvent: IotPulseEvent = {
      lineNo: key,
      stationId: sensor.stationId,
      stationName: sensor.stationName,
      sensorId: sensor.id,
      timestamp: Date.now(),
      cycleDurationSec: cycleSec,
      pitchDurationSec: sensor.standardPitchSec,
      varianceSec: variance,
      isBottleneck: !!sensor.isBottleneckStation,
      pulseIndex: sensor.pulsesTodayCount
    };

    // Add to recent pulses ring buffer (max 20)
    state.recentPulses.unshift(pulseEvent);
    if (state.recentPulses.length > 20) {
      state.recentPulses.pop();
    }

    // Update hourly bucket
    const currentHourIndex = this.getCurrentHourIndex();
    if (state.hourlyBuckets[currentHourIndex]) {
      state.hourlyBuckets[currentHourIndex].sensorCountPcs += 1;
      const verified = state.hourlyBuckets[currentHourIndex].manualVerifiedPcs || 0;
      state.hourlyBuckets[currentHourIndex].divergencePcs =
        state.hourlyBuckets[currentHourIndex].sensorCountPcs - verified;
    }

    // Refresh live metrics
    this.recomputeTelemetryMetrics(state);
    this.notifySubscribers(key);

    return pulseEvent;
  }

  /**
   * Simulates a machine stoppage / downtime incident
   */
  public injectDowntimeIncident(lineNo: string, stationId: string, reason: string): void {
    const key = normalizeLineKey(lineNo);
    const state = this.getOrCreateLineState(key);
    const sensor = state.sensors.find(s => s.stationId === stationId);
    if (sensor) {
      sensor.connectionStatus = 'warning';
      sensor.lastFaultAlert = `Stoppage: ${reason}`;
    }

    state.lastDowntimeStoppage = {
      stationId,
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      durationMinutes: 6,
      reason
    };

    const currentHour = this.getCurrentHourIndex();
    if (state.hourlyBuckets[currentHour]) {
      state.hourlyBuckets[currentHour].downtimeMinutes += 6;
    }

    this.notifySubscribers(key);
  }

  /**
   * Synchronizes verified pieces from manual entry modal into hourly bucket
   */
  public syncHourlyBucketWithManual(lineNo: string, hourIndex: number, verifiedPcs: number): void {
    const key = normalizeLineKey(lineNo);
    const state = this.getOrCreateLineState(key);
    if (state.hourlyBuckets[hourIndex]) {
      state.hourlyBuckets[hourIndex].manualVerifiedPcs = verifiedPcs;
      state.hourlyBuckets[hourIndex].isVerified = true;
      state.hourlyBuckets[hourIndex].divergencePcs =
        state.hourlyBuckets[hourIndex].sensorCountPcs - verifiedPcs;
      this.notifySubscribers(key);
    }
  }

  private getCurrentHourIndex(): number {
    const h = new Date().getHours();
    // 08:00 is hour 1, 09:00 is hour 2 ... 19:00 is hour 12
    if (h < 8) return 1;
    if (h >= 20) return 12;
    return h - 7;
  }

  private startGlobalTick() {
    if (typeof window === 'undefined') return;
    this.timer = window.setInterval(() => {
      this.lineStates.forEach((state, key) => {
        if (!state.isStreaming) return;
        this.processLineStreamTick(state, key);
      });
    }, 1000);
  }

  private processLineStreamTick(state: IotLineStreamState, lineKey: string) {
    let stateChanged = false;

    // Advance elapsed seconds per station
    state.sensors.forEach(sensor => {
      const stationKey = `${lineKey}-${sensor.stationId}`;
      const elapsed = (this.stationElapsedSec.get(stationKey) || 0) + 1 * state.simulationSpeedMultiplier;

      // Realistic target duration with slight jitter
      const targetDuration = sensor.lastObservedCycleSec;

      if (elapsed >= targetDuration) {
        // Complete cycle!
        this.stationElapsedSec.set(stationKey, 0);
        sensor.pulsesTodayCount += 1;
        sensor.lastPulseTimestamp = Date.now();

        // Introduce organic subtle cycle variation for garment operations
        const jitter = (Math.random() - 0.48) * 1.8;
        const newSec = Math.max(10, parseFloat((sensor.standardPitchSec * (sensor.isBottleneckStation ? 1.2 : 0.98) + jitter).toFixed(1)));
        sensor.lastObservedCycleSec = newSec;

        // If end station, record finished piece pulse
        if (sensor.sensorType === 'barcode_scanner' || sensor.stationId === 'st-04') {
          const currentHour = this.getCurrentHourIndex();
          if (state.hourlyBuckets[currentHour]) {
            state.hourlyBuckets[currentHour].sensorCountPcs += 1;
          }

          const pulseEvent: IotPulseEvent = {
            lineNo: lineKey,
            stationId: sensor.stationId,
            stationName: sensor.stationName,
            sensorId: sensor.id,
            timestamp: Date.now(),
            cycleDurationSec: newSec,
            pitchDurationSec: sensor.standardPitchSec,
            varianceSec: newSec - sensor.standardPitchSec,
            isBottleneck: false,
            pulseIndex: sensor.pulsesTodayCount
          };

          state.recentPulses.unshift(pulseEvent);
          if (state.recentPulses.length > 20) {
            state.recentPulses.pop();
          }
        }

        stateChanged = true;
      } else {
        this.stationElapsedSec.set(stationKey, elapsed);
      }
    });

    if (stateChanged) {
      this.recomputeTelemetryMetrics(state);
      this.notifySubscribers(lineKey);
      this.debouncedFirestoreSync(lineKey, state);
    }
  }

  private recomputeTelemetryMetrics(state: IotLineStreamState) {
    const pitch = state.sensors[0]?.standardPitchSec || 38;
    const avgCT = Math.round(state.sensors.reduce((acc, s) => acc + s.lastObservedCycleSec, 0) / state.sensors.length);
    const maxCT = Math.max(...state.sensors.map(s => s.lastObservedCycleSec));
    const bnSensor = state.sensors.find(s => s.lastObservedCycleSec === maxCT) || state.sensors[1];

    const currentHourIndex = this.getCurrentHourIndex();
    const currentHourlyCount = state.hourlyBuckets[currentHourIndex]?.sensorCountPcs || 65;
    const targetHourly = state.hourlyBuckets[currentHourIndex]?.targetPcs || 75;

    // Instant run-rate extrapolated from average cycle time
    const instantRunRate = avgCT > 0 ? Math.round(3600 / avgCT) : currentHourlyCount;

    state.liveTelemetry = {
      ...state.liveTelemetry,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      averageCycleTimeSec: avgCT,
      targetCycleTimeSec: pitch,
      bottleneckCycleTimeSec: maxCT,
      pitchTimeSec: pitch,
      currentHourlyRatePcs: currentHourlyCount,
      targetHourlyRatePcs: targetHourly,
      runRatePcsPerHour: instantRunRate,
      pacingVariancePcs: currentHourlyCount - targetHourly,
      pacingStatus:
        currentHourlyCount >= targetHourly
          ? 'ahead'
          : currentHourlyCount >= targetHourly * 0.9
          ? 'on_pace'
          : currentHourlyCount >= targetHourly * 0.8
          ? 'behind'
          : 'critical_lag',
      cycleTimeStations: state.sensors.map(s => ({
        stationId: s.stationId,
        operationName: s.stationName,
        operatorName: s.operatorName,
        observedCycleTimeSec: s.lastObservedCycleSec,
        standardCycleTimeSec: s.standardPitchSec,
        pitchTimeSec: pitch,
        status: s.lastObservedCycleSec > pitch * 1.15 ? 'bottleneck' : s.lastObservedCycleSec < pitch * 0.85 ? 'starved' : 'optimal',
        lastLoggedAt: 'IIoT Pulse'
      }))
    };
  }

  private notifySubscribers(lineKey: string) {
    const subs = this.subscribers.get(lineKey);
    const state = this.lineStates.get(lineKey);
    if (subs && state) {
      subs.forEach(cb => cb({ ...state }));
    }
  }

  /**
   * Debounced cloud sync to Firestore (every 15 seconds per line at most)
   */
  private async debouncedFirestoreSync(lineKey: string, state: IotLineStreamState) {
    const now = Date.now();
    const last = this.lastFirestoreSync.get(lineKey) || 0;
    if (now - last < 15000) return;
    this.lastFirestoreSync.set(lineKey, now);

    try {
      if (db) {
        const streamDocRef = doc(db, 'telemetry_live', `line_${lineKey}`);
        await setDoc(streamDocRef, {
          lineNo: lineKey,
          lastUpdated: state.liveTelemetry.lastUpdated,
          isLiveMonitoring: state.isStreaming,
          averageCycleTimeSec: state.liveTelemetry.averageCycleTimeSec,
          bottleneckCycleTimeSec: state.liveTelemetry.bottleneckCycleTimeSec,
          pitchTimeSec: state.liveTelemetry.pitchTimeSec,
          currentHourlyRatePcs: state.liveTelemetry.currentHourlyRatePcs,
          targetHourlyRatePcs: state.liveTelemetry.targetHourlyRatePcs,
          runRatePcsPerHour: state.liveTelemetry.runRatePcsPerHour,
          pacingStatus: state.liveTelemetry.pacingStatus,
          activeSensorsCount: state.sensors.length,
          lastSyncedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch {
      // Non-blocking in offline or unauthenticated mode
    }
  }
}

// Global Singleton Instance
export const telemetryStreamService = new TelemetryStreamService();
