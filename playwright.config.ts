import { defineConfig, devices } from '@playwright/test';

const WebUrl = 'http://localhost:3000';
const ApiHealthUrl = 'http://127.0.0.1:4000/api/v1/health';
const SERVER_START_TIMEOUT_MS = 180_000;
const CI_RETRIES = 2;

export default defineConfig({
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  retries: process.env.CI ? CI_RETRIES : 0,
  testDir: './e2e',
  use: {
    baseURL: WebUrl,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev:api',
      reuseExistingServer: !process.env.CI,
      timeout: SERVER_START_TIMEOUT_MS,
      url: ApiHealthUrl,
    },
    {
      command: 'npm run dev:web',
      reuseExistingServer: !process.env.CI,
      timeout: SERVER_START_TIMEOUT_MS,
      url: `${WebUrl}/sign-in`,
    },
  ],
  workers: process.env.CI ? 1 : undefined,
});
