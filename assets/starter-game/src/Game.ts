import * as THREE from 'three'
import {
  ArenaSimulation,
  COIN_FIXTURES,
  FIXED_STEP,
  type ArenaSnapshot,
  type PlayerIntent,
  type SimulationEvent,
} from './simulation'

type Action = 'up' | 'down' | 'left' | 'right' | 'dash'

interface GameCallbacks {
  onSnapshot(snapshot: ArenaSnapshot, events: readonly SimulationEvent[]): void
}

interface EffectInstance {
  mesh: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  age: number
  active: boolean
}

const KEY_ACTIONS: Record<string, Action> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'dash',
}

const EMPTY_EVENTS: readonly SimulationEvent[] = []

export class Game {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 80)
  private readonly renderer: THREE.WebGLRenderer
  private readonly simulation = new ArenaSimulation()
  private readonly snapshot = this.simulation.snapshot()
  private readonly frameEvents: SimulationEvent[] = []
  private readonly intent: PlayerIntent = { moveX: 0, moveY: 0, dashPressed: false }
  private readonly resizeObserver: ResizeObserver
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly root = new THREE.Group()
  private readonly player = new THREE.Group()
  private readonly enemy = new THREE.Group()
  private readonly coinMeshes = new Map<string, THREE.Object3D>()
  private readonly effects: EffectInstance[] = []
  private readonly actions = new Set<Action>()
  private readonly cameraTarget = new THREE.Vector3()
  private readonly cameraPositionTarget = new THREE.Vector3()
  private readonly cameraOffset = new THREE.Vector3(7.5, 8.6, 7.5)
  private readonly renderPlayerPosition = new THREE.Vector3()
  private readonly clock = new THREE.Clock()
  private accumulator = 0
  private dashWasHeld = false
  private publishedKey = ''
  private destroyed = false
  private pageHidden = false

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: GameCallbacks,
  ) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.scene.fog = new THREE.Fog('#17172c', 10, 28)
    this.buildWorld()
    this.camera.position.copy(this.cameraOffset)
    this.camera.lookAt(0, 0.15, 0)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('visibilitychange', this.onVisibilityChange)
    this.resize()
    this.syncPresentation(this.snapshot, EMPTY_EVENTS)
    this.renderer.setAnimationLoop(this.render)
  }

  start() {
    this.simulation.start()
    this.publish(this.simulation.snapshot(this.snapshot), EMPTY_EVENTS)
  }

  togglePause() {
    this.simulation.pause()
    this.actions.clear()
    this.dashWasHeld = false
    this.publish(this.simulation.snapshot(this.snapshot), EMPTY_EVENTS)
  }

  reset() {
    this.simulation.reset()
    this.actions.clear()
    this.dashWasHeld = false
    this.effects.forEach((effect) => {
      effect.active = false
      effect.mesh.visible = false
    })
    this.syncPresentation(this.simulation.snapshot(this.snapshot), EMPTY_EVENTS)
  }

  setAction(action: string, active: boolean) {
    if (!isAction(action)) return
    if (active) this.actions.add(action)
    else this.actions.delete(action)
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.resizeObserver.disconnect()
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.renderer.setAnimationLoop(null)
    this.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })
    this.renderer.renderLists.dispose()
    this.renderer.dispose()
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return
    if (event.code === 'KeyP') return this.togglePause()
    if (event.code === 'KeyR') return this.reset()
    const action = KEY_ACTIONS[event.code]
    if (!action) return
    event.preventDefault()
    this.actions.add(action)
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    const action = KEY_ACTIONS[event.code]
    if (action) this.actions.delete(action)
  }

  private readonly onVisibilityChange = () => {
    this.pageHidden = document.hidden
    this.actions.clear()
    this.dashWasHeld = false
    if (!this.pageHidden) this.clock.getDelta()
  }

  private buildWorld() {
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(5.5, 5.8, 0.38, 64),
      new THREE.MeshStandardMaterial({ color: '#34345b', roughness: 0.78, metalness: 0.08 }),
    )
    ground.position.y = -0.24
    ground.receiveShadow = true
    this.root.add(ground)

    const inner = new THREE.Mesh(
      new THREE.CircleGeometry(4.55, 64),
      new THREE.MeshStandardMaterial({ color: '#20213d', roughness: 0.92 }),
    )
    inner.rotation.x = -Math.PI / 2
    inner.position.y = -0.04
    inner.receiveShadow = true
    this.root.add(inner)

    const playerBody = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.32, 0.5, 6, 12),
      new THREE.MeshPhysicalMaterial({ color: '#ffdf6c', roughness: 0.28, clearcoat: 0.75 }),
    )
    playerBody.position.y = 0.58
    playerBody.castShadow = true
    this.player.add(playerBody)
    const playerArrow = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.42, 12),
      new THREE.MeshStandardMaterial({ color: '#ff735e', roughness: 0.42 }),
    )
    playerArrow.rotation.x = Math.PI / 2
    playerArrow.position.set(0, 0.56, -0.46)
    this.player.add(playerArrow)
    this.root.add(this.player)

    const enemyBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.48, 24, 18),
      new THREE.MeshPhysicalMaterial({ color: '#ff557c', roughness: 0.3, clearcoat: 0.65 }),
    )
    enemyBody.position.y = 0.52
    enemyBody.castShadow = true
    this.enemy.add(enemyBody)
    const warningRing = new THREE.Mesh(
      new THREE.RingGeometry(0.57, 0.68, 32),
      new THREE.MeshBasicMaterial({ color: '#ff557c', transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    )
    warningRing.rotation.x = -Math.PI / 2
    warningRing.position.y = 0.03
    this.enemy.add(warningRing)
    this.root.add(this.enemy)

    const coinColors = ['#ffbb55', '#6ff0bd', '#ab86ff']
    COIN_FIXTURES.forEach((coin, index) => {
      const group = new THREE.Group()
      const mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.105, 12, 28),
        new THREE.MeshPhysicalMaterial({ color: coinColors[index], roughness: 0.2, clearcoat: 0.8 }),
      )
      mesh.rotation.x = Math.PI / 2
      mesh.castShadow = true
      group.add(mesh)
      group.position.set(coin.x, 0.48, coin.z)
      this.coinMeshes.set(coin.id, group)
      this.root.add(group)
    })

    for (let index = 0; index < 8; index += 1) {
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.34, 28),
        new THREE.MeshBasicMaterial({ color: '#fff2ae', transparent: true, opacity: 0, side: THREE.DoubleSide }),
      )
      mesh.rotation.x = -Math.PI / 2
      mesh.visible = false
      this.effects.push({ mesh, age: 0, active: false })
      this.root.add(mesh)
    }

    this.scene.add(this.root)
    this.scene.add(new THREE.HemisphereLight('#aab7ff', '#161326', 2.4))
    const key = new THREE.DirectionalLight('#fff4db', 4.2)
    key.position.set(-5, 10, 5)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.left = -7
    key.shadow.camera.right = 7
    key.shadow.camera.top = 7
    key.shadow.camera.bottom = -7
    key.shadow.camera.near = 2
    key.shadow.camera.far = 24
    this.scene.add(key)
    const rim = new THREE.PointLight('#7e6cff', 22, 12, 2)
    rim.position.set(3, 3, -4)
    this.scene.add(rim)
  }

  private sampleIntent(): PlayerIntent {
    const dashHeld = this.actions.has('dash')
    this.intent.moveX = Number(this.actions.has('right')) - Number(this.actions.has('left'))
    this.intent.moveY = Number(this.actions.has('down')) - Number(this.actions.has('up'))
    this.intent.dashPressed = dashHeld && !this.dashWasHeld
    this.dashWasHeld = dashHeld
    return this.intent
  }

  private publish(snapshot: ArenaSnapshot, events: readonly SimulationEvent[]) {
    this.canvas.dataset.gameState = snapshot.state
    this.canvas.dataset.simulationTick = String(snapshot.tick)
    this.canvas.dataset.score = String(snapshot.score)
    this.canvas.dataset.health = String(snapshot.health)
    const publishedKey = `${snapshot.state}:${snapshot.score}:${snapshot.health}`
    if (publishedKey === this.publishedKey && events.length === 0) return
    this.publishedKey = publishedKey
    this.callbacks.onSnapshot(snapshot, events)
  }

  private syncPresentation(snapshot: ArenaSnapshot, events: readonly SimulationEvent[]) {
    this.renderPlayerPosition.set(snapshot.playerX, 0, snapshot.playerZ)
    this.player.position.copy(this.renderPlayerPosition)
    this.enemy.position.set(snapshot.enemyX, 0, snapshot.enemyZ)
    for (const [id, object] of this.coinMeshes) object.visible = !snapshot.collectedCoinIds.includes(id)
    this.processEvents(snapshot, events)
    this.publish(snapshot, events)
  }

  private processEvents(snapshot: ArenaSnapshot, events: readonly SimulationEvent[]) {
    for (const event of events) {
      if (event.type === 'collected') this.spawnEffect(snapshot.playerX, snapshot.playerZ, '#fff2ae')
      if (event.type === 'damaged') this.spawnEffect(snapshot.enemyX, snapshot.enemyZ, '#ff557c')
    }
  }

  private spawnEffect(x: number, z: number, color: THREE.ColorRepresentation) {
    const effect = this.effects.find((candidate) => !candidate.active) ?? this.effects[0]
    effect.active = true
    effect.age = 0
    effect.mesh.visible = true
    effect.mesh.position.set(x, 0.04, z)
    effect.mesh.scale.setScalar(1)
    effect.mesh.material.color.set(color)
    effect.mesh.material.opacity = 0.8
  }

  private updateEffects(delta: number) {
    for (const effect of this.effects) {
      if (!effect.active) continue
      effect.age += delta
      const progress = effect.age / (this.reducedMotion.matches ? 0.28 : 0.62)
      if (progress >= 1) {
        effect.active = false
        effect.mesh.visible = false
        continue
      }
      effect.mesh.scale.setScalar(1 + progress * (this.reducedMotion.matches ? 0.45 : 2.3))
      effect.mesh.material.opacity = (1 - progress) * 0.78
    }
  }

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth)
    const height = Math.max(1, this.canvas.clientHeight)
    const aspect = width / height
    const halfHeight = aspect < 0.8 ? 6.4 : 5.25
    this.camera.left = -halfHeight * aspect
    this.camera.right = halfHeight * aspect
    this.camera.top = halfHeight
    this.camera.bottom = -halfHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, width < 700 ? 1.5 : 2))
    this.renderer.setSize(width, height, false)
  }

  private readonly render = () => {
    if (this.destroyed || this.pageHidden) return
    const rawDelta = this.clock.getDelta()
    const delta = Number.isFinite(rawDelta) ? Math.min(Math.max(rawDelta, 0), 0.1) : 0
    this.accumulator += delta
    this.frameEvents.length = 0
    while (this.accumulator >= FIXED_STEP) {
      this.simulation.step(this.sampleIntent(), FIXED_STEP, this.frameEvents)
      this.accumulator -= FIXED_STEP
    }

    const snapshot = this.simulation.snapshot(this.snapshot)
    const reduced = this.reducedMotion.matches
    this.renderPlayerPosition.set(snapshot.playerX, 0, snapshot.playerZ)
    this.player.position.lerp(this.renderPlayerPosition, reduced ? 1 : 1 - Math.exp(-18 * delta))
    this.enemy.position.set(snapshot.enemyX, 0, snapshot.enemyZ)
    if (!reduced) this.enemy.rotation.y += delta * 1.2
    for (const [id, object] of this.coinMeshes) {
      object.visible = !snapshot.collectedCoinIds.includes(id)
      if (object.visible && !this.reducedMotion.matches) object.rotation.y += delta * 1.45
    }

    this.cameraTarget.lerp(this.player.position, reduced ? 1 : 1 - Math.exp(-4.8 * delta))
    this.cameraPositionTarget.copy(this.cameraTarget).add(this.cameraOffset)
    this.camera.position.lerp(this.cameraPositionTarget, reduced ? 1 : 1 - Math.exp(-4.2 * delta))
    this.camera.lookAt(this.cameraTarget.x, 0.15, this.cameraTarget.z)
    this.camera.updateMatrixWorld()
    this.processEvents(snapshot, this.frameEvents)
    this.updateEffects(delta)
    this.publish(snapshot, this.frameEvents)
    this.renderer.render(this.scene, this.camera)
  }
}

function isAction(value: string): value is Action {
  return value === 'up' || value === 'down' || value === 'left' || value === 'right' || value === 'dash'
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}
