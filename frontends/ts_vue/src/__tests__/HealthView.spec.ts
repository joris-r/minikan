import { describe, it, expect, vi, afterEach } from 'vitest'

import { flushPromises, mount } from '@vue/test-utils'
import HealthView from '../views/HealthView.vue'

describe('HealthView', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('shows the status answered by the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"status": "ok"}')))

    const wrapper = mount(HealthView)
    await flushPromises()

    expect(wrapper.text()).toContain('API: ok')
  })

  it('shows an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })))

    const wrapper = mount(HealthView)
    await flushPromises()

    expect(wrapper.text()).toContain('API: error')
  })

  it('shows an unreachable backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')))

    const wrapper = mount(HealthView)
    await flushPromises()

    expect(wrapper.text()).toContain('API: unreachable')
  })
})
