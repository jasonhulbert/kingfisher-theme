/**
 * ChatGPT desktop app (the merged ChatGPT and Codex app): custom appearance
 * themes, one for light mode and one for dark.
 *
 * The app takes only an accent, a surface, an ink color, a contrast level and
 * three semantic colors, and derives the rest. Code highlighting must be one of
 * its built-in themes. Read from app version 26.1111; not publicly documented.
 *
 * The app paints accent text in the accent only when the accent clears its own
 * contrast floor; otherwise it substitutes a color of its own. The build stops
 * if a variant's accent would be substituted.
 *
 * Each variant is built as a share string for Settings > Appearance > Import.
 */

import { contrast, fromHex, rgb, type Color } from '../color.ts';
import type { ResolvedTheme } from '../theme.ts';
import type { Adapter } from './types.ts';

const PREFIX = 'codex-theme-v1:';

/** A built-in code theme with light and dark versions and calm colors. */
const CODE_THEME = 'rose-pine';

/** The app's own default contrast for each mode, on a 0 to 100 scale. */
const CONTRAST = { light: 45, dark: 60 };

/** Mix two colors per sRGB channel, as the app does. */
function mixRgb(a: Color, b: Color, t: number): Color {
  const [x, y] = [rgb(a), rgb(b)];
  return fromHex('#' + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, '0')).join(''));
}

/** APCA lightness contrast as the app computes it, unsigned. */
function apca(text: Color, bg: Color): number {
  const y = (c: Color) => {
    const [r, g, b] = rgb(c).map((v) => (v / 255) ** 2.4) as [number, number, number];
    const lum = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
    return lum >= 0.022 ? lum : lum + (0.022 - lum) ** 1.414;
  };
  const [t, b] = [y(text), y(bg)];
  if (Math.abs(b - t) < 5e-4) return 0;
  const n = b > t ? (b ** 0.56 - t ** 0.57) * 1.14 : (b ** 0.65 - t ** 0.62) * 1.14;
  return Math.abs(n) < 0.1 ? 0 : Math.abs(n) * 100 - 2.7;
}

const BLACK = fromHex('#000000');
const WHITE = fromHex('#ffffff');

/**
 * The text accent the app derives from an accent (its function for
 * `--color-text-accent`). It keeps the accent only if the accent reaches APCA
 * 60 and WCAG 4.5:1 on the surface and on the surface tinted 10 to 25% with
 * the accent. Otherwise it takes the first mix toward black or white that does.
 */
function appTextAccent(accent: Color, surface: Color): Color {
  const grounds = [surface, ...[0.1, 0.17, 0.25].map((t) => mixRgb(surface, accent, t))];
  const wcag = (c: Color) => Math.min(...grounds.map((g) => contrast(c, g)));
  const lc = (c: Color) => Math.min(...grounds.map((g) => apca(c, g)));
  const darker = [0.25, 0.4, 0.55, 0.75, 1].map((t) => mixRgb(accent, BLACK, t));
  const lighter = [0.5, 0.65, 0.75, 0.9, 1].map((t) => mixRgb(accent, WHITE, t));
  const order = lc(BLACK) > lc(WHITE) ? [...darker, ...lighter] : [...lighter, ...darker];
  const candidates = [accent, ...order].filter((c) => wcag(c) >= 4.5);
  return candidates.find((c) => lc(c) >= 60) ?? candidates.reduce((a, b) => (lc(b) > lc(a) ? b : a));
}

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

export const chatgpt: Adapter = {
  id: 'chatgpt',
  name: 'ChatGPT',
  build(family) {
    for (const t of family.themes) {
      const painted = appTextAccent(t.ui.accent.base, t.neutral.bg);
      if (painted.hex !== t.ui.accent.base.hex) {
        throw new Error(`${t.name}: ChatGPT would paint accent text ${painted.hex} instead of the accent ${t.ui.accent.base.hex}`);
      }
    }
    return family.themes.map((t) => ({ path: `${t.id}.txt`, contents: shareString(t) + '\n' }));
  },
};
