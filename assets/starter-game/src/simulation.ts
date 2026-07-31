export const FIXED_STEP = 1 / 60

export type GameState = 'ready' | 'playing' | 'paused' | 'won' | 'lost'

export interface PlayerIntent {
  moveX: number
  moveY: number
  dashPressed: boolean
}

export interface SimulationEvent {
  type: 'collected' | 'damaged' | 'won' | 'lost'
  id?: string
}

export interface ArenaSnapshot {
  state: GameState
  tick: number
  score: number
  health: number
  playerX: number
  playerZ: number
  enemyX: number
  enemyZ: number
  dashCooldown: number
  collectedCoinIds: string[]
}

export const COIN_FIXTURES = [
  { id: 'amber', x: 1.6, z: 0 },
  { id: 'mint', x: -1.7, z: 1.7 },
  { id: 'violet', x: 0, z: -2.15 },
] as const

const ARENA_LIMIT = 4.1
const MOVE_SPEED = 3.1
const DASH_MULTIPLIER = 2.25
const DASH_DURATION = 0.16
const DASH_COOLDOWN = 0.8
const COLLECT_RADIUS_SQUARED = 0.48 ** 2
const DAMAGE_RADIUS_SQUARED = 0.68 ** 2

export class ArenaSimulation {
  private state: GameState = 'ready'
  private tick = 0
  private score = 0
  private health = 3
  private playerX = 0
  private playerZ = 0
  private enemyX = 0
  private enemyZ = 2.55
  private dashRemaining = 0
  private dashCooldown = 0
  private invulnerability = 0
  private readonly collected = new Set<string>()

  start() {
    if (this.state === 'won' || this.state === 'lost') this.reset()
    this.state = 'playing'
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused'
    else if (this.state === 'paused') this.state = 'playing'
  }

  reset() {
    this.state = 'ready'
    this.tick = 0
    this.score = 0
    this.health = 3
    this.playerX = 0
    this.playerZ = 0
    this.enemyX = 0
    this.enemyZ = 2.55
    this.dashRemaining = 0
    this.dashCooldown = 0
    this.invulnerability = 0
    this.collected.clear()
  }

  step(intent: PlayerIntent, delta = FIXED_STEP, events: SimulationEvent[] = []): SimulationEvent[] {
    if (this.state !== 'playing') return events
    this.tick += 1
    this.dashCooldown = Math.max(0, this.dashCooldown - delta)
    this.dashRemaining = Math.max(0, this.dashRemaining - delta)
    this.invulnerability = Math.max(0, this.invulnerability - delta)

    if (intent.dashPressed && this.dashCooldown === 0) {
      this.dashRemaining = DASH_DURATION
      this.dashCooldown = DASH_COOLDOWN
    }

    const length = Math.hypot(intent.moveX, intent.moveY)
    const normalizer = length > 1 ? 1 / length : 1
    const speed = MOVE_SPEED * (this.dashRemaining > 0 ? DASH_MULTIPLIER : 1)
    this.playerX = clamp(this.playerX + intent.moveX * normalizer * speed * delta, -ARENA_LIMIT, ARENA_LIMIT)
    this.playerZ = clamp(this.playerZ + intent.moveY * normalizer * speed * delta, -ARENA_LIMIT, ARENA_LIMIT)

    const simulationTime = this.tick * FIXED_STEP
    this.enemyX = Math.sin(simulationTime * 1.25) * 2.65
    this.enemyZ = 2.35 + Math.cos(simulationTime * 0.7) * 0.34

    for (const coin of COIN_FIXTURES) {
      if (this.collected.has(coin.id)) continue
      if (distanceSquared(this.playerX, this.playerZ, coin.x, coin.z) > COLLECT_RADIUS_SQUARED) continue
      this.collected.add(coin.id)
      this.score += 1
      events.push({ type: 'collected', id: coin.id })
    }

    if (this.invulnerability === 0 && distanceSquared(this.playerX, this.playerZ, this.enemyX, this.enemyZ) < DAMAGE_RADIUS_SQUARED) {
      this.health -= 1
      this.invulnerability = 1.2
      this.playerX = 0
      this.playerZ = 0
      events.push({ type: 'damaged' })
    }

    if (this.score === COIN_FIXTURES.length) {
      this.state = 'won'
      events.push({ type: 'won' })
    } else if (this.health <= 0) {
      this.state = 'lost'
      events.push({ type: 'lost' })
    }
    return events
  }

  snapshot(target?: ArenaSnapshot): ArenaSnapshot {
    const snapshot = target ?? {
      state: 'ready', tick: 0, score: 0, health: 3,
      playerX: 0, playerZ: 0, enemyX: 0, enemyZ: 2.55,
      dashCooldown: 0, collectedCoinIds: [],
    }
    snapshot.state = this.state
    snapshot.tick = this.tick
    snapshot.score = this.score
    snapshot.health = this.health
    snapshot.playerX = this.playerX
    snapshot.playerZ = this.playerZ
    snapshot.enemyX = this.enemyX
    snapshot.enemyZ = this.enemyZ
    snapshot.dashCooldown = this.dashCooldown
    snapshot.collectedCoinIds.length = 0
    for (const id of this.collected) snapshot.collectedCoinIds.push(id)
    snapshot.collectedCoinIds.sort()
    return snapshot
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

function distanceSquared(ax: number, az: number, bx: number, bz: number) {
  const x = ax - bx
  const z = az - bz
  return x * x + z * z
}
