<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Item } from '../api'
import TitleText from './TitleText.vue'

defineProps<{ columns: Item[]; current: string }>()
const emit = defineEmits<{ move: [columnId: string, end: 'top' | 'bottom']; cancel: [] }>()

const dialog = ref<HTMLDialogElement>()

onMounted(() => dialog.value?.showModal())

function name(column: Item): string {
  return column.title === '' ? '(Untitled)' : column.title
}
</script>

<template>
  <!-- Escape triggers the native cancel event. -->
  <dialog ref="dialog" class="move" aria-labelledby="move-title" @cancel.prevent="emit('cancel')">
    <h2 id="move-title">Move card</h2>
    <div class="rows">
      <template v-for="column in columns" :key="column.id">
        <span>
          <TitleText :title="column.title" />
          <template v-if="column.id === current"> (current)</template>
        </span>
        <button
          type="button"
          :aria-label="`Move to top of ${name(column)}`"
          @click="emit('move', column.id, 'top')"
        >
          Top
        </button>
        <button
          type="button"
          :aria-label="`Move to bottom of ${name(column)}`"
          @click="emit('move', column.id, 'bottom')"
        >
          Bottom
        </button>
      </template>
    </div>
    <div class="buttons">
      <button type="button" @click="emit('cancel')">Cancel</button>
    </div>
  </dialog>
</template>

<style scoped>
.move {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.move h2 {
  font-size: 1rem;
  margin: 0 0 0.75rem;
}

/* One row per column, the buttons aligned whatever the length of the titles. */
.rows {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.5rem 0.5rem;
  margin-bottom: 0.75rem;
}

.buttons {
  display: flex;
  justify-content: flex-end;
}
</style>
