import { test, expect } from './fixtures'
import { apiAs, createBoard, createCard, createColumn, uniqueTitle } from './api'

test.describe('Board screen', () => {
  test('shows the title, the columns and their cards', async ({ page }) => {
    const api = await apiAs('demo')
    const id = await createBoard(api, 'Roadmap')
    const todo = await createColumn(api, id, 'To do')
    await createColumn(api, id, 'Done')
    await createCard(api, todo, 'Write the spec')
    await createCard(api, todo, 'Write the tests')

    await page.goto(`/boards/${id}`)

    for (const text of ['Roadmap', 'To do', 'Done', 'Write the spec', 'Write the tests']) {
      await expect(page.getByText(text, { exact: true })).toBeVisible()
    }
  })

  test('an empty title is shown as "(Untitled)"', async ({ page }) => {
    const api = await apiAs('demo')
    const id = await createBoard(api, '')
    const column = await createColumn(api, id, '')
    await createCard(api, column, '')

    await page.goto(`/boards/${id}`)

    await expect(page.getByText('(Untitled)', { exact: true })).toHaveCount(3)
  })
})
