/**
 * Builds every theme file from kingfisher.config.ts.
 *
 *   npm run build                       all targets into dist/
 *   npm run build -- --target zed,warp  only some targets
 *   npm run build -- --out ./out        another output folder
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import config from '../kingfisher.config.ts';
import { adapters } from './adapters/index.ts';
import { audit } from './audit.ts';
import { resolveFamily } from './theme.ts';

const { values } = parseArgs({
  options: {
    target: { type: 'string' },
    out: { type: 'string', default: 'dist' },
  },
});

const wanted = values.target?.split(',').map((s) => s.trim());
const unknown = wanted?.filter((id) => !adapters.some((a) => a.id === id)) ?? [];
if (unknown.length) {
  console.error(`Unknown target: ${unknown.join(', ')}. Targets: ${adapters.map((a) => a.id).join(', ')}.`);
  process.exit(1);
}

const family = resolveFamily(config);

const { checks, failures } = audit(family);
if (failures.length) {
  console.error(`Contrast check failed (${failures.length} of ${checks.length}):`);
  for (const f of failures) console.error(`  ${f.theme}: ${f.label} is ${f.ratio.toFixed(2)}:1, needs ${f.min}:1`);
  process.exit(1);
}
const lowest = checks.reduce((a, b) => (a.ratio - a.min < b.ratio - b.min ? a : b));
console.log(`Contrast: ${checks.length} checks passed. Closest: ${lowest.theme} ${lowest.label} at ${lowest.ratio.toFixed(2)}:1 (needs ${lowest.min}:1).`);

const outRoot = resolve(values.out);
for (const adapter of adapters.filter((a) => !wanted || wanted.includes(a.id))) {
  const dir = join(outRoot, adapter.id);
  await rm(dir, { recursive: true, force: true });
  const files = adapter.build(family);
  for (const file of files) {
    const path = join(dir, file.path);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, file.contents);
  }
  console.log(`${adapter.name.padEnd(9)} ${files.length} files  ${join(values.out, adapter.id)}`);
}
