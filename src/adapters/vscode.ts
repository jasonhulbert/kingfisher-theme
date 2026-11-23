/**
 * VS Code: one extension folder with a color theme per variant.
 * Workbench keys: https://code.visualstudio.com/api/references/theme-color
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { alpha, translucent, type Color } from '../color.ts';
import type { SyntaxRole } from '../config.ts';
import type { ResolvedTheme } from '../theme.ts';
import { json, type Adapter } from './types.ts';

const CLEAR = '#00000000';

/** TextMate scopes for each syntax role. */
const SCOPES: Record<SyntaxRole, string[]> = {
  comment: ['comment', 'punctuation.definition.comment', 'string.quoted.docstring'],
  keyword: ['keyword', 'keyword.control', 'storage', 'storage.type', 'storage.modifier'],
  operator: ['keyword.operator', 'punctuation.accessor', 'punctuation.separator.key-value', 'storage.type.function.arrow'],
  function: ['entity.name.function', 'support.function', 'meta.function-call.generic', 'variable.function'],
  type: ['entity.name.type', 'entity.name.class', 'entity.other.inherited-class', 'support.type', 'support.class', 'entity.name.namespace', 'storage.type.primitive'],
  string: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string'],
  escape: ['constant.character.escape', 'string.regexp', 'punctuation.definition.template-expression', 'punctuation.section.embedded'],
  number: ['constant.numeric', 'keyword.other.unit'],
  constant: ['constant.language', 'variable.other.constant', 'variable.other.enummember', 'support.constant', 'constant.other'],
  property: ['variable.other.property', 'variable.other.object.property', 'support.type.property-name', 'meta.object-literal.key', 'entity.name.tag.yaml', 'support.type.property-name.json'],
  parameter: ['variable.parameter', 'meta.parameter'],
  variable: ['variable', 'variable.other.readwrite', 'meta.definition.variable'],
  tag: ['entity.name.tag', 'punctuation.definition.tag'],
  attribute: ['entity.other.attribute-name', 'entity.other.attribute-name.class.css', 'entity.other.attribute-name.id.css'],
  punctuation: ['punctuation', 'meta.brace', 'punctuation.terminator', 'punctuation.separator'],
};

/** Semantic token types, which override TextMate scopes in languages that provide them. */
const SEMANTIC: Record<string, SyntaxRole> = {
  namespace: 'type',
  class: 'type',
  interface: 'type',
  enum: 'type',
  struct: 'type',
  type: 'type',
  typeParameter: 'type',
  function: 'function',
  method: 'function',
  macro: 'function',
  parameter: 'parameter',
  property: 'property',
  enumMember: 'constant',
  'variable.readonly': 'constant',
  'variable.defaultLibrary': 'constant',
  keyword: 'keyword',
  string: 'string',
  number: 'number',
  regexp: 'escape',
  decorator: 'function',
};

function tokenColors(t: ResolvedTheme) {
  const rules: { name?: string; scope: string | string[]; settings: { foreground?: string; fontStyle?: string } }[] = [];
  // Order matters: later rules win, so the generic variable scope goes first.
  const order: SyntaxRole[] = ['variable', 'punctuation', 'property', 'parameter', 'operator', 'keyword', 'function', 'type', 'string', 'escape', 'number', 'constant', 'tag', 'attribute', 'comment'];
  for (const role of order) {
    const s = t.syntax[role];
    rules.push({ name: role, scope: SCOPES[role], settings: { foreground: s.color.hex, fontStyle: s.fontStyle ?? '' } });
  }
  const md = t.markdown;
  rules.push(
    { name: 'markdown heading', scope: ['markup.heading', 'entity.name.section.markdown', 'punctuation.definition.heading.markdown'], settings: { foreground: md.heading.base.hex, fontStyle: 'bold' } },
    { name: 'markdown bold', scope: ['markup.bold', 'punctuation.definition.bold'], settings: { foreground: md.strong.base.hex, fontStyle: 'bold' } },
    { name: 'markdown italic', scope: ['markup.italic', 'punctuation.definition.italic'], settings: { foreground: md.emphasis.base.hex, fontStyle: 'italic' } },
    { name: 'markdown code', scope: ['markup.inline.raw', 'markup.fenced_code', 'markup.raw'], settings: { foreground: md.code.base.hex } },
    { name: 'markdown quote', scope: ['markup.quote', 'punctuation.definition.quote'], settings: { foreground: md.quote.base.hex, fontStyle: 'italic' } },
    { name: 'markdown list', scope: ['punctuation.definition.list.begin.markdown', 'markup.list.numbered', 'markup.list.unnumbered'], settings: { foreground: md.list.base.hex } },
    { name: 'markdown link', scope: ['markup.underline.link', 'string.other.link', 'meta.link'], settings: { foreground: md.link.base.hex } },
    { name: 'diff inserted', scope: ['markup.inserted'], settings: { foreground: t.vcs.added.base.hex } },
    { name: 'diff deleted', scope: ['markup.deleted'], settings: { foreground: t.vcs.deleted.base.hex } },
    { name: 'diff changed', scope: ['markup.changed'], settings: { foreground: t.vcs.modified.base.hex } },
    { name: 'invalid', scope: ['invalid', 'invalid.illegal'], settings: { foreground: t.status.error.base.hex } },
  );
  return rules;
}

function semanticTokenColors(t: ResolvedTheme) {
  const out: Record<string, { foreground: string; italic?: boolean }> = {};
  for (const [token, role] of Object.entries(SEMANTIC)) {
    const s = t.syntax[role];
    out[token] = { foreground: s.color.hex, ...(s.fontStyle?.includes('italic') ? { italic: true } : {}) };
  }
  return out;
}

function colors(t: ResolvedTheme): Record<string, string> {
  const n = t.neutral;
  const { accent, onAccent, cursor, link, selection } = t.ui;
  const { error, warning, info, hint } = t.status;
  const v = t.vcs;
  const sel = translucent(selection, n.bg);
  const hover = alpha(n.fg, 0.06);
  const fill = (c: Color) => translucent(c, n.bg);
  const brackets = [accent.base, info.base, t.syntax.keyword.color, warning.base, v.renamed.base, v.untracked.base];

  const ansi: Record<string, string> = {};
  for (const [name, c] of Object.entries(t.ansi.normal)) ansi[`terminal.ansi${name[0]!.toUpperCase()}${name.slice(1)}`] = c.hex;
  for (const [name, c] of Object.entries(t.ansi.bright)) ansi[`terminal.ansiBright${name[0]!.toUpperCase()}${name.slice(1)}`] = c.hex;

  return {
    // Base
    foreground: n.fg.hex,
    descriptionForeground: n.muted.hex,
    disabledForeground: n.subtle.hex,
    errorForeground: error.base.hex,
    focusBorder: accent.base.hex,
    'icon.foreground': n.muted.hex,
    'selection.background': sel,
    'widget.shadow': alpha(n.bg, t.appearance === 'dark' ? 0.6 : 0.18),
    'sash.hoverBorder': accent.base.hex,
    'textLink.foreground': link.hex,
    'textLink.activeForeground': t.status.info.bright.hex,
    'textBlockQuote.background': n.surface.hex,
    'textBlockQuote.border': t.markdown.quote.base.hex,
    'textCodeBlock.background': n.surface.hex,
    'textPreformat.foreground': t.markdown.code.base.hex,
    'textPreformat.background': n.surface.hex,
    'textSeparator.foreground': n.border.hex,

    // Buttons and inputs
    'button.background': accent.base.hex,
    'button.foreground': onAccent.hex,
    'button.hoverBackground': accent.bright.hex,
    'button.secondaryBackground': n.raised.hex,
    'button.secondaryForeground': n.fg.hex,
    'button.secondaryHoverBackground': n.border.hex,
    'button.border': CLEAR,
    'checkbox.background': n.raised.hex,
    'checkbox.border': n.border.hex,
    'checkbox.foreground': n.fg.hex,
    'dropdown.background': n.raised.hex,
    'dropdown.border': n.border.hex,
    'dropdown.foreground': n.fg.hex,
    'input.background': n.raised.hex,
    'input.border': n.border.hex,
    'input.foreground': n.fg.hex,
    'input.placeholderForeground': n.subtle.hex,
    'inputOption.activeBackground': fill(accent.tint),
    'inputOption.activeBorder': accent.base.hex,
    'inputOption.activeForeground': n.fg.hex,
    'inputValidation.errorBackground': error.tint.hex,
    'inputValidation.errorBorder': error.base.hex,
    'inputValidation.warningBackground': warning.tint.hex,
    'inputValidation.warningBorder': warning.base.hex,
    'inputValidation.infoBackground': info.tint.hex,
    'inputValidation.infoBorder': info.base.hex,
    'badge.background': accent.base.hex,
    'badge.foreground': onAccent.hex,
    'progressBar.background': accent.base.hex,
    'keybindingLabel.background': n.raised.hex,
    'keybindingLabel.border': n.border.hex,
    'keybindingLabel.bottomBorder': n.border.hex,
    'keybindingLabel.foreground': n.fg.hex,

    // Lists, trees, menus, quick input
    'list.activeSelectionBackground': sel,
    'list.activeSelectionForeground': n.fg.hex,
    'list.inactiveSelectionBackground': alpha(n.fg, 0.08),
    'list.hoverBackground': hover,
    'list.focusOutline': accent.base.hex,
    'list.highlightForeground': accent.base.hex,
    'list.focusHighlightForeground': accent.base.hex,
    'list.errorForeground': error.base.hex,
    'list.warningForeground': warning.base.hex,
    'list.dropBackground': fill(accent.tint),
    'tree.indentGuidesStroke': n.border.hex,
    'menu.background': n.raised.hex,
    'menu.foreground': n.fg.hex,
    'menu.border': n.border.hex,
    'menu.selectionBackground': sel,
    'menu.selectionForeground': n.fg.hex,
    'menu.separatorBackground': n.border.hex,
    'quickInput.background': n.raised.hex,
    'quickInput.foreground': n.fg.hex,
    'quickInputList.focusBackground': sel,
    'pickerGroup.foreground': accent.base.hex,
    'pickerGroup.border': n.border.hex,

    // Workbench chrome
    'titleBar.activeBackground': n.surface.hex,
    'titleBar.activeForeground': n.muted.hex,
    'titleBar.inactiveBackground': n.surface.hex,
    'titleBar.inactiveForeground': n.subtle.hex,
    'titleBar.border': n.border.hex,
    'activityBar.background': n.surface.hex,
    'activityBar.foreground': n.fg.hex,
    'activityBar.inactiveForeground': n.subtle.hex,
    'activityBar.activeBorder': accent.base.hex,
    'activityBar.border': n.border.hex,
    'activityBarBadge.background': accent.base.hex,
    'activityBarBadge.foreground': onAccent.hex,
    'sideBar.background': n.surface.hex,
    'sideBar.foreground': n.muted.hex,
    'sideBar.border': n.border.hex,
    'sideBarTitle.foreground': n.muted.hex,
    'sideBarSectionHeader.background': n.surface.hex,
    'sideBarSectionHeader.foreground': n.fg.hex,
    'sideBarSectionHeader.border': n.border.hex,
    'statusBar.background': n.surface.hex,
    'statusBar.foreground': n.muted.hex,
    'statusBar.border': n.border.hex,
    'statusBar.noFolderBackground': n.surface.hex,
    'statusBar.debuggingBackground': warning.base.hex,
    'statusBar.debuggingForeground': onAccent.hex,
    'statusBarItem.hoverBackground': hover,
    'statusBarItem.remoteBackground': accent.base.hex,
    'statusBarItem.remoteForeground': onAccent.hex,
    'statusBarItem.errorForeground': error.base.hex,
    'statusBarItem.warningForeground': warning.base.hex,
    'panel.background': n.bg.hex,
    'panel.border': n.border.hex,
    'panelTitle.activeBorder': accent.base.hex,
    'panelTitle.activeForeground': n.fg.hex,
    'panelTitle.inactiveForeground': n.subtle.hex,
    'notifications.background': n.raised.hex,
    'notifications.foreground': n.fg.hex,
    'notifications.border': n.border.hex,
    'notificationsErrorIcon.foreground': error.base.hex,
    'notificationsWarningIcon.foreground': warning.base.hex,
    'notificationsInfoIcon.foreground': info.base.hex,
    'breadcrumb.foreground': n.subtle.hex,
    'breadcrumb.focusForeground': n.fg.hex,
    'breadcrumb.activeSelectionForeground': n.fg.hex,
    'breadcrumbPicker.background': n.raised.hex,
    'scrollbar.shadow': CLEAR,
    'scrollbarSlider.background': alpha(n.subtle, 0.2),
    'scrollbarSlider.hoverBackground': alpha(n.subtle, 0.35),
    'scrollbarSlider.activeBackground': alpha(n.subtle, 0.5),

    // Tabs
    'editorGroupHeader.tabsBackground': n.surface.hex,
    'editorGroupHeader.tabsBorder': n.border.hex,
    'editorGroup.border': n.border.hex,
    'editorGroup.dropBackground': fill(accent.tint),
    'tab.activeBackground': n.bg.hex,
    'tab.activeForeground': n.fg.hex,
    'tab.activeBorderTop': accent.base.hex,
    'tab.activeBorder': n.bg.hex,
    'tab.inactiveBackground': n.surface.hex,
    'tab.inactiveForeground': n.subtle.hex,
    'tab.hoverBackground': n.line.hex,
    'tab.border': n.border.hex,
    'tab.unfocusedActiveBorderTop': n.subtle.hex,
    'tab.unfocusedActiveForeground': n.muted.hex,
    'tab.modifiedBorder': v.modified.base.hex,

    // Editor
    'editor.background': n.bg.hex,
    'editor.foreground': n.fg.hex,
    'editorCursor.foreground': cursor.hex,
    'editor.lineHighlightBackground': n.line.hex,
    'editor.lineHighlightBorder': CLEAR,
    'editor.selectionBackground': sel,
    'editor.inactiveSelectionBackground': alpha(n.fg, 0.08),
    'editor.selectionHighlightBackground': alpha(t.ui.selection, 0.6),
    'editor.wordHighlightBackground': alpha(n.fg, 0.08),
    'editor.wordHighlightStrongBackground': alpha(n.fg, 0.12),
    'editor.findMatchBackground': fill(warning.strong),
    'editor.findMatchBorder': warning.base.hex,
    'editor.findMatchHighlightBackground': fill(warning.tint),
    'editor.findRangeHighlightBackground': alpha(n.fg, 0.04),
    'editor.rangeHighlightBackground': alpha(n.fg, 0.04),
    'editor.foldBackground': alpha(n.fg, 0.04),
    'editorLineNumber.foreground': n.subtle.hex,
    'editorLineNumber.activeForeground': n.muted.hex,
    'editorIndentGuide.background1': n.border.hex,
    'editorIndentGuide.activeBackground1': n.subtle.hex,
    'editorWhitespace.foreground': n.border.hex,
    'editorRuler.foreground': n.border.hex,
    'editorCodeLens.foreground': n.subtle.hex,
    'editorInlayHint.foreground': n.subtle.hex,
    'editorInlayHint.background': alpha(n.raised, 0.6),
    'editorLink.activeForeground': link.hex,
    'editorBracketMatch.background': alpha(n.fg, 0.08),
    'editorBracketMatch.border': n.subtle.hex,
    ...Object.fromEntries(brackets.map((c, i) => [`editorBracketHighlight.foreground${i + 1}`, c.hex])),
    'editorBracketHighlight.unexpectedBracket.foreground': error.base.hex,
    'editorError.foreground': error.base.hex,
    'editorWarning.foreground': warning.base.hex,
    'editorInfo.foreground': info.base.hex,
    'editorHint.foreground': hint.base.hex,
    // VS Code reads only the alpha: unused code at 53% opacity.
    'editorUnnecessaryCode.opacity': alpha(n.fg, 0.533),
    'editorGutter.background': n.bg.hex,
    'editorGutter.addedBackground': v.added.base.hex,
    'editorGutter.modifiedBackground': v.modified.base.hex,
    'editorGutter.deletedBackground': v.deleted.base.hex,
    'editorOverviewRuler.border': CLEAR,
    'editorOverviewRuler.addedForeground': alpha(v.added.base, 0.7),
    'editorOverviewRuler.modifiedForeground': alpha(v.modified.base, 0.7),
    'editorOverviewRuler.deletedForeground': alpha(v.deleted.base, 0.7),
    'editorOverviewRuler.errorForeground': error.base.hex,
    'editorOverviewRuler.warningForeground': warning.base.hex,
    'editorOverviewRuler.infoForeground': info.base.hex,
    'editorOverviewRuler.findMatchForeground': warning.base.hex,
    'editorWidget.background': n.raised.hex,
    'editorWidget.foreground': n.fg.hex,
    'editorWidget.border': n.border.hex,
    'editorSuggestWidget.background': n.raised.hex,
    'editorSuggestWidget.border': n.border.hex,
    'editorSuggestWidget.foreground': n.fg.hex,
    'editorSuggestWidget.selectedBackground': sel,
    'editorSuggestWidget.highlightForeground': accent.base.hex,
    'editorSuggestWidget.focusHighlightForeground': accent.base.hex,
    'editorHoverWidget.background': n.raised.hex,
    'editorHoverWidget.border': n.border.hex,
    'editorStickyScroll.background': n.bg.hex,
    'editorStickyScroll.shadow': alpha(n.bg, 0.6),
    'peekView.border': accent.base.hex,
    'peekViewTitle.background': n.raised.hex,
    'peekViewTitleLabel.foreground': n.fg.hex,
    'peekViewTitleDescription.foreground': n.muted.hex,
    'peekViewEditor.background': n.surface.hex,
    'peekViewEditor.matchHighlightBackground': fill(warning.tint),
    'peekViewResult.background': n.surface.hex,
    'peekViewResult.selectionBackground': sel,
    'peekViewResult.matchHighlightBackground': fill(warning.tint),
    'minimap.selectionHighlight': alpha(t.ui.selection, 0.8),
    'minimap.findMatchHighlight': alpha(warning.base, 0.6),
    'minimap.errorHighlight': alpha(error.base, 0.7),
    'minimap.warningHighlight': alpha(warning.base, 0.7),
    'minimapGutter.addedBackground': v.added.base.hex,
    'minimapGutter.modifiedBackground': v.modified.base.hex,
    'minimapGutter.deletedBackground': v.deleted.base.hex,

    // Diff
    'diffEditor.insertedLineBackground': fill(v.added.tint),
    'diffEditor.insertedTextBackground': fill(v.added.strong),
    'diffEditor.removedLineBackground': fill(v.deleted.tint),
    'diffEditor.removedTextBackground': fill(v.deleted.strong),
    'diffEditor.border': n.border.hex,
    'merge.currentHeaderBackground': fill(v.added.strong),
    'merge.currentContentBackground': fill(v.added.tint),
    'merge.incomingHeaderBackground': fill(info.strong),
    'merge.incomingContentBackground': fill(info.tint),

    // Source control
    'gitDecoration.addedResourceForeground': v.added.base.hex,
    'gitDecoration.modifiedResourceForeground': v.modified.base.hex,
    'gitDecoration.deletedResourceForeground': v.deleted.base.hex,
    'gitDecoration.renamedResourceForeground': v.renamed.base.hex,
    'gitDecoration.untrackedResourceForeground': v.untracked.base.hex,
    'gitDecoration.conflictingResourceForeground': v.conflict.base.hex,
    'gitDecoration.ignoredResourceForeground': n.subtle.hex,
    'gitDecoration.stageModifiedResourceForeground': v.modified.base.hex,
    'gitDecoration.stageDeletedResourceForeground': v.deleted.base.hex,

    // Terminal
    'terminal.background': n.bg.hex,
    'terminal.foreground': n.fg.hex,
    'terminal.border': n.border.hex,
    'terminal.selectionBackground': sel,
    'terminalCursor.foreground': cursor.hex,
    ...ansi,

    // Debug
    'debugToolBar.background': n.raised.hex,
    'debugIcon.breakpointForeground': error.base.hex,
    'editor.stackFrameHighlightBackground': fill(warning.tint),
  };
}

function theme(t: ResolvedTheme) {
  return {
    $schema: 'vscode://schemas/color-theme',
    name: t.name,
    type: t.appearance,
    semanticHighlighting: true,
    colors: colors(t),
    tokenColors: tokenColors(t),
    semanticTokenColors: semanticTokenColors(t),
  };
}

export const vscode: Adapter = {
  id: 'vscode',
  name: 'VS Code',
  build(family) {
    const files = family.themes.map((t) => ({ path: `themes/${t.id}-color-theme.json`, contents: json(theme(t)) }));
    const manifest = {
      name: 'kingfisher-theme',
      displayName: family.name,
      description: family.description,
      version: family.version,
      publisher: family.publisher,
      ...(family.repository ? { repository: { type: 'git', url: family.repository } } : {}),
      engines: { vscode: '^1.85.0' },
      categories: ['Themes'],
      contributes: {
        themes: family.themes.map((t) => ({
          label: t.name,
          uiTheme: t.appearance === 'dark' ? 'vs-dark' : 'vs',
          path: `./themes/${t.id}-color-theme.json`,
        })),
      },
    };
    return [{ path: 'package.json', contents: json(manifest) }, ...files];
  },
  install(family, { home }) {
    const extensions = join(home, '.vscode', 'extensions');
    if (!existsSync(join(home, '.vscode'))) return 'VS Code not found (no ~/.vscode folder)';
    return [{ from: '.', to: join(extensions, `${family.publisher}.kingfisher-theme-${family.version}`) }];
  },
};
