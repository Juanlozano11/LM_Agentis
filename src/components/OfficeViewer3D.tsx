/**
 * OfficeViewer3D — Premium skyscraper corporate office
 * City panorama · Realistic humans · Cinematic lighting
 */
import {
  Suspense, useRef, useState, useCallback, memo, useMemo,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

// ─── Scene dimensions ─────────────────────────────────────────────────────────
const FW = 18   // floor width
const FD = 15   // floor depth
const WH = 4.0  // wall height
const HW = FW / 2
const HD = FD / 2

// Desk grid: 3 front, 2 middle
const DESK_POS: [number, number][] = [
  [-4.5, -4.0],
  [ 0.0, -4.0],
  [ 4.5, -4.0],
  [-2.4, -1.6],
  [ 2.4, -1.6],
]

// ─── Procedural textures ──────────────────────────────────────────────────────
function makeFloorTex() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 512
  const g = c.getContext('2d')!
  const planks = ['#b89060','#c0986a','#b48858','#c49870','#aa8050']
  for (let y = 0; y < 512; y += 56) {
    const pi = Math.floor(y / 56)
    g.fillStyle = planks[pi % planks.length]
    g.fillRect(0, y, 512, 54)
    // grain
    for (let i = 0; i < 7; i++) {
      g.strokeStyle = `rgba(0,0,0,${0.025 + i * 0.008})`
      g.lineWidth = 0.6
      g.beginPath(); g.moveTo(0, y + 6 + i * 7)
      for (let x = 0; x < 512; x += 48)
        g.lineTo(x + 48, y + 6 + i * 7 + (Math.random() - 0.5) * 2.5)
      g.stroke()
    }
    // gap
    g.fillStyle = '#7a5a30'; g.fillRect(0, y + 54, 512, 2)
    // staggered joints
    const off = (pi % 2) * 180
    for (let x = off; x < 512; x += 360) {
      g.fillStyle = '#7a5a30'; g.fillRect(x, y, 2, 56)
    }
  }
  const vg = g.createLinearGradient(0, 0, 512, 512)
  vg.addColorStop(0, 'rgba(255,240,200,0.12)')
  vg.addColorStop(1, 'rgba(0,0,0,0.07)')
  g.fillStyle = vg; g.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(5, 4)
  return t
}

function makeDeskTex() {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#d0a870'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 10; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.03 + i * 0.01})`
    g.lineWidth = 0.8
    g.beginPath(); g.moveTo(0, 18 + i * 24)
    for (let x = 0; x < 256; x += 36)
      g.lineTo(x + 36, 18 + i * 24 + (Math.random() - 0.5) * 2)
    g.stroke()
  }
  const vg = g.createLinearGradient(0, 0, 256, 0)
  vg.addColorStop(0, 'rgba(255,240,200,0.18)')
  vg.addColorStop(0.5, 'rgba(255,255,255,0.07)')
  vg.addColorStop(1, 'rgba(0,0,0,0.1)')
  g.fillStyle = vg; g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2, 1)
  return t
}

// ─── City skyline (outside window) ───────────────────────────────────────────
const CityView = memo(({ accentColor }: { accentColor: string }) => {
  const seed = 42
  const buildings = useMemo(() => {
    const rng = (n: number) => Math.abs(Math.sin(seed * n * 127.1 + n * 311.7)) 
    const arr: { x: number; h: number; w: number; d: number; lit: boolean }[] = []
    for (let i = 0; i < 32; i++) {
      arr.push({
        x: -28 + i * 1.85 + rng(i) * 0.8,
        h:  3 + rng(i + 1) * 14,
        w:  1.0 + rng(i + 2) * 1.2,
        d:  0.8 + rng(i + 3) * 1.0,
        lit: rng(i + 5) > 0.4,
      })
    }
    return arr
  }, [])

  return (
    <group position={[0, -2, -HD - 2]}>
      {/* Sky gradient plane */}
      <mesh position={[0, 12, -2]}>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#3a6fa8" emissive="#2a5a90" emissiveIntensity={0.6} />
      </mesh>
      {/* Horizon haze */}
      <mesh position={[0, 4, -1]}>
        <planeGeometry args={[80, 8]} />
        <meshStandardMaterial color="#88aacc" emissive="#7090b8" emissiveIntensity={0.4} transparent opacity={0.55} />
      </mesh>
      {/* City buildings */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, -3 - (i % 4) * 1.5]}>
          <mesh castShadow={false}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#1a2035' : i % 3 === 1 ? '#232840' : '#1e2838'}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
          {/* Window grid on building */}
          {b.lit && Array.from({ length: Math.floor(b.h / 0.9) }).map((_, row) =>
            [-0.18, 0, 0.18].slice(0, Math.floor(b.w / 0.5)).map((wx, col) => (
              Math.sin(i * 17 + row * 5 + col * 3) > -0.3 ? (
                <mesh key={`${row}-${col}`} position={[wx * (b.w / 0.55), -b.h / 2 + 0.5 + row * 0.85, b.d / 2 + 0.01]}>
                  <planeGeometry args={[0.22, 0.35]} />
                  <meshStandardMaterial
                    color="#ffe8a0"
                    emissive="#ffcc60"
                    emissiveIntensity={Math.sin(i * 7 + row * 3) * 0.3 + 0.6}
                  />
                </mesh>
              ) : null
            ))
          )}
        </group>
      ))}
      {/* Ground / street level haze */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[80, 20]} />
        <meshStandardMaterial color="#1a2030" roughness={0.9} />
      </mesh>
      {/* Accent glow on horizon — matches office color */}
      <mesh position={[0, 1.5, -0.5]}>
        <planeGeometry args={[60, 3]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.15} transparent opacity={0.25} />
      </mesh>
    </group>
  )
})

// ─── Floor-to-ceiling panoramic windows ───────────────────────────────────────
const PanoramicWindows = memo(({ accentColor }: { accentColor: string }) => {
  // 5 large glass panels across back wall
  const panels = [-7.2, -3.6, 0, 3.6, 7.2]
  return (
    <group>
      {panels.map((wx, i) => (
        <group key={i} position={[wx, WH / 2, -HD + 0.05]}>
          {/* Glass panel */}
          <mesh>
            <planeGeometry args={[3.4, WH - 0.1]} />
            <meshStandardMaterial
              color="#a0c4e8"
              emissive="#80b0d8"
              emissiveIntensity={0.9}
              transparent
              opacity={0.28}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Thin frame */}
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[3.42, 0.03, 0.04]} />
            <meshStandardMaterial color="#c8c4be" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.03, WH - 0.08, 0.04]} />
            <meshStandardMaterial color="#c8c4be" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Floor strip */}
          <mesh position={[0, -(WH / 2) + 0.02, 0.01]}>
            <boxGeometry args={[3.42, 0.04, 0.04]} />
            <meshStandardMaterial color="#c8c4be" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Ceiling strip */}
          <mesh position={[0, WH / 2 - 0.02, 0.01]}>
            <boxGeometry args={[3.42, 0.04, 0.04]} />
            <meshStandardMaterial color="#c8c4be" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Sunlight shaft */}
          <pointLight position={[0, 0, 2]} intensity={3.5} distance={12} color="#c8dff8" />
          {i === 2 && (
            <spotLight
              position={[0, 1, 4]}
              angle={0.5}
              penumbra={0.9}
              intensity={5}
              color="#b8d8f8"
              target-position={[0, -2, -8]}
            />
          )}
        </group>
      ))}
      {/* Accentcolor bottom glow strip */}
      <mesh position={[0, 0.01, -HD + 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FW, 0.06]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.7} transparent opacity={0.5} />
      </mesh>
    </group>
  )
})

// ─── Chair ───────────────────────────────────────────────────────────────────
const Chair = memo(() => (
  <group position={[0, 0, 0.95]}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.54, 0.07, 0.52]} />
      <meshStandardMaterial color="#1c1c28" roughness={0.75} />
    </mesh>
    <mesh position={[0, 0.535, 0]}>
      <boxGeometry args={[0.47, 0.04, 0.45]} />
      <meshStandardMaterial color="#151522" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.92, -0.24]} castShadow>
      <boxGeometry args={[0.52, 0.72, 0.07]} />
      <meshStandardMaterial color="#1c1c28" roughness={0.75} />
    </mesh>
    <mesh position={[0, 0.92, -0.21]}>
      <boxGeometry args={[0.45, 0.64, 0.03]} />
      <meshStandardMaterial color="#141420" roughness={0.9} />
    </mesh>
    {[-0.28, 0.28].map((ax, i) => (
      <group key={i}>
        <mesh position={[ax, 0.68, 0.02]}>
          <boxGeometry args={[0.05, 0.22, 0.44]} />
          <meshStandardMaterial color="#121220" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[ax, 0.78, 0.1]}>
          <boxGeometry args={[0.07, 0.04, 0.32]} />
          <meshStandardMaterial color="#1e1e2c" roughness={0.85} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 0.24, 0]}>
      <cylinderGeometry args={[0.033, 0.033, 0.48, 8]} />
      <meshStandardMaterial color="#2a2a3c" metalness={0.9} roughness={0.15} />
    </mesh>
    {[0, 72, 144, 216, 288].map((deg, i) => {
      const r = (deg * Math.PI) / 180
      return (
        <mesh key={i} position={[Math.sin(r) * 0.24, 0.04, Math.cos(r) * 0.24]}>
          <boxGeometry args={[0.054, 0.035, 0.21]} />
          <meshStandardMaterial color="#2a2a3c" metalness={0.9} roughness={0.2} />
        </mesh>
      )
    })}
  </group>
))

// ─── Desk ────────────────────────────────────────────────────────────────────
const DESK_VARIANTS = ['#c8a070', '#cca878', '#c49868', '#d0aa80', '#c0986a']

const Desk = memo(({ accentColor, variant = 0 }: { accentColor: string; variant?: number }) => {
  const tex = useMemo(() => makeDeskTex(), [])
  return (
    <group>
      <RoundedBox args={[2.3, 0.055, 1.05]} radius={0.012} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial map={tex} color={DESK_VARIANTS[variant % DESK_VARIANTS.length]} roughness={0.28} metalness={0.03} />
      </RoundedBox>
      <mesh position={[0, 0.808, 0.52]}>
        <boxGeometry args={[2.28, 0.007, 0.008]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} transparent opacity={0.9} />
      </mesh>
      {[-0.94, 0.94].map((lx, i) => (
        <group key={i}>
          {[-0.36, 0.36].map((lz, j) => (
            <mesh key={j} position={[lx, 0.37, lz]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.74, 8]} />
              <meshStandardMaterial color="#181820" metalness={0.9} roughness={0.15} />
            </mesh>
          ))}
          <mesh position={[lx, 0.065, 0]}>
            <boxGeometry args={[0.034, 0.034, 0.76]} />
            <meshStandardMaterial color="#181820" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.808, 0.2]}>
        <boxGeometry args={[0.65, 0.016, 0.21]} />
        <meshStandardMaterial color="#232330" roughness={0.8} />
      </mesh>
      <mesh position={[0.58, 0.805, 0.18]}>
        <boxGeometry args={[0.26, 0.005, 0.21]} />
        <meshStandardMaterial color="#181820" roughness={0.95} />
      </mesh>
      {variant % 3 === 0 && (
        <group position={[-0.82, 0.808, 0.08]}>
          <Cylinder args={[0.034, 0.03, 0.08, 10]} position={[0, 0.04, 0]}>
            <meshStandardMaterial color="#282030" roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.032, 0.028, 0.002, 10]} position={[0, 0.083, 0]}>
            <meshStandardMaterial color="#1a0f0a" roughness={0.5} />
          </Cylinder>
        </group>
      )}
      {variant % 3 === 1 && (
        <mesh position={[-0.76, 0.808, -0.12]} rotation={[0, 0.18, 0]}>
          <boxGeometry args={[0.22, 0.008, 0.3]} />
          <meshStandardMaterial color={['#1a2a4a', '#2a1a1a', '#1a3028'][variant % 3]} roughness={0.9} />
        </mesh>
      )}
      <Chair />
    </group>
  )
})

// ─── Dual monitor setup ───────────────────────────────────────────────────────
const Monitor = memo(({ agent, color, active }: { agent: Agent; color: string; active: boolean }) => {
  const scrRef  = useRef<THREE.Mesh>(null)
  const glwRef  = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (scrRef.current) {
      const m = scrRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = active
        ? 0.9 + Math.sin(clock.elapsedTime * 2.1) * 0.1
        : 0.32 + Math.sin(clock.elapsedTime * 0.7) * 0.04
    }
    if (glwRef.current) {
      const m = glwRef.current.material as THREE.MeshStandardMaterial
      m.opacity = active ? 0.16 : 0.05
    }
  })

  return (
    <group>
      {/* Stand */}
      <mesh position={[0, 0.842, -0.24]}>
        <boxGeometry args={[0.2, 0.022, 0.15]} />
        <meshStandardMaterial color="#d0ccc4" metalness={0.75} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.06, -0.24]}>
        <boxGeometry args={[0.026, 0.43, 0.026]} />
        <meshStandardMaterial color="#c4c0b8" metalness={0.75} roughness={0.2} />
      </mesh>
      {/* Bezel */}
      <RoundedBox args={[1.1, 0.64, 0.042]} radius={0.01} position={[0, 1.37, -0.24]}>
        <meshStandardMaterial color="#131320" metalness={0.45} roughness={0.5} />
      </RoundedBox>
      {/* Screen surface */}
      <mesh ref={scrRef} position={[0, 1.37, -0.217]}>
        <planeGeometry args={[0.97, 0.54]} />
        <meshStandardMaterial
          color={active ? new THREE.Color(color).multiplyScalar(0.22) : '#07071a'}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.32}
          roughness={0.04}
        />
      </mesh>
      {/* Desk glow */}
      <mesh ref={glwRef} position={[0, 0.82, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.05} />
      </mesh>
      {/* Agent info */}
      <Text position={[0, 1.43, -0.204]} fontSize={0.072} color={active ? '#ffffff' : '#8888bb'} anchorX="center">
        {agent.emoji}  {agent.name}
      </Text>
      <Text position={[0, 1.33, -0.204]} fontSize={0.048} color={active ? color : '#44446a'} anchorX="center">
        {agent.role}
      </Text>
      <mesh position={[0.38, 1.19, -0.204]}>
        <circleGeometry args={[0.013, 10]} />
        <meshStandardMaterial
          color={agent.status === 'active' ? '#22dd88' : '#3a4455'}
          emissive={agent.status === 'active' ? '#22dd88' : '#000'}
          emissiveIntensity={1.2}
        />
      </mesh>
      {active && <pointLight position={[0, 1.37, -0.06]} intensity={0.5} distance={1.6} color={color} />}
    </group>
  )
})

// ─── Proportional human character ─────────────────────────────────────────────
const SKINS = ['#c89060', '#a06842', '#ddb880', '#7a4832', '#d09858', '#b07848']
const SHIRTS = ['#2a3252', '#3a2a44', '#1e3228', '#38280e', '#2a1c3c', '#1e2c3e']
const PANTS  = ['#1c2030', '#242030', '#1c2820', '#28201c', '#202028']
const HAIR   = ['#1a1008', '#0a0806', '#3a2810', '#281810', '#1a0e08']

type Behavior = 'typing' | 'reading' | 'thinking'

const HumanWorker = memo(({ index, behavior }: { index: number; behavior: Behavior }) => {
  const torso = useRef<THREE.Group>(null)
  const head  = useRef<THREE.Group>(null)
  const rArm  = useRef<THREE.Group>(null)
  const lArm  = useRef<THREE.Group>(null)
  const rHand = useRef<THREE.Mesh>(null)
  const lHand = useRef<THREE.Mesh>(null)

  const off = useMemo(() => index * 1.38, [index])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + off

    // Breathing
    if (torso.current) {
      torso.current.scale.y = 1 + Math.sin(t * 0.9) * 0.008
      torso.current.position.y = 0.92 + Math.sin(t * 0.9) * 0.006
    }
    // Head micro-movement
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.32) * 0.2
      head.current.rotation.x = -0.05 + Math.sin(t * 0.5) * 0.06
      head.current.rotation.z = Math.sin(t * 0.2) * 0.025
    }
    const speed = behavior === 'typing' ? 5.5 : behavior === 'reading' ? 0.4 : 0.6
    const amp   = behavior === 'typing' ? 0.12 : 0.05
    if (rArm.current) rArm.current.rotation.x = -0.52 + Math.sin(t * speed) * amp
    if (lArm.current) lArm.current.rotation.x = -0.52 + Math.cos(t * speed) * amp
    if (rHand.current) rHand.current.rotation.x = behavior === 'typing' ? Math.sin(t * speed * 1.2) * 0.15 : 0
    if (lHand.current) lHand.current.rotation.x = behavior === 'typing' ? Math.cos(t * speed * 1.2) * 0.15 : 0
  })

  const skin  = SKINS[index % SKINS.length]
  const shirt = SHIRTS[index % SHIRTS.length]
  const pants = PANTS[index % PANTS.length]
  const hair  = HAIR[index % HAIR.length]

  return (
    <group>
      {/* Legs */}
      {[-0.09, 0.09].map((lx, i) => (
        <group key={i} position={[lx, 0.56, 0.06]}>
          <mesh>
            <boxGeometry args={[0.1, 0.36, 0.1]} />
            <meshStandardMaterial color={pants} roughness={0.88} />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.21, 0.04]}>
            <boxGeometry args={[0.1, 0.07, 0.15]} />
            <meshStandardMaterial color="#181818" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Torso group */}
      <group ref={torso} position={[0, 0.92, 0]}>
        {/* Lower torso */}
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.27, 0.14, 0.16]} />
          <meshStandardMaterial color={pants} roughness={0.88} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, -0.01, 0]}>
          <boxGeometry args={[0.28, 0.03, 0.165]} />
          <meshStandardMaterial color="#0a0a12" roughness={0.7} />
        </mesh>
        {/* Shirt body */}
        <mesh position={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.28, 0.26, 0.17]} />
          <meshStandardMaterial color={shirt} roughness={0.82} />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 0.27, 0.06]}>
          <boxGeometry args={[0.1, 0.05, 0.04]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.8} />
        </mesh>

        {/* Shoulders */}
        {[-0.17, 0.17].map((sx, i) => (
          <mesh key={i} position={[sx, 0.17, 0]}>
            <sphereGeometry args={[0.072, 10, 10]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
        ))}

        {/* Right arm */}
        <group ref={rArm} position={[-0.2, 0.06, 0.06]}>
          <mesh rotation={[-0.52, 0, -0.06]} castShadow>
            <boxGeometry args={[0.074, 0.28, 0.074]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
          {/* Forearm */}
          <mesh ref={rHand} position={[0, -0.17, 0.07]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.065, 0.22, 0.065]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>

        {/* Left arm */}
        <group ref={lArm} position={[0.2, 0.06, 0.06]}>
          <mesh rotation={[-0.52, 0, 0.06]} castShadow>
            <boxGeometry args={[0.074, 0.28, 0.074]} />
            <meshStandardMaterial color={shirt} roughness={0.82} />
          </mesh>
          <mesh ref={lHand} position={[0, -0.17, 0.07]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.065, 0.22, 0.065]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.053, 0.06, 0.1, 8]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>

        {/* Head */}
        <group ref={head} position={[0, 0.42, 0]}>
          {/* Skull */}
          <mesh castShadow>
            <sphereGeometry args={[0.135, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          {/* Face flat */}
          <mesh position={[0, -0.01, 0.1]}>
            <planeGeometry args={[0.15, 0.15]} />
            <meshStandardMaterial color={new THREE.Color(skin).multiplyScalar(0.96)} roughness={0.8} />
          </mesh>
          {/* Eyes */}
          {[-0.043, 0.043].map((ex, i) => (
            <group key={i} position={[ex, 0.02, 0.126]}>
              {/* White */}
              <mesh>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#f0ece4" roughness={0.5} />
              </mesh>
              {/* Iris */}
              <mesh position={[0, 0, 0.013]}>
                <circleGeometry args={[0.012, 8]} />
                <meshStandardMaterial color="#1a2a4a" roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Nose */}
          <mesh position={[0, -0.015, 0.133]}>
            <boxGeometry args={[0.022, 0.028, 0.02]} />
            <meshStandardMaterial color={new THREE.Color(skin).multiplyScalar(0.9)} roughness={0.8} />
          </mesh>
          {/* Hair */}
          <mesh position={[0, 0.07, -0.015]}>
            <sphereGeometry args={[0.138, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.05, -0.1]}>
            <boxGeometry args={[0.24, 0.1, 0.1]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

// ─── Walking agent ────────────────────────────────────────────────────────────
const WalkingAgent = memo(({ color }: { color: string }) => {
  const grp  = useRef<THREE.Group>(null)
  const ll   = useRef<THREE.Group>(null)
  const rl   = useRef<THREE.Group>(null)
  const la   = useRef<THREE.Group>(null)
  const ra   = useRef<THREE.Group>(null)
  const head = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.5
    if (grp.current) {
      grp.current.position.x = Math.sin(t * 0.6) * 4.0
      grp.current.rotation.y = Math.cos(t * 0.6) > 0 ? 0 : Math.PI
    }
    const w = Math.sin(t * 4.2) * 0.38
    if (ll.current) ll.current.rotation.x = w
    if (rl.current) rl.current.rotation.x = -w
    if (la.current) la.current.rotation.x = -w * 0.5
    if (ra.current) ra.current.rotation.x = w * 0.5
    if (head.current) head.current.rotation.y = Math.sin(t * 0.4) * 0.15
  })

  const skin = SKINS[0]; const shirt = color; const pants = PANTS[1]; const hair = HAIR[0]

  return (
    <group ref={grp} position={[0, 0, 1.8]}>
      {/* Legs */}
      {[-0.09, 0.09].map((lx, i) => (
        <group key={i} ref={i === 0 ? ll : rl} position={[lx, 0.55, 0]}>
          <mesh><boxGeometry args={[0.1, 0.36, 0.1]} /><meshStandardMaterial color={pants} roughness={0.88} /></mesh>
          <mesh position={[0, -0.22, 0.04]}><boxGeometry args={[0.1, 0.07, 0.15]} /><meshStandardMaterial color="#181818" roughness={0.7} /></mesh>
        </group>
      ))}
      {/* Torso */}
      <mesh position={[0, 1.0, 0]} castShadow><boxGeometry args={[0.28, 0.38, 0.17]} /><meshStandardMaterial color={shirt} roughness={0.82} /></mesh>
      {/* Arms */}
      {[-0.2, 0.2].map((ax, i) => (
        <group key={i} ref={i === 0 ? la : ra} position={[ax, 1.05, 0]}>
          <mesh><boxGeometry args={[0.074, 0.28, 0.074]} /><meshStandardMaterial color={shirt} roughness={0.82} /></mesh>
          <mesh position={[0, -0.2, 0.05]}><boxGeometry args={[0.065, 0.2, 0.065]} /><meshStandardMaterial color={skin} roughness={0.78} /></mesh>
        </group>
      ))}
      {/* Neck */}
      <mesh position={[0, 1.24, 0]}><cylinderGeometry args={[0.052, 0.058, 0.09, 8]} /><meshStandardMaterial color={skin} roughness={0.75} /></mesh>
      {/* Head */}
      <group ref={head} position={[0, 1.39, 0]}>
        <mesh castShadow><sphereGeometry args={[0.132, 16, 16]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
        {[-0.042, 0.042].map((ex, i) => (
          <mesh key={i} position={[ex, 0.02, 0.123]}>
            <sphereGeometry args={[0.019, 8, 8]} />
            <meshStandardMaterial color="#1a2a4a" roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.065, -0.015]}>
          <sphereGeometry args={[0.135, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
})

// ─── Workstation ──────────────────────────────────────────────────────────────
const WorkStation = memo(({ agent, position, color, index, selected, onSelect }: {
  agent: Agent; position: [number, number, number]; color: string
  index: number; selected: boolean; onSelect: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const active = selected || hovered
  const behaviors: Behavior[] = ['typing', 'typing', 'reading', 'thinking', 'typing']

  return (
    <group
      position={position}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <Desk accentColor={color} variant={index} />
      <Monitor agent={agent} color={color} active={active} />
      <HumanWorker index={index} behavior={behaviors[index % behaviors.length]} />
      {active && (
        <mesh position={[0, 0.004, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.5, 1.7]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.07} />
        </mesh>
      )}
    </group>
  )
})

// ─── Plant (tall) ─────────────────────────────────────────────────────────────
const Plant = memo(({ position, tall = false }: { position: [number, number, number]; tall?: boolean }) => {
  const h = tall ? 1.3 : 0.65
  return (
    <group position={position}>
      <Cylinder args={[0.14, 0.17, 0.33, 12]} position={[0, 0.165, 0]} castShadow>
        <meshStandardMaterial color="#e8e2d8" roughness={0.85} />
      </Cylinder>
      <mesh position={[0, 0.33, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 10]} />
        <meshStandardMaterial color="#1e1408" roughness={1} />
      </mesh>
      <Cylinder args={[0.015, 0.02, h, 6]} position={[0, 0.33 + h / 2, 0]}>
        <meshStandardMaterial color="#183810" roughness={0.9} />
      </Cylinder>
      {[0, 58, 116, 174, 232, 290].map((deg, i) => {
        const r = (deg * Math.PI) / 180
        const ht = 0.38 + (i / 5) * h * 0.82
        return (
          <mesh key={i} position={[Math.sin(r) * 0.2, ht, Math.cos(r) * 0.2]}
            rotation={[0.38 - i * 0.05, r, 0.3]}>
            <boxGeometry args={[0.038, 0.3 - i * 0.01, 0.014]} />
            <meshStandardMaterial color={['#246020', '#2e6826', '#1c5018', '#286828', '#205818', '#286020'][i % 6]} roughness={0.85} />
          </mesh>
        )
      })}
    </group>
  )
})

// ─── Lounge area ─────────────────────────────────────────────────────────────
const LoungeArea = memo(({ accentColor }: { accentColor: string }) => (
  <group position={[5.8, 0, 1.6]}>
    {/* Sofa */}
    <group>
      <mesh position={[0, 0.26, 0]} castShadow>
        <boxGeometry args={[1.8, 0.26, 0.78]} />
        <meshStandardMaterial color="#28283a" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.58, -0.32]} castShadow>
        <boxGeometry args={[1.8, 0.6, 0.19]} />
        <meshStandardMaterial color="#242436" roughness={0.85} />
      </mesh>
      {[-0.6, 0, 0.6].map((cx, i) => (
        <RoundedBox key={i} args={[0.52, 0.14, 0.66]} radius={0.06} position={[cx, 0.47, 0]}>
          <meshStandardMaterial color="#1e1e30" roughness={0.9} />
        </RoundedBox>
      ))}
      {[-0.82, 0.82].map((ax, i) => (
        <mesh key={i} position={[ax, 0.54, -0.06]}>
          <boxGeometry args={[0.16, 0.56, 0.7]} />
          <meshStandardMaterial color="#262638" roughness={0.88} />
        </mesh>
      ))}
      {[-0.76, 0.76].map((lx, i) => ([-0.3, 0.3].map((lz, j) => (
        <mesh key={`${i}-${j}`} position={[lx, 0.065, lz]}>
          <boxGeometry args={[0.055, 0.13, 0.055]} />
          <meshStandardMaterial color="#1a1a2a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))))}
    </group>
    {/* Coffee table */}
    <group position={[0, 0, -0.85]}>
      <RoundedBox args={[1.1, 0.04, 0.55]} radius={0.012} position={[0, 0.36, 0]}>
        <meshStandardMaterial color="#d0a870" roughness={0.28} metalness={0.03} />
      </RoundedBox>
      {/* Accent strip */}
      <mesh position={[0, 0.38, 0.275]}>
        <boxGeometry args={[1.08, 0.006, 0.008]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} />
      </mesh>
      {[-0.42, 0.42].map((tx, i) => ([-0.2, 0.2].map((tz, j) => (
        <mesh key={`${i}-${j}`} position={[tx, 0.18, tz]}>
          <cylinderGeometry args={[0.014, 0.014, 0.36, 6]} />
          <meshStandardMaterial color="#181820" metalness={0.85} roughness={0.2} />
        </mesh>
      ))))}
      {/* Items on table */}
      <Cylinder args={[0.03, 0.026, 0.07, 10]} position={[0.3, 0.4, 0]}>
        <meshStandardMaterial color="#282030" roughness={0.8} />
      </Cylinder>
      <mesh position={[-0.2, 0.383, -0.05]} rotation={[0, 0.2, 0]}>
        <boxGeometry args={[0.2, 0.007, 0.26]} />
        <meshStandardMaterial color="#1a2a4a" roughness={0.9} />
      </mesh>
    </group>
  </group>
))

// ─── Whiteboard ───────────────────────────────────────────────────────────────
const Whiteboard = memo(({ position, color }: { position: [number, number, number]; color: string }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[2.2, 1.2, 0.042]} />
      <meshStandardMaterial color="#f6f4ee" roughness={0.65} />
    </mesh>
    {[0.28, 0.1, -0.08, -0.26].map((y, i) => (
      <mesh key={i} position={[(i % 2 === 0 ? 0.04 : -0.06), y, 0.024]}>
        <boxGeometry args={[i === 0 ? 1.5 : 1.0, 0.014, 0.001]} />
        <meshStandardMaterial color={i === 0 ? color : '#bfbbb4'} emissive={i === 0 ? color : '#0'} emissiveIntensity={i === 0 ? 0.35 : 0} />
      </mesh>
    ))}
    {[
      { p: [0, 0.63, 0.022] as [number, number, number], s: [2.28, 0.055, 0.018] as [number, number, number] },
      { p: [0, -0.63, 0.022] as [number, number, number], s: [2.28, 0.055, 0.018] as [number, number, number] },
      { p: [-1.13, 0, 0.022] as [number, number, number], s: [0.055, 1.26, 0.018] as [number, number, number] },
      { p: [1.13, 0, 0.022] as [number, number, number], s: [0.055, 1.26, 0.018] as [number, number, number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p}>
        <boxGeometry args={f.s} />
        <meshStandardMaterial color="#c4c0b8" metalness={0.4} roughness={0.5} />
      </mesh>
    ))}
    <mesh position={[0, -0.66, 0.036]}>
      <boxGeometry args={[2.1, 0.04, 0.08]} />
      <meshStandardMaterial color="#c4c0b8" metalness={0.4} roughness={0.5} />
    </mesh>
  </group>
))

// ─── Wall art panel ──────────────────────────────────────────────────────────
const WallPanel = memo(({ position, color }: { position: [number, number, number]; color: string }) => (
  <group position={position}>
    <mesh>
      <boxGeometry args={[1.2, 0.85, 0.03]} />
      <meshStandardMaterial color="#f0ece4" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0, 0.018]}>
      <planeGeometry args={[1.05, 0.7]} />
      <meshStandardMaterial color="#080814" emissive={color} emissiveIntensity={0.3} roughness={0.1} />
    </mesh>
    <mesh position={[0, -0.025, 0.02]}>
      <planeGeometry args={[0.6, 0.02]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
    </mesh>
    {[
      { p: [0, 0.445, 0.018] as [number, number, number], s: [1.26, 0.05, 0.018] as [number, number, number] },
      { p: [0, -0.445, 0.018] as [number, number, number], s: [1.26, 0.05, 0.018] as [number, number, number] },
      { p: [-0.62, 0, 0.018] as [number, number, number], s: [0.05, 0.94, 0.018] as [number, number, number] },
      { p: [0.62, 0, 0.018] as [number, number, number], s: [0.05, 0.94, 0.018] as [number, number, number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p}>
        <boxGeometry args={f.s} />
        <meshStandardMaterial color="#c4c0b8" metalness={0.3} roughness={0.5} />
      </mesh>
    ))}
  </group>
))

// ─── Office room shell ────────────────────────────────────────────────────────
const OfficeRoom = memo(({ accentColor }: { accentColor: string }) => {
  const floorTex = useMemo(() => makeFloorTex(), [])

  return (
    <group>
      {/* Floor — warm oak */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial map={floorTex} roughness={0.32} metalness={0.02} />
      </mesh>

      {/* Ceiling — clean off-white */}
      <mesh position={[0, WH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial color="#f6f4f0" roughness={1} />
      </mesh>

      {/* Ceiling light panels */}
      {[[-4.2, -3.2], [0, -3.2], [4.2, -3.2], [-4.2, 0.2], [0, 0.2], [4.2, 0.2]].map(([cx, cz], i) => (
        <group key={i} position={[cx, WH - 0.008, cz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.5, 0.18]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff8f0" emissiveIntensity={5} />
          </mesh>
          <pointLight position={[0, -0.25, 0]} intensity={2.4} distance={7} color="#fff4e8" castShadow={i === 1} shadow-mapSize={[512, 512]} />
        </group>
      ))}

      {/* Left wall — warm light gray */}
      <mesh position={[-HW, WH / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#eeeae2" roughness={0.88} />
      </mesh>

      {/* Right wall — dark accent (corporate) */}
      <mesh position={[HW, WH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#1e1e2c" roughness={0.8} metalness={0.05} />
      </mesh>
      {/* Accent wall glow top */}
      <mesh position={[HW - 0.02, WH - 0.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[FD, 0.055, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.65} transparent opacity={0.75} />
      </mesh>
      <mesh position={[HW - 0.02, 0.03, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[FD, 0.04, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} transparent opacity={0.55} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, WH / 2, HD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[FW, WH]} />
        <meshStandardMaterial color="#eeeae2" roughness={0.88} />
      </mesh>

      {/* Baseboard */}
      {[
        { p: [-HW + 0.015, 0.05, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: FD },
        { p: [HW - 0.015, 0.05, 0] as [number, number, number], r: [0, -Math.PI / 2, 0] as [number, number, number], w: FD },
        { p: [0, 0.05, HD - 0.015] as [number, number, number], r: [0, Math.PI, 0] as [number, number, number], w: FW },
      ].map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w, 0.1, 0.025]} />
          <meshStandardMaterial color="#d4d0c8" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
})

// ─── Main scene ───────────────────────────────────────────────────────────────
function Scene({ agents, color, selectedId, onSelect }: {
  agents: Agent[]; color: string; selectedId: string | null; onSelect: (id: string) => void
}) {
  return (
    <>
      {/* Very strong ambient — guarantee zero dark areas */}
      <ambientLight intensity={2.6} color="#f8f4ee" />

      {/* Primary sun — large skyscraper window angle */}
      <directionalLight
        position={[-4, 10, -14]} intensity={3.2} color="#cce0ff"
        castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={40}
        shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={14} shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
      />
      {/* Secondary fill — front warm */}
      <directionalLight position={[4, 6, 8]} intensity={1.8} color="#fff8f0" />
      {/* Interior bounce warm */}
      <pointLight position={[0, 3.2, 2]} intensity={1.4} color="#ffe8c8" distance={18} />
      {/* Right accent wall bounce */}
      <pointLight position={[HW - 1, 2, 0]} intensity={0.8} color={color} distance={10} />

      <OfficeRoom accentColor={color} />
      <CityView accentColor={color} />
      <PanoramicWindows accentColor={color} />

      {/* Workstations */}
      {agents.slice(0, 5).map((agent, i) => {
        const [dx, dz] = DESK_POS[i]
        return (
          <WorkStation
            key={agent.id}
            agent={agent}
            position={[dx, 0, dz]}
            color={color}
            index={i}
            selected={selectedId === agent.id}
            onSelect={() => onSelect(agent.id)}
          />
        )
      })}

      {/* Walking agent */}
      <WalkingAgent color={color} />

      {/* Lounge */}
      <LoungeArea accentColor={color} />

      {/* Plants near windows */}
      <Plant position={[-HW + 0.5, 0, -HD + 1.5]} tall />
      <Plant position={[HW - 0.6, 0, -HD + 1.5]} tall />
      <Plant position={[-HW + 0.5, 0, 0.5]} />
      <Plant position={[HW - 0.6, 0, 0.8]} />

      {/* Whiteboards */}
      <Whiteboard position={[-3.8, 1.95, -HD + 0.06]} color={color} />
      <Whiteboard position={[3.8, 1.95, -HD + 0.06]} color={color} />

      {/* Wall panels on left wall */}
      <WallPanel position={[-HW + 0.022, 2.2, -1.0]} color={color} />
      <WallPanel position={[-HW + 0.022, 2.2, 1.6]} color={color} />

      <OrbitControls
        target={[0, 1.5, -1.5]}
        enablePan={false}
        minDistance={4}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.03}
        minPolarAngle={0.08}
        enableDamping
        dampingFactor={0.07}
        autoRotate
        autoRotateSpeed={0.18}
      />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function OfficeViewer3D({ agents, color, onAgentSelect }: {
  agents: Agent[]; color: string; onAgentSelect: (a: Agent | null) => void
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSelect = useCallback((id: string) => {
    const next = selectedId === id ? null : id
    setSelectedId(next)
    onAgentSelect(next ? (agents.find(a => a.id === next) ?? null) : null)
  }, [selectedId, agents, onAgentSelect])

  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.8, 9.5], fov: 52 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.45,
      }}
      style={{ background: '#7aaac8' }}
    >
      <Suspense fallback={null}>
        <Scene agents={agents} color={color} selectedId={selectedId} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  )
}

export default OfficeViewer3D
