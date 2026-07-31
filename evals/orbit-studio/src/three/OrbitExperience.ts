import * as THREE from 'three'
import { createWorlds, type HoverPart, type OrbitWorlds } from './worlds'

export type WorldMode = 'home' | 'careers'

export interface SceneHover {
  id: string
  label: string
}

const WORLD_CENTERS: Record<WorldMode, number> = { home: 0, careers: 15 }

function getWorldCenter(mode: WorldMode) {
  return WORLD_CENTERS[mode] ?? WORLD_CENTERS.home
}

export class OrbitExperience {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 80)
  private readonly renderer: THREE.WebGLRenderer
  private readonly clock = new THREE.Clock()
  private readonly resizeObserver: ResizeObserver
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly worlds: OrbitWorlds
  private readonly raycaster = new THREE.Raycaster()
  private readonly intersections: THREE.Intersection[] = []
  private readonly pointer = new THREE.Vector2()
  private readonly smoothPointer = new THREE.Vector2()
  private readonly zeroPointer = new THREE.Vector2()
  private readonly lookTarget = new THREE.Vector3()
  private targetCenter = 0
  private currentCenter = 0
  private pulseStartedAt = -10
  private currentMode: WorldMode
  private hoveredPart: HoverPart | null = null
  private pointerInside = false
  private pointerOverUi = false
  private destroyed = false
  private pageHidden = false
  private width = 1
  private height = 1

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initialMode: WorldMode,
    private readonly onHover?: (hover: SceneHover | null) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.04
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.worlds = createWorlds()
    this.scene.add(this.worlds.home, this.worlds.careers, this.worlds.bridge)
    this.buildLighting()

    this.targetCenter = getWorldCenter(initialMode)
    this.currentCenter = this.targetCenter
    this.currentMode = initialMode
    this.canvas.dataset.worldMode = initialMode
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerout', this.onPointerOut)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.reducedMotion.addEventListener('change', this.onReducedMotionChange)
    this.resize()
    this.renderer.setAnimationLoop(this.render)
    if (this.reducedMotion.matches) this.render()
  }

  setMode(mode: WorldMode) {
    this.currentMode = mode
    this.targetCenter = getWorldCenter(mode)
    this.canvas.dataset.worldMode = mode
    this.setHoveredPart(null)
    if (this.reducedMotion.matches) {
      this.currentCenter = this.targetCenter
      this.render()
    }
  }

  pulse() {
    this.pulseStartedAt = this.clock.elapsedTime
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerout', this.onPointerOut)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.reducedMotion.removeEventListener('change', this.onReducedMotionChange)
    this.renderer.setAnimationLoop(null)
    this.setHoveredPart(null)

    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      geometries.add(object.geometry)
      const ownedMaterials = Array.isArray(object.material) ? object.material : [object.material]
      ownedMaterials.forEach((ownedMaterial) => materials.add(ownedMaterial))
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((ownedMaterial) => ownedMaterial.dispose())
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
  }

  private buildLighting() {
    this.scene.add(new THREE.HemisphereLight('#fff9eb', '#8f78ae', 2.15))

    const key = new THREE.DirectionalLight('#fff3dc', 4.4)
    key.position.set(-4, 9, 6)
    key.castShadow = true
    key.shadow.mapSize.set(1536, 1536)
    key.shadow.camera.left = -15
    key.shadow.camera.right = 18
    key.shadow.camera.top = 10
    key.shadow.camera.bottom = -8
    key.shadow.camera.near = 1
    key.shadow.camera.far = 34
    key.shadow.bias = -0.0004
    this.scene.add(key)

    const mintRim = new THREE.PointLight('#bdf6d0', 18, 16, 2)
    mintRim.position.set(-4, 3, -3)
    this.scene.add(mintRim)

    const coralRim = new THREE.PointLight('#ff9d82', 16, 18, 2)
    coralRim.position.set(15, 4, 2)
    this.scene.add(coralRim)
  }

  private readonly onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      this.pointerInside = false
      return
    }
    const rect = this.canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) / Math.max(1, rect.width)
    const y = (event.clientY - rect.top) / Math.max(1, rect.height)
    this.pointerInside = x >= 0 && x <= 1 && y >= 0 && y <= 1
    this.pointerOverUi = event.target instanceof Element && Boolean(event.target.closest('a, button, [role="dialog"]'))
    this.pointer.set(THREE.MathUtils.clamp(x * 2 - 1, -1, 1), THREE.MathUtils.clamp(1 - y * 2, -1, 1))
    this.canvas.dataset.pointerX = this.pointer.x.toFixed(3)
    this.canvas.dataset.pointerY = this.pointer.y.toFixed(3)
  }

  private readonly onPointerOut = (event: PointerEvent) => {
    if (event.relatedTarget) return
    this.pointerInside = false
    this.setHoveredPart(null)
  }

  private readonly onVisibilityChange = () => {
    this.pageHidden = document.hidden
    if (!this.pageHidden) this.clock.getDelta()
  }

  private readonly onReducedMotionChange = () => {
    if (this.reducedMotion.matches) {
      this.currentCenter = this.targetCenter
      this.smoothPointer.set(0, 0)
      this.setHoveredPart(null)
      this.render()
    }
  }

  private findHoverOwner(object: THREE.Object3D) {
    for (let node: THREE.Object3D | null = object; node; node = node.parent) {
      const id = node.userData.interactiveId
      if (!id) continue
      return this.worlds.hoverTargets.find((target) => target.id === id) ?? null
    }
    return null
  }

  private setHoveredPart(next: HoverPart | null) {
    if (this.hoveredPart === next) return
    this.hoveredPart = next
    if (next) this.canvas.dataset.sceneHover = next.id
    else delete this.canvas.dataset.sceneHover
    this.onHover?.(next ? { id: next.id, label: next.label } : null)
  }

  private updateHover(delta: number, reduced: boolean, pulse: number) {
    let next: HoverPart | null = null
    const routeSettled = Math.abs(this.currentCenter - this.targetCenter) < 0.22
    this.canvas.dataset.hoverReady = String(this.pointerInside && !this.pointerOverUi && routeSettled)
    this.canvas.dataset.pointerInside = String(this.pointerInside)
    this.canvas.dataset.pointerOverUi = String(this.pointerOverUi)
    this.canvas.dataset.routeDelta = Math.abs(this.currentCenter - this.targetCenter).toFixed(3)
    if (this.pointerInside && !this.pointerOverUi && routeSettled) {
      this.intersections.length = 0
      this.raycaster.setFromCamera(this.pointer, this.camera)
      const activeWorld = this.currentMode === 'home' ? this.worlds.home : this.worlds.careers
      this.scene.updateMatrixWorld(true)
      this.raycaster.intersectObject(activeWorld, true, this.intersections)
      this.canvas.dataset.rayHits = String(this.intersections.length)
      for (const intersection of this.intersections) {
        next = this.findHoverOwner(intersection.object)
        if (next) break
      }
    }
    this.setHoveredPart(next)

    const ease = reduced ? 1 : 1 - Math.exp(-10 * delta)
    for (const target of this.worlds.hoverTargets) {
      target.hoverAmount = THREE.MathUtils.lerp(target.hoverAmount, target === next ? 1 : 0, ease)
      const pulseAmount = target.pulse ? pulse : 0
      const scale = target.baseScale * (1 + target.hoverAmount * (reduced ? 0.035 : 0.085) + pulseAmount * 0.18)
      target.object.scale.setScalar(scale)
      target.object.rotation.x = target.baseRotationX + target.hoverAmount * (reduced ? 0 : 0.035)
      target.object.rotation.z = target.baseRotationZ - target.hoverAmount * (reduced ? 0 : 0.025)
    }
  }

  private resize() {
    this.width = Math.max(1, this.canvas.clientWidth)
    this.height = Math.max(1, this.canvas.clientHeight)
    const aspect = this.width / this.height
    const mobile = aspect < 0.72
    const halfHeight = mobile ? 6.65 : aspect > 1.7 ? 4.35 : 4.75

    this.camera.left = -halfHeight * aspect
    this.camera.right = halfHeight * aspect
    this.camera.top = halfHeight
    this.camera.bottom = -halfHeight
    this.camera.updateProjectionMatrix()

    this.worlds.home.scale.setScalar(mobile ? 0.82 : 1)
    this.worlds.careers.scale.setScalar(mobile ? 0.82 : 1)
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))
    this.renderer.setSize(this.width, this.height, false)
  }

  private readonly render = () => {
    if (this.destroyed || this.pageHidden) return
    const clockDelta = this.clock.getDelta()
    const delta = Number.isFinite(clockDelta) ? Math.min(Math.max(clockDelta, 0), 0.05) : 0
    const elapsed = this.clock.elapsedTime
    const reduced = this.reducedMotion.matches
    const routeEase = reduced ? 1 : 1 - Math.exp(-3.6 * delta)
    const pointerEase = reduced ? 1 : 1 - Math.exp(-5.2 * delta)

    if (!Number.isFinite(this.targetCenter)) this.targetCenter = getWorldCenter(this.currentMode)
    if (!Number.isFinite(this.currentCenter)) this.currentCenter = this.targetCenter
    this.currentCenter = THREE.MathUtils.lerp(this.currentCenter, this.targetCenter, routeEase)
    this.smoothPointer.lerp(reduced ? this.zeroPointer : this.pointer, pointerEase)

    if (!reduced) {
      for (const part of this.worlds.animated) {
        part.object.position.y = part.baseY + Math.sin(elapsed * part.speed + part.phase) * part.amplitude
        part.object.rotation.y += delta * part.spin
      }
      this.worlds.home.position.y = Math.sin(elapsed * 0.46) * 0.055
      this.worlds.careers.position.y = Math.sin(elapsed * 0.43 + 1.4) * 0.055
    }

    const pulseAge = elapsed - this.pulseStartedAt
    const pulse = pulseAge >= 0 && pulseAge < 1.15 && !reduced ? Math.sin(pulseAge * Math.PI / 1.15) : 0
    const mobile = this.width / this.height < 0.72
    const cameraX = this.currentCenter + (mobile ? 6.9 : 7.8) + this.smoothPointer.x * (mobile ? 0.28 : 0.78)
    const cameraY = (mobile ? 7.7 : 6.9) + this.smoothPointer.y * (mobile ? 0.18 : 0.48)
    const cameraZ = mobile ? 11.5 : 10.4
    this.camera.position.set(cameraX, cameraY, cameraZ)
    this.canvas.dataset.cameraShiftX = (this.smoothPointer.x * (mobile ? 0.28 : 0.78)).toFixed(3)
    this.lookTarget.set(
      this.currentCenter - this.smoothPointer.x * (mobile ? 0.05 : 0.18),
      (mobile ? 0.28 : 0.46) + this.smoothPointer.y * (mobile ? 0.03 : 0.09),
      0,
    )
    this.camera.lookAt(this.lookTarget)
    this.camera.updateMatrixWorld()

    const worldTiltX = reduced || mobile ? 0 : this.smoothPointer.y * 0.018
    const worldTiltY = reduced || mobile ? 0 : this.smoothPointer.x * 0.038
    this.worlds.home.rotation.x = worldTiltX
    this.worlds.home.rotation.y = worldTiltY
    this.worlds.careers.rotation.x = worldTiltX
    this.worlds.careers.rotation.y = worldTiltY

    this.updateHover(delta, reduced, pulse)
    this.renderer.render(this.scene, this.camera)
  }
}
