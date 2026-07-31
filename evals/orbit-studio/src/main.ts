import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

router.afterEach((to) => {
  document.title = String(to.meta.title ?? 'Orbit — Creative Systems')
})

createApp(App).use(router).mount('#app')
