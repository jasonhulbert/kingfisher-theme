# ChatGPT

Kingfisher for the ChatGPT desktop app is four theme strings, one for each variant. The app keeps one custom theme for light mode and one for dark mode.

## Install

Run this from the repository root. It copies the Light theme string:

```bash
pbcopy < dist/chatgpt/kingfisher-light.txt
```

Open Settings > Appearance. Click the import button beside Theme, and paste the string into the light theme. Then do the same with `kingfisher-dark.txt` for the dark theme. The app refuses a string whose mode doesn't match: a Light string goes into the light theme, and a Dark string into the dark theme.

## Switch variants

The app's own light or dark setting chooses between its two themes. For the muted variants, import `kingfisher-light-muted.txt` and `kingfisher-dark-muted.txt` in place of Light and Dark.

## Update

After `git pull`, import the strings again.

## Known issues

- A ChatGPT theme takes only an accent, a background, a text color, a contrast level, and three other colors: added lines, removed lines, and skills. The app works out the rest of its colors from those.
- Code blocks use the app's built-in Rose Pine theme. The app doesn't take custom code colors, so code doesn't match Kingfisher's syntax colors.
- The app paints accent text in the accent only when the accent clears its own contrast floor. Otherwise it uses a color of its own. The build stops if any variant's accent would miss that floor.
- Links use the orange accent. The editors use blue links.
- The theme string format is not publicly documented. It was read from app version 26.1111, so an app update can change it.
