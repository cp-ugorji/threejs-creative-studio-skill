#!/usr/bin/env node

import { cp, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)

function valueFor(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

function fail(message) {
  console.error(`threejs scaffold: ${message}`)
  process.exit(1)
}

const stack = valueFor('--stack')
const outputArg = valueFor('--out')
const projectName =
  (valueFor('--name') || (outputArg ? path.basename(path.resolve(outputArg)) : '')).trim()
const packageName = projectName
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9.-]+/g, '-')
  .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
  .slice(0, 214)

if (!['vanilla', 'r3f', 'vue', 'game'].includes(stack)) {
  fail('pass --stack vanilla, r3f, vue, or game')
}

if (!outputArg) {
  fail('pass --out /absolute/or/relative/target')
}

if (!projectName || projectName.length > 80 || /[\u0000-\u001f]/.test(projectName)) {
  fail('project name must be 1–80 printable characters')
}

if (!packageName) {
  fail('project name must include at least one ASCII letter or digit')
}

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const template = path.join(skillRoot, 'assets', `starter-${stack}`)
const output = path.resolve(outputArg)

async function ensureEmptyTarget(target) {
  try {
    const targetStat = await stat(target)
    if (!targetStat.isDirectory()) fail(`target exists and is not a directory: ${target}`)
    const entries = await readdir(target)
    if (entries.length > 0) fail(`refusing to overwrite non-empty target: ${target}`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await mkdir(target, { recursive: true })
  }
}

async function replaceTokens(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await replaceTokens(absolute)
      continue
    }
    if (!/\.(?:html|json|css|ts|tsx|js|md)$/.test(entry.name)) continue
    const source = await readFile(absolute, 'utf8')
    const next = source
      .replaceAll('__PROJECT_NAME__', projectName)
      .replaceAll('__PROJECT_PACKAGE_NAME__', packageName)
    if (next !== source) await writeFile(absolute, next)
  }
}

await ensureEmptyTarget(output)
await cp(template, output, { recursive: true })
await replaceTokens(output)

console.log(`Created ${stack} Three.js starter at ${output}`)
console.log(`Next: cd ${output}`)
console.log('Then: pnpm install && pnpm dev')
