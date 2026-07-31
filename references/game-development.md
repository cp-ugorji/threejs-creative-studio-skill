# Three.js game development

## Contents

1. [Define the playable promise](#define-the-playable-promise)
2. [Build a vertical slice](#build-a-vertical-slice)
3. [Separate authored data from runtime state](#separate-authored-data-from-runtime-state)
4. [Run a deterministic simulation](#run-a-deterministic-simulation)
5. [Map input to intent](#map-input-to-intent)
6. [Build the player and collision model](#build-the-player-and-collision-model)
7. [Compose a game camera](#compose-a-game-camera)
8. [Model combat as explicit state](#model-combat-as-explicit-state)
9. [Build enemies as systems](#build-enemies-as-systems)
10. [Author levels as layered data](#author-levels-as-layered-data)
11. [Design readable VFX and audio](#design-readable-vfx-and-audio)
12. [Support mobile and gamepad](#support-mobile-and-gamepad)
13. [Budget a representative encounter](#budget-a-representative-encounter)
14. [Save, reset, and migrate state](#save-reset-and-migrate-state)
15. [Test deterministic play](#test-deterministic-play)
16. [Ship reproducible builds](#ship-reproducible-builds)

Use this reference for playable Three.js experiences: action games, exploration, platforming,
isometric worlds, puzzles, simulations, and game-like product experiences. Combine it with
`motion-interaction-physics.md` for implementation details and `architecture-performance.md` for
ownership and profiling.

## Define the playable promise

Before choosing a camera or physics engine, write one sentence describing the repeated player
decision:

```text
The player reads ___, chooses ___, receives ___ feedback, and risks ___ while pursuing ___.
```

Then define:

- one core verb and one support verb;
- the smallest win, loss, and reset conditions;
- intended session length and input devices;
- camera relationship to play, not merely its visual style;
- readability rules for threats, goals, interactables, and safe space;
- a deterministic fixture that proves the loop works without a human improvising.

Do not start with a large inventory of systems. A convincing loop with clear feedback is a stronger
foundation than disconnected movement, combat, loot, dialogue, and crafting prototypes.

## Build a vertical slice

Implement one complete encounter before building content breadth:

```text
boot -> instruction -> player intent -> simulation consequence -> feedback -> win/loss -> reset
```

The first slice should include:

- production-shaped input and camera contracts;
- one representative level space;
- one enemy, hazard, puzzle, or interactive target;
- temporary but semantic visual/audio feedback;
- UI for current objective and game state;
- pause, restart, reduced-motion, and disposal paths;
- a repeatable test fixture and representative performance capture.

Use placeholders with stable identifiers. A box named `gate_north` is replaceable; an anonymous
mesh referenced by child index is technical debt.

## Separate authored data from runtime state

Keep content definitions serializable and runtime state owned by systems:

```ts
interface EnemyDefinition {
  id: string
  modelUrl: string
  maxHealth: number
  moveSpeed: number
  aggroRadius: number
  attack: { startup: number; active: number; recovery: number; damage: number }
  presentation: { scale: number; accent: string; fallbackShape: 'capsule' | 'box' }
}

interface EnemyRuntime {
  definitionId: string
  state: 'idle' | 'chase' | 'attack' | 'hurt' | 'defeated'
  health: number
  stateTime: number
  position: THREE.Vector3
  velocity: THREE.Vector3
}
```

Definitions describe what designers author. Runtime state describes what the simulation mutates.
Presentation observes runtime state and may be replaced without changing the rules.

Give every entity a stable ID. Prefer references by ID over object pointers in save data, level
files, analytics, and deterministic fixtures. Validate authored data at load time with a schema.

## Run a deterministic simulation

Use a fixed simulation step and interpolate presentation when rules depend on time, collision, or
network/replay consistency:

```ts
const fixedStep = 1 / 60
let accumulator = 0

function frame(realDelta: number) {
  accumulator += Math.min(realDelta, 0.1)
  while (accumulator >= fixedStep) {
    simulation.step(fixedStep, input.sample())
    accumulator -= fixedStep
  }
  presentation.render(accumulator / fixedStep)
}
```

Rules:

- read input into an intent snapshot once per simulation step;
- keep rendering frequency independent from rule frequency;
- seed random generation and expose the seed in debug/test routes;
- cap accumulated time after tab suspension;
- never use wall-clock dates inside gameplay rules;
- keep cosmetic particles and camera damping outside authoritative state;
- define an explicit pause policy for simulation, animation, UI, and audio.

For simple noncompetitive scenes, delta-time movement may be sufficient. Still centralize time so
pause, visibility changes, and tests do not depend on scattered clocks.

## Map input to intent

Input devices produce actions; the simulation consumes intent:

```ts
interface PlayerIntent {
  moveX: number
  moveY: number
  aimX: number
  aimY: number
  primaryPressed: boolean
  primaryHeld: boolean
  dodgePressed: boolean
  pausePressed: boolean
}
```

Create adapters for keyboard/mouse, touch, and gamepad. Normalize and clamp vectors so diagonal
movement is not faster. Track pressed edges separately from held state. Ignore gameplay shortcuts
while an input, textarea, select, or editable element owns focus.

Make bindings discoverable and remappable when play is more than incidental. Use action names such
as “primary” and “dodge,” not controller-specific names, in systems and UI.

## Build the player and collision model

Choose the simplest collision route matching the game:

- analytic circles/AABBs for flat arenas and puzzles;
- ray/sweep tests for custom character controllers;
- Rapier or another maintained physics engine for dynamic rigid bodies and complex worlds;
- navigation meshes or grids for constrained traversal;
- animation root motion only when gameplay displacement remains authoritative and testable.

Keep render meshes separate from colliders. Capsule, box, sphere, and convex colliders are more
stable and cheaper than triangle meshes. Define collision groups for player, world, enemy, attack,
trigger, and decoration.

Resolve movement in a consistent order: sample intent, compute desired velocity, integrate, query
collision, correct position, update grounded/contact state, then publish semantic events. Avoid
mutating transforms from both physics and animation.

## Compose a game camera

Treat the camera as layered output:

```text
authored base rig
+ smoothed follow target
+ look/aim offset
+ constraint and occlusion correction
+ temporary recoil/shake
+ accessibility reduction
```

Smooth camera position and look target separately. A single `camera.lookAt(player.position)` often
produces nervous framing and hides anticipation space.

Define:

- base projection and framing at every supported aspect ratio;
- follow dead zone and response time;
- look-ahead based on intent or velocity;
- world bounds and vertical/polar limits;
- obstacle occlusion response: shorten arm, slide, fade blocker, or cut;
- lock-on acquisition, cycling, break distance, and line-of-sight policy;
- shake sources with amplitude, frequency, duration, spatial falloff, and priority;
- recenter/reset behavior for keyboard, pointer, touch, and gamepad;
- reduced-motion behavior that removes shake and shortens large sweeps.

Apply short-lived effects as offsets after the base rig. Never let shake permanently alter the
follow state. Clamp the combined result after all layers.

## Model combat as explicit state

Represent actions with phases:

```text
ready -> startup -> active -> recovery -> ready
                   \-> interrupted
```

An attack definition should state damage, reach/shape, startup, active duration, recovery,
movement policy, cancel windows, hit-stop, VFX/audio cues, and contact policy. Create attack contact
IDs so one swing cannot damage the same target every fixed step unless explicitly intended.

Make collision outcomes authoritative:

1. detect overlap/sweep;
2. validate teams, invulnerability, and prior contacts;
3. apply damage/impulse/state change once;
4. emit a semantic event such as `hitConfirmed`;
5. let presentation trigger flash, particles, audio, UI, and camera response.

Telegraph hazards before active damage. Preserve silhouettes and timing under color-vision
differences, muted audio, low graphics quality, and reduced motion.

## Build enemies as systems

Separate four concerns:

- definition: authored stats and presentation references;
- runtime: health, state, timers, target, and cooldowns;
- decision: state transitions and navigation intent;
- presentation: model, animation, shadows, VFX attachment points, and fallback geometry.

Use explicit state transitions with entry/exit behavior. Avoid one `updateEnemy()` function whose
branches simultaneously choose actions, move meshes, deal damage, spawn particles, and update UI.

For crowds, update expensive perception/navigation at staggered frequencies, pool presentation,
instance compatible visuals, and keep a hard spawn cap. Validate an enemy with missing model,
missing animation, blocked path, and player leaving its leash area.

## Author levels as layered data

Keep level responsibilities separable:

```text
render geometry
collision geometry
navigation/traversal data
spawn points and encounter zones
triggers and objectives
camera volumes
lights and VFX emitters
landmarks and accessibility cues
```

Name nodes semantically in Blender/glTF or external level data. Do not derive collisions or logic
from arbitrary mesh order. Associate practical lights and particle emitters with their motivating
source. Give players at least one readable landmark per traversal choice.

Validate levels for unreachable objectives, spawn overlap, missing exits, camera clipping, unlit
critical paths, absent reset points, and mobile controls covering essential action.

## Design readable VFX and audio

Every effect needs a semantic trigger, readable meaning, bounded lifetime, spawn cap, cleanup, and
lower-cost alternative:

```ts
interface EffectCue {
  id: string
  trigger: 'attackStart' | 'hitConfirmed' | 'defeated' | 'objective'
  duration: number
  maxInstances: number
  priority: 'critical' | 'feedback' | 'ambient'
  reducedMotion: 'omit' | 'static' | 'shorten'
}
```

Pool short-lived meshes, sprites, lights, and audio sources. Reset every pooled property on reuse.
Do not use full-screen flashes, continuous shake, bloom, or chromatic effects as a substitute for
clear animation and silhouettes.

Layer feedback by time: anticipation, contact, response, and settle. Critical cues must survive
muted audio and low-effect quality. Audio should unlock after user gesture, expose volume controls,
pause deliberately, and release nodes on teardown.

## Support mobile and gamepad

Mobile play is a layout/input mode, not a smaller desktop canvas:

- account for safe-area insets and dynamic browser chrome;
- keep primary controls inside comfortable thumb regions;
- reserve screen center for play readability;
- avoid requiring hover, right-click, or precise drag;
- decide portrait, landscape, or responsive composition and explain orientation expectations;
- support interruption, backgrounding, audio focus loss, and accidental edge gestures;
- lower DPR, shadows, effects, and encounter density from measured budgets;
- offer visible pause, restart, and recenter controls.

Virtual sticks need a dead zone, maximum radius, release reset, pointer capture, and a fixed or
floating origin policy. Gamepads need dead zones, disconnect recovery, and action-based labels.
Keyboard/touch fallbacks remain required for web reach.

## Budget a representative encounter

Profile the busiest credible slice, not an empty arena. Record:

- device, browser, viewport, DPR, renderer, and quality tier;
- enemy/entity count, active effects, dynamic lights, shadows, physics bodies, and UI overlays;
- CPU update time, GPU/render time where available, frame-time percentiles, draw calls, triangles,
  texture memory indicators, and long tasks;
- load/decode/compile spikes and memory after repeated resets.

Diagnose before changing quality. If CPU-bound, reduce rule frequency, allocations, traversal,
physics work, or draw submission. If GPU-bound, reduce pixels, overdraw, shadows, post-processing,
shader cost, or texture bandwidth.

Adaptive quality should change named tiers at stable boundaries. Avoid oscillation. Preserve input
latency, goal/threat readability, and gameplay rules before ambient decoration.

## Save, reset, and migrate state

Version serialized data:

```ts
interface SaveEnvelope {
  version: number
  levelId: string
  checkpointId: string
  player: { health: number; inventoryIds: string[] }
  flags: Record<string, boolean>
}
```

Do not serialize Three.js objects, physics handles, DOM nodes, or transient effect state. Validate
and migrate on load. Write atomically where the platform allows. Treat local storage as fallible:
quota, private mode, manual corruption, and older schema versions are normal cases.

Reset must cancel delayed actions, clear contacts, return pooled objects, reset input, restore the
camera, and produce the same deterministic starting fixture.

## Test deterministic play

Build test hooks around semantic state, not pixel coordinates alone. Useful routes or query flags:

```text
?seed=42&fixture=first-encounter&quality=low&debug=state
```

Test matrix:

- boot, unsupported renderer, asset failure, retry, and first meaningful frame;
- keyboard, pointer, touch, and gamepad intent adapters;
- fixed-step outcomes at different render frame rates;
- win, loss, pause, resume, reset, and route teardown;
- each combat phase and duplicate-contact prevention;
- enemy fallback presentation and unreachable-player recovery;
- portrait/landscape, safe areas, DPR tiers, and reduced motion;
- representative encounter budgets and repeated-reset memory;
- focus loss, visibility change, controller disconnect, and audio mute.

Capture both state proof and visual proof. A screenshot proves composition; a deterministic state
trace proves rules; a recorded playthrough proves temporal clarity. Keep test fixtures independent
of production analytics and debug menus.

## Ship reproducible builds

Record the exact commit, dependency lockfile, production command, deployed URL, environment, and
rollback artifact. Test the deployed build, not only localhost:

- deep links and base paths;
- MIME types, compression, cache headers, and asset URLs;
- cross-origin models, decoders, audio, and texture workers;
- secure-context requirements, fullscreen, pointer lock, and gamepad behavior;
- save compatibility and clean-storage first launch;
- error reporting without secrets or high-volume frame-loop noise.

Keep a previous known-good artifact or release reference. A successful upload is not proof of a
playable release.

Reject game builds with hidden rules, frame-rate-dependent outcomes, camera effects that mutate the
base rig, unbounded effect spawns, hover-only controls, arbitrary mesh-index contracts, or tests
that prove only that the canvas exists.
