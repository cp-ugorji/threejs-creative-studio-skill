<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { Experience } from './Experience'

const props = defineProps<{ view: string }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const experience = shallowRef<Experience>()

onMounted(() => {
  if (!canvas.value) return
  const instance = new Experience(canvas.value)
  instance.setView(props.view)
  experience.value = instance
})

watch(
  () => props.view,
  (view) => experience.value?.setView(view),
)

onBeforeUnmount(() => {
  experience.value?.destroy()
  experience.value = undefined
})
</script>

<template>
  <section class="stage">
    <canvas
      ref="canvas"
      aria-label="Interactive abstract sculptural object"
      aria-describedby="viewer-description"
    />
    <p id="viewer-description" class="sr-only">
      A violet crystalline sculpture floats above a soft circular platform in a mint-lit world.
    </p>
  </section>
</template>
