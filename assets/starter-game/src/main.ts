import './style.css'
import { Game } from './Game'
import type { ArenaSnapshot, SimulationEvent } from './simulation'

const canvas = document.querySelector<HTMLCanvasElement>('[data-game-canvas]')
const score = document.querySelector<HTMLElement>('[data-score]')
const health = document.querySelector<HTMLElement>('[data-health]')
const announcement = document.querySelector<HTMLElement>('[data-announcement]')
if (!canvas || !score || !health || !announcement) throw new Error('Game shell is incomplete')

let lastAnnouncement = 'Ready to play.'
const game = new Game(canvas, {
  onSnapshot(snapshot: ArenaSnapshot, events: readonly SimulationEvent[]) {
    score.textContent = `${snapshot.score} / 3`
    health.textContent = String(snapshot.health)
    const event = events.at(-1)
    const next = event ? messageForEvent(event) : messageForState(snapshot.state)
    if (next !== lastAnnouncement) {
      lastAnnouncement = next
      announcement.textContent = next
    }
    document.body.dataset.gameState = snapshot.state
  },
})

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-command]')) {
  button.addEventListener('click', () => {
    if (button.dataset.command === 'start') game.start()
    if (button.dataset.command === 'pause') game.togglePause()
    if (button.dataset.command === 'reset') game.reset()
  })
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-action]')) {
  const action = button.dataset.action ?? ''
  const release = () => game.setAction(action, false)
  button.addEventListener('pointerdown', (event) => {
    button.setPointerCapture(event.pointerId)
    game.setAction(action, true)
  })
  button.addEventListener('pointerup', release)
  button.addEventListener('pointercancel', release)
  button.addEventListener('lostpointercapture', release)
}

window.addEventListener('pagehide', () => game.destroy(), { once: true })

function messageForState(state: ArenaSnapshot['state']) {
  if (state === 'playing') return 'Collect the signals.'
  if (state === 'paused') return 'Paused.'
  if (state === 'won') return 'All signals collected. Garden restored.'
  if (state === 'lost') return 'Energy depleted. Reset to try again.'
  return 'Ready to play.'
}

function messageForEvent(event: SimulationEvent) {
  if (event.type === 'collected') return `Signal ${event.id ?? ''} collected.`
  if (event.type === 'damaged') return 'The roaming pulse drained one energy.'
  if (event.type === 'won') return 'All signals collected. Garden restored.'
  return 'Energy depleted. Reset to try again.'
}
