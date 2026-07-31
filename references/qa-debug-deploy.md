# Debugging, visual QA, testing, and deployment

## Contents

1. [Debug in layers](#debug-in-layers)
2. [Diagnose common failures](#diagnose-common-failures)
3. [Run visual QA](#run-visual-qa)
4. [Automate browser checks](#automate-browser-checks)
5. [Test interactions](#test-interactions)
6. [Test performance and memory](#test-performance-and-memory)
7. [Test compatibility and resilience](#test-compatibility-and-resilience)
8. [Build and deploy](#build-and-deploy)
9. [Use the release checklist](#use-the-release-checklist)

## Debug in layers

Debug one layer at a time:

1. DOM/canvas: visible, nonzero size, correct stacking.
2. renderer/context: created, no context error.
3. camera: correct active camera, position, near/far, target.
4. scene: expected objects, visibility/layers, world transforms.
5. geometry: bounds, normals, winding, attributes.
6. material: compatible with lights/renderer, opacity/depth.
7. textures/assets: loaded, URLs, decoders, color spaces.
8. lights/environment: intensity, units, direction.
9. loop/state: update and render happen.
10. post-processing: composer/pipeline replaces direct render correctly.

Create diagnostic overrides:

- clear background to magenta/grey;
- replace material with `MeshNormalMaterial`;
- add axes/grid/camera/light helpers;
- frame object bounds;
- render without post-processing;
- disable fog/transparency/shadows;
- log `renderer.info`;
- inspect one feature at a time.

Remove or guard helpers in production.

## Diagnose common failures

Black canvas:

- inspect console/network;
- verify canvas dimensions;
- clear to a visible color;
- verify camera is outside and aimed at scene;
- add a `MeshNormalMaterial` cube;
- call direct `renderer.render`;
- remove composer;
- check WebGL context creation.

Model missing:

- inspect glTF load result and scene children;
- compute bounds and scale;
- check Draco/Meshopt/KTX2 decoder;
- check frustum/layers/visibility;
- check material transparency;
- inspect Blender export selection and transforms.

Model dark:

- verify base-color `colorSpace`;
- add neutral environment;
- verify normals/tangents;
- verify metalness;
- check tone mapping/output conversion;
- verify physically correct light intensities for current revision.

Texture wrong:

- distinguish color from data map;
- check UV set, flip, repeat, wrapping, rotation;
- check packed channels;
- check maximum texture size and decode errors;
- verify KTX2 transcoder support.

Shadow wrong:

- check renderer/light/object flags;
- inspect shadow camera helper;
- tighten bounds and near/far;
- check bias/normalBias;
- update custom depth material for displacement;
- check point-light cost and cube faces.

Transparent object wrong:

- inspect opacity/transparent/alphaTest/depthWrite/depthTest;
- reduce overlapping layers;
- separate convex surfaces;
- set render order only as a controlled last tool;
- prefer cutout or alpha hash when appropriate.

Pointer miss:

- normalize against canvas rect;
- update camera/world matrices;
- inspect interactive list/layers;
- map child hit to semantic owner;
- use a visible debug ray/hit point.

## Run visual QA

Capture a matrix:

| View | Minimum |
| --- | --- |
| desktop wide | 1440×900 |
| mobile portrait | 390×844 |
| short landscape | 844×390 when relevant |
| DPR | 1 and target high-DPR where performance matters |
| state | loading, default, hover/focus, active/result, error/fallback |

Use a fixed seed, animation time, camera, and quality tier for comparison.

Review in this order:

1. composition and silhouette;
2. camera/framing;
3. value and palette;
4. form/proportion;
5. material response;
6. lighting/shadows;
7. depth/atmosphere;
8. motion hierarchy;
9. interaction feedback;
10. UI integration;
11. mobile recomposition;
12. technical artifacts.

Do not let a visual similarity score override obvious functional or geometric failure.

Use comparison sheets for a supplied reference:

- reference;
- same-view render;
- silhouette/edge view;
- optional difference heatmap;
- one or two non-reference orbit views for 3D integrity.

Report what still differs. A front-view match can hide a flat fake.

Score:

```text
composition       /5
form/proportion   /5
color/lighting    /5
material response /5
motion            /5
interaction       /5
responsiveness    /5
performance       /5
accessibility     /5
finish            /5
```

Require evidence for scores. Revise any score below 3 before calling polished.

## Automate browser checks

Use Playwright or the project browser harness:

```js
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})
page.on('pageerror', (error) => errors.push(error.message))

await page.goto(url, { waitUntil: 'networkidle' })
await page.setViewportSize({ width: 1440, height: 900 })
await page.screenshot({ path: 'desktop.png', fullPage: true })
```

Prefer an application-ready marker over arbitrary sleeps:

```html
<div data-experience-state="ready"></div>
```

or:

```js
await page.waitForFunction(() =>
  document.documentElement.dataset.experienceState === 'ready'
)
```

For deterministic animation, support a test query:

```text
?seed=42&quality=high&motion=paused&time=2.5
```

Do not expose insecure debug controls in production.

Check canvas:

- exists and has nonzero bounding box;
- renderer reported ready;
- screenshot is not a uniform/blank frame;
- WebGL errors/console errors absent;
- expected UI state present.

## Test interactions

Test outcomes, not implementation:

- visible control rotates/selects/resets;
- pointer/touch gesture changes expected state;
- keyboard activates same action;
- Escape exits;
- selected part appears in details panel;
- animation starts/pauses;
- game phase progresses/restarts;
- errors retry;
- route unmount/remount works.

Canvas coordinate clicks are brittle. Prefer semantic HTML controls. When the canvas itself is the
interaction, expose a stable test mode/camera/seed and click an intentional coordinate.

Test occlusion: clicking the foreground must not activate a hidden background target.

Test pointer capture and cancellation by dragging outside the canvas.

## Test performance and memory

Measure after warmup and during representative motion.

Record:

- average and 95th percentile frame time;
- CPU/GPU frame contribution where available;
- draw calls/triangles/textures/programs;
- DPR and render target sizes;
- JS long tasks;
- asset transfer/decode;
- memory/resource counts across navigation.

Use throttled network/CPU and a real low-power device when the product matters.

Memory loop:

1. open experience;
2. wait for ready;
3. record `renderer.info`;
4. close/unmount;
5. repeat 5–10 times;
6. force/encourage GC only in diagnostic environments;
7. look for unbounded growth.

Stable internal caches may remain. Investigate growth, not one nonzero value.

Thermal test long-running installations/games for several minutes.

## Test compatibility and resilience

Test:

- Chromium;
- Firefox for WebGL route;
- Safari/WebKit where supported/required;
- target mobile browsers;
- WebGPU enabled and fallback backend when WebGPU route promises fallback;
- reduced motion;
- DPR 1 and high DPR;
- portrait/landscape;
- touch;
- keyboard only;
- throttled/failed asset;
- context loss/restore for long-lived apps;
- page background/foreground;
- WebGL unavailable fallback.

Feature-detect. Do not browser-sniff for core graphics support.

If WebGPU is optional, provide an explicit fallback route and record which features differ.

## Build and deploy

Before build:

- use relative/public asset paths compatible with base path;
- remove local absolute paths;
- keep decoders/workers copied or served correctly;
- verify MIME types for wasm, KTX2, glTF, HDR/EXR;
- configure cache headers with hashed immutable assets;
- avoid cross-origin failures and configure CORS;
- preserve source maps according to policy;
- include static poster/social image and metadata;
- verify licenses/attribution.

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm preview
```

Use the repository’s actual scripts.

Test the built preview, not only the dev server. Tree-shaking, base paths, workers, decoders, and
asset URLs can differ.

Avoid deploying enormous source assets when only optimized runtime derivatives are needed.

## Use the release checklist

Visual:

- promise and hero read immediately;
- wide/tall/short frames are authored;
- loading/default/active/fallback states match;
- no clipping, z-fighting, broken transparency, or shadow artifacts;
- post-processing improves rather than conceals.

Functional:

- controls and gestures work;
- touch and keyboard equivalents work;
- pause/reset/back/exit paths work;
- loading failure and retry work;
- route remount works.

Performance:

- DPR capped/adaptive;
- budgets measured;
- no per-frame allocations/state churn found;
- repeated assets instanced/reused;
- shadows/post/particles have low tier;
- no resource growth across navigation.

Accessibility:

- semantic HTML present;
- canvas labelled appropriately;
- focus visible;
- reduced motion works;
- audio opt-in and mutable;
- fallback/description available.

Production:

- clean console;
- build succeeds;
- built preview verified;
- decoder/worker/asset paths work;
- license and provenance checked;
- compatibility limitations documented.
