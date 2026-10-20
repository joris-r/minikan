import { defineConfig, devices } from '@playwright/test'

const backend = process.env.BACKEND ?? 'py_litestar'
const frontend = process.env.FRONTEND ?? 'ts_vue'
const apiPort = process.env.API_PORT ?? '8000'
const webPort = process.env.WEB_PORT ?? '5173'

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `http://localhost:${webPort}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `make -s -C ../../backends/${backend} run PORT=${apiPort}`,
      url: `http://localhost:${apiPort}/api/health`,
      reuseExistingServer: true,
    },
    {
      command: `MINIKAN_API_URL=http://localhost:${apiPort} make -s -C ../../frontends/${frontend} run PORT=${webPort}`,
      url: `http://localhost:${webPort}`,
      reuseExistingServer: true,
    },
  ],
})
