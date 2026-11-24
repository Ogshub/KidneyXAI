import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:13000';
const apiURL = 'http://127.0.0.1:18080/api';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: {
    baseURL,
    channel: process.env.KIDNEY_BROWSER_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 13000 --strictPort',
    env: { VITE_API_URL: apiURL },
    url: baseURL,
    reuseExistingServer: false,
  },
});
