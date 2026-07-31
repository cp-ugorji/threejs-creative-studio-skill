#!/usr/bin/env node

import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const rootArg = args.find((arg) => !arg.startsWith('--'))
const json = args.includes('--json')
const strict = args.includes('--strict')

if (!rootArg) {
  console.error('Usage: node scripts/audit-threejs.mjs /path/to/project [--json] [--strict]')
  process.exit(1)
}

const root = path.resolve(rootArg)
const selfPath = fileURLToPath(import.meta.url)
const ignored = new Set(['node_modules', 'dist', 'build', '.git', '.next', '.nuxt', 'coverage'])
const sourceExtensions = /\.(?:js|jsx|mjs|cjs|ts|tsx|html|css)$/

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) await walk(absolute, files)
    else if (sourceExtensions.test(entry.name) && absolute !== selfPath) files.push(absolute)
  }
  return files
}

const rootStat = await stat(root).catch(() => null)
if (!rootStat?.isDirectory()) {
  console.error(`Project directory not found: ${root}`)
  process.exit(1)
}

const files = await walk(root)
const documents = await Promise.all(
  files.map(async (file) => ({ file, source: await readFile(file, 'utf8') })),
)
const all = documents.map((document) => document.source).join('\n')

const findings = []
function add(severity, id, message, evidence = []) {
  findings.push({ severity, id, message, evidence })
}

function evidenceFor(pattern) {
  return documents
    .filter((document) => pattern.test(document.source))
    .slice(0, 5)
    .map((document) => path.relative(root, document.file))
}

const usesThree = /\bfrom\s+['"]three(?:\/webgpu)?['"]|THREE\./.test(all)
const usesR3f = /@react-three\/fiber/.test(all)
const webgpu = /WebGPURenderer|three\/webgpu/.test(all)
const classicShader = /(?:Raw)?ShaderMaterial|onBeforeCompile/.test(all)
const effectComposer = /EffectComposer/.test(all)

if (!usesThree && !usesR3f) add('critical', 'three-missing', 'No Three.js or R3F usage found.')

if (webgpu && classicShader) {
  add(
    'critical',
    'webgpu-classic-shader',
    'WebGPURenderer is mixed with ShaderMaterial/RawShaderMaterial/onBeforeCompile; port custom work to TSL or keep WebGLRenderer.',
    evidenceFor(/WebGPURenderer|ShaderMaterial|onBeforeCompile/),
  )
}

if (webgpu && effectComposer) {
  add(
    'critical',
    'webgpu-effect-composer',
    'WebGPURenderer is mixed with classic EffectComposer; use the current TSL/RenderPipeline path.',
    evidenceFor(/WebGPURenderer|EffectComposer/),
  )
}

const hasDprCap =
  /setPixelRatio\s*\(\s*Math\.min/.test(all) ||
  /\bdpr\s*=\s*\{\s*\[\s*1\s*,\s*(?:1\.[0-9]+|2)\s*\]\s*\}/.test(all) ||
  /AdaptiveDpr|PerformanceMonitor/.test(all)
if ((usesThree || usesR3f) && !hasDprCap) {
  add('warning', 'dpr-cap', 'No obvious device-pixel-ratio cap or adaptive DPR policy found.')
}

const hasResize =
  /ResizeObserver|addEventListener\s*\(\s*['"]resize['"]/.test(all) || usesR3f
if ((usesThree || usesR3f) && !hasResize) {
  add('warning', 'resize', 'No ResizeObserver/window resize handling found.')
}

if (/PerspectiveCamera/.test(all) && hasResize && !/updateProjectionMatrix/.test(all) && !usesR3f) {
  add('critical', 'projection-update', 'Perspective camera resize handling may omit updateProjectionMatrix().')
}

if (/TextureLoader/.test(all) && !/SRGBColorSpace|colorSpace/.test(all)) {
  add(
    'warning',
    'texture-color-space',
    'TextureLoader is used but no explicit color-space assignment was found; verify color and data textures.',
  )
}

if (
  /requestAnimationFrame|setAnimationLoop|useFrame/.test(all) &&
  !/\bdelta\b|getDelta|getElapsedTime|timeMs|elapsed/.test(all)
) {
  add('warning', 'frame-rate', 'Animation loop found without obvious delta/elapsed time handling.')
}

const allocatesInsideInlineFrameCallback =
  /useFrame\s*\([\s\S]{0,160}?=>\s*\{[\s\S]{0,600}?new THREE\.(?:Vector[234]|Color|Matrix[34]|Quaternion)\s*\(/.test(
    all,
  ) ||
  /setAnimationLoop\s*\(\s*(?:function\s*)?\([^)]*\)\s*=>?\s*\{[\s\S]{0,600}?new THREE\.(?:Vector[234]|Color|Matrix[34]|Quaternion)\s*\(/.test(
    all,
  )

if (allocatesInsideInlineFrameCallback) {
  add(
    'warning',
    'frame-allocation',
    'Possible Three.js object allocation in a frame callback; inspect and reuse scratch values.',
  )
}

if (
  /new THREE\.(?:WebGLRenderer|WebGPURenderer)|<Canvas/.test(all) &&
  !/dispose\s*\(|return\s*\(\s*\)\s*=>|destroy\s*\(/.test(all)
) {
  add('warning', 'cleanup', 'No obvious cleanup/disposal path found.')
}

if (
  /requestAnimationFrame|setAnimationLoop|useFrame|autoRotate|Float/.test(all) &&
  !/prefers-reduced-motion|reducedMotion|useReducedMotion/.test(all)
) {
  add('warning', 'reduced-motion', 'Continuous motion found without an obvious reduced-motion path.')
}

if (
  /<canvas|document\.createElement\s*\(\s*['"]canvas['"]|<Canvas/.test(all) &&
  !/aria-label|aria-describedby|aria-hidden|fallback=/.test(all)
) {
  add('warning', 'canvas-semantics', 'Canvas found without obvious accessibility semantics or fallback.')
}

if (/PointLight[\s\S]{0,200}castShadow\s*=\s*true/.test(all)) {
  add('info', 'point-shadow', 'Point-light shadows render six faces; confirm the cost is justified.')
}

if (/DoubleSide/.test(all)) {
  add('info', 'double-side', 'DoubleSide is used; verify it is intentional rather than hiding winding/normal issues.')
}

if (/transparent\s*[:=]\s*true/.test(all) && !/depthWrite/.test(all)) {
  add('info', 'transparent-depth', 'Transparent material found; verify depthWrite, sorting, and blending.')
}

if (!findings.length) add('pass', 'static-pass', 'No findings from the bounded static audit.')

const summary = findings.reduce(
  (counts, finding) => {
    counts[finding.severity] = (counts[finding.severity] || 0) + 1
    return counts
  },
  {},
)

if (json) {
  console.log(JSON.stringify({ root, files: files.length, summary, findings }, null, 2))
} else {
  console.log(`Three.js audit: ${root}`)
  console.log(`Scanned ${files.length} source files`)
  for (const finding of findings) {
    const suffix = finding.evidence?.length ? ` (${finding.evidence.join(', ')})` : ''
    console.log(`[${finding.severity.toUpperCase()}] ${finding.id}: ${finding.message}${suffix}`)
  }
}

const hasCritical = findings.some((finding) => finding.severity === 'critical')
const hasWarning = findings.some((finding) => finding.severity === 'warning')
if (hasCritical || (strict && hasWarning)) process.exitCode = 1
