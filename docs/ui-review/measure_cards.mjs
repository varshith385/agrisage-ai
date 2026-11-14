import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1536, height: 864, name: '1536x864' },
];

const PAGES = [
  '/',
  '/irrigation',
  '/economics',
  '/calendar',
  '/disease',
  '/recommend',
  '/market',
  '/community',
  '/reminders',
  '/weather',
  '/farms',
];

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5190';
const API_URL = process.env.API_URL || 'http://127.0.0.1:8020';

async function getDemoAuth() {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Could not fetch demo auth:', e.message);
  }
  return null;
}

async function run() {
  console.log(`Starting card measurement at ${BASE_URL}...`);
  const demoAuth = await getDemoAuth();
  const token = demoAuth?.access_token || 'mock_jwt_token';
  const user = demoAuth?.user || { id: 2, email: 'ramesh@agrisage.demo', full_name: 'Farmer Ramesh' };
  const farmId = demoAuth?.farm?.id ? String(demoAuth.farm.id) : '2';

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const results = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    await context.addInitScript(({ token, user, farmId }) => {
      localStorage.setItem('agrisage_token', token);
      localStorage.setItem('agrisage_user', JSON.stringify(user));
      localStorage.setItem('agrisage_active_farm_id', farmId);
      localStorage.setItem('agrisage_pictorial_mode', 'words');
      localStorage.setItem('agrisage_tour_completed_v1', 'true');
    }, { token, user, farmId });

    const page = await context.newPage();

    for (const pagePath of PAGES) {
      try {
        await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'load', timeout: 12000 });
        await page.waitForTimeout(1200);

        const pageResult = await page.evaluate(() => {
          const cards = document.querySelectorAll(
            '.card, [class*="rounded-2xl"], [class*="rounded-3xl"], [class*="bg-white"]'
          );
          const flagged = [];
          let totalChecked = 0;

          cards.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            if (rect.width < 180 || rect.height < 80) return;
            if (rect.height > window.innerHeight * 1.5) return; // ignore massive outer page containers

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;
            if (style.position === 'fixed' || style.position === 'absolute') return;

            // Find valid in-flow children
            const children = Array.from(el.children).filter((c) => {
              const cs = window.getComputedStyle(c);
              return cs.display !== 'none' && cs.position !== 'absolute';
            });
            if (children.length === 0) return;

            totalChecked++;
            const paddingTop = parseFloat(style.paddingTop) || 0;
            const paddingBottom = parseFloat(style.paddingBottom) || 0;

            const childBottoms = children.map((c) => c.getBoundingClientRect().bottom);
            const childTops = children.map((c) => c.getBoundingClientRect().top);
            const contentBottom = Math.max(...childBottoms);
            const contentTop = Math.min(...childTops);
            const contentSpan = contentBottom - contentTop;

            const emptyBottomSpace = rect.bottom - paddingBottom - contentBottom;
            const emptyRatio = emptyBottomSpace / rect.height;

            if (emptyBottomSpace > 25 && emptyRatio > 0.15) {
              const heading = el.querySelector('h1, h2, h3, h4, h5, h6, [class*="font-bold"]');
              const textSnippet = (heading?.textContent || el.textContent || '').trim().slice(0, 50).replace(/\s+/g, ' ');
              flagged.push({
                index,
                tagName: el.tagName.toLowerCase(),
                className: el.className.slice(0, 80),
                textSnippet,
                height: Math.round(rect.height),
                contentSpan: Math.round(contentSpan),
                emptyBottomSpace: Math.round(emptyBottomSpace),
                emptyRatio: (emptyRatio * 100).toFixed(1) + '%',
              });
            }
          });

          return { totalChecked, flagged };
        });

        console.log(`[${vp.name}] ${pagePath}: checked ${pageResult.totalChecked} cards, flagged ${pageResult.flagged.length}`);

        if (pageResult.flagged.length > 0) {
          results.push({
            viewport: vp.name,
            path: pagePath,
            flaggedCount: pageResult.flagged.length,
            cards: pageResult.flagged,
          });
        }
      } catch (err) {
        console.error(`Error on ${vp.name} ${pagePath}:`, err.message);
      }
    }

    await context.close();
  }

  await browser.close();

  let output = `CARD EMPTY SPACE MEASUREMENT REPORT\n`;
  output += `Generated at: ${new Date().toISOString()}\n`;
  output += `Threshold: empty bottom space > 35px AND empty ratio > 20% of card height\n`;
  output += `========================================================================\n\n`;

  let totalFlagged = 0;
  for (const r of results) {
    totalFlagged += r.flaggedCount;
    output += `Page: ${r.path} | Viewport: ${r.viewport} | Flagged Cards: ${r.flaggedCount}\n`;
    output += `------------------------------------------------------------------------\n`;
    for (const c of r.cards) {
      output += `  [${c.tagName}] "${c.textSnippet}"\n`;
      output += `    Height: ${c.height}px | Content: ${c.contentSpan}px | Empty Bottom: ${c.emptyBottomSpace}px (${c.emptyRatio})\n`;
    }
    output += `\n`;
  }

  output += `Total Flagged Cards Across All Viewports: ${totalFlagged}\n`;
  console.log(output);

  const outFile = process.argv[2] || 'docs/ui-review/CARDS_MEASUREMENT.txt';
  fs.writeFileSync(outFile, output, 'utf-8');
  console.log(`Saved report to ${outFile}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
