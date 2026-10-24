import { describe, it, expect, vi, beforeEach } from 'vitest'

import { mount } from '@vue/test-utils'
import MoveDialog from '../components/MoveDialog.vue'

// jsdom does not implement modal dialogs.
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn<() => void>()
})

describe('MoveDialog', () => {
  const props = {
    columns: [
      { id: 'a', title: 'To do' },
      { id: 'b', title: '' },
    ],
    current: 'a',
  }

  it('opens as a modal dialog with a row per column, the current one marked', () => {
    const wrapper = mount(MoveDialog, { props })

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledOnce()
    expect(wrapper.findAll('button').map((b) => b.attributes('aria-label') ?? b.text())).toEqual([
      'Move to top of To do',
      'Move to bottom of To do',
      'Move to top of (Untitled)',
      'Move to bottom of (Untitled)',
      'Cancel',
    ])
    expect(wrapper.text()).toContain('To do (current)')
    expect(wrapper.text()).not.toContain('(Untitled) (current)')
  })

  it('emits move with the column and the end', async () => {
    const wrapper = mount(MoveDialog, { props })

    await wrapper.find('[aria-label="Move to bottom of (Untitled)"]').trigger('click')

    expect(wrapper.emitted('move')).toEqual([['b', 'bottom']])
  })

  it('emits cancel from Cancel and on the native cancel event (Escape)', async () => {
    const wrapper = mount(MoveDialog, { props })

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Cancel')!
      .trigger('click')
    await wrapper.find('dialog').trigger('cancel')

    expect(wrapper.emitted('cancel')).toEqual([[], []])
  })
})
