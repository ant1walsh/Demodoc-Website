// @ts-check
const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: { command: 'npm run serve', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
});
