<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <button type="button" class="add" :aria-label="label" :title="label">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" />
    </svg>
  </button>
</template>

<style scoped>
.add {
  display: inline-flex;
  padding: 0.25rem;
  cursor: pointer;
}
</style>
