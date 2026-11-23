import { defineTheme } from './src/config.ts';

/**
 * Kingfisher, option A "Plumage" with the beak as the accent.
 *
 * Colors are OKLCH. Each hue is named for the part of the oriental dwarf
 * kingfisher it was sampled from (see reference/). Stream is the exception:
 * terminals need a cyan, and the bird has none.
 */
export default defineTheme({
  name: 'Kingfisher',
  author: 'Jason Hulbert',
  version: '0.1.0',
  description: 'A palette taken from the oriental dwarf kingfisher.',
  publisher: 'kingfisher',
  repository: 'https://github.com/jasonhulbert/kingfisher-theme',

  neutral: {
    // Near-neutral ink black, with only a trace of blue so it doesn't read as plain grey.
    dark: { hue: 262, chroma: 0.004 },
    // Near-neutral paper and ink-colored text.
    light: { hue: 255, chroma: 0.003 },
  },

  hues: {
    crown: { hue: 16, chroma: 0.17, nudge: { light: -0.02, dark: -0.06 } },
    beak: { hue: 38, chroma: 0.16, nudge: { dark: 0.01 } },
    throat: { hue: 72, chroma: 0.15, nudge: { light: 0.012, dark: 0.08 } },
    perch: { hue: 130, chroma: 0.14, nudge: { dark: 0.02 } },
    stream: { hue: 200, chroma: 0.11 },
    cheek: { hue: 268, chroma: 0.17, nudge: { light: -0.01, dark: -0.02 } },
    mantle: { hue: 300, chroma: 0.16, nudge: { dark: -0.01 } },
    plume: { hue: 342, chroma: 0.18, nudge: { dark: -0.02 } },
  },

  variants: {
    light: {
      label: 'Light',
      appearance: 'light',
      muted: false,
      neutral: { bg: 0.972, surface: 0.948, line: 0.957, raised: 0.99, border: 0.875, subtle: 0.565, muted: 0.47, fg: 0.27 },
      neutralChroma: 0.75,
      accent: { lightness: 0.53, chroma: 1, brightStep: 0.08 },
      syntaxChroma: 0.7,
      selection: { lightness: 0.88, chroma: 0.055 },
      tint: { lightness: 0.94, chroma: 0.035 },
      strong: { lightness: 0.88, chroma: 0.07 },
      ansi: { black: 0.27, brightBlack: 0.47, white: 0.84, brightWhite: 0.93 },
    },
    dark: {
      label: 'Dark',
      appearance: 'dark',
      muted: false,
      neutral: { bg: 0.165, surface: 0.19, line: 0.2, raised: 0.22, border: 0.28, subtle: 0.58, muted: 0.73, fg: 0.91 },
      neutralChroma: 1,
      accent: { lightness: 0.735, chroma: 1, brightStep: 0.07 },
      syntaxChroma: 0.7,
      selection: { lightness: 0.33, chroma: 0.07 },
      tint: { lightness: 0.25, chroma: 0.045 },
      strong: { lightness: 0.34, chroma: 0.08 },
      ansi: { black: 0.3, brightBlack: 0.5, white: 0.78, brightWhite: 0.95 },
    },
    'light-muted': {
      label: 'Light Muted',
      appearance: 'light',
      muted: true,
      neutral: { bg: 0.93, surface: 0.905, line: 0.915, raised: 0.955, border: 0.84, subtle: 0.54, muted: 0.45, fg: 0.335 },
      neutralChroma: 0.8,
      accent: { lightness: 0.5, chroma: 0.58, brightStep: 0.08 },
      syntaxChroma: 0.85,
      selection: { lightness: 0.855, chroma: 0.04 },
      tint: { lightness: 0.895, chroma: 0.0224 },
      strong: { lightness: 0.88, chroma: 0.0406 },
      ansi: { black: 0.27, brightBlack: 0.47, white: 0.84, brightWhite: 0.93 },
    },
    'dark-muted': {
      label: 'Dark Muted',
      appearance: 'dark',
      muted: true,
      neutral: { bg: 0.235, surface: 0.26, line: 0.27, raised: 0.29, border: 0.345, subtle: 0.61, muted: 0.72, fg: 0.85 },
      neutralChroma: 0.75,
      accent: { lightness: 0.715, chroma: 0.55, brightStep: 0.07 },
      syntaxChroma: 0.85,
      selection: { lightness: 0.36, chroma: 0.045 },
      tint: { lightness: 0.29, chroma: 0.024 },
      strong: { lightness: 0.34, chroma: 0.044 },
      ansi: { black: 0.3, brightBlack: 0.5, white: 0.78, brightWhite: 0.95 },
    },
  },

  roles: {
    // The beak points; the cheek patch is the only blue on the bird.
    ui: { accent: 'beak', cursor: 'beak', link: 'cheek', selection: 'cheek' },
    status: { error: 'crown', warning: 'throat', success: 'perch', info: 'cheek', hint: 'mantle' },
    vcs: { added: 'perch', modified: 'cheek', deleted: 'crown', renamed: 'stream', untracked: 'plume', conflict: 'throat' },
    ansi: { red: 'crown', green: 'perch', yellow: 'throat', blue: 'cheek', magenta: 'plume', cyan: 'stream' },
    // Color marks structure and literals. Names (variables, properties,
    // parameters) stay in the text color so code reads calmly.
    syntax: {
      keyword: 'plume',
      function: 'cheek',
      type: 'throat',
      string: 'perch',
      number: 'beak',
      constant: 'beak',
      property: 'fg',
      parameter: 'fg',
      variable: 'fg',
      operator: 'muted',
      escape: 'stream',
      tag: 'crown',
      attribute: 'throat',
      comment: 'subtle',
      punctuation: 'muted',
    },
    markdown: {
      heading: 'beak',
      strong: 'throat',
      emphasis: 'plume',
      code: 'perch',
      quote: 'mantle',
      tag: 'plume',
      mark: 'throat',
      list: 'beak',
      link: 'cheek',
    },
  },

  fontStyle: { comment: 'italic', parameter: 'italic' },
});
