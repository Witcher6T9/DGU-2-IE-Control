import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AUTO_REFRESH_CONFIG,
  AUTO_REFRESH_INTERVAL_PRESETS
} from '../utils/autoRefreshConfig';

describe('Auto-Refresh Engine Configuration', () => {
  test('DEFAULT_AUTO_REFRESH_CONFIG has sensible defaults', () => {
    assert.equal(typeof DEFAULT_AUTO_REFRESH_CONFIG.enabled, 'boolean');
    assert.ok(DEFAULT_AUTO_REFRESH_CONFIG.intervalSeconds >= 3);
    assert.ok(DEFAULT_AUTO_REFRESH_CONFIG.intervalSeconds <= 120);
    assert.equal(DEFAULT_AUTO_REFRESH_CONFIG.intensity, 'moderate');
    assert.equal(DEFAULT_AUTO_REFRESH_CONFIG.showProgressBar, true);
  });

  test('AUTO_REFRESH_INTERVAL_PRESETS has valid intervals', () => {
    assert.ok(Array.isArray(AUTO_REFRESH_INTERVAL_PRESETS));
    assert.ok(AUTO_REFRESH_INTERVAL_PRESETS.length >= 4);
    for (const preset of AUTO_REFRESH_INTERVAL_PRESETS) {
      assert.ok(preset.value > 0);
      assert.ok(preset.label.length > 0);
      assert.ok(preset.desc.length > 0);
    }
  });
});
