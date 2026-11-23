import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../kingfisher.config.ts';
import { adapters } from '../src/adapters/index.ts';
import { audit } from '../src/audit.ts';
import { resolveFamily } from '../src/theme.ts';

const family = resolveFamily(config);

test('every variant passes the contrast audit', () => {
  assert.deepEqual(audit(family).failures, []);
});

test('every adapter emits parseable files', () => {
  for (const adapter of adapters) {
    const files = adapter.build(family);
    assert.ok(files.length > 0, adapter.id);
    for (const f of files.filter((f) => f.path.endsWith('.json'))) JSON.parse(f.contents);
  }
});

test('every adapter paints only palette colors', () => {
  const palette = new Set<string>();
  const walk = (v: unknown): void => {
    if (v && typeof v === 'object' && 'hex' in v && typeof v.hex === 'string') palette.add(v.hex);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  family.themes.forEach(walk);
  const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const grounds = family.themes.map((t) => channels(t.neutral.bg.hex));
  // A translucent color passes if it shows as a palette color over a variant's background.
  const showsAsPalette = (hex: string) => {
    const a = parseInt(hex.slice(7), 16) / 255;
    const c = channels(hex);
    return grounds.some((g) => {
      const shown = c.map((v, i) => v * a + g[i]! * (1 - a));
      return [...palette].some((p) => channels(p).every((v, i) => Math.abs(v - shown[i]!) <= 1.5));
    });
  };
  for (const adapter of adapters) {
    const off = adapter
      .build(family)
      .flatMap((f) => [...f.contents.matchAll(/#[0-9a-f]{8}\b|#[0-9a-f]{6}\b/gi)].map((m) => m[0].toLowerCase()))
      .filter((hex) => !palette.has(hex.slice(0, 7)) && !(hex.length === 9 && (hex.endsWith('00') || showsAsPalette(hex))));
    assert.deepEqual([...new Set(off)], [], adapter.id);
  }
});
