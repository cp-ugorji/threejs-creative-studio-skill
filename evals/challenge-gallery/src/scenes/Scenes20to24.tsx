import { RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../challenges'
import {
  Gift,
  MotionRig,
  ParticleCloud,
  Pedestal,
  Rock,
  SceneLights,
  Tree,
} from './Shared'

function Fireplace() {
  return (
    <group position={[-1.45, 0.28, -1.25]}>
      <mesh castShadow position={[0, 0.55, 0]}>
        <boxGeometry args={[1.65, 1.55, 0.72]} />
        <meshStandardMaterial color="#795445" roughness={0.86} />
      </mesh>
      <RoundedBox args={[0.9, 0.78, 0.08]} radius={0.12} position={[0, 0.42, 0.39]}>
        <meshStandardMaterial color="#20191a" roughness={0.8} />
      </RoundedBox>
      {[-0.18, 0.16].map((x, index) => (
        <mesh key={x} position={[x, 0.36 + index * 0.1, 0.5]} rotation={[0, 0, x * 1.4]}>
          <coneGeometry args={[0.22, 0.72, 10]} />
          <meshStandardMaterial
            color={index ? '#ffd06a' : '#ff713d'}
            emissive={index ? '#ffb13c' : '#ff4b25'}
            emissiveIntensity={3.8}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0.45, 1]} color="#ff9b55" intensity={34} distance={5} decay={2} />
      <mesh castShadow position={[0, 1.45, 0]}>
        <boxGeometry args={[1.95, 0.22, 0.92]} />
        <meshStandardMaterial color="#4f3933" roughness={0.72} />
      </mesh>
    </group>
  )
}

export function CozyPlaceScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffb35c" warm="#ffd098" intensity={2.3} />
      <MotionRig paused={paused} speed={0.018} bob={0}>
        <mesh receiveShadow position={[0, -0.58, 0]}>
          <boxGeometry args={[5.6, 0.22, 4.8]} />
          <meshStandardMaterial color="#47352f" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.35, -2.25]}>
          <boxGeometry args={[5.6, 3.65, 0.2]} />
          <meshStandardMaterial color="#312a32" roughness={0.88} />
        </mesh>
        <mesh position={[-2.7, 1.35, 0]}>
          <boxGeometry args={[0.2, 3.65, 4.8]} />
          <meshStandardMaterial color="#29252f" roughness={0.88} />
        </mesh>
        <Fireplace />
        <RoundedBox args={[2.15, 0.55, 1.3]} radius={0.18} position={[1.15, -0.08, 0.35]} castShadow>
          <meshStandardMaterial color="#31586c" roughness={0.75} />
        </RoundedBox>
        <RoundedBox args={[2.15, 1.3, 0.48]} radius={0.18} position={[1.15, 0.55, -0.1]} castShadow>
          <meshStandardMaterial color="#386177" roughness={0.74} />
        </RoundedBox>
        <mesh castShadow position={[0.55, 0.68, 0.45]}>
          <boxGeometry args={[0.68, 0.68, 0.23]} />
          <meshStandardMaterial color="#d7875e" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[1.72, 0.68, 0.45]}>
          <boxGeometry args={[0.68, 0.68, 0.23]} />
          <meshStandardMaterial color="#c3a45e" roughness={0.82} />
        </mesh>
        <mesh castShadow position={[0.9, -0.2, 1.4]}>
          <cylinderGeometry args={[0.82, 0.72, 0.18, 32]} />
          <meshStandardMaterial color="#6a4435" roughness={0.64} />
        </mesh>
        <mesh position={[0.9, -0.04, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.58, 32]} />
          <meshStandardMaterial color="#a97b5d" roughness={0.55} />
        </mesh>
        <group position={[0.82, 0.05, 1.38]} rotation={[0.04, 0.2, -0.05]}>
          <mesh>
            <boxGeometry args={[0.7, 0.06, 0.52]} />
            <meshStandardMaterial color="#e7d9bd" roughness={0.9} />
          </mesh>
          <mesh position={[0.38, 0.03, 0]}>
            <boxGeometry args={[0.06, 0.1, 0.52]} />
            <meshStandardMaterial color="#a84f47" />
          </mesh>
        </group>
      </MotionRig>
    </>
  )
}

function LightBand({
  y,
  radius,
  count,
  phase,
}: {
  y: number
  radius: number
  count: number
  phase: number
}) {
  const palette = ['#7dffcb', '#65d9ff', '#ffd46b', '#ff78a8']
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + phase
        const color = palette[index % palette.length]
        return (
          <mesh key={index} position={[Math.cos(angle) * radius, y, Math.sin(angle) * radius]}>
            <octahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
          </mesh>
        )
      })}
    </group>
  )
}

export function ChristmasThreeScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#7dffcb" warm="#d9fff1" intensity={3.2} />
      <Pedestal color="#132c33" radius={3} />
      <ParticleCloud seed={21} count={150} color="#d9ffff" size={0.035} spread={[6, 4.8, 6]} center={[0, 1.1, 0]} paused={paused} speed={0.04} />
      <MotionRig paused={paused} speed={0.14} bob={0.03}>
        {[0.25, 0.82, 1.4, 1.95].map((y, index) => (
          <group key={y}>
            <mesh castShadow position={[0, y, 0]}>
              <coneGeometry args={[1.75 - index * 0.34, 1.35, 8]} />
              <meshStandardMaterial color={index % 2 ? '#174e44' : '#12613f'} roughness={0.6} />
            </mesh>
            <LightBand y={y - 0.12} radius={1.45 - index * 0.29} count={11 - index} phase={index * 0.43} />
          </group>
        ))}
        <mesh position={[0, 2.78, 0]}>
          <octahedronGeometry args={[0.38, 0]} />
          <meshStandardMaterial color="#efffff" emissive="#7dffcb" emissiveIntensity={4.5} />
        </mesh>
      </MotionRig>
      <Gift position={[-1.15, -0.45, 0.7]} color="#d74468" ribbon="#7dffcb" scale={0.78} />
      <Gift position={[1.12, -0.45, 0.65]} color="#466fe8" ribbon="#ffd46b" scale={0.72} />
    </>
  )
}

function Thruster({
  position,
  paused,
}: {
  position: [number, number, number]
  paused: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current || paused) return
    ref.current.scale.z = 0.84 + Math.sin(state.clock.elapsedTime * 13 + position[1] * 4) * 0.18
  })
  return (
    <mesh ref={ref} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <coneGeometry args={[0.22, 1.1, 20, 1, true]} />
      <meshStandardMaterial
        color="#b7f7ff"
        emissive="#47ccff"
        emissiveIntensity={5}
        transparent
        opacity={0.82}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export function SpaceshipScene({ paused }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.26} />
      <directionalLight position={[5, 6, 5]} color="#c9e4ff" intensity={3.8} />
      <ParticleCloud seed={22} count={260} color="#d7e8ff" size={0.035} spread={[12, 7, 12]} center={[0, 0.5, -1]} paused={paused} speed={0.018} />
      <MotionRig paused={paused} position={[0, 0.45, 0]} speed={0.12} bob={0.12}>
        <group rotation={[0.05, -0.32, -0.12]}>
          <mesh castShadow scale={[0.82, 0.48, 1.72]}>
            <capsuleGeometry args={[0.58, 1.4, 10, 24]} />
            <meshStandardMaterial color="#d8e1e8" metalness={0.62} roughness={0.28} />
          </mesh>
          <RoundedBox args={[2.8, 0.18, 1.25]} radius={0.12} position={[0, -0.08, -0.25]} castShadow>
            <meshStandardMaterial color="#3b5572" metalness={0.55} roughness={0.3} />
          </RoundedBox>
          <mesh position={[0, 0.3, 0.62]} scale={[0.58, 0.34, 0.62]}>
            <sphereGeometry args={[0.72, 28, 18]} />
            <meshPhysicalMaterial color="#62d9ff" transparent opacity={0.55} roughness={0.08} metalness={0.1} />
          </mesh>
          {[-0.72, 0.72].map((x) => (
            <group key={x}>
              <mesh castShadow position={[x, -0.08, -0.92]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.34, 0.34, 0.82, 24]} />
                <meshStandardMaterial color="#222d40" metalness={0.7} roughness={0.3} />
              </mesh>
              <Thruster position={[x, -0.08, -1.72]} paused={paused} />
            </group>
          ))}
          <mesh position={[0, 0.04, 1.74]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.55, 1.2, 24]} />
            <meshStandardMaterial color="#e5edf0" metalness={0.58} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.2, -0.25]}>
            <boxGeometry args={[0.12, 0.08, 2.8]} />
            <meshStandardMaterial color="#ff5e79" emissive="#ff385d" emissiveIntensity={1.4} />
          </mesh>
        </group>
      </MotionRig>
    </>
  )
}

function Wheel({
  position,
}: {
  position: [number, number, number]
}) {
  return (
    <group position={position} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.52, 0.52, 0.2, 24]} />
        <meshStandardMaterial color="#20252b" metalness={0.48} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <torusGeometry args={[0.3, 0.06, 8, 24]} />
        <meshStandardMaterial color="#b14d3f" metalness={0.35} roughness={0.4} />
      </mesh>
    </group>
  )
}

export function TrainScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffcf5a" warm="#ffe4a3" intensity={3.5} />
      <Pedestal color="#273343" radius={3.55} />
      <MotionRig paused={paused} speed={0.045} bob={0.025}>
        <group position={[0, 0.25, 0]} rotation={[0, -0.18, 0]}>
          <RoundedBox args={[3.25, 0.48, 1.35]} radius={0.14} position={[0, 0, 0]} castShadow>
            <meshStandardMaterial color="#285747" roughness={0.46} metalness={0.16} />
          </RoundedBox>
          <mesh castShadow position={[-0.5, 0.75, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.63, 0.63, 1.65, 28]} />
            <meshStandardMaterial color="#33705a" roughness={0.43} metalness={0.18} />
          </mesh>
          <mesh castShadow position={[1.02, 0.85, 0]}>
            <boxGeometry args={[1.2, 1.55, 1.22]} />
            <meshStandardMaterial color="#2c5f4f" roughness={0.48} />
          </mesh>
          {[-0.34, 0.34].map((z) => (
            <mesh key={z} position={[1.64, 1, z]}>
              <planeGeometry args={[0.1, 0.52]} />
              <meshStandardMaterial color="#ffe08d" emissive="#ffb33c" emissiveIntensity={1.2} />
            </mesh>
          ))}
          <mesh castShadow position={[-1.25, 0.76, 0]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.23, 0.3, 1.4, 18]} />
            <meshStandardMaterial color="#1d2628" metalness={0.48} roughness={0.38} />
          </mesh>
          <mesh castShadow position={[-1.25, 1.45, 0]}>
            <coneGeometry args={[0.48, 0.55, 20]} />
            <meshStandardMaterial color="#1d2628" metalness={0.48} roughness={0.38} />
          </mesh>
          {[-1.05, 0.05, 1.05].flatMap((x) =>
            [-0.72, 0.72].map((z) => <Wheel key={`${x}-${z}`} position={[x, -0.34, z]} />),
          )}
          <mesh position={[-0.4, -0.34, 0.84]} rotation={[0, 0, -0.12]}>
            <boxGeometry args={[2.2, 0.1, 0.08]} />
            <meshStandardMaterial color="#d4b15a" metalness={0.55} roughness={0.35} />
          </mesh>
        </group>
      </MotionRig>
      <ParticleCloud seed={23} count={75} color="#d8e0df" size={0.12} spread={[1.6, 2.8, 1.4]} center={[-1.2, 2.25, 0]} paused={paused} speed={0.08} />
      {[-2.8, 2.8].map((z) => (
        <group key={z} position={[0, -0.5, z * 0.29]}>
          <mesh>
            <boxGeometry args={[5.5, 0.1, 0.12]} />
            <meshStandardMaterial color="#49525c" metalness={0.62} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Flower({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.4, 8]} />
        <meshStandardMaterial color="#4c9b5b" />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => {
        const angle = (index / 5) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.12, 0.4, Math.sin(angle) * 0.12]} scale={[1, 0.45, 1]}>
            <sphereGeometry args={[0.11, 10, 8]} />
            <meshStandardMaterial color={color} roughness={0.68} />
          </mesh>
        )
      })}
    </group>
  )
}

export function StylizedNatureScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#b7ff73" warm="#fff6be" intensity={3.7} />
      <Pedestal color="#15352d" radius={3.65} />
      <ParticleCloud seed={24} count={100} color="#d9ff94" size={0.035} spread={[6.8, 3.8, 6]} center={[0, 1, 0]} paused={paused} speed={0.06} />
      <MotionRig paused={paused} speed={0.035} bob={0}>
        <mesh receiveShadow position={[0, -0.46, 0]} scale={[1.4, 0.32, 1.2]}>
          <dodecahedronGeometry args={[2.1, 1]} />
          <meshStandardMaterial color="#568c4d" roughness={0.92} flatShading />
        </mesh>
        <Tree position={[-1.65, -0.36, -0.4]} scale={1.05} foliage="#31865c" />
        <Tree position={[1.6, -0.4, -0.8]} scale={0.8} foliage="#477f4b" />
        <Tree position={[0.9, -0.38, 1.3]} scale={0.58} foliage="#38936b" />
        <Rock position={[-0.45, -0.23, 0.65]} scale={[0.68, 0.44, 0.72]} color="#68796a" />
        <Rock position={[0.4, -0.28, -1.15]} scale={[0.5, 0.36, 0.55]} color="#718472" />
        {[
          [-1.2, -0.3, 1, '#ffb35f'],
          [-0.6, -0.25, -0.8, '#ff7ea8'],
          [0.35, -0.3, 1.25, '#a98bff'],
          [1.35, -0.3, 0.45, '#ffe06c'],
          [0.4, -0.32, -0.35, '#ff8f65'],
        ].map(([x, y, z, color], index) => (
          <Flower key={index} position={[x as number, y as number, z as number]} color={color as string} />
        ))}
        <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.66, 40]} />
          <meshPhysicalMaterial color="#5cd2d1" roughness={0.12} metalness={0.08} />
        </mesh>
      </MotionRig>
    </>
  )
}
