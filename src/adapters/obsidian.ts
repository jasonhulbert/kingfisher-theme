/**
 * Obsidian: one theme folder with manifest.json and theme.css.
 * Variables: https://docs.obsidian.md/Reference/CSS+variables/Foundations/Colors
 *
 * Obsidian themes have only light and dark modes. Muted variants apply on top
 * through a body class. The Style Settings community plugin exposes that class
 * as a toggle, declared in the `@settings` comment at the top of theme.css.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { alpha, hsl, mix, rgb, translucent, type Color } from '../color.ts';
import type { ResolvedTheme, Swatch } from '../theme.ts';
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

  // Obsidian's grey scale, from the note background up to body text.
  const borderHover = mix(n.border, n.subtle, 0.45);
  const interactiveHover = mix(n.surface, n.border, 0.3);
  const base: [string, Color][] = [
    ['00', n.bg],
    ['05', mix(n.bg, n.surface, 0.33)],
    ['10', mix(n.bg, n.surface, 0.66)],
    ['20', n.surface],
    ['25', interactiveHover],
    ['30', n.border],
    ['35', mix(n.border, n.subtle, 0.15)],
    ['40', borderHover],
    ['50', n.subtle],
    ['60', mix(n.subtle, n.muted, 0.5)],
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

    '--background-primary': n.bg.hex,
    '--background-primary-alt': n.line.hex,
    '--background-secondary': n.surface.hex,
    '--background-secondary-alt': n.surface.hex,
    '--background-modifier-hover': alpha(n.fg, 0.06),
    '--background-modifier-active-hover': fill(accent.tint),
    '--background-modifier-border': n.border.hex,
    '--background-modifier-border-hover': borderHover.hex,
    '--background-modifier-border-focus': n.subtle.hex,
    '--background-modifier-error': t.status.error.base.hex,
    '--background-modifier-error-hover': t.status.error.bright.hex,
    '--background-modifier-success': t.status.success.base.hex,
    '--background-modifier-message': n.raised.hex,
    '--background-modifier-form-field': n.raised.hex,

    '--interactive-normal': n.raised.hex,
    '--interactive-hover': interactiveHover.hex,
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

export const obsidian: Adapter = {
  id: 'obsidian',
  name: 'Obsidian',
  build(family) {
    const mutedClass = `${family.name.toLowerCase()}-muted`;
    const rules: string[] = [];
    for (const appearance of ['light', 'dark'] as const) {
      const base = family.themes.find((t) => t.appearance === appearance && !t.muted);
      const muted = family.themes.find((t) => t.appearance === appearance && t.muted);
      if (base) rules.push(rule(`.theme-${appearance}`, base));
      if (muted) rules.push(rule(`.theme-${appearance}.${mutedClass}`, muted));
    }
    const settings = [
      '/* @settings',
      `name: ${family.name}`,
      `id: ${family.name.toLowerCase()}`,
      'settings:',
      '  -',
      `    id: ${mutedClass}`,
      '    title: Muted',
      '    description: Softer ground and quieter accents.',
      '    type: class-toggle',
      '*/',
    ].join('\n');
    const css = `/* ${family.name} ${family.version}. Generated by kingfisher-theme; edit kingfisher.config.ts instead. */\n\n${settings}\n\n${rules.join('\n')}`;
    const manifest = { name: family.name, version: family.version, minAppVersion: '1.0.0', author: family.author };
    return [
      { path: `${family.name}/manifest.json`, contents: json(manifest) },
      { path: `${family.name}/theme.css`, contents: css },
    ];
  },
  install(family, { vault }) {
    if (!vault) return 'no vault given (use --vault <path> or KINGFISHER_OBSIDIAN_VAULT)';
    const config = join(vault, '.obsidian');
    if (!existsSync(config)) return `${vault} is not an Obsidian vault (no .obsidian folder)`;
    return [{ from: family.name, to: join(config, 'themes', family.name) }];
  },
};
