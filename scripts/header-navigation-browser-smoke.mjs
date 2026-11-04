import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const baseURL = process.env.SITE_URL || "http://127.0.0.1:4321";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const destination of ["projects", "experience", "about", "brief"]) {
    await page.goto(baseURL);
    const link = page.locator(`.desktop-navigation a[href="/${destination}/"]`);
    await link.focus();
    assert.equal(await page.locator("[data-command-text]").textContent(), `cd ${destination}`);
    assert.equal(await page.locator("[data-command-preview]").isVisible(), true);
    const preserved = await link.evaluate(element => {
      const event = new MouseEvent("click", { bubbles: true, cancelable: true, metaKey: true });
      element.dispatchEvent(event);
      return !event.defaultPrevented;
    });
    assert.equal(preserved, true, "modified clicks preserve browser behavior");
    await link.click();
    await page.waitForURL(`${baseURL}/${destination}/`);
    assert.equal(await page.locator("[data-command-preview]").isVisible(), false);
  }
  await page.goto(baseURL);
  await page.keyboard.press("r");
  await page.waitForURL(`${baseURL}/resume/`);
  assert.equal(await page.getByRole("heading", { name: "Resumes", exact: true }).count(), 1);
  await page.setViewportSize({ width: 800, height: 900 });
  assert.equal(await page.locator('.header-resume').isVisible(), false);
  await page.locator('[data-mobile-menu] summary').click();
  assert.equal(await page.locator('.mobile-navigation a[href="/resume/"]').isVisible(), true);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator('.desktop-navigation a[href="/about/"]').focus();
  assert.equal(await page.locator("[data-command-preview]").isVisible(), false);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-mobile-menu] summary").click();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("[data-mobile-menu]").getAttribute("open"), null);
  assert.equal(await page.locator("[data-mobile-menu] summary").evaluate(element => element === document.activeElement), true);
  await page.locator("[data-mobile-menu] summary").click();
  await page.locator('.mobile-navigation a[href="/resume/"]').click();
  await page.waitForURL(`${baseURL}/resume/`);
  assert.equal(await page.locator("[data-mobile-menu]").getAttribute("open"), null);
  const noScript = await browser.newPage({ javaScriptEnabled: false });
  await noScript.goto(baseURL);
  await noScript.locator('.header-resume[href="/resume/"]').click();
  await noScript.waitForURL(`${baseURL}/resume/`);
  console.log("Header navigation, resume access, reduced motion, and mobile menu passed.");
} finally {
  await browser.close();
}
