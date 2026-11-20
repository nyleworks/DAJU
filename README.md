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

`og-image.png` is the image shown when the link is shared (WhatsApp, Facebook, Threads, X). Once the site has its own domain, change the `og:image` and `twitter:image` tags in `build.py` to the full address, for example `https://your-domain/og-image.png`, then rebuild.

## Still placeholders

Prices (except Matcha of the Week, RM8.99), social handles and the WhatsApp number.
