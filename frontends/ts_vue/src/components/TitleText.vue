<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <span>{{ title === '' ? '(Untitled)' : title }}</span>
</template>
