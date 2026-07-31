import { Edges, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { type ReactNode, useMemo, useRef } from 'react'
import * as THREE from 'three'

export function seeded(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function SceneLights({
  accent = '#ffffff',
  warm = '#fff2d0',
  intensity = 3.5,
}: {
  accent?: string
  warm?: string
  intensity?: number
}) {
  return (
    <>
      <hemisphereLight args={['#b8d9ff', '#191125', 1.25]} />
      <directionalLight
        castShadow
        color={warm}
        intensity={intensity}
        position={[5, 8, 5]}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <pointLight color={accent} intensity={18} distance={10} decay={2} position={[-4, 2, -3]} />
    </>
  )
}

export function Pedestal({
  color = '#242936',
  radius = 2.8,
  y = -0.65,
}: {
  color?: string
  radius?: number
  y?: number
}) {
  return (
    <mesh receiveShadow position={[0, y, 0]}>
      <cylinderGeometry args={[radius * 0.94, radius, 0.32, 64]} />
      <meshStandardMaterial color={color} roughness={0.48} metalness={0.28} />
    </mesh>
  )
}

export function MotionRig({
  children,
  paused,
  speed = 0.16,
  bob = 0.06,
  position = [0, 0, 0],
}: {
  children: ReactNode
  paused: boolean
  speed?: number
  bob?: number
  position?: [number, number, number]
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => {
    if (!ref.current || paused) return
    ref.current.rotation.y += delta * speed
    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * speed * 3.4) * bob
  })
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  )
}

export function ParticleCloud({
  seed = 1,
  count = 120,
  color = '#ffffff',
  size = 0.06,
  spread = [7, 5, 7],
  center = [0, 1, 0],
  paused = false,
  speed = 0.04,
}: {
  seed?: number
  count?: number
  color?: string
  size?: number
  spread?: [number, number, number]
  center?: [number, number, number]
  paused?: boolean
  speed?: number
}) {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const random = seeded(seed)
    const data = new Float32Array(count * 3)
    for (let index = 0; index < count; index += 1) {
      data[index * 3] = center[0] + (random() - 0.5) * spread[0]
      data[index * 3 + 1] = center[1] + (random() - 0.5) * spread[1]
      data[index * 3 + 2] = center[2] + (random() - 0.5) * spread[2]
    }
    return data
  }, [center, count, seed, spread])

  useFrame((_state, delta) => {
    if (points.current && !paused) points.current.rotation.y += delta * speed
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={0.82}
        depthWrite={false}
      />
    </points>
  )
}

export function Tree({
  position = [0, 0, 0],
  scale = 1,
  foliage = '#2f8f5b',
  trunk = '#6f452c',
}: {
  position?: [number, number, number]
  scale?: number
  foliage?: string
  trunk?: string
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.9, 8]} />
        <meshStandardMaterial color={trunk} roughness={0.86} />
      </mesh>
      {[0.9, 1.25, 1.58].map((y, index) => (
        <mesh key={y} castShadow position={[0, y, 0]}>
          <coneGeometry args={[0.74 - index * 0.12, 0.9, 9]} />
          <meshStandardMaterial color={foliage} roughness={0.78} />
        </mesh>
      ))}
    </group>
  )
}

export function Rock({
  position,
  scale = [1, 1, 1],
  color = '#59606d',
}: {
  position: [number, number, number]
  scale?: [number, number, number]
  color?: string
}) {
  return (
    <mesh castShadow receiveShadow position={position} scale={scale} rotation={[0.2, 0.4, -0.12]}>
      <dodecahedronGeometry args={[0.62, 0]} />
      <meshStandardMaterial color={color} roughness={0.92} flatShading />
    </mesh>
  )
}

export function LegoBrick({
  position,
  color,
  size = [1.2, 0.42, 0.8],
  rotation = [0, 0, 0],
}: {
  position: [number, number, number]
  color: string
  size?: [number, number, number]
  rotation?: [number, number, number]
}) {
  const columns = Math.max(1, Math.round(size[0] / 0.45))
  const rows = Math.max(1, Math.round(size[2] / 0.45))
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={size} radius={0.06} smoothness={2} castShadow>
        <meshStandardMaterial color={color} roughness={0.32} />
      </RoundedBox>
      {Array.from({ length: columns * rows }, (_, index) => {
        const x = ((index % columns) - (columns - 1) / 2) * 0.42
        const z = (Math.floor(index / columns) - (rows - 1) / 2) * 0.42
        return (
          <mesh key={index} castShadow position={[x, size[1] / 2 + 0.07, z]}>
            <cylinderGeometry args={[0.13, 0.13, 0.12, 20]} />
            <meshStandardMaterial color={color} roughness={0.28} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Gift({
  position,
  color = '#d7475c',
  ribbon = '#ffd36a',
  scale = 1,
}: {
  position: [number, number, number]
  color?: string
  ribbon?: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.85, 0.7, 0.85]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.16, 0.72, 0.87]} />
        <meshStandardMaterial color={ribbon} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.87, 0.72, 0.16]} />
        <meshStandardMaterial color={ribbon} roughness={0.5} />
      </mesh>
    </group>
  )
}

export function Fish({
  position,
  color = '#ff9f43',
  scale = 1,
  flip = false,
}: {
  position: [number, number, number]
  color?: string
  scale?: number
  flip?: boolean
}) {
  return (
    <group position={position} scale={[flip ? -scale : scale, scale, scale]}>
      <mesh castShadow scale={[0.8, 0.42, 0.28]}>
        <sphereGeometry args={[0.52, 20, 12]} />
        <meshStandardMaterial color={color} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[-0.56, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.34, 0.58, 3]} />
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>
      <mesh position={[0.34, 0.1, 0.24]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshBasicMaterial color="#081018" />
      </mesh>
    </group>
  )
}

export function OutlineBox({
  args,
  position = [0, 0, 0],
  color = '#ffffff',
  opacity = 0.18,
  children,
}: {
  args: [number, number, number]
  position?: [number, number, number]
  color?: string
  opacity?: number
  children?: ReactNode
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshPhysicalMaterial
        color={color}
        transparent
        opacity={opacity}
        roughness={0.12}
        metalness={0}
        depthWrite={false}
      />
      <Edges color={color} />
      {children}
    </mesh>
  )
}
