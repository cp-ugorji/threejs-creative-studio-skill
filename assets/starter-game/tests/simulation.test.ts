import assert from 'node:assert/strict'
import test from 'node:test'
import { ArenaSimulation, FIXED_STEP, type PlayerIntent } from '../src/simulation'

const idle: PlayerIntent = { moveX: 0, moveY: 0, dashPressed: false }

function runScript() {
  const simulation = new ArenaSimulation()
  simulation.start()
  for (let tick = 0; tick < 180; tick += 1) {
    simulation.step({ moveX: tick < 55 ? 1 : -0.45, moveY: tick > 90 ? -1 : 0, dashPressed: tick === 10 }, FIXED_STEP)
  }
  return simulation.snapshot()
}

test('the same input script produces the same simulation snapshot', () => {
  assert.deepEqual(runScript(), runScript())
})

test('pause freezes authoritative time and reset restores the fixture', () => {
  const simulation = new ArenaSimulation()
  simulation.start()
  simulation.step(idle)
  simulation.pause()
  const paused = simulation.snapshot()
  for (let index = 0; index < 120; index += 1) simulation.step(idle)
  assert.deepEqual(simulation.snapshot(), paused)

  simulation.reset()
  assert.deepEqual(simulation.snapshot(), {
    state: 'ready', tick: 0, score: 0, health: 3,
    playerX: 0, playerZ: 0, enemyX: 0, enemyZ: 2.55,
    dashCooldown: 0, collectedCoinIds: [],
  })
})
