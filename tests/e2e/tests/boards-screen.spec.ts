import { test, expect } from './fixtures'
import { apiAs, createBoard, uniqueTitle } from './api'

test.describe('Boards screen', () => {
  test('lists the boards of the user by title', async ({ page }) => {
    const title = uniqueTitle()
    await createBoard(await apiAs('demo'), title)

    await page.goto('/')

    await expect(page.getByRole('link', { name: title })).toBeVisible()
  })

  test('R1: does not list boards of another user', async ({ page }) => {
    const mine = uniqueTitle()
    const theirs = uniqueTitle()
    await createBoard(await apiAs('demo'), mine)
    await createBoard(await apiAs('other'), theirs)

    await page.goto('/')

    await expect(page.getByRole('link', { name: mine })).toBeVisible()
    await expect(page.getByText(theirs)).toHaveCount(0)
  })

  test('a board opens its board screen', async ({ page }) => {
    const title = uniqueTitle()
    const id = await createBoard(await apiAs('demo'), title)
    await page.goto('/')

    await page.getByRole('link', { name: title }).click()

    await expect(page).toHaveURL(`/boards/${id}`)
    await expect(page.getByText(title)).toBeVisible()
  })

  test('an empty title is shown as "(Untitled)"', async ({ page }) => {
    const id = await createBoard(await apiAs('demo'), '')

    await page.goto('/')

    const link = page.getByRole('link', { name: '(Untitled)', exact: true })
    await expect(link.and(page.locator(`[href="/boards/${id}"]`))).toBeVisible()
  })
})
