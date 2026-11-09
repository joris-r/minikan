<script setup lang="ts">
import { useRoute } from 'vue-router'
import HeaderBar from './components/HeaderBar.vue'
import NoticeBanner from './components/NoticeBanner.vue'

const route = useRoute()
</script>

<template>
  <HeaderBar v-if="route.meta.header" />
  <NoticeBanner />
  <main>
    <RouterView />
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0;
}

main {
  padding: 1rem;
}
</style>
