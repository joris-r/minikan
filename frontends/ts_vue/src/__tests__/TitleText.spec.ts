import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import TitleText from '../components/TitleText.vue'

describe('TitleText', () => {
  it('shows the title', () => {
    expect(mount(TitleText, { props: { title: 'Roadmap' } }).text()).toBe('Roadmap')
  })

  it('shows an empty title as (Untitled)', () => {
    expect(mount(TitleText, { props: { title: '' } }).text()).toBe('(Untitled)')
  })
})
