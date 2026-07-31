import { ContactShadows, Environment, OrbitControls, RoundedBox } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const VIEWS = {
  left: new THREE.Vector3(-4.5, 2.2, 5),
  front: new THREE.Vector3(0, 2.4, 6.5),
  right: new THREE.Vector3(4.5, 2.2, 5),
}

interface ExperienceProps {
  reducedMotion: boolean
  view: keyof typeof VIEWS
}

export function Experience({ reducedMotion, view }: ExperienceProps) {
  const hero = useRef<THREE.Mesh>(null)
  const camera = useThree((state) => state.camera)
  const target = useMemo(() => VIEWS[view].clone(), [view])

  useFrame((state, delta) => {
    const alpha = 1 - Math.exp(-4 * delta)
    camera.position.lerp(target, alpha)
    camera.lookAt(0, 0.7, 0)

    if (!hero.current || reducedMotion) return
    hero.current.position.y = 0.85 + Math.sin(state.clock.elapsedTime * 0.8) * 0.08
    hero.current.rotation.y += delta * 0.12
  })

  return (
    <>
      <color attach="background" args={['#080b11']} />
      <fogExp2 attach="fog" args={['#080b11', 0.055]} />

      <hemisphereLight args={['#8eb7ff', '#1c1027', 1.25]} />
      <directionalLight
        castShadow
        color="#dce9ff"
        intensity={4.5}
        position={[4, 6, 4]}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight color="#ff4fd8" intensity={28} distance={8} decay={2} position={[-3, 2, -2]} />

      <group>
        <RoundedBox args={[4.5, 0.3, 4.5]} radius={0.14} smoothness={4} position={[0, -0.45, 0]}>
          <meshStandardMaterial color="#171c2a" roughness={0.52} metalness={0.35} />
        </RoundedBox>

        <mesh
          ref={hero}
          castShadow
          position={[0, 0.85, 0]}
          rotation={[-0.12, 0.35, 0.08]}
          scale={[1, 1.15, 0.84]}
        >
          <icosahedronGeometry args={[1.45, 3]} />
          <meshPhysicalMaterial
            color="#3c7dff"
            roughness={0.24}
            metalness={0.18}
            clearcoat={0.8}
            clearcoatRoughness={0.18}
          />
        </mesh>
      </group>

      <ContactShadows position={[0, -0.28, 0]} scale={7} opacity={0.45} blur={2.5} far={4} />
      <Environment preset="city" environmentIntensity={0.4} />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={4}
        maxDistance={9}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 0.7, 0]}
      />
    </>
  )
}
