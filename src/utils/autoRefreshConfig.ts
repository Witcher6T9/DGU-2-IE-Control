/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AutoRefreshEngineConfig {
  enabled: boolean;
  intervalSeconds: number; // e.g., 3, 5, 10, 15, 30, 60
  intensity: 'subtle' | 'moderate' | 'dynamic'; // 'subtle' (1 line), 'moderate' (2 lines), 'dynamic' (3-5 lines)
  showProgressBar: boolean;
  showCountdown: boolean;
  playAudioChime: boolean;
  enableHaptics: boolean;
  simulateOutputPace: boolean;
  simulateCycleJitter: boolean;
  autoPauseOnTabBlur: boolean;
  lastUpdated?: string;
}

export const AUTO_REFRESH_INTERVAL_PRESETS = [
  { value: 3, label: '3s', desc: 'Ultra-Fast Pacing' },
  { value: 5, label: '5s', desc: 'Turbo Telemetry' },
  { value: 10, label: '10s', desc: 'Standard Balancing' },
  { value: 15, label: '15s', desc: 'Floor Monitor' },
  { value: 30, label: '30s', desc: 'Battery Saver' },
  { value: 60, label: '60s', desc: 'Executive Pulse' },
];

export const DEFAULT_AUTO_REFRESH_CONFIG: AutoRefreshEngineConfig = {
  enabled: true,
  intervalSeconds: 10,
  intensity: 'moderate',
  showProgressBar: true,
  showCountdown: true,
  playAudioChime: false,
  enableHaptics: true,
  simulateOutputPace: true,
  simulateCycleJitter: true,
  autoPauseOnTabBlur: true,
};

const STORAGE_KEY = 'ie_auto_refresh_engine_config';

export function getStoredAutoRefreshConfig(): AutoRefreshEngineConfig {
  if (typeof window === 'undefined') return DEFAULT_AUTO_REFRESH_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AUTO_REFRESH_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUTO_REFRESH_CONFIG,
      ...parsed,
      intervalSeconds: Math.max(3, Math.min(120, Number(parsed.intervalSeconds) || 10)),
    };
  } catch (err) {
    console.warn('Failed to parse auto-refresh config from localStorage:', err);
    return DEFAULT_AUTO_REFRESH_CONFIG;
  }
}

export function saveStoredAutoRefreshConfig(config: AutoRefreshEngineConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized: AutoRefreshEngineConfig = {
      ...config,
      intervalSeconds: Math.max(3, Math.min(120, Number(config.intervalSeconds) || 10)),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    window.dispatchEvent(new CustomEvent('debonair:autorefresh_config_changed', { detail: sanitized }));
  } catch (err) {
    console.warn('Failed to save auto-refresh config to localStorage:', err);
  }
}
