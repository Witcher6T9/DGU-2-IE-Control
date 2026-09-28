/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Sliders,
  X,
  Volume2,
  VolumeX,
  Vibrate,
  Zap,
  RotateCcw,
  Check,
  Pause,
  Play,
  Gauge,
  Sparkles,
  Layers,
  Timer,
  Eye,
  SlidersHorizontal,
  Flame
} from 'lucide-react';
import {
  AutoRefreshEngineConfig,
  AUTO_REFRESH_INTERVAL_PRESETS,
  DEFAULT_AUTO_REFRESH_CONFIG
} from '../utils/autoRefreshConfig';
import { playTelemetryHeartbeatChime } from '../utils/audioAlert';

interface AutoRefreshEngineCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoRefreshEngineConfig;
  onUpdateConfig: (newConfig: AutoRefreshEngineConfig) => void;
  onTriggerTestRefresh?: () => void;
  countdown?: number;
}

export const AutoRefreshEngineCustomizerModal: React.FC<AutoRefreshEngineCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  onTriggerTestRefresh,
  countdown = 10,
}) => {
  const [localConfig, setLocalConfig] = useState<AutoRefreshEngineConfig>(config);
  const [savedNotice, setSavedNotice] = useState(false);

  // Sync if prop changes externally
  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSave = (updated: AutoRefreshEngineConfig) => {
    setLocalConfig(updated);
    onUpdateConfig(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetDefaults = () => {
    handleSave(DEFAULT_AUTO_REFRESH_CONFIG);
  };

  const handleTestChime = () => {
    playTelemetryHeartbeatChime();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(30);
      } catch {}
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="autorefresh-customizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 bg-white dark:bg-slate-900 rounded-3xl border border-[#d9d2c2] dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-800 dark:text-slate-100 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#eef7f7] dark:bg-[#176f78]/20 text-[#176f78] dark:text-[#38b2ac]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 id="autorefresh-customizer-title" className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Auto-Refresh Engine</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                  localConfig.enabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                }`}>
                  {localConfig.enabled ? `Active • ${localConfig.intervalSeconds}s` : 'Paused'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tune floor telemetry heartbeat, cycle pacing intensity, and auditory alerts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Customizer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Engine State Switch */}
        <div className="p-3.5 rounded-2xl bg-[#fbfaf6] dark:bg-slate-800/60 border border-[#d9d2c2] dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl text-white ${localConfig.enabled ? 'bg-emerald-600' : 'bg-slate-400'}`}>
              {localConfig.enabled ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                Engine Master Status
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {localConfig.enabled
                  ? 'Real-time heartbeat is actively updating metrics'
                  : 'Engine is suspended; metrics remain frozen'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleSave({ ...localConfig, enabled: !localConfig.enabled })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
              localConfig.enabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'
            }`}
          >
            {localConfig.enabled ? 'Enabled' : 'Paused'}
          </button>
        </div>

        {/* Refresh Cadence & Presets */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-[#176f78]" />
              <span>Refresh Interval Cadence</span>
            </label>
            <span className="font-mono font-bold text-[#176f78] dark:text-teal-400 bg-[#eef7f7] dark:bg-teal-950/60 px-2 py-0.5 rounded-lg border border-[#b2d8d8] dark:border-teal-800">
              Every {localConfig.intervalSeconds} Seconds
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {AUTO_REFRESH_INTERVAL_PRESETS.map((preset) => {
              const isSelected = localConfig.intervalSeconds === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSave({ ...localConfig, intervalSeconds: preset.value })}
                  className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#176f78] text-white border-[#176f78] shadow-xs scale-102 font-bold'
                      : 'bg-white dark:bg-slate-800 border-[#d9d2c2] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#176f78]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">{preset.label}</span>
                  <span className={`text-[9px] truncate max-w-full ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                    {preset.desc.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fine Tuning Slider */}
          <div className="pt-2 px-1">
            <input
              type="range"
              min="3"
              max="60"
              step="1"
              value={localConfig.intervalSeconds}
              onChange={(e) => handleSave({ ...localConfig, intervalSeconds: Number(e.target.value) })}
              className="w-full accent-[#176f78] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>3s (Turbo)</span>
              <span>10s (Standard)</span>
              <span>30s (Saver)</span>
              <span>60s (Pulse)</span>
            </div>
          </div>
        </div>

        {/* Telemetry Pacing Intensity */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-[#176f78]" />
            <span>Pacing Simulation Intensity</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                id: 'subtle' as const,
                title: 'Subtle',
                desc: '1 active line paced per tick. Low variance.',
                icon: '🌱'
              },
              {
                id: 'moderate' as const,
                title: 'Moderate',
                desc: '2 active lines paced. Recommended for floor.',
                icon: '⚖️'
              },
              {
                id: 'dynamic' as const,
                title: 'Dynamic',
                desc: '3-5 lines paced. High volume multi-line.',
                icon: '⚡'
              }
            ].map((intensity) => {
              const isSelected = localConfig.intensity === intensity.id;
              return (
                <button
                  key={intensity.id}
                  type="button"
                  onClick={() => handleSave({ ...localConfig, intensity: intensity.id })}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#eef7f7] dark:bg-[#176f78]/20 border-[#176f78] text-[#17343a] dark:text-teal-200 ring-1 ring-[#176f78]'
                      : 'bg-white dark:bg-slate-800 border-[#d9d2c2] dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#176f78]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      <span>{intensity.icon}</span>
                      <span>{intensity.title}</span>
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#176f78] dark:text-teal-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {intensity.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display & Feedback Options */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#176f78]" />
            <span>Visual & Acoustic Telemetry Options</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Countdown Badge Toggle */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Countdown Badge</div>
                <div className="text-[11px] text-slate-500">Show 'Refreshes in Xs' label</div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.showCountdown}
                onChange={(e) => handleSave({ ...localConfig, showCountdown: e.target.checked })}
                className="w-4 h-4 accent-[#176f78] cursor-pointer rounded"
              />
            </div>

            {/* Progress Bar Toggle */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">Linear Progress Bar</div>
                <div className="text-[11px] text-slate-500">Show 0-100% time bar</div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.showProgressBar}
                onChange={(e) => handleSave({ ...localConfig, showProgressBar: e.target.checked })}
                className="w-4 h-4 accent-[#176f78] cursor-pointer rounded"
              />
            </div>

            {/* Audio Chime Toggle */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestChime}
                  className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/50 text-[#176f78] hover:bg-teal-100 transition-colors"
                  title="Test micro-chime sound"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Auditory Pip</div>
                  <div className="text-[11px] text-slate-500">Subtle chime on heartbeat</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.playAudioChime}
                onChange={(e) => handleSave({ ...localConfig, playAudioChime: e.target.checked })}
                className="w-4 h-4 accent-[#176f78] cursor-pointer rounded"
              />
            </div>

            {/* Mobile Haptic Pulse */}
            <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-[#d9d2c2] dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700">
                  <Vibrate className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Haptic Vibration</div>
                  <div className="text-[11px] text-slate-500">Tactile pulse on touch devices</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={localConfig.enableHaptics}
                onChange={(e) => handleSave({ ...localConfig, enableHaptics: e.target.checked })}
                className="w-4 h-4 accent-[#176f78] cursor-pointer rounded"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onTriggerTestRefresh && (
              <button
                type="button"
                onClick={() => {
                  onTriggerTestRefresh();
                  if (localConfig.playAudioChime) handleTestChime();
                }}
                className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-[#17343a] dark:text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Trigger immediate simulated telemetry heartbeat"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Test Heartbeat Now</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset all settings to factory default 10s cadence"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {savedNotice && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Saved live</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-[#176f78] hover:bg-[#12555c] text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              Done &amp; Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
