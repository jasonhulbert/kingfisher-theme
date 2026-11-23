import assert from 'node:assert/strict';
import { test } from 'node:test';
import config from '../kingfisher.config.ts';
import { shareString } from '../src/adapters/chatgpt.ts';
import { resolveFamily } from '../src/theme.ts';

test('share strings carry each variant as JSON', () => {
  for (const t of resolveFamily(config).themes) {
    const { variant } = JSON.parse(shareString(t).replace(/^codex-theme-v1:/, ''));
    assert.equal(variant, t.appearance);
  }
});
