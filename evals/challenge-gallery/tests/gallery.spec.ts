import { expect, test } from '@playwright/test'

test('all 24 challenge themes render without browser errors', async ({ page }) => {
  const browserErrors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text())
  })
  page.on('pageerror', (error) => browserErrors.push(error.message))

  for (let number = 1; number <= 24; number += 1) {
    await page.goto(`/?challenge=${number}&qa=1`, { waitUntil: 'networkidle' })
    await expect(page.locator('[data-gallery-ready="true"]')).toBeVisible()
    await expect(page.locator('[data-challenge-number]')).toHaveAttribute(
      'data-challenge-number',
      String(number),
    )
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
    const box = await canvas.boundingBox()
    expect(box?.width).toBeGreaterThan(300)
    expect(box?.height).toBeGreaterThan(300)
    const capture = await canvas.screenshot()
    expect(capture.byteLength).toBeGreaterThan(8_000)
  }

  expect(browserErrors).toEqual([])
})

test('navigation and mobile composition remain operable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/?challenge=1&qa=1', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Next challenge' }).click()
  await expect(page.locator('[data-challenge-number]')).toHaveAttribute(
    'data-challenge-number',
    '2',
  )
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Lego')
  await expect(page.locator('canvas')).toBeVisible()
})
