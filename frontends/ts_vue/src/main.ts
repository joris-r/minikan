import { createApp } from 'vue'
import App from './App.vue'
import { onUnauthorized } from './api'
import { notice } from './changes'
import router from './router'

onUnauthorized(() => {
  notice.value = undefined
  void router.push('/login')
})

createApp(App).use(router).mount('#app')
