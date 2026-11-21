# DAJU Matcha

Website for DAJU, a pop-up matcha bar in Kota Kinabalu, Sabah. It is a single static page: open `index.html`, or host the folder on any static host (GitHub Pages, Netlify, Vercel).

## Editing

- `src/app.js` is the app (React 18 with htm, no build step needed in the browser).
- `src/page.css` holds the page styles.
- `design-system/` is the DAJU design system (tokens and components).

After editing, rebuild `index.html` and `app.min.js`:

```
python3 build.py           # normal rebuild
python3 build.py --shell   # also re-take the first-screen snapshot (do this after changing the hero or top bar)
```

For speed, the page loads fonts from `fonts/`, React from `vendor/` (bundled into one deferred `app.min.js`), and paints a snapshot of the top bar and hero (`src/shell-*.html`) before the JavaScript runs. `--shell` needs Node and Playwright; minifying needs `esbuild` (`npm i -g esbuild`), and the build still works without it, just unminified.

## Link previews

`og-image.png` is the image shown when the link is shared (WhatsApp, Facebook, Threads, X). Link previews need full addresses, so `build.py` has `SITE_URL` (now `https://nyleworks.github.io/DAJU/`). If the site moves to its own domain, change `SITE_URL` and rebuild.

Images get `?v=<hash>` added at build time, so a replaced photo shows up straight away instead of a cached old one.

## Still placeholders

- Prices (except Matcha of the Week, RM8.99): `price: null` in `MENU`, `src/app.js`.
- Instagram and TikTok: fill in `SOCIAL` at the top of `src/app.js` (until then the footer shows plain text, not a link).
