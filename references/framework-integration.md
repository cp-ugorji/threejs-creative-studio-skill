# Framework-neutral Three.js integration

## Contents

1. [Core principle](#core-principle)
2. [Portable renderer contract](#portable-renderer-contract)
3. [Data flow across the boundary](#data-flow-across-the-boundary)
4. [Shared lifecycle checklist](#shared-lifecycle-checklist)
5. [Vanilla JavaScript and TypeScript](#vanilla-javascript-and-typescript)
6. [React with an imperative engine](#react-with-an-imperative-engine)
7. [React Three Fiber](#react-three-fiber)
8. [Next.js](#nextjs)
9. [Vue](#vue)
10. [Nuxt](#nuxt)
11. [Svelte](#svelte)
12. [SvelteKit](#sveltekit)
13. [Angular](#angular)
14. [Astro](#astro)
15. [Web Components and other hosts](#web-components-and-other-hosts)
16. [SSR and hydration rules](#ssr-and-hydration-rules)
17. [Routing and scene transitions](#routing-and-scene-transitions)
18. [Testing the adapter](#testing-the-adapter)
19. [Failure patterns](#failure-patterns)

## Core principle

Three.js owns a mutable real-time world. UI frameworks own documents, routes, forms, and semantic
application state. Connect the two through a narrow, explicit contract; do not mirror the whole
scene graph into reactive state.

Prefer two layers:

```text
host UI (routes, buttons, copy, forms, accessibility)
  -> semantic commands: setMode("careers"), focusItem("designer"), setPaused(true)
  <- low-frequency events: ready, selectionchange, qualitychange, error
renderer subsystem (scene, camera, GPU resources, frame loop, picking, disposal)
```

This structure makes the renderer portable across frameworks, prevents accidental rerenders at
frame rate, and makes teardown testable.

## Portable renderer contract

Use an interface close to this for an imperative integration:

```ts
export type ExperienceEvent =
  | { type: 'ready' }
  | { type: 'selectionchange'; id: string | null }
  | { type: 'qualitychange'; tier: 'low' | 'high' }
  | { type: 'error'; error: Error }

export interface ExperienceOptions {
  canvas: HTMLCanvasElement
  reducedMotion?: boolean
  initialMode?: string
  onEvent?: (event: ExperienceEvent) => void
}

export interface ExperienceController {
  start(): void
  setMode(mode: string): void
  setReducedMotion(reduced: boolean): void
  pause(): void
  resume(): void
  destroy(): void
}
```

Construct only after the canvas exists in the browser. Make `destroy()` idempotent. The controller
owns its renderer, observers, listeners, controls, frame loop, and resources unless a dependency is
explicitly injected as shared. Commands should describe intent rather than expose meshes.

If multiple canvases share loaders or decoded assets, give the shared cache a separate lifetime and
reference-count it. Never let one component dispose a resource another component still renders.

## Data flow across the boundary

Send low-frequency product state into Three.js:

- active route or experience mode;
- selected product or scene identifier;
- user preferences such as reduced motion and quality;
- committed configuration values;
- pause/resume signals from tabs, modals, or route visibility.

Keep high-frequency state inside the renderer:

- time, delta, velocities, animation mixers, particle state;
- pointer coordinates used for raycasting;
- camera interpolation and control damping;
- physics transforms;
- shader uniforms that change every frame.

Send semantic results back to the host. For example, publish `selectionchange` with an item ID, not
the intersected `THREE.Mesh`. Throttle nonessential progress updates. Update accessible HTML when a
meaningful state changes, not every render frame.

## Shared lifecycle checklist

Every adapter must:

1. create the renderer only after a real canvas is mounted;
2. observe the canvas container, not assume the window size;
3. cap DPR and update camera projection on resize;
4. start exactly one frame loop;
5. pause or reduce work when hidden;
6. propagate reduced-motion preference;
7. route semantic commands without rebuilding the scene unnecessarily;
8. remove observers, media-query listeners, events, controls, passes, and the frame loop;
9. dispose owned GPU resources and late async results;
10. survive development remounts and hot-module replacement without duplicate canvases or loops.

Use a visible HTML fallback or error state when WebGL/WebGPU initialization fails. Essential copy,
navigation, forms, and calls to action must remain outside the canvas.

## Vanilla JavaScript and TypeScript

Create the canvas in HTML, instantiate the controller after querying it, and destroy on `pagehide`.
Prefer an explicit application entry point over module-level renderer creation because module code
may execute during tests or server builds.

```ts
const canvas = document.querySelector<HTMLCanvasElement>('[data-three-canvas]')
if (!canvas) throw new Error('Canvas not found')

const experience = new Experience({ canvas, initialMode: 'home' })
experience.start()
addEventListener('pagehide', () => experience.destroy(), { once: true })
```

For navigation without a UI framework, listen to `popstate`, update semantic document content, and
call `setMode()`. Keep URL handling separate from the renderer.

## React with an imperative engine

Use a canvas ref and create the controller in an effect. In development Strict Mode, React may run
an extra setup/cleanup cycle, so cleanup must fully undo construction.

```tsx
function ThreeStage({ mode }: { mode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const experienceRef = useRef<Experience | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const experience = new Experience({ canvas: canvasRef.current, initialMode: mode })
    experienceRef.current = experience
    experience.start()
    return () => {
      experienceRef.current = null
      experience.destroy()
    }
  }, [])

  useEffect(() => experienceRef.current?.setMode(mode), [mode])
  return <canvas ref={canvasRef} aria-describedby="scene-description" />
}
```

Do not put mutable Three.js instances in React state. Use refs for controller identity. If UI must
subscribe to engine events, use a stable callback or an external store and unsubscribe in cleanup.

## React Three Fiber

Choose R3F when the scene benefits from declarative composition, React context, Suspense-based asset
loading, or a React-native component model. Keep frame mutation in `useFrame`, refs, springs, or
external stores; do not call React state setters every frame.

Keep semantic HTML outside `<Canvas>`. Use context or a narrow store for route/product state. Read
[react-three-fiber.md](react-three-fiber.md) for the detailed component, loader, event, performance,
physics, post-processing, and WebGPU route.

## Next.js

Browser renderer code belongs below a client boundary. Add `'use client'` to the smallest component
that owns the canvas and lifecycle; do not turn the whole route into a client component solely for
Three.js. Avoid browser globals at module scope because client component modules can still be
processed during a server build.

When a dependency cannot be evaluated server-side, use a dynamic import with server rendering
disabled for the stage component. Reserve stable layout space so hydration does not shift the page.
Keep route metadata, meaningful content, navigation, and fallback images server-rendered.

## Vue

Use a template ref, `onMounted`, and `onBeforeUnmount`. Three.js objects are highly mutable and do
not benefit from Vue proxies; keep the controller in a plain variable, `shallowRef`, or `markRaw`.

```vue
<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'
import { Experience } from './Experience'

const props = defineProps<{ mode: string }>()
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const experience = shallowRef<Experience>()

onMounted(() => {
  if (!canvas.value) return
  experience.value = new Experience({ canvas: canvas.value, initialMode: props.mode })
  experience.value.start()
})

watch(() => props.mode, (mode) => experience.value?.setMode(mode))
onBeforeUnmount(() => experience.value?.destroy())
</script>

<template><canvas ref="canvas" aria-describedby="scene-description" /></template>
```

Avoid deep watchers over Three.js objects. Watch small semantic props and translate them into engine
commands. Use `effectScope` or ordinary lifecycle cleanup for any extra subscriptions.

## Nuxt

Use the Vue adapter inside `<ClientOnly>` or a `.client.vue` component when the implementation or a
dependency touches browser APIs during import. Keep the public route content and fallback in the
server-rendered template. If the engine module is not SSR-safe, import it inside `onMounted` and
ignore its result if the component unmounts before the promise resolves.

Do not use `process.client` as a substitute for lifecycle ownership. It can gate evaluation, but the
component still needs complete cleanup and a stable placeholder.

## Svelte

Create the controller in `onMount`; return the teardown function from `onMount` or call it in
`onDestroy`. A Svelte action is useful when the same canvas behavior appears in multiple components.

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { Experience } from './Experience'
  let canvas: HTMLCanvasElement
  let experience: Experience | undefined
  export let mode = 'home'

  onMount(() => {
    experience = new Experience({ canvas, initialMode: mode })
    experience.start()
    return () => experience?.destroy()
  })

  $: experience?.setMode(mode)
</script>

<canvas bind:this={canvas} aria-describedby="scene-description"></canvas>
```

Keep the render loop outside Svelte reactivity. If using runes, use `$effect` only for semantic
commands and return cleanup from the effect that creates the engine.

## SvelteKit

Do not construct Three.js at module scope. Use `onMount` or check the official browser environment
flag before accessing `window`, `document`, media queries, or WebGL. Keep route data serializable;
never return a scene, texture, or controller from a `load` function.

Use a stable fallback image or styled stage during server rendering. On route changes, prefer
`setMode()` when the canvas persists; destroy only when the owning layout or page unmounts.

## Angular

Use `AfterViewInit` to construct from a `ViewChild` canvas and `OnDestroy` to tear down. Run the
animation loop outside Angular's zone so every frame does not trigger application change detection.
Re-enter the zone only to publish infrequent semantic events that change template state.

```ts
ngAfterViewInit() {
  this.zone.runOutsideAngular(() => {
    this.experience = new Experience({ canvas: this.canvas.nativeElement })
    this.experience.start()
  })
}

ngOnDestroy() {
  this.experience?.destroy()
}
```

Translate `@Input` changes in `ngOnChanges` or signal effects into controller commands. Do not store
the scene graph in signals and do not call `detectChanges()` from the frame loop.

## Astro

For a plain Three.js island, use a module script that finds a local canvas and destroys on Astro's
page lifecycle events. For a framework component, use an appropriate `client:*` directive; choose
`client:visible` for below-the-fold scenes and `client:load` only when 3D is immediately important.

View transitions can preserve or replace DOM. Ensure a replaced stage destroys its controller and a
persisted stage updates its mode. Keep useful copy, links, and fallback media in Astro-rendered HTML.

## Web Components and other hosts

Custom elements make a good universal adapter. Construct after `connectedCallback`, destroy in
`disconnectedCallback`, and guard against reconnects. Map observed attributes to semantic commands.
Do not attach global listeners without removing them.

For Solid, Preact, Lit, Qwik, or an unfamiliar host, identify its equivalents for mount, cleanup,
client-only execution, stable refs, and non-reactive mutable storage. Apply the same controller
contract rather than inventing framework-specific scene ownership.

## SSR and hydration rules

- Never assume `window`, `document`, `navigator`, `matchMedia`, `ResizeObserver`, or a GPU context is
  available during module evaluation.
- Put browser-only construction inside a mount/client lifecycle.
- When an import itself evaluates browser globals, dynamically import it after mount.
- Render deterministic server HTML. Do not make initial markup depend on GPU support or viewport
  values that only exist on the client.
- Reserve stage dimensions with CSS to avoid layout shift.
- Provide fallback content before hydration and retain it if initialization fails.
- Cancel or ignore asynchronous loader results after teardown.
- Test the production SSR build; a working client-side dev navigation is insufficient.

## Routing and scene transitions

Treat route state as a semantic mode. For one persistent canvas, load scene groups ahead of the
transition, crossfade or stage camera motion inside the renderer, then dispose mode-specific assets
when safe. For separate route canvases, destroy the leaving engine before creating another.

Update document title, headings, focus, and URL in the host layer. A camera transition does not
replace accessible route feedback. Respect reduced motion by shortening the transition or switching
immediately while preserving clear state change.

## Testing the adapter

At minimum, test:

- mount creates one canvas context and reports ready;
- prop/route changes issue commands without constructing a second engine;
- unmount stops the loop and removes ResizeObserver/listeners;
- remount after cleanup works in development mode;
- SSR build completes without browser-global errors;
- late asset results are ignored or disposed after unmount;
- reduced motion reaches the controller;
- WebGL initialization failure leaves meaningful HTML;
- desktop and mobile containers resize without distorted projection;
- essential navigation and actions work with keyboard and without WebGL.

Browser tests should fail on uncaught page errors and unexpected console errors. Inspect snapshots
at target viewports, because a lifecycle-correct integration can still have poor composition.

## Failure patterns

- Renderer created at module scope: breaks SSR, tests, HMR, and multi-instance pages.
- Scene graph stored in reactive state: creates proxy/serialization/rerender problems.
- Frame loop updates framework state: causes change detection or rendering at 60+ updates per second.
- Effect depends on every prop: destroys and rebuilds the GPU world on ordinary UI changes.
- Missing idempotent cleanup: leaks contexts, observers, events, and duplicate loops in development.
- Window-only resize logic: fails in grids, split panes, embeds, and resizable panels.
- Canvas-only navigation: removes semantics, focus behavior, SEO, and non-WebGL fallback.
- Route transition owns disposal ambiguously: shared textures vanish or old scenes leak.
- Dynamic import without cancellation: late construction runs after the host component unmounts.
- Client-only stage without reserved size: produces layout shift and misleading loading behavior.
