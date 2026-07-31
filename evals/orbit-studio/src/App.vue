<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import SceneStage from './components/SceneStage.vue'

const route = useRoute()
const menuOpen = ref(false)
const menuClose = ref<HTMLButtonElement>()
const cursor = ref<HTMLDivElement>()
const pulseSignal = ref(0)
const sceneHover = ref<string | null>(null)
const world = computed(() => route.meta.world)
const display = computed(() => route.meta.display ?? ['MAKE', 'WONDER'])

watch(menuOpen, async (open) => {
  if (!open) return
  await nextTick()
  menuClose.value?.focus()
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

function pulseScene() {
  pulseSignal.value += 1
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

function onPointerMove(event: PointerEvent) {
  if (!cursor.value || event.pointerType === 'touch') return
  cursor.value.classList.add('is-visible')
  cursor.value.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`
}

function onPointerOut(event: PointerEvent) {
  if (event.relatedTarget) return
  cursor.value?.classList.remove('is-visible')
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  window.addEventListener('pointerout', onPointerOut)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerout', onPointerOut)
})
</script>

<template>
  <div class="site-shell" :class="`world-${world}`">
    <a class="skip-link" href="#page-content">Skip to content</a>

    <SceneStage
      :mode="world"
      :pulse-signal="pulseSignal"
      @hover-change="sceneHover = $event"
    />

    <div
      ref="cursor"
      class="scene-cursor"
      :class="{ 'is-active': sceneHover }"
      aria-hidden="true"
    >
      <span>{{ sceneHover }}</span>
    </div>

    <div class="display-type" aria-hidden="true">
      <span>{{ display[0] }}</span>
      <span>{{ display[1] }}</span>
    </div>

    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="Orbit home">
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <circle cx="22" cy="22" r="10" />
          <ellipse cx="22" cy="22" rx="19" ry="7" transform="rotate(-24 22 22)" />
        </svg>
        <span>ORBIT</span>
        <small>Creative systems</small>
      </RouterLink>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/careers">Careers</RouterLink>
      </nav>

      <button
        class="menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="site-menu"
        @click="menuOpen = true"
      >
        <span>Menu</span>
        <i aria-hidden="true"></i>
      </button>
    </header>

    <main id="page-content" class="page-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.name" @pulse="pulseScene" />
        </Transition>
      </RouterView>
    </main>

    <div class="route-index" aria-label="Pages">
      <span class="route-count">0{{ route.name === 'home' ? 1 : 2 }} / 02</span>
      <RouterLink to="/" aria-label="Open home" title="Home"><span>Home</span></RouterLink>
      <RouterLink to="/careers" aria-label="Open careers" title="Careers"><span>Careers</span></RouterLink>
    </div>

    <p class="scene-note" aria-hidden="true">
      {{ world === 'home' ? 'A studio in gentle orbit' : 'A launchpad for good work' }}
    </p>

    <Transition name="menu-fade">
      <div
        v-if="menuOpen"
        id="site-menu"
        class="menu-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
        @keydown="onMenuKeydown"
      >
        <div class="menu-topline">
          <p id="menu-title">Explore Orbit</p>
          <button ref="menuClose" type="button" class="menu-close" @click="menuOpen = false">
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
        <nav aria-label="Menu navigation">
          <RouterLink to="/"><span>01</span> Home</RouterLink>
          <RouterLink to="/careers"><span>02</span> Careers</RouterLink>
        </nav>
        <p class="menu-contact">New ideas, thoughtful products, kind people.</p>
      </div>
    </Transition>
  </div>
</template>
