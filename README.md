# Gonzalo Zurita — Personal CV Site

A minimal, printable personal site built with plain HTML, CSS and vanilla JavaScript. Focus areas: a pixel-perfect timeline, client-side i18n (English/Spanish), and a compact print/PDF layout.

---

## Features

- **Single-file runtime:** one CSS (`styles.css`) and one JS (`main.js`) file drive the UI.
- **i18n (EN/ES):** translations live in `i18n/en.json` and `i18n/es.json`; toggled using a floating language control and persisted in `localStorage`.
- **Timeline:** JS-driven connectors and date badges keep the timeline aligned; overflow items are moved into `#olderExperiences`.
- **Add Experience (UI):** quick modal to compose new experience entries. The modal generates an HTML snippet you paste into `index.html` for manual persistence.
- **Print-first design:** print rules hide UI chrome and print a compact CV (default: 3 most-recent experiences).

---

## Files of Interest

- `index.html` — site markup, `data-i18n` annotations.
- `styles.css` — layout, theme, and `@media print` rules.
- `main.js` — timeline rendering, i18n loader, add-experience UI, helpers.
- `i18n/en.json`, `i18n/es.json` — translation resources.

---

## Quick Start (local)

Run a simple HTTP server from the project root (required because `fetch()` loads JSON):

Python 3:

```bash
python -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` and navigate to the site folder.

Then test:

- Toggle language with the floating control (EN/ES).
- Use the Add Experience modal (press `Ctrl+Shift+E` to reveal the Add button), compose an entry, copy the snippet and paste it into `index.html`.

Paste location: insert the snippet inside the timeline container, before the `show-more-wrap` or before `#olderExperiences` so the new item appears in the visible list. See [index.html](index.html#L140) and [index.html](index.html#L144).

---

## Developer Notes & Console Helpers

- `window.rebalanceTimeline(n)` — rearranges `.experience-item` nodes so `n` items remain visible; moves the rest under `#olderExperiences`.
- `window.updateConnectors()` — recalculates timeline connectors and badge positions for the current DOM layout.
- `window.setLanguage('en'|'es')` — switch language programmatically.
- `window.addExperience(opts)` — (runtime) create a new `.experience-item` in the DOM. This does not persist to disk.

> Important: all of the functions above operate on the *live page DOM only*. They do NOT modify files on disk. To make an experience permanent, paste the generated HTML into `index.html` and save.

---

## Shortcuts

- `Ctrl+Shift+E` — reveal the Add Experience button (the Add button is hidden by default and only shown after this shortcut).
- `Esc` — close modals (Add Experience, Snippet modal) when they are open.
- In the Snippet modal: click **Copy to clipboard** to copy the generated HTML snippet.

You can also run the helpers from the browser console after pasting or creating items:

```js
// keep 3 visible items and move the rest to #olderExperiences
window.rebalanceTimeline(3)

// recalc connectors after manual DOM edits
window.updateConnectors()
```

---

## Print & PDF

- The site applies `@media print` rules for compact exports: it hides interactive chrome and prints a condensed CV. By default only the latest three experiences are printed — use `window.rebalanceTimeline(N)` to change that before printing.

---

## Contributing / Automation

This repository is intentionally static and to be used as Github Pages

