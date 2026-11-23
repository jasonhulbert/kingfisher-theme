import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../kingfisher.config.ts';
import { setTomlKeys, shareString } from '../src/adapters/chatgpt.ts';
import { resolveFamily } from '../src/theme.ts';

test('share strings carry each variant as JSON', () => {
  for (const t of resolveFamily(config).themes) {
    const { variant } = JSON.parse(shareString(t).replace(/^codex-theme-v1:/, ''));
    assert.equal(variant, t.appearance);
  }
});

test('setTomlKeys changes only the keys it sets', () => {
  const before = 'model = "x"\n\n[desktop]\nmode = "steer"\ntheme = "github"\n\n[desktop.fonts]\ncode = \'"Mono"\'\n';
  const after = setTomlKeys(before, 'desktop', { theme: 'rose-pine', opaque: true });
  assert.equal(
    after,
    'model = "x"\n\n[desktop]\nmode = "steer"\ntheme = "rose-pine"\nopaque = true\n\n[desktop.fonts]\ncode = \'"Mono"\'\n',
  );
});
