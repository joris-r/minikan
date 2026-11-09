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

  // /accounts/ui/login-screen/form
  test('shows "Log in", then the name and password fields, then the button', async ({ page }) => {
    await page.goto('/login')

    const parts = [
      page.getByRole('heading', { name: 'Log in', exact: true }),
      page.getByLabel('Name', { exact: true }),
      page.getByLabel('Password', { exact: true }),
      page.getByRole('button', { name: 'Log in', exact: true }),
    ]
    const tops: number[] = []
    for (const part of parts) {
      await expect(part).toBeVisible()
      tops.push((await part.boundingBox())!.y)
    }
    expect(tops).toEqual([...tops].sort((a, b) => a - b))
  })

  // /accounts/ui/login-screen/form, /accounts/ui/login-screen/log-in, /accounts/ui/login-screen/accepted
  test('"Log in" with a valid name and password goes to the boards screen', async ({ page }) => {
    await logIn(page, 'demo', 'demo-password')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('demo', { exact: true })).toBeVisible()
  })

  // /accounts/ui/login-screen/accepted, /boards/ui/header-bar/user
  test('the session is of the user who logged in', async ({ page }) => {
    await logIn(page, 'other', 'other-password')

    await expect(page).toHaveURL('/')
    await expect(page.getByText('other', { exact: true })).toBeVisible()
  })

  for (const [name, password] of [
    ['demo', 'wrong-password'],
    ['nobody', 'demo-password'],
  ]) {
    // /accounts/ui/login-screen/rejected, /accounts/ui/login-screen/message
    test(`with name "${name}" and password "${password}", shows an alert and empties the password`, async ({
      page,
    }) => {
      await logIn(page, name, password)

      await expect(page.getByRole('alert')).toHaveText('Invalid name or password.')
      await expect(page.getByLabel('Password', { exact: true })).toHaveValue('')
      await expect(page).toHaveURL('/login')
    })
  }

  // /accounts/ui/login-screen/failed, /accounts/ui/login-screen/message
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
    // /boards/ui/header-bar/home, /boards/ui/header-bar/user, /boards/ui/boards-screen/header, /boards/ui/board-screen/header
    test(`on the ${screen}, shows "Minikan", the user and "Log out"`, async ({ page }) => {
      await page.goto(await path())

      await expect(page.getByRole('link', { name: 'Minikan', exact: true })).toBeVisible()
      await expect(page.getByText('demo', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Log out', exact: true })).toBeVisible()
    })
  }

  // /boards/ui/header-bar/home, /boards/ui/header-bar/user, /boards/ui/board-screen/header
  test('shows "Minikan", the user, then "Log out", left to right, above the board', async ({
    page,
  }) => {
    const title = uniqueTitle()
    await page.goto(`/boards/${await createBoard(await apiAs('demo'), title)}`)
    const board = page.getByRole('article', { name: title, exact: true })
    await expect(board).toBeVisible()

    const lefts: number[] = []
    let bottom = 0
    for (const part of [
      page.getByRole('link', { name: 'Minikan', exact: true }),
      page.getByText('demo', { exact: true }),
      page.getByRole('button', { name: 'Log out', exact: true }),
    ]) {
      const box = (await part.boundingBox())!
      lefts.push(box.x)
      bottom = Math.max(bottom, box.y + box.height)
    }
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b))
    expect(bottom).toBeLessThanOrEqual((await board.boundingBox())!.y)
  })

  // /boards/ui/header-bar/home
  test('"Minikan" goes to the boards screen', async ({ page }) => {
    await page.goto(`/boards/${await newBoard()}`)

    await page.getByRole('link', { name: 'Minikan', exact: true }).click()

    await expect(page).toHaveURL('/')
  })

  // /boards/ui/header-bar/log-out, /boards/ui/header-bar/ended
  test('"Log out" ends the session and goes to the login screen', async ({ page, session }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Log out', exact: true }).click()

    await expect(page).toHaveURL('/login')
    expect((await (await apiWith(session!)).get('/api/session')).status()).toBe(401)
  })

  // /boards/ui/header-bar/failed, /boards/ui/banner/message
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

    // /boards/ui/header-bar/user
    test('shows the name of that user', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByText('other', { exact: true })).toBeVisible()
      await expect(page.getByText('demo', { exact: true })).toHaveCount(0)
    })
  })
})

test.describe('A 401 answer', () => {
  test.describe('without a session', () => {
    test.use({ user: null })

    // /boards/ui/changes/unauthenticated
    test('the first load of the boards screen goes to the login screen', async ({ page }) => {
      await page.goto('/')

      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('alert')).toHaveCount(0)
    })

    // /boards/ui/changes/unauthenticated
    test('the first load of the board screen goes to the login screen', async ({ page }) => {
      await page.goto(`/boards/${await newBoard()}`)

      await expect(page).toHaveURL('/login')
      await expect(page.getByRole('alert')).toHaveCount(0)
    })
  })

  // /boards/ui/changes/unauthenticated
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

  // /boards/ui/changes/unauthenticated
  test('a 401 answer to a change on the boards screen goes to the login screen', async ({
    page,
    session,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Add board' })).toBeVisible()
    await (await apiWith(session!)).post('/api/logout')

    await page.getByRole('button', { name: 'Add board' }).click()

    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

test.describe('Health screen', () => {
  test.use({ user: null })

  // /ui/health-screen/status
  test('needs no session', async ({ page }) => {
    await page.goto('/health')

    await expect(page.getByText('API: ok')).toBeVisible()
  })
})
