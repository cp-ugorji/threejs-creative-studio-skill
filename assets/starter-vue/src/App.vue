<script setup lang="ts">
import { ref } from 'vue'
import ThreeStage from './ThreeStage.vue'

const views = ['left', 'front', 'right'] as const
const activeView = ref<(typeof views)[number]>('front')
</script>

<template>
  <main class="shell">
    <section class="copy">
      <p class="eyebrow">Vue + Three.js study</p>
      <h1>Give one object a world worth exploring.</h1>
      <p>Drag to orbit. Use the controls for keyboard-accessible views.</p>
      <div class="actions" aria-label="3D viewer controls">
        <button
          v-for="view in views"
          :key="view"
          type="button"
          :aria-pressed="activeView === view"
          @click="activeView = view"
        >
          {{ view }} view
        </button>
      </div>
    </section>
    <ThreeStage :view="activeView" />
  </main>
</template>
