# React Three Fiber and the PMNDRS ecosystem

## Contents

1. [Choose R3F deliberately](#choose-r3f-deliberately)
2. [Create the Canvas boundary](#create-the-canvas-boundary)
3. [Build declarative scene components](#build-declarative-scene-components)
4. [Use hooks safely](#use-hooks-safely)
5. [Load and reuse assets](#load-and-reuse-assets)
6. [Handle events and controls](#handle-events-and-controls)
7. [Use Drei](#use-drei)
8. [Use post-processing](#use-post-processing)
9. [Use physics and state](#use-physics-and-state)
10. [Optimize and clean up](#optimize-and-clean-up)
11. [Debug and test](#debug-and-test)

## Choose R3F deliberately

R3F is a React renderer for Three.js. It is not a different 3D engine.

Choose it when:

- the product is already React;
- scene objects benefit from component composition;
- UI and scene share state/transitions;
- Suspense-based asset loading helps;
- Drei and PMNDRS ecosystem components reduce custom code.

Do not add React only to draw one independent canvas in a non-React site. Plain Three.js may be
smaller and easier to own.

Inspect compatibility among React, `@react-three/fiber`, Three.js, Drei, react-postprocessing, and
Rapier. Major R3F releases track React and renderer changes. Do not install “latest everything”
without checking peer dependencies.

As of the researched baseline, R3F v9 is stable and v10 introduces a changed renderer abstraction
and first-class WebGPU/TSL APIs. Treat alpha APIs as experimental and read their migration guide.

## Create the Canvas boundary

```tsx
import { Canvas } from '@react-three/fiber'

export function ExperienceCanvas() {
  return (
    <Canvas
      camera={{ fov: 45, near: 0.1, far: 100, position: [4, 2, 7] }}
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      fallback={<WebGLFallback />}
    >
      <Experience />
    </Canvas>
  )
}
```

Canvas handles renderer, resize, scene, camera, pointer events, and render loop. Configure only what
the product needs.

Place semantic HTML outside Canvas. Overlay it in the same positioned container.

Use `frameloop="demand"` for mostly static experiences. Call `invalidate()` after imperative
changes not known to R3F.

Use `eventSource` when the canvas and HTML overlay must share a parent event surface.

Do not call R3F hooks outside Canvas context.

## Build declarative scene components

JSX maps to Three.js constructors and properties:

```tsx
function Product() {
  return (
    <group name="product" position={[0, 0.8, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.6, 1, 0.4]} />
        <meshStandardMaterial color="#e9ecf1" roughness={0.32} />
      </mesh>
    </group>
  )
}
```

Use components around semantic features, not each trivial mesh. A `Screw` component may be useful
when instanced/configurable; a component wrapping one static unnamed triangle is noise.

Keep arrays/objects stable when identity matters:

```tsx
const position = useMemo(() => [0, 1, 0] as const, [])
```

R3F applies prop changes; it does not require memoizing every literal. Optimize only measured
reconciliation or constructor churn.

Use `primitive` for existing Object3D instances:

```tsx
<primitive object={scene} />
```

Treat externally created objects as owned resources. R3F cannot always dispose primitives
automatically in the way you intend.

Use `dispose={null}` only when shared cached resources must survive subtree unmount, and ensure
another owner eventually disposes them.

## Use hooks safely

`useThree` selects runtime state:

```tsx
const invalidate = useThree((state) => state.invalidate)
const viewport = useThree((state) => state.viewport)
```

Select only needed state to reduce reactions.

`useFrame` runs before each rendered frame:

```tsx
useFrame((state, delta) => {
  group.current.rotation.y += delta * 0.15
})
```

Rules:

- mutate refs in `useFrame`;
- do not call React `setState` every frame;
- do not allocate vectors/materials each frame;
- use frame priority only when taking over ordering/rendering deliberately;
- clamp/smooth delta-sensitive behavior;
- keep expensive logic outside the frame loop.

Use effects for imperative integrations:

```tsx
useEffect(() => {
  const controls = new SomeController(...)
  return () => controls.dispose()
}, [])
```

React StrictMode can mount/effect/cleanup more than once in development. Effects must be idempotent
and fully clean up.

## Load and reuse assets

Use Suspense:

```tsx
<Suspense fallback={<Loader />}>
  <Model />
</Suspense>
```

Use Drei `useGLTF`:

```tsx
const { nodes, materials, animations } = useGLTF('/models/hero.glb')
useGLTF.preload('/models/hero.glb')
```

Preload critical or predictably next assets, not the entire site.

Generate typed components with gltfjsx when it improves stable access:

```bash
npx gltfjsx public/models/hero.glb --transform
```

Review generated output, asset licensing, and transform/compression choices.

Cached loader results are shared. Avoid:

- mutating shared materials globally from one instance;
- adding the same cached scene object to multiple parents;
- disposing shared resources on one component unmount.

Clone or instantiate intentionally.

Use `useAnimations` for clip actions and clean transitions. Avoid playing actions during render.

Use `useProgress` for loading UI, but keep fallback HTML meaningful and accessible.

## Handle events and controls

R3F pointer events include Three.js intersection data:

```tsx
<mesh
  onPointerOver={(event) => {
    event.stopPropagation()
    setHovered(true)
  }}
  onPointerOut={() => setHovered(false)}
  onClick={activate}
/>
```

Events are intersection-aware and propagate through intersections/ancestors. Use
`stopPropagation()` only when occluded/lower-priority objects should not receive the event.

Use pointer capture for dragging. Release it reliably.

Use `onPointerMissed` for deselection. Use a shared event source for HTML/canvas overlap.

For performance:

- attach handlers only to interactive roots;
- use simplified hit meshes;
- use `meshBounds` for bounding-box raycasts;
- use BVH for complex meshes;
- disable event layers when not active.

Drei controls:

```tsx
<OrbitControls
  makeDefault
  enablePan={false}
  minPolarAngle={Math.PI * 0.2}
  maxPolarAngle={Math.PI * 0.48}
/>
```

`makeDefault` coordinates controls with other Drei components. Disable controls while a
TransformControls/PivotControls drag is active when needed.

## Use Drei

Use helpers when they reduce maintained code and match the product:

- `Environment`, `Lightformer`, `Sky`, `Stars`;
- `ContactShadows`, `AccumulativeShadows`, `RandomizedLight`;
- `Stage`, `Bounds`, `Center`;
- `Text`, `Text3D`, `Html`;
- `Float`, `PresentationControls`, `CameraControls`;
- `useGLTF`, `useTexture`, `useAnimations`, `useProgress`;
- `MeshReflectorMaterial`, `MeshTransmissionMaterial`;
- `shaderMaterial`;
- `AdaptiveDpr`, `AdaptiveEvents`, `PerformanceMonitor`;
- `Instances`, `Merged`, `Bvh`, `meshBounds`.

Do not stack helpers without understanding their cost. `Stage` is a fast staging default, not a
finished art direction. Environment presets may be fetched remotely in some setups; prefer local
licensed HDR files for production reliability.

`Html` is useful for labels and embedded content. Control occlusion and pointer behavior, and keep
essential UI in normal document flow when possible.

SDF `Text` is often preferable to geometry text for dynamic labels. Preload fonts and declare glyph
sets where supported.

## Use post-processing

Use `@react-three/postprocessing` for an R3F-friendly effect chain:

```tsx
<EffectComposer multisampling={0}>
  <Bloom luminanceThreshold={1} intensity={0.7} mipmapBlur />
  <Vignette eskil={false} offset={0.2} darkness={0.45} />
</EffectComposer>
```

Check package/Three.js compatibility.

Combine compatible effects in one composer. Measure:

- multisampling;
- effect resolution;
- depth requirements;
- blend functions;
- transparent background behavior;
- mobile fallback.

Create a custom effect from a stable Effect subclass and forward a ref/props. Keep uniforms stable.
Update time in the effect update hook or `useFrame`, not React state.

WebGPU/R3F v10 has a different first-class path. Follow current v10/WebGPU hook documentation rather
than applying react-postprocessing blindly.

## Use physics and state

R3F Rapier:

```tsx
<Suspense fallback={null}>
  <Physics gravity={[0, -9.81, 0]} colliders={false}>
    <RigidBody colliders="ball" restitution={0.4}>
      <Player />
    </RigidBody>
    <CuboidCollider args={[5, 0.25, 5]} position={[0, -0.25, 0]} />
  </Physics>
</Suspense>
```

Prefer simple colliders. Use `InstancedRigidBodies` for large repeated dynamic sets.

Use refs to apply impulses/forces. Do not drive dynamic bodies by setting JSX position each frame.
Use kinematic APIs for animated obstacles.

Use collision/sensor events to emit meaningful domain events. Configure interaction groups
bidirectionally.

Use a small external store such as Zustand for game phase or cross-tree commands:

```text
ready -> playing -> ended -> ready
```

Keep transient high-frequency vectors in refs/store getters, not subscribed React component state.

## Optimize and clean up

R3F performance rules:

- reuse geometry/material with module constants, `useMemo`, Drei instances, or glTF cache;
- mutate through refs in `useFrame`;
- avoid mounting/unmounting expensive objects repeatedly;
- use `visible` or staged transitions when appropriate;
- use `frameloop="demand"` for static content;
- call `invalidate()` before starting external animations;
- use `startTransition` for expensive UI/scene state changes where appropriate;
- instance repeated objects;
- adapt DPR/effects with measured performance;
- avoid per-frame selectors or React state.

Cleanup:

- R3F disposes declarative resources it owns on unmount;
- shared/primitives/custom resources need explicit policy;
- effects, controls, listeners, subscriptions, workers, audio, and physics hooks still need cleanup;
- async loader caches live beyond component lifetime by design.

## Debug and test

Use:

- React DevTools;
- Leva for development-only controls;
- `r3f-perf`;
- renderer info and browser performance tools;
- Drei helpers/collider debug;
- production build profiling.

Test logic outside Canvas as plain functions/state machines.

Use `@react-three/test-renderer` when object graph/unit behavior needs testing. It does not prove
visual quality or browser/GPU behavior.

Browser tests should:

- load Canvas and wait for ready state;
- fail on console/page errors;
- capture target viewports;
- interact through visible HTML or canvas coordinates;
- assert semantic UI state;
- compare screenshots with controlled seeds/time;
- test WebGL fallback when feasible.

Do not use a single snapshot of the React tree as evidence that the rendered scene is correct.
