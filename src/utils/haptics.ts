/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Debonair LTD (Unit-02) — IE Frontline UX Haptic Feedback Engine
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning';

export function isHapticsSupported(): boolean {
  return typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function';
}

export function getHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem('debonair_haptic_feedback');
    return val !== 'false';
  } catch {
    return true;
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem('debonair_haptic_feedback', enabled ? 'true' : 'false');
  } catch {}
}

/**
 * Triggers a subtle tactile haptic vibration on supporting mobile devices / tablets.
 * Fails silently on desktop or unsupportive browsers without throwing.
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  try {
    if (!isHapticsSupported() || !getHapticsEnabled()) return;

    switch (type) {
      case 'light':
      case 'selection':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(18);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'success':
        navigator.vibrate([12, 35, 18]);
        break;
      case 'warning':
        navigator.vibrate([25, 40, 25, 40, 30]);
        break;
    }
  } catch {
    // Graceful no-op
  }
}
