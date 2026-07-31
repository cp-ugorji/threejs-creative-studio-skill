# Accessibility, HTML integration, responsive behavior, and fallbacks

## Contents

1. [Keep semantics in HTML](#keep-semantics-in-html)
2. [Label the canvas](#label-the-canvas)
3. [Make interaction operable](#make-interaction-operable)
4. [Respect motion and sensory preferences](#respect-motion-and-sensory-preferences)
5. [Integrate HTML with 3D](#integrate-html-with-3d)
6. [Build responsive compositions](#build-responsive-compositions)
7. [Handle loading and failure](#handle-loading-and-failure)
8. [Support touch and mobile browsers](#support-touch-and-mobile-browsers)
9. [Review accessibility](#review-accessibility)

## Keep semantics in HTML

WebGL pixels are not a semantic accessibility tree.

Keep essential:

- page title and headings;
- body text;
- product facts;
- navigation;
- calls to action;
- form controls;
- instructions;
- error/loading status;
- game score/time/status;
- alternative summaries

in HTML.

Use the 3D scene as:

- enhancement;
- illustration;
- manipulable view paired with controls;
- spatial data view paired with a table/list;
- game surface paired with instructions/status.

Do not place essential copy only on a texture or 3D text mesh.

## Label the canvas

If decorative:

```html
<canvas aria-hidden="true" tabindex="-1"></canvas>
```

If interactive:

```html
<canvas
  role="application"
  aria-label="Interactive 3D product viewer"
  aria-describedby="viewer-instructions viewer-status"
></canvas>
```

Use `role="application"` sparingly; it changes assistive technology expectations. Prefer normal
HTML controls around the canvas and a concise canvas label.

Provide a text alternative:

```html
<p id="viewer-description">
  A dark blue modular speaker shown from a front three-quarter angle.
</p>
```

Update an `aria-live="polite"` status only for meaningful state changes, not every animation frame.

## Make interaction operable

Pair canvas gestures with HTML controls:

- Rotate left/right;
- Zoom in/out;
- Reset view;
- Start/pause animation;
- Select part from a list;
- Toggle exploded view;
- Enter/exit fullscreen;
- Mute/unmute;
- Restart game.

Use native `button`, `input`, `select`, and links. Preserve visible focus styles.

For selectable 3D parts, maintain a synchronized HTML list or details panel. Clicking either updates
one shared semantic selection.

Keyboard:

- Enter/Space activates focused controls;
- Escape exits modes/overlays/pointer lock;
- arrow keys may rotate when the viewer has explicit focus;
- announce the mode and how to leave it;
- do not trap focus in canvas;
- do not steal keys while typing.

Keep target sizes generous. Thin 3D lines need larger invisible hit geometry and equivalent HTML
controls.

## Respect motion and sensory preferences

Observe:

```js
const media = matchMedia('(prefers-reduced-motion: reduce)')
```

Reduced motion should:

- stop auto-orbit and camera drift;
- replace parallax with a stable view;
- reduce particle speed/count;
- remove shake, rapid zoom, large scroll-linked motion, and continuous oscillation;
- use short fades or discrete state changes;
- pause decorative loops;
- keep interaction feedback visible through color/form.

Do not remove essential feedback.

Avoid flashing content. Keep flashes below hazardous frequency/area thresholds. Avoid high-contrast
full-screen flicker and aggressive glitch passes.

Provide mute. Do not autoplay audible content.

Consider `prefers-contrast` and forced colors for HTML UI. Canvas content may need an alternate
high-contrast presentation or descriptive data view.

## Integrate HTML with 3D

Project a 3D point into screen coordinates:

```js
const projected = worldPosition.clone().project(camera)
const x = (projected.x * 0.5 + 0.5) * containerWidth
const y = (-projected.y * 0.5 + 0.5) * containerHeight
```

Use CSS transform:

```css
.label {
  transform: translate(-50%, -50%) translate3d(var(--x), var(--y), 0);
}
```

Determine visibility:

- clip/NDC range;
- behind camera;
- outside viewport;
- raycast/depth occluded;
- scene/section state;
- asset ready.

Do not update DOM style through React state every frame. Use refs/CSS variables or a throttled
system.

HTML labels need:

- semantic element;
- readable contrast;
- collision/overlap policy;
- leader line or spatial cue;
- touch target;
- focus behavior;
- screen-edge clamping or hiding;
- dense-label filtering.

For an iframe on a 3D screen, ensure it is trusted, sandboxed appropriately, performant, and still
navigable. Do not tilt/scale it until text becomes unreadable.

## Build responsive compositions

Use container queries/media queries for HTML and viewport-aware scene presets for 3D.

Define:

```text
wide landscape
standard desktop
tall mobile
short landscape/mobile
reduced capability
```

For each, specify:

- camera position/target/FOV;
- hero scale/position;
- UI alignment;
- hidden secondary elements;
- particle/effect budget;
- control mode;
- minimum canvas height.

Protect safe areas:

```css
padding:
  max(1rem, env(safe-area-inset-top))
  max(1rem, env(safe-area-inset-right))
  max(1rem, env(safe-area-inset-bottom))
  max(1rem, env(safe-area-inset-left));
```

Use dynamic viewport units (`dvh`) carefully and test browser UI expansion/collapse.

Avoid using `window.innerWidth` as the only size when canvas is embedded. Use its container.

On orientation change, wait for stable layout/ResizeObserver rather than hardcoding a timeout.

## Handle loading and failure

HTML states:

```text
loading: brand/context + progress or indeterminate status
ready: remove loader without a flash
recoverable error: concise reason + retry
unsupported: static image/video/text alternative
context lost: status + restore/reload path
offline: cached/static alternative if product requires it
```

Do not make the loading indicator depend on the WebGL scene that has not loaded.

Use `webglcontextlost`/`webglcontextrestored` where the project needs resilient long sessions.
Prevent default on context loss only when implementing restoration.

Provide a poster image or meaningful static composition for:

- disabled WebGL;
- blocked GPU;
- low power/data mode;
- crawlers/social cards;
- print;
- reduced experience tier.

Do not claim a screenshot is equivalent if the primary task requires manipulation. Pair it with
HTML controls/data.

## Support touch and mobile browsers

- Use Pointer Events.
- Set `touch-action` on the canvas interaction region, not the whole document.
- Keep native page scroll unless immersive mode is intentional.
- Avoid relying on hover.
- Avoid tiny hotspots near browser edges.
- Test one-handed portrait interaction.
- Provide reset/recenter.
- Reduce DPR and expensive effects.
- Handle device rotation and browser toolbar changes.
- Test memory pressure and reload behavior.
- Avoid forced fullscreen; explain why and provide exit.
- Account for thermal throttling during long sessions.

If device orientation or motion sensors are used, request permission from a user gesture and
provide a non-sensor control.

## Review accessibility

Verify:

- page works when canvas is hidden;
- essential content and actions remain available;
- canvas has correct decorative/interactive semantics;
- all essential actions are keyboard-operable;
- focus order is logical and visible;
- Escape exits immersive modes;
- reduced motion removes large/continuous motion;
- audio is opt-in and mutable;
- status/error messages are announced appropriately;
- text contrast and target sizes are acceptable;
- touch does not block page scrolling unexpectedly;
- screen reader has an equivalent description/data view;
- fallback is intentional and branded;
- automated accessibility scan passes for the HTML layer;
- manual keyboard and screen-reader smoke test is performed for important products.
