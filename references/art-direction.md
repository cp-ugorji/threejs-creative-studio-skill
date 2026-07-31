# Art direction and prompt expansion

## Contents

1. [Turn a prompt into a design contract](#turn-a-prompt-into-a-design-contract)
2. [Choose a visual thesis](#choose-a-visual-thesis)
3. [Compose the frame](#compose-the-frame)
4. [Choose a camera](#choose-a-camera)
5. [Build a palette](#build-a-palette)
6. [Direct materials and lighting](#direct-materials-and-lighting)
7. [Design motion](#design-motion)
8. [Design interaction](#design-interaction)
9. [Use references without copying](#use-references-without-copying)
10. [Review visual quality](#review-visual-quality)

## Turn a prompt into a design contract

Convert a sparse request into decisions that can be seen and tested. Keep this brief in working
notes or project documentation only when the repository benefits from it.

```text
Experience promise:
The visitor [does/feels] ___ by ___.

Hero:
Primary subject, dominant silhouette, target screen coverage, recognizable details.

World:
Foreground framing, midground action, background depth, atmospheric treatment.

Camera:
Projection, initial position/target, FOV or ortho scale, allowed motion, responsive variants.

Visual language:
Shape vocabulary, edge character, detail density, palette, material family, light motivation.

Motion:
Idle loop, user response, transition language, maximum intensity, reduced-motion mode.

Interaction:
Affordance, input, immediate feedback, result, recovery, touch and keyboard equivalents.

Constraints:
Stack, target browsers, loading budget, performance tier, assets, licenses, delivery deadline.

Acceptance:
Named screenshots, interactions, build checks, performance checks, accessibility checks.
```

When the user says only “make a 3D landing page for a space product,” infer a coherent starting
direction:

- promise: make the product feel engineered, weightless, and premium;
- hero: one product form, not a field of unrelated objects;
- world: dark orbital environment with a restrained horizon and particulate depth;
- camera: slightly low three-quarter hero view with limited pointer parallax;
- palette: near-black and cool grey with one ion-blue accent;
- lighting: broad cool key, dim warm rim, controlled environment reflection;
- motion: slow inertial float, small response on pointer, deliberate section transitions;
- UI: readable HTML title, one action, short product proof;
- tier: balanced mobile-first with reduced motion.

Do not treat these defaults as user facts. Keep them easy to revise.

## Choose a visual thesis

Write one sentence explaining why the experience looks the way it does. Examples:

- “A museum vitrine that makes one technical object feel rare.”
- “A miniature living diorama whose details reveal themselves through orbit.”
- “A calm navigable star chart where data is the light source.”
- “A tactile toy interface with chunky geometry and springy response.”

Use the thesis to reject decoration. If an effect does not strengthen it, omit the effect.

Choose one primary contrast:

- organic versus engineered;
- monumental versus intimate;
- calm versus explosive;
- dense versus empty;
- matte versus luminous;
- archival versus futuristic.

Let one side dominate and use the other as accent.

## Compose the frame

Build depth deliberately:

1. Add a foreground cue only if it frames, scales, or invites.
2. Place the hero in the midground with a readable silhouette.
3. Use the background for contrast, horizon, atmosphere, or narrative context.
4. Separate layers through value, saturation, focus, fog, scale, and motion—not only Z distance.

Use a dominant/secondary/tertiary hierarchy:

- dominant: the hero or task;
- secondary: context or interactive support;
- tertiary: particles, props, texture, and micro-motion.

Do not animate all three at equal amplitude.

Useful framing modes:

- central iconic: symmetrical, direct, product-like;
- rule-of-thirds editorial: leaves HTML space and creates direction;
- isometric diorama: clear systems, playful, measurable;
- cockpit/first-person: immersive but interaction-heavy;
- orbital: communicates form and scale;
- scroll tableau: distinct compositions per section.

Check the scene as a thumbnail. If the hero disappears, fix silhouette or value separation before
adding detail.

Use negative space intentionally. Empty space can hold UI, imply scale, create calm, or make motion
legible. Empty space that changes unpredictably across aspect ratios is a bug.

## Choose a camera

Choose projection from intent:

- Perspective: physical depth, scale, product, character, environment, game.
- Orthographic: diagram, isometric room, map, inventory, technical assembly.
- Hybrid transition: use only when the shift is meaningful and visually controlled.

For perspective scenes:

- Begin around 35–55 degrees vertical FOV for a natural hero view.
- Use 20–35 degrees for compressed, premium/product framing.
- Use 55–75 degrees for action or small interior spaces, watching edge distortion.
- Keep `near` as large and `far` as small as scene scale allows.
- Frame from object bounds rather than guessed magic numbers when assets are dynamic.

Express camera motion as a system:

- target point and allowed orbit range;
- distance range;
- damping or spring;
- collision/occlusion policy;
- idle behavior;
- input priority;
- mobile alternative.

Avoid unconstrained OrbitControls as the final interaction unless exploration is the product.
Constrain polar angle, azimuth, and distance; disable panning when it exposes the set.

For responsive art direction, define at least:

- wide: hero and UI may share the horizontal frame;
- tall: reframe vertically, reduce orbit radius, and move UI out of the hero silhouette;
- short: protect critical controls and crop decorative depth first.

Do not solve responsive framing only by changing FOV. Reposition camera, target, and scene groups.

## Build a palette

Start with roles, not random hex values:

- background/base;
- dominant surface;
- secondary surface;
- accent/action;
- emissive/light;
- text/UI neutrals.

Use value structure before hue. A scene with good hue but weak value grouping reads muddy.

Practical ratios:

- 60–75% base/environment;
- 20–30% dominant surface family;
- 5–10% accent and emission.

Treat bloom as amplification, not a color source. The unprocessed frame should already have a
coherent palette.

For stylized scenes:

- use a small number of material families;
- shift hue or lightness across planes rather than adding noisy textures;
- reserve highest saturation for interaction or narrative focus;
- use fog/background colors from the same family to avoid cut-out layers.

For realistic scenes:

- preserve physical color management;
- avoid pure black albedo and fully saturated diffuse colors;
- let lighting and reflections create variation;
- compare materials under a neutral studio environment before stylizing.

## Direct materials and lighting

Define a material language:

- soft molded polymer: rounded form, mid/high roughness, broad highlights;
- anodized metal: metallic, controlled roughness, subtle anisotropy;
- painted metal: nonmetallic paint over metal; expose metal only where wear warrants it;
- glass/acrylic: thickness, IOR, environment, background contrast;
- stone/soil: high roughness, scale-aware normal variation, broken silhouette;
- magical energy: emissive core plus transparent falloff, not a uniformly glowing solid.

Use lighting roles:

- key: communicates form and time/place;
- fill/environment: controls contrast without flattening;
- rim/separation: separates hero from background;
- practical: visible source that motivates local light;
- contact: shadow or AO cue that grounds forms.

Avoid a “three bright point lights” recipe. Prefer broad sources, an environment, and one motivated
direction. Use helpers while authoring and remove or hide them in production.

## Design motion

Give motion a grammar:

- idle: low amplitude, low frequency, phase-varied;
- hover/focus: immediate small response;
- action: clear anticipation and peak;
- settle: overshoot or damping that communicates weight;
- transition: preserves spatial continuity;
- ambient: secondary and slower than the task.

Use stagger and phase. Perfectly synchronized motion looks synthetic unless synchronization is the
concept.

Use easing by material and mass:

- heavy/mechanical: longer acceleration, small overshoot;
- elastic/toy: quick anticipation, visible overshoot;
- ethereal: smooth drift, low-frequency noise;
- UI/hologram: fast response, short decay, discrete scans or pulses.

Let interaction affect motion meaningfully. A cursor-driven parallax of two pixels is decoration; a
subtle camera or material response that clarifies depth and focus is direction.

## Design interaction

For each action, specify:

```text
affordance -> input -> immediate feedback -> outcome -> recovery
```

Example:

```text
outlined module -> pointer/touch/Enter -> lift + tone shift -> exploded view -> Escape/back
```

Make the hit target larger than the visible thin geometry when needed. Keep the visible target and
hit proxy associated in naming and state.

Use cursor changes, focus rings, micro-motion, sound (when enabled), and concise labels to reveal
interactivity. Do not rely on users discovering invisible 3D hotspots.

Avoid hijacking scroll unless the experience is explicitly a scroll narrative. Preserve browser
expectations and provide a clear exit from pointer lock or fullscreen.

## Use references without copying

Analyze references in layers:

1. observable composition and camera;
2. silhouette and proportions;
3. spatial relationships;
4. material response and light direction;
5. palette and value structure;
6. motion timing and interaction;
7. details that make the subject identifiable;
8. hidden regions and uncertain inferences.

Recreate principles and relationships. Do not copy proprietary models, textures, code, text, or a
distinctive scene without permission.

When rebuilding a supplied object image, state whether the result is an approximation, stylized
interpretation, or reference-matched reconstruction. A single view cannot establish hidden
geometry.

## Review visual quality

Capture at least one wide and one tall viewport. Review:

- Is the promise visible within three seconds?
- Is there one dominant focal point?
- Does the hero silhouette survive at thumbnail scale?
- Is there a foreground/midground/background read where depth matters?
- Does light reveal form and motivate the palette?
- Do materials differ for physical reasons?
- Does motion express weight and hierarchy?
- Is the interaction discoverable without instructions?
- Does the tall composition feel authored rather than cropped?
- Is the unprocessed image still strong?
- Are loading and fallback states part of the same visual system?

After every visual pass, record:

- what changed;
- why it changed;
- screenshot/viewpoint used;
- what still does not match the brief;
- next action: continue, revise composition, revise assets, revise material/light, revise motion,
  revise interaction, or request input.
