import { test as base, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const test = base;
for (const width of [1280, 393]) {
  test(`PWA shell, installability and offline data at ${width}px under Pages subpath`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('./');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    const cdp = await context.newCDPSession(page);
    const manifest = await cdp.send('Page.getAppManifest');
    expect(manifest.errors).toEqual([]);
    const parsed = JSON.parse(manifest.data!);
    expect(parsed.display).toBe('standalone'); expect(parsed.icons.length).toBe(3);
    const installability = await cdp.send('Page.getInstallabilityErrors');
    // Playwright's isolated contexts are incognito; installation itself is checked below.
    expect(installability.installabilityErrors.map(e => e.errorId)).toEqual(['in-incognito']);
    await page.getByRole('button', { name: 'Kurs hinzufügen' }).click();
    await page.getByLabel('Titel', { exact: true }).fill('MDN Testkurs');
    await page.getByLabel('Kursadresse').fill('https://developer.mozilla.org/en-US/docs/Learn_web_development');
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await page.getByLabel('Abgeschlossen: MDN Testkurs').check();
    await page.getByRole('spinbutton', { name: 'Note für MDN Testkurs' }).fill('0');
    await page.getByRole('button', { name: 'Note speichern' }).click();
    await page.reload();
    await context.setOffline(true);
    await expect(page.locator('#sync-status')).toHaveText('offline');
    await page.reload();
    // Chromium may report onLine=true after a SW navigation even with networking
    // blocked. Prove actual disconnection independently of that heuristic.
    const network = await page.evaluate(() => fetch('./uncached-probe-' + crypto.randomUUID(), { cache: 'no-store' }).then(() => 'connected').catch(() => 'blocked'));
    expect(network).toBe('blocked');
    await expect(page.getByRole('spinbutton', { name: 'Note für MDN Testkurs' })).toHaveValue('0');
    await expect(page.locator('#next-course')).toContainText('Alles abgeschlossen');
    await page.getByLabel('Abgeschlossen: MDN Testkurs').uncheck();
    await page.reload();
    await expect(page.locator('#next-course h2')).toHaveText('MDN Testkurs');
    const urls = await page.evaluate(async () => (await Promise.all((await caches.keys()).map(async name => (await (await caches.open(name)).keys()).map(r => r.url)))).flat());
    expect(urls.every(url => url.startsWith('http://127.0.0.1:4174/zerogen-learning/'))).toBe(true);
    expect(urls.some(url => /\.json\?auth=/.test(url))).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/pwa-${width}.png`, fullPage: true });
  });
}

test('installable manifest in a normal profile and data survives browser process restart', async ({ playwright }) => {
  const profile = await mkdtemp(join(tmpdir(), 'zerogen-install-'));
  const options = { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] };
  let context = await playwright.chromium.launchPersistentContext(profile, options);
  try {
    let page = await context.newPage();
    await page.goto('http://127.0.0.1:4174/zerogen-learning/');
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    const cdp = await context.newCDPSession(page);
    expect((await cdp.send('Page.getInstallabilityErrors')).installabilityErrors).toEqual([]);
    await page.getByRole('button', { name: 'Kurs hinzufügen' }).click();
    await page.getByLabel('Titel', { exact: true }).fill('Neustart-Testkurs');
    await page.getByLabel('Kursadresse').fill('https://web.dev/learn/html');
    await page.getByRole('button', { name: 'Speichern', exact: true }).click();
    await page.getByLabel('Abgeschlossen: Neustart-Testkurs').check();
    await page.getByRole('spinbutton', { name: 'Note für Neustart-Testkurs' }).fill('100');
    await page.getByRole('button', { name: 'Note speichern' }).click();
    await context.close();
    context = await playwright.chromium.launchPersistentContext(profile, options);
    page = await context.newPage();
    await page.goto('http://127.0.0.1:4174/zerogen-learning/');
    await expect(page.getByRole('spinbutton', { name: 'Note für Neustart-Testkurs' })).toHaveValue('100');
    await expect(page.locator('#next-course')).toContainText('Alles abgeschlossen');
  } finally { await context.close(); await rm(profile, { recursive: true, force: true }); }
});
