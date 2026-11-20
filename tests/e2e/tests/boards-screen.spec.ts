import { test, expect, fail } from './fixtures'
import { apiAs, createBoard, uniqueTitle } from './api'

test.describe('Boards screen', () => {
  // /boards/ui/boards-screen/boards
  test('lists the boards of the user by title', async ({ page }) => {
    const title = uniqueTitle()
    await createBoard(await apiAs('demo'), title)

    await page.goto('/')

    await expect(page.getByRole('link', { name: title })).toBeVisible()
  })

  // /boards/ui/boards-screen/boards
  test('does not list boards of another user', async ({ page }) => {
    const mine = uniqueTitle()
    const theirs = uniqueTitle()
    await createBoard(await apiAs('demo'), mine)
    await createBoard(await apiAs('other'), theirs)

    await page.goto('/')

    await expect(page.getByRole('link', { name: mine })).toBeVisible()
    await expect(page.getByText(theirs)).toHaveCount(0)
  })

  // /boards/ui/boards-screen/open
  test('a board opens its board screen', async ({ page }) => {
    const title = uniqueTitle()
    const id = await createBoard(await apiAs('demo'), title)
    await page.goto('/')

    await page.getByRole('link', { name: title }).click()

    await expect(page).toHaveURL(`/boards/${id}`)
    await expect(page.getByText(title)).toBeVisible()
  })

  // /boards/ui/boards-screen/heading
  test('shows the heading "Boards"', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Boards', exact: true })).toBeVisible()
  })

  // /accounts/ui/header-bar/no-name
  test('a failed show session leaves the name out of the header bar', async ({ page }) => {
    await fail(page, 'GET', '**/api/session')
    const answered = page.waitForResponse('**/api/session')

    await page.goto('/')
    await answered

    await expect(page.getByRole('link', { name: 'Minikan' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible()
    await expect(page.getByText('demo', { exact: true })).toHaveCount(0)
  })

  // /boards/ui/boards-screen/header
  test('the banner is below the header bar and above the rest', async ({ page }) => {
    await fail(page, 'GET', /\/api\/boards$/)

    await page.goto('/')

    const banner = page.getByRole('alert')
    await expect(banner).toBeVisible()
    const header = (await page.locator('header').boundingBox())!
    const box = (await banner.boundingBox())!
    const heading = (await page.getByRole('heading', { name: 'Boards', exact: true }).boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(header.y + header.height)
    expect(heading.y).toBeGreaterThanOrEqual(box.y + box.height)
  })

  // /boards/ui/item/title
  test('an empty title is shown as "(Untitled)"', async ({ page }) => {
    const id = await createBoard(await apiAs('demo'), '')

    await page.goto('/')

    const link = page.getByRole('link', { name: '(Untitled)', exact: true })
    await expect(link.and(page.locator(`[href="/boards/${id}"]`))).toBeVisible()
  })
})
