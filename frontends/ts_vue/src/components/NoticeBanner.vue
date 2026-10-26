<script setup lang="ts">
import { notice } from '../changes'

function close() {
  notice.value = undefined
}
</script>

<template>
  <div v-if="notice" role="alert" class="notice">
    <span>{{ notice }}</span>
    <button type="button" @click="close">Close</button>
  </div>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fdecea;
  border-bottom: 1px solid #f5c2c0;
}
</style>
