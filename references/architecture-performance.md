# Architecture, lifecycle, loading, and performance

## Contents

1. [Define ownership](#define-ownership)
2. [Structure a plain Three.js application](#structure-a-plain-threejs-application)
3. [Manage lifecycle and disposal](#manage-lifecycle-and-disposal)
4. [Build a loading pipeline](#build-a-loading-pipeline)
5. [Set performance budgets](#set-performance-budgets)
6. [Profile before optimizing](#profile-before-optimizing)
7. [Optimize CPU and draw submission](#optimize-cpu-and-draw-submission)
8. [Optimize GPU and pixels](#optimize-gpu-and-pixels)
9. [Adapt quality](#adapt-quality)
10. [Use workers and offscreen rendering](#use-workers-and-offscreen-rendering)

## Define ownership

Every resource needs an owner and destruction point:

| Resource | Typical owner |
| --- | --- |
| renderer/canvas context | application/experience |
| scene and camera | experience or route |
| geometry/material/texture | asset cache or scene feature |
| controls/listeners | camera/input system |
| animation mixer/timeline | animated entity |
| render target/pass | renderer/effect system |
| physics world/body | physics system/entity |
| debug UI | development tooling |

Shared assets must not be disposed by one consumer while another still uses them. Use reference
counting, an asset cache with a global teardown, or immutable application-lifetime assets.

Do not hide ownership in global singletons unless the app truly has one experience for its entire
lifetime.

## Structure a plain Three.js application

For a nontrivial application:

```text
src/
  app/
    Experience.ts
    Renderer.ts
    Camera.ts
    Sizes.ts
    Time.ts
    Input.ts
    Assets.ts
  world/
    World.ts
    Hero.ts
    Environment.ts
    Effects.ts
  ui/
  shaders/
  main.ts
```

Keep dependencies directed:

```text
main -> Experience
Experience -> core systems
World/features -> narrow system interfaces
Renderer -> scene/camera/effects
UI -> public commands/state, not private meshes
```

Avoid an event bus for ordinary direct relationships. Use typed events for cross-cutting lifecycle
signals only.

Do not put every object in a class automatically. Use:

- plain factory for a stable object graph;
- class for owned state + lifecycle;
- system for many homogeneous entities;
- data configuration for repeated declarative variants.

Expose:

```ts
interface Feature {
  update?(delta: number, elapsed: number): void
  resize?(viewport: Viewport): void
  setQuality?(quality: QualityTier): void
  destroy(): void
}
```

## Manage lifecycle and disposal

Dispose explicitly:

```js
geometry.dispose()
material.dispose()
texture.dispose()
renderTarget.dispose()
controls.dispose()
renderer.dispose()
```

Traverse with care:

```js
root.traverse((object) => {
  if (!object.isMesh) return
  object.geometry?.dispose()
  const materials = Array.isArray(object.material)
    ? object.material
    : [object.material]
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value?.isTexture) value.dispose()
    }
    material.dispose()
  }
})
```

This generic traversal can incorrectly dispose shared resources. Prefer ownership-aware disposal.

Also:

- remove DOM/window listeners;
- disconnect `ResizeObserver`/`IntersectionObserver`;
- cancel RAF/timelines/timeouts;
- stop mixers and audio;
- remove GUI panels;
- destroy physics bodies/world;
- release WebXR sessions;
- close workers;
- remove canvas only if this runtime created it.

Handle async teardown: an asset promise may resolve after route unmount. Abort fetches where
supported or ignore/release late results safely.

Inspect `renderer.info` before/after route changes. Stable cached internal resources may remain;
focus on unbounded growth across repeated cycles.

## Build a loading pipeline

Classify assets:

- critical: needed for the first meaningful frame;
- near-term: next interaction/section;
- optional: enhancement;
- deferred: only after intent.

Load critical assets in parallel where independent. Avoid a long serial chain.

States:

```text
boot -> loading -> ready
              \-> recoverable error -> retry
              \-> unsupported/fallback
```

Display progress honestly. `LoadingManager` item counts are not byte progress. If servers expose
content length, aggregate bytes; otherwise use staged or indeterminate progress.

Do not hold a black canvas without context. Show branded HTML, a status, and a fallback.

Compile/warm important materials after assets arrive when supported:

```js
await renderer.compileAsync(scene, camera)
```

Check the installed renderer/version and avoid blocking the main thread with unnecessary warmup.

Cache:

- loader results by canonical URL and options;
- decoder instances;
- geometries/materials that are reused;
- generated shader programs through stable material variants.

Avoid caching failed promises permanently if retry is expected.

## Set performance budgets

Set project-specific budgets; these are starting heuristics:

| Metric | Balanced mobile | Balanced desktop |
| --- | ---: | ---: |
| target frame rate | 30–60 FPS | 60 FPS |
| render DPR | 1–1.5 | 1–2 |
| steady draw calls | <100 | <200 |
| visible triangles | <300k | <1m |
| simultaneous shadowed lights | 0–1 | 0–2 |
| full-res post passes | 0–2 | 0–4 |
| hero color texture | 1–2K | 2–4K |

These are not universal pass/fail numbers. A simple static product scene should be much cheaper; a
showcase may justify more after measured fallback tiers.

Track:

- first meaningful frame;
- total transfer and decoded asset size;
- main-thread long tasks;
- frame time, not only FPS;
- CPU update time;
- GPU render time where tools allow;
- draw calls, triangles, points, lines;
- shader programs;
- textures and geometries;
- layout/paint from HTML overlays;
- memory growth after navigation.

## Profile before optimizing

Use:

- browser Performance panel;
- FPS/GPU meters;
- Three.js `renderer.info`;
- R3F `r3f-perf`;
- Spector.js/WebGL capture when available;
- WebGPU/browser GPU tooling where available;
- network throttling and CPU slowdown;
- real lower-power phones/laptops.

Profile representative interactions, not an idle frame only.

Classify bottleneck:

- CPU JavaScript/update;
- draw-call/driver submission;
- vertex processing;
- fragment fill/overdraw;
- texture bandwidth/memory;
- shader compilation;
- asset download/decode;
- React/layout/DOM overlay;
- physics.

Optimization without classification often moves cost or harms quality.

## Optimize CPU and draw submission

- Avoid allocations in frame loops.
- Avoid traversing the full scene every frame.
- Reuse geometry/material.
- Merge compatible static geometry.
- Instance repeated meshes.
- Use spatial partitioning or visibility groups in large worlds.
- Avoid adding/removing lights/material variants repeatedly.
- Keep objects stable; toggle visibility or pool when appropriate.
- Move expensive static calculations to build time.
- Update only dirty systems.
- Render on demand for static scenes.
- Use BVH for expensive raycasting.
- Batch DOM reads/writes.
- Avoid per-frame React state updates.
- Reduce physics bodies/colliders and enable sleeping.

Draw calls are influenced by geometry, material, shadow passes, transparency, and render passes.
One visible mesh may submit multiple draws.

## Optimize GPU and pixels

- Cap DPR and render-target resolution.
- Use LOD and distance culling.
- Simplify unseen topology.
- Compress textures to GPU-friendly formats.
- Reduce texture dimensions and channel count.
- Pack data maps when supported.
- Reduce transparent layers and overdraw.
- Tighten shadow maps and update frequency.
- Reduce full-screen passes.
- Use half/quarter-resolution effects.
- keep shader branches/noise/loops measured.
- move suitable calculations to vertex/compute.
- prefer fog/atmosphere methods that fit the budget.

Use `InstancedMesh` for repeated same geometry/material. Use per-instance color/matrix and custom
attributes. Mark instance buffers dirty only when changed.

Use LOD hysteresis or smooth transitions to avoid popping.

## Adapt quality

Create explicit tiers:

```ts
type QualityTier = 'low' | 'medium' | 'high'
```

Tier knobs:

- DPR;
- shadow enabled/map size/update rate;
- particle count;
- geometry segments/LOD;
- reflection update rate/resolution;
- post effects and resolution;
- environment resolution;
- animation frequency;
- physics substeps;
- background detail.

Start from device hints conservatively, then adapt from measured frame time. Do not permanently
punish one temporary loading spike.

Use gradual degradation:

1. lower DPR;
2. lower expensive effect resolution;
3. reduce reflection/shadow update rate;
4. reduce particles/secondary props;
5. disable secondary passes;
6. switch LOD/material;
7. replace continuous motion with on-demand.

Preserve the hero, interaction, and information hierarchy.

## Use workers and offscreen rendering

Use workers for:

- parsing/generating large data;
- physics supported off-main-thread;
- pathfinding;
- texture/image processing;
- procedural geometry generation;
- OffscreenCanvas rendering when browser support and architecture justify complexity.

OffscreenCanvas constraints:

- worker cannot access DOM;
- pointer, keyboard, sizing, and lifecycle events must be proxied;
- addon controls may expect HTMLElement/document behavior;
- fonts/images/assets need worker-compatible loading;
- fallback to main-thread rendering may be required;
- debugging and integration become more complex.

Do not move rendering to a worker merely because a scene is slow. First profile whether the main
thread or GPU is the bottleneck. Worker rendering does not reduce GPU cost.

Design a message protocol:

```text
init(canvas, size, dpr, config)
resize(size, dpr)
input(pointer/key/gesture)
command(domain action)
visibility(active)
destroy
```

Transfer large buffers instead of cloning when ownership can move.
