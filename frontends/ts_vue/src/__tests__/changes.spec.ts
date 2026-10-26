import { describe, it, expect, vi, beforeEach } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'

// The module keeps its state between calls, so each test imports a fresh one.
let changes: typeof import('../changes')

beforeEach(async () => {
  vi.resetModules()
  changes = await import('../changes')
})

function mountScreen(load: () => Promise<void>, failure = 'failed') {
  return mount(
    defineComponent({ setup: () => changes.useScreen(load, failure), render: () => null }),
  )
}

describe('send', () => {
  it('returns the answer and removes the banner', async () => {
    changes.notice.value = 'shown'

    expect(await changes.send(async () => 'answer')).toBe('answer')
    expect(changes.notice.value).toBeUndefined()
  })

  it('on failure, shows the banner and reloads the screen shown', async () => {
    const load = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    mountScreen(load)
    await flushPromises()

    expect(await changes.send(() => Promise.reject(new Error('500')))).toBeUndefined()
    expect(changes.notice.value).toContain('could not be saved')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shows nothing for a request cut off by leaving the page', async () => {
    window.dispatchEvent(new Event('pagehide'))

    await changes.send(() => Promise.reject(new TypeError('Failed to fetch')))

    expect(changes.notice.value).toBeUndefined()
  })
})

describe('useScreen', () => {
  it('loads once the pending changes are answered', async () => {
    let answer!: () => void
    const sent = changes.send(() => new Promise<void>((resolve) => (answer = resolve)))
    const load = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

    mountScreen(load)
    await flushPromises()
    expect(load).not.toHaveBeenCalled()

    answer()
    await sent
    await flushPromises()
    expect(load).toHaveBeenCalledOnce()
  })

  it('shows its message when loading fails', async () => {
    mountScreen(() => Promise.reject(new Error('500')), 'The board could not be loaded.')
    await flushPromises()

    expect(changes.notice.value).toBe('The board could not be loaded.')
  })

  it('is no longer reloaded once unmounted', async () => {
    const load = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    mountScreen(load).unmount()
    await flushPromises()

    await changes.send(() => Promise.reject(new Error('500')))

    expect(load).toHaveBeenCalledOnce()
  })
})
