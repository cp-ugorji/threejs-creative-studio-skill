import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

export interface AnimatedPart {
  object: THREE.Object3D
  baseY: number
  amplitude: number
  speed: number
  phase: number
  spin: number
}

export interface HoverPart {
  id: string
  label: string
  object: THREE.Object3D
  baseScale: number
  baseRotationX: number
  baseRotationZ: number
  hoverAmount: number
  pulse: boolean
}

export interface OrbitWorlds {
  home: THREE.Group
  careers: THREE.Group
  bridge: THREE.Group
  animated: AnimatedPart[]
  hoverTargets: HoverPart[]
}

const palette = {
  ink: '#2b2248',
  deep: '#554178',
  milk: '#fffaf1',
  paper: '#f5efe7',
  lilac: '#a994e8',
  lilacDark: '#7860bd',
  mint: '#bceac4',
  mintDark: '#6eb895',
  apricot: '#ffbb8f',
  coral: '#f47c73',
  yellow: '#f7d66c',
  blue: '#86bddd',
  sky: '#c6e6ed',
}

function standard(color: string, roughness = 0.62, metalness = 0.02) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

function physical(color: string, roughness = 0.28, metalness = 0.04) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  })
}

const material = {
  ink: standard(palette.ink, 0.5, 0.05),
  deep: standard(palette.deep, 0.48),
  milk: standard(palette.milk, 0.82),
  paper: standard(palette.paper, 0.78),
  lilac: physical(palette.lilac, 0.34),
  lilacDark: standard(palette.lilacDark, 0.46),
  mint: standard(palette.mint, 0.7),
  mintDark: standard(palette.mintDark, 0.58),
  apricot: physical(palette.apricot, 0.38),
  coral: standard(palette.coral, 0.56),
  yellow: standard(palette.yellow, 0.58),
  blue: standard(palette.blue, 0.54),
  sky: standard(palette.sky, 0.74),
  glass: new THREE.MeshPhysicalMaterial({
    color: '#e7f9f3',
    roughness: 0.08,
    metalness: 0,
    transmission: 0.35,
    transparent: true,
    opacity: 0.76,
    depthWrite: false,
    thickness: 0.6,
  }),
}

function finish<T extends THREE.Mesh>(mesh: T, cast = true, receive = false) {
  mesh.castShadow = cast
  mesh.receiveShadow = receive
  return mesh
}

function rounded(
  width: number,
  height: number,
  depth: number,
  radius: number,
  surface: THREE.Material,
) {
  return finish(new THREE.Mesh(new RoundedBoxGeometry(width, height, depth, 5, radius), surface))
}

function cylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  surface: THREE.Material,
  segments = 48,
) {
  return finish(
    new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), surface),
  )
}

function sphere(radius: number, surface: THREE.Material, detail = 2) {
  return finish(new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), surface))
}

function addHoverTarget(
  hoverTargets: HoverPart[],
  object: THREE.Object3D,
  id: string,
  label: string,
  pulse = false,
) {
  object.userData.interactiveId = id
  const target: HoverPart = {
    id,
    label,
    object,
    baseScale: object.scale.x,
    baseRotationX: object.rotation.x,
    baseRotationZ: object.rotation.z,
    hoverAmount: 0,
    pulse,
  }
  hoverTargets.push(target)
  return target
}

function addPlatform(group: THREE.Group, colors: [THREE.Material, THREE.Material], radius = 3.65) {
  const underside = cylinder(radius * 0.86, radius, 0.72, colors[0], 72)
  underside.position.y = -0.58
  underside.receiveShadow = true
  group.add(underside)

  const top = cylinder(radius * 0.96, radius * 0.98, 0.22, colors[1], 72)
  top.position.y = -0.13
  top.receiveShadow = true
  group.add(top)

  const inset = cylinder(radius * 0.58, radius * 0.6, 0.025, material.paper, 72)
  inset.position.y = 0.002
  inset.receiveShadow = true
  group.add(inset)
}

function addPlant(group: THREE.Group, x: number, z: number, scale = 1) {
  const plant = new THREE.Group()
  plant.position.set(x, 0.06, z)
  plant.scale.setScalar(scale)

  const pot = cylinder(0.26, 0.2, 0.42, material.apricot, 32)
  pot.position.y = 0.2
  plant.add(pot)

  const stem = cylinder(0.035, 0.05, 0.86, material.mintDark, 12)
  stem.position.y = 0.77
  plant.add(stem)

  const leafGeometry = new THREE.SphereGeometry(0.25, 20, 12)
  const leaves: Array<[number, number, number, number]> = [
    [-0.15, 0.65, 0, -0.65],
    [0.18, 0.85, 0.02, 0.7],
    [-0.11, 1.04, -0.04, -0.45],
    [0.13, 1.19, 0.03, 0.42],
  ]
  for (const [leafX, y, leafZ, rotation] of leaves) {
    const leaf = finish(new THREE.Mesh(leafGeometry, material.mint))
    leaf.position.set(leafX, y, leafZ)
    leaf.scale.set(0.72, 0.28, 0.38)
    leaf.rotation.z = rotation
    plant.add(leaf)
  }
  group.add(plant)
}

function addChair(
  group: THREE.Group,
  x: number,
  z: number,
  rotation: number,
  surface: THREE.Material,
  scale = 1,
) {
  const chair = new THREE.Group()
  chair.position.set(x, 0.02, z)
  chair.rotation.y = rotation
  chair.scale.setScalar(scale)

  const seat = rounded(0.72, 0.2, 0.7, 0.13, surface)
  seat.position.y = 0.66
  chair.add(seat)

  const back = rounded(0.72, 0.74, 0.18, 0.12, surface)
  back.position.set(0, 1.02, 0.29)
  back.rotation.x = -0.1
  chair.add(back)

  for (const legX of [-0.24, 0.24]) {
    const leg = cylinder(0.045, 0.055, 0.55, material.ink, 12)
    leg.position.set(legX, 0.33, 0)
    chair.add(leg)
  }
  group.add(chair)
}

function addScreen(group: THREE.Group, x: number, y: number, z: number, rotation = 0) {
  const screen = new THREE.Group()
  screen.position.set(x, y, z)
  screen.rotation.y = rotation

  const frame = rounded(1.12, 0.74, 0.12, 0.1, material.ink)
  screen.add(frame)
  const face = rounded(0.94, 0.58, 0.025, 0.07, material.sky)
  face.position.z = 0.072
  screen.add(face)

  const bars: Array<[number, number, number, THREE.Material]> = [
    [-0.24, 0.14, 0.32, material.coral],
    [0.1, 0.14, 0.22, material.yellow],
    [-0.14, -0.12, 0.5, material.lilacDark],
  ]
  for (const [barX, barY, width, surface] of bars) {
    const bar = rounded(width, 0.07, 0.02, 0.02, surface)
    bar.position.set(barX, barY, 0.09)
    screen.add(bar)
  }
  group.add(screen)
}

function addHomeWorld(animated: AnimatedPart[], hoverTargets: HoverPart[]) {
  const home = new THREE.Group()
  home.name = 'home-world'
  addPlatform(home, [material.lilacDark, material.milk])

  const portal = new THREE.Group()
  portal.position.set(-1.45, 0.08, -0.72)
  portal.rotation.y = 0.2
  const arch = finish(
    new THREE.Mesh(new THREE.TorusGeometry(1.03, 0.16, 14, 60, Math.PI), material.apricot),
  )
  arch.position.y = 1.18
  portal.add(arch)
  for (const x of [-1.03, 1.03]) {
    const post = rounded(0.32, 1.18, 0.34, 0.12, material.apricot)
    post.position.set(x, 0.57, 0)
    portal.add(post)
  }
  const portalCore = sphere(0.48, material.glass, 3)
  portalCore.position.y = 1.12
  portal.add(portalCore)
  home.add(portal)
  addHoverTarget(hoverTargets, portal, 'portal', 'Idea portal')

  const orbit = new THREE.Group()
  orbit.position.set(0.15, 0.82, 0.2)
  const core = sphere(0.35, material.coral, 3)
  orbit.add(core)
  const orbitRing = finish(new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.055, 12, 56), material.ink))
  orbitRing.rotation.set(1.05, 0.2, 0.18)
  orbit.add(orbitRing)
  const satellite = sphere(0.1, material.yellow, 2)
  satellite.position.set(0.64, 0.12, 0.16)
  orbit.add(satellite)
  home.add(orbit)
  animated.push({ object: orbit, baseY: orbit.position.y, amplitude: 0.11, speed: 0.72, phase: 0, spin: 0.16 })
  addHoverTarget(hoverTargets, orbit, 'idea-core', 'Idea core', true)

  const desk = rounded(1.65, 0.18, 0.78, 0.1, material.mint)
  desk.position.set(1.22, 0.76, -0.92)
  desk.rotation.y = -0.2
  home.add(desk)
  for (const legX of [0.65, 1.79]) {
    const leg = cylinder(0.055, 0.065, 0.72, material.ink, 12)
    leg.position.set(legX, 0.38, -0.92)
    home.add(leg)
  }
  addScreen(home, 1.16, 1.35, -0.93, -0.2)

  const stool = cylinder(0.34, 0.31, 0.18, material.coral, 32)
  stool.position.set(1.9, 0.48, -0.15)
  home.add(stool)
  const stoolStem = cylinder(0.045, 0.06, 0.46, material.ink, 12)
  stoolStem.position.set(1.9, 0.23, -0.15)
  home.add(stoolStem)

  const sofa = new THREE.Group()
  sofa.position.set(1.02, 0.05, 1.55)
  sofa.rotation.y = -0.38
  const sofaSeat = rounded(1.8, 0.38, 0.82, 0.2, material.lilac)
  sofaSeat.position.y = 0.46
  sofa.add(sofaSeat)
  const sofaBack = rounded(1.8, 0.82, 0.25, 0.18, material.lilac)
  sofaBack.position.set(0, 0.89, 0.33)
  sofa.add(sofaBack)
  for (const x of [-0.72, 0, 0.72]) {
    const cushion = rounded(0.58, 0.23, 0.52, 0.12, x === 0 ? material.apricot : material.milk)
    cushion.position.set(x, 0.72, -0.02)
    cushion.rotation.x = -0.08
    sofa.add(cushion)
  }
  home.add(sofa)
  addHoverTarget(hoverTargets, sofa, 'lounge', 'Studio lounge')

  addPlant(home, -2.45, 1.25, 1.08)
  addPlant(home, 2.52, 0.8, 0.72)

  const stepColors = [material.coral, material.yellow, material.blue]
  for (let i = 0; i < 3; i += 1) {
    const step = rounded(0.78, 0.15 + i * 0.12, 0.8, 0.12, stepColors[i])
    step.position.set(-2.15 + i * 0.58, 0.12 + i * 0.06, 2.05)
    step.rotation.y = -0.16
    home.add(step)
  }

  const lampStem = cylinder(0.04, 0.055, 1.42, material.ink, 12)
  lampStem.position.set(2.38, 0.72, -1.72)
  lampStem.rotation.z = -0.12
  home.add(lampStem)
  const lamp = sphere(0.24, material.yellow, 2)
  lamp.position.set(2.29, 1.44, -1.72)
  home.add(lamp)

  return home
}

function addCareersWorld(animated: AnimatedPart[], hoverTargets: HoverPart[]) {
  const careers = new THREE.Group()
  careers.name = 'careers-world'
  careers.position.x = 15
  addPlatform(careers, [material.coral, material.milk], 3.82)

  const beacon = new THREE.Group()
  beacon.position.set(-1.85, 0.04, -0.9)
  beacon.rotation.y = 0.2
  const beaconBody = rounded(1.5, 2.56, 0.5, 0.22, material.ink)
  beaconBody.position.y = 1.28
  beacon.add(beaconBody)
  const beaconFace = rounded(1.25, 2.18, 0.05, 0.16, material.sky)
  beaconFace.position.set(0, 1.3, 0.28)
  beacon.add(beaconFace)
  const signalLines: Array<[number, number, number, THREE.Material]> = [
    [-0.28, 1.82, 0.5, material.coral],
    [-0.12, 1.5, 0.82, material.lilacDark],
    [-0.32, 1.18, 0.42, material.mintDark],
    [-0.08, 0.86, 0.9, material.yellow],
  ]
  for (const [x, y, width, surface] of signalLines) {
    const line = rounded(width, 0.1, 0.03, 0.03, surface)
    line.position.set(x, y, 0.32)
    beacon.add(line)
  }
  const beaconLight = sphere(0.18, material.coral, 2)
  beaconLight.position.y = 2.82
  beacon.add(beaconLight)
  careers.add(beacon)
  animated.push({ object: beaconLight, baseY: beaconLight.position.y, amplitude: 0.09, speed: 1.1, phase: 1.8, spin: 0 })
  addHoverTarget(hoverTargets, beacon, 'opportunity-beacon', 'Opportunity beacon')

  const tableGroup = new THREE.Group()
  tableGroup.position.set(0.58, 0, 0.12)
  const table = cylinder(1.18, 1.12, 0.18, material.mint, 56)
  table.position.y = 0.82
  tableGroup.add(table)
  const tableStem = cylinder(0.13, 0.38, 0.78, material.ink, 24)
  tableStem.position.y = 0.4
  tableGroup.add(tableStem)
  const tableCore = sphere(0.28, material.apricot, 3)
  tableCore.position.y = 1.28
  tableGroup.add(tableCore)

  const tableRing = finish(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 12, 56), material.deep))
  tableRing.position.y = 1.28
  tableRing.rotation.x = Math.PI / 2
  tableGroup.add(tableRing)
  careers.add(tableGroup)
  animated.push({ object: tableRing, baseY: tableRing.position.y, amplitude: 0.04, speed: 0.9, phase: 0.5, spin: 0.28 })
  addHoverTarget(hoverTargets, tableGroup, 'collaboration-table', 'Collaboration table', true)

  addChair(careers, 0.55, 1.85, Math.PI, material.yellow, 0.9)
  addChair(careers, 1.88, 0.24, Math.PI / 2, material.lilac, 0.9)
  addChair(careers, 0.42, -1.56, 0, material.apricot, 0.9)

  const tower = new THREE.Group()
  tower.position.set(2.28, 0, 1.42)
  const towerStem = cylinder(0.12, 0.2, 1.86, material.deep, 18)
  towerStem.position.y = 0.93
  tower.add(towerStem)
  for (const [i, radius] of [0.68, 0.5, 0.34].entries()) {
    const ring = finish(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.07, 10, 42), i === 1 ? material.coral : material.apricot))
    ring.position.y = 1.2 + i * 0.36
    ring.rotation.x = Math.PI / 2
    tower.add(ring)
    animated.push({ object: ring, baseY: ring.position.y, amplitude: 0.03, speed: 0.7 + i * 0.14, phase: i, spin: i % 2 ? -0.3 : 0.3 })
  }
  const towerOrb = sphere(0.22, material.yellow, 3)
  towerOrb.position.y = 2.1
  tower.add(towerOrb)
  careers.add(tower)
  addHoverTarget(hoverTargets, tower, 'signal-tower', 'Signal tower', true)

  const sampleRack = new THREE.Group()
  sampleRack.position.set(-0.15, 0.04, 2.25)
  sampleRack.rotation.y = -0.12
  for (let i = 0; i < 4; i += 1) {
    const card = rounded(0.55, 0.72, 0.09, 0.08, [material.lilac, material.mint, material.apricot, material.blue][i])
    card.position.set((i - 1.5) * 0.48, 0.56 + Math.abs(i - 1.5) * 0.08, 0)
    card.rotation.z = (i - 1.5) * -0.08
    sampleRack.add(card)
  }
  careers.add(sampleRack)
  addHoverTarget(hoverTargets, sampleRack, 'work-samples', 'Work samples')

  addPlant(careers, -2.6, 1.35, 0.95)
  addPlant(careers, 2.72, -0.65, 0.76)

  const ramp = rounded(1.7, 0.22, 0.92, 0.14, material.lilac)
  ramp.position.set(-1.45, 0.12, 2.12)
  ramp.rotation.set(0, -0.2, 0.08)
  careers.add(ramp)

  return careers
}

function addBridge(animated: AnimatedPart[]) {
  const bridge = new THREE.Group()
  bridge.name = 'route-bridge'
  const bridgeObjects: Array<[number, number, number, number, THREE.Material]> = [
    [5, 0.4, -0.3, 0.22, material.coral],
    [7, 1.05, 0.5, 0.16, material.yellow],
    [9, 0.25, -0.6, 0.3, material.lilac],
    [10.8, 1.3, 0.1, 0.13, material.mintDark],
  ]
  bridgeObjects.forEach(([x, y, z, radius, surface], index) => {
    const bead = sphere(radius, surface, 2)
    bead.position.set(x, y, z)
    bridge.add(bead)
    animated.push({ object: bead, baseY: y, amplitude: 0.12, speed: 0.55 + index * 0.13, phase: index, spin: 0.1 })
  })
  return bridge
}

export function createWorlds(): OrbitWorlds {
  const animated: AnimatedPart[] = []
  const hoverTargets: HoverPart[] = []
  const home = addHomeWorld(animated, hoverTargets)
  const careers = addCareersWorld(animated, hoverTargets)
  const bridge = addBridge(animated)
  return { home, careers, bridge, animated, hoverTargets }
}
