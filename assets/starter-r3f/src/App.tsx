import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Experience } from './Experience'

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return reduced
}

export function App() {
  const reducedMotion = useReducedMotion()
  const [view, setView] = useState<'left' | 'front' | 'right'>('front')

  useEffect(() => {
    document.body.dataset.experienceState = 'ready'
    return () => {
      delete document.body.dataset.experienceState
    }
  }, [])

  return (
    <main className="shell">
      <section className="copy">
        <p className="eyebrow">Interactive study</p>
        <h1>Shape the brief into one memorable world.</h1>
        <p>
          Drag to inspect the sculpture, or use a labelled view. The composition adapts to
          motion preferences and small screens.
        </p>
        <div className="actions" aria-label="3D viewer controls">
          {(['left', 'front', 'right'] as const).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={view === name}
              onClick={() => setView(name)}
            >
              {name[0].toUpperCase() + name.slice(1)} view
            </button>
          ))}
        </div>
      </section>

      <section className="stage" aria-label="3D scene">
        <Canvas
          aria-label="Interactive abstract sculptural object"
          camera={{ fov: 42, near: 0.1, far: 50, position: [0, 2.4, 6.5] }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          shadows
          fallback={<p className="fallback">3D is unavailable on this device.</p>}
        >
          <Suspense fallback={null}>
            <Experience reducedMotion={reducedMotion} view={view} />
          </Suspense>
        </Canvas>
        <p className="sr-only">
          A faceted blue sculpture floats above a dark circular platform under cool studio
          lighting.
        </p>
      </section>
    </main>
  )
}
