# VS Code

Kingfisher for VS Code is one extension with four color themes: Kingfisher Light, Kingfisher Dark, Kingfisher Light Muted, and Kingfisher Dark Muted.

## Install

Run this from the repository root. It copies the extension into VS Code's extensions folder:

```bash
cp -R dist/vscode ~/.vscode/extensions/kingfisher.kingfisher-theme-0.1.0
```

Restart VS Code. Run Preferences: Color Theme from the Command Palette, and pick a Kingfisher theme.

## Switch variants

To follow the system's light or dark mode, add these settings to `settings.json`:

```json
"window.autoDetectColorScheme": true,
"workbench.preferredLightColorTheme": "Kingfisher Light",
"workbench.preferredDarkColorTheme": "Kingfisher Dark"
```

For the muted variants, use Kingfisher Light Muted and Kingfisher Dark Muted.

## Update

After `git pull`, remove the old extension:

```bash
rm -rf ~/.vscode/extensions/kingfisher.kingfisher-theme-*
```

Copy it again with the install command, then restart VS Code.

## Known issues

- These themes have not been checked on screen yet. VS Code was not installed on the machine where the palette was tuned.
- The folder name comes from `publisher` and `version` in `kingfisher.config.ts`, and `publisher` is a placeholder. If either value changes, change the folder name in the install command to match `dist/vscode/package.json`.
