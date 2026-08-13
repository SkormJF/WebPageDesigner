import { defineConfig, devices } from "@playwright/test";

/* Playwright Test is the reproducible E2E path. The playwright-cli skill is a
   different tool for interactive inspection and evidence -- it does not replace
   these specs. */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "line" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    /* Production build, not dev: the dev server masks build failures and
       differs from what actually ships.

       The hostname is pinned rather than left to default. A server that binds
       to `localhost` can end up on IPv6 ::1 only, which answers on
       `localhost:3000` and refuses `127.0.0.1:3000` -- Playwright then waits
       out its whole timeout and reports the server as never started. Binding
       explicitly makes this independent of how the host resolves names. */
    command: "npm run build && npm run start -- --port 3000 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
