import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fromHex, oklch, rgb, translucent } from '../src/color.ts';

test('OKLCH converts to sRGB hex', () => {
  assert.equal(oklch(0.627955, 0.257683, 29.2339).hex, '#ff0000');
});

test('a translucent color composites back to its opaque target', () => {
  const bg = fromHex('#12120c');
  const target = fromHex('#2b3354');
  const hex = translucent(target, bg);
  const a = parseInt(hex.slice(7, 9), 16) / 255;
  const layer = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const composite = layer.map((v, i) => Math.round(v * a + rgb(bg)[i]! * (1 - a)));
  assert.deepEqual(composite, rgb(target));
});
