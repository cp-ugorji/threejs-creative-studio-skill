import './style.css'
import { Experience } from './Experience'

const canvas = document.querySelector<HTMLCanvasElement>('[data-three-canvas]')
if (!canvas) throw new Error('Three.js canvas not found')

const experience = new Experience(canvas)
document.body.dataset.experienceState = 'ready'

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view]')) {
  button.addEventListener('click', () => {
    experience.setView(button.dataset.view ?? 'front')
  })
}

window.addEventListener('pagehide', () => experience.destroy(), { once: true })
