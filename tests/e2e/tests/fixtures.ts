import { test as base, expect, type ConsoleMessage, type Page } from '@playwright/test'

// The URLs of the requests a test made fail, per page: the browser reports each failed response
// in the console.
const failed = new WeakMap<Page, Set<string>>()

function isReportOfFailure(page: Page, message: ConsoleMessage): boolean {
  return (
    message.text().startsWith('Failed to load resource:') &&
    (failed.get(page)?.has(message.location().url) ?? false)
  )
}

// Every test fails when its page logs an error or a warning, or throws an uncaught error.
export const test = base.extend<{ quietConsole: void }>({
  quietConsole: [
    async ({ page }, use) => {
      const logged: string[] = []
      page.on('console', (message) => {
        if (!['error', 'warning'].includes(message.type())) return
        if (isReportOfFailure(page, message)) return
        logged.push(`${message.type()}: ${message.text()}`)
      })
      page.on('pageerror', (error) => logged.push(`uncaught: ${error.message}`))
      await use()
      expect(logged, 'errors and warnings in the browser console').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

// Answers the page's `method` requests to a URL matching `url` with a server error.
export async function fail(page: Page, method: string, url: string | RegExp): Promise<void> {
  if (!failed.has(page)) failed.set(page, new Set())
  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback()
    failed.get(page)!.add(route.request().url())
    await route.fulfill({ status: 500, json: { error: 'simulated failure' } })
  })
}

export type Held = {
  // Resolved once the page has sent the request, which is held.
  sent: Promise<void>
  // Lets the held request, and those after it, reach the API.
  release: () => void
}

// Holds the page's next `method` request to a URL matching `url`, so that the test sees the screen
// before the API answers.
export async function hold(page: Page, method: string, url: string | RegExp): Promise<Held> {
  let sent!: () => void
  let release!: () => void
  const held: Held = {
    sent: new Promise((resolve) => (sent = resolve)),
    release: () => release(),
  }
  const released = new Promise<void>((resolve) => (release = resolve))
  await page.route(url, async (route) => {
    if (route.request().method() !== method) return route.fallback()
    sent()
    await released
    await route.fallback()
  })
  return held
}
