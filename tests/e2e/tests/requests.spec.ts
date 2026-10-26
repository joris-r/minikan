import { type Locator, type Page } from '@playwright/test'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'
import { test, expect, fail, hold } from './fixtures'

const failedChange = 'The change could not be saved; the screen was reloaded.'

type Item = { id: string; title: string }
type Opened = { id: string; board: string; columns: (Item & { cards: Item[] })[] }

// Creates a board holding, for each given number, a column with that many cards, all with
// unique titles, and opens its board screen.
async function openBoard(page: Page, cardCounts: number[]): Promise<Opened> {
  const api = await apiAs('demo')
  const board = uniqueTitle()
  const id = await createBoard(api, board)
  const columns: Opened['columns'] = []
  for (const count of cardCounts) {
    const title = uniqueTitle()
    const column = { id: await createColumn(api, id, title), title, cards: [] as Item[] }
    for (let i = 0; i < count; i++) {
      const card = uniqueTitle()
      column.cards.push({ id: await createCard(api, column.id, card), title: card })
    }
    columns.push(column)
  }
  await page.goto(`/boards/${id}`)
  await expect(article(page, board)).toBeVisible()
  return { id, board, columns }
}

// Creates a board and opens the boards screen.
async function openBoards(page: Page): Promise<string> {
  const title = uniqueTitle()
  await createBoard(await apiAs('demo'), title)
  await page.goto('/')
  await expect(article(page, title)).toBeVisible()
  return title
}

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true })
}

// The Actions button of an item comes right after its title, before those of its columns or cards.
function actions(page: Page, title: string): Locator {
  return article(page, title).getByRole('button', { name: 'Actions' }).first()
}

async function choose(page: Page, title: string, item: string): Promise<void> {
  await actions(page, title).click()
  await page.getByRole('menuitem', { name: item, exact: true }).click()
}

async function rename(page: Page, before: string, title: string): Promise<void> {
  await page.getByText(before, { exact: true }).click()
  await page.getByRole('textbox').fill(title)
  await page.getByRole('textbox').press('Enter')
}

// The names of the articles inside the article titled `within`, in document order, kept to
// those in `among`.
async function order(page: Page, within: string, among: string[]): Promise<string[]> {
  const snapshot = await article(page, within).ariaSnapshot()
  const names = [...snapshot.matchAll(/- article "([^"]*)"/g)].map((m) => m[1]!)
  return names.filter((name) => among.includes(name))
}

function banner(page: Page): Locator {
  return page.getByRole('alert')
}

// The kinds of items whose title is renamed on the board screen, with the URL of their PATCH.
const titled = [
  { name: 'board', title: (o: Opened) => o.board, url: '**/api/boards/*' },
  { name: 'column', title: (o: Opened) => o.columns[0]!.title, url: '**/api/columns/*' },
  { name: 'card', title: (o: Opened) => o.columns[0]!.cards[0]!.title, url: '**/api/cards/*' },
]

test.describe('R10: a change is shown before the API answers', () => {
  for (const { name, title, url } of titled) {
    test(`renaming a ${name}`, async ({ page }) => {
      const before = title(await openBoard(page, [1]))
      const after = uniqueTitle()
      const patch = await hold(page, 'PATCH', url)

      await rename(page, before, after)

      await patch.sent
      await expect(page.getByText(after, { exact: true })).toBeVisible()
      patch.release()
      await page.reload()
      await expect(page.getByText(after, { exact: true })).toBeVisible()
    })
  }

  test('renaming a board created on the boards screen', async ({ page }) => {
    await openBoards(page)
    const title = uniqueTitle()
    const patch = await hold(page, 'PATCH', '**/api/boards/*')
    await page.getByRole('button', { name: 'Add board' }).click()

    await page.getByRole('textbox').fill(title)
    await page.getByRole('textbox').press('Enter')

    await patch.sent
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible()
    patch.release()
  })

  test('moving a column', async ({ page }) => {
    const opened = await openBoard(page, [0, 0])
    const [a, b] = opened.columns.map((column) => column.title) as [string, string]
    const move = await hold(page, 'POST', '**/api/columns/*/move')

    await choose(page, a, 'Move right')

    await move.sent
    await expect.poll(() => order(page, opened.board, [a, b])).toEqual([b, a])
    move.release()
  })

  test('moving a card', async ({ page }) => {
    const opened = await openBoard(page, [2])
    const column = opened.columns[0]!
    const [x, y] = column.cards.map((card) => card.title) as [string, string]
    const move = await hold(page, 'POST', '**/api/cards/*/move')

    await choose(page, x, 'Move down')

    await move.sent
    await expect.poll(() => order(page, column.title, [x, y])).toEqual([y, x])
    move.release()
  })

  test('deleting a card', async ({ page }) => {
    const card = (await openBoard(page, [1])).columns[0]!.cards[0]!.title
    const deletion = await hold(page, 'DELETE', '**/api/cards/*')

    await choose(page, card, 'Delete')

    await deletion.sent
    await expect(article(page, card)).toHaveCount(0)
    deletion.release()
  })

  test('deleting a column', async ({ page }) => {
    const column = (await openBoard(page, [0])).columns[0]!.title
    const deletion = await hold(page, 'DELETE', '**/api/columns/*')

    await choose(page, column, 'Delete')

    await deletion.sent
    await expect(article(page, column)).toHaveCount(0)
    deletion.release()
  })

  test('deleting a board on the boards screen', async ({ page }) => {
    const board = await openBoards(page)
    const deletion = await hold(page, 'DELETE', '**/api/boards/*')

    await choose(page, board, 'Delete')

    await deletion.sent
    await expect(article(page, board)).toHaveCount(0)
    deletion.release()
  })

  test('deleting the board on the board screen', async ({ page }) => {
    const board = (await openBoard(page, [])).board
    const deletion = await hold(page, 'DELETE', '**/api/boards/*')

    await choose(page, board, 'Delete')

    await deletion.sent
    await expect(page).toHaveURL('/')
    await expect(page.getByRole('button', { name: 'Add board' })).toBeVisible()
    await expect(page.getByText(board)).toHaveCount(0)
    deletion.release()
  })
})

test.describe('R10: a creation is shown once the API has answered', () => {
  test('creating a column', async ({ page }) => {
    const opened = await openBoard(page, [])
    const creation = await hold(page, 'POST', '**/api/boards/*/columns')

    await page.getByRole('button', { name: 'Add column' }).click()

    await creation.sent
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(article(page, opened.board).getByRole('article')).toHaveCount(0)
    creation.release()
    await expect(page.getByRole('textbox')).toBeFocused()
  })

  test('creating a card', async ({ page }) => {
    const column = (await openBoard(page, [0])).columns[0]!.title
    const creation = await hold(page, 'POST', '**/api/columns/*/cards')

    await article(page, column).getByRole('button', { name: 'Add card' }).click()

    await creation.sent
    await expect(page.getByRole('textbox')).toHaveCount(0)
    await expect(article(page, column).getByRole('article')).toHaveCount(0)
    creation.release()
    await expect(page.getByRole('textbox')).toBeFocused()
  })

  test('creating a board', async ({ page }) => {
    await openBoards(page)
    const creation = await hold(page, 'POST', '**/api/boards')

    await page.getByRole('button', { name: 'Add board' }).click()

    await creation.sent
    await expect(page.getByRole('textbox')).toHaveCount(0)
    creation.release()
    await expect(page.getByRole('textbox')).toBeFocused()
  })
})

test.describe('R11: a failed change', () => {
  for (const { name, title, url } of titled) {
    test(`renaming a ${name} shows the stored title and the banner`, async ({ page }) => {
      const before = title(await openBoard(page, [1]))
      await fail(page, 'PATCH', url)

      await rename(page, before, uniqueTitle())

      await expect(banner(page)).toContainText(failedChange)
      await expect(page.getByText(before, { exact: true })).toBeVisible()
    })
  }

  test('moving a column shows the stored order', async ({ page }) => {
    const opened = await openBoard(page, [0, 0])
    const [a, b] = opened.columns.map((column) => column.title) as [string, string]
    await fail(page, 'POST', '**/api/columns/*/move')

    await choose(page, a, 'Move right')

    await expect(banner(page)).toContainText(failedChange)
    await expect.poll(() => order(page, opened.board, [a, b])).toEqual([a, b])
  })

  test('moving a card shows the stored order', async ({ page }) => {
    const opened = await openBoard(page, [2])
    const column = opened.columns[0]!
    const [x, y] = column.cards.map((card) => card.title) as [string, string]
    await fail(page, 'POST', '**/api/cards/*/move')

    await choose(page, x, 'Move down')

    await expect(banner(page)).toContainText(failedChange)
    await expect.poll(() => order(page, column.title, [x, y])).toEqual([x, y])
  })

  test('deleting a card shows it again', async ({ page }) => {
    const card = (await openBoard(page, [1])).columns[0]!.cards[0]!.title
    await fail(page, 'DELETE', '**/api/cards/*')

    await choose(page, card, 'Delete')

    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, card)).toBeVisible()
  })

  test('deleting a board on the boards screen shows it again', async ({ page }) => {
    const board = await openBoards(page)
    await fail(page, 'DELETE', '**/api/boards/*')

    await choose(page, board, 'Delete')

    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, board)).toBeVisible()
  })

  test('deleting the board on the board screen shows it on the boards screen', async ({ page }) => {
    const board = (await openBoard(page, [])).board
    await fail(page, 'DELETE', '**/api/boards/*')

    await choose(page, board, 'Delete')

    await expect(page).toHaveURL('/')
    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, board)).toBeVisible()
  })

  test('creating a column shows the banner and no new column', async ({ page }) => {
    const opened = await openBoard(page, [])
    await fail(page, 'POST', '**/api/boards/*/columns')

    await page.getByRole('button', { name: 'Add column' }).click()

    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, opened.board).getByRole('article')).toHaveCount(0)
  })

  test('creating a board shows the banner', async ({ page }) => {
    await openBoards(page)
    await fail(page, 'POST', '**/api/boards')

    await page.getByRole('button', { name: 'Add board' }).click()

    await expect(banner(page)).toContainText(failedChange)
    await expect(page.getByRole('textbox')).toHaveCount(0)
  })

  test('reloads the board screen from the API', async ({ page }) => {
    const opened = await openBoard(page, [1])
    const card = opened.columns[0]!.cards[0]!.title
    const added = uniqueTitle()
    await createCard(await apiAs('demo'), opened.columns[0]!.id, added)
    await fail(page, 'PATCH', '**/api/cards/*')

    await rename(page, card, uniqueTitle())

    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, added)).toBeVisible()
  })

  test('reloads the boards screen from the API', async ({ page }) => {
    const board = await openBoards(page)
    const added = uniqueTitle()
    await createBoard(await apiAs('demo'), added)
    await fail(page, 'DELETE', '**/api/boards/*')

    await choose(page, board, 'Delete')

    await expect(banner(page)).toContainText(failedChange)
    await expect(article(page, added)).toBeVisible()
  })
})

test.describe('Changes and failures: the banner', () => {
  test('"Close" removes it', async ({ page }) => {
    const card = (await openBoard(page, [1])).columns[0]!.cards[0]!.title
    await fail(page, 'DELETE', '**/api/cards/*')
    await choose(page, card, 'Delete')
    await expect(banner(page)).toBeVisible()

    await banner(page).getByRole('button', { name: 'Close' }).click()

    await expect(banner(page)).toHaveCount(0)
  })

  test('a later change whose request succeeds removes it', async ({ page }) => {
    const opened = await openBoard(page, [2])
    const [failing, renamed] = opened.columns[0]!.cards
    await fail(page, 'PATCH', `**/api/cards/${failing!.id}`)
    await rename(page, failing!.title, uniqueTitle())
    await expect(banner(page)).toBeVisible()

    await rename(page, renamed!.title, uniqueTitle())

    await expect(banner(page)).toHaveCount(0)
  })

  test('a failed first load of the board screen', async ({ page }) => {
    const id = await createBoard(await apiAs('demo'), uniqueTitle())
    await fail(page, 'GET', `**/api/boards/${id}`)

    await page.goto(`/boards/${id}`)

    await expect(banner(page)).toContainText('The board could not be loaded.')
  })

  test('a failed first load of the boards screen', async ({ page }) => {
    await fail(page, 'GET', '**/api/boards')

    await page.goto('/')

    await expect(banner(page)).toContainText('The boards could not be loaded.')
  })
})
