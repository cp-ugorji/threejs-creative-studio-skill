# Primary sources and version drift

## Contents

1. [Primary Three.js sources](#primary-threejs-sources)
2. [R3F and ecosystem sources](#r3f-and-ecosystem-sources)
3. [Framework integration sources](#framework-integration-sources)
4. [Asset pipeline sources](#asset-pipeline-sources)
5. [Workflow influences](#workflow-influences)
6. [Version policy](#version-policy)

Use primary documentation for APIs and migration-sensitive facts. Treat tutorials and community
examples as inspiration rather than API authority. When a user supplies licensed or private
content, use it only within their authorized task and preserve its access controls.

## Primary Three.js sources

- Repository and releases: https://github.com/mrdoob/three.js
- Migration guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Documentation: https://threejs.org/docs/
- Manual: https://threejs.org/manual/
- Fundamentals: https://threejs.org/manual/en/fundamentals.html
- Scene graph: https://threejs.org/manual/en/scenegraph.html
- Responsive design: https://threejs.org/manual/en/responsive.html
- Color management: https://threejs.org/manual/en/color-management.html
- Cleanup: https://threejs.org/manual/en/cleanup.html
- Disposal FAQ: https://threejs.org/manual/en/how-to-dispose-of-objects.html
- Loading models: https://threejs.org/manual/en/loading-3d-models.html
- GLTFLoader: https://threejs.org/docs/pages/GLTFLoader.html
- Optimization: https://threejs.org/manual/en/optimize-lots-of-objects.html
- OffscreenCanvas: https://threejs.org/manual/en/offscreencanvas.html
- Post-processing (WebGL): https://threejs.org/manual/en/post-processing.html
- WebGPURenderer: https://threejs.org/manual/en/webgpurenderer
- WebGPURenderer API: https://threejs.org/docs/pages/WebGPURenderer.html
- TSL specification: https://threejs.org/docs/TSL.html
- TSL API: https://threejs.org/docs/pages/TSL.html
- Examples: https://threejs.org/examples/

Baseline observed from primary release pages during research:

- Three.js r185 / npm `0.185.1` was the latest stable line verified on 2026-07-29.
- `WebGPURenderer` and TSL were under active development.
- recent WebGPU post-processing uses `RenderPipeline`; `PostProcessing` is deprecated since r183.

Do not freeze implementation to these values. Check the installed version and current sources.

## R3F and ecosystem sources

- React Three Fiber repository: https://github.com/pmndrs/react-three-fiber
- R3F documentation: https://r3f.docs.pmnd.rs/
- Canvas: https://r3f.docs.pmnd.rs/api/canvas
- Hooks: https://r3f.docs.pmnd.rs/api/hooks
- Events: https://r3f.docs.pmnd.rs/api/events
- Loading models: https://r3f.docs.pmnd.rs/tutorials/loading-models
- Performance scaling: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- Performance pitfalls: https://r3f.docs.pmnd.rs/advanced/pitfalls
- Drei documentation: https://drei.docs.pmnd.rs/
- React Three Rapier: https://pmndrs.github.io/react-three-rapier/
- React-postprocessing: https://github.com/pmndrs/react-postprocessing
- gltfjsx: https://github.com/pmndrs/gltfjsx

Baseline observed:

- R3F v9.6.1 was the latest stable release shown (2026-04-28).
- R3F v10 alpha introduced renderer-independent APIs and first-class WebGPU/TSL hooks.

Use stable APIs by default. Use alpha APIs only when requested or when the project already depends
on them, and document the risk.

## Framework integration sources

- Vue lifecycle hooks: https://vuejs.org/api/composition-api-lifecycle.html
- Nuxt client-only component: https://nuxt.com/docs/api/components/client-only
- Svelte lifecycle hooks: https://svelte.dev/docs/svelte/lifecycle-hooks
- SvelteKit browser environment: https://svelte.dev/docs/kit/$app-environment
- Angular component lifecycle: https://angular.dev/guide/components/lifecycle
- Angular NgZone: https://angular.dev/api/core/NgZone
- Astro client directives: https://docs.astro.build/en/reference/directives-reference/#client-directives
- Next.js client components: https://nextjs.org/docs/app/api-reference/directives/use-client

Framework APIs evolve separately from Three.js. Inspect the host version and its official lifecycle,
SSR, and hydration documentation before applying an adapter pattern.

## Asset pipeline sources

- Blender manual: https://docs.blender.org/manual/en/latest/
- Blender glTF exporter:
  https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- glTF specification and ecosystem: https://www.khronos.org/gltf/
- KTX: https://www.khronos.org/ktx/
- glTF-Transform: https://github.com/donmccurdy/glTF-Transform
- Meshoptimizer: https://github.com/zeux/meshoptimizer
- Draco: https://github.com/google/draco
- Rapier: https://rapier.rs/docs/

Use current command help for glTF-Transform and Blender exporter options; both evolve.

## Workflow influences

- MengTo/Skills: https://github.com/MengTo/Skills
- Reviewed game-development skill set at commit
  `46abf7860d716c33de8217b6ff9f75debf28afaf` (MIT License, copyright 2026 Meng To).

Its focused workflows for cameras, mobile games, VFX, optimization, testing, shipping, action
combat, level authoring, and enemy systems informed the topic inventory in
`game-development.md`. This skill rewrites and expands those ideas into a framework-neutral,
deterministic architecture with current Three.js/WebGPU awareness, explicit accessibility paths,
reduced-motion behavior, save migration, reproducible fixtures, and an executable game starter.
No upstream source code or assets are bundled; the reviewed repository and license are identified
above for public attribution.

## Version policy

Before using an API:

1. Read the repository package and lockfile.
2. Determine the installed package version.
3. Read matching official documentation or source.
4. Check migration notes between the project version and any copied pattern.
5. Avoid deprecated properties and old `examples/jsm` paths when `three/addons` is supported.
6. Verify framework peer dependencies.
7. Build and run the production bundle.

When maintaining this skill:

- review Three.js releases and migration guide;
- review R3F stable/next status;
- validate WebGPU/TSL names;
- validate post-processing output/color behavior;
- validate loader extensions and decoder setup;
- re-run the scaffold builds and challenge gallery;
- update the research baseline here without presenting it as timeless.
