import { type Locator, type Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { apiAs, createBoard, createColumn, uniqueTitle } from './api'

type Entity = {
  name: string
  // Opens the screen holding the "Add" button, once its content is shown, and returns the label.
  open: (page: Page) => Promise<string>
  // The created item's title, shown as "(Untitled)", among items the test may not own.
  untitled: (page: Page, id: string) => Locator
}

const untitledText = (page: Page) => page.getByText('(Untitled)', { exact: true })

// Clicks the "Add" button and returns the id of the created item.
async function add(page: Page, label: string): Promise<string> {
  const created = page.waitForResponse((response) => response.request().method() === 'POST')
  await page.getByRole('button', { name: label }).click()
  return (await (await created).json()).id
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
    untitled: (page, id) =>
      page
        .getByRole('link', { name: '(Untitled)', exact: true })
        .and(page.locator(`[href="/boards/${id}"]`)),
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
    // The other titles of the board screen are not empty.
    untitled: untitledText,
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
    untitled: untitledText,
  },
]

for (const { name, open, untitled } of entities) {
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
      const id = await add(page, label)

      await page.getByRole('textbox').press('Enter')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(untitled(page, id)).toHaveCount(1)
      await page.reload()
      await expect(untitled(page, id)).toHaveCount(1)
    })
  })

  test.describe(`R4: creating a ${name}`, () => {
    test('Escape keeps the empty title and sends no request', async ({ page }) => {
      const label = await open(page)
      const patches: string[] = []
      page.on('request', (request) => {
        if (request.method() === 'PATCH') patches.push(request.url())
      })
      const id = await add(page, label)

      await page.getByRole('textbox').fill(uniqueTitle())
      await page.getByRole('textbox').press('Escape')

      await expect(page.getByRole('textbox')).toHaveCount(0)
      await expect(untitled(page, id)).toHaveCount(1)
      await page.reload()
      await expect(untitled(page, id)).toHaveCount(1)
      expect(patches).toEqual([])
    })
  })
}
