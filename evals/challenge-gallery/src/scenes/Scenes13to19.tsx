import { Edges, RoundedBox } from '@react-three/drei'
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
} from './Shared'

function RuneRing({
  radius,
  count,
  color,
  phase = 0,
}: {
  radius: number
  count: number
  color: string
  phase?: number
}) {
  return (
    <group rotation={[0, 0, phase]}>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0]}
            rotation={[0, 0, angle]}
          >
            <tetrahedronGeometry args={[index % 3 === 0 ? 0.13 : 0.08, 0]} />
            <meshBasicMaterial color={color} transparent opacity={index % 2 ? 0.58 : 0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

export function MagicSpellsScene({ paused }: SceneProps) {
  return (
    <>
      <ambientLight intensity={0.22} />
      <pointLight color="#b57cff" intensity={48} distance={12} position={[0, 0.6, 2]} />
      <Pedestal color="#211536" radius={3} />
      <ParticleCloud seed={13} count={170} color="#c9a4ff" size={0.045} spread={[6, 4.5, 4]} center={[0, 0.6, 0]} paused={paused} speed={0.12} />
      <MotionRig paused={paused} position={[0, 0.72, 0]} speed={0.2} bob={0.08}>
        <mesh>
          <torusGeometry args={[1.45, 0.08, 12, 96]} />
          <meshStandardMaterial color="#8b5ad6" emissive="#a76bff" emissiveIntensity={3.2} />
        </mesh>
        <mesh>
          <circleGeometry args={[1.32, 64]} />
          <meshBasicMaterial color="#5b2299" transparent opacity={0.24} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <RuneRing radius={1.05} count={18} color="#e0c8ff" />
        <RuneRing radius={0.68} count={10} color="#77e9ff" phase={Math.PI / 10} />
        <mesh position={[0, 0, 0.15]}>
          <octahedronGeometry args={[0.36, 1]} />
          <meshStandardMaterial color="#efffff" emissive="#9c70ff" emissiveIntensity={4.5} />
        </mesh>
      </MotionRig>
      {[-2.25, 2.25].map((x) => (
        <group key={x} position={[x, -0.28, 0.3]}>
          <mesh castShadow position={[0, 0.52, 0]}>
            <cylinderGeometry args={[0.22, 0.34, 1.05, 8]} />
            <meshStandardMaterial color="#423253" roughness={0.75} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.16, 18, 12]} />
            <meshStandardMaterial color="#c9a4ff" emissive="#a86cff" emissiveIntensity={3} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Ghost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <capsuleGeometry args={[0.42, 0.68, 8, 18]} />
        <meshStandardMaterial color="#d8fff3" transparent opacity={0.72} emissive="#72ffc9" emissiveIntensity={1.6} />
      </mesh>
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.39]}>
          <sphereGeometry args={[0.055, 10, 8]} />
          <meshBasicMaterial color="#17232e" />
        </mesh>
      ))}
    </group>
  )
}

export function HalloweenTwoScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#8cffd0" warm="#c2b3ff" intensity={2.2} />
      <Pedestal color="#21172e" radius={3.1} />
      <MotionRig paused={paused} speed={0.055} bob={0}>
        <group position={[0, 0.55, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.8, 2.75, 1.45]} />
            <meshStandardMaterial color="#333043" roughness={0.82} />
          </mesh>
          <mesh castShadow position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.5, 1.65, 4]} />
            <meshStandardMaterial color="#201a32" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.65, 0.74]}>
            <cylinderGeometry args={[0.58, 0.58, 0.12, 32]} />
            <meshStandardMaterial color="#eee5c8" emissive="#ffc96e" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[0, 0.65, 0.83]}>
            <torusGeometry args={[0.48, 0.035, 8, 40]} />
            <meshBasicMaterial color="#4b3d49" />
          </mesh>
          <mesh position={[0, 0.82, 0.84]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.045, 0.44, 0.04]} />
            <meshBasicMaterial color="#5e3440" />
          </mesh>
          <mesh position={[0.14, 0.52, 0.84]} rotation={[0, 0, -1.05]}>
            <boxGeometry args={[0.035, 0.35, 0.035]} />
            <meshBasicMaterial color="#5e3440" />
          </mesh>
          {[-0.58, 0.58].map((x) => (
            <mesh key={x} position={[x, -0.48, 0.74]}>
              <planeGeometry args={[0.38, 0.68]} />
              <meshStandardMaterial color="#8cffd0" emissive="#34b682" emissiveIntensity={1.6} />
            </mesh>
          ))}
        </group>
      </MotionRig>
      <MotionRig paused={paused} position={[2, 1.4, 0.35]} speed={0.16} bob={0.18}>
        <Ghost position={[0, 0, 0]} />
      </MotionRig>
      <ParticleCloud seed={14} count={90} color="#8cffd0" size={0.04} spread={[6, 3, 4]} center={[0, 0.8, 0]} paused={paused} />
    </>
  )
}

function TinyCabin() {
  return (
    <group position={[0, -0.12, 0]} scale={0.78}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[1.65, 1.12, 1.35]} />
        <meshStandardMaterial color="#8b4d3c" roughness={0.78} />
      </mesh>
      <mesh castShadow position={[0, 1.26, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.35, 1, 4]} />
        <meshStandardMaterial color="#e4e8e8" roughness={0.74} />
      </mesh>
      {[-0.45, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.62, 0.685]}>
          <planeGeometry args={[0.36, 0.46]} />
          <meshStandardMaterial color="#ffd377" emissive="#ff9d3b" emissiveIntensity={2.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.34, 0.69]}>
        <planeGeometry args={[0.38, 0.68]} />
        <meshStandardMaterial color="#4a302c" roughness={0.75} />
      </mesh>
    </group>
  )
}

export function ChristmasTwoScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffcf7d" warm="#ffe8ba" intensity={3.4} />
      <Pedestal color="#19283a" radius={2.75} y={-0.85} />
      <mesh castShadow position={[0, -0.55, 0]}>
        <cylinderGeometry args={[1.85, 2.2, 0.55, 48]} />
        <meshStandardMaterial color="#4b2c36" metalness={0.28} roughness={0.38} />
      </mesh>
      <TinyCabin />
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[2.05, 64, 36]} />
        <meshPhysicalMaterial
          color="#bde8ff"
          transparent
          opacity={0.13}
          transmission={0.72}
          thickness={0.16}
          roughness={0.05}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <ParticleCloud seed={15} count={190} color="#ffffff" size={0.045} spread={[3.45, 3.3, 3.45]} center={[0, 0.78, 0]} paused={paused} speed={0.055} />
      <mesh position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.72, 48]} />
        <meshStandardMaterial color="#eef5f3" roughness={0.86} />
      </mesh>
    </>
  )
}

function TamagotchiFace() {
  return (
    <group position={[0, 0.58, 0.72]}>
      <RoundedBox args={[1.46, 1.22, 0.07]} radius={0.18} smoothness={4}>
        <meshStandardMaterial color="#c6e48a" roughness={0.52} emissive="#48633c" emissiveIntensity={0.5} />
      </RoundedBox>
      {[-0.27, 0.27].map((x) => (
        <mesh key={x} position={[x, 0.15, 0.07]}>
          <boxGeometry args={[0.16, 0.2, 0.04]} />
          <meshBasicMaterial color="#243229" />
        </mesh>
      ))}
      <mesh position={[0, -0.22, 0.07]}>
        <torusGeometry args={[0.26, 0.05, 8, 24, Math.PI]} />
        <meshBasicMaterial color="#243229" />
      </mesh>
      <mesh position={[0.48, 0.45, 0.07]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshBasicMaterial color="#243229" />
      </mesh>
    </group>
  )
}

export function TamagotchiScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ff8ed8" warm="#ffe2f4" intensity={3.5} />
      <Pedestal color="#371b3d" radius={2.45} />
      <MotionRig paused={paused} position={[0, 0.72, 0]} speed={0.11} bob={0.08}>
        <mesh castShadow scale={[1.15, 1.4, 0.48]}>
          <sphereGeometry args={[1.35, 48, 32]} />
          <meshStandardMaterial color="#f18ac7" roughness={0.36} />
        </mesh>
        <TamagotchiFace />
        {[-0.58, 0, 0.58].map((x, index) => (
          <mesh key={x} position={[x, -0.52 + Math.abs(x) * 0.1, 0.58]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.14, 24]} />
            <meshStandardMaterial color={index === 1 ? '#ffe36b' : '#9d4c8c'} roughness={0.4} />
          </mesh>
        ))}
        <mesh position={[0, 1.85, 0]}>
          <torusGeometry args={[0.34, 0.08, 10, 28]} />
          <meshStandardMaterial color="#f0d7ef" metalness={0.42} roughness={0.28} />
        </mesh>
      </MotionRig>
    </>
  )
}

function Palm({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale} rotation={[0, 0, -0.1]}>
      <mesh castShadow position={[0, 0.78, 0]} rotation={[0, 0, 0.14]}>
        <cylinderGeometry args={[0.11, 0.18, 1.6, 9]} />
        <meshStandardMaterial color="#8b5b36" roughness={0.86} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.34, 1.58, Math.sin(angle) * 0.34]}
            rotation={[0.18, -angle, Math.PI / 2.8]}
            scale={[1, 0.32, 0.6]}
          >
            <coneGeometry args={[0.4, 1.5, 5]} />
            <meshStandardMaterial color={index % 2 ? '#2c9d66' : '#48b86e'} roughness={0.72} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  )
}

export function IslandScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#63d9ff" warm="#fff0bd" intensity={3.8} />
      <mesh position={[0, -0.73, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshPhysicalMaterial color="#15769a" roughness={0.12} metalness={0.08} transparent opacity={0.8} />
      </mesh>
      {[2.2, 2.65, 3.05].map((radius, index) => (
        <mesh key={radius} position={[0, -0.7 + index * 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius, radius + 0.025, 64]} />
          <meshBasicMaterial color="#74dff1" transparent opacity={0.46 - index * 0.1} />
        </mesh>
      ))}
      <MotionRig paused={paused} speed={0.045} bob={0}>
        <mesh castShadow position={[0, -0.42, 0]} scale={[1.7, 0.5, 1.45]}>
          <dodecahedronGeometry args={[1.45, 1]} />
          <meshStandardMaterial color="#d6b16a" roughness={0.9} flatShading />
        </mesh>
        <mesh castShadow position={[0, -0.06, 0]} scale={[1.35, 0.35, 1.12]}>
          <dodecahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#5ca45b" roughness={0.86} flatShading />
        </mesh>
        <Palm position={[-0.55, 0.05, -0.15]} scale={0.95} />
        <Palm position={[0.72, -0.02, 0.28]} scale={0.72} />
        <Rock position={[1.25, -0.36, -0.35]} scale={[0.55, 0.4, 0.65]} color="#84775f" />
      </MotionRig>
    </>
  )
}

function CastleTower({
  position,
  height = 2,
}: {
  position: [number, number, number]
  height?: number
}) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.65, 0.75, height, 12]} />
        <meshStandardMaterial color="#74778d" roughness={0.82} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (index / 8) * Math.PI * 2
        return (
          <mesh key={index} castShadow position={[Math.cos(angle) * 0.57, height + 0.18, Math.sin(angle) * 0.57]}>
            <boxGeometry args={[0.28, 0.38, 0.28]} />
            <meshStandardMaterial color="#85889e" roughness={0.82} />
          </mesh>
        )
      })}
      <mesh position={[0, height * 0.54, 0.66]}>
        <planeGeometry args={[0.22, 0.56]} />
        <meshStandardMaterial color="#20243a" />
      </mesh>
    </group>
  )
}

export function CastleScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ff577f" warm="#e6d9ff" intensity={3.2} />
      <Pedestal color="#21263d" radius={3.4} />
      <MotionRig paused={paused} speed={0.05} bob={0}>
        <mesh castShadow position={[0, 0.38, 0]}>
          <boxGeometry args={[3.1, 1.65, 2.4]} />
          <meshStandardMaterial color="#6f7286" roughness={0.84} />
        </mesh>
        {[
          [-1.62, -0.48, -1.25],
          [1.62, -0.48, -1.25],
          [-1.62, -0.48, 1.25],
          [1.62, -0.48, 1.25],
        ].map((position, index) => (
          <CastleTower key={index} position={position as [number, number, number]} height={2.25} />
        ))}
        <mesh position={[0, 0.25, 1.22]}>
          <planeGeometry args={[0.72, 1.18]} />
          <meshStandardMaterial color="#25293d" roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 2.1, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.3, 8]} />
          <meshStandardMaterial color="#3c3441" />
        </mesh>
        <mesh position={[0.42, 2.45, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.45]} />
          <meshStandardMaterial color="#e93f69" side={THREE.DoubleSide} />
        </mesh>
      </MotionRig>
    </>
  )
}

export function AquariumScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#64ffd2" warm="#a5efff" intensity={2.5} />
      <Pedestal color="#173440" radius={3.2} y={-0.85} />
      <OutlineBox args={[5.1, 3.5, 3.1]} position={[0, 0.8, 0]} color="#72dfff" opacity={0.1} />
      <mesh position={[0, -0.74, 0]}>
        <boxGeometry args={[4.82, 0.2, 2.82]} />
        <meshStandardMaterial color="#3f8a7f" roughness={0.9} />
      </mesh>
      <Rock position={[-1.65, -0.42, 0.25]} scale={[0.85, 0.6, 0.7]} color="#4a7072" />
      <Rock position={[1.55, -0.48, -0.5]} scale={[0.7, 0.48, 0.8]} color="#517c76" />
      {[-1.25, -0.85, 0.85, 1.18].map((x, index) => (
        <mesh key={x} position={[x, -0.05 + index * 0.06, index % 2 ? 0.8 : -0.72]} rotation={[0, 0, x * 0.08]}>
          <capsuleGeometry args={[0.07, 0.95, 5, 8]} />
          <meshStandardMaterial color={index % 2 ? '#5fd695' : '#79bf62'} roughness={0.78} />
        </mesh>
      ))}
      <MotionRig paused={paused} position={[0, 0.65, 0]} speed={0.075} bob={0.07}>
        <Fish position={[-1.35, 0.3, 0.45]} color="#ff9d52" scale={0.92} />
        <Fish position={[0.55, 0.8, -0.35]} color="#65dbff" scale={0.7} flip />
        <Fish position={[1.35, -0.05, 0.3]} color="#ff70ae" scale={0.58} flip />
        <Fish position={[-0.15, -0.2, -0.72]} color="#d1ff70" scale={0.5} />
      </MotionRig>
      <ParticleCloud seed={19} count={100} color="#c8fff2" size={0.045} spread={[4.4, 3, 2.5]} center={[0, 0.75, 0]} paused={paused} speed={0.05} />
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[4.96, 3.36, 2.96]} />
        <meshPhysicalMaterial color="#58c7d6" transparent opacity={0.035} depthWrite={false} />
        <Edges color="#64cbd9" />
      </mesh>
    </>
  )
}
