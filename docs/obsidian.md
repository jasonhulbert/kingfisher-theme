# Obsidian

Kingfisher for Obsidian is two themes. Kingfisher has the Light and Dark variants. Kingfisher Muted has the Light Muted and Dark Muted variants. An Obsidian theme has only a light and a dark mode, so the muted variants are a theme of their own.

## Install

Themes belong to a vault, so repeat this for each vault. Run these from the repository root, and replace `~/Notes` with the vault's folder:

```bash
mkdir -p ~/Notes/.obsidian/themes
```

```bash
cp -R dist/obsidian/Kingfisher "dist/obsidian/Kingfisher Muted" ~/Notes/.obsidian/themes/
```

Open Settings > Appearance, and pick Kingfisher or Kingfisher Muted under Themes.

## Switch variants

Obsidian's Base color scheme setting, in Settings > Appearance, chooses between light and dark. Set it to Adapt to system to follow the system. Pick Kingfisher Muted under Themes for the muted variants.

## Update

After `git pull`, copy the folders again with the install command. Obsidian reloads the theme without a restart.

## Known issues

- An accent color set in Settings > Appearance overrides the theme's accent. Reset it to use Kingfisher's accent.
- Links are blue, as in the editors. ChatGPT and Claude use the orange accent for links.
