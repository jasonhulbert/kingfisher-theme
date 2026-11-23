/**
 * Resolves the shared configuration into concrete colors, one theme per
 * variant. The `ResolvedTheme` type is the contract every adapter builds from.
 */

import { oklch, type Color } from './color.ts';
import {
  ANSI_NAMES, MARKDOWN_ROLES, NEUTRALS, STATUS_ROLES, SYNTAX_ROLES, VCS_ROLES,
  type AnsiName, type Appearance, type FontStyle, type MarkdownRole, type NeutralName,
  type StatusRole, type SyntaxRole, type ThemeConfig, type VcsRole,
} from './config.ts';

/** One hue (or neutral) in the four strengths adapters draw from. */
export interface Swatch {
  name: string;
  /** Text and icon color. */
  base: Color;
  /** One step lighter: bright ANSI colors, hover states. */
  bright: Color;
  /** Quiet background fill: diff lines, highlights, tags, callouts. */
  tint: Color;
  /** Solid badge fill. */
  strong: Color;
}

export interface SyntaxStyle {
  color: Color;
  fontStyle?: FontStyle;
}

export interface ResolvedTheme {
  /** For example `kingfisher-dark-muted`. */
  id: string;
  /** For example `Kingfisher Dark Muted`. */
  name: string;
  variant: string;
  label: string;
  appearance: Appearance;
  muted: boolean;
  neutral: Record<NeutralName, Color>;
  /** Every configured hue, in config order. */
  hues: Swatch[];
  ui: {
    accent: Swatch;
    /** Text and icons drawn on an accent fill. */
    onAccent: Color;
    cursor: Color;
    link: Color;
    /** Opaque selection color. Use `translucent()` where the app layers highlights. */
    selection: Color;
  };
  status: Record<StatusRole, Swatch>;
  vcs: Record<VcsRole, Swatch>;
  syntax: Record<SyntaxRole, SyntaxStyle>;
  markdown: Record<MarkdownRole, Swatch>;
  ansi: { normal: Record<AnsiName, Color>; bright: Record<AnsiName, Color> };
}

export interface ThemeFamily {
  name: string;
  author: string;
  version: string;
  description: string;
  publisher: string;
  repository?: string;
  themes: ResolvedTheme[];
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function resolveTheme<H extends string>(config: ThemeConfig<H>, variantId: string): ResolvedTheme {
  const v = config.variants[variantId];
  if (!v) throw new Error(`Unknown variant "${variantId}"`);
  const dark = v.appearance === 'dark';
  const ground = config.neutral[v.appearance];

  // Neutral chroma fades toward the light end so body text stays clean.
  const neutralAt = (l: number) => {
    const fade = 1 - 0.55 * Math.max(0, (l - 0.55) / 0.45);
    return oklch(l, ground.chroma * v.neutralChroma * fade, ground.hue);
  };
  const neutral = Object.fromEntries(NEUTRALS.map((n) => [n, neutralAt(v.neutral[n])])) as Record<NeutralName, Color>;

  const hueNames = Object.keys(config.hues) as H[];
  const swatches = new Map<string, Swatch>();
  for (const name of hueNames) {
    const { hue, chroma, nudge } = config.hues[name];
    const l = v.accent.lightness + (nudge?.[v.appearance] ?? 0);
    const c = chroma * v.accent.chroma;
    swatches.set(name, {
      name,
      base: oklch(l, c, hue),
      bright: oklch(l + v.accent.brightStep, c * 1.05, hue),
      tint: oklch(v.tint.lightness, v.tint.chroma, hue),
      strong: oklch(v.strong.lightness, v.strong.chroma, hue),
    });
  }
  const hue = (name: H): Swatch => swatches.get(name)!;
  const isNeutral = (ref: string): ref is NeutralName => (NEUTRALS as readonly string[]).includes(ref);
  const ref = (name: H | NeutralName): Swatch => {
    if (!isNeutral(name)) return hue(name);
    const c = neutral[name];
    return { name, base: c, bright: c, tint: neutral.surface, strong: neutral.raised };
  };
  // Code colors share each hue's lightness but carry less chroma.
  const code = (name: H | NeutralName): Color => {
    if (isNeutral(name)) return neutral[name];
    const { hue: h, chroma, nudge } = config.hues[name];
    return oklch(v.accent.lightness + (nudge?.[v.appearance] ?? 0), chroma * v.accent.chroma * v.syntaxChroma, h);
  };
  const pick = <K extends string, V>(keys: readonly K[], fn: (k: K) => V) =>
    Object.fromEntries(keys.map((k) => [k, fn(k)])) as Record<K, V>;

  const { roles } = config;
  const selectionHue = config.hues[roles.ui.selection].hue;
  const chromaticAnsi = (bright: boolean) => (name: AnsiName): Color => {
    if (name === 'black') return neutralAt(bright ? v.ansi.brightBlack : v.ansi.black);
    if (name === 'white') return neutralAt(bright ? v.ansi.brightWhite : v.ansi.white);
    const s = hue(roles.ansi[name]);
    return bright ? s.bright : s.base;
  };

  const id = slug(`${config.name}-${variantId}`);
  return {
    id,
    name: `${config.name} ${v.label}`,
    variant: variantId,
    label: v.label,
    appearance: v.appearance,
    muted: v.muted,
    neutral,
    hues: hueNames.map(hue),
    ui: {
      accent: hue(roles.ui.accent),
      onAccent: dark ? neutral.bg : neutralAt(0.995),
      cursor: hue(roles.ui.cursor).base,
      link: hue(roles.ui.link).base,
      selection: oklch(v.selection.lightness, v.selection.chroma, selectionHue),
    },
    status: pick(STATUS_ROLES, (r) => hue(roles.status[r])),
    vcs: pick(VCS_ROLES, (r) => hue(roles.vcs[r])),
    syntax: pick(SYNTAX_ROLES, (r) => ({ color: code(roles.syntax[r]), fontStyle: config.fontStyle?.[r] })),
    markdown: pick(MARKDOWN_ROLES, (r) => ref(roles.markdown[r])),
    ansi: { normal: pick(ANSI_NAMES, chromaticAnsi(false)), bright: pick(ANSI_NAMES, chromaticAnsi(true)) },
  };
}

export function resolveFamily<H extends string>(config: ThemeConfig<H>): ThemeFamily {
  return {
    name: config.name,
    author: config.author,
    version: config.version,
    description: config.description,
    publisher: config.publisher,
    repository: config.repository,
    themes: Object.keys(config.variants).map((id) => resolveTheme(config, id)),
  };
}
