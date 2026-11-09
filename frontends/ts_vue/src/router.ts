import { createRouter, createWebHistory } from 'vue-router'
import BoardsView from './views/BoardsView.vue'
import BoardView from './views/BoardView.vue'
import HealthView from './views/HealthView.vue'
import LoginView from './views/LoginView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    // Whether the screen shows the header bar.
    header?: boolean
  }
}

export const routes = [
  { path: '/', component: BoardsView, meta: { header: true } },
  { path: '/boards/:id', component: BoardView, props: true, meta: { header: true } },
  { path: '/login', component: LoginView },
  { path: '/health', component: HealthView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
