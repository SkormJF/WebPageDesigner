import { defineConfig, devices } from '@playwright/test'

/* Playwright Test is the reproducible E2E path. The playwright-cli skill is a
   different tool for interactive inspection and evidence -- it does not
   replace these specs. */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'line' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    /* Preview the production build, not the dev server: dev masks build
       failures and differs from what actually ships.

       `--host 127.0.0.1` is load-bearing. Without it vite preview binds to
       `localhost`, which resolves to IPv6 ::1 on many machines -- the server
       comes up fine, `localhost:4173` answers 200, and `127.0.0.1:4173`
       refuses the connection, so Playwright waits out its full timeout and
       reports the server as never having started. Binding explicitly makes
       this independent of how the host resolves names. */
    command: 'npm run build && npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
