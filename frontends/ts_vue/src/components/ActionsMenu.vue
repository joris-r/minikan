<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const emit = defineEmits<{ delete: [] }>()

const open = ref(false)
const root = ref<HTMLElement>()
const toggle = ref<HTMLButtonElement>()

function close() {
  open.value = false
}

// A press outside the menu closes it.
function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}

watch(open, (isOpen) => {
  if (isOpen) document.addEventListener('pointerdown', onPointerDown)
  else document.removeEventListener('pointerdown', onPointerDown)
})

onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))

function onEscape() {
  close()
  toggle.value?.focus()
}

function choose() {
  close()
  emit('delete')
}
</script>

<template>
  <div ref="root" class="actions" @keydown.escape="onEscape">
    <button
      ref="toggle"
      type="button"
      class="toggle"
      aria-label="Actions"
      title="Actions"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <circle cx="3" cy="8" r="1.5" fill="currentColor" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" />
        <circle cx="13" cy="8" r="1.5" fill="currentColor" />
      </svg>
    </button>
    <div v-if="open" role="menu" class="menu">
      <button type="button" role="menuitem" @click="choose">Delete</button>
    </div>
  </div>
</template>

<style scoped>
.actions {
  position: relative;
  display: inline-block;
}

.toggle {
  display: inline-flex;
  padding: 0.25rem;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}

.menu {
  position: absolute;
  right: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-width: 8rem;
  padding: 0.25rem 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
}

.menu button {
  padding: 0.25rem 0.75rem;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.menu button:hover,
.menu button:focus {
  background: #f2f2f2;
}
</style>
