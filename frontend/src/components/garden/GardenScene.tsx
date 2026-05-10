import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, Stars, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { GardenState } from '../../types'

function Ground({ level }: { level: number }) {
  const groundColor = level < 1 ? '#8B6914' : level < 3 ? '#4a7c4a' : '#2d6a2d'
  const innerColor = level < 1 ? '#9a7520' : level < 3 ? '#3d6e3d' : '#246124'
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color={groundColor} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <circleGeometry args={[9, 32]} />
        <meshLambertMaterial color={innerColor} />
      </mesh>
    </>
  )
}

function Tree({
  position, scale = 1, hasFruit = false,
}: {
  position: [number, number, number]; scale?: number; hasFruit?: boolean
}) {
  const fruitAngles = [0, 90, 180, 270]
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.19, 1.1, 7]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>
      <mesh castShadow position={[0, 2.0, 0]}>
        <coneGeometry args={[1.15, 1.9, 7]} />
        <meshLambertMaterial color="#1b5e20" />
      </mesh>
      <mesh castShadow position={[0, 3.1, 0]}>
        <coneGeometry args={[0.82, 1.5, 7]} />
        <meshLambertMaterial color="#2e7d32" />
      </mesh>
      <mesh castShadow position={[0, 3.95, 0]}>
        <coneGeometry args={[0.5, 1.1, 7]} />
        <meshLambertMaterial color="#43a047" />
      </mesh>
      {hasFruit &&
        fruitAngles.map((a, i) => (
          <mesh
            key={i}
            castShadow
            position={[
              Math.cos((a * Math.PI) / 180) * 0.75,
              2.4,
              Math.sin((a * Math.PI) / 180) * 0.75,
            ]}
          >
            <sphereGeometry args={[0.13, 6, 6]} />
            <meshLambertMaterial color={i % 2 === 0 ? '#e53935' : '#fb8c00'} />
          </mesh>
        ))}
    </group>
  )
}

function Flower({
  position, color, size = 1,
}: {
  position: [number, number, number]; color: string; size?: number
}) {
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.36, 5]} />
        <meshLambertMaterial color="#558b2f" />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <sphereGeometry args={[0.082, 6, 6]} />
        <meshLambertMaterial color="#fdd835" />
      </mesh>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((angle * Math.PI) / 180) * 0.135,
            0.38,
            Math.sin((angle * Math.PI) / 180) * 0.135,
          ]}
        >
          <sphereGeometry args={[0.068, 5, 5]} />
          <meshLambertMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

function Sprout({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.16, 5]} />
        <meshLambertMaterial color="#66bb6a" />
      </mesh>
      <mesh position={[0.055, 0.19, 0]} rotation={[0, 0, -0.5]}>
        <sphereGeometry args={[0.042, 5, 5]} />
        <meshLambertMaterial color="#81c784" />
      </mesh>
      <mesh position={[-0.04, 0.16, 0]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.032, 5, 5]} />
        <meshLambertMaterial color="#a5d6a7" />
      </mesh>
    </group>
  )
}

function GoldenFlower({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.6}>
      <group position={position}>
        <mesh>
          <sphereGeometry args={[0.1, 7, 7]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.4} />
        </mesh>
        {[0, 72, 144, 216, 288].map((a, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((a * Math.PI) / 180) * 0.19,
              0,
              Math.sin((a * Math.PI) / 180) * 0.19,
            ]}
          >
            <sphereGeometry args={[0.07, 5, 5]} />
            <meshStandardMaterial color="#FFE082" emissive="#FFF176" emissiveIntensity={0.25} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

function Pond({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshPhongMaterial).opacity =
        0.65 + Math.sin(clock.elapsedTime * 0.8) * 0.1
    }
  })
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2, 24]} />
      <meshPhongMaterial color="#29b6f6" transparent opacity={0.72} shininess={130} />
    </mesh>
  )
}

function CentralFeature({ level }: { level: number }) {
  return (
    <group>
      <mesh position={[0, -0.37, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.46, 0.28, 10]} />
        <meshLambertMaterial color="#9E9E9E" />
      </mesh>
      <mesh position={[0, -0.22, 0]} castShadow>
        <cylinderGeometry args={[0.21, 0.36, 0.16, 10]} />
        <meshLambertMaterial color="#BDBDBD" />
      </mesh>
      {level >= 2 && (
        <Float speed={1.4} floatIntensity={0.45}>
          <group position={[0, 0.32, 0]} scale={1.4}>
            <Flower position={[0, 0, 0]} color="#f48fb1" size={0.85} />
          </group>
        </Float>
      )}
    </group>
  )
}

function GardenElements({ garden }: { garden: GardenState }) {
  const { level, flowers, petals, branches, streak_flowers } = garden

  const treePositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(Math.max(branches, 0) * 2 + Math.floor(level / 2), 16)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + i * 0.28
      const radius = 3.8 + (i % 4) * 1.3
      return [Math.cos(angle) * radius, -0.5, Math.sin(angle) * radius]
    })
  }, [branches, level])

  const flowerPositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(flowers * 3 + petals, 45)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + i * 0.72
      const radius = 0.9 + (i % 7) * 0.52
      return [Math.cos(angle) * radius, -0.5, Math.sin(angle) * radius]
    })
  }, [flowers, petals])

  const sproutPositions = useMemo<[number, number, number][]>(() => {
    if (level > 1) return []
    return Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2
      return [Math.cos(angle) * 2.2, -0.5, Math.sin(angle) * 2.2]
    })
  }, [level])

  const colors = ['#f48fb1', '#ffd54f', '#ff7043', '#66bb6a', '#42a5f5', '#ce93d8', '#ff8a65', '#4db6ac', '#ef9a9a', '#80cbc4']

  return (
    <group>
      {treePositions.map((pos, i) => (
        <Tree key={i} position={pos} scale={0.62 + (i % 3) * 0.18} hasFruit={level >= 5} />
      ))}
      {flowerPositions.map((pos, i) => (
        <Flower key={i} position={pos} color={colors[i % colors.length]} size={0.75 + (i % 4) * 0.12} />
      ))}
      {sproutPositions.map((pos, i) => (
        <Sprout key={i} position={pos} />
      ))}
      {streak_flowers > 0 &&
        Array.from({ length: Math.min(streak_flowers, 7) }).map((_, i) => (
          <GoldenFlower
            key={i}
            position={[
              Math.cos((i / Math.max(streak_flowers, 1)) * Math.PI * 2) * 1.6,
              1.6,
              Math.sin((i / Math.max(streak_flowers, 1)) * Math.PI * 2) * 1.6,
            ]}
          />
        ))}
      {level >= 5 && <Pond position={[5, -0.49, 3.5]} />}
    </group>
  )
}

const DEFAULT_GARDEN: GardenState = {
  total_verses: 0, petals: 0, flowers: 0, branches: 0,
  streak_flowers: 0, level: 0, level_name: "Zari'",
}

export default function GardenScene({ gardenState }: { gardenState?: GardenState | null }) {
  const garden = gardenState ?? DEFAULT_GARDEN
  const sunY = garden.streak_flowers > 3 ? 90 : garden.total_verses > 100 ? 55 : 22
  const sunPos: [number, number, number] = [100, sunY, 100]

  return (
    <Canvas shadows camera={{ position: [0, 9, 17], fov: 50 }} gl={{ antialias: true }}>
      <color attach="background" args={['#aed6f1']} />
      <fog attach="fog" args={['#c5e8f7', 24, 58]} />

      <ambientLight intensity={0.52} color="#fff8e1" />
      <directionalLight
        castShadow
        position={[12, 18, 8]}
        intensity={1.45}
        color="#fff9e6"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-far={42}
      />
      <pointLight position={[0, 6, 0]} intensity={0.22} color="#c8e6c9" />

      <Sky sunPosition={sunPos} turbidity={2.5} rayleigh={0.45} mieCoefficient={0.003} mieDirectionalG={0.82} />

      {garden.streak_flowers > 5 && (
        <Stars radius={80} depth={40} count={700} factor={3} fade speed={0.4} />
      )}
      {garden.streak_flowers > 0 && (
        <Sparkles
          count={Math.min(garden.streak_flowers * 14, 90)}
          scale={13}
          size={2.2}
          speed={0.35}
          color="#ffd700"
          opacity={0.65}
        />
      )}

      <Ground level={garden.level} />
      <GardenElements garden={garden} />
      <CentralFeature level={garden.level} />

      <OrbitControls
        autoRotate
        autoRotateSpeed={0.3}
        minPolarAngle={Math.PI / 7}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={7}
        maxDistance={22}
        enablePan={false}
        makeDefault
      />
    </Canvas>
  )
}
