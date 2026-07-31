# Orbit Studio benchmark

Orbit is an original two-page creative-studio experience used to test whether the skill can turn a
sparse visual brief into a coherent, framework-integrated result. It deliberately uses Vue for the
application shell and an imperative, framework-neutral Three.js controller for the real-time world.

## Routes

- `/` — a floating creative habitat with a portal, workstation, lounge, plants, and orbital core.
- `/careers` — a collaborative launch workshop with an opportunity beacon, shared table, sample
  rack, signal sculpture, semantic job panel, and direct-route support.

Every visible 3D asset is procedural geometry created by this repository. The benchmark does not
load third-party models, textures, fonts, or runtime media.

## What it validates

- Vue lifecycle ownership with one persistent canvas and complete idempotent teardown;
- route-to-engine semantic commands without putting scene objects in reactive state;
- named mesh-hover ownership, raycast feedback, cursor labels, and pointer-driven camera parallax;
- responsive orthographic art direction at desktop and narrow mobile viewports;
- explicit static rendering for reduced-motion environments;
- semantic navigation, skip link, keyboard-dismissible menu, accessible role panel, and HTML fallback;
- capped DPR, ResizeObserver sizing, frame-independent motion, shared resources, and disposal;
- direct loading of both routes in a production preview;
- browser tests that fail on uncaught page errors or console errors.

## Run

```bash
pnpm install
pnpm build
pnpm test
pnpm preview
```

With the preview running, record the camera, hover, route, pulse, and role-panel sequence:

```bash
pnpm record
```

From the skill root, run the bounded static audit:

```bash
node scripts/audit-threejs.mjs evals/orbit-studio --strict
```

## Verified baseline

The current local verification used Chrome at `1440×900` and `390×844`, including a reduced-motion
capture on both routes. The production build completed, all six Playwright tests passed, the strict
audit reported no findings, both canvases had non-zero rendered dimensions, seven named 3D hover
targets were discovered across the routes, camera parallax reached both intended extremes, and
capture reports had no console or page errors.

Visual review score (1–5): composition 5, form 4, color/light 5, material response 4, motion 5,
interaction 5, responsiveness 5, performance 4, accessibility 4, finish 5. Average: 4.6. These are
review scores, not laboratory performance measurements.
