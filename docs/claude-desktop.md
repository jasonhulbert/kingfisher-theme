# Claude

Kingfisher themes the Code tab of the Claude desktop app through a Claude Code mod. Chat has no custom themes. A session shows one theme, so there are two mods: `kingfisher` has the Light and Dark variants, and `kingfisher-muted` has the Light Muted and Dark Muted variants.

## Install

You need the `claude` command. `dist/claude` is a plugin marketplace that lists both mods. Run these from the repository root to add it and install one mod:

```bash
claude plugin marketplace add "$PWD/dist/claude"
```

```bash
claude plugin install kingfisher@kingfisher
```

Then run `/reload-plugins` in the Code tab, or start a new session. The marketplace points at this repository's folder, so don't move the repository after adding it.

## Switch variants

The app's own light or dark setting chooses between the mod's two modes. To switch to the muted mod:

```bash
claude plugin uninstall kingfisher@kingfisher
```

```bash
claude plugin install kingfisher-muted@kingfisher
```

## Update

After `git pull`, run `/reload-plugins` in the Code tab, or start a new session.

## How the colors are made

Claude's design system paints about 100 colors from a 35-step gray ramp and a ramp for each of its five roles. Left to itself, it fills the steps between the colors it is given with blends. The adapter sets every step to a Kingfisher color instead: a neutral for each gray step, and one of the role's four swatch colors for each role step. Where the design system picks a color on its own, the adapter replaces it with a palette color and checks the theme again. The build stops if the desktop app would refuse to paint a theme.

The design system's builder, `vendor/claude-code/make-colors.js`, runs at build time. It comes from Claude Code's plugin-authoring skill. When Claude Code updates, copy it again, unchanged, and rebuild.

## Known issues

- Code is colored from the five roles, not from Kingfisher's syntax colors.
- Links use the orange accent. The editors use blue links.
- Some colors come from Claude's own formulas or fixed colors, and are below 4.5:1 contrast:
  - Git badges in Dark Muted, at 3.6:1 to 4.2:1.
  - Yellow and violet text on Claude's built-in tints in Light, at 3.98:1 and 4.34:1.
  - Main text on the comment highlight in Dark Muted, at 3.37:1.
