#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const args = process.argv.slice(2)
function valueFor(flag) {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

const url = valueFor('--url')
const output = path.resolve(valueFor('--out') || './artifacts')
const readySelector = valueFor('--ready-selector')
const requestedChannel = valueFor('--channel')

if (!url) {
  console.error(
    'Usage: node scripts/capture-threejs.mjs --url http://127.0.0.1:4173 --out ./artifacts [--ready-selector "[data-experience-state=ready]"]',
  )
  process.exit(1)
}

let playwright
try {
  const requireFromTarget = createRequire(path.join(process.cwd(), 'package.json'))
  try {
    playwright = requireFromTarget('playwright')
  } catch {
    playwright = requireFromTarget('@playwright/test')
  }
} catch {
  console.error(
    'Playwright is required in the current project. Install it with: pnpm add -D playwright',
  )
  process.exit(1)
}

await mkdir(output, { recursive: true })

let browser
let browserChannel = requestedChannel || 'bundled Chromium'
try {
  browser = await playwright.chromium.launch({
    headless: true,
    ...(requestedChannel ? { channel: requestedChannel } : {}),
  })
} catch (error) {
  if (requestedChannel || !String(error).includes("Executable doesn't exist")) throw error
  browserChannel = 'chrome'
  browser = await playwright.chromium.launch({ channel: 'chrome', headless: true })
}
const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]
const report = { url, browserChannel, captures: [], errors: [] }

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })

  const errors = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))

  const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
  if (!response?.ok()) errors.push(`navigation: HTTP ${response?.status() ?? 'unknown'}`)

  if (readySelector) {
    await page.locator(readySelector).waitFor({ timeout: 15_000 })
  }
  // A DOM-ready signal can be set before the first WebGL frame is composited. Give the browser
  // enough time for renderer initialization and at least two presentation frames before capture.
  await page.waitForTimeout(500)

  const canvases = await page.locator('canvas').evaluateAll((elements) =>
    elements.map((canvas) => {
      const rect = canvas.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }),
  )
  if (!canvases.length) errors.push('canvas: none found')
  if (canvases.some((canvas) => canvas.width < 2 || canvas.height < 2)) {
    errors.push('canvas: zero or near-zero display size')
  }

  const screenshot = path.join(output, `${viewport.name}-${viewport.width}x${viewport.height}.png`)
  await page.screenshot({ path: screenshot, fullPage: true })

  report.captures.push({ ...viewport, screenshot, canvases, errors })
  report.errors.push(...errors.map((error) => `${viewport.name}: ${error}`))
  await page.close()
}

await browser.close()
await writeFile(path.join(output, 'capture-report.json'), JSON.stringify(report, null, 2))

console.log(JSON.stringify(report, null, 2))
if (report.errors.length) process.exitCode = 1
