#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const args = process.argv.slice(2)
const valueFor = (flag) => {
  const index = args.indexOf(flag)
  return index >= 0 ? args[index + 1] : undefined
}

const url = valueFor('--url') ?? 'http://127.0.0.1:4187'
const output = path.resolve(valueFor('--out') ?? '../../artifacts/orbit-motion')
await mkdir(output, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: output, size: { width: 1440, height: 900 } },
})
const page = await context.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`)
})

await page.goto(url, { waitUntil: 'networkidle' })
await page.locator('body[data-experience-state="ready"]').waitFor()
await page.waitForTimeout(700)

for (let step = 0; step <= 32; step += 1) {
  const progress = step / 32
  await page.mouse.move(90 + progress * 1260, 420 - Math.sin(progress * Math.PI) * 150)
  await page.waitForTimeout(32)
}

for (const point of [[688, 424], [688, 492], [620, 220]]) {
  await page.mouse.move(point[0], point[1])
  await page.waitForTimeout(650)
}

await page.getByRole('link', { name: 'Careers', exact: true }).first().click()
await page.waitForTimeout(2200)
for (const point of [[688, 424], [824, 424], [552, 492], [620, 220]]) {
  await page.mouse.move(point[0], point[1])
  await page.waitForTimeout(560)
}

await page.getByRole('button', { name: 'Ring the launch bell' }).click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: 'View open roles' }).click()
await page.waitForTimeout(900)
await page.getByRole('button', { name: 'Close open roles' }).click()
await page.waitForTimeout(500)

const video = page.video()
await page.close()
const videoPath = path.join(output, 'orbit-interactions.webm')
if (video) await video.saveAs(videoPath)
await context.close()
await browser.close()

const report = { url, video: videoPath, errors }
await writeFile(path.join(output, 'record-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
if (errors.length) process.exitCode = 1
