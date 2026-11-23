/**
 * Warp: one YAML file per variant, for ~/.warp/themes/.
 * Format: https://docs.warp.dev/terminal/appearance/custom-themes
 * Warp documents 6-digit hex only, so no color here carries alpha.
 */

import { ANSI_NAMES } from '../config.ts';
import type { ResolvedTheme } from '../theme.ts';
import type { Adapter } from './types.ts';

const fileName = (t: ResolvedTheme) => `${t.id.replace(/-/g, '_')}.yaml`;

function theme(t: ResolvedTheme): string {
  const q = (hex: string) => `'${hex}'`;
  const block = (set: 'normal' | 'bright') =>
    ANSI_NAMES.map((name) => `    ${name}: ${q(t.ansi[set][name].hex)}`).join('\n');
  return [
    `name: ${t.name}`,
    `accent: ${q(t.ui.accent.base.hex)}`,
    `cursor: ${q(t.ui.cursor.hex)}`,
    `background: ${q(t.neutral.bg.hex)}`,
    `foreground: ${q(t.neutral.fg.hex)}`,
    `details: ${t.appearance === 'dark' ? 'darker' : 'lighter'}`,
    'terminal_colors:',
    '  normal:',
    block('normal'),
    '  bright:',
    block('bright'),
    '',
  ].join('\n');
}

export const warp: Adapter = {
  id: 'warp',
  name: 'Warp',
  build(family) {
    return family.themes.map((t) => ({ path: fileName(t), contents: theme(t) }));
  },
};
