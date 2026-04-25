// Slide validator — opens dist/<deck>.html in Chromium, walks each slide
// at the Marp 16:9 native resolution (1280x720), flags overflow and
// sibling overlap, and writes screenshots to dist/screenshots/.

import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, basename } from 'node:path';
import { mkdirSync, readdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'dist');
const shotDir = resolve(distDir, 'screenshots');
mkdirSync(shotDir, { recursive: true });

const decks = readdirSync(distDir)
  .filter((f) => f.endsWith('.html'))
  .map((f) => resolve(distDir, f));

if (decks.length === 0) {
  console.error('No decks found in dist/. Run `make html` first.');
  process.exit(2);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

let totalIssues = 0;

for (const deck of decks) {
  const name = basename(deck, '.html');
  console.log(`\n=== ${name} ===`);

  await page.goto(pathToFileURL(deck).href);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() =>
    document.fonts && document.fonts.ready ? document.fonts.ready : null,
  );

  const slideCount = await page.evaluate(
    () => document.querySelectorAll('section').length,
  );
  console.log(`  ${slideCount} slides`);

  // Hide Marp bespoke navigation overlay so screenshots stay clean.
  await page.addStyleTag({
    content:
      '.bespoke-marp-osc,.bespoke-progress-parent{display:none!important}',
  });

  for (let i = 1; i <= slideCount; i++) {
    await page.goto(`${pathToFileURL(deck).href}#${i}`);
    await page.waitForTimeout(250);
    await page.addStyleTag({
      content:
        '.bespoke-marp-osc,.bespoke-progress-parent{display:none!important}',
    });
    await page.mouse.move(0, 0);

    const findings = await page.evaluate((idx) => {
      const TOL = 2; // 2 px tolerance for sub-pixel rounding
      const sections = document.querySelectorAll('section');
      const section = sections[idx - 1];
      if (!section) return [{ kind: 'missing-section' }];
      const sRect = section.getBoundingClientRect();

      const out = [];
      const elements = Array.from(section.querySelectorAll('*'));

      // Overflow check
      for (const el of elements) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Skip pure containers without their own text/background
        const tag = el.tagName.toLowerCase();
        if (r.right - sRect.right > TOL) {
          out.push({
            kind: 'overflow-right',
            tag,
            text: (el.textContent || '').trim().slice(0, 50),
            by: Math.round(r.right - sRect.right),
          });
        }
        if (r.bottom - sRect.bottom > TOL) {
          out.push({
            kind: 'overflow-bottom',
            tag,
            text: (el.textContent || '').trim().slice(0, 50),
            by: Math.round(r.bottom - sRect.bottom),
          });
        }
      }

      // Sibling overlap check on direct children of <section>
      const children = Array.from(section.children).filter((c) => {
        const cs = getComputedStyle(c);
        if (cs.display === 'none' || cs.visibility === 'hidden') return false;
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      for (let a = 0; a < children.length; a++) {
        for (let b = a + 1; b < children.length; b++) {
          const ra = children[a].getBoundingClientRect();
          const rb = children[b].getBoundingClientRect();
          const overlapX = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const overlapY = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          if (overlapX > TOL && overlapY > TOL) {
            out.push({
              kind: 'sibling-overlap',
              a: children[a].tagName.toLowerCase(),
              b: children[b].tagName.toLowerCase(),
              area: Math.round(overlapX * overlapY),
            });
          }
        }
      }

      return out;
    }, i);

    const slideShot = resolve(
      shotDir,
      `${name}-slide-${String(i).padStart(2, '0')}.png`,
    );
    await page.screenshot({ path: slideShot, fullPage: false });

    if (findings.length === 0) {
      console.log(`  [${i}] OK  → ${basename(slideShot)}`);
    } else {
      totalIssues += findings.length;
      console.log(`  [${i}] ${findings.length} issue(s) → ${basename(slideShot)}`);
      for (const f of findings) {
        const detail = Object.entries(f)
          .filter(([k]) => k !== 'kind')
          .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
          .join(' ');
        console.log(`        - ${f.kind}  ${detail}`);
      }
    }
  }
}

await browser.close();

if (totalIssues > 0) {
  console.error(`\n✗ ${totalIssues} issue(s) found. See screenshots in ${shotDir}`);
  process.exit(1);
}
console.log(`\n✓ All slides clean. Screenshots in ${shotDir}`);
