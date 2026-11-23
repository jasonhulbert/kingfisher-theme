# Warp

Kingfisher for Warp is four theme files: Kingfisher Light, Kingfisher Dark, Kingfisher Light Muted, and Kingfisher Dark Muted.

## Install

Run these from the repository root. They copy the themes into Warp's themes folder:

```bash
mkdir -p ~/.warp/themes
```

```bash
cp dist/warp/*.yaml ~/.warp/themes/
```

Open Settings > Appearance > Themes, and pick a Kingfisher theme.

## Switch variants

To follow the system's light or dark mode, turn on Sync with OS in Settings > Appearance > Themes. Then pick Kingfisher Light for light mode and Kingfisher Dark for dark mode. For the muted variants, pick Kingfisher Light Muted and Kingfisher Dark Muted.

## Update

After `git pull`, copy the files again with the install command. If the colors don't change, pick the theme again or restart Warp.

## Known issues

- A Warp theme sets only the accent, the cursor, the background, the text color, and the 16 terminal colors. Warp works out the rest of its interface from those.
- Warp documents only 6-digit hex colors, so the themes have no translucent colors.
