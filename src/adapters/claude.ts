/**
 * Claude desktop app, Code tab: Claude Code mods that set the session's colors
 * with `$.theme.set`. Chat has no custom themes; this reaches the Code tab only.
 * Format: https://code.claude.com/docs/en/plugins/mods/interface.md
 *
 * Claude's design system paints about 100 tokens from a gray ramp and five
 * role ramps. Its own builder (vendor/claude-code/make-colors.js) runs here at
 * build time with every ramp step set to a Kingfisher color, so the mod ships
 * finished colors. Code is colored from
 * the five roles, so syntax colors can't follow Kingfisher's syntax roles.
 *
 * A session shows one theme, so the muted variants ship as a second mod.
 * The output folder is a plugin marketplace that lists both mods.
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { checkColors, makeColors } from '../../vendor/claude-code/make-colors.js';
import { contrast, fromHex, mix, type Color } from '../color.ts';
import type { ResolvedTheme, Swatch, ThemeFamily } from '../theme.ts';
import { json, type Adapter, type OutputFile } from './types.ts';

/** The design system's floor for `text-muted` on every surface. */
const MUTED_TEXT = 4.5;

/**
 * The page, then cards, panels and menus, each as light or lighter. Faint
 * text moves from `subtle` toward `muted` only as far as that floor needs.
 * These lay out the ramp's shape; `palette()` then sets every step.
 */
function anchors(t: ResolvedTheme) {
  const n = t.neutral;
  // Light: cards sit lighter than the page. surface-3 would have to match surface-2, so it is left out.
  const surfaces = t.appearance === 'light' ? [n.bg, n.raised, n.raised] : [n.bg, n.surface, n.line, n.line];
  const steps = Array.from({ length: 21 }, (_, i) => mix(n.subtle, n.muted, i / 20));
  const faint = steps.find((c) => surfaces.every((s) => contrast(c, s) >= MUTED_TEXT)) ?? n.muted;
  return {
    'surface-0': surfaces[0]!.hex,
    ...Object.fromEntries(surfaces.slice(1).map((s, i) => [`surface-${i + 1}`, s.hex])),
    'text-primary': n.fg.hex,
    'text-secondary': n.muted.hex,
    'text-muted': faint.hex,
  };
}

type RoleName = 'accent' | 'danger' | 'success' | 'warning' | 'pro';

const roleSwatches = (t: ResolvedTheme): Record<RoleName, Swatch> => ({
  accent: t.ui.accent,
  danger: t.status.error,
  success: t.status.success,
  warning: t.status.warning,
  pro: t.status.hint,
});

/**
 * The ramp steps each role's tokens read, from the design system's token
 * graph. Hover is the step beside the fill, toward the light end.
 */
function steps(role: RoleName, appearance: ResolvedTheme['appearance']) {
  if (appearance === 'light') return { text: 600, hover: 550, bg: 100, border: 250 };
  if (role === 'success') return { text: 400, hover: 350, bg: 800, border: 700 };
  return { text: 300, hover: 250, bg: 800, border: 700 };
}

/** The option whose lightness is closest to `c`'s. */
const byLightness = (c: Color, options: Color[]) =>
  options.reduce((a, b) => (Math.abs(b.l - c.l) < Math.abs(a.l - c.l) ? b : a));

/** Ramp steps by number, from the design system's inputs for one prefix. */
function rampOf(inputs: Record<string, string>, prefix: string): Record<number, Color> {
  return Object.fromEntries(
    Object.entries(inputs).flatMap(([key, hex]) => {
      const step = key.match(new RegExp(`^${prefix}-(\\d+)$`))?.[1];
      return step ? [[Number(step), fromHex(hex)]] : [];
    }),
  );
}

/**
 * Every ramp step as a Kingfisher color. The design system reads all 35
 * gray steps and six to eight steps of each role. Left to itself it
 * fills the steps between the colors it is given with blends. Instead, its
 * ramps are built once to learn which shade each step should be, and each
 * step then takes the palette color of that lightness: a neutral for gray,
 * one of the role's four swatch colors for a role. The steps the tokens
 * read for text, hover, background and border are pinned to their swatch
 * color.
 */
function palette(t: ResolvedTheme) {
  const swatches = roleSwatches(t);
  const seeds = Object.fromEntries(Object.entries(swatches).map(([r, s]) => [r, s.base.hex]));
  const { theme } = makeColors({
    label: 'shape',
    id: 'shape',
    only: t.appearance,
    [t.appearance]: { gray: { anchors: anchors(t) }, roles: seeds },
  });
  const inputs = theme.inputs[t.appearance] as Record<string, string>;
  const neutrals = Object.values(t.neutral);
  const gray = Object.fromEntries(Object.entries(rampOf(inputs, 'gray')).map(([step, c]) => [step, byLightness(c, neutrals).hex]));
  const roles = Object.fromEntries(
    (Object.keys(swatches) as RoleName[]).map((r) => {
      const s = swatches[r];
      const at = steps(r, t.appearance);
      const options = [s.base, s.bright, s.tint, s.strong];
      const stops: Record<number, string> = Object.fromEntries(
        Object.entries(rampOf(inputs, `role-${r}`)).map(([step, c]) => [step, byLightness(c, options).hex]),
      );
      Object.assign(stops, { [at.text]: s.base.hex, [at.hover]: s.bright.hex, [at.bg]: s.tint.hex, [at.border]: s.strong.hex });
      return [r, { stops, fillShade: at.text }];
    }),
  );
  return { gray, roles };
}

function mode(t: ResolvedTheme) {
  const { gray, roles } = palette(t);
  return {
    gray: { stops: gray },
    roles,
    git: {
      added: t.vcs.added.base.hex,
      removed: t.vcs.deleted.base.hex,
      modified: t.vcs.modified.base.hex,
      conflicting: t.vcs.conflict.base.hex,
      merged: t.status.hint.base.hex,
      closed: t.vcs.deleted.base.hex,
      draft: t.neutral.muted.hex,
    },
  };
}

/** One mod per set of variants that share a muted setting, each with a light and a dark mode. */
function mods(family: ThemeFamily) {
  return [false, true]
    .map((muted) => ({
      name: muted ? `${family.name} Muted` : family.name,
      themes: family.themes.filter((t) => t.muted === muted),
    }))
    .filter((m) => m.themes.length > 0)
    .map((m) => ({ ...m, id: m.name.toLowerCase().replace(/\s+/g, '-') }));
}

/**
 * Two kinds of input the builder picks on its own. For text on a role's
 * fill it may take pure white or black; that becomes the palette's on-accent,
 * text or page color, whichever contrasts most with the fill. In light mode it
 * darkens the added and modified git fills; they take their git color.
 */
function onlyPalette(inputs: Record<string, string>, t: ResolvedTheme) {
  const n = t.neutral;
  const palette = new Set([...Object.values(n), t.ui.onAccent].map((c) => c.hex));
  for (const r of Object.keys(roleSwatches(t))) {
    const on = `role-${r}-on`;
    if (palette.has(inputs[on]!)) continue;
    const fill = fromHex(inputs[`role-${r}-fill`]!);
    inputs[on] = [t.ui.onAccent, n.fg, n.bg].reduce((a, b) => (contrast(b, fill) > contrast(a, fill) ? b : a)).hex;
  }
  for (const git of ['added', 'modified']) inputs[`fill-git-${git}`] = inputs[`text-git-${git}`]!;
}

/** The palette for one mod. Throws on contrast the desktop app would refuse to paint. */
export function colors(name: string, themes: ResolvedTheme[]) {
  const light = themes.find((t) => t.appearance === 'light');
  const dark = themes.find((t) => t.appearance === 'dark');
  const { theme } = makeColors({
    label: name,
    id: name.toLowerCase().replace(/\s+/g, '-'),
    ...(light && { light: mode(light) }),
    ...(dark && { dark: mode(dark) }),
  });
  for (const t of themes) onlyPalette(theme.inputs[t.appearance] as Record<string, string>, t);
  const refused = checkColors(theme).filter((p) => p.startsWith("Desktop won't paint"));
  if (refused.length) throw new Error(`${name}: ${refused.join('\n')}`);
  return theme;
}

function register(name: string, version: string, theme: unknown): string {
  return `// ${name} ${version}. Generated by kingfisher-theme; edit kingfisher.config.ts instead.
import type { Register, ThemeSetArgs } from 'claude-code'

const LOOK: ThemeSetArgs = { colors: ${JSON.stringify(theme)} }

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.theme.set(LOOK)
    return next(e)
  })
}
`;
}

export const claude: Adapter = {
  id: 'claude',
  name: 'Claude',
  build(family) {
    const list = mods(family);
    const marketplace = {
      name: family.name.toLowerCase(),
      owner: { name: family.author },
      description: family.description,
      plugins: list.map(({ id, name }) => ({ name: id, source: `./${id}`, description: `${name} colors for the Code tab` })),
    };
    return [
      { path: '.claude-plugin/marketplace.json', contents: json(marketplace) },
      ...list.flatMap(({ id, name, themes }): OutputFile[] => [
        {
          path: `${id}/.claude-plugin/plugin.json`,
          contents: json({
            name: id,
            version: family.version,
            description: `${name} colors for the Code tab of the Claude desktop app.`,
            author: { name: family.author },
            ...(family.repository && { repository: family.repository }),
          }),
        },
        { path: `${id}/hooks/hooks.json`, contents: json({ modules: ['./register.ts'] }) },
        { path: `${id}/hooks/register.ts`, contents: register(name, family.version, colors(name, themes)) },
      ]),
    ];
  },
  install(_family, { home }) {
    if (!existsSync(join(home, '.claude'))) return 'no ~/.claude folder (Claude Code is not set up)';
    return [{ from: '.', to: join(home, '.claude', 'kingfisher-theme') }];
  },
};
