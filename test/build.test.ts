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
