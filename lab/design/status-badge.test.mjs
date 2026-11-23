import assert from 'node:assert/strict';
import test from 'node:test';
import { statusBadge } from './status-badge.mjs';

const statuses = ['open', 'waiting', 'resolved'];
const themes = ['light', 'dark'];

function channels(hex) {
  assert.match(hex, /^#[a-f0-9]{6}$/i, 'Use an opaque six-digit sRGB color');
  return hex.slice(1).match(/../g).map(pair => Number.parseInt(pair, 16));
}

function luminance(hex) {
  const linear = channels(hex).map(value => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

test('badges retain the approved status wording in both themes', () => {
  for (const theme of themes) {
    assert.deepEqual(statuses.map(status => statusBadge(status, theme).label), ['Open', 'Waiting', 'Resolved']);
  }
});

test('each foreground and surface pair satisfies the 4.5:1 project contrast target', () => {
  for (const status of [...statuses, 'unrecognized']) {
    for (const theme of themes) {
      const { text, surface } = statusBadge(status, theme);
      const [dark, light] = [luminance(text), luminance(surface)].sort((a, b) => a - b);
      assert.ok((light + 0.05) / (dark + 0.05) >= 4.5, `${status} in ${theme}`);
    }
  }
});

test('badge surfaces follow the active theme', () => {
  for (const status of [...statuses, 'unrecognized']) {
    const light = statusBadge(status, 'light');
    const dark = statusBadge(status, 'dark');
    assert.ok(luminance(light.surface) > luminance(light.text), status);
    assert.ok(luminance(dark.surface) < luminance(dark.text), status);
  }
});

test('missing and unfamiliar statuses share a distinct neutral badge', () => {
  for (const theme of themes) {
    const fallback = statusBadge('deferred_internal', theme);
    assert.equal(fallback.label, 'Status unavailable');
    assert.deepEqual(statusBadge(null, theme), fallback);
    assert.deepEqual(statusBadge(undefined, theme), fallback);
    assert.deepEqual(statusBadge('escalation_v3', theme), fallback);
    for (const color of [fallback.text, fallback.surface]) {
      const rgb = channels(color);
      assert.ok(Math.max(...rgb) - Math.min(...rgb) <= 16, 'Fallback uses the neutral palette');
    }
    for (const status of statuses) {
      assert.notEqual(fallback.surface.toLowerCase(), statusBadge(status, theme).surface.toLowerCase());
    }
  }
});
