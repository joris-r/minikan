<script setup lang="ts">
import { onMounted, ref } from 'vue'

defineProps<{ message: string; action: string }>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const dialog = ref<HTMLDialogElement>()

onMounted(() => dialog.value?.showModal())
</script>

<template>
  <!-- Escape triggers the native cancel event. -->
  <dialog ref="dialog" class="confirm" @cancel.prevent="emit('cancel')">
    <p>{{ message }}</p>
    <div class="buttons">
      <button type="button" @click="emit('cancel')">Cancel</button>
      <button type="button" @click="emit('confirm')">{{ action }}</button>
    </div>
  </dialog>
</template>

<style scoped>
.confirm {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
