import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

// Run against a production build: pnpm build, then
// pnpm preview --host 127.0.0.1 --port 4323.
// The blocked-storage test must not include Astro's development toolbar.
const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4323';
const output = process.env.QA_OUTPUT || '/tmp/instrument-qa';
const consentKey = 'vrajmpatel-analytics-consent';
const report = { layouts: [], checks: [], errors: [] };
await mkdir(`${output}/privacy`, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const check = (name, passed, details = {}) => {
  report.checks.push({ name, passed, ...details });
  if (!passed) console.log(`FAIL ${name} ${JSON.stringify(details)}`);
};
const visit = async (page, route) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' }); }
    catch (error) { if (attempt === 4) throw error; await page.waitForTimeout(1000); }
  }
};
try {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'reduce' });
    await context.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, theme);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(`${page.url()}: ${error.message}`));
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1100 });
      await visit(page, '/privacy');
      await page.evaluate(() => document.fonts.ready);
      const metrics = await page.evaluate(() => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const parse = color => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
        const luminance = rgb => rgb.slice(0, 3).map(value => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; }).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
        const contrast = selector => {
          const element = document.querySelector(selector);
          const color = getComputedStyle(element).color;
          let ancestor = element, background = 'rgb(255,255,255)';
          while (ancestor) {
            const candidate = getComputedStyle(ancestor).backgroundColor;
            if (parse(candidate)[3] > 240) { background = candidate; break; }
            ancestor = ancestor.parentElement;
          }
          const a = luminance(parse(color)), b = luminance(parse(background));
          return { selector, ratio: Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100, color, background };
        };
        return {
          width: innerWidth, documentWidth: document.documentElement.scrollWidth,
          contrast: ['.privacy-header > p:last-child', '.privacy-settings h2', '.privacy-settings-intro', '.privacy-current dt', '.privacy-current dd', '.privacy-option strong', '.privacy-option-description', '[data-consent-save]'].map(contrast),
        };
      });
      report.layouts.push({ page: 'privacy', width, theme, ...metrics });
      check(`Privacy ${width}px ${theme}: no horizontal overflow`, metrics.documentWidth <= width + 1);
      check(`Privacy ${width}px ${theme}: text contrast`, metrics.contrast.every(item => item.ratio >= 4.5), { contrast: metrics.contrast });
      await page.screenshot({ path: `${output}/privacy/privacy-${width}-${theme}.png`, fullPage: true, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
      await page.screenshot({ path: `${output}/privacy/privacy-${width}-${theme}-viewport.png`, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
      if (width === 1440 && theme === 'dark') await page.screenshot({ path: `${output}/privacy-refined-dark.png`, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
      if ([320, 390, 1440].includes(width)) {
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        const footer = await page.locator('.site-footer').evaluate(element => {
          const links = [...element.querySelectorAll('.footer-navigation a')].map(link => ({ text: link.textContent.trim(), x: link.getBoundingClientRect().x, y: link.getBoundingClientRect().y, width: link.getBoundingClientRect().width, height: link.getBoundingClientRect().height }));
          const copyright = element.querySelector('.footer-copyright').getBoundingClientRect();
          return { links, copyright: { y: copyright.y, height: copyright.height }, width: element.getBoundingClientRect().width, documentWidth: document.documentElement.scrollWidth };
        });
        report.layouts.push({ page: 'footer', width, theme, ...footer });
        check(`Footer ${width}px ${theme}: four aligned 44px links`, footer.links.length === 4 && footer.links.every(link => link.height >= 44) && (width >= 1024 ? new Set(footer.links.map(link => Math.round(link.y))).size === 1 : new Set(footer.links.map(link => Math.round(link.y))).size === 2));
        check(`Footer ${width}px ${theme}: no horizontal overflow`, footer.documentWidth <= width + 1);
        if (width >= 1024) check(`Footer ${width}px ${theme}: copyright baseline aligns with navigation`, Math.abs(footer.copyright.y + footer.copyright.height / 2 - footer.links[0].y - footer.links[0].height / 2) <= 1);
        await page.locator('.site-footer').screenshot({ path: `${output}/privacy/footer-${width}-${theme}.png`, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
        if (width === 1440 && theme === 'dark') await page.locator('.site-footer').screenshot({ path: `${output}/footer-aligned-dark.png`, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
      }
      console.log(`Verified privacy/footer ${width}px ${theme}`);
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  await visit(page, '/privacy');
  await page.evaluate(() => { localStorage.setItem('theme', 'dark'); window.__qaConsentEvents = []; window.addEventListener('vraj:consent-change', event => window.__qaConsentEvents.push(event.detail)); });
  const state = () => page.evaluate(key => ({ stored: JSON.parse(localStorage.getItem(key)), analytics: document.querySelector('[data-consent-analytics]').checked, replay: document.querySelector('[data-consent-replay]').checked, analyticsStatus: document.querySelector('[data-consent-status-analytics]').textContent, replayStatus: document.querySelector('[data-consent-status-replay]').textContent, theme: localStorage.getItem('theme') }), consentKey);
  await page.locator('[data-consent-analytics]').uncheck();
  await page.locator('[data-consent-save]').click();
  let value = await state();
  check('Analytics can be off while replay stays on', value.stored.analytics === false && value.stored.replay === true && value.analyticsStatus === 'Off' && value.replayStatus === 'On', value);
  check('Saving consent leaves theme preference unchanged', value.theme === 'dark');
  check('Save confirmation is announced', await page.locator('[data-consent-saved]').isVisible());
  await page.reload({ waitUntil: 'networkidle' });
  value = await state();
  check('Independent consent values persist across reload', !value.analytics && value.replay && value.analyticsStatus === 'Off' && value.replayStatus === 'On', value);
  await page.locator('[data-consent-analytics]').check();
  await page.locator('[data-consent-replay]').uncheck();
  await page.locator('[data-consent-save]').click();
  value = await state();
  check('Replay can be off while analytics stays on', value.stored.analytics && !value.stored.replay && value.analyticsStatus === 'On' && value.replayStatus === 'Off', value);
  await page.locator('[data-consent-analytics]').uncheck();
  await page.locator('[data-consent-save]').click();
  value = await state();
  check('Both options can be switched off', !value.stored.analytics && !value.stored.replay, value);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.__qaRestoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) { if (name === key) throw new DOMException('Storage is full', 'QuotaExceededError'); return original.call(this, name, value); };
  }, consentKey);
  await page.locator('[data-consent-analytics]').check();
  await page.locator('[data-consent-replay]').check();
  await page.locator('[data-consent-save]').click();
  value = await state();
  check('Storage write failure displays a recoverable error', await page.locator('[data-consent-error]').isVisible());
  check('Storage failure retains saved status and never announces success', value.analyticsStatus === 'Off' && value.replayStatus === 'Off' && !value.stored.analytics && !value.stored.replay && !(await page.locator('[data-consent-saved]').isVisible()), value);
  await page.screenshot({ path: `${output}/privacy/privacy-storage-error-dark.png`, animations: 'disabled', style: 'astro-dev-toolbar { visibility:hidden!important }' });
  await page.evaluate(() => window.__qaRestoreStorage());
  await page.locator('[data-consent-save]').click();
  check('Save succeeds after storage becomes available', await page.locator('[data-consent-saved]').isVisible() && !(await page.locator('[data-consent-error]').isVisible()));
  await context.close();

  const blocked = await browser.newContext({ viewport: { width: 320, height: 1000 }, colorScheme: 'dark', reducedMotion: 'reduce' });
  await blocked.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage is blocked', 'SecurityError'); } }); });
  const blockedPage = await blocked.newPage();
  blockedPage.on('pageerror', error => report.errors.push(error.stack || error.message));
  await visit(blockedPage, '/privacy');
  check('Blocked storage still renders usable default controls', await blockedPage.locator('[data-consent-analytics]').isChecked() && await blockedPage.locator('[data-consent-replay]').isChecked() && await blockedPage.locator('[data-consent-save]').isEnabled());
  await blockedPage.locator('[data-consent-analytics]').uncheck();
  await blockedPage.locator('[data-consent-save]').click();
  check('Blocked storage shows error without changing saved badge', await blockedPage.locator('[data-consent-error]').isVisible() && await blockedPage.locator('[data-consent-status-analytics]').textContent() === 'On');
  await blocked.close();
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
} finally {
  await browser.close();
  report.summary = { layouts: report.layouts.length, checks: report.checks.length, failed: report.checks.filter(check => !check.passed), errors: report.errors };
  await writeFile(`${output}/privacy/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.failed.length || report.errors.length) process.exitCode = 1;
}
