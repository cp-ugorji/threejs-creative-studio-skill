# Assets, materials, lighting, and realistic rendering

## Contents

1. [Choose an asset strategy](#choose-an-asset-strategy)
2. [Author and export from Blender](#author-and-export-from-blender)
3. [Load and optimize glTF](#load-and-optimize-gltf)
4. [Apply color management](#apply-color-management)
5. [Choose materials](#choose-materials)
6. [Use environments](#use-environments)
7. [Design lights](#design-lights)
8. [Design shadows](#design-shadows)
9. [Bake when appropriate](#bake-when-appropriate)
10. [Diagnose realism problems](#diagnose-realism-problems)

## Choose an asset strategy

Use this order:

1. Reuse licensed assets already in the repository.
2. Use primitives or procedural geometry when the style supports them.
3. Generate or author custom geometry when identity depends on form.
4. Use a properly licensed external model only when it saves meaningful production time.
5. Use image or model generation only when allowed by the user and the delivery context.

Record asset provenance and license. Do not assume “downloadable” means reusable.

Use primitive/procedural construction for:

- low-poly dioramas;
- abstract hero objects;
- charts and data objects;
- modular architecture;
- particles, foliage clusters, stars, debris;
- temporary blockouts and hit/collision proxies.

Use authored glTF for:

- recognizable products and characters;
- irregular organic forms;
- skinned animation;
- detailed architecture;
- UV-dependent materials;
- assets maintained by a 3D artist.

## Author and export from Blender

Model for runtime:

- work at a consistent real-world or documented project scale;
- place origins and pivots for intended animation;
- apply or deliberately preserve transforms;
- remove hidden/internal faces that have no runtime purpose;
- correct face orientation and normals;
- limit material slots and UV sets;
- name semantic objects, bones, actions, and materials;
- separate objects only when they need distinct transform, material, culling, interaction, or
  lifecycle behavior;
- use linked duplicates for repeated authoring, then decide whether runtime instancing is viable.

For glTF material compatibility:

- use Principled BSDF for metal/rough PBR;
- connect base color to the supported base-color path;
- keep roughness in G and metalness in B when using the standard packed map;
- mark non-color textures as non-color in Blender;
- use normal maps through the recognized Normal Map node;
- verify alpha blend/mask settings;
- verify supported extensions before relying on clearcoat, transmission, sheen, iridescence, or
  anisotropy;
- test the exported file in an independent glTF viewer.

For baked scenes:

1. Finalize topology and transforms.
2. Create a non-overlapping bake UV set with adequate padding.
3. Bake the intended lighting contribution at a justified resolution.
4. Export the baked image in an appropriate format.
5. Apply it to a lightweight runtime material.
6. Keep dynamic/emissive/interactive parts separate.
7. Verify color-space handling in Three.js.

Do not bake view-dependent reflections or effects that must respond to runtime motion.

Export `.glb` for convenient single-file delivery. Use separate `.gltf` when independent texture
editing/caching materially helps.

Include only needed:

- selected/visible objects;
- UVs, normals, tangents, colors, attributes;
- cameras/lights if the runtime intentionally consumes them;
- animation actions/NLA tracks;
- custom properties when the application reads them.

## Load and optimize glTF

Basic load:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
const gltf = await loader.loadAsync('/models/hero.glb')
scene.add(gltf.scene)
```

Configure only matching compression:

```js
loader.setDRACOLoader(dracoLoader)
loader.setKTX2Loader(ktx2Loader.detectSupport(renderer))
loader.setMeshoptDecoder(MeshoptDecoder)
```

An asset using a decoder extension will fail without its decoder. A decoder adds network and parse
cost, so do not compress tiny assets reflexively.

Prefer Meshopt for many web pipelines when it provides a good decode/size balance. Prefer DRACO
when its compression tradeoff is measured and acceptable. Never apply both to the same primitive.

Use glTF-Transform or an equivalent maintained pipeline to:

- inspect vertices, materials, textures, animations, and extensions;
- deduplicate;
- prune unused data;
- weld compatible vertices;
- instance repeated nodes;
- join compatible primitives;
- resample animation;
- simplify with a visual error threshold;
- compress geometry;
- resize/compress textures;
- emit KTX2/Basis where supported.

Measure output visually and at runtime after every lossy operation. File size alone is not quality.

Keep model logic out of arbitrary traversal when semantic names or generated components can create
stable references. With R3F, generate a component with `gltfjsx` when selective mesh control helps.

Clone correctly:

- static unskinned scene: use `scene.clone(true)` with shared immutable resources when safe;
- skinned scene: use `SkeletonUtils.clone`;
- R3F cached loader output: treat as shared and avoid destructive mutation.

## Apply color management

Three.js performs lighting in Linear-sRGB and normally outputs sRGB.

Assign:

| Input | Typical color space |
| --- | --- |
| PNG/JPEG/WebP base color | `SRGBColorSpace` |
| PNG/JPEG/WebP emissive color | `SRGBColorSpace` |
| normal/roughness/metalness/AO/mask | `NoColorSpace`/default |
| HDR/EXR environment | Linear-sRGB/open-domain |
| CSS/hex color | interpreted as sRGB and converted by `ColorManagement` |

Do not “fix” a dark texture by changing light intensity before verifying its color space.

When using WebGL EffectComposer, include the correct output/tone-mapping stage for the installed
revision. Avoid applying sRGB conversion twice.

Choose tone mapping from the desired highlight behavior:

- `NoToneMapping`: utility, unlit, or already display-referred content;
- `ACESFilmicToneMapping`: common cinematic highlight rolloff;
- other supported operators: use only after visual comparison.

Set exposure as an art-direction value after lighting units and environments are coherent.

## Choose materials

Use the cheapest material that achieves the intended response:

- `MeshBasicMaterial`: unlit UI, masks, sprites, diagnostic geometry;
- `MeshMatcapMaterial`: stylized fixed response without scene lights;
- `MeshToonMaterial`: discrete light bands and illustrative scenes;
- `MeshStandardMaterial`: default PBR workhorse;
- `MeshPhysicalMaterial`: clearcoat, transmission, sheen, iridescence, anisotropy, advanced PBR;
- `ShaderMaterial`: custom WebGL behavior;
- node materials/TSL: custom WebGPU/universal renderer behavior.

Material coherence rules:

- metals use metalness near 1 and reflect the environment; painted/dielectric surfaces use
  metalness near 0;
- roughness controls highlight spread, not “quality”;
- transmission needs thickness, environment/background content, and sufficient render budget;
- clearcoat is a secondary lobe, not a substitute for low roughness;
- normal intensity must match texel scale and object scale;
- displacement requires sufficient geometry and affects silhouette; parallax/normal does not;
- emissive color needs emissive intensity and should not replace real form lighting;
- transparent materials introduce sorting and overdraw; prefer alpha test/hash for cutouts when
  appropriate.

Do not reuse an albedo texture as roughness, normal, and AO. These channels describe different
physical properties.

Share immutable materials. Clone only when an object genuinely needs distinct values. Avoid
creating materials inside loops or render callbacks.

## Use environments

Environment maps provide reflections and image-based lighting.

For an equirectangular HDR:

```js
const environment = await rgbeLoader.loadAsync('/environments/studio.hdr')
environment.mapping = THREE.EquirectangularReflectionMapping
scene.environment = environment
scene.background = environment
```

Use PMREM behavior appropriate to the renderer/version. Current loaders/renderers may handle
environment preprocessing internally; verify documentation.

Separate:

- environment used for lighting/reflection;
- visible background;
- background blur/intensity/rotation;
- local reflection capture.

Use a neutral studio environment to author materials, then apply the final art-directed
environment. A dramatic HDR can hide bad material values.

For real-time cube capture:

- hide the reflecting object from its own capture;
- restrict capture layers;
- use a small render target;
- update only when needed;
- dispose target and camera resources;
- compare against a static environment because live capture is expensive.

Ground-projected environments can sell a studio/background integration but do not replace
geometric grounding, correct scale, or contact shadows.

## Design lights

Light types:

- Ambient: constant fill; easy to flatten.
- Hemisphere: sky/ground fill for outdoor or stylized scenes.
- Directional: sun/distant key; stable and shadow-friendly.
- Point: local omnidirectional practical; shadow cost is high.
- Spot: directed practical or theatrical cone.
- RectArea: broad soft source for PBR surfaces; no standard shadow map.

Use physically meaningful decay and units in modern Three.js. Do not copy legacy intensity numbers
from older revisions.

Studio pattern:

```text
environment: low/moderate neutral base
key: broad directional or rect area, 30–60° off camera
fill: environment/hemisphere, lower intensity
rim: opposite edge or bright environment region
contact: controlled shadow/contact pass
```

Outdoor pattern:

```text
sun: directional, shadowed around hero only
sky: hemisphere/environment
ground bounce: environment or restrained fill
fog/atmosphere: matches horizon and depth
```

Stylized pattern:

```text
one clear key direction
soft fill
small palette of material values
selective emissive/practicals
shadow color and fog coordinated with background
```

Use helpers and neutral materials to debug direction and range.

## Design shadows

Enable intentionally:

```js
renderer.shadowMap.enabled = true
light.castShadow = true
mesh.castShadow = true
ground.receiveShadow = true
```

Shadow budget depends on:

- number of shadow-casting lights;
- faces per light (point lights require cube shadow maps);
- map resolution;
- shadow camera volume;
- casters/receivers;
- update frequency;
- filter type.

Tighten directional shadow camera bounds around the visible action. Increase map size only after
tightening the volume.

Tune:

- `bias` for acne;
- `normalBias` for self-shadowing on angled surfaces;
- near/far for precision;
- radius/filter for softness where supported.

Check Peter Panning after bias changes. Fix mesh normals/scale and shadow camera before using extreme
bias.

Use alternatives:

- baked lightmap for static scenes;
- blob/decal shadow for stylized moving objects;
- contact shadows for localized grounding;
- ambient occlusion for creases, not cast-shadow replacement;
- shadow catcher plane for compositing;
- no shadows when silhouette and environment lighting suffice.

## Bake when appropriate

Bake:

- static architecture and dioramas;
- soft global illumination;
- detailed environment shadows;
- expensive material/light combinations that do not change.

Keep dynamic:

- hero/product surfaces requiring view-dependent PBR;
- character and object motion;
- time-of-day or user-controlled lights;
- interactive emission and portals;
- effects dependent on camera or scene depth.

Hybrid scenes often work best: baked world, dynamic hero, one controlled real-time key/contact
shadow, and shader-driven atmosphere.

## Diagnose realism problems

If a model looks plastic:

- verify scale and bevels;
- verify normal/tangent maps;
- vary roughness by material, not randomly;
- provide a readable environment;
- confirm metalness classification;
- add broad sources that reveal highlight shape.

If a model looks flat:

- fix key direction and value separation;
- add contact grounding;
- improve silhouette and bevels;
- reduce uniform ambient light;
- verify normals.

If a model looks too dark:

- verify base-color texture color space;
- verify environment assignment/intensity;
- verify tone mapping and exposure;
- inspect normals and material metalness;
- do not simply stack ambient lights.

If glass is invisible:

- create background contrast;
- provide thickness/refraction cues;
- verify transmission/opacity setup;
- add edges, condensation, tint, or internal content;
- check sorting and depth settings.

If shadows are noisy or expensive:

- reduce casting lights;
- tighten the shadow camera;
- lower map size;
- freeze updates for static lights;
- use baked/contact/blob alternatives;
- ensure only meaningful meshes cast/receive.
