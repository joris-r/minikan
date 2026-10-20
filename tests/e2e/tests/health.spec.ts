import { test, expect } from '@playwright/test'

test('the health screen shows that the frontend reaches the backend', async ({ page }) => {
  await page.goto('/health')
  await expect(page.getByText('API: ok')).toBeVisible()
})
