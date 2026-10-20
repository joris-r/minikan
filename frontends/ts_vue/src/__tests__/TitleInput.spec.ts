import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import TitleInput from '../components/TitleInput.vue'

describe('TitleInput', () => {
  it('records the typed title on Enter', async () => {
    const wrapper = mount(TitleInput)

    await wrapper.find('input').setValue('Doing')
    await wrapper.find('input').trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('record')).toEqual([['Doing']])
  })

  it('records once when Enter is followed by blur', async () => {
    const wrapper = mount(TitleInput)

    await wrapper.find('input').trigger('keydown', { key: 'Enter' })
    await wrapper.find('input').trigger('blur')

    expect(wrapper.emitted('record')).toEqual([['']])
  })
})
