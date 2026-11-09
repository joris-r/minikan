<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const name = ref('')
const password = ref('')
// The message shown when the login fails, if any.
const error = ref<string>()

async function submit() {
  let accepted: boolean
  try {
    accepted = await api.logIn(name.value, password.value)
  } catch {
    error.value = 'The login could not be sent; try again.'
    return
  }
  if (accepted) {
    await router.push('/')
    return
  }
  error.value = 'Invalid name or password.'
  password.value = ''
}
</script>

<template>
  <h1>Log in</h1>
  <form class="login" @submit.prevent="submit">
    <label>Name <input v-model="name" autocomplete="username" /></label>
    <label
      >Password <input v-model="password" type="password" autocomplete="current-password"
    /></label>
    <p v-if="error" role="alert">{{ error }}</p>
    <button type="submit">Log in</button>
  </form>
</template>

<style scoped>
.login {
  display: grid;
  gap: 0.5rem;
  max-width: 20rem;
}

.login label {
  display: grid;
  gap: 0.25rem;
}

.login button {
  justify-self: start;
}
</style>
