import { expect, test, type Page } from '@playwright/test'

function failOnRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  return errors
}

async function expectReadyCanvas(page: Page) {
  await expect(page.locator('body')).toHaveAttribute('data-experience-state', 'ready')
  const dimensions = await page.locator('.scene-stage canvas').evaluate((canvas) => ({
    clientWidth: canvas.clientWidth,
    clientHeight: canvas.clientHeight,
    width: (canvas as HTMLCanvasElement).width,
    height: (canvas as HTMLCanvasElement).height,
  }))
  expect(dimensions.clientWidth).toBeGreaterThan(300)
  expect(dimensions.clientHeight).toBeGreaterThan(300)
  expect(dimensions.width).toBeGreaterThan(300)
  expect(dimensions.height).toBeGreaterThan(300)
}

test('home renders one healthy procedural world and semantic content', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.goto('/')

  await expect(page).toHaveTitle('Orbit — Creative Systems')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Digital products with a pulse.')
  await expect(page.getByRole('link', { name: 'Orbit home' })).toBeVisible()
  await expectReadyCanvas(page)

  await page.getByRole('button', { name: 'Wake the studio' }).click()
  await expect(page.getByRole('link', { name: 'Meet the crew' })).toBeVisible()
  expect(errors).toEqual([])
})

test('careers deep-links, exposes roles, and keeps navigation functional', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.goto('/careers')

  await expect(page).toHaveTitle('Careers — Orbit')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Come make useful things strange.')
  await expectReadyCanvas(page)

  await page.getByRole('button', { name: 'View open roles' }).click()
  await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Creative Web Engineer/ })).toBeVisible()
  await page.getByRole('button', { name: 'Close open roles' }).click()
  await expect(page.getByRole('heading', { name: 'Open roles' })).toBeHidden()

  await page.getByRole('link', { name: 'Home', exact: true }).first().click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Digital products with a pulse.')
  expect(errors).toEqual([])
})

test('menu is keyboard-dismissible and route-aware', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.goto('/')

  await page.getByRole('button', { name: 'Menu' }).click()
  const menu = page.getByRole('dialog', { name: 'Explore Orbit' })
  await expect(menu).toBeVisible()
  await expect(page.getByRole('button', { name: /Close/ })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
  expect(errors).toEqual([])
})

test('desktop pointer drives camera parallax and named 3D hover feedback', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expectReadyCanvas(page)
  const canvas = page.locator('.scene-stage canvas')

  await page.mouse.move(40, 420)
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-shift-x'))).toBeLessThan(-0.55)
  await page.mouse.move(1400, 420)
  await expect.poll(async () => Number(await canvas.getAttribute('data-camera-shift-x'))).toBeGreaterThan(0.55)

  await page.mouse.move(620, 220)
  await expect(canvas).toHaveAttribute('data-scene-hover', 'portal')
  await expect(page.locator('.scene-cursor')).toContainText('Idea portal')

  await page.getByRole('link', { name: 'Careers', exact: true }).first().click()
  await expect(canvas).toHaveAttribute('data-world-mode', 'careers')
  await expect.poll(async () => Number(await canvas.getAttribute('data-route-delta'))).toBeLessThan(0.22)
  await page.mouse.move(620, 220)
  await expect(canvas).toHaveAttribute('data-scene-hover', 'opportunity-beacon')
  expect(errors).toEqual([])
})

test('mobile layout stays inside the viewport on both routes', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expectReadyCanvas(page)

  const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(homeOverflow).toBeLessThanOrEqual(0)

  await page.getByRole('link', { name: 'Open careers' }).click()
  await expect(page).toHaveURL('/careers')
  await page.getByRole('button', { name: 'View open roles' }).click()
  await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible()
  const careersOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  expect(careersOverflow).toBeLessThanOrEqual(0)
  expect(errors).toEqual([])
})

test('reduced-motion preference still produces a ready experience', async ({ page }) => {
  const errors = failOnRuntimeErrors(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/careers')
  await expectReadyCanvas(page)
  await page.getByRole('button', { name: 'Ring the launch bell' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(errors).toEqual([])
})
