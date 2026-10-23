import { describe, it, expect, vi, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import ConfirmDialog from '../components/ConfirmDialog.vue'

// jsdom does not implement modal dialogs.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
})

describe('ConfirmDialog', () => {
  const props = { message: 'Delete this column?', action: 'Delete' }

  it('opens as a modal dialog showing the message', () => {
    const wrapper = mount(ConfirmDialog, { props })

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()
    expect(wrapper.find('p').text()).toBe('Delete this column?')
  })

  it('emits confirm from the action button and cancel from Cancel', async () => {
    const wrapper = mount(ConfirmDialog, { props })
    const buttons = wrapper.findAll('button')

    await buttons.find((b) => b.text() === 'Delete')!.trigger('click')
    await buttons.find((b) => b.text() === 'Cancel')!.trigger('click')

    expect(wrapper.emitted('confirm')).toEqual([[]])
    expect(wrapper.emitted('cancel')).toEqual([[]])
  })

  it('emits cancel on the native cancel event (Escape)', async () => {
    const wrapper = mount(ConfirmDialog, { props })

    await wrapper.find('dialog').trigger('cancel')

    expect(wrapper.emitted('cancel')).toEqual([[]])
  })
})
