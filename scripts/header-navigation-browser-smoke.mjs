import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.SITE_URL || 'http://127.0.0.1:4321';
const output = process.env.QA_OUTPUT || '/tmp/terminal-qa';
const contextualOnly = process.env.QA_CONTEXT_ONLY === '1';
const report = { scope: contextualOnly ? 'contextual commands' : 'full header', layouts: [], checks: [], navigation: [], errors: [] };
const check = (name, passed, details = {}) => {
  report.checks.push({ name, passed, ...details });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${passed ? '' : ` ${JSON.stringify(details)}`}`);
};
const pathOf = page => new URL(page.url()).pathname.replace(/\/$/, '') || '/';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, ignoreDefaultArgs: ['--disable-back-forward-cache'] });
const visit = async (page, path) => {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      return;
    } catch (error) { if (attempt === 4) throw error; await page.waitForTimeout(1000); }
  }
};
const waitForDestination = async (page, destination) => {
  await page.waitForURL(url => (url.pathname.replace(/\/$/, '') || '/') === destination);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
};
const observeHeader = async page => {
  await page.evaluate(() => {
    const key = 'qa-header-navigation';
    const state = { clickedAt: 0, href: '', frames: [] };
    sessionStorage.setItem(key, JSON.stringify(state));
    document.addEventListener('click', event => {
      const link = event.target instanceof Element ? event.target.closest('[data-command-link], .terminal-breadcrumb a[href="/"]') : null;
      if (!link) return;
      state.clickedAt = Date.now();
      state.href = link.getAttribute('href');
      state.frames = [];
      sessionStorage.setItem(key, JSON.stringify(state));
    }, true);
    const text = document.querySelector('[data-command-text]');
    if (text) new MutationObserver(() => {
      const preview = document.querySelector('[data-command-preview]');
      state.frames.push({ text: text.textContent.trim(), time: Date.now(), visible: Boolean(preview?.getClientRects().length) && getComputedStyle(preview).visibility !== 'hidden' && getComputedStyle(preview).display !== 'none' });
      sessionStorage.setItem(key, JSON.stringify(state));
    }).observe(text, { childList: true, characterData: true, subtree: true });
  });
};
const getTrace = page => page.evaluate(() => JSON.parse(sessionStorage.getItem('qa-header-navigation')));
const animationReset = page => page.evaluate(() => {
  const preview = document.querySelector('[data-command-preview]');
  const breadcrumb = document.querySelector('.terminal-breadcrumb');
  return Boolean(preview?.hidden) && !document.querySelector('[data-command-running]') && !document.querySelector('[data-command-active]') && getComputedStyle(breadcrumb).opacity === '1';
});
const measureHeader = page => page.evaluate(() => {
  const header = document.querySelector('.site-header');
  const preview = document.querySelector('[data-command-preview]');
  const text = document.querySelector('[data-command-text]');
  const rect = header.getBoundingClientRect();
  return { viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, left: rect.left, right: rect.right, previewVisible: !preview.hidden && Boolean(preview.getClientRects().length), text: text.textContent, textWidth: text.clientWidth, textScrollWidth: text.scrollWidth };
});
// Capture directly from Chrome after the complete command is painted. This avoids
// waiting for fonts or styles past the short command frame or delaying navigation.
const captureCommand = async (page, { destination, mobile, filename, expected = destination === '/' ? 'cd ~' : `cd ${destination.slice(1)}` }) => {
  if (mobile && destination !== '/') await page.locator('[data-mobile-menu] summary').click();
  const client = await page.context().newCDPSession(page);
  const metrics = await page.evaluate(({ destination, mobile, expected }) => new Promise((resolve, reject) => {
    const text = document.querySelector('[data-command-text]');
    const timeout = window.setTimeout(() => reject(new Error(`Command frame not observed: ${expected}`)), 2000);
    const observer = new MutationObserver(() => {
      if (text.textContent !== expected) return;
      observer.disconnect();
      window.clearTimeout(timeout);
      const header = document.querySelector('.site-header');
      const preview = document.querySelector('[data-command-preview]');
      const rect = header.getBoundingClientRect();
      resolve({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth, left: rect.left, right: rect.right, previewVisible: !preview.hidden && Boolean(preview.getClientRects().length), text: text.textContent, textWidth: text.clientWidth, textScrollWidth: text.scrollWidth });
    });
    observer.observe(text, { childList: true, characterData: true, subtree: true });
    const scope = mobile ? '[data-mobile-menu]' : '.desktop-navigation';
    const selector = destination === '/' ? '.terminal-breadcrumb a[href="/"]' : `${scope} [data-command-link][href="${destination}"]`;
    document.querySelector(selector).click();
  }), { destination, mobile, expected });
  const shot = await client.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: page.viewportSize().width, height: 500, scale: 1 } });
  await writeFile(`${output}/${filename}`, Buffer.from(shot.data, 'base64'));
  await waitForDestination(page, destination);
  await client.detach();
  return metrics;
};

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark', reducedMotion: 'no-preference' });
  await context.addInitScript(() => addEventListener('pageshow', event => { window.__qaPageShowPersisted = event.persisted; }));
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(`${page.url()}: ${error.stack || error.message}`));
  if (!contextualOnly) {
  await visit(page, '/');
  check('Four numbered navigation links remain available without a manual terminal', await page.locator('.desktop-navigation [data-command-link]').count() === 4 && await page.locator('[data-terminal-open], [data-terminal-dialog]').count() === 0);
  for (const destination of ['/projects', '/experience', '/about', '/brief']) {
    await visit(page, '/');
    await observeHeader(page);
    let requestedAt = 0;
    const onRequest = request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame() && new URL(request.url()).pathname === destination) requestedAt = Date.now(); };
    page.on('request', onRequest);
    await page.locator(`.desktop-navigation [data-command-link][href="${destination}"]`).click({ noWaitAfter: true });
    await waitForDestination(page, destination);
    page.off('request', onRequest);
    const trace = await getTrace(page);
    const duration = requestedAt - trace.clickedAt;
    report.navigation.push({ destination, duration, trace });
    check(`Header animates actual cd ${destination.slice(1)} before navigating within 650ms`, duration >= 0 && duration <= 650 && trace.frames.some(frame => frame.text === `cd ${destination.slice(1)}` && frame.visible), { duration, frames: trace.frames });
  }

  await visit(page, '/');
  await observeHeader(page);
  const popupWait = context.waitForEvent('page', { timeout: 5000 });
  await page.locator('.desktop-navigation [data-command-link][href="/projects"]').click({ modifiers: ['Meta'] });
  const popup = await popupWait;
  await popup.waitForLoadState('domcontentloaded');
  const modifiedTrace = await getTrace(page);
  check('Modified primary click retains native new-tab navigation', pathOf(page) === '/' && pathOf(popup) === '/projects' && !modifiedTrace.frames.some(frame => frame.visible), { parent: page.url(), popup: popup.url() });
  await popup.close();
  await page.bringToFront();

  await visit(page, '/');
  const rapidRequests = [];
  const onRapid = request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame()) rapidRequests.push(new URL(request.url()).pathname); };
  page.on('request', onRapid);
  await page.evaluate(() => {
    document.querySelector('.desktop-navigation [data-command-link][href="/projects"]').click();
    setTimeout(() => document.querySelector('.desktop-navigation [data-command-link][href="/about"]').click(), 40);
  });
  await waitForDestination(page, '/about');
  await page.waitForTimeout(500);
  page.off('request', onRapid);
  check('Rapid clicks navigate once to the latest destination', pathOf(page) === '/about' && rapidRequests.length === 1 && rapidRequests[0] === '/about', { requests: rapidRequests });

  await visit(page, '/');
  await page.locator('.desktop-navigation [href="/projects"]').click({ noWaitAfter: true });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(650);
  check('Escape cancels a pending navigation and restores the breadcrumb', pathOf(page) === '/' && await animationReset(page));

  await page.locator('.desktop-navigation [href="/experience"]').click({ noWaitAfter: true });
  await page.keyboard.press('?');
  await page.waitForTimeout(650);
  check('Opening keyboard help cancels pending navigation', pathOf(page) === '/' && await page.locator('[data-shortcuts-dialog]').evaluate(element => element.open) && await animationReset(page));
  await page.keyboard.press('Escape');

  await visit(page, '/about');
  await page.locator('.desktop-navigation [href="/projects"]').click({ noWaitAfter: true });
  await page.keyboard.press('g');
  await page.keyboard.press('h');
  await waitForDestination(page, '/');
  await page.waitForTimeout(650);
  check('Go-home chord supersedes a pending destination', pathOf(page) === '/' && await animationReset(page));

  await visit(page, '/');
  await observeHeader(page);
  await page.keyboard.press('2');
  await waitForDestination(page, '/experience');
  const keyboardTrace = await getTrace(page);
  check('Number shortcut uses the same visible command animation', keyboardTrace.frames.some(frame => frame.visible && frame.text === 'cd experience'));
  // A restored BFCache document does not dispatch DOMContentLoaded again.
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForTimeout(650);
  check('History Back restores a clean, usable breadcrumb', pathOf(page) === '/' && await animationReset(page), { bfcacheRestored: await page.evaluate(() => window.__qaPageShowPersisted) });
  await page.locator('.desktop-navigation [href="/about"]').click({ noWaitAfter: true });
  await waitForDestination(page, '/about');
  check('Header navigation remains usable after Back', pathOf(page) === '/about');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await visit(page, '/');
  await observeHeader(page);
  let reducedRequest = 0;
  const onReduced = request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame() && new URL(request.url()).pathname === '/brief') reducedRequest = Date.now(); };
  page.on('request', onReduced);
  await page.locator('.desktop-navigation [data-command-link][href="/brief"]').click();
  await waitForDestination(page, '/brief');
  page.off('request', onReduced);
  const reducedTrace = await getTrace(page);
  check('Reduced-motion navigation is immediate with no typing animation', reducedRequest - reducedTrace.clickedAt < 150 && !reducedTrace.frames.some(frame => frame.visible), { duration: reducedRequest - reducedTrace.clickedAt });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  for (const [origin, destination, expected, filename] of [
    ['/projects', '/', 'cd ~', 'header-home-command-dark.png'],
    ['/projects/operational-ticket-intelligence', '/', 'cd ~', 'header-nested-home-command-dark.png'],
    ['/projects/operational-ticket-intelligence', '/about', 'cd ~/about', 'header-home-relative-command-dark.png'],
    ['/brief', '/about', 'cd ../about', 'header-command-dark.png'],
    ['/projects/operational-ticket-intelligence', '/projects', 'cd ..', 'header-parent-command-dark.png'],
  ]) {
    await visit(page, origin);
    await observeHeader(page);
    const metrics = await captureCommand(page, { destination, expected, mobile: false, filename });
    const trace = await getTrace(page);
    check(`${origin} to ${destination} displays contextual ${expected}`, pathOf(page) === destination && metrics.previewVisible && metrics.text === expected && trace.frames.some(frame => frame.visible && frame.text === expected), metrics);
  }
  await visit(page, '/about');
  await observeHeader(page);
  const homePopupWait = context.waitForEvent('page', { timeout: 5000 });
  await page.locator('.terminal-breadcrumb a[href="/"]').click({ modifiers: ['Meta'] });
  const homePopup = await homePopupWait;
  await homePopup.waitForLoadState('domcontentloaded');
  const modifiedHomeTrace = await getTrace(page);
  check('Modified home breadcrumb opens a native new tab', pathOf(page) === '/about' && pathOf(homePopup) === '/' && !modifiedHomeTrace.frames.some(frame => frame.visible));
  await homePopup.close();
  await page.bringToFront();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await observeHeader(page);
  let homeRequestedAt = 0;
  const onHomeRequest = request => { if (request.isNavigationRequest() && request.frame() === page.mainFrame() && new URL(request.url()).pathname === '/') homeRequestedAt = Date.now(); };
  page.on('request', onHomeRequest);
  await page.locator('.terminal-breadcrumb a[href="/"]').click();
  await waitForDestination(page, '/');
  page.off('request', onHomeRequest);
  const reducedHomeTrace = await getTrace(page);
  check('Reduced-motion home breadcrumb navigates immediately without typing', pathOf(page) === '/' && homeRequestedAt - reducedHomeTrace.clickedAt < 150 && !reducedHomeTrace.frames.some(frame => frame.visible), { duration: homeRequestedAt - reducedHomeTrace.clickedAt });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (contextualOnly) {
    await page.setViewportSize({ width: 320, height: 900 });
    await visit(page, '/brief');
    const metrics = await captureCommand(page, { destination: '/about', expected: 'cd ../about', mobile: true, filename: 'header-command-320-dark.png' });
    check('Mobile menu displays contextual command without overflow', metrics.previewVisible && metrics.text === 'cd ../about' && metrics.documentWidth <= 320 && metrics.textScrollWidth <= metrics.textWidth + 1, metrics);
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await visit(page, '/projects/operational-ticket-intelligence');
  const longest = await captureCommand(page, { destination: '/experience', expected: 'cd ~/experience', mobile: true, filename: 'header-command-long-320-dark.png' });
  check('Longest contextual command fits at 320px', longest.previewVisible && longest.documentWidth <= 320 && longest.textScrollWidth <= longest.textWidth + 1, longest);
  await context.close();

  if (!contextualOnly) {
  for (const theme of ['light', 'dark']) {
    const layoutContext = await browser.newContext({ colorScheme: theme, reducedMotion: 'no-preference' });
    await layoutContext.addInitScript(theme => { try { localStorage.setItem('theme', theme); } catch {} }, theme);
    const layoutPage = await layoutContext.newPage();
    layoutPage.on('pageerror', error => report.errors.push(error.message));
    for (const width of [320, 390, 1440]) {
      await layoutPage.setViewportSize({ width, height: 900 });
      await visit(layoutPage, '/');
      const initial = await measureHeader(layoutPage);
      check(`Resting header ${width}px ${theme} fits the viewport`, initial.documentWidth <= width + 1 && initial.left >= 0 && initial.right <= width + 1 && !initial.previewVisible, initial);
      const filename = width === 1440 && theme === 'dark' ? 'header-command-dark.png' : `header-command-${width}-${theme}.png`;
      const active = await captureCommand(layoutPage, { destination: '/experience', mobile: width < 1024, filename });
      report.layouts.push({ theme, width, initial, active });
      check(`Animated header ${width}px ${theme} shows the complete command without overflow`, active.documentWidth <= width + 1 && active.left >= 0 && active.right <= width + 1 && active.previewVisible && active.text === 'cd experience' && active.textScrollWidth <= active.textWidth + 1, active);
    }
    await layoutContext.close();
  }

  const noScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const plain = await noScript.newPage();
  await visit(plain, '/');
  await plain.locator('.desktop-navigation a[href="/projects"]').click();
  await plain.waitForURL('**/projects');
  check('Desktop regular navigation works without JavaScript', pathOf(plain) === '/projects');
  await plain.setViewportSize({ width: 390, height: 900 });
  await plain.locator('[data-mobile-menu] summary').click();
  await plain.locator('[data-mobile-menu] a[href="/about"]').click();
  await plain.waitForURL('**/about');
  check('Mobile native menu works without JavaScript', pathOf(plain) === '/about');
  await noScript.close();
  }
} catch (error) {
  report.errors.push(error.stack || String(error));
  console.error(error);
} finally {
  await browser.close();
  report.summary = { checks: report.checks.length, failed: report.checks.filter(check => !check.passed), layouts: report.layouts.length, errors: report.errors };
  await writeFile(`${output}/${contextualOnly ? 'header-context-report' : 'header-report'}.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
  if (report.summary.failed.length || report.errors.length) process.exitCode = 1;
}
