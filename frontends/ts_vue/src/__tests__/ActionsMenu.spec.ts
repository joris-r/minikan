import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import ActionsMenu from '../components/ActionsMenu.vue'

describe('ActionsMenu', () => {
  it('shows its menu only once the button is clicked', async () => {
    const wrapper = mount(ActionsMenu)
    expect(wrapper.find('[role=menu]').exists()).toBe(false)

    await wrapper.find('button').trigger('click')

    expect(wrapper.find('button').attributes('aria-expanded')).toBe('true')
    expect(wrapper.findAll('[role=menuitem]').map((item) => item.text())).toEqual(['Delete'])
  })

  it('emits delete and closes when Delete is chosen', async () => {
    const wrapper = mount(ActionsMenu)
    await wrapper.find('button').trigger('click')

    await wrapper.find('[role=menuitem]').trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[]])
    expect(wrapper.find('[role=menu]').exists()).toBe(false)
  })

  it('shows its moves before Delete and emits the chosen one', async () => {
    const wrapper = mount(ActionsMenu, { props: { moves: ['Move up', 'Move to column'] } })
    await wrapper.find('button').trigger('click')
    const items = wrapper.findAll('[role=menuitem]')
    expect(items.map((item) => item.text())).toEqual(['Move up', 'Move to column', 'Delete'])

    await items[1]!.trigger('click')

    expect(wrapper.emitted('move')).toEqual([['Move to column']])
    expect(wrapper.emitted('delete')).toBeUndefined()
    expect(wrapper.find('[role=menu]').exists()).toBe(false)
  })

  it('closes on Escape', async () => {
    const wrapper = mount(ActionsMenu)
    await wrapper.find('button').trigger('click')

    await wrapper.find('[role=menuitem]').trigger('keydown', { key: 'Escape' })

    expect(wrapper.find('[role=menu]').exists()).toBe(false)
  })

  it('closes on a press outside it', async () => {
    const wrapper = mount(ActionsMenu, { attachTo: document.body })
    await wrapper.find('button').trigger('click')

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[role=menu]').exists()).toBe(false)
    wrapper.unmount()
  })
})
