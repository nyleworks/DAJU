"""Build index.html (and app.min.js) from src/, design-system/, fonts/ and vendor/.

    python3 build.py            # rebuild, reuse the saved first-screen snapshot (src/shell-*.html)
    python3 build.py --shell    # also re-take the snapshot (needs Node + Playwright, see tools/prerender.js)

Speed notes (mobile Lighthouse):
- Fonts are self-hosted (fonts/, src/fonts.css), so there is no render-blocking Google Fonts request.
- React, ReactDOM and htm are served from this site (vendor/) in one deferred, minified file.
- The first screen (nav + hero) is pre-rendered into the HTML so it paints before the JavaScript runs.
- CSS and JS are minified with esbuild when it is installed (`npm i -g esbuild`); otherwise they are left as is.
"""
import hashlib, os, re, shutil, subprocess, sys

# Where the site lives. Used for link previews (og:image / og:url need full addresses). Change it if DAJU gets its own domain.
SITE_URL = 'https://nyleworks.github.io/DAJU/'

DS = 'design-system'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
if args:
    DS = args[0]


def read(p):
    with open(p, encoding='utf-8') as f:
        return f.read()


def write(p, text):
    with open(p, 'w', encoding='utf-8') as f:
        f.write(text)


def esbuild(src, loader):
    exe = shutil.which('esbuild')
    if not exe:
        return src
    r = subprocess.run([exe, '--minify', '--loader=' + loader, '--log-level=error'] + (['--target=es2017'] if loader == 'js' else []),
                       input=src.encode('utf-8'), capture_output=True)
    if r.returncode != 0:
        # a syntax error must stop the build, not ship unminified (or broken) code
        sys.stderr.write(r.stderr.decode('utf-8', 'replace'))
        sys.exit('esbuild failed on the ' + loader + ' bundle; nothing was written.')
    return r.stdout.decode('utf-8')


# Image cache-busting: every image the page uses gets ?v=<content hash>, so a new photo shows up straight away
IMG_RE = re.compile(r'(?<![\w./-])([\w-]+\.(?:jpg|jpeg|png|webp|svg))(?![\w?])')
def file_hash(name):
    with open(name, 'rb') as f:
        return hashlib.sha1(f.read()).hexdigest()[:8]
def bust(text):
    return IMG_RE.sub(lambda m: m.group(1) + '?v=' + file_hash(m.group(1)) if os.path.isfile(m.group(1)) else m.group(0), text)


# ---------- CSS (inlined, minified) ----------
tokens = read(DS + '/tokens.css')
bcss = re.sub(r'^@import url\([^)]*\);\s*', '', read(DS + '/components/bundle.css'), flags=re.MULTILINE)
css = esbuild('\n'.join([read('src/fonts.css'), tokens, bcss, read('src/page.css')]), 'css')

# ---------- JS (one deferred, minified, same-origin file) ----------
js = '\n;'.join([
    read('vendor/react.production.min.js'),
    read('vendor/react-dom.production.min.js'),
    read('vendor/htm.umd.js'),
    esbuild(read(DS + '/components/bundle.js'), 'js'),
    esbuild(bust(read('src/app.js')), 'js'),
])
write('app.min.js', js)
ver = hashlib.sha1(js.encode('utf-8')).hexdigest()[:10]

# ---------- First-screen snapshot ----------
def shell(name):
    p = 'src/shell-' + name + '.html'
    return bust(re.sub(r'\?v=[0-9a-f]{8}', '', read(p))).strip() if os.path.exists(p) else ''


def make_boot():
    narrow, wide = shell('narrow'), shell('wide')
    if not (narrow and wide):
        return ''
    # Pick the phone or desktop snapshot before first paint; React replaces it once app.min.js runs.
    return ('<template id="shell-n">' + narrow + '</template><template id="shell-w">' + wide + '</template>\n'
            '<script>(function(){var m=window.matchMedia&&matchMedia("(max-width: 720px)").matches,'
            't=document.getElementById(m?"shell-n":"shell-w"),r=document.getElementById("root");'
            'if(t&&r){r.appendChild(t.content.cloneNode(true));document.documentElement.classList.add("has-shell");}})();</script>')


NOSCRIPT = ('<noscript><div class="noscript-card"><p style="font-size:28px;font-weight:700;margin:0 0 8px">DA | JU</p>'
            '<p>This page needs JavaScript to build your cup.</p>'
            '<p>You can still order: message us on WhatsApp with your drinks, your name and pickup or delivery.</p>'
            '<p><a href="https://wa.me/60185768476">Order on WhatsApp (+60 18-576 8476)</a></p></div></noscript>')

def page(boot):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>DAJU Matcha</title>
<meta name="description" content="DAJU Matcha, a pop-up matcha bar in Kota Kinabalu. Build your cup and order on WhatsApp.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="DAJU">
<meta property="og:title" content="DAJU Matcha">
<meta property="og:description" content="Pop-up matcha bar in Kota Kinabalu. Build your cup and order on WhatsApp.">
<meta property="og:url" content="{SITE_URL}">
<meta property="og:image" content="{SITE_URL}og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="DAJU logo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{SITE_URL}og-image.png">
<link rel="canonical" href="{SITE_URL}">
<meta name="theme-color" content="#eef4ea">
<link rel="icon" type="image/svg+xml" href="{bust('favicon.svg')}">
<link rel="apple-touch-icon" href="{bust('apple-touch-icon.png')}">
<link rel="preload" as="image" type="image/webp" fetchpriority="high" imagesrcset="{bust('blue-sea-salt-cutout-300.webp')} 300w, {bust('blue-sea-salt-cutout.webp')} 433w" imagesizes="(min-width: 721px) 300px, (min-width: 391px) 250px, 64vw">
<link rel="preload" href="fonts/sacramento.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/shrikhand.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<script src="app.min.js?v={ver}" defer></script>
<style>{css}</style>
</head>
<body>
<div id="root"></div>
{NOSCRIPT}
{boot}
</body>
</html>
'''

if '--shell' in sys.argv:
    write('index.html', page(''))  # snapshot is taken from a page without the old one
    subprocess.run(['node', 'tools/prerender.js'], check=True)
out = page(make_boot())
write('index.html', out)
print('index.html', len(out), 'bytes; app.min.js', len(js), 'bytes')
