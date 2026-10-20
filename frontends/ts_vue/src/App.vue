<script setup lang="ts">
import { onMounted, ref } from 'vue'

const apiStatus = ref('unknown')

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    apiStatus.value = response.ok ? (await response.json()).status : 'error'
  } catch {
    apiStatus.value = 'unreachable'
  }
})
</script>

<template>
  <h1>minikan</h1>
  <p>API: {{ apiStatus }}</p>
</template>
