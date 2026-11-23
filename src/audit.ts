/**
 * Contrast checks run on every build. A failing check stops the build, so a
 * palette edit can't quietly make text hard to read in one variant.
 */

import { contrast, type Color } from './color.ts';
import { MARKDOWN_ROLES, SYNTAX_ROLES } from './config.ts';
import type { ResolvedTheme, ThemeFamily } from './theme.ts';

/** WCAG 2.x thresholds: 7 is AAA body text, 4.5 is AA text, 3 is AA for UI shapes and large text. */
const BODY = 7;
const TEXT = 4.5;
const COMMENT = 4;
const SHAPE = 3;

export interface Check {
  theme: string;
  label: string;
  ratio: number;
  min: number;
}

function checks(t: ResolvedTheme): Check[] {
  const n = t.neutral;
  const out: Check[] = [];
  const add = (label: string, fg: Color, bg: Color, min: number) =>
    out.push({ theme: t.name, label, ratio: contrast(fg, bg), min });

  add('text', n.fg, n.bg, BODY);
  add('muted text', n.muted, n.bg, TEXT);
  add('text on selection', n.fg, t.ui.selection, TEXT);
  add('text on accent', t.ui.onAccent, t.ui.accent.base, TEXT);
  add('accent', t.ui.accent.base, n.bg, SHAPE);
  add('cursor', t.ui.cursor, n.bg, SHAPE);
  add('link', t.ui.link, n.bg, TEXT);
  for (const role of SYNTAX_ROLES) add(`syntax ${role}`, t.syntax[role].color, n.bg, role === 'comment' ? COMMENT : TEXT);
  for (const role of MARKDOWN_ROLES) if (role !== 'mark') add(`markdown ${role}`, t.markdown[role].base, n.bg, TEXT);
  for (const [role, s] of Object.entries(t.status)) add(`status ${role}`, s.base, n.bg, TEXT);
  for (const [role, s] of Object.entries(t.vcs)) add(`vcs ${role}`, s.base, n.bg, TEXT);
  for (const name of ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'] as const) {
    add(`ansi ${name}`, t.ansi.normal[name], n.bg, TEXT);
    add(`ansi bright ${name}`, t.ansi.bright[name], n.bg, SHAPE);
  }
  return out;
}

export function audit(family: ThemeFamily): { checks: Check[]; failures: Check[] } {
  const all = family.themes.flatMap(checks);
  return { checks: all, failures: all.filter((c) => c.ratio < c.min) };
}
