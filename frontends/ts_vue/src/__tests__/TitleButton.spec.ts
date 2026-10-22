import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import TitleButton from '../components/TitleButton.vue'

describe('TitleButton', () => {
  it('is a button showing the title', () => {
    const wrapper = mount(TitleButton, { props: { title: '' } })

    expect(wrapper.find('button').text()).toBe('(Untitled)')
  })
})
