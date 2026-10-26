<script setup lang="ts">
import NoticeBanner from './components/NoticeBanner.vue'
</script>

<template>
  <header>
    <RouterLink to="/">minikan</RouterLink>
  </header>
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

header {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}

main {
  padding: 1rem;
}
</style>
