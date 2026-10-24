import { defineConfig, devices } from '@playwright/test'

const backend = process.env.BACKEND ?? 'py_litestar'
const frontend = process.env.FRONTEND ?? 'ts_vue'
const apiPort = process.env.API_PORT ?? '8001'
const webPort = process.env.WEB_PORT ?? '5174'
// Read by the tests' own API client.
process.env.API_PORT = apiPort
// These files count every untitled board of the user, so they run after the others, one by one.
const alone = ['creating.spec.ts', 'boards-screen.spec.ts']

export default defineConfig({
  testDir: './tests',
  workers: 4,
  timeout: 10_000,
  use: {
    baseURL: `http://localhost:${webPort}`,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: alone,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-alone',
      testMatch: alone,
      dependencies: ['chromium'],
      workers: 1,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: `make -s -C ../../backends/${backend} run PORT=${apiPort} TEMP_STORAGE=1`,
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
    },
    {
      command: `MINIKAN_API_URL=http://localhost:${apiPort} make -s -C ../../frontends/${frontend} run PORT=${webPort}`,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: false,
    },
  ],
})
