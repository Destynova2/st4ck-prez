// One-shot link/image health check on dist/*.html.
// Tracks failed network requests, non-2xx responses, and <img> elements
// that ended up with naturalWidth === 0 (broken). Text output only.

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { readdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');
const decks = readdirSync(distDir)
  .filter((f) => f.endsWith('.html'))
  .map((f) => resolve(distDir, f));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

let total = 0;
for (const deck of decks) {
  const name = basename(deck, '.html');
  console.log(`\n=== ${name} ===`);

  const failed = [];
  const bad = [];
  page.on('requestfailed', (req) =>
    failed.push({ url: req.url(), reason: req.failure()?.errorText }),
  );
  page.on('response', (res) => {
    if (res.status() >= 400) bad.push({ url: res.url(), status: res.status() });
  });

  await page.goto(pathToFileURL(deck).href, { waitUntil: 'networkidle' });

  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.naturalWidth === 0)
      .map((img) => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        cls: img.getAttribute('class') || '',
      })),
  );

  if (failed.length === 0 && bad.length === 0 && broken.length === 0) {
    console.log('  ✓ all images & requests healthy');
    continue;
  }

  if (broken.length) {
    console.log(`  ✗ ${broken.length} broken <img> (naturalWidth=0):`);
    for (const b of broken) console.log(`      - src=${b.src} alt="${b.alt}"`);
  }
  if (failed.length) {
    console.log(`  ✗ ${failed.length} failed request(s):`);
    for (const f of failed) console.log(`      - ${f.reason}  ${f.url}`);
  }
  if (bad.length) {
    console.log(`  ✗ ${bad.length} non-2xx response(s):`);
    for (const r of bad) console.log(`      - [${r.status}] ${r.url}`);
  }
  total += broken.length + failed.length + bad.length;
}

await browser.close();
process.exit(total === 0 ? 0 : 1);
