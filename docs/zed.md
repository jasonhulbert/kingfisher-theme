# Zed

Kingfisher for Zed is one theme file with four themes: Kingfisher Light, Kingfisher Dark, Kingfisher Light Muted, and Kingfisher Dark Muted.

## Install

Run these from the repository root. They copy the theme file into Zed's themes folder:

```bash
mkdir -p ~/.config/zed/themes
```

```bash
cp dist/zed/themes/kingfisher.json ~/.config/zed/themes/
```

Zed loads the file without a restart. Open the theme selector with `cmd-k cmd-t`, and pick a Kingfisher theme.

## Switch variants

To follow the system's light or dark mode, set `theme` in `~/.config/zed/settings.json`:

```json
"theme": {
  "mode": "system",
  "light": "Kingfisher Light",
  "dark": "Kingfisher Dark"
}
```

For the muted variants, use Kingfisher Light Muted and Kingfisher Dark Muted.

## Update

After `git pull`, copy the file again with the install command. Zed reloads it without a restart.

## Known issues

- Dim terminal text uses the normal terminal colors. The palette has no dimmer version of each color.
- Links are blue, as in the other editors. ChatGPT and Claude use the orange accent for links.
- `dist/zed/extension.toml` makes the folder a Zed extension, so it can be published later. Installing the folder as a dev extension has not been tried.
