import { test, expect, type Page } from '@playwright/test'
import { apiAs, createBoard, createColumn, uniqueTitle } from './api'

type Entity = {
  name: string
  // Opens the screen holding the "Add" button, once its content is shown, and returns the label.
  open: (page: Page) => Promise<string>
}

const entities: Entity[] = [
  {
    name: 'board',
    open: async (page) => {
      const title = uniqueTitle()
      await createBoard(await apiAs('demo'), title)
      await page.goto('/')
      await expect(page.getByText(title)).toBeVisible()
      return 'Add board'
    },
  },
  {
    name: 'column',
    open: async (page) => {
      const title = uniqueTitle()
      const id = await createBoard(await apiAs('demo'), title)
      await page.goto(`/boards/${id}`)
      await expect(page.getByText(title)).toBeVisible()
      return 'Add column'
    },
  },
  {
    name: 'card',
    open: async (page) => {
      const api = await apiAs('demo')
      const title = uniqueTitle()
      const id = await createBoard(api, uniqueTitle())
      await createColumn(api, id, title)
      await page.goto(`/boards/${id}`)
      await expect(page.getByText(title)).toBeVisible()
      return 'Add card'
    },
  },
]

for (const { name, open } of entities) {
  test.describe(`R3: creating a ${name}`, () => {
    test('shows a focused, empty title input', async ({ page }) => {
      const label = await open(page)

      await page.getByRole('button', { name: label }).click()

      const input = page.getByRole('textbox')
      await expect(input).toBeFocused()
      await expect(input).toHaveValue('')
    })

    test('Enter records the title', async ({ page }) => {
      const label = await open(page)
      const title = uniqueTitle()
      await page.getByRole('button', { name: label }).click()

      await page.getByRole('textbox').fill(title)
      await page.getByRole('textbox').press('Enter')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByText(title, { exact: true })).toBeVisible()
    })

    test('leaving the input records the title', async ({ page }) => {
      const label = await open(page)
      const title = uniqueTitle()
      await page.getByRole('button', { name: label }).click()

      await page.getByRole('textbox').fill(title)
      await page.getByRole('textbox').blur()

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(page.getByText(title, { exact: true })).toBeVisible()
      await page.reload()
      await expect(page.getByText(title, { exact: true })).toBeVisible()
    })

    test('Enter on an empty input records an empty title', async ({ page }) => {
      const label = await open(page)
      const untitled = page.getByText('(Untitled)', { exact: true })
      const before = await untitled.count()
      await page.getByRole('button', { name: label }).click()

      await page.getByRole('textbox').press('Enter')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(untitled).toHaveCount(before + 1)
      await page.reload()
      await expect(untitled).toHaveCount(before + 1)
    })
  })
}
