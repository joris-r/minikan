import { type Locator, type Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'

type Place = {
  name: string
  // Opens the screen showing the item, once it is shown, and returns its title. A full item
  // holds a column (a board) or a card (a column).
  open: (page: Page, full: boolean) => Promise<string>
}

async function shown(page: Page, path: string, title: string): Promise<string> {
  await page.goto(path)
  await expect(article(page, title)).toBeVisible()
  return title
}

const places: Place[] = [
  {
    name: 'a board on the boards screen',
    open: async (page, full) => {
      const api = await apiAs('demo')
      const title = uniqueTitle()
      const id = await createBoard(api, title)
      if (full) await createColumn(api, id, uniqueTitle())
      return shown(page, '/', title)
    },
  },
  {
    name: 'the board on the board screen',
    open: async (page, full) => {
      const api = await apiAs('demo')
      const title = uniqueTitle()
      const id = await createBoard(api, title)
      if (full) await createColumn(api, id, uniqueTitle())
      return shown(page, `/boards/${id}`, title)
    },
  },
  {
    name: 'a column',
    open: async (page, full) => {
      const api = await apiAs('demo')
      const title = uniqueTitle()
      const id = await createBoard(api, uniqueTitle())
      const column = await createColumn(api, id, title)
      if (full) await createCard(api, column, uniqueTitle())
      return shown(page, `/boards/${id}`, title)
    },
  },
  {
    name: 'a card',
    open: async (page) => {
      const api = await apiAs('demo')
      const title = uniqueTitle()
      const id = await createBoard(api, uniqueTitle())
      const column = await createColumn(api, id, uniqueTitle())
      await createCard(api, column, title)
      return shown(page, `/boards/${id}`, title)
    },
  },
]

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true })
}

// The Actions button of an item comes right after its title, before those of its columns or cards.
function actions(page: Page, title: string): Locator {
  return article(page, title).getByRole('button', { name: 'Actions' }).first()
}

async function chooseDelete(page: Page, title: string): Promise<void> {
  await actions(page, title).click()
  await page.getByRole('menuitem', { name: 'Delete' }).click()
}

// Records the DELETE requests sent by the page.
function deletes(page: Page): string[] {
  const urls: string[] = []
  page.on('request', (request) => {
    if (request.method() === 'DELETE') urls.push(request.url())
  })
  return urls
}

async function expectDeleted(page: Page, title: string): Promise<void> {
  await expect(article(page, title)).toHaveCount(0)
  await page.reload()
  await expect(page.getByText(title)).toHaveCount(0)
}

for (const { name, open } of places) {
  test.describe(`Actions menu of ${name}`, () => {
    test('opens a menu holding "Delete"', async ({ page }) => {
      const title = await open(page, true)

      await actions(page, title).click()

      await expect(page.getByRole('menu')).toBeVisible()
      await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible()
    })
  })
}

for (const { name, open } of places) {
  test.describe(`R6: deleting ${name}`, () => {
    test('when empty, deletes it at once', async ({ page }) => {
      const title = await open(page, false)

      await chooseDelete(page, title)

      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expectDeleted(page, title)
    })
  })
}

for (const { name, open } of places.filter((p) => p.name !== 'a card')) {
  test.describe(`R6: deleting ${name} that holds something`, () => {
    test('opens a dialog and deletes nothing yet', async ({ page }) => {
      const title = await open(page, true)
      const sent = deletes(page)

      await chooseDelete(page, title)

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Delete', exact: true })).toBeVisible()
      await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeVisible()
      expect(sent).toEqual([])
    })

    test('"Delete" in the dialog deletes it', async ({ page }) => {
      const title = await open(page, true)
      await chooseDelete(page, title)

      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click()

      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expectDeleted(page, title)
    })

    test('"Cancel" in the dialog keeps it and sends no request', async ({ page }) => {
      const title = await open(page, true)
      const sent = deletes(page)
      await chooseDelete(page, title)

      await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click()

      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(article(page, title)).toBeVisible()
      await page.reload()
      await expect(article(page, title)).toBeVisible()
      expect(sent).toEqual([])
    })
  })
}

test.describe('Deleting', () => {
  test('a card leaves the other cards of its column', async ({ page }) => {
    const api = await apiAs('demo')
    const [deleted, kept] = [uniqueTitle(), uniqueTitle()]
    const id = await createBoard(api, uniqueTitle())
    const column = await createColumn(api, id, uniqueTitle())
    await createCard(api, column, deleted)
    await createCard(api, column, kept)
    await shown(page, `/boards/${id}`, deleted)

    await chooseDelete(page, deleted)

    await expectDeleted(page, deleted)
    await expect(article(page, kept)).toBeVisible()
  })

  test('the board on the board screen goes to the boards screen', async ({ page }) => {
    const title = await places[1].open(page, false)

    await chooseDelete(page, title)

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Add board' })).toBeVisible()
    await expect(page.getByText(title)).toHaveCount(0)
  })
})
