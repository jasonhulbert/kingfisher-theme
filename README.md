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
dist/<app>/            built theme files, committed so a clone needs no build
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

## Setting up an app

The built theme files are committed in `dist/`, so a fresh clone needs no build. Each app has its own guide. A guide covers installing, switching variants, updating, and known issues.

| App | Guide |
| --- | --- |
| VS Code | [docs/vscode.md](docs/vscode.md) |
| Zed | [docs/zed.md](docs/zed.md) |
| Warp | [docs/warp.md](docs/warp.md) |
| Obsidian | [docs/obsidian.md](docs/obsidian.md) |
| ChatGPT | [docs/chatgpt.md](docs/chatgpt.md) |
| Claude (Code tab) | [docs/claude-desktop.md](docs/claude-desktop.md) |

## After a palette change

Edit `kingfisher.config.ts`, run `npm run build`, and commit `dist/` with the change. `npm test` fails if `dist/` doesn't match a fresh build. On another machine, run `git pull`, then follow the Update step in the guide for each app you use.

## Adding an app

1. Create `src/adapters/<app>.ts` that exports an `Adapter`. Its `build(family)` method receives every resolved variant and returns a list of `{ path, contents }` files.
2. Add the adapter to `src/adapters/index.ts`.
3. Run `npm run build`, and commit the new `dist/<app>/` folder.
4. Write `docs/<app>.md` with the same sections as the other guides, and add it to the table above. Don't name a guide `claude.md`. macOS file names ignore case, so Claude Code would read it as a `CLAUDE.md` instructions file.

Read colors from the roles in `ResolvedTheme` (`src/theme.ts`), not from hue names. That keeps the new app consistent with the others when the palette changes.

Paint only palette colors. Don't blend two of them. Where an app has more shades than the palette, let neighboring shades share a palette color. A translucent color is fine if it shows as a palette color over the background; `translucent()` in `src/color.ts` makes one.

## Before publishing

- `publisher` in the config is a placeholder. Replace it with your VS Code Marketplace publisher ID.
