/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) Industrial Engineering Department
 * React Hook for Industrial IoT & Live Line Telemetry
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { LineEntry, LiveLineTelemetry } from '../types';
import {
  IotSensorNode,
  IotLineGateway,
  IotPulseEvent,
  IotLineStreamState,
  LiveStreamHourlyBucket
} from '../types/telemetry';
import { telemetryStreamService } from '../services/telemetryStreamService';

export interface UseLiveTelemetryStreamResult {
  streamState: IotLineStreamState;
  liveTelemetry: LiveLineTelemetry;
  sensors: IotSensorNode[];
  gateway: IotLineGateway;
  recentPulses: IotPulseEvent[];
  hourlyBuckets: Record<number, LiveStreamHourlyBucket>;
  isStreaming: boolean;
  toggleStreaming: (force?: boolean) => boolean;
  calibrateSensor: (sensorId: string, updates: Partial<IotSensorNode>) => void;
  triggerManualPulse: (stationId: string) => IotPulseEvent;
  injectDowntime: (stationId: string, reason: string) => void;
  syncHourlyBucket: (hourIndex: number, verifiedPcs: number) => void;
}

export function useLiveTelemetryStream(
  lineNo: string,
  baseLine?: LineEntry
): UseLiveTelemetryStreamResult {
  const [streamState, setStreamState] = useState<IotLineStreamState>(() =>
    telemetryStreamService.getOrCreateLineState(lineNo, baseLine)
  );

  useEffect(() => {
    // Re-initialize state if line changes
    const initial = telemetryStreamService.getOrCreateLineState(lineNo, baseLine);
    setStreamState(initial);

    // Subscribe to live stream updates
    const unsubscribe = telemetryStreamService.subscribe(lineNo, updatedState => {
      setStreamState(updatedState);
    });

    return () => {
      unsubscribe();
    };
  }, [lineNo, baseLine?.smv, baseLine?.targetProd, baseLine?.workingHours]);

  const toggleStreaming = useCallback(
    (force?: boolean) => {
      return telemetryStreamService.toggleStreaming(lineNo, force);
    },
    [lineNo]
  );

  const calibrateSensor = useCallback(
    (sensorId: string, updates: Partial<IotSensorNode>) => {
      telemetryStreamService.calibrateSensor(lineNo, sensorId, updates);
    },
    [lineNo]
  );

  const triggerManualPulse = useCallback(
    (stationId: string) => {
      return telemetryStreamService.triggerManualPulse(lineNo, stationId);
    },
    [lineNo]
  );

  const injectDowntime = useCallback(
    (stationId: string, reason: string) => {
      telemetryStreamService.injectDowntimeIncident(lineNo, stationId, reason);
    },
    [lineNo]
  );

  const syncHourlyBucket = useCallback(
    (hourIndex: number, verifiedPcs: number) => {
      telemetryStreamService.syncHourlyBucketWithManual(lineNo, hourIndex, verifiedPcs);
    },
    [lineNo]
  );

  return {
    streamState,
    liveTelemetry: streamState.liveTelemetry,
    sensors: streamState.sensors,
    gateway: streamState.gateway,
    recentPulses: streamState.recentPulses,
    hourlyBuckets: streamState.hourlyBuckets,
    isStreaming: streamState.isStreaming,
    toggleStreaming,
    calibrateSensor,
    triggerManualPulse,
    injectDowntime,
    syncHourlyBucket
  };
}
