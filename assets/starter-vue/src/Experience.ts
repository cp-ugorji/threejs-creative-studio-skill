import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const VIEW_POSITIONS: Record<string, THREE.Vector3Tuple> = {
  left: [-4.5, 2.2, 5],
  front: [0, 2.4, 6.5],
  right: [4.5, 2.2, 5],
}

export class Experience {
  private readonly scene = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50)
  private readonly renderer: THREE.WebGLRenderer
  private readonly controls: OrbitControls
  private readonly root = new THREE.Group()
  private readonly clock = new THREE.Clock()
  private readonly resizeObserver: ResizeObserver
  private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
  private readonly targetCamera = new THREE.Vector3(...VIEW_POSITIONS.front)
  private destroyed = false

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true

    this.scene.fog = new THREE.FogExp2('#ede8ff', 0.045)
    this.camera.position.copy(this.targetCamera)

    this.controls = new OrbitControls(this.camera, canvas)
    this.controls.enablePan = false
    this.controls.enableDamping = true
    this.controls.minDistance = 4
    this.controls.maxDistance = 9
    this.controls.minPolarAngle = Math.PI * 0.2
    this.controls.maxPolarAngle = Math.PI * 0.49
    this.controls.target.set(0, 0.7, 0)

    this.buildScene()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
    this.renderer.setAnimationLoop(this.render)
  }

  setView(name: string) {
    this.targetCamera.set(...(VIEW_POSITIONS[name] ?? VIEW_POSITIONS.front))
  }

  destroy() {
    if (this.destroyed) return
    this.destroyed = true
    this.resizeObserver.disconnect()
    this.controls.dispose()
    this.renderer.setAnimationLoop(null)
    this.root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.geometry.dispose()
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => material.dispose())
    })
    this.renderer.dispose()
  }

  private buildScene() {
    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.3, 0.28, 64),
      new THREE.MeshStandardMaterial({ color: '#fbf8ff', roughness: 0.72, metalness: 0.04 }),
    )
    platform.position.y = -0.45
    platform.receiveShadow = true
    this.root.add(platform)

    const hero = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.45, 3),
      new THREE.MeshPhysicalMaterial({
        color: '#7564d9',
        roughness: 0.22,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.16,
      }),
    )
    hero.name = 'hero'
    hero.scale.set(1, 1.15, 0.84)
    hero.position.y = 0.85
    hero.rotation.set(-0.12, 0.35, 0.08)
    hero.castShadow = true
    this.root.add(hero)
    this.scene.add(this.root)

    this.scene.add(new THREE.HemisphereLight('#f7f2ff', '#c6f2df', 2.2))

    const key = new THREE.DirectionalLight('#fff8ec', 4.8)
    key.position.set(4, 6, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 16
    this.scene.add(key)

    const rim = new THREE.PointLight('#9aead0', 24, 8, 2)
    rim.position.set(-3, 2, -2)
    this.scene.add(rim)
  }

  private resize() {
    const width = Math.max(1, this.canvas.clientWidth)
    const height = Math.max(1, this.canvas.clientHeight)
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, width < 600 ? 1.5 : 2))
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private readonly render = () => {
    if (this.destroyed) return
    const delta = Math.min(this.clock.getDelta(), 0.05)
    const elapsed = this.clock.elapsedTime
    const hero = this.root.getObjectByName('hero')

    if (hero && !this.reducedMotion.matches) {
      hero.position.y = 0.85 + Math.sin(elapsed * 0.8) * 0.08
      hero.rotation.y += delta * 0.12
    }

    this.camera.position.lerp(this.targetCamera, 1 - Math.exp(-4 * delta))
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
