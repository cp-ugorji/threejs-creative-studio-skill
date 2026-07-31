# Experience and effect recipes

## Contents

1. [Product hero](#product-hero)
2. [Isometric diorama](#isometric-diorama)
3. [Scroll narrative](#scroll-narrative)
4. [Interactive portfolio](#interactive-portfolio)
5. [Procedural galaxy](#procedural-galaxy)
6. [Water and terrain](#water-and-terrain)
7. [Portal and magical energy](#portal-and-magical-energy)
8. [Holographic interface](#holographic-interface)
9. [Particle morph](#particle-morph)
10. [Physics mini-game](#physics-mini-game)
11. [Data visualization](#data-visualization)
12. [Configurator and exploded view](#configurator-and-exploded-view)

## Product hero

Use:

- one optimized product asset;
- semantic product root and named configurable parts;
- camera fitted to authored bounds;
- restrained controls or pointer parallax;
- neutral/local HDR environment;
- broad key and separation light;
- contact shadow;
- HTML headline, proof, and action;
- variant controls outside canvas.

Passes:

1. Silhouette blockout and responsive camera.
2. Correct PBR materials/color spaces.
3. Reflection/light shaping.
4. One meaningful interaction: rotate, variant, exploded detail.
5. Loading poster and fallback.
6. performance/accessibility.

Avoid:

- unconstrained orbit;
- spinning forever at constant speed;
- bloom on a non-emissive product;
- microscopic canvas text;
- forcing high DPR.

## Isometric diorama

Use:

- orthographic camera at a fixed three-quarter angle;
- scene root for responsive scale/reposition;
- modular grid and repeated instancing;
- small material palette;
- one sun direction plus fill;
- soft contact/baked shadows;
- slow local animations with varied phases;
- selective HTML labels.

Build from large floor/walls to furniture/props to micro detail. Keep detail density highest around
the focal action.

## Scroll narrative

Use:

- normal semantic sections;
- sticky canvas background;
- normalized scroll state;
- authored camera/object states per section;
- damped visual progress;
- HTML content remains primary;
- discrete reduced-motion states.

Keep camera paths collision-free. Preserve spatial continuity: let the visitor understand where the
camera moved, rather than teleporting through arbitrary angles.

## Interactive portfolio

Use a 3D metaphor only if it helps discovery:

- device/screen for a single featured project;
- gallery room for a small curated set;
- spatial map for related work;
- playful vehicle/world for exploration.

Keep direct HTML navigation. Provide a “skip experience” or project list. Lazy-load secondary
projects. Avoid embedding many live iframes at once.

## Procedural galaxy

Data per point:

```text
radius, branch, spin, randomness vector, size, color mix, phase
```

Generate deterministically. In the vertex shader:

- apply radius-dependent angular spin;
- add seeded randomness;
- scale point size for DPR and perspective;
- optionally animate subtle differential rotation.

In fragment:

- draw soft disc/star;
- use additive blending carefully;
- fade alpha rather than saturating the whole center.

Use `Points`, not thousands of meshes. Dispose and rebuild safely when parameters change.

## Water and terrain

Water:

- subdivided plane or node material;
- large directional waves + smaller warped noise;
- time-based vertex displacement;
- recomputed/approximated normals;
- depth/fresnel/color gradient;
- reflection/refraction only if budget allows;
- foam at intersections/crest as an enhancement.

Terrain:

- deterministic noise elevation;
- warped coordinates;
- plateau/erosion shaping;
- normals from neighboring elevation samples;
- biome colors/materials based on height, slope, moisture;
- water plane;
- LOD/chunks for large worlds;
- physics collider from simplified heightfield.

Use fog/atmosphere to hide finite edges. Avoid high-frequency noise that shimmers.

## Portal and magical energy

Portal layers:

1. physical frame or environmental anchor;
2. emissive edge/rim;
3. animated inner surface;
4. particles/fireflies;
5. local practical light;
6. restrained bloom;
7. interaction outcome.

Inner surface shader:

- UV/world-space noise;
- radial/edge mask;
- two-color gradient;
- time warp;
- optional depth/parallax.

Keep the portal grounded in the world. A glowing plane without frame, local light, or spatial
consequence reads like a screen.

## Holographic interface

Use:

- dark readable environment;
- one central subject/data focus;
- SDF/grid/ring nodes;
- fresnel rim on 3D objects;
- thin line geometry with resolution-aware width;
- scan/pulse motion;
- HTML equivalent for actual controls/data;
- limited cyan/green plus one alert accent.

Avoid arbitrary HUD clutter. Every panel or mark should label, measure, select, warn, or navigate.

Add glitches as rare events, not constant noise.

## Particle morph

Prepare equal-length position attributes:

```text
sourceA, sourceB, optional sourceC...
```

Pad by reusing deterministic positions or sampling surfaces consistently. In shader:

```glsl
vec3 position = mix(positionA, positionB, easedProgress);
```

Add:

- per-particle delay;
- size dip/peak around midpoint;
- color gradient;
- slight orthogonal turbulence;
- stable bounds.

Do not upload morphed CPU positions each frame for large counts.

## Physics mini-game

Structure:

```text
Level
  StartBlock
  TrapBlocks[]
  EndBlock
  Bounds
Player
CameraRig
Interface
GameStore: ready | playing | ended
```

Use simple colliders, fixed steps, sleeping, and kinematic obstacles. Read controls into stable
state, apply during physics updates, smooth camera independently.

Provide:

- instructions;
- keyboard/touch control;
- timer/status in HTML;
- restart;
- out-of-bounds reset;
- pause/visibility handling;
- reduced camera shake;
- deterministic level seed for tests.

## Data visualization

Start from data question and grain. Use 3D only when spatial depth, topology, volume, or immersive
inspection adds meaning.

Map fields explicitly:

```text
position -> spatial dimension
size -> magnitude
color -> category or signed value
motion -> time/change only when readable
```

Provide:

- axes/scale/legend in HTML or readable 3D;
- keyboard/filter controls;
- table/list alternative;
- selection details;
- stable camera presets;
- colorblind-safe palette;
- no perspective distortion when exact comparison is primary.

Use instancing and GPU picking for large datasets.

## Configurator and exploded view

Model contract:

- semantic named parts;
- stable pivots;
- material slots/variants;
- part metadata;
- optional hit proxies;
- explode direction/distance;
- camera focus bounds;
- accessibility label and details.

Explode around the assembly center or authored axes:

```js
exploded = assembled + direction * distance * progress
```

Do not translate every part in the same direction; that moves the assembly without separating it.

Selection:

```text
part hit/list selection -> highlight -> focus camera/details -> action -> reset/back
```

Avoid cloning materials on every hover. Use a selection layer, outline, emissive override with
restoration, or shared controlled variants.
