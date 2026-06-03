# Higgsfield Prompt Toggle

A lightweight Chrome extension that adds a floating toggle button to hide or reveal the prompt bar on [Higgsfield AI's](https://higgsfield.ai) image generator. One click hides the input — the output gets the full screen.

Higgsfield keeps rolling out new tools and capabilities at an impressive pace. This tiny toggle is our way of keeping the canvas clean while you explore what's next.

<p align="center">
  <img src="explainer%20video.gif" width="640" alt="Higgsfield Prompt Toggle demo"/>
</p>

> Prefer a video walkthrough? [Watch the explainer video →](explainer%20video.mp4)

## Features

- **One-click toggle** — hide or show the prompt bar instantly
- **Fully customizable** — pick your color, button size, icon size, opacity, and icon style
- **Drag anywhere** — reposition the button wherever feels right
- **Persistent** — remembers your preferences and button position across sessions
- **Keyboard shortcut** — press `P` to toggle
- **Stays out of the way** — only activates on image pages, ignores video, audio, and other areas

## Installation

1. Open `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Navigate to [https://higgsfield.ai/ai/image](https://higgsfield.ai/ai/image) — the toggle appears at the bottom right

## Usage

| Action | What happens |
|---|---|
| Click the button | Toggles the prompt bar |
| Drag the button | Repositions it anywhere |
| Press `P` | Same as click (unless typing in a field) |
| Long-press the button | Opens settings panel |

## Customization

Long-press the button to open settings. From there:

- **Color** — pick from presets or choose any color
- **Circle size** — button diameter (36–80px)
- **Icon size** — icon inside the button (14–36px)
- **Opacity** — transparency level
- **Icon style** — Eye, Ghost, Bulb, or Spark

## How it works

The extension injects a small floating button on Higgsfield's image generation page. The button sits in a fixed position, can be dragged anywhere, and toggles a CSS class on the prompt bar to hide or reveal it. All preferences are stored in `localStorage` — no account, no sync, no telemetry.

## Files

```
manifest.json    Chrome MV3 extension manifest
content.js       All logic (button, drag, settings, persistence, SPA detection)
toggle.css       All styles (injected as content script CSS)
icons/           PNG icon set (16/32/48/128)
```

No build tools. No dependencies. Just vanilla JS and CSS.

## License

MIT
