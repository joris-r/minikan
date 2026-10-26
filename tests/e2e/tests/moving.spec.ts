import { type Locator, type Page } from '@playwright/test'
import { test, expect } from './fixtures'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'

type Column = { title: string; cards: string[] }
type Board = { title: string; columns: Column[] }

// Creates a board holding, for each given number, a column with that many cards, all with
// unique titles, and opens its board screen.
async function openBoard(page: Page, cardCounts: number[]): Promise<Board> {
  const api = await apiAs('demo')
  const title = uniqueTitle()
  const id = await createBoard(api, title)
  const columns: Column[] = []
  for (const count of cardCounts) {
    const column: Column = { title: uniqueTitle(), cards: [] }
    const columnId = await createColumn(api, id, column.title)
    for (let i = 0; i < count; i++) {
      column.cards.push(uniqueTitle())
      await createCard(api, columnId, column.cards[i]!)
    }
    columns.push(column)
  }
  await page.goto(`/boards/${id}`)
  await expect(article(page, title)).toBeVisible()
  return { title, columns }
}

function article(page: Page, title: string): Locator {
  return page.getByRole('article', { name: title, exact: true })
}

// The Actions button of an item comes right after its title, before those of its columns or cards.
function actions(page: Page, title: string): Locator {
  return article(page, title).getByRole('button', { name: 'Actions' }).first()
}

function addCard(page: Page, column: string): Locator {
  return article(page, column).getByRole('button', { name: 'Add card' })
}

function dialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Move card' })
}

function moveToTop(page: Page, column: string): Locator {
  return dialog(page).getByRole('button', { name: `Move to top of ${column}`, exact: true })
}

function moveToBottom(page: Page, column: string): Locator {
  return dialog(page).getByRole('button', { name: `Move to bottom of ${column}`, exact: true })
}

async function menuItems(page: Page, title: string): Promise<string[]> {
  await actions(page, title).click()
  await expect(page.getByRole('menu')).toBeVisible()
  return page.getByRole('menuitem').allInnerTexts()
}

async function choose(page: Page, title: string, item: string): Promise<void> {
  await actions(page, title).click()
  await page.getByRole('menuitem', { name: item, exact: true }).click()
}

async function openDialog(page: Page, card: string): Promise<void> {
  await choose(page, card, 'Move to column')
  await expect(dialog(page)).toBeVisible()
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function markedCurrent(column: string): RegExp {
  return new RegExp(`${escapeRegExp(column)}\\s*\\(current\\)`)
}

// Presses Tab until `target` has the focus.
async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < 12; i++) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  await expect(target).toBeFocused()
}

test.describe('Actions menu: items', () => {
  test('of a column: "Move left" unless first, "Move right" unless last', async ({ page }) => {
    const board = await openBoard(page, [0, 0, 0])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]

    expect(await menuItems(page, a)).toEqual(['Move right', 'Delete'])
    await page.keyboard.press('Escape')
    expect(await menuItems(page, b)).toEqual(['Move left', 'Move right', 'Delete'])
    await page.keyboard.press('Escape')
    expect(await menuItems(page, c)).toEqual(['Move left', 'Delete'])
  })

  test('of the only column: "Delete"', async ({ page }) => {
    const board = await openBoard(page, [0])

    expect(await menuItems(page, board.columns[0]!.title)).toEqual(['Delete'])
  })

  test('of a card: "Move up" unless first, "Move down" unless last', async ({ page }) => {
    const board = await openBoard(page, [3])
    const [x, y, z] = board.columns[0]!.cards as [string, string, string]

    expect(await menuItems(page, x)).toEqual(['Move down', 'Move to column', 'Delete'])
    await page.keyboard.press('Escape')
    expect(await menuItems(page, y)).toEqual(['Move up', 'Move down', 'Move to column', 'Delete'])
    await page.keyboard.press('Escape')
    expect(await menuItems(page, z)).toEqual(['Move up', 'Move to column', 'Delete'])
  })

  test('of the only card of the only column: "Move to column", "Delete"', async ({ page }) => {
    const board = await openBoard(page, [1])

    expect(await menuItems(page, board.columns[0]!.cards[0]!)).toEqual(['Move to column', 'Delete'])
  })

  test('of the board: "Delete"', async ({ page }) => {
    const board = await openBoard(page, [1, 1])

    expect(await menuItems(page, board.title)).toEqual(['Delete'])
  })
})

test.describe('Actions menu: moves', () => {
  test('"Move left" swaps a column with its left neighbour', async ({ page }) => {
    const board = await openBoard(page, [0, 0, 0])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]

    await choose(page, b, 'Move left')

    await expectOrder(page, board.title, [a, b, c], [b, a, c])
  })

  test('"Move right" swaps a column with its right neighbour', async ({ page }) => {
    const board = await openBoard(page, [0, 0, 0])
    const [a, b, c] = board.columns.map((column) => column.title) as [string, string, string]

    await choose(page, b, 'Move right')

    await expectOrder(page, board.title, [a, b, c], [a, c, b])
  })

  test('a column keeps its cards when moved', async ({ page }) => {
    const board = await openBoard(page, [2, 0])
    const [a, b] = board.columns.map((column) => column.title) as [string, string]
    const cards = board.columns[0]!.cards

    await choose(page, a, 'Move right')

    await expectOrder(page, board.title, [a, b], [b, a])
    await expect.poll(() => order(page, a, cards)).toEqual(cards)
  })

  test('"Move up" swaps a card with the card above', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await choose(page, y, 'Move up')

    await expectOrder(page, column.title, column.cards, [y, x, z])
  })

  test('"Move down" swaps a card with the card below', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await choose(page, y, 'Move down')

    await expectOrder(page, column.title, column.cards, [x, z, y])
  })

  test('"Move to column" opens the move dialog', async ({ page }) => {
    const board = await openBoard(page, [1])

    await choose(page, board.columns[0]!.cards[0]!, 'Move to column')

    await expect(dialog(page)).toBeVisible()
  })
})

test.describe('Move dialog', () => {
  test('lists every column of the board, in order, with "Top" and "Bottom"', async ({ page }) => {
    const board = await openBoard(page, [0, 1, 0])
    const titles = board.columns.map((column) => column.title)

    await openDialog(page, board.columns[1]!.cards[0]!)

    const snapshot = await dialog(page).ariaSnapshot()
    const listed = [...snapshot.matchAll(/button "Move to top of ([^"]*)"/g)].map((m) => m[1]!)
    expect(listed).toEqual(titles)
    for (const title of titles) {
      await expect(moveToTop(page, title)).toHaveText('Top')
      await expect(moveToBottom(page, title)).toHaveText('Bottom')
    }
    await expect(dialog(page).getByRole('button', { name: 'Cancel' })).toBeVisible()
  })

  test("marks the card's own column \"(current)\"", async ({ page }) => {
    const board = await openBoard(page, [0, 1])
    const [other, own] = board.columns as [Column, Column]

    await openDialog(page, own.cards[0]!)

    await expect(dialog(page)).toContainText(markedCurrent(own.title))
    await expect(dialog(page)).not.toContainText(markedCurrent(other.title))
  })

  test('"Top" moves the card first in another column', async ({ page }) => {
    const board = await openBoard(page, [2, 2])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]
    const [p, q] = done.cards as [string, string]
    const all = [x, y, p, q]

    await openDialog(page, y)
    await moveToTop(page, done.title).click()

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, done.title, all, [y, p, q])
    await expect.poll(() => order(page, todo.title, all)).toEqual([x])
  })

  test('"Bottom" moves the card last in another column', async ({ page }) => {
    const board = await openBoard(page, [2, 2])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]
    const [p, q] = done.cards as [string, string]
    const all = [x, y, p, q]

    await openDialog(page, x)
    await moveToBottom(page, done.title).click()

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, done.title, all, [p, q, x])
    await expect.poll(() => order(page, todo.title, all)).toEqual([y])
  })

  test('"Top" on an empty column moves the card into it', async ({ page }) => {
    const board = await openBoard(page, [1, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [x] = todo.cards as [string]

    await openDialog(page, x)
    await moveToTop(page, done.title).click()

    await expectOrder(page, done.title, [x], [x])
    await expect.poll(() => order(page, todo.title, [x])).toEqual([])
  })

  test('"Top" on its own column moves the card first', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await openDialog(page, z)
    await moveToTop(page, column.title).click()

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, column.title, column.cards, [z, x, y])
  })

  test('"Bottom" on its own column moves the card last', async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const [x, y, z] = column.cards as [string, string, string]

    await openDialog(page, x)
    await moveToBottom(page, column.title).click()

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, column.title, column.cards, [y, z, x])
  })

  test('"Cancel" closes the dialog without moving the card', async ({ page }) => {
    const board = await openBoard(page, [2, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]

    await openDialog(page, x)
    await dialog(page).getByRole('button', { name: 'Cancel' }).click()

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, todo.title, [x, y], [x, y])
    await expect.poll(() => order(page, done.title, [x, y])).toEqual([])
  })

  test('Escape closes the dialog without moving the card', async ({ page }) => {
    const board = await openBoard(page, [2, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]

    await openDialog(page, x)
    await page.keyboard.press('Escape')

    await expect(dialog(page)).toHaveCount(0)
    await expectOrder(page, todo.title, [x, y], [x, y])
    await expect.poll(() => order(page, done.title, [x, y])).toEqual([])
  })
})

test.describe('R9: focus after a move', () => {
  for (const item of ['Move left', 'Move right']) {
    test(`after "${item}", on the moved column's Actions button`, async ({ page }) => {
      const board = await openBoard(page, [0, 0, 0])
      const b = board.columns[1]!.title

      await choose(page, b, item)

      await expect(actions(page, b)).toBeFocused()
    })
  }

  for (const item of ['Move up', 'Move down']) {
    test(`after "${item}", on the moved card's Actions button`, async ({ page }) => {
      const board = await openBoard(page, [3])
      const y = board.columns[0]!.cards[1]!

      await choose(page, y, item)

      await expect(actions(page, y)).toBeFocused()
    })
  }

  test("after a move to its own column, on the moved card's Actions button", async ({ page }) => {
    const board = await openBoard(page, [3])
    const column = board.columns[0]!
    const z = column.cards[2]!

    await openDialog(page, z)
    await moveToTop(page, column.title).click()

    await expect(actions(page, z)).toBeFocused()
  })

  test('after a move to another column, on the card now at its former position', async ({
    page,
  }) => {
    const board = await openBoard(page, [3, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [, y, z] = todo.cards as [string, string, string]

    await openDialog(page, y)
    await moveToBottom(page, done.title).click()

    await expect(actions(page, z)).toBeFocused()
  })

  test('after moving the last card to another column, on the previous card', async ({ page }) => {
    const board = await openBoard(page, [3, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [, y, z] = todo.cards as [string, string, string]

    await openDialog(page, z)
    await moveToTop(page, done.title).click()

    await expect(actions(page, y)).toBeFocused()
  })

  test('after moving the only card to another column, on "Add card" of the source column', async ({
    page,
  }) => {
    const board = await openBoard(page, [1, 0])
    const [todo, done] = board.columns as [Column, Column]

    await openDialog(page, todo.cards[0]!)
    await moveToTop(page, done.title).click()

    await expect(addCard(page, todo.title)).toBeFocused()
  })

  test('a column is triaged card after card from the keyboard', async ({ page }) => {
    const board = await openBoard(page, [2, 0])
    const [todo, done] = board.columns as [Column, Column]
    const [x, y] = todo.cards as [string, string]

    await actions(page, x).focus()
    for (const card of [x, y]) {
      await expect(actions(page, card)).toBeFocused()
      await page.keyboard.press('Enter')
      await tabTo(page, page.getByRole('menuitem', { name: 'Move to column' }))
      await page.keyboard.press('Enter')
      await expect(dialog(page)).toBeVisible()
      await tabTo(page, moveToBottom(page, done.title))
      await page.keyboard.press('Enter')
    }

    await expect(addCard(page, todo.title)).toBeFocused()
    await expectOrder(page, done.title, [x, y], [x, y])
  })
})
