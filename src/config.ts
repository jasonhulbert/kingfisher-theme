/**
 * The shape of the shared theme configuration. `kingfisher.config.ts` fills it
 * in. Adapters never read this directly; they read the resolved theme in
 * `theme.ts`.
 */

export type Appearance = 'light' | 'dark';

/** Neutral steps, from the ground up to body text. */
export const NEUTRALS = ['bg', 'surface', 'line', 'raised', 'border', 'subtle', 'muted', 'fg'] as const;
export type NeutralName = (typeof NEUTRALS)[number];

export const SYNTAX_ROLES = [
  'keyword', 'function', 'type', 'string', 'number', 'constant', 'property', 'parameter',
  'variable', 'operator', 'escape', 'tag', 'attribute', 'comment', 'punctuation',
] as const;
export type SyntaxRole = (typeof SYNTAX_ROLES)[number];

export const STATUS_ROLES = ['error', 'warning', 'success', 'info', 'hint'] as const;
export type StatusRole = (typeof STATUS_ROLES)[number];

export const VCS_ROLES = ['added', 'modified', 'deleted', 'renamed', 'untracked', 'conflict'] as const;
export type VcsRole = (typeof VCS_ROLES)[number];

export const MARKDOWN_ROLES = ['heading', 'strong', 'emphasis', 'code', 'quote', 'tag', 'mark', 'list', 'link'] as const;
export type MarkdownRole = (typeof MARKDOWN_ROLES)[number];

export const ANSI_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;
export type AnsiName = (typeof ANSI_NAMES)[number];
export type ChromaticAnsi = Exclude<AnsiName, 'black' | 'white'>;

export type FontStyle = 'italic' | 'bold' | 'bold italic';

/** An OKLCH lightness and chroma pair. Hue comes from the role that uses it. */
export interface Tone {
  lightness: number;
  chroma: number;
}

export interface HueConfig {
  /** OKLCH hue in degrees. */
  hue: number;
  /** OKLCH chroma at full strength, before the variant's multiplier. */
  chroma: number;
  /** Lightness offsets so hues of different natural brightness read at the same weight. */
  nudge?: Partial<Record<Appearance, number>>;
}

export interface VariantConfig {
  label: string;
  appearance: Appearance;
  muted: boolean;
  /** OKLCH lightness of each neutral step. */
  neutral: Record<NeutralName, number>;
  /** Multiplier on the appearance's neutral chroma. */
  neutralChroma: number;
  accent: {
    /** Lightness of every hue's base color, before nudges. */
    lightness: number;
    /** Multiplier on each hue's chroma. */
    chroma: number;
    /** Lightness added for the bright step (bright ANSI colors, hover states). */
    brightStep: number;
  };
  /** Extra chroma multiplier for code colors, so syntax reads quieter than interface accents. */
  syntaxChroma: number;
  /** Opaque selection color, on the selection hue. */
  selection: Tone;
  /** Quiet background fill for each hue: diff lines, highlights, tags, callouts. */
  tint: Tone;
  /** Solid badge fill for each hue. */
  strong: Tone;
  /** Lightness of the neutral ANSI colors. */
  ansi: { black: number; brightBlack: number; white: number; brightWhite: number };
}

export interface ThemeConfig<H extends string> {
  name: string;
  author: string;
  version: string;
  description: string;
  /** VS Code Marketplace publisher ID. */
  publisher: string;
  /** Public repository URL. Zed requires one to publish an extension. */
  repository?: string;
  /** Neutral hue and chroma for each appearance. */
  neutral: Record<Appearance, { hue: number; chroma: number }>;
  /** The named hues, in display order. */
  hues: Record<H, HueConfig>;
  /** Variant ID to settings. The ID becomes part of each theme's name and file names. */
  variants: Record<string, VariantConfig>;
  /** Which hue (or neutral step) fills each semantic role. */
  roles: {
    ui: { accent: NoInfer<H>; cursor: NoInfer<H>; link: NoInfer<H>; selection: NoInfer<H> };
    status: Record<StatusRole, NoInfer<H>>;
    vcs: Record<VcsRole, NoInfer<H>>;
    ansi: Record<ChromaticAnsi, NoInfer<H>>;
    syntax: Record<SyntaxRole, NoInfer<H> | NeutralName>;
    markdown: Record<MarkdownRole, NoInfer<H> | NeutralName>;
  };
  fontStyle?: Partial<Record<SyntaxRole, FontStyle>>;
}

/** Identity function that gives the config file type checking and hue-name inference. */
export function defineTheme<const H extends string>(config: ThemeConfig<H>): ThemeConfig<H> {
  return config;
}
