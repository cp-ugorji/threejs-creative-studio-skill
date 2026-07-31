# Motion, interaction, audio, and physics

## Contents

1. [Animate with time](#animate-with-time)
2. [Use clips and mixers](#use-clips-and-mixers)
3. [Build procedural motion](#build-procedural-motion)
4. [Coordinate scroll](#coordinate-scroll)
5. [Raycast and pick](#raycast-and-pick)
6. [Design controls](#design-controls)
7. [Handle touch and keyboard](#handle-touch-and-keyboard)
8. [Add physics](#add-physics)
9. [Add spatial audio](#add-spatial-audio)
10. [Diagnose interaction problems](#diagnose-interaction-problems)

## Animate with time

Drive continuous motion with delta time:

```js
rotation += angularVelocity * delta
position.addScaledVector(velocity, delta)
```

Drive periodic motion with elapsed time:

```js
mesh.position.y = baseY + Math.sin(elapsed * frequency + phase) * amplitude
```

Use frame-rate-independent smoothing:

```js
const alpha = 1 - Math.exp(-responsiveness * delta)
mesh.position.lerp(targetPosition, alpha)
mesh.quaternion.slerp(targetQuaternion, alpha)
```

Clamp delta after long frames. Never multiply motion by an assumed 60 FPS.

Keep an animation state model:

```text
idle -> hover/focus -> active -> settle -> idle
                \-> disabled/error
```

Transitions make competing tweens cancel or hand off cleanly. Do not let hover-out overwrite an
active click transition.

Use GSAP or another timeline library for authored UI/camera sequences. Use the render loop for
continuous simulation. Keep one owner for each property.

## Use clips and mixers

For glTF animation:

```js
const mixer = new THREE.AnimationMixer(gltf.scene)
const action = mixer.clipAction(gltf.animations[0])
action.play()

function update(delta) {
  mixer.update(delta)
}
```

Crossfade:

```js
next.reset().play()
current.crossFadeTo(next, 0.35, true)
```

Manage:

- clip names and semantic state mapping;
- loop mode and repetitions;
- clamp-when-finished;
- time scale;
- additive clips;
- root motion policy;
- mixer update ownership;
- cleanup with `stopAllAction`, `uncacheClip`, and `uncacheRoot` as appropriate.

Avoid starting actions every frame. Cache action instances.

## Build procedural motion

Use layered motion:

```text
base transform
+ authored clip
+ low-frequency idle
+ input response
+ transition offset
+ camera shake/recoil (temporary)
```

Do not write multiple systems directly to the same transform. Use nested groups or compose values.

For deterministic particles:

- seed initial positions, sizes, phases, and velocities;
- update on GPU for large counts;
- avoid uploading entire position buffers each frame;
- encode lifetime and respawn state;
- cap delta to prevent particles jumping after suspension.

For a spring:

```js
velocity += (target - value) * stiffness * delta
velocity *= Math.exp(-damping * delta)
value += velocity * delta
```

Use a tested spring library for complex coupled motion or gesture continuity.

## Coordinate scroll

Prefer scroll as a normalized narrative signal, not direct world position:

```js
const progress = clamp(scrollY / scrollRange, 0, 1)
```

Map progress to named sections and transitions. Separate:

- document layout;
- scroll progress;
- camera path;
- object state;
- HTML activation;
- URL/history state when needed.

Use damped progress for visual motion while preserving exact semantic section state.

Avoid:

- blocking native scroll;
- tying motion to raw wheel delta;
- creating a new tween on every scroll event;
- rendering essential text only inside WebGL;
- forgetting mobile browser viewport changes.

With reduced motion, switch to discrete section states or much smaller transitions.

## Raycast and pick

Create once:

```js
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
```

On pointer change or frame:

```js
raycaster.setFromCamera(pointer, camera)
const intersections = raycaster.intersectObjects(interactiveRoots, true)
```

Filter:

- hidden/disabled objects;
- transparent decoration;
- layers;
- hit proxies;
- nearest meaningful semantic owner;
- backfaces when relevant.

Map a child hit to a semantic root:

```js
function findInteractiveOwner(object) {
  for (let node = object; node; node = node.parent) {
    if (node.userData.interactiveId) return node
  }
  return null
}
```

Maintain enter/leave state. Restore prior material state without allocating or losing shared values.

For high-poly meshes, consider:

- simplified invisible hit geometry;
- `three-mesh-bvh`;
- bounding-box/sphere tests;
- coarse-to-fine raycasting;
- R3F `meshBounds`.

Raycast only when pointer/camera/targets change in static scenes.

## Design controls

Choose controls by task:

- OrbitControls: inspect an object or diorama.
- MapControls: plan/map navigation.
- PointerLockControls: first-person exploration.
- DragControls/TransformControls: editing/manipulation.
- custom constrained controller: branded narrative/product view.
- keyboard/gamepad state: games and installations.

Configure OrbitControls:

```js
controls.enableDamping = true
controls.enablePan = false
controls.minDistance = 3
controls.maxDistance = 8
controls.minPolarAngle = Math.PI * 0.2
controls.maxPolarAngle = Math.PI * 0.48
```

Call `controls.update()` while damping or auto-rotation is active. Listen to `change` for on-demand
rendering.

Avoid control conflicts:

- disable orbit while TransformControls drag;
- separate DOM event regions;
- call `stopPropagation` only when lower layers must not receive an event;
- define priority between UI gestures and scene gestures;
- restore focus and cursor when pointer lock/fullscreen exits.

## Handle touch and keyboard

Use Pointer Events for unified mouse, pen, and touch where possible.

Touch guidance:

- keep hit regions large;
- avoid hover-only behavior;
- prevent page scroll only on the specific gesture surface and only when needed;
- use `touch-action` deliberately;
- allow a one-finger primary gesture and reserve two-finger gestures sparingly;
- provide visible reset/recenter;
- test browser chrome and orientation changes.

Keyboard:

- use HTML controls for essential actions;
- map Enter/Space to activation;
- map Escape to close, exit pointer lock, or back out;
- use arrow/WASD only when the mode is clear;
- ignore repeat where a single action is intended;
- avoid intercepting shortcuts while a text field is focused;
- expose instructions and remapping for game-like experiences.

Gamepad:

- poll only when connected and the experience needs it;
- add dead zones;
- label buttons by action rather than controller brand;
- keep keyboard/touch alternatives.

## Add physics

Use physics only when collision, mass, constraints, or emergent motion contributes to the product.
Do not add a physics engine for a single decorative bounce.

Prefer Rapier for a modern WASM-based 3D physics route. In R3F, use `@react-three/rapier`.

Separate render and physics representations:

```text
semantic object root
├── visual model (detailed)
├── collider set (simple)
└── effects/audio anchors
```

Choose collider:

- cuboid/ball/capsule: fastest and stable;
- convex hull: irregular dynamic object;
- trimesh: complex static environment; avoid for dynamic bodies;
- compound primitives: often best balance;
- heightfield: terrain.

Keep center of mass near the body origin. Avoid changing dynamic-body transforms directly; apply
impulses/forces or use kinematic APIs.

Use fixed timestep. Clamp accumulated time and limit substeps.

Tune:

- gravity;
- mass/density;
- restitution;
- friction;
- linear/angular damping;
- continuous collision detection for fast bodies;
- sleep;
- collision groups;
- solver groups;
- sensors;
- joints.

Collision groups must match bidirectionally in Rapier. Use sensors for triggers, goals, proximity,
and zones that should not exert forces.

Do not trigger expensive React state updates for every contact frame. Convert physics events to
meaningful state changes.

For a controllable character/ball:

- read input into a stable state object;
- apply movement during the physics step;
- test grounded state using contact/raycast;
- limit air control;
- smooth camera separately;
- reset out-of-bounds safely;
- keep game phase in an explicit store/state machine.

## Add spatial audio

Add audio only when it improves feedback, place, rhythm, or accessibility.

Rules:

- require user gesture before creating/resuming audio context;
- start muted or respect saved preference;
- provide a visible mute control;
- compress/stream appropriately;
- do not autoplay surprise audio;
- pause or lower audio when hidden;
- include captions/text equivalents for essential information.

Use `AudioListener` on the active camera. Use `PositionalAudio` for sources whose spatial location
matters. Tune reference distance, rolloff, max distance, and directional cone.

Keep loops seamless and low in the mix. Trigger short feedback sounds with concurrency limits.

## Diagnose interaction problems

Wrong raycast location:

- normalize to canvas bounds;
- update camera/world matrices;
- use the active camera;
- check CSS transforms and event source.

Hover flicker:

- map child hits to one semantic owner;
- stabilize transparent/overlapping surfaces;
- handle pointer capture and occlusion;
- avoid rebuilding interactive arrays.

Click fires through foreground:

- sort/filter intersections;
- stop propagation in R3F when intentional;
- use event layers or raycaster layers;
- add an explicit blocker/hit proxy.

Movement differs by frame rate:

- use delta/fixed steps;
- clamp long frames;
- remove frame-count constants.

Physics jitters:

- use fixed timestep/interpolation;
- simplify colliders;
- avoid direct transform writes;
- adjust solver/substeps;
- remove extreme mass ratios and tiny penetrations.

Mobile page will not scroll:

- narrow the gesture capture region;
- correct `touch-action`;
- do not `preventDefault` globally;
- provide a mode toggle or visible handle.

Animation leaks after unmount:

- cancel timelines;
- stop render loop ownership;
- remove listeners;
- uncache mixers;
- dispose controls and physics world;
- guard async asset completion.
