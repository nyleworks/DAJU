# DAJU Matcha

Website for DAJU, a pop-up matcha bar in Kota Kinabalu, Sabah. It is a single static page: open `index.html`, or host the folder on any static host (GitHub Pages, Netlify, Vercel).

## Editing

- `src/app.js` is the app (React 18 with htm, no build step needed in the browser).
- `src/page.css` holds the page styles.
- `design-system/` is the DAJU design system (tokens and components).

After editing, rebuild `index.html`:

```
python3 build.py
```

## Link previews

`og-image.png` is the image shown when the link is shared (WhatsApp, Facebook, Threads, X). Once the site has its own domain, change the `og:image` and `twitter:image` tags in `build.py` to the full address, for example `https://your-domain/og-image.png`, then rebuild.

## Still placeholders

Prices (except Matcha of the Week, RM8.99), social handles and the WhatsApp number.
