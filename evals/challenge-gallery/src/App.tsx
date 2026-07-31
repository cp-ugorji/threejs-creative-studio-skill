import { AdaptiveDpr, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, type CSSProperties, useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { challenges } from './challenges'

function initialNumber() {
  const value = Number(new URLSearchParams(location.search).get('challenge') || 1)
  return THREE.MathUtils.clamp(Math.round(value), 1, challenges.length)
}

function cameraRig(
  position: [number, number, number],
  target: [number, number, number],
  paused: boolean,
) {
  return function CameraRig() {
    const camera = useThree((state) => state.camera)
    const desired = useMemo(() => new THREE.Vector3(...position), [position])
    const lookAt = useMemo(() => new THREE.Vector3(...target), [target])

    useEffect(() => {
      camera.position.copy(desired)
      camera.lookAt(lookAt)
      camera.updateProjectionMatrix()
    }, [camera, desired, lookAt])

    useFrame((state, delta) => {
      if (paused) return
      const drift = Math.sin(state.clock.elapsedTime * 0.18) * 0.08
      camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y + drift, 2, delta)
      camera.lookAt(lookAt)
    })
    return null
  }
}

export function App() {
  const [number, setNumber] = useState(initialNumber)
  const [reducedMotion, setReducedMotion] = useState(true)
  const challenge = challenges[number - 1]
  const qa = new URLSearchParams(location.search).get('qa') === '1'
  const paused = qa || reducedMotion
  const Scene = challenge.component
  const CameraRig = useMemo(
    () => cameraRig(challenge.camera, challenge.target, paused),
    [challenge.camera, challenge.target, paused],
  )

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    params.set('challenge', String(number))
    history.replaceState(null, '', `${location.pathname}?${params}`)
  }, [number])

  const go = (next: number) => {
    const wrapped = ((next - 1 + challenges.length) % challenges.length) + 1
    setNumber(wrapped)
  }

  return (
    <main
      className="gallery"
      data-gallery-ready="true"
      style={{ '--accent': challenge.accent } as CSSProperties}
    >
      <header className="gallery__header">
        <a className="brand" href="?challenge=1" aria-label="Three.js challenge gallery home">
          <span className="brand__mark" aria-hidden="true">
            3
          </span>
          <span>
            Three.js Creative Studio
            <small>24-scene skill evaluation</small>
          </span>
        </a>

        <label className="picker">
          <span>Scene</span>
          <select value={number} onChange={(event) => setNumber(Number(event.target.value))}>
            {challenges.map((item) => (
              <option key={item.number} value={item.number}>
                {String(item.number).padStart(2, '0')} — {item.title}
              </option>
            ))}
          </select>
        </label>
      </header>

      <section className="gallery__canvas" aria-label={`${challenge.title} 3D challenge scene`}>
        <Canvas
          key={challenge.slug}
          aria-label={`${challenge.title}: ${challenge.thesis}`}
          camera={{ fov: 38, near: 0.1, far: 120, position: challenge.camera }}
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          shadows
          fallback={<p className="fallback">3D rendering is unavailable on this device.</p>}
        >
          <color attach="background" args={[challenge.background]} />
          <fogExp2 attach="fog" args={[challenge.background, 0.025]} />
          <Suspense fallback={null}>
            <Scene paused={paused} />
            <CameraRig />
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping={!paused}
              minDistance={4}
              maxDistance={14}
              minPolarAngle={Math.PI * 0.14}
              maxPolarAngle={Math.PI * 0.48}
              target={challenge.target}
            />
            <AdaptiveDpr pixelated />
          </Suspense>
        </Canvas>
      </section>

      <section
        className="gallery__copy"
        data-challenge-number={number}
        aria-labelledby="challenge-title"
      >
        <p className="counter">
          Challenge {String(number).padStart(2, '0')} / {challenges.length}
        </p>
        <h1 id="challenge-title">{challenge.title}</h1>
        <p className="thesis">{challenge.thesis}</p>
        <p className="technique">{challenge.technique}</p>
      </section>

      <nav className="gallery__nav" aria-label="Challenge navigation">
        <button type="button" onClick={() => go(number - 1)} aria-label="Previous challenge">
          <span aria-hidden="true">←</span>
          <span>Previous</span>
        </button>
        <button type="button" onClick={() => go(number + 1)} aria-label="Next challenge">
          <span>Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </nav>

      <p className="gesture">Drag to orbit · scroll to zoom</p>
    </main>
  )
}
