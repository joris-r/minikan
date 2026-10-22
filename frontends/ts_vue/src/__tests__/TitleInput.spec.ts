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

  it('starts with the given title', () => {
    const wrapper = mount(TitleInput, { props: { title: 'Roadmap' } })

    expect(wrapper.find('input').element.value).toBe('Roadmap')
  })

  it('cancels on Escape, without recording on the following blur', async () => {
    const wrapper = mount(TitleInput, { props: { title: 'Roadmap' } })

    await wrapper.find('input').setValue('Doing')
    await wrapper.find('input').trigger('keydown', { key: 'Escape' })
    await wrapper.find('input').trigger('blur')

    expect(wrapper.emitted('cancel')).toEqual([[]])
    expect(wrapper.emitted('record')).toBeUndefined()
  })
})
