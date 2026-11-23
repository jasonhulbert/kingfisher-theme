/**
 * ChatGPT desktop app (the merged ChatGPT and Codex app): custom appearance
 * themes, one for light mode and one for dark.
 *
 * The app takes only an accent, a surface, an ink color, a contrast level and
 * three semantic colors, and derives the rest. Code highlighting must be one of
 * its built-in themes. Read from app version 26.1111; not publicly documented.
 *
 * Each variant is built as a share string for Settings > Appearance > Import.
 * `install()` writes the Light and Dark pair into ~/.codex/config.toml.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedTheme } from '../theme.ts';
import type { Adapter } from './types.ts';

const PREFIX = 'codex-theme-v1:';

/** A built-in code theme with light and dark versions and calm colors. */
const CODE_THEME = 'rose-pine';

/** The app's own default contrast for each mode, on a 0 to 100 scale. */
const CONTRAST = { light: 45, dark: 60 };

const slot = (t: ResolvedTheme) => (t.appearance === 'dark' ? 'appearanceDarkChromeTheme' : 'appearanceLightChromeTheme');

/** The app's chrome theme for one variant, without fonts. */
function chrome(t: ResolvedTheme) {
  return {
    accent: t.ui.accent.base.hex,
    accentSource: 'custom',
    contrast: CONTRAST[t.appearance],
    ink: t.neutral.fg.hex,
    // Opaque, so the desktop behind the window doesn't tint the surface.
    opaqueWindows: true,
    surface: t.neutral.bg.hex,
  };
}

const semanticColors = (t: ResolvedTheme) => ({
  diffAdded: t.vcs.added.base.hex,
  diffRemoved: t.vcs.deleted.base.hex,
  skill: t.markdown.tag.base.hex,
});

/** The string the app's theme Import button accepts. Null fonts keep the app's default fonts. */
export function shareString(t: ResolvedTheme): string {
  const theme = { ...chrome(t), fonts: { code: null, ui: null }, semanticColors: semanticColors(t) };
  return PREFIX + JSON.stringify({ codeThemeId: CODE_THEME, theme, variant: t.appearance });
}

type TomlValue = string | number | boolean;

/**
 * Sets keys in one table of a TOML file and leaves every other line as it was.
 * Adds the table at the end if it is missing.
 */
export function setTomlKeys(text: string, table: string, entries: Record<string, TomlValue>): string {
  const lines = text.split('\n');
  const header = lines.findIndex((l) => l.trim() === `[${table}]`);
  const line = (key: string, value: TomlValue) => `${key} = ${typeof value === 'string' ? JSON.stringify(value) : value}`;
  if (header === -1) {
    const body = Object.entries(entries).map(([k, v]) => line(k, v));
    return `${text.replace(/\n*$/, '')}\n\n[${table}]\n${body.join('\n')}\n`;
  }
  let end = lines.findIndex((l, i) => i > header && /^\s*\[/.test(l));
  if (end === -1) end = lines.length;
  for (const [key, value] of Object.entries(entries)) {
    const at = lines.findIndex((l, i) => i > header && i < end && new RegExp(`^\\s*${key}\\s*=`).test(l));
    if (at !== -1) {
      lines[at] = line(key, value);
      continue;
    }
    // Insert after the table's last non-blank line.
    let last = end - 1;
    while (last > header && lines[last]!.trim() === '') last--;
    lines.splice(last + 1, 0, line(key, value));
    end++;
  }
  return lines.join('\n');
}

export const chatgpt: Adapter = {
  id: 'chatgpt',
  name: 'ChatGPT',
  build(family) {
    return family.themes.map((t) => ({ path: `${t.id}.txt`, contents: shareString(t) + '\n' }));
  },
  install(family, { home }) {
    const path = join(home, '.codex', 'config.toml');
    if (!existsSync(path)) return 'no ~/.codex/config.toml (open the ChatGPT app once first)';
    let text = readFileSync(path, 'utf8');
    for (const t of family.themes.filter((t) => !t.muted)) {
      const mode = t.appearance === 'dark' ? 'Dark' : 'Light';
      text = setTomlKeys(text, 'desktop', { [`appearance${mode}CodeThemeId`]: CODE_THEME });
      text = setTomlKeys(text, `desktop.${slot(t)}`, chrome(t));
      text = setTomlKeys(text, `desktop.${slot(t)}.semanticColors`, semanticColors(t));
    }
    return [{ to: path, contents: text }];
  },
};
