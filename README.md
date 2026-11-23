# Kingfisher

One color palette, built into matching themes for VS Code, Zed, Warp, and Obsidian. The colors come from a photo of an oriental dwarf kingfisher (`reference/`). There are four variants: Light, Dark, Light Muted, and Dark Muted.

## How it works

```
kingfisher.config.ts   the palette: hues, neutrals, variants, and which hue fills each role
        │
src/theme.ts           resolves the config into concrete colors, one theme per variant
        │
src/audit.ts           checks text contrast in every variant; a failure stops the build
        │
src/adapters/*.ts      one adapter per app turns the resolved themes into that app's files
        │
dist/<app>/            generated output (not committed)
```

The config never names an app, and the adapters never name a hue. Adapters read semantic roles, such as `ui.accent`, `syntax.keyword`, or `status.error`. A change in the config therefore reaches every app.

Colors are defined in OKLCH. Each hue has a hue angle and a chroma. Each variant sets the lightness of the neutral steps and the accents. Colors outside the sRGB gamut keep their lightness and hue, and lose chroma until they fit.

## Commands

Requires Node 23.6 or later, which runs TypeScript directly.

```bash
npm install
```

```bash
npm run build
```

```bash
npm run build -- --target zed,warp
```

```bash
npm test
```

```bash
npm run typecheck
```

## Installing on this machine

Build and copy the themes into every app that is installed:

```bash
npm run install-themes -- --vault ~/Notes
```

You can set `KINGFISHER_OBSIDIAN_VAULT` instead of passing `--vault`. Run the command again after every palette change. It replaces only Kingfisher's own files, and skips any app it can't find.

| App | Installed to | To use it |
| --- | --- | --- |
| VS Code | `~/.vscode/extensions/<publisher>.kingfisher-theme-<version>/` | Restart VS Code, then pick a Kingfisher theme. |
| Zed | `~/.config/zed/themes/kingfisher.json` | Pick a Kingfisher theme in the theme selector. |
| Warp | `~/.warp/themes/kingfisher_*.yaml` | Pick a Kingfisher theme in Settings > Appearance. |
| Obsidian | `<vault>/.obsidian/themes/Kingfisher/` | Pick Kingfisher in Settings > Appearance > Themes. |

Obsidian themes support only light and dark modes. The muted variants are applied through a `kingfisher-muted` body class. The [Style Settings](https://github.com/mgmeyers/obsidian-style-settings) plugin shows this class as a "Muted" toggle. A custom accent color in Obsidian's Appearance settings overrides the theme's accent.

Each adapter's `install()` method decides where its files go. An adapter with no `install()` is built but not installed.

## Adding an app

1. Create `src/adapters/<app>.ts` that exports an `Adapter`. Its `build(family)` method receives every resolved variant and returns a list of `{ path, contents }` files. An optional `install()` method returns where those files go on this machine.
2. Add the adapter to `src/adapters/index.ts`.

Read colors from the roles in `ResolvedTheme` (`src/theme.ts`), not from hue names. That keeps the new app consistent with the others when the palette changes.

## Before publishing

- `publisher` in the config is a placeholder. Replace it with your VS Code Marketplace publisher ID.
- Zed's extension registry requires a `repository` URL in the config.
