/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) Industrial Engineering Department
 * Live Telemetry HUD: Industrial IoT Station Pipeline & Takt Console
 */

import React, { useState } from 'react';
import {
  Radio,
  Activity,
  Cpu,
  Gauge,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Sliders,
  Play,
  Pause,
  Plus,
  Zap,
  TrendingUp,
  Settings,
  ShieldCheck,
  ChevronRight,
  Flame,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LineEntry } from '../types';
import { useLiveTelemetryStream } from '../hooks/useLiveTelemetryStream';
import { IotSensorNode } from '../types/telemetry';

interface LiveTelemetryHUDProps {
  line: LineEntry;
  onOpenHourlyModal?: () => void;
  onOpenCalibrationModal?: (sensor?: IotSensorNode) => void;
  isCompact?: boolean;
}

export const LiveTelemetryHUD: React.FC<LiveTelemetryHUDProps> = ({
  line,
  onOpenHourlyModal,
  onOpenCalibrationModal,
  isCompact = false
}) => {
  const {
    streamState,
    liveTelemetry,
    sensors,
    gateway,
    recentPulses,
    isStreaming,
    toggleStreaming,
    triggerManualPulse,
    injectDowntime
  } = useLiveTelemetryStream(line.lineNo, line);

  const [lastPulsedStation, setLastPulsedStation] = useState<string | null>(null);

  const handlePulse = (stationId: string) => {
    triggerManualPulse(stationId);
    setLastPulsedStation(stationId);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
    setTimeout(() => {
      setLastPulsedStation(prev => (prev === stationId ? null : prev));
    }, 600);
  };

  const avgCycle = liveTelemetry.averageCycleTimeSec;
  const pitchTime = liveTelemetry.pitchTimeSec || 38;
  const bnCycle = liveTelemetry.bottleneckCycleTimeSec;
  const cycleVariance = avgCycle - pitchTime;
  const currentHourlyRate = liveTelemetry.currentHourlyRatePcs;
  const targetHourlyRate = liveTelemetry.targetHourlyRatePcs;
  const pacingDelta = currentHourlyRate - targetHourlyRate;

  // Key bottleneck sensor node
  const bottleneckSensor = sensors.find(s => s.isBottleneckStation) || sensors[1];
  const isBottleneckSevere = bottleneckSensor && bottleneckSensor.lastObservedCycleSec >= pitchTime * 1.18;

  return (
    <div className="rounded-3xl border border-[#d9d2c2] bg-[#fbfaf6] dark:bg-[#121820] text-[#17343a] dark:text-slate-100 shadow-xs overflow-hidden transition-all">
      {/* 1. TOP TELEMETRY RIBBON: GATEWAY STATUS & BAUD RATE */}
      <div className="px-4 py-2.5 bg-[#f1eee6] dark:bg-[#18212c] border-b border-[#d9d2c2] dark:border-[#263445] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className="font-mono font-bold tracking-tight text-xs uppercase text-[#176f78] dark:text-teal-300">
              IIoT Edge Gateway {gateway.gatewayId}
            </span>
          </div>

          <span className="text-[#527078] dark:text-slate-400" aria-hidden="true">·</span>

          {/* Unboxed metadata tags */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-[#527078] dark:text-slate-400 font-mono">
            <span>{gateway.ipAddress}</span>
            <span aria-hidden="true">·</span>
            <span>{gateway.baudRate} Baud</span>
            <span aria-hidden="true">·</span>
            <span>{gateway.packetRateHz} pkt/s</span>
            <span aria-hidden="true">·</span>
            <span>{gateway.connectedSensorsCount} Nodes Active</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Live Stream */}
          <button
            type="button"
            onClick={() => toggleStreaming()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 border ${
              isStreaming
                ? 'bg-white dark:bg-[#1f2937] hover:bg-slate-100 dark:hover:bg-[#283546] border-[#d9d2c2] dark:border-[#374558] text-[#17343a] dark:text-slate-200 shadow-2xs'
                : 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs'
            }`}
          >
            {isStreaming ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-600" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-white" />
                <span>Resume Stream</span>
              </>
            )}
          </button>

          {/* Calibration Modal Trigger */}
          {onOpenCalibrationModal && (
            <button
              type="button"
              onClick={() => onOpenCalibrationModal()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#1f2937] hover:bg-slate-50 dark:hover:bg-[#283546] border border-[#d9d2c2] dark:border-[#374558] text-xs font-bold text-[#176f78] dark:text-teal-300 transition-colors cursor-pointer touch-manipulation shadow-2xs"
              title="Calibrate Edge Sensor Hardware"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calibrate Sensors</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. CORE TELEMETRY CONSOLE: TAKT METRICS & BOTTLENECK RADAR */}
      <div className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* A. Live Hourly Run-Rate */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a232f] border border-[#d9d2c2] dark:border-[#2a3748] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 block">
              Live Hourly Run-Rate
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#176f78] dark:text-teal-400 tabular-nums">
                {currentHourlyRate}
              </span>
              <span className="text-xs font-mono uppercase text-[#527078] dark:text-slate-400">
                pcs / hr
              </span>
            </div>
            <div className="text-[11px] font-mono mt-1 flex items-center gap-1 text-[#527078] dark:text-slate-400">
              <span>Target: {targetHourlyRate} pcs</span>
              <span aria-hidden="true">·</span>
              <span className={`font-bold ${pacingDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {pacingDelta >= 0 ? `+${pacingDelta}` : pacingDelta} pace
              </span>
            </div>
          </div>

          {/* B. Observed Line Cycle vs. Pitch */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a232f] border border-[#d9d2c2] dark:border-[#2a3748] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 block">
              Observed Cycle (Avg)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-[#17343a] dark:text-white tabular-nums">
                {avgCycle}
              </span>
              <span className="text-xs font-mono uppercase text-[#527078] dark:text-slate-400">
                sec
              </span>
            </div>
            <div className="text-[11px] font-mono mt-1 flex items-center gap-1 text-[#527078] dark:text-slate-400">
              <span>Takt Pitch: {pitchTime}s</span>
              <span aria-hidden="true">·</span>
              <span className={`font-bold ${cycleVariance <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {cycleVariance > 0 ? `+${cycleVariance}s lag` : `${Math.abs(cycleVariance)}s lead`}
              </span>
            </div>
          </div>

          {/* C. Key Bottleneck Station Sensor */}
          <div className={`p-3.5 rounded-2xl border shadow-2xs transition-colors ${
            isBottleneckSevere
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
              : 'bg-white dark:bg-[#1a232f] border-[#d9d2c2] dark:border-[#2a3748]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                <span>Station Bottleneck</span>
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
                {bnCycle}s
              </span>
            </div>
            <div className="mt-1 font-bold text-xs text-[#17343a] dark:text-white truncate" title={bottleneckSensor.stationName}>
              {bottleneckSensor.stationName}
            </div>
            <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono mt-1 flex items-center gap-1">
              <span>Overrun: +{Math.max(0, bnCycle - pitchTime)}s vs pitch</span>
              {isBottleneckSevere && <span className="font-extrabold text-[9px] uppercase tracking-wider bg-rose-600 text-white px-1 rounded">Choked</span>}
            </div>
          </div>

          {/* D. Live WIP Buffer Hours */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a232f] border border-[#d9d2c2] dark:border-[#2a3748] shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#527078] dark:text-slate-400 block">
              WIP Buffer Coverage
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono text-2xl sm:text-3xl font-black text-amber-700 dark:text-amber-400 tabular-nums">
                {liveTelemetry.wipBufferHours}
              </span>
              <span className="text-xs font-mono uppercase text-[#527078] dark:text-slate-400">
                hrs
              </span>
            </div>
            <div className="text-[11px] font-mono mt-1 flex items-center gap-1 text-[#527078] dark:text-slate-400">
              <span>Total: {liveTelemetry.currentWipTotalPcs} pcs</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">Safe Buffer</span>
            </div>
          </div>
        </div>

        {/* 3. FOUR-STAGE PHYSICAL STATION PIPELINE */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <div className="font-bold text-[#17343a] dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176f78] dark:text-teal-400" />
              <span>Edge Station Sensor Pipeline (4 Real-Time Nodes)</span>
            </div>
            <span className="text-[11px] text-[#527078] dark:text-slate-400 font-mono">
              Live Pulses Stream · Tap "+1" to test trigger
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {sensors.map((sensor, idx) => {
              const isPulsing = lastPulsedStation === sensor.stationId;
              const isOverrun = sensor.lastObservedCycleSec > sensor.standardPitchSec * 1.12;

              return (
                <div
                  key={sensor.id}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 relative group flex flex-col justify-between ${
                    isPulsing
                      ? 'bg-teal-50 dark:bg-teal-950/40 border-[#176f78] dark:border-teal-400 shadow-md ring-2 ring-[#176f78]/30 scale-[1.01]'
                      : isOverrun
                      ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-white dark:bg-[#1a232f] border-[#d9d2c2] dark:border-[#2a3748] hover:border-[#176f78]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between text-[10px] text-[#527078] dark:text-slate-400 font-mono mb-1">
                      <span className="font-bold uppercase tracking-wider text-[#17343a] dark:text-slate-300">
                        Node {idx + 1} ({sensor.sensorType.replace('_', ' ')})
                      </span>
                      <span className="flex items-center gap-1 text-[9px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            sensor.connectionStatus === 'online'
                              ? 'bg-emerald-500'
                              : sensor.connectionStatus === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{sensor.signalDbm} dBm</span>
                      </span>
                    </div>

                    {/* Station Name */}
                    <h4 className="text-xs font-extrabold text-[#17343a] dark:text-white leading-snug line-clamp-1" title={sensor.stationName}>
                      {sensor.stationName}
                    </h4>
                    <p className="text-[11px] text-[#527078] dark:text-slate-400 mt-0.5 truncate">
                      {sensor.operatorName}
                    </p>

                    {/* Cycle Time & Count */}
                    <div className="mt-3 p-2 rounded-xl bg-[#fbfaf6] dark:bg-[#141b24] border border-[#e7e1d5] dark:border-[#253242] flex items-center justify-between">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#527078] dark:text-slate-400 block leading-none">
                          Cycle Time
                        </span>
                        <span className="text-base font-mono font-black tabular-nums text-[#17343a] dark:text-white">
                          {sensor.lastObservedCycleSec}s
                        </span>
                        <span className="text-[10px] text-[#527078] dark:text-slate-400 ml-1 font-mono">
                          / {sensor.standardPitchSec}s
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-[#527078] dark:text-slate-400 block leading-none">
                          Pieces Today
                        </span>
                        <span className="text-base font-mono font-black tabular-nums text-[#176f78] dark:text-teal-400">
                          {sensor.pulsesTodayCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Station Footer Actions */}
                  <div className="mt-3 pt-2.5 border-t border-[#f1eee6] dark:border-[#253242] flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handlePulse(sensor.stationId)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-[#1f2937] hover:bg-teal-50 dark:hover:bg-teal-950/40 border border-[#d9d2c2] dark:border-[#374558] text-[11px] font-bold text-[#176f78] dark:text-teal-300 transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+1 Pulse</span>
                    </button>

                    {onOpenCalibrationModal && (
                      <button
                        type="button"
                        onClick={() => onOpenCalibrationModal(sensor)}
                        className="p-1.5 rounded-xl bg-white dark:bg-[#1f2937] hover:bg-slate-100 dark:hover:bg-[#283546] border border-[#d9d2c2] dark:border-[#374558] text-[#527078] dark:text-slate-400 hover:text-[#17343a] dark:hover:text-white transition-colors cursor-pointer"
                        title="Calibrate Sensor Parameters"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. RECENT PULSE WAVE RING BUFFER (LAST 15 PIECES) */}
        {recentPulses.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1a232f] border border-[#d9d2c2] dark:border-[#2a3748] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[11px] uppercase tracking-wider text-[#527078] dark:text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />
                <span>Live Piece Pulse Wave (Last {recentPulses.length} Finished Cycles)</span>
              </span>
              <span className="text-[10px] font-mono text-[#527078] dark:text-slate-400">
                Target Pitch: <strong className="text-[#176f78] dark:text-teal-300">{pitchTime}s</strong>
              </span>
            </div>

            <div className="flex items-end gap-1.5 h-14 pt-2 overflow-x-auto no-scrollbar">
              {recentPulses.map((pulse, pIdx) => {
                const heightPct = Math.min(100, Math.max(15, Math.round((pulse.cycleDurationSec / 60) * 100)));
                const isOverPitch = pulse.cycleDurationSec > pulse.pitchDurationSec;

                return (
                  <div
                    key={`${pulse.timestamp}-${pIdx}`}
                    className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full group relative"
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-md transition-all ${
                        isOverPitch
                          ? 'bg-amber-500 dark:bg-amber-400 group-hover:bg-amber-600'
                          : 'bg-[#176f78] dark:bg-teal-400 group-hover:bg-[#125860]'
                      }`}
                    />
                    <span className="text-[9px] font-mono font-bold text-[#527078] dark:text-slate-400 mt-1 tabular-nums">
                      {Math.round(pulse.cycleDurationSec)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. FOOTER QUICK ACTION CALLOUT */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-[#f1eee6] dark:border-[#263445]">
          <div className="text-[#527078] dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              Real-time pulses are streaming to <strong>Line {line.lineNo}</strong> hourly production records.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stoppage simulation test */}
            <button
              type="button"
              onClick={() => injectDowntime('st-02', 'Needle breakage on front placket')}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1f2937] hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-[#d9d2c2] dark:border-[#374558] text-rose-700 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95"
              title="Simulate 6-minute machine stoppage to test alerting"
            >
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
              <span>Simulate Stoppage</span>
            </button>

            {onOpenHourlyModal && (
              <button
                type="button"
                onClick={onOpenHourlyModal}
                className="px-4 py-1.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Sync to Hourly Report</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
