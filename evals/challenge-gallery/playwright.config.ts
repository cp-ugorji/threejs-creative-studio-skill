import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    viewport: { width: 1280, height: 800 },
    contextOptions: { reducedMotion: 'reduce' },
    colorScheme: 'dark',
    channel: 'chrome',
  },
  webServer: {
    command: 'pnpm preview --host 127.0.0.1 --port 4175',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
