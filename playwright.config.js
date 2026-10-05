const { defineConfig, devices } = require('@playwright/test');
const path = require('node:path');

const projectRoot = path.resolve(__dirname);
const indexFile = `file://${path.join(projectRoot, 'index.html').replace(/\\/g, '/')}`;

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 15000,
  fullyParallel: false,
  use: {
    baseURL: indexFile,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
  webServer: undefined,
});
