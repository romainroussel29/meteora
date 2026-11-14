import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    // Le service worker intercepterait les requêtes avant les simulations d'API de Playwright
    serviceWorkers: 'block',
    trace: 'on-first-retry',
    // En local on utilise le Chrome installé ; en CI, le Chromium de Playwright
    channel: isCI ? undefined : 'chrome',
  },
  projects: [
    { name: 'ordinateur', use: { ...devices['Desktop Chrome'], channel: isCI ? undefined : 'chrome' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: isCI ? undefined : 'chrome' } },
  ],
  // Les tests tournent sur la version de production (comme sur Vercel)
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
