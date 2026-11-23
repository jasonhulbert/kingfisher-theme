/**
 * Zed: one theme family file with every variant, inside an extension folder.
 * Schema: https://zed.dev/schema/themes/v0.2.0.json
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { alpha, mix, translucent, type Color } from '../color.ts';
import type { SyntaxRole } from '../config.ts';
import type { ResolvedTheme, Swatch } from '../theme.ts';
import { json, type Adapter } from './types.ts';

const CLEAR = '#00000000';

interface Highlight {
  color: string;
  font_style?: 'italic' | 'normal';
  font_weight?: number;
}

function syntax(t: ResolvedTheme): Record<string, Highlight> {
  const role = (r: SyntaxRole, extra: Partial<Highlight> = {}): Highlight => {
    const s = t.syntax[r];
    return {
      color: s.color.hex,
      ...(s.fontStyle?.includes('italic') ? { font_style: 'italic' as const } : {}),
      ...(s.fontStyle?.includes('bold') ? { font_weight: 700 } : {}),
      ...extra,
    };
  };
  const md = t.markdown;
  return {
    attribute: role('attribute'),
    boolean: role('constant'),
    comment: role('comment'),
    'comment.doc': role('comment'),
    constant: role('constant'),
    constructor: role('type'),
    embedded: { color: t.neutral.fg.hex },
    emphasis: { color: md.emphasis.base.hex, font_style: 'italic' },
    'emphasis.strong': { color: md.strong.base.hex, font_weight: 700 },
    enum: role('type'),
    function: role('function'),
    'function.method': role('function'),
    hint: { color: t.status.hint.base.hex, font_style: 'italic' },
    keyword: role('keyword'),
    label: role('property'),
    link_text: { color: md.link.base.hex },
    link_uri: { color: t.neutral.subtle.hex },
    number: role('number'),
    operator: role('operator'),
    predictive: { color: t.neutral.subtle.hex, font_style: 'italic' },
    preproc: role('keyword'),
    primary: { color: t.neutral.fg.hex },
    property: role('property'),
    punctuation: role('punctuation'),
    'punctuation.bracket': role('punctuation'),
    'punctuation.delimiter': role('punctuation'),
    'punctuation.list_marker': { color: md.list.base.hex },
    'punctuation.special': role('escape'),
    string: role('string'),
    'string.escape': role('escape'),
    'string.regex': role('escape'),
    'string.special': role('escape'),
    'string.special.symbol': role('constant'),
    tag: role('tag'),
    'text.literal': { color: md.code.base.hex },
    title: { color: md.heading.base.hex, font_weight: 700 },
    type: role('type'),
    variable: role('variable'),
    'variable.parameter': role('parameter'),
    'variable.special': role('keyword'),
    variant: role('type'),
  };
}

function status(name: string, s: Swatch, bg: Color): Record<string, string> {
  return {
    [name]: s.base.hex,
    [`${name}.background`]: translucent(s.tint, bg),
    [`${name}.border`]: s.base.hex,
  };
}

function style(t: ResolvedTheme) {
  const n = t.neutral;
  const { accent, cursor, selection } = t.ui;
  const sel = translucent(selection, n.bg);
  const borderVariant = mix(n.border, n.surface, 0.5);
  const v = t.vcs;
  const s = t.status;

  const ansi: Record<string, string> = {};
  for (const [name, c] of Object.entries(t.ansi.normal)) {
    ansi[`terminal.ansi.${name}`] = c.hex;
    ansi[`terminal.ansi.dim_${name}`] = mix(c, n.bg, 0.35).hex;
  }
  for (const [name, c] of Object.entries(t.ansi.bright)) ansi[`terminal.ansi.bright_${name}`] = c.hex;

  // The first player is you. The rest color collaborators' cursors.
  const others = t.hues.filter((h) => h.name !== t.ui.accent.name);
  const players = [
    { cursor: cursor.hex, background: cursor.hex, selection: sel },
    ...others.map((h) => ({ cursor: h.base.hex, background: h.base.hex, selection: alpha(h.base, 0.25) })),
  ];

  return {
    'background.appearance': 'opaque',
    accents: [accent.base, t.status.info.base, t.syntax.keyword.color, t.status.warning.base, v.renamed.base, v.untracked.base].map((c) => c.hex),

    background: n.surface.hex,
    'surface.background': n.surface.hex,
    'elevated_surface.background': n.raised.hex,
    'panel.background': n.surface.hex,
    'panel.focused_border': accent.base.hex,
    'panel.indent_guide': n.border.hex,
    'panel.indent_guide_active': n.subtle.hex,
    'panel.indent_guide_hover': n.muted.hex,
    'pane.focused_border': accent.base.hex,
    'pane_group.border': n.border.hex,
    'drop_target.background': alpha(accent.base, 0.2),

    border: n.border.hex,
    'border.variant': borderVariant.hex,
    'border.focused': accent.base.hex,
    'border.selected': accent.base.hex,
    'border.transparent': CLEAR,
    'border.disabled': borderVariant.hex,

    'element.background': n.raised.hex,
    'element.hover': alpha(n.fg, 0.07),
    'element.active': alpha(n.fg, 0.12),
    'element.selected': sel,
    'element.disabled': alpha(n.fg, 0.04),
    'ghost_element.background': CLEAR,
    'ghost_element.hover': alpha(n.fg, 0.07),
    'ghost_element.active': alpha(n.fg, 0.12),
    'ghost_element.selected': sel,
    'ghost_element.disabled': CLEAR,

    text: n.fg.hex,
    'text.muted': n.muted.hex,
    'text.placeholder': n.subtle.hex,
    'text.disabled': n.subtle.hex,
    'text.accent': accent.base.hex,
    icon: n.muted.hex,
    'icon.muted': n.subtle.hex,
    'icon.disabled': n.subtle.hex,
    'icon.placeholder': n.subtle.hex,
    'icon.accent': accent.base.hex,
    'link_text.hover': t.ui.link.hex,

    'status_bar.background': n.surface.hex,
    'title_bar.background': n.surface.hex,
    'title_bar.inactive_background': n.surface.hex,
    'toolbar.background': n.bg.hex,
    'tab_bar.background': n.surface.hex,
    'tab.inactive_background': n.surface.hex,
    'tab.active_background': n.bg.hex,
    'search.match_background': translucent(s.warning.strong, n.bg),

    'scrollbar.thumb.background': alpha(n.subtle, 0.25),
    'scrollbar.thumb.hover_background': alpha(n.subtle, 0.4),
    'scrollbar.thumb.border': CLEAR,
    'scrollbar.track.background': CLEAR,
    'scrollbar.track.border': CLEAR,

    'editor.foreground': n.fg.hex,
    'editor.background': n.bg.hex,
    'editor.gutter.background': n.bg.hex,
    'editor.subheader.background': n.surface.hex,
    'editor.active_line.background': n.line.hex,
    'editor.highlighted_line.background': n.line.hex,
    'editor.line_number': n.subtle.hex,
    'editor.active_line_number': n.muted.hex,
    'editor.invisible': n.border.hex,
    'editor.wrap_guide': borderVariant.hex,
    'editor.active_wrap_guide': n.border.hex,
    'editor.indent_guide': borderVariant.hex,
    'editor.indent_guide_active': n.subtle.hex,
    'editor.document_highlight.read_background': alpha(n.fg, 0.08),
    'editor.document_highlight.write_background': alpha(n.fg, 0.12),
    'editor.document_highlight.bracket_background': alpha(n.fg, 0.1),

    'terminal.background': n.bg.hex,
    'terminal.ansi.background': n.bg.hex,
    'terminal.foreground': n.fg.hex,
    'terminal.bright_foreground': t.ansi.bright.white.hex,
    'terminal.dim_foreground': n.muted.hex,
    ...ansi,

    ...status('error', s.error, n.bg),
    ...status('warning', s.warning, n.bg),
    ...status('success', s.success, n.bg),
    ...status('info', s.info, n.bg),
    ...status('hint', s.hint, n.bg),
    ...status('created', v.added, n.bg),
    ...status('modified', v.modified, n.bg),
    ...status('deleted', v.deleted, n.bg),
    ...status('renamed', v.renamed, n.bg),
    ...status('conflict', v.conflict, n.bg),
    ...status('predictive', { ...s.hint, base: n.subtle }, n.bg),
    hidden: n.subtle.hex,
    'hidden.background': n.surface.hex,
    'hidden.border': n.border.hex,
    ignored: n.subtle.hex,
    'ignored.background': n.surface.hex,
    'ignored.border': n.border.hex,
    unreachable: n.subtle.hex,
    'unreachable.background': n.surface.hex,
    'unreachable.border': n.border.hex,

    players,
    syntax: syntax(t),
  };
}

export const zed: Adapter = {
  id: 'zed',
  name: 'Zed',
  build(family) {
    const themeFamily = {
      $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
      name: family.name,
      author: family.author,
      themes: family.themes.map((t) => ({ name: t.name, appearance: t.appearance, style: style(t) })),
    };
    const toml = [
      `id = "${family.name.toLowerCase()}"`,
      `name = "${family.name}"`,
      `version = "${family.version}"`,
      'schema_version = 1',
      `authors = ["${family.author}"]`,
      `description = "${family.description}"`,
      ...(family.repository ? [`repository = "${family.repository}"`] : []),
      '',
    ].join('\n');
    return [
      { path: 'extension.toml', contents: toml },
      { path: `themes/${family.name.toLowerCase()}.json`, contents: json(themeFamily) },
    ];
  },
  install(family, { home }) {
    const config = join(home, '.config', 'zed');
    if (!existsSync(config)) return 'Zed not found (no ~/.config/zed folder)';
    const file = `${family.name.toLowerCase()}.json`;
    return [{ from: `themes/${file}`, to: join(config, 'themes', file) }];
  },
};
