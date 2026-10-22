import { test, expect, type Page } from '@playwright/test'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'

// Opens a board screen holding a board, a column and a card, and returns their titles.
async function openBoard(page: Page): Promise<Record<string, string>> {
  const api = await apiAs('demo')
  const titles = { board: uniqueTitle(), column: uniqueTitle(), card: uniqueTitle() }
  const id = await createBoard(api, titles.board)
  const column = await createColumn(api, id, titles.column)
  await createCard(api, column, titles.card)
  await page.goto(`/boards/${id}`)
  await expect(page.getByText(titles.card)).toBeVisible()
  return titles
}

for (const name of ['board', 'column', 'card']) {
  test.describe(`Title input: renaming a ${name}`, () => {
    test('clicking the title shows a focused input holding it', async ({ page }) => {
      const before = (await openBoard(page))[name]

      await page.getByText(before, { exact: true }).click()

      const input = page.getByRole('textbox')
      await expect(input).toBeFocused()
      await expect(input).toHaveValue(before)
    })

    test('R3: Enter records the title', async ({ page }) => {
      const before = (await openBoard(page))[name]
      const title = uniqueTitle()
      await page.getByText(before, { exact: true }).click()

      await page.getByRole('textbox').fill(title)
      await page.getByRole('textbox').press('Enter')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await expect(page.getByText(before, { exact: true })).toHaveCount(0)
    })

    test('R3: leaving the input records the title', async ({ page }) => {
      const before = (await openBoard(page))[name]
      const title = uniqueTitle()
      await page.getByText(before, { exact: true }).click()

      await page.getByRole('textbox').fill(title)
      await page.getByRole('textbox').blur()

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByText(title, { exact: true })).toBeVisible()
    })

    test('R3: Enter on an emptied input records an empty title', async ({ page }) => {
      const before = (await openBoard(page))[name]
      await page.getByText(before, { exact: true }).click()

      await page.getByRole('textbox').fill('')
      await page.getByRole('textbox').press('Enter')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText('(Untitled)', { exact: true })).toHaveCount(1)
      await page.reload()
      await expect(page.getByText('(Untitled)', { exact: true })).toHaveCount(1)
    })

    test('R4: Escape keeps the title before editing and sends no request', async ({ page }) => {
      const before = (await openBoard(page))[name]
      const patches: string[] = []
      page.on('request', (request) => {
        if (request.method() === 'PATCH') patches.push(request.url())
      })
      await page.getByText(before, { exact: true }).click()

      await page.getByRole('textbox').fill(uniqueTitle())
      await page.getByRole('textbox').press('Escape')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText(before, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByText(before, { exact: true })).toBeVisible()
      expect(patches).toEqual([])
    })
  })
}
