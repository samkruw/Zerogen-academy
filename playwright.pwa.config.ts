import { defineConfig } from '@playwright/test';
export default defineConfig({
  outputDir: 'test-results/pwa', testDir: './tests/pwa', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174/zerogen-learning/', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] } },
  webServer: { command: 'node scripts/serve-build.mjs', url: 'http://127.0.0.1:4174/zerogen-learning/', reuseExistingServer: false }
});
