# Three.js foundations

## Contents

1. [Version and import discipline](#version-and-import-discipline)
2. [Minimal runtime](#minimal-runtime)
3. [Scene graphs and transforms](#scene-graphs-and-transforms)
4. [Cameras and framing](#cameras-and-framing)
5. [Responsive rendering](#responsive-rendering)
6. [Render loops and time](#render-loops-and-time)
7. [Geometry](#geometry)
8. [Textures](#textures)
9. [Coordinate and math patterns](#coordinate-and-math-patterns)
10. [Common foundational failures](#common-foundational-failures)

## Version and import discipline

Inspect `package.json`, lockfile, and installed `three` version. Three.js releases can change
defaults, remove deprecated properties, and rename post-processing or node APIs.

Use:

```js
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
```

For the WebGPU route:

```js
import * as THREE from 'three/webgpu'
import { color, pass, time, uniform } from 'three/tsl'
```

Do not combine snippets from different revisions without checking migration notes.

## Minimal runtime

Create explicit ownership:

```js
const canvas = document.querySelector('[data-three-canvas]')
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
})

renderer.setAnimationLoop((timeMs) => {
  update(timeMs * 0.001)
  renderer.render(scene, camera)
})
```

Prefer passing a known canvas instead of appending an anonymous one when integrating with UI.

Choose alpha deliberately. Transparent canvases complicate composition and post-processing. Use an
opaque renderer/scene background when transparency is not required.

Use `powerPreference` as a hint, not a guarantee. Do not force high-performance mode for a small,
static embed.

## Scene graphs and transforms

Treat the graph as a hierarchy of coordinate spaces.

- Put an asset under a semantic root group.
- Put animation pivots above visible geometry.
- Put hit proxies, labels, effects, and colliders beside the geometry they follow.
- Avoid baking unrelated world transforms into child vertices.
- Name important objects and store domain metadata in `userData` sparingly.

Use:

```js
const product = new THREE.Group()
product.name = 'product-root'

const hinge = new THREE.Group()
hinge.name = 'lid-hinge'
product.add(hinge)
hinge.add(lidMesh)
```

Remember:

- `position`, `quaternion`, and `scale` are local to the parent;
- Euler `rotation` is a view onto the quaternion and is order-sensitive;
- `lookAt()` uses world-space intent and can surprise under transformed parents;
- call `updateMatrixWorld()` before reading world transforms immediately after manual changes;
- avoid non-uniform scale above skinned meshes, physics bodies, and certain normal calculations.

Use `attach()` when reparenting while preserving world transform. Use `traverse()` for inspection,
not as a per-frame general update system on large graphs.

## Cameras and framing

Perspective camera:

```js
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
```

Orthographic camera:

```js
const camera = new THREE.OrthographicCamera(left, right, top, bottom, near, far)
```

Fit a perspective camera to bounds:

1. Compute a `Box3` from the semantic root.
2. Read size and center.
3. Choose the limiting vertical/horizontal dimension.
4. Derive distance from FOV.
5. Add a composition margin.
6. Aim at the intended focal point, which may differ from the geometric center.
7. Set near/far around the actual view-space range.

Do not frame animated/skinned assets from a stale bind-pose box. Use authored framing metadata or
sample relevant poses.

For orthographic scenes, derive frustum extents from a design unit and aspect ratio. Recompose the
scene on narrow viewports rather than shrinking everything indefinitely.

Use camera layers for selective rendering, reflection capture exclusion, HUDs, and raycast policy.

## Responsive rendering

Size from the canvas display box:

```js
function resizeRenderer(renderer, camera, maxDpr = 2) {
  const canvas = renderer.domElement
  const width = Math.max(1, Math.floor(canvas.clientWidth))
  const height = Math.max(1, Math.floor(canvas.clientHeight))
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)

  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)

  camera.aspect = width / height
  camera.updateProjectionMatrix()
}
```

Avoid calling `setSize` every frame if the size did not change. A `ResizeObserver` on the canvas
container handles embedded layouts better than only listening to `window.resize`.

For responsive composition, maintain view presets:

```js
const views = {
  wide: { camera: [4, 2.2, 7], target: [0.4, 0.8, 0], heroScale: 1 },
  tall: { camera: [0, 2.8, 8.5], target: [0, 0.9, 0], heroScale: 0.86 },
}
```

Interpolate between presets only if the transition is visible. Otherwise apply deterministically.

Cap DPR. A DPR of 3 renders nine times as many pixels as DPR 1.

## Render loops and time

Use seconds and delta time:

```js
let previous = performance.now() * 0.001

renderer.setAnimationLoop((timeMs) => {
  const now = timeMs * 0.001
  const delta = Math.min(0.05, now - previous)
  previous = now
  update(delta, now)
  renderer.render(scene, camera)
})
```

Clamp long deltas after tab suspension. Use fixed steps for deterministic physics:

```js
accumulator += Math.min(delta, 0.1)
while (accumulator >= fixedStep) {
  simulate(fixedStep)
  accumulator -= fixedStep
}
```

Use on-demand rendering for static scenes. Invalidate when controls, assets, UI, or animations
change. Continuous idle motion requires a continuous loop unless it can be replaced by CSS/video.

Pause or reduce work when:

- the document is hidden;
- the canvas is outside the viewport;
- reduced motion is enabled;
- the experience is covered by a modal;
- the GPU context is lost.

## Geometry

Choose the least expensive representation that preserves the intended silhouette:

- built-in primitive for basic form;
- `ShapeGeometry`/`ExtrudeGeometry` for graphic profiles;
- `TubeGeometry` for curves and cables;
- custom `BufferGeometry` for controlled topology;
- merged static geometry for many unique immobile parts;
- `InstancedMesh` for repeated geometry/material;
- `BatchedMesh` when supported and appropriate for varied static meshes;
- glTF for authored complex forms;
- shader displacement for dense repeated deformation.

Custom attributes:

```js
geometry.setAttribute(
  'aIntensity',
  new THREE.Float32BufferAttribute(intensities, 1),
)
```

After modifying positions:

```js
positionAttribute.needsUpdate = true
geometry.computeVertexNormals()
geometry.computeBoundingBox()
geometry.computeBoundingSphere()
```

Do not recompute normals or bounds every frame unless geometry truly changes and the cost is
measured.

Use indexed geometry when vertices can be shared. Use non-indexed geometry when per-face attributes
or flat transformations require independent vertices.

Fix normals and winding before compensating with `DoubleSide`. Double-sided rendering adds cost and
can conceal bad topology.

## Textures

Understand roles:

- color/albedo and emissive: color data, usually sRGB;
- normal, roughness, metalness, AO, displacement, masks: non-color data;
- HDR/EXR environment: linear high-dynamic-range data;
- lightmap: baked lighting with project-specific encoding;
- LUT/noise/data texture: explicitly defined data.

Configure color textures:

```js
const colorMap = textureLoader.load('/textures/base-color.webp')
colorMap.colorSpace = THREE.SRGBColorSpace
```

Do not tag normal or roughness maps as sRGB.

Texture transform:

```js
texture.wrapS = texture.wrapT = THREE.RepeatWrapping
texture.repeat.set(2, 2)
texture.center.set(0.5, 0.5)
texture.rotation = Math.PI * 0.25
```

Set anisotropy only where oblique detail benefits:

```js
texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
```

Avoid huge images because the compressed transfer size hides GPU memory. A 4096² RGBA texture is
roughly 64 MiB before mipmaps; mipmaps add about one third more.

Prefer KTX2/Basis for large runtime texture sets when the pipeline and loader are configured.

Use `LoadingManager` for aggregate progress, but distinguish “bytes fetched” from “GPU-ready.” Some
assets do not expose reliable total byte counts.

## Coordinate and math patterns

Normalize pointer coordinates relative to the actual canvas:

```js
const rect = canvas.getBoundingClientRect()
pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
```

Use reusable scratch values:

```js
const scratchPosition = new THREE.Vector3()
const scratchQuaternion = new THREE.Quaternion()
const scratchMatrix = new THREE.Matrix4()
```

Use exponential damping for frame-rate-independent smoothing:

```js
const alpha = 1 - Math.exp(-speed * delta)
value = THREE.MathUtils.lerp(value, target, alpha)
```

For vectors:

```js
current.lerp(target, 1 - Math.exp(-speed * delta))
```

Use `MathUtils.damp` where the installed version supports the needed scalar behavior.

## Common foundational failures

- Black screen: camera inside geometry, zero canvas size, asset error, material/light mismatch,
  render loop absent, context failure.
- Stretched view: aspect changed without `updateProjectionMatrix()`.
- Jagged or slow mobile render: uncapped DPR or oversized post-processing target.
- Flicker: near/far ratio too large, coplanar surfaces, shadow bias, transparency sorting.
- Wrong pointer hits: coordinates normalized to window instead of canvas.
- Broken child orientation: mixed world/local math or transformed parent.
- Memory growth: missing disposal, repeated loader calls, orphaned render targets/listeners.
- Dark/washed output: incorrect texture color spaces or duplicated/missing output conversion.
- Random screenshot diffs: unseeded procedural data or wall-clock-dependent animation.
