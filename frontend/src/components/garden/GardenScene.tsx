import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sky, Stars, Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import type { GardenState } from '../../types'

// ─── GROUND ──────────────────────────────────────────────────────────────────
function Ground({ level }: { level: number }) {
  const base = level < 1 ? '#a0835a' : level < 3 ? '#5a8a45' : '#3d7a32'
  const mid = level < 1 ? '#b0955e' : level < 3 ? '#4e7c3a' : '#347028'
  return (
    <>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color={base} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.48, 0]}>
        <circleGeometry args={[10, 32]} />
        <meshLambertMaterial color={mid} />
      </mesh>
      {/* Stepping stone path */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={i} receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[i * 0.7, -0.47, -3 + Math.abs(i) * 0.2]}>
          <circleGeometry args={[0.25, 8]} />
          <meshLambertMaterial color="#BDBDBD" />
        </mesh>
      ))}
    </>
  )
}

// ─── TULIP (Reading — 1 per 'petal') ─────────────────────────────────────────
function Tulip({ position, color = '#ff9eb5', size = 1 }: {
  position: [number, number, number]; color?: string; size?: number
}) {
  return (
    <group position={position} scale={size}>
      {/* Stem */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.014, 0.018, 0.44, 5]} />
        <meshLambertMaterial color="#3a7d3a" />
      </mesh>
      {/* Leaf */}
      <mesh position={[0.08, 0.13, 0]} rotation={[0.15, 0, 0.6]}>
        <boxGeometry args={[0.13, 0.04, 0.012]} />
        <meshLambertMaterial color="#4caf50" />
      </mesh>
      {/* Tulip cup lower */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.048, 0.032, 0.065, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Tulip cup upper — slightly wider */}
      <mesh position={[0, 0.51, 0]}>
        <cylinderGeometry args={[0.065, 0.048, 0.055, 6]} />
        <meshLambertMaterial color={color} />
      </mesh>
      {/* Stamen dot */}
      <mesh position={[0, 0.545, 0]}>
        <sphereGeometry args={[0.022, 5, 5]} />
        <meshLambertMaterial color="#ffd700" />
      </mesh>
    </group>
  )
}

// ─── ROSE (Recitation — 1 per 'flower') ──────────────────────────────────────
function Rose({ position, color = '#c0392b', size = 1 }: {
  position: [number, number, number]; color?: string; size?: number
}) {
  const inner = color === '#c0392b' ? '#e74c3c' : '#ffcdd2'
  return (
    <group position={position} scale={size}>
      {/* Stem */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.013, 0.017, 0.44, 5]} />
        <meshLambertMaterial color="#2d6a2d" />
      </mesh>
      {/* Thorn */}
      <mesh position={[0.025, 0.1, 0]} rotation={[0, 0, -0.4]}>
        <coneGeometry args={[0.007, 0.03, 4]} />
        <meshLambertMaterial color="#5d4037" />
      </mesh>
      {/* Leaf */}
      <mesh position={[-0.07, 0.18, 0]} rotation={[0.1, 0, -0.5]}>
        <boxGeometry args={[0.1, 0.045, 0.012]} />
        <meshLambertMaterial color="#388e3c" />
      </mesh>
      {/* Rose layers */}
      <mesh position={[0, 0.47, 0]}>
        <sphereGeometry args={[0.078, 7, 7]} />
        <meshLambertMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.505, 0]}>
        <sphereGeometry args={[0.055, 6, 6]} />
        <meshLambertMaterial color={inner} />
      </mesh>
      <mesh position={[0, 0.526, 0]}>
        <sphereGeometry args={[0.03, 5, 5]} />
        <meshLambertMaterial color="#ffeaea" />
      </mesh>
    </group>
  )
}

// ─── LAVENDER (Memorization — 1 per 'branch') ────────────────────────────────
function Lavender({ position, size = 1 }: {
  position: [number, number, number]; size?: number
}) {
  const offsets: [number, number, number][] = [
    [0, 0, 0], [0.045, 0, 0.025], [-0.04, 0, -0.02],
    [0.02, 0, -0.045], [-0.025, 0, 0.04], [0.055, 0, -0.03],
    [-0.035, 0, 0.05],
  ]
  return (
    <group position={position} scale={size}>
      {offsets.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.007, 0.01, 0.36, 4]} />
            <meshLambertMaterial color="#5a7a2f" />
          </mesh>
          <mesh position={[0, 0.39, 0]}>
            <cylinderGeometry args={[0.011, 0.005, 0.1, 5]} />
            <meshLambertMaterial color="#8e44ad" />
          </mesh>
          {[0, 0.03, 0.06, 0.09].map((dh, j) => (
            <mesh key={j} position={[0, 0.345 + dh, 0]}>
              <sphereGeometry args={[0.013, 4, 4]} />
              <meshLambertMaterial color={j % 2 === 0 ? '#9b59b6' : '#a569bd'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ─── NARCISSUS (Streak — 1 per 'streak_flower') ───────────────────────────────
function Narcissus({ position, golden = false, size = 1 }: {
  position: [number, number, number]; golden?: boolean; size?: number
}) {
  const petalColor = golden ? '#ffe082' : '#fffff0'
  const coronaColor = golden ? '#ff8f00' : '#e67e22'
  return (
    <group position={position} scale={size}>
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.42, 5]} />
        <meshLambertMaterial color="#3a7d3a" />
      </mesh>
      {/* 6 petals */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh
          key={i}
          position={[
            Math.cos((angle * Math.PI) / 180) * 0.065,
            0.44,
            Math.sin((angle * Math.PI) / 180) * 0.065,
          ]}
        >
          <boxGeometry args={[0.09, 0.034, 0.012]} />
          <meshLambertMaterial color={petalColor} />
        </mesh>
      ))}
      {/* Corona */}
      <mesh position={[0, 0.44, 0]}>
        <cylinderGeometry args={[0.026, 0.03, 0.038, 6]} />
        <meshLambertMaterial color={coronaColor} />
      </mesh>
      {/* Stamen */}
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[0.016, 5, 5]} />
        <meshLambertMaterial color="#ffd700" />
      </mesh>
    </group>
  )
}

// ─── POMEGRANATE TREE (رمان — Al-An'am 6:99, 6:141; Ar-Rahman 55:68) ─────────
function PomegranateTree({ position, scale = 1 }: {
  position: [number, number, number]; scale?: number
}) {
  const fruits: [number, number, number][] = [
    [0.45, 1.45, 0.3], [-0.42, 1.62, 0.18], [0.18, 1.78, -0.5],
    [-0.3, 1.32, -0.42], [0.58, 1.68, -0.22], [-0.5, 1.5, -0.32],
    [0.28, 1.4, 0.55],
  ]
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.2, 1.1, 7]} />
        <meshLambertMaterial color="#5D4037" />
      </mesh>
      <mesh position={[0.14, 0.85, 0.1]} rotation={[0.2, 0, 0.3]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.55, 6]} />
        <meshLambertMaterial color="#6D4C41" />
      </mesh>
      {/* Canopy blobs (no cones!) */}
      <mesh position={[0, 1.82, 0]} castShadow>
        <sphereGeometry args={[0.88, 10, 8]} />
        <meshLambertMaterial color="#2d5a1b" />
      </mesh>
      <mesh position={[0.32, 1.62, 0.22]} castShadow>
        <sphereGeometry args={[0.55, 8, 7]} />
        <meshLambertMaterial color="#3a6b22" />
      </mesh>
      <mesh position={[-0.32, 1.68, -0.18]} castShadow>
        <sphereGeometry args={[0.5, 8, 7]} />
        <meshLambertMaterial color="#316020" />
      </mesh>
      {/* Pomegranate fruits */}
      {fruits.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.092, 7, 7]} />
            <meshLambertMaterial color="#c0392b" />
          </mesh>
          {/* Crown (calyx) */}
          <mesh position={[0, 0.085, 0]}>
            <cylinderGeometry args={[0.038, 0.038, 0.055, 5]} />
            <meshLambertMaterial color="#7f8c00" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── FIG TREE (تين — At-Tin 95:1) ─────────────────────────────────────────────
function FigTree({ position, scale = 1 }: {
  position: [number, number, number]; scale?: number
}) {
  const figs: [number, number, number][] = [
    [0.45, 1.22, 0.35], [-0.5, 1.42, 0.12], [0.12, 1.62, -0.42],
    [-0.35, 1.12, -0.32], [0.55, 1.52, -0.18], [-0.22, 1.72, 0.32],
    [0.32, 1.32, 0.52], [-0.42, 1.58, -0.42],
  ]
  return (
    <group position={position} scale={scale}>
      {/* Wide squat trunk */}
      <mesh position={[0, 0.46, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.28, 0.92, 8]} />
        <meshLambertMaterial color="#6D4C41" />
      </mesh>
      {/* Wide spreading canopy — flattened sphere */}
      <mesh position={[0, 1.56, 0]} scale={[1.35, 0.82, 1.35]} castShadow>
        <sphereGeometry args={[0.98, 10, 8]} />
        <meshLambertMaterial color="#1a5c1a" />
      </mesh>
      <mesh position={[0.52, 1.42, 0.32]} castShadow>
        <sphereGeometry args={[0.52, 8, 7]} />
        <meshLambertMaterial color="#246b24" />
      </mesh>
      <mesh position={[-0.56, 1.38, -0.22]} castShadow>
        <sphereGeometry args={[0.5, 8, 7]} />
        <meshLambertMaterial color="#1e5e1e" />
      </mesh>
      {/* Fig fruits */}
      {figs.map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh castShadow scale={[0.9, 1.2, 0.9]}>
            <sphereGeometry args={[0.072, 6, 6]} />
            <meshLambertMaterial color={i % 3 === 0 ? '#6b3a6b' : i % 3 === 1 ? '#4a3060' : '#5a3d7a'} />
          </mesh>
          <mesh position={[0, 0.075, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.05, 4]} />
            <meshLambertMaterial color="#5d4037" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── DATE PALM (نخل — Maryam 19:23-25, many more) ────────────────────────────
function DatePalm({ position, scale = 1 }: {
  position: [number, number, number]; scale?: number
}) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.55, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.19, 3.1, 7]} />
        <meshLambertMaterial color="#8D6E63" />
      </mesh>
      {/* Trunk ring marks */}
      {[0.4, 0.8, 1.2, 1.6, 2.0, 2.4].map((h, i) => (
        <mesh key={i} position={[0, h, 0]}>
          <torusGeometry args={[0.16, 0.016, 5, 14]} />
          <meshLambertMaterial color="#795548" />
        </mesh>
      ))}
      {/* Fronds — 8 spreading arched fronds */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <group key={i} position={[0, 3.15, 0]} rotation={[0.58, angle, 0]}>
            {/* Frond rib */}
            <mesh position={[0, 0.55, 0]}>
              <boxGeometry args={[0.03, 1.1, 0.012]} />
              <meshLambertMaterial color="#2e6b1e" />
            </mesh>
            {/* Leaflets */}
            {[0.18, 0.32, 0.46, 0.60, 0.76].map((h, j) => (
              <group key={j}>
                <mesh position={[0.13, h, 0]} rotation={[0, 0, -0.45]}>
                  <boxGeometry args={[0.2, 0.015, 0.007]} />
                  <meshLambertMaterial color="#3a7d28" />
                </mesh>
                <mesh position={[-0.13, h, 0]} rotation={[0, 0, 0.45]}>
                  <boxGeometry args={[0.2, 0.015, 0.007]} />
                  <meshLambertMaterial color="#3a7d28" />
                </mesh>
              </group>
            ))}
          </group>
        )
      })}
      {/* Date clusters */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <group
          key={i}
          position={[
            Math.cos((angle * Math.PI) / 180) * 0.22,
            2.92,
            Math.sin((angle * Math.PI) / 180) * 0.22,
          ]}
        >
          {[0, 1, 2, 3, 4].map((j) => (
            <mesh key={j} position={[j * 0.055 - 0.11, -j * 0.04, 0]}>
              <sphereGeometry args={[0.035, 5, 5]} />
              <meshLambertMaterial color="#d4832a" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ─── OLIVE TREE (زيتون — At-Tin 95:1, An-Nur 24:35) ─────────────────────────
function OliveTree({ position, scale = 1 }: {
  position: [number, number, number]; scale?: number
}) {
  const olives: [number, number, number][] = [
    [0.32, 1.32, 0.22], [-0.4, 1.52, -0.12], [0.1, 1.72, -0.32],
    [-0.22, 1.22, 0.42], [0.52, 1.42, -0.32], [-0.32, 1.62, 0.32],
    [0.22, 1.12, -0.52], [-0.52, 1.42, 0.22], [0.38, 1.62, 0.42],
  ]
  return (
    <group position={position} scale={scale}>
      {/* Gnarled trunk */}
      <mesh position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.22, 1.08, 8]} />
        <meshLambertMaterial color="#8B7355" />
      </mesh>
      <mesh position={[0.13, 0.82, 0.08]} rotation={[0.12, 0, 0.25]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.52, 6]} />
        <meshLambertMaterial color="#9B8465" />
      </mesh>
      {/* Silver-green canopy */}
      <mesh position={[0, 1.74, 0]} castShadow>
        <sphereGeometry args={[0.85, 9, 8]} />
        <meshLambertMaterial color="#6B8E5A" />
      </mesh>
      <mesh position={[0.26, 1.58, 0.22]} castShadow>
        <sphereGeometry args={[0.52, 8, 7]} />
        <meshLambertMaterial color="#7A9E68" />
      </mesh>
      <mesh position={[-0.3, 1.62, -0.22]} castShadow>
        <sphereGeometry args={[0.5, 8, 7]} />
        <meshLambertMaterial color="#637E50" />
      </mesh>
      {/* Olive fruits */}
      {olives.map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} castShadow scale={[0.9, 1.4, 0.9]}>
          <sphereGeometry args={[0.042, 5, 5]} />
          <meshLambertMaterial color={i % 3 === 0 ? '#2c3e50' : i % 3 === 1 ? '#6d7f3c' : '#8B7355'} />
        </mesh>
      ))}
    </group>
  )
}

// ─── CENTRAL STONE FOUNTAIN ───────────────────────────────────────────────────
function CentralFeature({ level }: { level: number }) {
  return (
    <group>
      <mesh position={[0, -0.38, 0]} castShadow>
        <cylinderGeometry args={[0.38, 0.48, 0.26, 10]} />
        <meshLambertMaterial color="#9E9E9E" />
      </mesh>
      <mesh position={[0, -0.24, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.38, 0.14, 10]} />
        <meshLambertMaterial color="#BDBDBD" />
      </mesh>
      {level >= 2 && (
        <Float speed={1.5} floatIntensity={0.4}>
          <group position={[0, 0.18, 0]}>
            <Tulip position={[0, 0, 0]} color="#ff69b4" size={1.5} />
          </group>
        </Float>
      )}
    </group>
  )
}

// ─── SMALL POND ───────────────────────────────────────────────────────────────
function Pond({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    if (ref.current) {
      (ref.current.material as THREE.MeshPhongMaterial).opacity =
        0.68 + Math.sin(clock.elapsedTime * 0.7) * 0.1
    }
  })
  return (
    <group>
      <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshPhongMaterial color="#29b6f6" transparent opacity={0.72} shininess={130} />
      </mesh>
      {/* Pond rim */}
      <mesh position={[position[0], position[1] - 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.1, 24]} />
        <meshLambertMaterial color="#9E9E9E" />
      </mesh>
    </group>
  )
}

// ─── SEED INDICATOR (level 0) ─────────────────────────────────────────────────
function Seeds() {
  const positions: [number, number, number][] = [
    [0.5, -0.48, 0.3], [-0.4, -0.48, 0.5], [0.2, -0.48, -0.6],
    [-0.6, -0.48, -0.3], [0.8, -0.48, -0.5], [-0.8, -0.48, 0.2],
    [0.4, -0.48, 0.8], [-0.5, -0.48, -0.7],
  ]
  return (
    <>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.04, 5, 5]} />
          <meshLambertMaterial color="#8B6914" />
        </mesh>
      ))}
    </>
  )
}

// ─── MAIN GARDEN ELEMENTS ─────────────────────────────────────────────────────
function GardenElements({ garden }: { garden: GardenState }) {
  const { level, flowers, petals, branches, streak_flowers } = garden

  // TULIPS — from 'petals' (verses % 10): pink tulips for reading
  const tulipPositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(petals, 9)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2
      const r = 0.9 + (i % 3) * 0.35
      return [Math.cos(angle) * r, -0.5, Math.sin(angle) * r]
    })
  }, [petals])

  // ROSES — from 'flowers' (total_verses // 10): red/pink roses for recitation
  const rosePositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(Math.floor(flowers / 2), 15)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + 0.4
      const r = 1.5 + (i % 4) * 0.45
      return [Math.cos(angle) * r, -0.5, Math.sin(angle) * r]
    })
  }, [flowers])

  // LAVENDER — from 'branches' (total_verses // 100): for memorization
  const lavenderPositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(branches * 2, 8)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + 1.0
      const r = 2.5 + (i % 3) * 0.6
      return [Math.cos(angle) * r, -0.5, Math.sin(angle) * r]
    })
  }, [branches])

  // NARCISSUS — from 'streak_flowers': golden narcissus for streaks
  const narcissusPositions = useMemo<[number, number, number][]>(() => {
    const count = Math.min(streak_flowers, 6)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 + 0.8
      const r = 1.1 + (i % 2) * 0.4
      return [Math.cos(angle) * r, -0.5, Math.sin(angle) * r]
    })
  }, [streak_flowers])

  const tulipColors = ['#ff9eb5', '#e91e8c', '#ff69b4', '#ffb3c1', '#ff6b9d', '#ffc0cb', '#ff85a1', '#ff99b4', '#ffaabb']
  const roseColors = ['#c0392b', '#e74c3c', '#e91e63', '#f44336', '#c62828', '#d32f2f', '#b71c1c']

  return (
    <group>
      {/* Seeds if level 0 */}
      {level === 0 && <Seeds />}

      {/* TULIPS */}
      {tulipPositions.map((pos, i) => (
        <Tulip key={`t${i}`} position={pos} color={tulipColors[i % tulipColors.length]} size={0.85 + (i % 3) * 0.12} />
      ))}

      {/* ROSES */}
      {rosePositions.map((pos, i) => (
        <Rose key={`r${i}`} position={pos} color={roseColors[i % roseColors.length]} size={0.8 + (i % 4) * 0.1} />
      ))}

      {/* LAVENDER clusters */}
      {lavenderPositions.map((pos, i) => (
        <Lavender key={`l${i}`} position={pos} size={0.9 + (i % 2) * 0.15} />
      ))}

      {/* NARCISSUS (streak) */}
      {narcissusPositions.map((pos, i) => (
        streak_flowers > 3
          ? <Float key={`n${i}`} speed={1.8} floatIntensity={0.3}>
              <Narcissus position={pos} golden size={0.9} />
            </Float>
          : <Narcissus key={`n${i}`} position={pos} golden size={0.9} />
      ))}

      {/* POMEGRANATE TREE — level 3+ */}
      {level >= 3 && <PomegranateTree position={[-4.2, -0.5, -3.5]} scale={0.95} />}

      {/* DATE PALM — level 4+ */}
      {level >= 4 && <DatePalm position={[5.0, -0.5, -2.0]} scale={0.8} />}

      {/* FIG TREE — level 5+ */}
      {level >= 5 && <FigTree position={[-4.5, -0.5, 3.0]} scale={0.9} />}

      {/* OLIVE TREE — level 6+ */}
      {level >= 6 && <OliveTree position={[4.5, -0.5, 3.5]} scale={0.95} />}

      {/* POND — level 5+ */}
      {level >= 5 && <Pond position={[3.5, -0.49, 4.0]} />}

      {/* Golden sparkle field for high streaks */}
      {streak_flowers > 5 && (
        <Sparkles
          count={streak_flowers * 15}
          scale={14}
          size={2.5}
          speed={0.35}
          color="#ffd700"
          opacity={0.7}
        />
      )}
    </group>
  )
}

// ─── EXPORTED GARDEN SCENE ────────────────────────────────────────────────────
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
      <fog attach="fog" args={['#c5e8f7', 26, 60]} />

      <ambientLight intensity={0.52} color="#fff8e1" />
      <directionalLight
        castShadow
        position={[12, 18, 8]}
        intensity={1.45}
        color="#fff9e6"
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-far={45}
      />
      <pointLight position={[0, 6, 0]} intensity={0.22} color="#c8e6c9" />

      <Sky sunPosition={sunPos} turbidity={2.5} rayleigh={0.45} />

      {garden.streak_flowers > 6 && (
        <Stars radius={80} depth={40} count={700} factor={3} fade speed={0.4} />
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
        maxDistance={24}
        enablePan={false}
        makeDefault
      />
    </Canvas>
  )
}
