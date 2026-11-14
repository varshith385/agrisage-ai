import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('../../frontend/node_modules/playwright');
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('docs/ui-review/screens/phase7');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { width: 1366, height: 768, name: '1366x768' },
  { width: 1536, height: 864, name: '1536x864' },
  { width: 390, height: 844, name: '390x844', isMobile: true },
];

const CONFIGS = [
  { theme: 'light', lang: 'en', mode: 'pictures', name: 'light-en-pictorial' },
  { theme: 'light', lang: 'en', mode: 'words', name: 'light-en-words' },
  { theme: 'dark', lang: 'en', mode: 'words', name: 'dark-en-words' },
  { theme: 'dark', lang: 'te', mode: 'pictorial', name: 'dark-te-pictorial' },
  { theme: 'light', lang: 'te', mode: 'words', name: 'light-te-words' },
];

const PAGES = [
  { path: '/', slug: 'dashboard' },
  { path: '/irrigation', slug: 'irrigation' },
  { path: '/disease', slug: 'disease' },
  { path: '/calendar', slug: 'calendar' },
  { path: '/economics', slug: 'economics' },
  { path: '/recommend', slug: 'recommend' },
  { path: '/market', slug: 'market' },
  { path: '/community', slug: 'community' },
  { path: '/reminders', slug: 'reminders' },
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
  console.log(`Starting Phase 7 Viewport Screenshots Audit against ${BASE_URL}...`);
  const demoAuth = await getDemoAuth();
  const token = demoAuth?.access_token || 'mock_jwt_token';
  const user = demoAuth?.user || { id: 2, email: 'ramesh@agrisage.demo', full_name: 'Farmer Ramesh' };
  const farmId = demoAuth?.farm?.id ? String(demoAuth.farm.id) : '2';

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const auditReport = [];

  for (const vp of VIEWPORTS) {
    for (const cfg of CONFIGS) {
      // Mobile only needs key configs to avoid combinatorial explosion
      if (vp.isMobile && (cfg.name === 'dark-en-words' || cfg.name === 'light-te-words')) {
        continue;
      }

      console.log(`\n=== Auditing Viewport: ${vp.name} | Config: ${cfg.name} ===`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: !!vp.isMobile,
        hasTouch: !!vp.isMobile,
      });

      await context.addInitScript(({ token, user, farmId, cfg }) => {
        localStorage.setItem('agrisage_token', token);
        localStorage.setItem('agrisage_user', JSON.stringify(user));
        localStorage.setItem('agrisage_active_farm_id', farmId);
        localStorage.setItem('agrisage_theme', cfg.theme);
        localStorage.setItem('agrisage_lang', cfg.lang);
        localStorage.setItem('agrisage_pictorial_mode', cfg.mode);
        localStorage.setItem('agrisage_tour_completed_v1', 'true');
        localStorage.setItem('agrisage_visual_choice_v1', 'true');
      }, { token, user, farmId, cfg });

      const page = await context.newPage();

      for (const p of PAGES) {
        const fileBase = `${p.slug}_${vp.name}_${cfg.name}`;
        const filePath = path.join(OUT_DIR, `${fileBase}.png`);

        try {
          await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'load', timeout: 15000 });
          await page.waitForTimeout(1000);

          // Force root theme class matching config
          await page.evaluate((theme) => {
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }, cfg.theme);

          // Capture viewport screenshot
          await page.screenshot({ path: filePath, fullPage: false });

          // Layout diagnostic metrics
          const diagnostics = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasHOverflow = docWidth > winWidth + 2; // allowance for subpixel

            // Check for buttons with negative or truncated widths
            const buttons = Array.from(document.querySelectorAll('button:not([aria-hidden="true"])'));
            const misalignedButtons = buttons.filter(b => {
              const r = b.getBoundingClientRect();
              return r.width < 16 && r.height < 16 && r.offsetWidth > 0;
            }).length;

            return {
              hasHOverflow,
              docWidth,
              winWidth,
              misalignedButtons,
            };
          });

          console.log(`  ✓ ${fileBase} [H-Overflow: ${diagnostics.hasHOverflow ? 'YES (BUG)' : 'None'}, Win: ${diagnostics.winWidth}px]`);

          auditReport.push({
            page: p.slug,
            viewport: vp.name,
            config: cfg.name,
            file: `${fileBase}.png`,
            ...diagnostics,
          });

        } catch (err) {
          console.error(`  ✗ Error on ${fileBase}: ${err.message}`);
          auditReport.push({
            page: p.slug,
            viewport: vp.name,
            config: cfg.name,
            error: err.message,
          });
        }
      }

      await context.close();
    }
  }

  await browser.close();

  fs.writeFileSync(
    path.join(OUT_DIR, 'audit_summary.json'),
    JSON.stringify(auditReport, null, 2),
    'utf-8'
  );

  console.log(`\nAudit complete. Captured ${auditReport.filter(r => !r.error).length} screenshots in ${OUT_DIR}`);
}

run().catch(err => {
  console.error('Fatal error during audit:', err);
  process.exit(1);
});
