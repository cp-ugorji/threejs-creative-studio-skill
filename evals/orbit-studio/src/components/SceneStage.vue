<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue'
import { OrbitExperience, type SceneHover, type WorldMode } from '../three/OrbitExperience'

const props = defineProps<{ mode: WorldMode; pulseSignal: number }>()
const emit = defineEmits<{ hoverChange: [label: string | null] }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const experience = shallowRef<OrbitExperience>()
const state = ref<'loading' | 'ready' | 'error'>('loading')

onMounted(() => {
  if (!canvas.value) return
  try {
    const instance = new OrbitExperience(canvas.value, props.mode, (hover: SceneHover | null) => {
      emit('hoverChange', hover?.label ?? null)
    })
    experience.value = instance
    state.value = 'ready'
    document.body.dataset.experienceState = 'ready'
  } catch (error) {
    console.error('Orbit scene failed to start', error)
    state.value = 'error'
    document.body.dataset.experienceState = 'error'
  }
})

watch(() => props.mode, (mode) => experience.value?.setMode(mode))
watch(() => props.pulseSignal, () => experience.value?.pulse())

onBeforeUnmount(() => {
  experience.value?.destroy()
  experience.value = undefined
  emit('hoverChange', null)
  delete document.body.dataset.experienceState
})
</script>

<template>
  <div class="scene-stage" :data-state="state">
    <canvas ref="canvas" aria-hidden="true" />
    <div v-if="state === 'loading'" class="scene-fallback" role="status">Assembling the studio…</div>
    <div v-else-if="state === 'error'" class="scene-fallback" role="status">
      The interactive world is resting. All pages and roles are still available.
    </div>
  </div>
</template>
