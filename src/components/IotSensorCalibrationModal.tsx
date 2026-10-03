/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) Industrial Engineering Department
 * Industrial IoT Sensor Calibration & Gateway Management Modal
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Settings,
  Cpu,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw,
  Plus,
  Minus,
  Radio,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { LineEntry } from '../types';
import { IotSensorNode, IotLineGateway } from '../types/telemetry';
import { useLiveTelemetryStream } from '../hooks/useLiveTelemetryStream';

interface IotSensorCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  line: LineEntry;
  initialSensor?: IotSensorNode;
}

export const IotSensorCalibrationModal: React.FC<IotSensorCalibrationModalProps> = ({
  isOpen,
  onClose,
  line,
  initialSensor
}) => {
  const {
    sensors,
    gateway,
    calibrateSensor,
    triggerManualPulse
  } = useLiveTelemetryStream(line.lineNo, line);

  const [selectedSensorId, setSelectedSensorId] = useState<string>(() =>
    initialSensor ? initialSensor.id : sensors[0]?.id || ''
  );

  useEffect(() => {
    if (initialSensor) {
      setSelectedSensorId(initialSensor.id);
    } else if (sensors.length > 0 && !selectedSensorId) {
      setSelectedSensorId(sensors[0].id);
    }
  }, [initialSensor, sensors]);

  const activeSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  // Editable working copy
  const [debounceMs, setDebounceMs] = useState<number>(activeSensor?.debounceMs || 150);
  const [sensitivityPct, setSensitivityPct] = useState<number>(activeSensor?.opticalSensitivityPct || 92);
  const [operatorName, setOperatorName] = useState<string>(activeSensor?.operatorName || '');
  const [standardPitch, setStandardPitch] = useState<number>(activeSensor?.standardPitchSec || 38);
  const [countAdjustment, setCountAdjustment] = useState<number>(activeSensor?.pulsesTodayCount || 0);
  const [isSavedToast, setIsSavedToast] = useState(false);

  useEffect(() => {
    if (activeSensor) {
      setDebounceMs(activeSensor.debounceMs);
      setSensitivityPct(activeSensor.opticalSensitivityPct);
      setOperatorName(activeSensor.operatorName);
      setStandardPitch(activeSensor.standardPitchSec);
      setCountAdjustment(activeSensor.pulsesTodayCount);
    }
  }, [activeSensor?.id]);

  if (!isOpen || !activeSensor) return null;

  const handleSave = () => {
    calibrateSensor(activeSensor.id, {
      debounceMs,
      opticalSensitivityPct: sensitivityPct,
      operatorName: operatorName.trim(),
      standardPitchSec: standardPitch,
      pulsesTodayCount: Math.max(0, countAdjustment)
    });

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      onClose();
    }, 800);
  };

  const handleTestPulse = () => {
    triggerManualPulse(activeSensor.stationId);
    setCountAdjustment(prev => prev + 1);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sensor-calibration-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-[#d9d2c2] dark:border-slate-800 shadow-2xl overflow-hidden pb-safe text-slate-800 dark:text-slate-100">
        {/* Mobile Drag Handle */}
        <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto my-2 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#fbfaf6] dark:bg-slate-900 border-b border-[#e7e1d5] dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#dceceb] dark:bg-teal-950/60 text-[#176f78] dark:text-teal-300">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 id="sensor-calibration-title" className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>IIoT Sensor Node Calibration</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#176f78] text-white font-bold">
                  Line {line.lineNo}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calibrate optical sensitivity, trigger debounce window, and station piece counts.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close calibration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sensor Node Switcher Tabs */}
        <div className="px-5 py-2.5 bg-[#f1eee6] dark:bg-slate-800/50 border-b border-[#d9d2c2] dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {sensors.map((sensor, idx) => {
            const isSelected = sensor.id === activeSensor.id;
            return (
              <button
                key={sensor.id}
                type="button"
                onClick={() => setSelectedSensorId(sensor.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer touch-manipulation min-h-[38px] active:scale-95 ${
                  isSelected
                    ? 'bg-[#176f78] text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white/90 border border-[#d9d2c2] dark:border-slate-700'
                }`}
              >
                <span className="font-mono text-[10px] opacity-80">ST-{idx + 1}</span>
                <span className="truncate max-w-[130px]">{sensor.stationName.split(' ')[1] || sensor.stationName}</span>
                {sensor.isBottleneckStation && (
                  <span className={`text-[8px] uppercase font-bold px-1 rounded ${isSelected ? 'bg-amber-400 text-slate-900' : 'bg-rose-100 text-rose-800'}`}>
                    BN
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Node Status Summary */}
          <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-slate-800/60 border border-[#d9d2c2] dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">Hardware Node Identification</span>
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{activeSensor.id}</span>
                <span aria-hidden="true">·</span>
                <span className="text-teal-700 dark:text-teal-400 font-mono">{activeSensor.ipAddress}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5" />
                <span>{activeSensor.signalDbm} dBm (Good)</span>
              </span>
              <button
                type="button"
                onClick={handleTestPulse}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 text-[#176f78] dark:text-teal-300 font-bold border border-teal-200 dark:border-teal-800 text-xs flex items-center gap-1 active:scale-95 cursor-pointer touch-manipulation min-h-[40px]"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Test Trigger Pulse</span>
              </button>
            </div>
          </div>

          {/* Form Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Debounce Lockout Window */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px]">
                  Debounce Window (ms)
                </label>
                <span className="font-mono font-bold text-[#176f78] dark:text-teal-300">
                  {debounceMs} ms
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="10"
                value={debounceMs}
                onChange={e => setDebounceMs(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#176f78]"
              />
              <p className="text-[10px] text-slate-500">
                Suppresses mechanical switch bounce and optical beam flicker (Recommended: 120-180ms).
              </p>
            </div>

            {/* 2. Optical Sensitivity Threshold */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px]">
                  Optical Sensitivity (%)
                </label>
                <span className="font-mono font-bold text-[#176f78] dark:text-teal-300">
                  {sensitivityPct}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="1"
                value={sensitivityPct}
                onChange={e => setSensitivityPct(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#176f78]"
              />
              <p className="text-[10px] text-slate-500">
                Detects thin fabrics (chiffon, mesh) vs thick twill/denim plies without false misses.
              </p>
            </div>

            {/* 3. Operator Assigned */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] block">
                Assigned Operator Name
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={e => setOperatorName(e.target.value)}
                placeholder="e.g. Operator 08 (Placket Specialist)"
                className="w-full px-3 py-2 rounded-xl bg-[#fbfaf6] dark:bg-slate-900 border border-[#d9d2c2] dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white min-h-[44px]"
              />
            </div>

            {/* 4. Target Pitch (sec) */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 space-y-1.5">
              <label className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 text-[11px] block">
                Standard SMV Pitch Target (sec)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="5"
                  max="300"
                  value={standardPitch}
                  onChange={e => setStandardPitch(Number(e.target.value) || 0)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#fbfaf6] dark:bg-slate-900 border border-[#d9d2c2] dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white min-h-[44px]"
                />
                <span className="text-xs text-slate-500 font-mono">seconds</span>
              </div>
            </div>
          </div>

          {/* Piece Counter Field Calibration */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-600" />
                <span>Piece Count Calibration (Today's Cumulative Total)</span>
              </span>
              <span className="text-xs font-mono font-black text-amber-900 dark:text-amber-200">
                {countAdjustment} pcs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCountAdjustment(prev => Math.max(0, prev - 10))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setCountAdjustment(prev => Math.max(0, prev - 1))}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                value={countAdjustment}
                onChange={e => setCountAdjustment(parseInt(e.target.value) || 0)}
                className="flex-1 h-11 text-center font-mono font-black text-xl rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setCountAdjustment(prev => prev + 1)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-800 font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCountAdjustment(prev => prev + 10)}
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
              >
                +10
              </button>
            </div>
            <p className="text-[10px] text-amber-800 dark:text-amber-300/80">
              Use count calibration if physical bundles were introduced without passing the optical sensor eye.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#fbfaf6] dark:bg-slate-900 border-t border-[#e7e1d5] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {isSavedToast ? (
              <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sensor calibrated and synchronized successfully!</span>
              </span>
            ) : (
              <span>Settings are stored in the local Edge RTU controller.</span>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#d9d2c2] dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors cursor-pointer touch-manipulation min-h-[44px]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#176f78] hover:bg-[#125860] text-white text-xs font-bold shadow-xs transition-all touch-manipulation min-h-[44px] cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Calibrate Node</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
