---
name: threejs
description: Design, scope, build, debug, optimize, and ship polished interactive 3D web experiences with Three.js in vanilla JavaScript, React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Angular, Astro, or other web stacks. Use for Three.js requirements interviews, creative briefs, React Three Fiber, WebGLRenderer, WebGPURenderer, TSL, GLSL, Drei, or Rapier work, including sparse prompts, product configurators, portfolios, action or exploration games, game cameras, controls, combat, enemies, levels, VFX, data scenes, procedural worlds, particles, shaders, post-processing, model pipelines, Blender/glTF delivery, interaction, physics, performance repair, visual QA, or production architecture.
---

# Three.js Creative Studio

Turn even a short prompt into an intentional, production-ready 3D experience. Treat visual
design, interaction, performance, accessibility, and lifecycle safety as one system.

## Select a collaboration mode

Interpret an optional leading mode token after the skill invocation. Accept the slash form, the
plain-language form, and `/drill-me` as an alias for `/grill-me`.

- `/build` — default. Infer reversible details, implement the experience, and verify it end to end.
- `/grill-me` — interview before building. Ask 3–5 high-leverage questions per round, recommend a
  choice where useful, maintain a compact decision summary, and continue until the experience
  contract is complete. Do not edit files until the user approves the brief or says to proceed.
- `/brief` — turn the request and supplied references into the experience contract only. Identify
  assumptions, risks, asset needs, and acceptance criteria without implementation.
- `/inspire` — propose three genuinely different art-direction concepts, each with a promise, hero,
  camera, palette, motion language, interaction, and cost/risk note. Recommend one and wait.
- `/audit` — inspect the existing experience and return evidence-ranked findings without editing.
- `/diagnose` — reproduce a bug or performance problem and explain the root cause. Do not implement
  a fix unless the user also asks for one.
- `/optimize` — measure a representative route first, improve the identified bottleneck, and report
  before/after evidence without silently reducing essential design or gameplay.
- `/game` — build a playable vertical slice with explicit input, simulation, camera, feedback,
  objective, win/loss, reset, mobile behavior, and deterministic proof.

Mode tokens are prompt conventions inside this skill, not shell commands. If a host does not expose
skills as slash commands, use natural language such as “Use the threejs skill in grill-me mode.” If
the user changes mode mid-task, preserve confirmed decisions and follow the new mode from then on.

## Work from this contract

1. Inspect the repository, package versions, existing stack, assets, and build commands.
2. Convert the prompt into a compact experience brief before writing scene code.
3. Preserve the existing framework unless changing it has a clear project benefit.
4. Build the smallest convincing composition first, then add detail in gated passes.
5. Render and inspect screenshots. Do not call an experience polished from code review alone.
6. Measure performance on representative desktop and mobile viewports.
7. Verify keyboard/touch access, reduced motion, fallback content, cleanup, and production build.
8. Report evidence, remaining limitations, and the exact verification performed.

For a sparse prompt, infer reversible creative details and proceed. Ask only when a missing answer
would change product scope, supplied assets, legal use, or a costly architecture choice.

## Read only the references needed

- Read [references/art-direction.md](references/art-direction.md) for prompt expansion,
  composition, camera, palette, lighting intent, motion language, and polish reviews.
- Read [references/foundations.md](references/foundations.md) for renderer setup, transforms,
  cameras, sizing, render loops, geometry, textures, scene graphs, and math.
- Read [references/assets-materials-lighting.md](references/assets-materials-lighting.md) for
  Blender/glTF, compression, PBR, color management, environments, lights, and shadows.
- Read [references/motion-interaction-physics.md](references/motion-interaction-physics.md) for
  animation, scroll, raycasting, pointer/touch controls, audio, and Rapier physics.
- Read [references/game-development.md](references/game-development.md) for playable loops,
  deterministic simulation, input intent, game cameras, collision, combat, enemies, levels, VFX,
  mobile controls, save data, deterministic play tests, and reproducible releases.
- Read [references/shaders-webgpu.md](references/shaders-webgpu.md) for GLSL, shader patterns,
  particles, GPGPU, TSL, WebGPU, and modern post-processing.
- Read [references/architecture-performance.md](references/architecture-performance.md) for
  modules, ownership, disposal, loading, profiling, budgets, adaptive quality, and workers.
- Read [references/framework-integration.md](references/framework-integration.md) when Three.js
  lives inside React, Next.js, Vue, Nuxt, Svelte, SvelteKit, Angular, Astro, Web Components, or an
  SSR application. It defines the portable renderer boundary and host lifecycle adapters.
- Read [references/react-three-fiber.md](references/react-three-fiber.md) for R3F, Drei,
  react-postprocessing, React integration, hooks, events, state, and component lifecycles.
- Read [references/accessibility-html.md](references/accessibility-html.md) for semantic HTML,
  overlays, focus, reduced motion, touch, responsive layout, and WebGL fallbacks.
- Read [references/qa-debug-deploy.md](references/qa-debug-deploy.md) for debugging, visual QA,
  automated capture, testing, failure diagnosis, and deployment checks.
- Read [references/recipes.md](references/recipes.md) when implementing a recognizable effect or
  experience pattern.
- Read [references/sources.md](references/sources.md) when current APIs or version drift matter.
  Prefer primary documentation and inspect the installed dependency version.

## Expand a sparse prompt

Write a private implementation brief with these fields:

```text
promise: what the visitor should feel or accomplish in one sentence
audience/context: portfolio, product, editorial, game, installation, utility
hero: one dominant subject with a readable silhouette
world: foreground, midground, background, atmosphere
camera: projection, framing, focal behavior, movement limits
palette/material language: base, dominant, accent, surface response
lighting: motivated key, fill/environment, separation, shadow strategy
motion: idle, response, transition, reduced-motion substitute
interaction: discoverable input, feedback, outcome, touch/keyboard equivalent
UI: only the HTML needed to orient or complete the task
performance tier: mobile-first, balanced, or showcase
acceptance: observable visual, functional, responsive, and performance checks
```

Use one strong visual idea. Avoid combining unrelated effects merely because they are available.
When references are supplied, decompose them into silhouette, proportions, depth layers, material
response, camera, light direction, color relationships, and motion. State hidden or inferred parts.

## Choose the implementation route

### Preserve an existing route

- Keep plain Three.js in a plain Three.js project.
- Keep R3F in a React/R3F project.
- In Vue, Svelte, Angular, Astro, or another host, keep the scene behind a framework-neutral
  `Experience` boundary with explicit `start`, `resize`, commands, events, and `destroy` behavior.
- In an existing React project, use R3F when declarative scene composition helps; use the same
  imperative `Experience` boundary when the scene is an isolated embed or an existing engine.
- Use TypeScript when the repository already uses it or the scene has reusable systems.

### Start a new route

- Choose plain Three.js behind a host adapter for a small embed, a library-neutral deliverable,
  explicit render-loop control, worker rendering, or Vue/Svelte/Angular/Astro integration.
- Choose R3F for a React product, reusable scene components, declarative asset loading, or a scene
  tightly coordinated with React UI/state.
- Choose `WebGLRenderer` for maximum compatibility or existing GLSL/EffectComposer work.
- Consider `WebGPURenderer` when TSL, compute, modern node post-processing, or WebGPU features
  materially improve the result. Keep a compatibility plan and verify the target browsers.
- Never silently mix WebGL-only `ShaderMaterial`, `onBeforeCompile`, or EffectComposer code into a
  WebGPU route. Port it to TSL/node materials or stay on WebGL.

Use `scripts/scaffold.mjs` only for a new project:

```bash
node scripts/scaffold.mjs --stack vanilla --out ./my-experience
node scripts/scaffold.mjs --stack r3f --out ./my-experience
node scripts/scaffold.mjs --stack vue --out ./my-experience
node scripts/scaffold.mjs --stack game --out ./my-game
node scripts/scaffold.mjs --stack r3f --out ./my-experience --name "My Experience"
```

Do not overwrite a non-empty target directory.

### Route playable work explicitly

For a game or game-like experience, define the repeated player decision before scene polish. Build
one complete vertical slice with input, rules, camera, feedback, objective, win/loss, reset, and a
deterministic fixture. Keep simulation state independent from meshes and UI. Use a fixed step when
collision, combat, replay, or consistent outcomes matter; interpolate presentation separately.

Treat camera, input, combat, enemies, levels, effects, and saves as contracts with explicit state
and ownership. Profile a busy representative encounter. Verify temporal behavior with deterministic
state evidence or a recorded playthrough in addition to still screenshots. Use the `game` starter
for a compact keyboard/touch arena that demonstrates these boundaries without an engine framework.

## Build in quality-gated passes

### Pass 1 — Composition blockout

- Create the renderer/canvas, scene, camera, resize handling, and deterministic clock.
- Block the hero, ground/reference plane, depth layers, and camera with cheap materials.
- Make the silhouette and hierarchy readable before adding shaders or post-processing.
- Capture desktop and mobile screenshots.

### Pass 2 — Form and assets

- Replace placeholders with intentional primitives, procedural geometry, or optimized glTF.
- Fix pivots, scale, normals, UVs, naming, bounds, and camera framing.
- Reuse geometries/materials and instance repeated objects.
- Keep collision geometry separate and simpler than render geometry.

### Pass 3 — Material and light

- Establish correct input texture color spaces and linear-light rendering.
- Use a coherent PBR response; do not make every surface equally glossy or emissive.
- Motivate key light direction, add controlled fill/environment light, and create separation.
- Spend shadow quality only where contact and depth perception need it.

### Pass 4 — Motion and interaction

- Use delta time or a fixed physics step. Make motion frame-rate independent.
- Layer idle motion, anticipation, action, and settle instead of constant unrelated movement.
- Make hit areas forgiving and feedback immediate.
- Provide pointer, touch, and keyboard-equivalent paths for essential actions.
- Respect `prefers-reduced-motion` and page visibility.

### Pass 5 — Effects and atmosphere

- Add particles, fog, custom shaders, reflections, or post-processing only when they reinforce the
  promise.
- Compare before/after. Remove effects that flatten contrast, obscure the hero, or waste budget.
- Prevent transparent sorting, depth-write, blending, and color-management mistakes.

### Pass 6 — Production hardening

- Implement loading, error, empty, WebGL-unavailable, and context-loss states.
- Dispose GPU resources and event listeners on teardown.
- Run typecheck, tests, production build, visual capture, console-error checks, and the audit script.
- Test throttled loading and at least one lower-power/mobile configuration.

## Apply non-negotiable engineering rules

- Import core APIs from `three` or `three/webgpu`; import addons from `three/addons/...`.
- Inspect installed versions and migration notes before using recently changed APIs.
- Set renderer size from the canvas display size and cap device pixel ratio.
- Update camera projection after size changes.
- Prefer `renderer.setAnimationLoop()` for renderer-managed animation and XR compatibility.
- Never allocate vectors, colors, materials, geometries, or textures every frame without a measured
  reason. Reuse scratch objects.
- Keep simulation and per-frame data out of host-framework reactive state. Publish low-frequency
  semantic events such as `selectionchange`, `ready`, or `qualitychange` to the UI instead.
- Annotate color textures as sRGB; leave non-color data textures untagged.
- Use glTF/GLB for runtime 3D assets. Add DRACO, Meshopt, or KTX2 only with the matching loader.
- Cache and reuse loaded assets. Preload only what improves the critical path.
- Dispose geometries, materials, textures, render targets, controls, passes, and listeners when
  ownership ends.
- Seed procedural generation so screenshots and tests are reproducible.
- Keep debug controls behind development-only configuration.

## Enforce a visual quality bar

Reject or revise a result when any item is true:

- The hero silhouette is unclear at thumbnail size.
- Everything has equal contrast, scale, motion, detail, or glow.
- The camera feels accidental, clips geometry, or exposes empty composition at a target viewport.
- Materials read as plastic because roughness, environment, normals, and scale are incoherent.
- Lighting has no motivated direction or grounding contact.
- Interaction has no visible affordance or feedback.
- Mobile is a cropped desktop view rather than a recomposed layout.
- Post-processing is doing the work that form, color, or lighting should do.
- The canvas is the only source of essential text or control.
- A still screenshot was accepted without testing motion and interaction.

Score each final build from 1–5 for composition, form, color/light, material response, motion,
interaction, responsiveness, performance, accessibility, and finish. Require no category below 3
and an average of at least 4 for a “polished” claim.

## Verify with tools

Run the static audit from the skill root:

```bash
node scripts/audit-threejs.mjs /absolute/path/to/project
```

Run browser capture against a running preview:

```bash
node scripts/capture-threejs.mjs --url http://127.0.0.1:4173 --out ./artifacts
```

Treat audit findings as leads, not proof. Confirm each issue in source or runtime behavior.

For this skill repository, use the creative benchmark gallery as an end-to-end evaluation:

```bash
pnpm --dir evals/challenge-gallery install
pnpm --dir evals/challenge-gallery build
pnpm --dir evals/challenge-gallery test
```

The gallery contains 24 original procedural scenes spanning products, environments, particles,
interaction, animation, responsive framing, and production lifecycle behavior.

## Hand off truthfully

State:

- what experience was built and the chosen route;
- the main art-direction and technical decisions;
- commands and viewports verified;
- measured or observed performance evidence;
- accessibility and fallback behavior;
- remaining approximations, browser limitations, or asset-license constraints.

Do not say “perfect,” “pixel-perfect,” “production-ready,” or “60 FPS” without evidence matching
that claim.
