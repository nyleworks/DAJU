// Takes a snapshot of the first screen (nav, hero, bottom tab bar) at phone and desktop width and saves it
// to src/shell-narrow.html and src/shell-wide.html. build.py puts it into index.html so the hero paints
// before the JavaScript has loaded. Run through `python3 build.py --shell` after changing the hero or nav.
// Needs Node and Playwright (npm i -D playwright && npx playwright install chromium).
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const url = 'file://' + path.join(root, 'index.html');

(async () => {
  const browser = await chromium.launch();
  for (const [name, width] of [['narrow', 390], ['wide', 1280]]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('#drop');
    const html = await page.evaluate(() => {
      const top = document.getElementById('root').firstElementChild.cloneNode(true);
      const main = top.querySelector('main');
      if (main) Array.from(main.children).forEach((s) => { if (s.id !== 'drop') s.remove(); });
      top.querySelectorAll('footer, .toast, .dj-drawer, .dj-drawer-scrim').forEach((n) => n.remove());
      return top.outerHTML;
    });
    fs.writeFileSync(path.join(root, 'src', 'shell-' + name + '.html'), html + '\n');
    console.log('src/shell-' + name + '.html', html.length, 'bytes');
    await page.close();
  }
  await browser.close();
})();
