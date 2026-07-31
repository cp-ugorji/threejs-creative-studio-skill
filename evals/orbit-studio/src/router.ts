import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import CareersPage from './pages/CareersPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    world: 'home' | 'careers'
    display: string[]
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Orbit — Creative Systems',
        world: 'home',
        display: ['MAKE', 'WONDER'],
      },
    },
    {
      path: '/careers',
      name: 'careers',
      component: CareersPage,
      meta: {
        title: 'Careers — Orbit',
        world: 'careers',
        display: ['JOIN', 'ORBIT'],
      },
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
