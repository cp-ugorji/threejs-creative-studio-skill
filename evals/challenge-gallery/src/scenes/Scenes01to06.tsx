import { RoundedBox } from '@react-three/drei'
import type { SceneProps } from '../challenges'
import {
  Gift,
  LegoBrick,
  MotionRig,
  ParticleCloud,
  Pedestal,
  Rock,
  SceneLights,
} from './Shared'

function Pixel({
  position,
  color,
}: {
  position: [number, number, number]
  color: string
}) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.16, 0.16, 0.035]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.8} />
    </mesh>
  )
}

export function GameBoyScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#b7ff4a" warm="#dfe8ff" />
      <Pedestal color="#252936" radius={2.45} />
      <MotionRig paused={paused} position={[0, 0.75, 0]} speed={0.12} bob={0.045}>
        <RoundedBox args={[2.35, 3.55, 0.58]} radius={0.22} smoothness={5} castShadow>
          <meshStandardMaterial color="#d8d7ca" roughness={0.42} metalness={0.04} />
        </RoundedBox>
        <RoundedBox
          args={[1.82, 1.45, 0.08]}
          radius={0.1}
          smoothness={3}
          position={[0, 0.7, 0.33]}
        >
          <meshStandardMaterial color="#2f3440" roughness={0.32} />
        </RoundedBox>
        <mesh position={[0, 0.72, 0.385]}>
          <planeGeometry args={[1.42, 1.05]} />
          <meshStandardMaterial
            color="#8ca978"
            emissive="#7cae65"
            emissiveIntensity={paused ? 0.8 : 1.25}
            roughness={0.5}
          />
        </mesh>
        {[
          [-0.32, 0.85, '#d7ff7a'],
          [-0.16, 0.85, '#d7ff7a'],
          [0, 0.85, '#d7ff7a'],
          [0.16, 0.69, '#294336'],
          [0.32, 0.53, '#294336'],
          [0.16, 0.37, '#294336'],
          [0, 0.37, '#294336'],
          [-0.16, 0.53, '#294336'],
        ].map(([x, y, color], index) => (
          <Pixel key={index} position={[x as number, y as number, 0.44]} color={color as string} />
        ))}
        <group position={[-0.62, -0.75, 0.37]}>
          <RoundedBox args={[0.28, 1, 0.14]} radius={0.05} smoothness={2}>
            <meshStandardMaterial color="#30333a" roughness={0.4} />
          </RoundedBox>
          <RoundedBox args={[1, 0.28, 0.14]} radius={0.05} smoothness={2}>
            <meshStandardMaterial color="#30333a" roughness={0.4} />
          </RoundedBox>
        </group>
        {[-0.42, 0.42].map((x) => (
          <mesh key={x} position={[x + 0.48, -0.7 - x * 0.16, 0.43]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 32]} />
            <meshStandardMaterial color="#8c2757" roughness={0.32} />
          </mesh>
        ))}
        <mesh position={[0.28, -1.28, 0.38]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.5, 0.07, 0.08]} />
          <meshStandardMaterial color="#3c3f46" />
        </mesh>
        <mesh position={[0.78, -1.2, 0.38]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.5, 0.07, 0.08]} />
          <meshStandardMaterial color="#3c3f46" />
        </mesh>
      </MotionRig>
    </>
  )
}

export function LegoScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffd21c" warm="#fff4d5" intensity={4.2} />
      <Pedestal color="#357bb4" radius={3.15} y={-0.55} />
      <MotionRig paused={paused} position={[0, 0, 0]} speed={0.1} bob={0.025}>
        {[
          [-1.45, -0.22, -0.8, '#ef3d42'],
          [0, -0.22, -0.8, '#ffcd26'],
          [1.45, -0.22, -0.8, '#3f77d2'],
          [-0.7, -0.22, 0.15, '#56b85c'],
          [0.75, -0.22, 0.15, '#ef3d42'],
          [0, -0.22, 1.05, '#ffcd26'],
        ].map(([x, y, z, color], index) => (
          <LegoBrick
            key={index}
            position={[x as number, y as number, z as number]}
            color={color as string}
            size={[1.35, 0.44, 0.85]}
          />
        ))}
        <LegoBrick position={[0, 0.24, 0]} color="#f1f2ec" size={[1.75, 0.48, 1.3]} />
        <group position={[0, 0.64, 0]}>
          <mesh castShadow position={[0, 0.72, 0]}>
            <coneGeometry args={[0.62, 1.45, 16]} />
            <meshStandardMaterial color="#f1f2ec" roughness={0.34} />
          </mesh>
          <mesh castShadow position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.62, 0.62, 0.38, 16]} />
            <meshStandardMaterial color="#3f77d2" roughness={0.35} />
          </mesh>
          {[-0.45, 0.45].map((x) => (
            <mesh key={x} castShadow position={[x, 0.16, 0]}>
              <boxGeometry args={[0.22, 0.65, 0.5]} />
              <meshStandardMaterial color="#ef3d42" roughness={0.38} />
            </mesh>
          ))}
          <mesh position={[0, 0.72, 0.5]}>
            <circleGeometry args={[0.2, 24]} />
            <meshStandardMaterial color="#78d9ff" emissive="#3db9ff" emissiveIntensity={1.4} />
          </mesh>
        </group>
      </MotionRig>
    </>
  )
}

export function WaterfallScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#6ce8ff" warm="#d7f5ff" intensity={3.2} />
      <Pedestal color="#15323a" radius={3.25} y={-0.72} />
      <group position={[0, -0.05, 0]}>
        <Rock position={[-1.65, 0.15, -0.2]} scale={[1.7, 2.2, 1.45]} color="#354d4d" />
        <Rock position={[1.65, 0.1, -0.2]} scale={[1.75, 2.1, 1.5]} color="#354d4d" />
        <Rock position={[-0.9, 1.2, -0.7]} scale={[1.35, 1.3, 1.3]} color="#49615b" />
        <Rock position={[0.95, 1.22, -0.72]} scale={[1.35, 1.32, 1.25]} color="#49615b" />
        <RoundedBox args={[1.02, 3.15, 0.22]} radius={0.22} position={[0, 0.85, -0.18]}>
          <meshPhysicalMaterial
            color="#4de1ff"
            emissive="#147ba0"
            emissiveIntensity={1.2}
            transparent
            opacity={0.68}
            transmission={0.18}
            roughness={0.12}
          />
        </RoundedBox>
        {[0, 1, 2].map((index) => (
          <mesh key={index} position={[0, -0.52 + index * 0.06, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.65 + index * 0.25, 0.7 + index * 0.25, 48]} />
            <meshBasicMaterial color="#68e9ff" transparent opacity={0.44 - index * 0.1} />
          </mesh>
        ))}
      </group>
      <ParticleCloud
        seed={31}
        count={150}
        color="#b9f7ff"
        size={0.055}
        spread={[1.2, 3.4, 0.65]}
        center={[0, 0.75, 0.22]}
        paused={paused}
        speed={0.14}
      />
    </>
  )
}

function Pumpkin({
  position,
  scale = 1,
}: {
  position: [number, number, number]
  scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow scale={[1.15, 0.9, 1]}>
        <sphereGeometry args={[0.72, 28, 18]} />
        <meshStandardMaterial color="#e85f18" roughness={0.64} />
      </mesh>
      {[-0.42, 0, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.08, 0.69]}>
          <coneGeometry args={[0.13, 0.28, 3]} />
          <meshStandardMaterial color="#ffd36a" emissive="#ff6a00" emissiveIntensity={4} />
        </mesh>
      ))}
      <mesh position={[0, -0.27, 0.7]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.22, 0.42, 3]} />
        <meshStandardMaterial color="#ffd36a" emissive="#ff6a00" emissiveIntensity={4} />
      </mesh>
      <mesh castShadow position={[0, 0.75, 0]} rotation={[0.08, 0, -0.18]}>
        <cylinderGeometry args={[0.1, 0.14, 0.45, 8]} />
        <meshStandardMaterial color="#48662c" roughness={0.8} />
      </mesh>
    </group>
  )
}

export function HalloweenScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ff7a1a" warm="#c8bcff" intensity={2.4} />
      <Pedestal color="#21132a" radius={3} />
      <mesh position={[-2.2, 2.5, -2]}>
        <sphereGeometry args={[0.72, 32, 20]} />
        <meshBasicMaterial color="#f4e9c8" />
      </mesh>
      <MotionRig paused={paused} speed={0.09} bob={0.035}>
        <Pumpkin position={[0, 0.3, 0]} scale={1.25} />
        <Pumpkin position={[-1.45, -0.08, 0.35]} scale={0.72} />
        <Pumpkin position={[1.4, -0.12, 0.2]} scale={0.64} />
      </MotionRig>
      {[-2.3, 2.3].map((x) => (
        <group key={x} position={[x, 0.85, -0.5]}>
          <mesh>
            <sphereGeometry args={[0.42, 20, 14]} />
            <meshStandardMaterial color="#d9fff0" transparent opacity={0.72} emissive="#8cffd0" emissiveIntensity={1.8} />
          </mesh>
          <mesh position={[0, -0.47, 0]}>
            <coneGeometry args={[0.42, 0.9, 16]} />
            <meshStandardMaterial color="#d9fff0" transparent opacity={0.5} emissive="#8cffd0" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
    </>
  )
}

export function PokeballScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ff334f" warm="#e7f3ff" intensity={3.5} />
      <Pedestal color="#132333" radius={2.75} />
      <ParticleCloud seed={5} count={90} color="#6bdcff" size={0.045} spread={[5, 3.8, 5]} center={[0, 0.6, 0]} paused={paused} speed={0.12} />
      <MotionRig paused={paused} position={[0, 0.65, 0]} speed={0.22} bob={0.12}>
        <mesh castShadow rotation={[0, 0, 0]}>
          <sphereGeometry args={[1.48, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ed3148" roughness={0.24} metalness={0.08} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[1.48, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#f2f3ef" roughness={0.32} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.43, 0.105, 12, 64]} />
          <meshStandardMaterial color="#1f242c" roughness={0.36} />
        </mesh>
        <mesh position={[0, 0, 1.46]}>
          <cylinderGeometry args={[0.38, 0.38, 0.18, 40]} />
          <meshStandardMaterial color="#20262d" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 1.57]}>
          <cylinderGeometry args={[0.23, 0.23, 0.12, 40]} />
          <meshStandardMaterial color="#f5ffff" emissive="#aeeeff" emissiveIntensity={1.2} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle) => (
          <mesh key={angle} rotation={[Math.PI / 2, 0, angle]}>
            <torusGeometry args={[2.05, 0.025, 8, 48, Math.PI * 1.25]} />
            <meshBasicMaterial color="#61dfff" transparent opacity={0.52} />
          </mesh>
        ))}
      </MotionRig>
    </>
  )
}

export function ChristmasScene({ paused }: SceneProps) {
  return (
    <>
      <SceneLights accent="#ffcf68" warm="#ffe4ae" intensity={4} />
      <Pedestal color="#163037" radius={3.05} />
      <ParticleCloud seed={61} count={190} color="#ffffff" size={0.045} spread={[6.4, 5.2, 6]} center={[0, 1.2, 0]} paused={paused} speed={0.035} />
      <MotionRig paused={paused} speed={0.08} bob={0.025}>
        <mesh castShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.18, 0.24, 1.2, 10]} />
          <meshStandardMaterial color="#694229" roughness={0.82} />
        </mesh>
        {[0.55, 1.15, 1.75].map((y, index) => (
          <mesh key={y} castShadow position={[0, y, 0]}>
            <coneGeometry args={[1.65 - index * 0.3, 1.55, 11]} />
            <meshStandardMaterial color={index % 2 ? '#1f8a61' : '#176d52'} roughness={0.67} />
          </mesh>
        ))}
        {[
          [-0.8, 1.1, 0.75, '#ff5b5b'],
          [0.75, 1.4, 0.65, '#ffd35a'],
          [-0.25, 2, 0.72, '#6ce8ff'],
          [0.5, 0.72, 1.05, '#ff8fd3'],
          [-0.65, 1.72, -0.75, '#ffd35a'],
        ].map(([x, y, z, color], index) => (
          <mesh key={index} position={[x as number, y as number, z as number]}>
            <sphereGeometry args={[0.13, 14, 10]} />
            <meshStandardMaterial color={color as string} emissive={color as string} emissiveIntensity={2.4} />
          </mesh>
        ))}
        <mesh position={[0, 2.72, 0]} rotation={[0, 0, Math.PI / 2]}>
          <octahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial color="#fff1a1" emissive="#ffbb36" emissiveIntensity={3.8} />
        </mesh>
      </MotionRig>
      <Gift position={[-1.25, -0.45, 0.45]} color="#d84b5d" />
      <Gift position={[1.15, -0.45, 0.3]} color="#407bc4" ribbon="#fff0a6" scale={0.82} />
      <Gift position={[0.2, -0.47, 1.25]} color="#f1b834" ribbon="#d84b5d" scale={0.68} />
    </>
  )
}
