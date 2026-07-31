#!/usr/bin/env node

import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const args = process.argv.slice(2)
const valueFor = (flag, fallback) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : fallback
}

const baseURL = valueFor('--url', 'http://127.0.0.1:4175')
const output = path.resolve(valueFor('--out', './artifacts/gallery'))
const width = Number(valueFor('--width', '640'))
const height = Number(valueFor('--height', '480'))
const sceneOnly = args.includes('--scene-only')

await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
  colorScheme: 'dark',
})
const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))

const captures = []
for (let number = 1; number <= 24; number += 1) {
  const response = await page.goto(`${baseURL}/?challenge=${number}&qa=1`, {
    waitUntil: 'networkidle',
    timeout: 30_000,
  })
  if (!response?.ok()) errors.push(`challenge ${number}: HTTP ${response?.status() ?? 'unknown'}`)
  await page.locator('[data-gallery-ready="true"]').waitFor()
  if (sceneOnly) {
    await page.addStyleTag({
      content:
        '.gallery__header,.gallery__copy,.gallery__nav,.gesture{display:none!important}.gallery__canvas{inset:0!important}',
    })
  }
  const title = (await page.locator('#challenge-title').textContent())?.trim() || `Challenge ${number}`
  const canvas = page.locator('canvas')
  await canvas.waitFor({ state: 'visible' })
  const filename = `${String(number).padStart(2, '0')}-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}.png`
  const screenshot = path.join(output, filename)
  const buffer = await canvas.screenshot({ path: screenshot })
  if (buffer.byteLength < 8_000) errors.push(`challenge ${number}: suspiciously small canvas capture`)
  captures.push({ number, title, screenshot, bytes: buffer.byteLength })
}

await browser.close()
const report = { baseURL, width, height, sceneOnly, captures, errors }
await writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (errors.length) process.exitCode = 1
