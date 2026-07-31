# Shaders, particles, GPGPU, TSL, WebGPU, and post-processing

## Contents

1. [Choose WebGL or WebGPU](#choose-webgl-or-webgpu)
2. [Understand the shader pipeline](#understand-the-shader-pipeline)
3. [Write maintainable GLSL](#write-maintainable-glsl)
4. [Use shader pattern recipes](#use-shader-pattern-recipes)
5. [Build particles](#build-particles)
6. [Use GPGPU and compute](#use-gpgpu-and-compute)
7. [Modify lit materials](#modify-lit-materials)
8. [Use TSL and WebGPURenderer](#use-tsl-and-webgpurenderer)
9. [Apply post-processing](#apply-post-processing)
10. [Debug shaders](#debug-shaders)

## Choose WebGL or WebGPU

Use `WebGLRenderer` when:

- the existing project uses it;
- browser reach is the primary constraint;
- GLSL/ShaderMaterial/onBeforeCompile/EffectComposer assets already exist;
- WebGPU parity has not been verified;
- the experience is simple enough that WebGPU adds no user value.

Use `WebGPURenderer` when:

- TSL/node materials improve maintainability;
- compute or storage buffers materially help;
- modern node-based post-processing is needed;
- WebGPU is part of the product requirement;
- compatibility fallback through its WebGL 2 backend is verified.

Do not assume identical behavior. Current WebGPU constraints include:

- classic `ShaderMaterial`, `RawShaderMaterial`, and `onBeforeCompile` are not the custom-material
  path; port to nodes/TSL;
- classic EffectComposer is not the WebGPU post-processing path;
- some features may be experimental or perform differently;
- initialize the renderer as required by the installed revision.

Keep renderer selection at a boundary. Do not scatter WebGL/WebGPU conditionals through scene code.

## Understand the shader pipeline

Vertex shader responsibilities:

- read per-vertex attributes;
- apply skinning, morphing, instancing, and displacement;
- transform local position through model/view/projection spaces;
- emit varyings for interpolation.

Fragment shader responsibilities:

- read interpolated varyings;
- sample textures;
- compute material/lighting/effects;
- output color and alpha;
- participate in tone mapping/color conversion when required by the material route.

Know spaces:

- object/local;
- world;
- view/camera;
- clip;
- normalized device;
- screen/UV;
- tangent for normal mapping.

Name variables with space suffixes when ambiguity matters:

```glsl
vec3 positionWorld;
vec3 normalView;
vec3 viewDirectionWorld;
```

Do not dot vectors in different spaces.

## Write maintainable GLSL

Use separate `.glsl` files through a Vite plugin or raw-string import when the project supports it.
Keep small reusable chunks for:

- noise;
- easing/remap;
- color conversion;
- lighting;
- SDF primitives;
- rotation;
- random/hash;
- normal reconstruction.

Keep uniforms stable:

```js
const uniforms = {
  uTime: { value: 0 },
  uColorA: { value: new THREE.Color('#2b6cff') },
  uColorB: { value: new THREE.Color('#ff4fd8') },
}
```

Update `.value`, not the uniform record identity.

Use attributes for immutable per-particle/per-vertex values and textures/buffers for large dynamic
state.

Prefer:

- calculations in the vertex shader when interpolation is acceptable;
- `smoothstep` for antialiased procedural thresholds;
- `fwidth` for screen-space edge widths where derivatives are supported;
- compile-time `#define` branches for material variants;
- low/medium/high precision selected from measured need;
- small loop bounds known at compile time;
- texture lookup over expensive repeated procedural evaluation when it is visually equivalent.

Avoid:

- dependent deep branches per fragment;
- unbounded loops;
- repeated normalization when a value is already normalized;
- discarding many fragments when alpha test/hash or geometry can avoid overdraw;
- high-frequency noise above pixel resolution;
- dynamic shader source mutation every frame.

## Use shader pattern recipes

Normalize a value:

```glsl
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}
```

Centered UV:

```glsl
vec2 p = vUv - 0.5;
```

Circle mask:

```glsl
float circle = 1.0 - smoothstep(radius - feather, radius + feather, length(p));
```

Ring:

```glsl
float ring = 1.0 - smoothstep(width, width + feather, abs(length(p) - radius));
```

Grid:

```glsl
vec2 cells = abs(fract(vUv * density - 0.5) - 0.5) / fwidth(vUv * density);
float line = 1.0 - min(min(cells.x, cells.y), 1.0);
```

Angular segment:

```glsl
float angle = atan(p.y, p.x);
float segment = floor((angle + PI) / TAU * count);
```

Fresnel/rim:

```glsl
float fresnel = pow(
  1.0 - clamp(dot(normalize(normalWorld), normalize(viewDirectionWorld)), 0.0, 1.0),
  power
);
```

Posterized/halftone intensity:

```glsl
float level = floor(intensity * steps) / max(1.0, steps - 1.0);
```

Use signed distance functions for crisp scalable shapes. Combine with `min`, `max`, subtraction,
smooth union, repetition, and coordinate transforms.

For procedural terrain:

1. Build an elevation function from multi-octave noise.
2. Warp input coordinates for less uniform features.
3. Shape elevation into plateaus/valleys with remap and smoothstep.
4. Recompute normals from neighboring elevation samples.
5. Classify water/sand/grass/rock/snow from elevation, slope, moisture/noise.
6. Use the same elevation in the shadow/depth material or TSL node graph.

For holograms:

- fresnel rim;
- view/world-space scan stripes;
- time-varying glitch displacement;
- backface handling;
- alpha falloff;
- restrained bloom.

For fire/smoke:

- deform a low-cost mesh or particles;
- use scrolling/warped noise;
- fade edges and top/bottom;
- premultiply/choose blending intentionally;
- disable depth write when appropriate;
- sort against transparent content.

## Build particles

Use `THREE.Points` for camera-facing point sprites:

```js
const geometry = new THREE.BufferGeometry()
geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1))

const points = new THREE.Points(geometry, material)
```

Size in a custom vertex shader should:

- account for renderer height/DPR;
- attenuate with view-space depth when perspective is desired;
- clamp or fade near the camera;
- multiply by an attribute for variation.

Particle fragment should draw a soft disc/sprite instead of a square unless squares are the design.

Transparency choices:

- `alphaTest`/alpha hash: cutout, fewer sorting problems;
- normal alpha blending: soft particles, sorting/overdraw cost;
- additive: energy/fireflies/stars, loses dark color and can blow out;
- disable `depthWrite` for many transparent particle systems;
- keep `depthTest` unless particles must overlay everything.

Animate large systems on GPU. Updating a full CPU position attribute each frame is acceptable only
for small measured counts.

For morphing particle shapes:

- make each target attribute the same count;
- pad smaller sources deterministically;
- mix source and target in shader;
- offset progress per particle for richer transition;
- update bounding sphere or disable frustum culling only with justification.

## Use GPGPU and compute

WebGL GPGPU commonly stores state in floating-point textures and ping-pongs render targets.
`GPUComputationRenderer` reduces setup but still requires:

- supported float/half-float capabilities;
- deterministic base state;
- state textures sized to particle count;
- dependencies between variables;
- delta/time uniforms;
- reset/lifetime logic;
- a vertex shader that samples computed positions.

Encode persistent particle state:

```text
position.xyz + life
velocity.xyz + seed/state
```

Limit long-frame integration and define respawn behavior.

WebGPU compute/TSL can use storage buffers and compute nodes. Prefer it when it removes texture
packing complexity and target support is acceptable.

Use GPGPU/compute for:

- large persistent particle simulations;
- flow fields;
- cloth/fluid-like experiments;
- boids;
- height/field updates;
- heavy per-instance state.

Do not use it for a few hundred decorative particles that a vertex shader can animate from time and
seed.

## Modify lit materials

On WebGL, `onBeforeCompile` can inject shader changes into built-in materials, but it is coupled to
internal shader chunks and revision changes. If used:

- keep replacements narrowly anchored;
- store added uniforms on the material/plugin;
- update custom depth/distance materials so shadows match displacement;
- recompute or approximate normals for deformed surfaces;
- set `customProgramCacheKey` when variants affect compilation;
- regression-test after Three.js upgrades.

Libraries such as `three-custom-shader-material` can reduce boilerplate but add a dependency and
version compatibility surface.

Prefer TSL/node materials for new WebGPU-targeted custom lit surfaces.

## Use TSL and WebGPURenderer

TSL expresses shader graphs with JavaScript nodes and can target WGSL or GLSL through
WebGPURenderer.

Typical route:

```js
import * as THREE from 'three/webgpu'
import { color, pass, time, uniform } from 'three/tsl'

const renderer = new THREE.WebGPURenderer({ antialias: true })
await renderer.init()
```

Use node materials:

```js
const material = new THREE.MeshStandardNodeMaterial()
material.colorNode = color('#6ae4ff')
```

Compose reusable TSL functions for:

- position deformation;
- normal reconstruction;
- PBR inputs;
- particle state;
- masks;
- post-processing.

Use the current renderer API (`RenderPipeline` in recent revisions) and inspect installed docs.
Names around node post-processing have changed across releases.

WebGPURenderer can fall back to a WebGL 2 backend, but fallback does not guarantee feature/performance
parity. Test both backends when the fallback is part of delivery.

## Apply post-processing

WebGL EffectComposer flow:

```text
RenderPass -> selective effects -> color/tone/output pass -> canvas
```

Set composer size and pixel ratio with the renderer. Avoid full-resolution passes that do not need
it.

Use post effects by intent:

- bloom: reinforces actual emissive/highlight hierarchy;
- SSAO/GTAO: subtle contact and depth; expensive and scale-sensitive;
- depth of field: directs focus in a controlled camera, often poor for exploratory scenes;
- vignette: subtle frame focus;
- color grading/LUT: unifies palette after lighting is correct;
- chromatic aberration/glitch/noise: narrative accents, easy to overuse;
- outline: selection or stylized separation;
- motion blur: action, expensive and interaction-sensitive.

Selective bloom is better than globally lowering threshold when only named objects should glow.

WebGPU uses node composition and `RenderPipeline`, not classic EffectComposer. Build a scene pass,
compose TSL effects, set output node, and render the pipeline. Use MRT when multiple buffers can be
captured in one pass.

Always compare:

- base render;
- one effect;
- final chain;
- mobile/low-quality chain;
- reduced-motion chain where temporal effects change.

## Debug shaders

If compilation fails:

1. Read the first shader error, not the cascade.
2. Inspect generated source when using injected/node code.
3. Replace output with a constant color.
4. Visualize each varying/texture/channel.
5. Verify types, precision, loop bounds, and uniforms.
6. Verify coordinate spaces.
7. Reduce to the smallest expression.

Visual diagnostics:

```glsl
outColor = vec4(normalize(normal) * 0.5 + 0.5, 1.0);
outColor = vec4(vUv, 0.0, 1.0);
outColor = vec4(vec3(mask), 1.0);
```

If a shader works only from one angle, inspect normals, view direction, backfaces, and spaces.

If a displaced mesh shadow is wrong, update the depth/distance material or use the same TSL
position node.

If particles disappear:

- inspect point size and clip-space W;
- check frustum bounds;
- check alpha/depth/blending;
- check texture color/alpha;
- ensure attributes match vertex count.

If post-processing changes brightness:

- verify input/output color spaces;
- verify output/tone-mapping stage;
- check render-target type and precision;
- remove passes one at a time.
