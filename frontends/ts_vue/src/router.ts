import { createRouter, createWebHistory } from 'vue-router'
import BoardsView from './views/BoardsView.vue'
import BoardView from './views/BoardView.vue'
import HealthView from './views/HealthView.vue'

export const routes = [
  { path: '/', component: BoardsView },
  { path: '/boards/:id', component: BoardView, props: true },
  { path: '/health', component: HealthView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
