import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

// Run against a local dev/preview server with installed Chrome.
// SITE_URL and QA_OUTPUT set the target/output; QA_MATRIX=0 runs interactions only.
// QA_WIDTHS and QA_ROUTES accept comma-separated values for focused layout rechecks.
const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4321';
const output = process.env.QA_OUTPUT || '/tmp/instrument-qa';
const widths = process.env.QA_WIDTHS ? process.env.QA_WIDTHS.split(',').map(Number).filter(width => Number.isFinite(width) && width > 0) : [1440, 1024, 768, 390, 320];
const routes = [
  ['home', '/'], ['work', '/projects'],
  ['case', '/projects/operational-ticket-intelligence'],
  ['experience', '/experience'], ['about', '/about'],
  ['404', '/404'], ['brief', '/brief'],
].filter(([name]) => !process.env.QA_ROUTES || process.env.QA_ROUTES.split(',').includes(name));
const report = { baseURL, captures: [], checks: [], errors: [], consoleErrors: [] };
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const visit = async (page, route) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await page.goto(`${baseURL}${route}`, { waitUntil: 'networkidle' }); }
    catch (error) { if (attempt === 4) throw error; await page.waitForTimeout(2000); }
  }
};
const check = (name, passed, details = {}) => {
  report.checks.push({ name, passed, ...details });
  if (!passed) console.log(`FAIL ${name} ${JSON.stringify(details)}`);
};

try {
  for (const theme of process.env.QA_MATRIX === '0' ? [] : ['light', 'dark']) {
    const context = await browser.newContext({ colorScheme: theme, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
    await context.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, theme);
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(`${page.url()}: ${error.stack || error.message}`));
    page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    for (const width of widths) {
      await page.setViewportSize({ width, height: 1000 });
      for (const [name, route] of routes) {
        const videos = [];
        const onRequest = request => { if (/\.(webm|mp4)(?:\?|$)/.test(request.url())) videos.push(request.url()); };
        page.on('request', onRequest);
        await visit(page, route);
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(450);
        const initialVideos = [...videos];
        // Load offscreen image assets for a complete full-page screenshot.
        await page.evaluate(async () => {
          await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch {} }));
        });
        const layout = await page.evaluate(() => ({
          width: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          h1Count: document.querySelectorAll('h1').length,
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
          brokenImages: [...document.images].filter(image => Boolean(image.currentSrc) && image.complete && !image.naturalWidth).map(image => image.currentSrc),
          overflow: [...document.querySelectorAll('body *')].filter(element => {
            const rect = element.getBoundingClientRect();
            return getComputedStyle(element).position !== 'fixed' && rect.width > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
          }).slice(0, 15).map(element => ({ tag: element.tagName, class: String(element.className).slice(0, 130), x: Math.round(element.getBoundingClientRect().x), right: Math.round(element.getBoundingClientRect().right) })),
          filmCount: document.querySelectorAll('[data-film]').length,
        }));
        const filename = `${name}-${width}-${theme}.png`;
        await page.screenshot({ path: `${output}/${filename}`, fullPage: true, animations: 'disabled', style: 'astro-dev-toolbar { visibility: hidden !important; }' });
        await page.screenshot({ path: `${output}/${filename.replace('.png', '-viewport.png')}`, animations: 'disabled', style: 'astro-dev-toolbar { visibility: hidden !important; }' });
        page.off('request', onRequest);
        const capture = { name, route, width, theme, filename, ...layout, initialVideoRequests: initialVideos };
        report.captures.push(capture);
        if (layout.documentWidth > width + 1 || layout.h1Count !== 1 || layout.brokenImages.length || initialVideos.length) console.log(`DEFECT ${JSON.stringify(capture)}`);
      }
      console.log(`Captured ${theme} ${width}px`);
      await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: 'light' });
  await context.addInitScript(() => window.addEventListener('pagereveal', event => { try { sessionStorage.setItem('qa-view-transition', String(Boolean(event.viewTransition))); } catch {} }));
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${page.url()}: ${error.stack || error.message}`));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.keyboard.press('?');
  check('Question mark opens shortcut dialog', await page.locator('[data-shortcuts-dialog]').evaluate(el => el.open));
  await page.locator('[data-shortcuts-enabled]').uncheck();
  await page.keyboard.press('Escape');
  await page.keyboard.press('1');
  check('Disabling shortcuts prevents single-key navigation', new URL(page.url()).pathname === '/');
  await page.locator('[data-shortcuts-open]').click();
  check('Visible shortcuts button works when shortcuts disabled', await page.locator('[data-shortcuts-dialog]').evaluate(el => el.open));
  await page.locator('[data-shortcuts-enabled]').check();
  await page.keyboard.press('Escape');
  await page.keyboard.press('t');
  check('Theme shortcut switches theme', await page.locator('html').evaluate(el => el.classList.contains('dark')));
  await page.reload({ waitUntil: 'networkidle' });
  check('Theme persists after reload', await page.locator('html').evaluate(el => el.classList.contains('dark')));
  await page.keyboard.press('1');
  await page.waitForURL('**/projects');
  await page.waitForTimeout(300);
  check('Numbered work shortcut navigates', new URL(page.url()).pathname === '/projects');
  await page.keyboard.press('g'); await page.keyboard.press('h');
  await page.waitForURL(`${baseURL}/`);
  await page.waitForTimeout(300);
  check('Home chord navigates', new URL(page.url()).pathname === '/');
  await page.locator('[data-ph-placement="project_list_action"]').first().click();
  await page.waitForURL('**/projects/operational-ticket-intelligence');
  await page.waitForTimeout(300);
  check('Card navigation starts native cross-document transition', await page.evaluate(() => sessionStorage.getItem('qa-view-transition') === 'true'));
  await visit(page, '/');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-mobile-menu] summary').click();
  check('Mobile menu opens', await page.locator('[data-mobile-menu]').evaluate(el => el.open));
  await page.keyboard.press('Escape');
  check('Escape closes mobile menu and restores summary focus', await page.locator('[data-mobile-menu]').evaluate(el => !el.open && el.querySelector('summary') === document.activeElement));
  await page.locator('[data-mobile-menu] summary').click();
  await page.mouse.click(4, 500);
  check('Clicking outside dismisses mobile menu', await page.locator('[data-mobile-menu]').evaluate(el => !el.open));
  await page.locator('[data-mobile-menu] summary').click();
  await page.locator('[data-mobile-menu] a[href="/experience"]').click();
  await page.waitForURL('**/experience');
  await page.waitForTimeout(300);
  check('Mobile menu link navigates and menu stays closed', await page.locator('[data-mobile-menu]').evaluate(el => !el.open));

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseURL}/projects/operational-ticket-intelligence`, { waitUntil: 'networkidle' });
  await page.locator('[data-step="1"]').click();
  check('Example step selector reveals selected panel', await page.locator('[data-panel="1"]').isVisible());
  await page.locator('[data-next]').click();
  check('Example next button advances panel', await page.locator('[data-panel="2"]').isVisible());
  const actionPanel = page.locator('[data-panel]').filter({ has: page.locator('[data-demo-action]') }).first();
  const panelIndex = await actionPanel.getAttribute('data-panel');
  await page.locator(`[data-step="${panelIndex}"]`).click();
  await actionPanel.locator('[data-demo-action]').click();
  check('Example action displays result and prevents duplicate activation', await actionPanel.locator('[data-action-result]').isVisible() && await actionPanel.locator('[data-demo-action]').isDisabled());
  await page.locator('[data-reset]').click();
  check('Example reset restores first panel and original fields', await page.locator('[data-panel="0"]').isVisible() && await page.locator('[data-field]').evaluateAll(fields => fields.every(field => field.textContent === field.dataset.originalValue)));
  await page.locator('[data-case-navigation] a').first().click();
  await page.waitForTimeout(450);
  await page.keyboard.press('j');
  await page.waitForTimeout(450);
  check('Case next-section shortcut changes hash', new URL(page.url()).hash === await page.locator('[data-case-navigation] a').nth(1).getAttribute('href'), { hash: new URL(page.url()).hash });
  await page.keyboard.press('k');
  await page.waitForTimeout(450);
  check('Case previous-section shortcut changes hash', new URL(page.url()).hash === await page.locator('[data-case-navigation] a').first().getAttribute('href'), { hash: new URL(page.url()).hash });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  const reducedRequests = [];
  page.on('request', request => { if (/\.(webm|mp4)(?:\?|$)/.test(request.url())) reducedRequests.push(request.url()); });
  await page.locator('[data-film]').first().hover();
  await page.waitForTimeout(500);
  const reduced = await page.evaluate(() => ({
    films: [...document.querySelectorAll('video')].map(video => ({ paused: video.paused, sources: [...video.querySelectorAll('source')].map(source => source.getAttribute('src')) })),
    activeAnimations: document.getAnimations().filter(animation => animation.playState === 'running').map(animation => ({ duration: animation.effect?.getTiming().duration, target: animation.effect?.target?.className })),
  }));
  check('Reduced motion preserves static films on hover', reducedRequests.length === 0 && reduced.films.every(film => film.paused && film.sources.every(src => !src)), reduced);
  check('Reduced motion has no sustained running animations', reduced.activeAnimations.every(animation => typeof animation.duration === 'number' && animation.duration <= 1), reduced);
  await page.screenshot({ path: `${output}/home-reduced-motion.png`, fullPage: true, animations: 'disabled', style: 'astro-dev-toolbar { visibility: hidden !important; }' });
  await page.locator('[data-film-toggle]').first().click();
  await page.waitForFunction(() => { const video = document.querySelector('video'); return video && !video.paused && video.readyState >= 2; }, undefined, { timeout: 15000 });
  check('Reduced-motion visitor can explicitly play a project film', await page.locator('video').first().evaluate(video => !video.paused));
  await page.locator('[data-film-toggle]').first().click();
  check('Film pause button stops playback', await page.locator('video').first().evaluate(video => video.paused));
  await page.goto(`${baseURL}/brief`, { waitUntil: 'networkidle' });
  await page.emulateMedia({ media: 'print' });
  check('Brief print hides navigation and footer', !(await page.locator('.site-header').isVisible()) && !(await page.locator('.site-footer').isVisible()));
  await page.pdf({ path: `${output}/brief-print.pdf`, format: 'Letter', printBackground: true });
  await context.close();
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
} finally {
  await browser.close();
  report.summary = {
    captures: report.captures.length,
    overflow: report.captures.filter(capture => capture.documentWidth > capture.width + 1).map(capture => `${capture.name}-${capture.width}-${capture.theme}`),
    brokenImageCaptures: report.captures.filter(capture => capture.brokenImages.length).length,
    invalidHeadingCaptures: report.captures.filter(capture => capture.h1Count !== 1).length,
    initialVideoRequestCount: report.captures.reduce((count, capture) => count + capture.initialVideoRequests.length, 0),
    failedChecks: report.checks.filter(check => !check.passed),
    pageErrors: [...new Set(report.errors)],
  };
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.overflow.length || report.summary.brokenImageCaptures || report.summary.invalidHeadingCaptures || report.summary.failedChecks.length || report.errors.length || report.summary.initialVideoRequestCount) process.exitCode = 1;
}
