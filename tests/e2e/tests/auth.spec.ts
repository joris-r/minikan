import { type Page } from '@playwright/test'
import { apiAs, apiWith, createBoard, uniqueTitle } from './api'
import { test, expect, fail } from './fixtures'

async function logIn(page: Page, name: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Name', { exact: true }).fill(name)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
}

// Creates a board of `demo` and returns its id.
async function newBoard(): Promise<string> {
  return createBoard(await apiAs('demo'), uniqueTitle())
}

test.describe('Login screen', () => {
  test.use({ user: null })

  test('"Log in" with a valid name and password goes to the boards screen', async ({ page }) => {
    await logIn(page, 'demo', 'demo-password')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('demo', { exact: true })).toBeVisible()
  })

  test('the session is of the user who logged in', async ({ page }) => {
    await logIn(page, 'other', 'other-password')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('other', { exact: true })).toBeVisible()
  })

  for (const [name, password] of [
    ['demo', 'wrong-password'],
    ['nobody', 'demo-password'],
  ]) {
    test(`with name "${name}" and password "${password}", shows an alert and empties the password`, async ({
      page,
    }) => {
      await logIn(page, name, password)

      await expect(page.getByRole('alert')).toHaveText('Invalid name or password.')
      await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
      await expect(page).toHaveURL('/login')
    })
  }

  test('a failed login request shows that it could not be sent', async ({ page }) => {
    await fail(page, 'POST', '**/api/login')

    await logIn(page, 'demo', 'demo-password')

    await expect(page.getByRole('alert')).toHaveText('The login could not be sent; try again.')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Header bar', () => {
  for (const [screen, path] of [
    ['boards screen', async () => '/'],
    ['board screen', async () => `/boards/${await newBoard()}`],
  ] as const) {
    test(`on the ${screen}, shows "Minikan", the user and "Log out"`, async ({ page }) => {
      await page.goto(await path())

      await expect(page.getByRole('link', { name: 'Minikan', exact: true })).toBeVisible()
      await expect(page.getByText('demo', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
    })
  }

  test('"Minikan" goes to the boards screen', async ({ page }) => {
    await page.goto(`/boards/${await newBoard()}`)

    await page.getByRole('link', { name: 'Minikan', exact: true }).click()

    await expect(page).toHaveURL('/')
  })

  test('"Log out" ends the session and goes to the login screen', async ({ page, session }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Log out', exact: true }).click()

    await expect(page).toHaveURL('/login')
    expect((await (await apiWith(session!)).get('/api/session')).status()).toBe(401)
  })

  test('a failed "Log out" keeps the screen and the session, with a banner', async ({
    page,
    session,
  }) => {
    await page.goto('/')
    await fail(page, 'POST', '**/api/logout')

    await page.getByRole('button', { name: 'Log out', exact: true }).click()

    await expect(page.getByRole('alert')).toContainText(
      'The logout failed; the session is still open.',
    )
    await expect(page).toHaveURL('/')
    expect((await (await apiWith(session!)).get('/api/session')).status()).toBe(200)
  })

  test.describe('of another user', () => {
    test.use({ user: 'other' })

    test('shows the name of that user', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByText('other', { exact: true })).toBeVisible()
      await expect(page.getByText('demo', { exact: true })).toHaveCount(0)
    })
  })
})

test.describe('R14', () => {
  test.describe('without a session', () => {
    test.use({ user: null })

    test('the first load of the boards screen goes to the login screen', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    test('the first load of the board screen goes to the login screen', async ({ page }) => {
      await page.goto(`/boards/${await newBoard()}`)

      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('alert')).toHaveCount(0)
    })
  })

  test('a 401 answer to a change goes to the login screen', async ({ page, session }) => {
    const api = await apiAs('demo')
    const title = uniqueTitle()
    const id = await createBoard(api, title)
    await page.goto(`/boards/${id}`)
    await expect(page.getByText(title, { exact: true })).toBeVisible()
    await (await apiWith(session!)).post('/api/logout')

    await page.getByText(title, { exact: true }).click()
    await page.getByRole('textbox').fill(uniqueTitle())
    await page.getByRole('textbox').press('Enter')

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('Health screen', () => {
  test.use({ user: null })

  test('needs no session', async ({ page }) => {
    await page.goto('/health')

    await expect(page.getByText('API: ok')).toBeVisible()
  })
})
