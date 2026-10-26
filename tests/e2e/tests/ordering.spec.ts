import { type Locator, type Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'

type Column = { id: string; title: string; cards: string[]; cardIds: string[] }
type Board = { id: string; title: string; columns: Column[] }

// Creates a board holding, for each given number, a column with that many cards, all with
// unique titles, and opens its board screen.
async function openBoard(page: Page, cardCounts: number[]): Promise<Board> {
  const api = await apiAs('demo')
  const title = uniqueTitle()
  const id = await createBoard(api, title)
  const columns: Board['columns'] = []
  for (const count of cardCounts) {
    const columnTitle = uniqueTitle()
    const column: Column = {
      id: await createColumn(api, id, columnTitle),
      title: columnTitle,
      cards: [],
      cardIds: [],
    }
    for (let i = 0; i < count; i++) {
      column.cards.push(uniqueTitle())
      column.cardIds.push(await createCard(api, column.id, column.cards[i]!))
    }
    columns.push(column)
  }
  await page.goto(`/boards/${id}`)
  await expect(article(page, title)).toBeVisible()
  return { id, title, columns }
}

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true })
}

// The names of the articles inside the article titled `within`, in document order, kept to
// those in `among`.
async function order(page: Page, within: string, among: string[]): Promise<string[]> {
  const snapshot = await article(page, within).ariaSnapshot()
  const names = [...snapshot.matchAll(/- article "([^"]*)"/g)].map((m) => m[1]!)
  return names.filter((name) => among.includes(name))
}

// Checks the order shown at once, then after a reload.
async function expectOrder(page: Page, within: string, among: string[], expected: string[]) {
  await expect.poll(() => order(page, within, among)).toEqual(expected)
  await page.reload()
  await expect(article(page, within)).toBeVisible()
  await expect.poll(() => order(page, within, among)).toEqual(expected)
}

// Drags an element by its title and drops it onto the title of another.
async function drag(page: Page, source: string, target: string) {
  await page.getByText(source, { exact: true }).dragTo(page.getByText(target, { exact: true }))
}

test.describe('Board screen: order', () => {
  test('columns and cards are shown in order', async ({ page }) => {
    const api = await apiAs('demo')
    const board = await openBoard(page, [0, 0, 3])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]
    const last = board.columns[2]!
    const [x, y, z] = last.cards as [string, string, string]
    await api.post(`/api/columns/${last.id}/move`, { data: { position: 1 } })
    await api.post(`/api/cards/${last.cardIds[2]}/move`, {
      data: { columnId: last.id, position: 1 },
    })

    await page.reload()

    await expect.poll(() => order(page, board.title, [a, b, c])).toEqual([c, a, b])
    await expect.poll(() => order(page, c, [x, y, z])).toEqual([z, x, y])
  })
})

test.describe('Drag and drop', () => {
  test('a column dropped onto a later column takes its position', async ({ page }) => {
    const board = await openBoard(page, [0, 0, 0])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]

    await drag(page, a, c)

    await expectOrder(page, board.title, [a, b, c], [b, c, a])
  })

  test('a column dropped onto an earlier column takes its position', async ({ page }) => {
    const board = await openBoard(page, [0, 0, 0])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]

    await drag(page, c, b)

    await expectOrder(page, board.title, [a, b, c], [a, c, b])
  })

  test('a column keeps its cards when moved', async ({ page }) => {
    const board = await openBoard(page, [1, 2])
    const [a, b] = board.columns.map((column) => column.title) as [string, string]
    const cards = board.columns[1]!.cards

    await drag(page, b, a)

    await expectOrder(page, board.title, [a, b], [b, a])
    await expect.poll(() => order(page, b, cards)).toEqual(cards)
  })

  test('a card dropped onto a later card of its column takes its position', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await drag(page, x, z)

    await expectOrder(page, column.title, column.cards, [y, z, x])
  })

  test('a card dropped onto an earlier card of its column takes its position', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await drag(page, z, y)

    await expectOrder(page, column.title, column.cards, [x, z, y])
  })

  test('a card dropped onto a card of another column takes its position', async ({ page }) => {
    const board = await openBoard(page, [2, 2])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]
    const [p, q] = done.cards as [string, string]
    const all = [x, y, p, q]

    await drag(page, x, q)

    await expectOrder(page, done.title, all, [p, x, q])
    await expect.poll(() => order(page, todo.title, all)).toEqual([y])
  })

  test('a card dropped onto a column, outside its cards, is placed last', async ({ page }) => {
    const board = await openBoard(page, [2, 2])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]
    const [p, q] = done.cards as [string, string]
    const all = [x, y, p, q]

    await drag(page, x, done.title)

    await expectOrder(page, done.title, all, [p, q, x])
    await expect.poll(() => order(page, todo.title, all)).toEqual([y])
  })

  test('a card dropped onto an empty column is placed in it', async ({ page }) => {
    const board = await openBoard(page, [1, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [x] = todo.cards as [string]

    await drag(page, x, done.title)

    await expectOrder(page, done.title, [x], [x])
    await expect.poll(() => order(page, todo.title, [x])).toEqual([])
  })
})
