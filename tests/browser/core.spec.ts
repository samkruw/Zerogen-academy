import { test, expect } from '@playwright/test';

async function add(page, title, url = 'https://developer.mozilla.org/en-US/docs/Learn_web_development') {
  await page.getByRole('button', { name: 'Kurs hinzufügen' }).click();
  await page.getByLabel('Titel', { exact: true }).fill(title);
  await page.getByLabel('Kursadresse').fill(url);
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
}
test('learning flow, external link, authentic score, reload and undo', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByText('Dein erster Kurs wartet.')).toBeVisible();
  await add(page, 'MDN Webentwicklung');
  await add(page, 'web.dev Learn HTML', 'https://web.dev/learn/html');
  const link = page.locator('#next-course a');
  await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  // Serve a clearly labelled fixture at the real course URL; no external learning or grade is claimed.
  await context.route('https://developer.mozilla.org/**', route => route.fulfill({ body: '<title>Externer Testkurs</title><p>Kursanbieter-Testfixture</p>', contentType: 'text/html' }));
  const popup = await Promise.all([context.waitForEvent('page'), link.click()]).then(r => r[0]);
  await popup.waitForLoadState(); await expect(popup).toHaveURL(/developer.mozilla.org/); await popup.close();
  await page.getByLabel('Abgeschlossen: MDN Webentwicklung').check();
  await expect(page.locator('#next-course h2')).toHaveText('web.dev Learn HTML');
  await page.getByRole('spinbutton', { name: 'Note für MDN Webentwicklung' }).fill('100');
  await page.locator('#course-list li').first().getByRole('button', { name: 'Note speichern' }).click();
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Note für MDN Webentwicklung' })).toHaveValue('100');
  await expect(page.locator('#stats')).toContainText('100 / 100');
  await page.getByLabel('Abgeschlossen: MDN Webentwicklung').uncheck();
  await expect(page.getByRole('spinbutton', { name: 'Note für MDN Webentwicklung' })).toHaveValue('');
  await expect(page.locator('#next-course h2')).toHaveText('MDN Webentwicklung');
});
test('edit, order, archive and backup/import validation', async ({ page }) => {
  await page.goto('/'); await add(page, 'Eins'); await add(page, 'Zwei');
  await page.getByRole('button', { name: 'Zwei nach oben' }).click();
  await expect(page.locator('#next-course h2')).toHaveText('Zwei');
  await page.getByRole('button', { name: 'Ändern: Zwei' }).click();
  await page.getByLabel('Titel', { exact: true }).fill('Geändert');
  await page.getByRole('button', { name: 'Speichern', exact: true }).click();
  await page.getByRole('button', { name: 'Archivieren: Geändert' }).click();
  await expect(page.locator('#next-course h2')).toHaveText('Eins');
  await page.getByText('Archiv (1)', { exact: false }).click();
  await page.getByRole('button', { name: 'Wiederherstellen: Geändert' }).click();
  await page.getByText('Sicherung & Synchronisierung').click();
  const download = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'JSON exportieren', exact: true }).click()]).then(r => r[0]);
  const path = await download.path();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#import').setInputFiles(path!);
  await expect(page.locator('#notice')).toContainText('Import gespeichert');
  await page.locator('#import').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{broken') });
  await expect(page.locator('#notice')).toContainText('Import abgebrochen');
  await expect(page.locator('#course-list li')).toHaveCount(2);
});
test('mobile has no horizontal overflow and corrupt storage is not overwritten', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 }); await page.goto('/');
  await add(page, 'Ein längerer Kurs für den mobilen Browser');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.evaluate(() => localStorage.setItem('zerogen-learning-v1', '{broken'));
  await page.reload();
  await expect(page.locator('#notice')).toContainText('Bestehende Daten wurden nicht verändert');
  expect(await page.evaluate(() => localStorage.getItem('zerogen-learning-v1'))).toBe('{broken');
});

test('keyboard focus survives completion and score updates', async ({ page }) => {
  await page.goto('/'); await add(page, 'Tastaturkurs');
  const complete = page.getByLabel('Abgeschlossen: Tastaturkurs');
  await complete.focus(); await page.keyboard.press('Space');
  await expect(complete).toBeFocused();
  await page.keyboard.press('Tab');
  const score = page.getByRole('spinbutton', { name: 'Note für Tastaturkurs' });
  await expect(score).toBeFocused();
  await score.fill('87'); await page.keyboard.press('Enter');
  await expect(score).toBeFocused();
  await expect(page.locator('#stats')).toContainText('87 / 100');
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
});
