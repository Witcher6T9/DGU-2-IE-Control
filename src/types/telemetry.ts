/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) Industrial Engineering Department
 * Industrial IoT (IIoT) & Live Telemetry Stream Types
 */

import { LiveStationCycleTime, LiveWipStation, LiveLineTelemetry } from '../types';

export type SensorNodeType =
  | 'optic_counter'       // Photoelectric thru-beam cycle counter
  | 'needle_pulse'        // Pneumatic needle-stroke timer on sewing head
  | 'barcode_scanner'     // Final QC off-line bundle scanner
  | 'current_sensor';     // IoT clamp ammeter monitoring motor active runtime

export type SensorConnectionStatus = 'online' | 'warning' | 'offline' | 'calibrating';

export interface IotSensorNode {
  id: string;
  stationId: string;
  stationName: string;
  sensorType: SensorNodeType;
  operatorName: string;
  connectionStatus: SensorConnectionStatus;
  signalDbm: number;            // e.g. -54 dBm (Wi-Fi/Zigbee/Modbus gateway)
  ipAddress: string;            // e.g. 192.168.10.14
  debounceMs: number;           // Lockout time to prevent false triggers, e.g. 150ms
  opticalSensitivityPct: number;// Sensitivity threshold 0-100%
  lastPulseTimestamp: number;   // Epoch ms of last detected piece pass
  lastObservedCycleSec: number; // Cycle duration in seconds
  standardPitchSec: number;     // Target SMV pitch time in seconds
  pulsesTodayCount: number;     // Cumulative pieces counted today
  isBottleneckStation?: boolean;// Flags whether this node is the key bottleneck
  lastFaultAlert?: string;      // Error flag e.g. 'Optical beam blocked > 90s'
}

export interface IotLineGateway {
  gatewayId: string;
  lineNo: string;
  ipAddress: string;
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
  baudRate: number;              // 115200 for industrial RS-485 / Modbus RTU
  packetRateHz: number;          // e.g. 1.2 packets / sec
  signalQualityPct: number;      // 0-100%
  connectedSensorsCount: number;
  lastHeartbeatTime: string;
  firmwareVersion: string;
}

export interface IotPulseEvent {
  lineNo: string;
  stationId: string;
  stationName: string;
  sensorId: string;
  timestamp: number;
  cycleDurationSec: number;
  pitchDurationSec: number;
  varianceSec: number;
  isBottleneck: boolean;
  pulseIndex: number;
}

export interface LiveStreamHourlyBucket {
  hourIndex: number;
  timeSlot: string;
  targetPcs: number;
  sensorCountPcs: number;
  manualVerifiedPcs?: number;
  divergencePcs: number;
  downtimeMinutes: number;
  isVerified: boolean;
}

export interface IotLineStreamState {
  lineNo: string;
  isStreaming: boolean;
  simulationSpeedMultiplier: number; // 1x, 2x, 5x for simulation testing
  gateway: IotLineGateway;
  sensors: IotSensorNode[];
  liveTelemetry: LiveLineTelemetry;
  recentPulses: IotPulseEvent[];     // Ring buffer (last 20 pulses for sparkline)
  hourlyBuckets: Record<number, LiveStreamHourlyBucket>;
  lastDowntimeStoppage?: {
    stationId: string;
    startedAt: string;
    durationMinutes: number;
    reason: string;
  };
}
