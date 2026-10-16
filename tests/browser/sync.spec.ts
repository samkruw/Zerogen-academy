import { test, expect } from '@playwright/test';
import { ownerUid } from '../rules-owner.ts';
const endpoint = `http://127.0.0.1:9000/users/${ownerUid}/courses.json?ns=demo-zerogen`;
const token = () => [
  { alg: 'none', typ: 'JWT' },
  { sub: ownerUid, user_id: ownerUid, aud: 'demo-zerogen', iss: 'https://securetoken.google.com/demo-zerogen', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000), email: 'owner@example.test', firebase: { sign_in_provider: 'password', identities: {} } }
].map(value => Buffer.from(JSON.stringify(value)).toString('base64url')).join('.') + '.';

test('two browser profiles sync through real RTDB ETags, show conflict and resolve consciously', async ({ browser, request }) => {
  await request.put(endpoint, { headers: { Authorization: 'Bearer owner' }, data: null }); // Emulator only.
  const a = await browser.newContext(), b = await browser.newContext();
  async function wire(context) {
    await context.route('https://identitytoolkit.googleapis.com/**', route => {
      const jwt = token();
      return route.fulfill({ json: route.request().url().includes('accounts:lookup') ? { users: [{ localId: ownerUid, email: 'owner@example.test', emailVerified: true }] } : { localId: ownerUid, email: 'owner@example.test', idToken: jwt, refreshToken: 'test-refresh-token', expiresIn: '3600', registered: true } });
    });
    await context.route('https://demo-zerogen-default-rtdb.firebaseio.com/**', async route => {
      const original = new URL(route.request().url());
      const url = new URL(endpoint); url.searchParams.set('auth', original.searchParams.get('auth')!);
      const response = await route.fetch({ url: url.href });
      await route.fulfill({ response });
    });
  }
  await wire(a); await wire(b);
  const pa = await a.newPage(), pb = await b.newPage();
  async function login(page) {
    await page.goto('/');
    await page.getByText('Sicherung & Synchronisierung').click();
    await page.getByLabel('E-Mail', { exact: true }).fill('owner@example.test');
    await page.getByLabel('Passwort', { exact: true }).fill('not-a-real-password');
    await page.getByRole('button', { name: 'Eigentümerkonto anmelden' }).click();
    await expect(page.locator('#sync-status')).toHaveText('synchronisiert');
  }
  await login(pa); await login(pb);
  await pa.getByRole('button', { name: 'Kurs hinzufügen' }).click();
  await pa.getByLabel('Titel', { exact: true }).fill('MDN Testkurs');
  await pa.getByLabel('Kursadresse').fill('https://developer.mozilla.org/en-US/docs/Learn_web_development');
  await pa.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(pa.locator('#sync-status')).toHaveText('synchronisiert');
  await pb.getByRole('button', { name: 'Jetzt synchronisieren' }).click();
  await expect(pb.locator('#next-course h2')).toHaveText('MDN Testkurs');
  await b.setOffline(true);
  await pb.getByLabel('Abgeschlossen: MDN Testkurs').check();
  await pa.getByRole('button', { name: 'Ändern: MDN Testkurs' }).click();
  await pa.getByLabel('Titel', { exact: true }).fill('Geänderter MDN Testkurs');
  await pa.getByRole('button', { name: 'Speichern', exact: true }).click();
  await expect(pa.locator('#sync-status')).toHaveText('synchronisiert');
  await b.setOffline(false);
  await pb.getByRole('button', { name: 'Jetzt synchronisieren' }).click();
  await expect(pb.locator('#sync-status')).toHaveText('Konflikt');
  await expect(pb.getByRole('button', { name: 'Lokalen Stand verwenden' })).toBeVisible();
  pb.once('dialog', d => d.accept());
  await pb.getByRole('button', { name: 'Lokalen Stand verwenden' }).click();
  await expect(pb.locator('#sync-status')).toHaveText('synchronisiert');
  await pa.getByRole('button', { name: 'Jetzt synchronisieren' }).click();
  await expect(pa.getByLabel('Abgeschlossen: MDN Testkurs')).toBeChecked();
  await expect(pa.locator('#course-list li h3')).toHaveText('MDN Testkurs');
  await a.close(); await b.close();
});
