import { Edges, RoundedBox } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../challenges'
import {
  Fish,
  MotionRig,
  OutlineBox,
  ParticleCloud,
  Pedestal,
  Rock,
  SceneLights,
  Tree,
  seeded,
} from './Shared'

function HexTile({
  position,
  height,
  color,
}: {
  position: [number, number, number]
  height: number
  color: string
}) {
  return (
    <mesh castShadow receiveShadow position={[position[0], position[1] + height / 2, position[2]]}>
      <cylinderGeometry args={[0.55, 0.55, height, 6]} />
      <meshStandardMaterial color={color} roughness={0.82} flatShading />
    </mesh>
  )
}

export function ProceduralWorldScene({ paused }: SceneProps) {
  const tiles = useMemo(() => {
    const random = seeded(703)
    const result: Array<{
      position: [number, number, number]
      height: number
      color: string
      tree: boolean
    }> = []
    for (let row = -3; row <= 3; row += 1) {
      for (let column = -3; column <= 3; column += 1) {
        if (Math.abs(row) + Math.abs(column) > 5 || random() < 0.13) continue
        const height = 0.28 + random() * 0.5
        const path = Math.abs(column - Math.round(Math.sin(row) * 0.7)) < 1
        result.push({
          position: [column * 0.92 + (row % 2) * 0.46, -0.58, row * 0.8],
          height,
          color: path ? '#d7bc72' : random() > 0.42 ? '#4c9b60' : '#3f8258',
          tree: !path && random() > 0.62,
        })
      }
    }
    return result
  }, [])

  return (
    <>
      <SceneLights accent="#8dff93" warm="#f1ffd5" intensity={3.4} />
      <Pedestal color="#123538" radius={3.7} y={-0.88} />
      <MotionRig paused={paused} speed={0.055} bob={0}>
        {tiles.map((tile, index) => (
          <group key={index}>
            <HexTile position={tile.position} height={tile.height} color={tile.color} />
            {tile.tree ? (
              <Tree
                position={[
                  tile.position[0],
                  tile.position[1] + tile.height,
                  tile.position[2],
                ]}
                scale={0.38}
                foliage={index % 2 ? '#236c4f' : '#2d8056'}
              />
            ) : null}
          </group>
        ))}
        <mesh position={[0.42, 0.18, -2.45]}>
          <octahedronGeometry args={[0.24, 0]} />
          <meshStandardMaterial color="#eaffba" emissive="#78ff95" emissiveIntensity={3} />
        </mesh>
      </MotionRig>
    </>
  )
}

function OrbitingPlanet({
  radius,
  speed,
  size,
  color,
  offset,
  paused,
  rings = false,
}: {
  radius: number
  speed: number
  size: number
  color: string
  offset: number
  paused: boolean
  rings?: boolean
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!ref.current) return
    const time = paused ? offset : state.clock.elapsedTime * speed + offset
    ref.current.position.set(Math.cos(time) * radius, 0, Math.sin(time) * radius)
  })
  return (
    <>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.008, radius + 0.008, 96]} />
        <meshBasicMaterial color="#415372" transparent opacity={0.5} />
      </mesh>
      <group ref={ref}>
        <mesh castShadow>
          <sphereGeometry args={[size, 28, 18]} />
          <meshStandardMaterial color={color} roughness={0.65} />
        </mesh>
        {rings ? (
          <mesh rotation={[Math.PI / 2.5, 0, 0.2]}>
            <ringGeometry args={[size * 1.35, size * 2.15, 48]} />
            <meshStandardMaterial color="#d7b77f" side={THREE.DoubleSide} roughness={0.72} />
          </mesh>
        ) : null}
      </group>
    </>
  )
}

export function SolarSystemScene({ paused }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight color="#ffb53f" intensity={95} distance={18} decay={2} />
      <ParticleCloud seed={8} count={240} color="#d8e8ff" size={0.035} spread={[13, 8, 13]} paused={paused} speed={0.008} />
      <group rotation={[0.12, 0, -0.12]}>
        <mesh>
          <sphereGeometry args={[0.82, 42, 26]} />
          <meshStandardMaterial color="#ffb235" emissive="#ff7b19" emissiveIntensity={4.5} roughness={0.7} />
        </mesh>
        <OrbitingPlanet radius={1.45} speed={0.42} size={0.15} color="#b7a995" offset={0.4} paused={paused} />
        <OrbitingPlanet radius={2.05} speed={0.28} size={0.24} color="#5da8df" offset={2.1} paused={paused} />
        <OrbitingPlanet radius={2.8} speed={0.18} size={0.31} color="#d96c4b" offset={4.2} paused={paused} />
        <OrbitingPlanet radius={3.7} speed={0.1} size={0.46} color="#d5b681" offset={1.3} paused={paused} rings />
      </group>
    </>
  )
}

function DeskLamp() {
  return (
    <group position={[-1.2, 1.25, -0.42]}>
      <mesh rotation={[0, 0, -0.42]} position={[0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.95, 12]} />
        <meshStandardMaterial color="#d1b659" metalness={0.55} roughness={0.3} />
      </mesh>
      <mesh position={[0.32, 0.82, 0]} rotation={[0, 0, -0.25]}>
        <coneGeometry args={[0.3, 0.42, 20, 1, true]} />
        <meshStandardMaterial color="#e7c761" side={THREE.DoubleSide} roughness={0.42} />
      </mesh>
      <pointLight position={[0.38, 0.65, 0]} color="#ffc568" intensity={24} distance={4} />
    </group>
  )
}

export function IsometricRoomScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffba66" warm="#ffc77a" intensity={2.8} />
      <MotionRig paused={paused} speed={0.025} bob={0}>
        <group rotation={[0, -0.2, 0]}>
          <mesh receiveShadow position={[0, -0.5, 0]}>
            <boxGeometry args={[5, 0.24, 4.5]} />
            <meshStandardMaterial color="#785f88" roughness={0.78} />
          </mesh>
          <mesh receiveShadow position={[-2.38, 1.25, 0]}>
            <boxGeometry args={[0.22, 3.5, 4.5]} />
            <meshStandardMaterial color="#3d3151" roughness={0.84} />
          </mesh>
          <mesh receiveShadow position={[0, 1.25, -2.13]}>
            <boxGeometry args={[5, 3.5, 0.22]} />
            <meshStandardMaterial color="#49385e" roughness={0.84} />
          </mesh>
          <RoundedBox args={[2.4, 0.34, 1.4]} radius={0.12} position={[0.9, -0.12, -1.1]} castShadow>
            <meshStandardMaterial color="#315d75" roughness={0.72} />
          </RoundedBox>
          <RoundedBox args={[2.25, 0.22, 1.2]} radius={0.1} position={[0.9, 0.14, -1.08]}>
            <meshStandardMaterial color="#d5c1a4" roughness={0.82} />
          </RoundedBox>
          <mesh castShadow position={[-1.05, 0.45, -0.55]}>
            <boxGeometry args={[1.85, 0.16, 0.82]} />
            <meshStandardMaterial color="#8a5741" roughness={0.62} />
          </mesh>
          {[-1.75, -0.35].map((x) => (
            <mesh key={x} position={[x, -0.05, -0.55]}>
              <boxGeometry args={[0.13, 0.92, 0.13]} />
              <meshStandardMaterial color="#5b3a30" />
            </mesh>
          ))}
          <RoundedBox args={[0.86, 0.58, 0.08]} radius={0.04} position={[-1.02, 0.93, -0.45]}>
            <meshStandardMaterial color="#202738" />
          </RoundedBox>
          <mesh position={[-1.02, 0.93, -0.4]}>
            <planeGeometry args={[0.68, 0.4]} />
            <meshStandardMaterial color="#78d7ff" emissive="#3e88ff" emissiveIntensity={1.8} />
          </mesh>
          <DeskLamp />
          <Tree position={[1.85, -0.34, 0.95]} scale={0.65} foliage="#4c9b78" trunk="#664431" />
          <mesh position={[-2.24, 1.5, 0.7]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[0.05, 2.6]} />
            <meshBasicMaterial color="#ffbd6c" />
          </mesh>
        </group>
      </MotionRig>
    </>
  )
}

function Snack({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <RoundedBox args={[0.48, 0.58, 0.22]} radius={0.06} smoothness={2} position={position}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} roughness={0.45} />
      <Edges color="#ffffff" />
    </RoundedBox>
  )
}

export function VendingMachineScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#57f4ff" warm="#ff94cf" intensity={3} />
      <Pedestal color="#28142f" radius={2.75} />
      <MotionRig paused={paused} position={[0, 0.7, 0]} speed={0.07} bob={0.025}>
        <RoundedBox args={[2.75, 4, 1.15]} radius={0.18} smoothness={4} castShadow>
          <meshStandardMaterial color="#282341" metalness={0.38} roughness={0.34} />
        </RoundedBox>
        <OutlineBox args={[1.72, 2.45, 0.1]} position={[-0.3, 0.45, 0.61]} color="#70eeff" opacity={0.12} />
        {[
          [-0.75, 1.2, '#ff667d'],
          [-0.15, 1.2, '#ffd15a'],
          [0.45, 1.2, '#7cffb2'],
          [-0.75, 0.42, '#8e87ff'],
          [-0.15, 0.42, '#ff9d4d'],
          [0.45, 0.42, '#5ee7ff'],
          [-0.75, -0.36, '#ff75cd'],
          [-0.15, -0.36, '#c6f45d'],
          [0.45, -0.36, '#ff6969'],
        ].map(([x, y, color], index) => (
          <Snack key={index} position={[x as number, y as number, 0.7]} color={color as string} />
        ))}
        <RoundedBox args={[0.52, 1.25, 0.12]} radius={0.07} position={[0.91, 0.63, 0.67]}>
          <meshStandardMaterial color="#111522" emissive="#123c55" emissiveIntensity={0.8} />
        </RoundedBox>
        <mesh position={[0.91, 0.92, 0.75]}>
          <planeGeometry args={[0.32, 0.3]} />
          <meshBasicMaterial color="#5cf5ff" />
        </mesh>
        <RoundedBox args={[1.5, 0.48, 0.12]} radius={0.09} position={[0, -1.45, 0.67]}>
          <meshStandardMaterial color="#111522" roughness={0.5} />
        </RoundedBox>
      </MotionRig>
    </>
  )
}

function RadialTicks() {
  return (
    <group>
      {Array.from({ length: 32 }, (_, index) => {
        const angle = (index / 32) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 2.12, Math.sin(angle) * 2.12 + 0.45, 0]}
            rotation={[0, 0, angle]}
          >
            <boxGeometry args={[index % 4 === 0 ? 0.28 : 0.14, 0.025, 0.025]} />
            <meshBasicMaterial color={index % 4 === 0 ? '#b5fbff' : '#3bc5df'} transparent opacity={0.78} />
          </mesh>
        )
      })}
    </group>
  )
}

export function FuturisticUIScene({ paused }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.32} />
      <pointLight color="#4df4ff" intensity={32} distance={10} position={[0, 1, 3]} />
      <ParticleCloud seed={11} count={150} color="#4df4ff" size={0.032} spread={[8, 5, 5]} center={[0, 0.6, -1]} paused={paused} />
      <MotionRig paused={paused} speed={0.18} bob={0.04} position={[0, 0.2, 0]}>
        {[1.15, 1.6, 2.05].map((radius, index) => (
          <mesh key={radius} rotation={[Math.PI / 2 + index * 0.12, index * 0.18, 0]}>
            <torusGeometry args={[radius, index === 1 ? 0.025 : 0.045, 10, 96, Math.PI * (1.45 + index * 0.12)]} />
            <meshBasicMaterial color={index === 1 ? '#b967ff' : '#4df4ff'} transparent opacity={0.72} />
          </mesh>
        ))}
        <mesh>
          <icosahedronGeometry args={[0.72, 2]} />
          <meshStandardMaterial color="#153848" emissive="#3ce6ff" emissiveIntensity={2.1} wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.34, 28, 20]} />
          <meshStandardMaterial color="#d9ffff" emissive="#54eaff" emissiveIntensity={3.8} />
        </mesh>
      </MotionRig>
      <RadialTicks />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 2.75, 0.45, -0.3]}>
          {[0, 0.28, 0.56, 0.84].map((y, index) => (
            <mesh key={y} position={[0, y - 0.45, 0]}>
              <boxGeometry args={[0.7 - index * 0.08, 0.035, 0.03]} />
              <meshBasicMaterial color={index === 0 ? '#b967ff' : '#4df4ff'} transparent opacity={0.72} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  )
}

function Coral({
  position,
  color,
  scale = 1,
}: {
  position: [number, number, number]
  color: string
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      {[-0.35, 0, 0.35].map((x, index) => (
        <mesh key={x} castShadow position={[x, 0.45 + index * 0.12, 0]} rotation={[0, 0, x * 0.65]}>
          <capsuleGeometry args={[0.11, 0.72 + index * 0.12, 5, 10]} />
          <meshStandardMaterial color={color} roughness={0.72} />
        </mesh>
      ))}
    </group>
  )
}

export function UnderSeaScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#61ffd0" warm="#8ee8ff" intensity={2.6} />
      <Pedestal color="#0c4652" radius={3.4} y={-0.78} />
      <ParticleCloud seed={12} count={135} color="#b8fff0" size={0.045} spread={[6.3, 5, 5]} center={[0, 0.8, 0]} paused={paused} speed={0.06} />
      <Rock position={[-2, -0.22, -0.2]} scale={[1.45, 0.6, 1.2]} color="#23646a" />
      <Rock position={[2, -0.32, 0.2]} scale={[1.2, 0.5, 1.1]} color="#2a6670" />
      <Coral position={[-1.8, -0.45, 0.8]} color="#ff6e91" scale={1.15} />
      <Coral position={[1.65, -0.48, 0.3]} color="#ffb45e" scale={0.9} />
      <Coral position={[0.8, -0.5, -1]} color="#9e72ff" scale={0.7} />
      <MotionRig paused={paused} speed={0.08} bob={0.08} position={[0, 0.7, 0]}>
        <Fish position={[-1.3, 0.55, 0.2]} color="#ffb84d" scale={1.1} />
        <Fish position={[0.5, 0.2, 0.8]} color="#62e8ff" scale={0.76} flip />
        <Fish position={[1.45, 0.95, -0.25]} color="#ff7eb2" scale={0.64} flip />
        <Fish position={[-0.25, 1.25, -0.85]} color="#b7ff77" scale={0.5} />
      </MotionRig>
    </>
  )
}
