import { defineConfig } from '@playwright/test';
import { ownerUid } from './tests/rules-owner.ts';
export default defineConfig({
  outputDir: 'test-results/browser', testDir: './tests/browser', testIgnore: process.env.ZEROGEN_SYNC_TEST ? [] : ['**/sync.spec.ts'], fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] } },
  webServer: { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false, env: process.env.ZEROGEN_SYNC_TEST ? { VITE_FIREBASE_API_KEY: 'test-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-zerogen.firebaseapp.com', VITE_FIREBASE_DATABASE_URL: 'https://demo-zerogen-default-rtdb.firebaseio.com', VITE_FIREBASE_PROJECT_ID: 'demo-zerogen', VITE_OWNER_UID: ownerUid } : { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_AUTH_DOMAIN: '', VITE_FIREBASE_DATABASE_URL: '', VITE_FIREBASE_PROJECT_ID: '', VITE_OWNER_UID: '' } }
});
