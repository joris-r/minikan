<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, Unauthorized } from '../api'
import { notice } from '../changes'

const router = useRouter()
// The name of the logged-in user, once known.
const name = ref<string>()

onMounted(async () => {
  try {
    name.value = (await api.getSession()).name
  } catch {
    // A 401 goes to the login screen; another failure only leaves the name out.
  }
})

async function logOut() {
  try {
    await api.logOut()
  } catch (error) {
    if (error instanceof Unauthorized) return
    notice.value = 'The logout failed; the session is still open.'
    return
  }
  await router.push('/login')
}
</script>

<template>
  <header class="header-bar">
    <RouterLink to="/" class="home">Minikan</RouterLink>
    <span class="user">{{ name }}</span>
    <button type="button" @click="logOut">Log out</button>
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #ddd;
}

.home {
  margin-right: auto;
}
</style>
