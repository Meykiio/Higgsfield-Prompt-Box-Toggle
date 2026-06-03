# Higgsfield Prompt Toggle — Agent Guide

## Project

Chrome MV3 extension that adds a floating toggle button to hide/show the prompt bar on `https://higgsfield.ai/ai/image*`.

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3 extension manifest; matches `https://higgsfield.ai/ai/image*` only |
| `content.js` | All logic (button, settings panel, drag, persistence, observer, URL guard) |
| `toggle.css` | All styles (injected as content script CSS) |
| `icons/` | PNG icon set (16/32/48/128) |
| `explainer video.mp4` | Video walkthrough embedded in README |
| `explainer gif.gif` | Animated GIF demo embedded in README |

## Conventions

- **No build step** — vanilla ES5-safe IIFE, no bundler, no package.json, no npm deps.
- **No CI, no tests** — manual load in `chrome://extensions` with Developer Mode.
- **No `chrome.storage`** — persistence uses `localStorage` (keys: `hf_prompt_visible`, `hf_btn_prefs`).
- **CSS** uses `!important` throughout — required for injected content script styles to override host page.
- **MutationObserver** uses `{ childList: true, subtree: true, attributes: false }` — attribute watching is off to prevent observer self-trigger loops from the extension's own DOM mutations.
- **Observer pause/resume** pattern (`pauseObserver`/`resumeObserver`) wraps any DOM mutation the extension itself performs.
- **Keyboard shortcut:** press `P` (not Ctrl/Cmd/Meta) to toggle — skipped when focus is in an input/textarea/contenteditable. Also guarded by `pageValid` — only responds on `/ai/image` pages.
- **URL guard:** Extension injects on `https://higgsfield.ai/ai/image*` only (manifest match + runtime `isOnImagePage()` regex). `popstate` + mutation observer tear down/re-inject on SPA navigation.
- **Prefs keys:** `circleSize` (button diameter, 36–80) and `iconSize` (icon within button, 14–36). Migration from legacy `size` key in `loadPrefs()`.
- **Settings panel:** Opened via long-press (600ms hold) on the toggle button. Uses `position: fixed` with `requestAnimationFrame` for enter animation. Click-outside closes it.
- **SPA cleanup:** `cleanup()` disconnects observer, removes button + panel. `checkPage()` re-runs `init()` when user navigates back to `/ai/image`.

## Loading for testing

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → point at repo root
4. Navigate to `https://higgsfield.ai/ai/image` to test
