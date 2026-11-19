import { test, expect, abort, fail, hold } from './fixtures'

// /ui/health-screen/status
test('the health screen shows that the frontend reaches the backend', async ({ page }) => {
  await page.goto('/health')
  await expect(page.getByText('API: ok')).toBeVisible()
})

// /ui/health-screen/heading
test('the health screen shows the heading "Health"', async ({ page }) => {
  await page.goto('/health')
  await expect(page.getByRole('heading', { name: 'Health', exact: true })).toBeVisible()
})

// /ui/health-screen/pending
test('before the answer, the health screen shows "API: unknown"', async ({ page }) => {
  const held = await hold(page, 'GET', '**/api/health')

  await page.goto('/health')
  await held.sent

  await expect(page.getByText('API: unknown')).toBeVisible()
  held.release()
  await expect(page.getByText('API: ok')).toBeVisible()
})

// /ui/health-screen/error
test('an answer other than 200 shows "API: error"', async ({ page }) => {
  await fail(page, 'GET', '**/api/health')

  await page.goto('/health')

  await expect(page.getByText('API: error')).toBeVisible()
})

// /ui/health-screen/unreachable
test('no answer shows "API: unreachable"', async ({ page }) => {
  await abort(page, 'GET', '**/api/health')

  await page.goto('/health')

  await expect(page.getByText('API: unreachable')).toBeVisible()
})
