# Kingfisher

One color palette, built into matching themes for VS Code, Zed, Warp, Obsidian, and the ChatGPT and Claude desktop apps. The colors come from a photo of an oriental dwarf kingfisher (`reference/`). There are four variants: Light, Dark, Light Muted, and Dark Muted.

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
| Obsidian | `<vault>/.obsidian/themes/Kingfisher/` and `Kingfisher Muted/` | Pick Kingfisher or Kingfisher Muted in Settings > Appearance > Themes. |
| ChatGPT | Light and Dark, written into `~/.codex/config.toml` | Restart ChatGPT. |
| Claude | `~/.claude/kingfisher-theme/` | Install once (see below). After a palette change, run `/reload-plugins` or start a new session. |

An Obsidian theme has only a light and a dark mode, so the muted variants ship as a second theme, Kingfisher Muted. Obsidian's own light and dark setting chooses between Light and Dark, or between Light Muted and Dark Muted. A custom accent color in Obsidian's Appearance settings overrides the theme's accent.

ChatGPT takes only an accent, a background, a text color, and diff colors. It works out the rest of its colors itself, and code highlighting uses its built-in Rose Pine theme. It paints accent text in the accent only when the accent clears its own contrast floor, and otherwise substitutes a color of its own. Kingfisher's accent is set light enough in dark and dark enough in light to clear that floor in every variant, and the build stops if it ever would not. Its custom theme has a light and a dark slot. The install writes Light and Dark into those slots and leaves every other setting in `config.toml` as it was. To use a muted variant, copy the contents of `dist/chatgpt/kingfisher-light-muted.txt` or `kingfisher-dark-muted.txt`, then click the import button beside Theme in Settings > Appearance. The ChatGPT format is not publicly documented. It was read from app version 26.1111, so an app update can change it.

Claude has no custom themes for Chat. Kingfisher themes the Code tab of the Claude desktop app through a Claude Code mod. A session shows one theme, so there are two mods, `kingfisher` and `kingfisher-muted`. Each has a light and a dark mode, and the app's own light or dark setting chooses between them. The install folder is a plugin marketplace. Add it and install one mod, once:

```bash
claude plugin marketplace add ~/.claude/kingfisher-theme
```

```bash
claude plugin install kingfisher@kingfisher
```

Claude Code reads the mod from that folder, so later installs need only `/reload-plugins`. To switch to the muted mod, uninstall `kingfisher@kingfisher` and install `kingfisher-muted@kingfisher`.

Claude's design system paints about 100 tokens from a 35-step gray ramp and a ramp for each of its five roles. It colors code from those roles, not from Kingfisher's syntax roles. Left to itself, it fills the steps between the colors it is given with blends. The adapter sets every step to a Kingfisher color instead: a neutral for each gray step, and one of the role's four swatch colors for each role step. Where the builder picks a color on its own, the adapter replaces it with a palette color and checks the theme again. Its builder, `vendor/claude-code/make-colors.js`, runs at build time. The build stops if the desktop app would refuse to paint a palette. The builder comes from Claude Code's plugin-authoring skill. Copy it again, unchanged, when Claude Code updates.

Each adapter's `install()` method decides where its files go. An adapter with no `install()` is built but not installed.

## Adding an app

1. Create `src/adapters/<app>.ts` that exports an `Adapter`. Its `build(family)` method receives every resolved variant and returns a list of `{ path, contents }` files. An optional `install()` method returns where those files go on this machine, or the new contents of an app settings file.
2. Add the adapter to `src/adapters/index.ts`.

Read colors from the roles in `ResolvedTheme` (`src/theme.ts`), not from hue names. That keeps the new app consistent with the others when the palette changes.

Paint only palette colors. Don't blend two of them. Where an app has more shades than the palette, let neighboring shades share a palette color. A translucent color is fine if it shows as a palette color over the background; `translucent()` in `src/color.ts` makes one.

## Before publishing

- `publisher` in the config is a placeholder. Replace it with your VS Code Marketplace publisher ID.
