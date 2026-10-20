import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../App.vue'
import { routes } from '../router'

describe('App', () => {
  it('renders the title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]')))
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')

    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('minikan')
    vi.unstubAllGlobals()
  })
})
