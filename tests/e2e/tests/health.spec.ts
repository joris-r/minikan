import { test, expect } from '@playwright/test'

test('the frontend reaches the backend', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('API: ok')).toBeVisible()
})
