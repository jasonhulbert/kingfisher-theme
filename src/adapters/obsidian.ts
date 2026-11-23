/**
 * Obsidian: theme folders with manifest.json and theme.css.
 * Variables: https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors
 *
 * An Obsidian theme has only a light and a dark mode, so the muted variants
 * ship as a second theme, selectable on its own in Settings > Appearance.
 */

import { alpha, hsl, rgb, translucent, type Color } from '../color.ts';
import type { ResolvedTheme, Swatch, ThemeFamily } from '../theme.ts';
import { json, type Adapter } from './types.ts';

/** Obsidian's named colors and the OKLCH hue each should land near. */
const NAMED_HUES = { red: 20, orange: 45, yellow: 85, green: 140, cyan: 195, blue: 260, purple: 300, pink: 345 };

function nearestHue(hues: Swatch[], target: number): Swatch {
  const distance = (h: number) => Math.min(Math.abs(h - target), 360 - Math.abs(h - target));
  return hues.reduce((best, s) => (distance(s.base.h) < distance(best.base.h) ? s : best));
}

function variables(t: ResolvedTheme): Record<string, string> {
  const n = t.neutral;
  const { accent, onAccent, cursor, link, selection } = t.ui;
  const md = t.markdown;
  const code = t.syntax;
  const fill = (c: Color) => translucent(c, n.bg);
  const [h, s, l] = hsl(accent.base);

  // Obsidian's grey scale, from the note background up to body text. It has
  // more steps than the palette has neutrals, so neighboring steps share one.
  const base: [string, Color][] = [
    ['00', n.bg],
    ['05', n.bg],
    ['10', n.surface],
    ['20', n.surface],
    ['25', n.border],
    ['30', n.border],
    ['35', n.border],
    ['40', n.subtle],
    ['50', n.subtle],
    ['60', n.muted],
    ['70', n.muted],
    ['100', n.fg],
  ];

  const named: Record<string, string> = {};
  for (const [name, target] of Object.entries(NAMED_HUES)) {
    const c = nearestHue(t.hues, target).base;
    named[`--color-${name}`] = c.hex;
    named[`--color-${name}-rgb`] = rgb(c).join(', ');
  }

  return {
    ...Object.fromEntries(base.map(([k, c]) => [`--color-base-${k}`, c.hex])),
    ...named,
    '--accent-h': h.toFixed(1),
    '--accent-s': `${s.toFixed(1)}%`,
    '--accent-l': `${l.toFixed(1)}%`,
    // Obsidian derives these from the HSL above; set them so they are exact.
    '--color-accent': accent.base.hex,
    '--color-accent-1': accent.bright.hex,
    '--color-accent-2': accent.bright.hex,

    '--background-primary': n.bg.hex,
    '--background-primary-alt': n.line.hex,
    '--background-secondary': n.surface.hex,
    '--background-secondary-alt': n.surface.hex,
    '--background-modifier-hover': alpha(n.fg, 0.06),
    '--background-modifier-active-hover': fill(accent.tint),
    '--background-modifier-border': n.border.hex,
    '--background-modifier-border-hover': n.subtle.hex,
    '--background-modifier-border-focus': accent.base.hex,
    '--background-modifier-error': t.status.error.base.hex,
    '--background-modifier-error-hover': t.status.error.bright.hex,
    '--background-modifier-success': t.status.success.base.hex,
    '--background-modifier-message': n.raised.hex,
    '--background-modifier-form-field': n.raised.hex,

    '--interactive-normal': n.raised.hex,
    '--interactive-hover': n.border.hex,
    '--interactive-accent': accent.base.hex,
    '--interactive-accent-hover': accent.bright.hex,

    '--text-normal': n.fg.hex,
    '--text-muted': n.muted.hex,
    '--text-faint': n.subtle.hex,
    '--text-on-accent': onAccent.hex,
    '--text-accent': accent.base.hex,
    '--text-accent-hover': accent.bright.hex,
    '--text-success': t.status.success.base.hex,
    '--text-warning': t.status.warning.base.hex,
    '--text-error': t.status.error.base.hex,
    '--text-selection': fill(selection),
    '--text-highlight-bg': fill(md.mark.strong),
    '--caret-color': cursor.hex,

    '--link-color': link.hex,
    '--link-color-hover': t.status.info.bright.hex,
    '--link-external-color': link.hex,
    '--link-external-color-hover': t.status.info.bright.hex,
    '--link-unresolved-color': link.hex,
    '--tag-color': md.tag.base.hex,
    '--tag-color-hover': md.tag.bright.hex,
    '--tag-background': fill(md.tag.tint),
    '--tag-background-hover': fill(md.tag.strong),

    '--h1-color': n.fg.hex,
    '--h2-color': n.fg.hex,
    '--h3-color': n.fg.hex,
    '--h4-color': n.fg.hex,
    '--h5-color': n.fg.hex,
    '--h6-color': n.fg.hex,
    '--heading-formatting': md.heading.base.hex,
    '--bold-color': md.strong.base.hex,
    '--italic-color': md.emphasis.base.hex,
    '--blockquote-border-color': md.quote.base.hex,
    '--list-marker-color': md.list.base.hex,
    '--checkbox-color': accent.base.hex,
    '--checkbox-color-hover': accent.bright.hex,
    '--checkbox-border-color': n.subtle.hex,
    '--checkbox-marker-color': onAccent.hex,
    '--checklist-done-color': n.subtle.hex,
    '--hr-color': n.border.hex,

    '--code-background': n.surface.hex,
    '--code-normal': n.fg.hex,
    '--code-comment': code.comment.color.hex,
    '--code-function': code.function.color.hex,
    '--code-important': code.escape.color.hex,
    '--code-keyword': code.keyword.color.hex,
    '--code-operator': code.operator.color.hex,
    '--code-property': code.property.color.hex,
    '--code-punctuation': code.punctuation.color.hex,
    '--code-string': code.string.color.hex,
    '--code-tag': code.tag.color.hex,
    '--code-value': code.number.color.hex,
  };
}

function rule(selector: string, t: ResolvedTheme): string {
  const body = Object.entries(variables(t)).map(([k, v]) => `  ${k}: ${v};`).join('\n');
  return `/* ${t.name} */\n${selector} {\n${body}\n}\n`;
}

/**
 * One Obsidian theme per set of variants that share a muted setting, for
 * example "Kingfisher" (Light and Dark) and "Kingfisher Muted" (Light Muted
 * and Dark Muted). Obsidian requires each folder name to match its theme name.
 */
function obsidianThemes(family: ThemeFamily): { name: string; themes: ResolvedTheme[] }[] {
  return [false, true]
    .map((muted) => ({
      name: muted ? `${family.name} Muted` : family.name,
      themes: family.themes.filter((t) => t.muted === muted),
    }))
    .filter((g) => g.themes.length > 0);
}

export const obsidian: Adapter = {
  id: 'obsidian',
  name: 'Obsidian',
  build(family) {
    return obsidianThemes(family).flatMap(({ name, themes }) => {
      const rules = (['light', 'dark'] as const)
        .map((appearance) => themes.find((t) => t.appearance === appearance))
        .filter((t) => t !== undefined)
        .map((t) => rule(`.theme-${t.appearance}`, t));
      const css = `/* ${name} ${family.version}. Generated by kingfisher-theme; edit kingfisher.config.ts instead. */\n\n${rules.join('\n')}`;
      const manifest = { name, version: family.version, minAppVersion: '1.0.0', author: family.author };
      return [
        { path: `${name}/manifest.json`, contents: json(manifest) },
        { path: `${name}/theme.css`, contents: css },
      ];
    });
  },
};
