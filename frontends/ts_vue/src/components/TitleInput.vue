<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ title?: string }>(), { title: '' })
const emit = defineEmits<{ record: [title: string]; cancel: [] }>()

const input = ref<HTMLInputElement>()
const title = ref(props.title)
let done = false

onMounted(() => input.value?.focus())

// Enter and Escape are followed by a blur, so the input ends only once.
function record() {
  if (done) return
  done = true
  emit('record', title.value)
}

function cancel() {
  if (done) return
  done = true
  emit('cancel')
}
</script>

<template>
  <input
    ref="input"
    v-model="title"
    type="text"
    maxlength="100"
    @keydown.enter="record"
    @keydown.escape="cancel"
    @blur="record"
  />
</template>
