<script setup lang="ts">
import TitleText from './TitleText.vue'

defineProps<{ title: string }>()
</script>

<template>
  <button type="button" class="title"><TitleText :title="title" /></button>
</template>

<style scoped>
.title {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: text;
}
</style>
