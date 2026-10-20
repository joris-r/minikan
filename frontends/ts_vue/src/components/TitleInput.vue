<script setup lang="ts">
import { onMounted, ref } from 'vue'

const emit = defineEmits<{ record: [title: string] }>()

const input = ref<HTMLInputElement>()
const title = ref('')
let recorded = false

onMounted(() => input.value?.focus())

// Enter blurs the input, so recording is guarded to happen once.
function record() {
  if (recorded) return
  recorded = true
  emit('record', title.value)
}
</script>

<template>
  <input
    ref="input"
    v-model="title"
    type="text"
    maxlength="100"
    @keydown.enter="record"
    @blur="record"
  />
</template>
