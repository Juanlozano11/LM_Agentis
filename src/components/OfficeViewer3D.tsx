/**
 * OfficeViewer3D — Premium skyscraper corporate office
 * Correctly seated agents · Deep city skyline · Cinematic lighting
 */
import { Suspense, useRef, useState, useCallback, memo, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

// ─── Scene constants ──────────────────────────────────────────────────────────
const FW = 20, FD = 16, WH = 4.2
const HW = FW / 2, HD = FD / 2

// Desk positions [x, z] inside office — 3 front + 2 mid
const DESK_POS: [number, number][] = [
  [-4.8, -4.5],
  [ 0.0, -4.5],
  [ 4.8, -4.5],
  [-2.5, -1.8],
  [ 2.5, -1.8],
]

// ─── Procedural textures ──────────────────────────────────────────────────────
function makeFloorTex() {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 512
  const g = c.getContext('2d')!
  const planks = ['#be9a62', '#c4a06a', '#b89058', '#c8a870', '#b08850']
  for (let y = 0; y < 512; y += 58) {
    const pi = Math.floor(y / 58)
    g.fillStyle = planks[pi % planks.length]
    g.fillRect(0, y, 512, 56)
    for (let i = 0; i < 8; i++) {
      g.strokeStyle = `rgba(0,0,0,${0.025 + i * 0.007})`
      g.lineWidth = 0.6
      g.beginPath(); g.moveTo(0, y + 7 + i * 6.5)
      for (let x = 0; x < 512; x += 44)
        g.lineTo(x + 44, y + 7 + i * 6.5 + (Math.random() - 0.5) * 2.2)
      g.stroke()
    }
    g.fillStyle = '#7a5a30'; g.fillRect(0, y + 56, 512, 2)
    const off = (pi % 2) * 200
    for (let x = off; x < 512; x += 400) {
      g.fillStyle = '#7a5a30'; g.fillRect(x, y, 2, 58)
    }
  }
  const vg = g.createLinearGradient(0, 0, 512, 512)
  vg.addColorStop(0, 'rgba(255,245,210,0.14)'); vg.addColorStop(1, 'rgba(0,0,0,0.08)')
  g.fillStyle = vg; g.fillRect(0, 0, 512, 512)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 4)
  return t
}

function makeDeskTex() {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#d0a870'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 10; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.028 + i * 0.009})`; g.lineWidth = 0.7
    g.beginPath(); g.moveTo(0, 16 + i * 24)
    for (let x = 0; x < 256; x += 38)
      g.lineTo(x + 38, 16 + i * 24 + (Math.random() - 0.5) * 2)
    g.stroke()
  }
  const vg = g.createLinearGradient(0, 0, 256, 0)
  vg.addColorStop(0, 'rgba(255,240,200,0.18)'); vg.addColorStop(1, 'rgba(0,0,0,0.1)')
  g.fillStyle = vg; g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1)
  return t
}

// ─── City skyline ─────────────────────────────────────────────────────────────
const CityView = memo(({ color }: { color: string }) => {
  // Deterministic building data (no Math.random at render time)
  const buildings = useMemo(() => {
    const seeded = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 0.5 + Math.sin(n * 43.7) * 0.5)
    const arr: {
      x: number; z: number; h: number; w: number; d: number
      windows: { row: number; col: number; on: boolean }[]
    }[] = []
    // Far layer (z = -35): tall towers
    for (let i = 0; i < 22; i++) {
      const x = -30 + i * 2.8 + seeded(i) * 1.0
      const h = 8 + seeded(i + 0.1) * 22
      const w = 1.6 + seeded(i + 0.2) * 1.8
      const d = 1.2 + seeded(i + 0.3) * 1.2
      const cols = Math.floor(w / 0.55)
      const rows = Math.floor(h / 0.9)
      const windows: {row:number;col:number;on:boolean}[] = []
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          windows.push({ row: r, col: c, on: seeded(i*100+r*10+c) > 0.25 })
      arr.push({ x, z: -35, h, w, d, windows })
    }
    // Mid layer (z = -22): medium buildings
    for (let i = 0; i < 16; i++) {
      const x = -26 + i * 3.4 + seeded(i + 50) * 1.2
      const h = 4 + seeded(i + 50.1) * 12
      const w = 1.4 + seeded(i + 50.2) * 1.6
      const d = 1.0 + seeded(i + 50.3) * 1.0
      const cols = Math.floor(w / 0.55)
      const rows = Math.floor(h / 0.9)
      const windows: {row:number;col:number;on:boolean}[] = []
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          windows.push({ row: r, col: c, on: seeded(i*100+r*10+c+200) > 0.3 })
      arr.push({ x, z: -22, h, w, d, windows })
    }
    return arr
  }, [])

  return (
    <group>
      {/* Sky dome — gradient using stacked planes */}
      <mesh position={[0, 22, -HD - 5]}>
        <planeGeometry args={[100, 30]} />
        <meshStandardMaterial color="#1a4a7a" emissive="#1040708" emissiveIntensity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 14, -HD - 4]}>
        <planeGeometry args={[100, 16]} />
        <meshStandardMaterial color="#2a6090" emissive="#204878" emissiveIntensity={0.4} transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 7, -HD - 3]}>
        <planeGeometry args={[100, 10]} />
        <meshStandardMaterial color="#4882b0" emissive="#386898" emissiveIntensity={0.35} transparent opacity={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Horizon haze */}
      <mesh position={[0, 1, -HD - 2]}>
        <planeGeometry args={[100, 8]} />
        <meshStandardMaterial color="#88b0cc" emissive="#6090aa" emissiveIntensity={0.3} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      {/* City ground (far below — simulates height) */}
      <mesh position={[0, -28, -HD - 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[120, 80]} />
        <meshStandardMaterial color="#121820" roughness={0.9} />
      </mesh>
      {/* Street level glow */}
      <mesh position={[0, -22, -HD - 4]} rotation={[-Math.PI / 8, 0, 0]}>
        <planeGeometry args={[80, 6]} />
        <meshStandardMaterial color="#fff0a0" emissive="#ffcc40" emissiveIntensity={0.4} transparent opacity={0.25} />
      </mesh>

      {/* Buildings */}
      {buildings.map((b, bi) => {
        const baseY = b.h / 2 - 28  // ground at y=-28, buildings grow upward
        const colW = b.w / Math.max(1, Math.floor(b.w / 0.55))
        return (
          <group key={bi} position={[b.x, baseY, b.z]}>
            {/* Building body */}
            <mesh>
              <boxGeometry args={[b.w, b.h, b.d]} />
              <meshStandardMaterial
                color={bi % 4 === 0 ? '#16202e' : bi % 4 === 1 ? '#1c2840' : bi % 4 === 2 ? '#1a2232' : '#202a3c'}
                roughness={0.6} metalness={0.35}
              />
            </mesh>
            {/* Roof top accent */}
            <mesh position={[0, b.h / 2 + 0.04, 0]}>
              <boxGeometry args={[b.w * 0.6, 0.08, b.d * 0.6]} />
              <meshStandardMaterial color={bi % 3 === 0 ? color : '#334466'} emissive={bi % 3 === 0 ? color : '#0'} emissiveIntensity={0.4} transparent opacity={0.6} />
            </mesh>
            {/* Window grid */}
            {b.windows.filter(w => w.on).map((w, wi) => {
              const wx = -b.w / 2 + (w.col + 0.5) * colW
              const wy = -b.h / 2 + 0.5 + w.row * 0.88
              return (
                <mesh key={wi} position={[wx, wy, b.d / 2 + 0.01]}>
                  <planeGeometry args={[colW * 0.65, 0.42]} />
                  <meshStandardMaterial
                    color="#ffe8a0"
                    emissive="#ffcc50"
                    emissiveIntensity={0.45 + Math.sin(bi * 7 + w.row * 3 + w.col) * 0.2}
                  />
                </mesh>
              )
            })}
          </group>
        )
      })}

      {/* Color accent on horizon (matches office brand color) */}
      <mesh position={[0, -16, -HD - 2.5]}>
        <planeGeometry args={[80, 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
})

// ─── Panoramic floor-to-ceiling glass wall ────────────────────────────────────
const GlassWall = memo(({ color: _color }: { color: string }) => {
  // 5 full-height glass panels
  const panels = [-8, -4, 0, 4, 8]
  return (
    <group position={[0, 0, -HD + 0.04]}>
      {/* Solid wall below window line - none (full floor to ceiling) */}
      {/* Structural columns between panels */}
      {[-10, -6, -2, 2, 6, 10].map((cx, i) => (
        <mesh key={i} position={[cx, WH / 2, 0]} castShadow>
          <boxGeometry args={[0.12, WH, 0.1]} />
          <meshStandardMaterial color="#b8b4ae" metalness={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Top horizontal beam */}
      <mesh position={[0, WH - 0.06, 0]}>
        <boxGeometry args={[FW, 0.12, 0.1]} />
        <meshStandardMaterial color="#b8b4ae" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Floor beam */}
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[FW, 0.08, 0.1]} />
        <meshStandardMaterial color="#b8b4ae" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Glass panels */}
      {panels.map((px, i) => (
        <group key={i} position={[px, WH / 2, 0]}>
          <mesh>
            <planeGeometry args={[3.76, WH - 0.18]} />
            <meshStandardMaterial
              color="#90bcd8"
              emissive="#60a0cc"
              emissiveIntensity={0.7}
              transparent opacity={0.22}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Mid horizontal rail */}
          <mesh position={[0, -WH * 0.15, 0.02]}>
            <boxGeometry args={[3.8, 0.04, 0.04]} />
            <meshStandardMaterial color="#c0bcb6" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Sunlight from each panel */}
          <pointLight position={[0, 0, 3]} intensity={3.8} distance={14} color="#b8d8f8" />
          {i === 2 && (
            <spotLight position={[0, 1, 6]} angle={0.45} penumbra={0.85}
              intensity={5} color="#a8ccf0" target-position={[0, -3, -20]} />
          )}
        </group>
      ))}
    </group>
  )
})

// ─── Chair ────────────────────────────────────────────────────────────────────
const OfficChair = memo(() => (
  <group>
    {/* Seat */}
    <mesh position={[0, 0.49, 0]} castShadow>
      <boxGeometry args={[0.54, 0.072, 0.52]} />
      <meshStandardMaterial color="#1a1a26" roughness={0.78} />
    </mesh>
    <mesh position={[0, 0.528, 0]}>
      <boxGeometry args={[0.47, 0.04, 0.45]} />
      <meshStandardMaterial color="#131320" roughness={0.92} />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.935, -0.245]} castShadow>
      <boxGeometry args={[0.52, 0.72, 0.072]} />
      <meshStandardMaterial color="#1a1a26" roughness={0.78} />
    </mesh>
    <mesh position={[0, 0.935, -0.21]}>
      <boxGeometry args={[0.45, 0.64, 0.035]} />
      <meshStandardMaterial color="#121220" roughness={0.92} />
    </mesh>
    {/* Armrests */}
    {[-0.29, 0.29].map((ax, i) => (
      <group key={i}>
        <mesh position={[ax, 0.69, -0.04]}>
          <boxGeometry args={[0.052, 0.22, 0.44]} />
          <meshStandardMaterial color="#111118" metalness={0.55} roughness={0.38} />
        </mesh>
        <mesh position={[ax, 0.8, 0.06]}>
          <boxGeometry args={[0.07, 0.04, 0.3]} />
          <meshStandardMaterial color="#1e1e2c" roughness={0.88} />
        </mesh>
      </group>
    ))}
    {/* Gas cylinder */}
    <mesh position={[0, 0.25, 0]}>
      <cylinderGeometry args={[0.034, 0.034, 0.5, 8]} />
      <meshStandardMaterial color="#2c2c3c" metalness={0.9} roughness={0.14} />
    </mesh>
    {/* Star base */}
    {[0, 72, 144, 216, 288].map((deg, i) => {
      const r = (deg * Math.PI) / 180
      return (
        <mesh key={i} position={[Math.sin(r) * 0.25, 0.038, Math.cos(r) * 0.25]}>
          <boxGeometry args={[0.056, 0.036, 0.22]} />
          <meshStandardMaterial color="#2c2c3c" metalness={0.9} roughness={0.2} />
        </mesh>
      )
    })}
  </group>
))

// ─── Desk ─────────────────────────────────────────────────────────────────────
const OfficeDsk = memo(({ color, variant = 0 }: { color: string; variant?: number }) => {
  const tex = useMemo(() => makeDeskTex(), [])
  const tops = ['#c8a068', '#cca870', '#c49860', '#d0aa78', '#c0986a']
  return (
    <group>
      {/* Tabletop */}
      <RoundedBox args={[2.35, 0.056, 1.05]} radius={0.013} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial map={tex} color={tops[variant % tops.length]} roughness={0.26} metalness={0.03} />
      </RoundedBox>
      {/* Front LED strip */}
      <mesh position={[0, 0.81, 0.525]}>
        <boxGeometry args={[2.33, 0.007, 0.007]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} transparent opacity={0.9} />
      </mesh>
      {/* Hairpin legs */}
      {[-0.96, 0.96].map((lx, i) => (
        <group key={i}>
          {[-0.37, 0.37].map((lz, j) => (
            <mesh key={j} position={[lx, 0.38, lz]} castShadow>
              <cylinderGeometry args={[0.018, 0.018, 0.76, 8]} />
              <meshStandardMaterial color="#161620" metalness={0.92} roughness={0.13} />
            </mesh>
          ))}
          <mesh position={[lx, 0.065, 0]}>
            <boxGeometry args={[0.034, 0.034, 0.78]} />
            <meshStandardMaterial color="#161620" metalness={0.92} roughness={0.13} />
          </mesh>
        </group>
      ))}
      {/* Keyboard */}
      <mesh position={[0, 0.809, 0.18]}>
        <boxGeometry args={[0.66, 0.015, 0.22]} />
        <meshStandardMaterial color="#222230" roughness={0.82} />
      </mesh>
      {/* Mouse pad */}
      <mesh position={[0.6, 0.806, 0.17]}>
        <boxGeometry args={[0.27, 0.005, 0.22]} />
        <meshStandardMaterial color="#181826" roughness={0.96} />
      </mesh>
      {/* Desk accessories */}
      {variant % 3 === 0 && (
        <group position={[-0.84, 0.809, 0.05]}>
          <Cylinder args={[0.033, 0.029, 0.08, 10]} position={[0, 0.04, 0]}>
            <meshStandardMaterial color="#28202e" roughness={0.82} />
          </Cylinder>
          <Cylinder args={[0.031, 0.027, 0.002, 10]} position={[0, 0.082, 0]}>
            <meshStandardMaterial color="#18100c" roughness={0.5} />
          </Cylinder>
        </group>
      )}
      {variant % 3 === 1 && (
        <mesh position={[-0.78, 0.809, -0.12]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.22, 0.008, 0.3]} />
          <meshStandardMaterial color={['#1a2842', '#2a1820', '#162a1e'][variant % 3]} roughness={0.92} />
        </mesh>
      )}
    </group>
  )
})

// ─── Monitor ─────────────────────────────────────────────────────────────────
const DeskMonitor = memo(({ agent, color, active }: {
  agent: Agent; color: string; active: boolean
}) => {
  const scrRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!scrRef.current) return
    const m = scrRef.current.material as THREE.MeshStandardMaterial
    m.emissiveIntensity = active
      ? 0.88 + Math.sin(clock.elapsedTime * 2.0) * 0.1
      : 0.28 + Math.sin(clock.elapsedTime * 0.8) * 0.04
  })

  return (
    <group>
      {/* Stand base */}
      <mesh position={[0, 0.845, -0.24]}>
        <boxGeometry args={[0.21, 0.022, 0.16]} />
        <meshStandardMaterial color="#ccc8c0" metalness={0.78} roughness={0.22} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.07, -0.24]}>
        <boxGeometry args={[0.027, 0.44, 0.027]} />
        <meshStandardMaterial color="#c8c4bc" metalness={0.76} roughness={0.2} />
      </mesh>
      {/* Bezel */}
      <RoundedBox args={[1.12, 0.65, 0.043]} radius={0.011} position={[0, 1.38, -0.24]}>
        <meshStandardMaterial color="#111120" metalness={0.44} roughness={0.52} />
      </RoundedBox>
      {/* Screen */}
      <mesh ref={scrRef} position={[0, 1.38, -0.217]}>
        <planeGeometry args={[0.99, 0.55]} />
        <meshStandardMaterial
          color={active ? new THREE.Color(color).multiplyScalar(0.24) : '#060618'}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.28}
          roughness={0.04}
        />
      </mesh>
      {/* Agent name */}
      <Text position={[0, 1.445, -0.205]} fontSize={0.073} color={active ? '#ffffff' : '#8888bb'} anchorX="center">
        {agent.emoji}  {agent.name}
      </Text>
      <Text position={[0, 1.34, -0.205]} fontSize={0.049} color={active ? color : '#44446a'} anchorX="center">
        {agent.role}
      </Text>
      <mesh position={[0.385, 1.195, -0.205]}>
        <circleGeometry args={[0.013, 10]} />
        <meshStandardMaterial
          color={agent.status === 'active' ? '#22dd88' : '#3a4455'}
          emissive={agent.status === 'active' ? '#22dd88' : '#000'}
          emissiveIntensity={1.2}
        />
      </mesh>
      {/* Desk glow from screen */}
      <mesh position={[0, 0.815, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.95, 0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={active ? 0.14 : 0.04} />
      </mesh>
      {active && <pointLight position={[0, 1.38, -0.07]} intensity={0.55} distance={1.7} color={color} />}
    </group>
  )
})

// ─── Seated human (properly positioned) ──────────────────────────────────────
const SKINS  = ['#c89060','#a06842','#ddb880','#7a4832','#d09858','#b07848']
const SHIRTS = ['#2c3454','#3c2a46','#203428','#3a280e','#2c1e3e','#1e2e40']
const TROUSERS = ['#1c2030','#24213a','#1c2a22','#28221c','#202430']
const HAIRCOLS = ['#1a1008','#0c0806','#3c2a10','#281810','#1c0e08']

type Behavior = 'typing' | 'reading' | 'thinking'

/**
 * Seated worker. Group MUST be placed at [deskX, 0, deskZ + 0.92].
 * The character faces -Z (toward the desk center / monitor).
 *
 * Y reference:
 *  - Chair seat: y = 0.49
 *  - Desk surface: y = 0.808 (at z = -0.92 in desk space = z = 0 from here)
 *  - Arms should reach y ≈ 0.808, z ≈ -0.72 (keyboard position)
 *  - Head center: y ≈ 1.22
 */
const SeatedWorker = memo(({ index, behavior }: { index: number; behavior: Behavior }) => {
  const torsoGrp = useRef<THREE.Group>(null)
  const headGrp  = useRef<THREE.Group>(null)
  const rArmGrp  = useRef<THREE.Group>(null)
  const lArmGrp  = useRef<THREE.Group>(null)

  const off = useMemo(() => index * 1.38 + 0.3, [index])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + off

    // Breathing: subtle torso scale
    if (torsoGrp.current) {
      torsoGrp.current.position.y = 0 + Math.sin(t * 0.88) * 0.006
    }

    // Head: gentle look around the screen
    if (headGrp.current) {
      headGrp.current.rotation.y = Math.sin(t * 0.32) * 0.18
      headGrp.current.rotation.x = Math.sin(t * 0.48) * 0.06
    }

    // Arms: typing / reading motion
    const spd = behavior === 'typing' ? 5.8 : 0.5
    const amp = behavior === 'typing' ? 0.09 : 0.03
    if (rArmGrp.current) rArmGrp.current.rotation.x = Math.sin(t * spd) * amp
    if (lArmGrp.current) lArmGrp.current.rotation.x = Math.cos(t * spd) * amp
  })

  const skin   = SKINS[index % SKINS.length]
  const shirt  = SHIRTS[index % SHIRTS.length]
  const trouse = TROUSERS[index % TROUSERS.length]
  const hair   = HAIRCOLS[index % HAIRCOLS.length]

  // ---
  // All positions are in local character space.
  // Character placed at [deskX, 0, deskZ + 0.92], facing -Z.
  //
  // Desk keyboard at desk-space [0, 0.808, 0.2]
  // In char space: [0, 0.808, 0.2 - 0.92] = [0, 0.808, -0.72]
  // Shoulder at char space: [±0.17, ~1.00, -0.06]
  // Arm vector: toward [0, 0.808, -0.72] from [±0.17, 1.00, -0.06]
  //   delta = [~0, -0.192, -0.66], mostly -Z, slightly down
  //   angle X from -Y axis: atan2(0.66, 0.192) ≈ 1.29 rad (forward tilt)
  // ---

  return (
    <group>
      {/* ── Legs ─────────────────────────────────────────────── */}
      {/* Thighs: horizontal (-Z direction), sitting on chair seat at y=0.49 */}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.49, -0.22]}>
          <boxGeometry args={[0.095, 0.115, 0.44]} />
          <meshStandardMaterial color={trouse} roughness={0.88} />
        </mesh>
      ))}
      {/* Lower legs: hanging from knee at z=-0.44, y=0.49 → feet y=0.07 */}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.27, -0.44]}>
          <boxGeometry args={[0.09, 0.44, 0.09]} />
          <meshStandardMaterial color={trouse} roughness={0.88} />
        </mesh>
      ))}
      {/* Shoes */}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.06, -0.36]}>
          <boxGeometry args={[0.09, 0.07, 0.17]} />
          <meshStandardMaterial color="#141414" roughness={0.68} metalness={0.1} />
        </mesh>
      ))}

      {/* ── Hips ─────────────────────────────────────────────── */}
      <mesh position={[0, 0.64, -0.05]}>
        <boxGeometry args={[0.27, 0.15, 0.19]} />
        <meshStandardMaterial color={trouse} roughness={0.88} />
      </mesh>
      {/* Belt */}
      <mesh position={[0, 0.73, -0.04]}>
        <boxGeometry args={[0.28, 0.03, 0.19]} />
        <meshStandardMaterial color="#0e0e16" roughness={0.7} />
      </mesh>

      {/* ── Torso ─────────────────────────────────────────────── */}
      <group ref={torsoGrp}>
        {/* Shirt body — slight forward lean */}
        <mesh position={[0, 0.87, -0.055]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.29, 0.37, 0.185]} />
          <meshStandardMaterial color={shirt} roughness={0.84} />
        </mesh>
        {/* Collar */}
        <mesh position={[0, 1.06, 0.01]}>
          <boxGeometry args={[0.1, 0.055, 0.04]} />
          <meshStandardMaterial color="#f2ece2" roughness={0.82} />
        </mesh>
        {/* Shoulders */}
        {[-0.18, 0.18].map((sx, i) => (
          <mesh key={i} position={[sx, 1.0, -0.05]}>
            <sphereGeometry args={[0.073, 10, 10]} />
            <meshStandardMaterial color={shirt} roughness={0.84} />
          </mesh>
        ))}

        {/* ── Right arm (-X side) ─── */}
        {/* Reach from shoulder [-0.18, 1.0, -0.05] toward keyboard ~[-0.2, 0.808, -0.72] */}
        {/* Upper arm from shoulder, angled ~62° forward from vertical */}
        <group ref={rArmGrp} position={[-0.18, 0.96, -0.06]}>
          {/* Upper arm (shirt material) */}
          <mesh position={[0, -0.1, -0.22]} rotation={[-1.1, 0, -0.06]}>
            <boxGeometry args={[0.075, 0.26, 0.075]} />
            <meshStandardMaterial color={shirt} roughness={0.84} />
          </mesh>
          {/* Forearm (skin) */}
          <mesh position={[-0.01, -0.22, -0.5]} rotation={[-1.25, 0, -0.04]}>
            <boxGeometry args={[0.065, 0.24, 0.065]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>

        {/* ── Left arm (+X side) ─── */}
        <group ref={lArmGrp} position={[0.18, 0.96, -0.06]}>
          <mesh position={[0, -0.1, -0.22]} rotation={[-1.1, 0, 0.06]}>
            <boxGeometry args={[0.075, 0.26, 0.075]} />
            <meshStandardMaterial color={shirt} roughness={0.84} />
          </mesh>
          <mesh position={[0.01, -0.22, -0.5]} rotation={[-1.25, 0, 0.04]}>
            <boxGeometry args={[0.065, 0.24, 0.065]} />
            <meshStandardMaterial color={skin} roughness={0.78} />
          </mesh>
        </group>

        {/* ── Neck ─── */}
        <mesh position={[0, 1.09, -0.04]}>
          <cylinderGeometry args={[0.055, 0.062, 0.1, 8]} />
          <meshStandardMaterial color={skin} roughness={0.76} />
        </mesh>

        {/* ── Head ─── */}
        <group ref={headGrp} position={[0, 1.26, -0.05]}>
          {/* Skull */}
          <mesh castShadow>
            <sphereGeometry args={[0.133, 16, 16]} />
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          {/* Face overlay */}
          <mesh position={[0, -0.01, 0.106]}>
            <planeGeometry args={[0.16, 0.16]} />
            <meshStandardMaterial color={new THREE.Color(skin).multiplyScalar(0.94)} roughness={0.82} />
          </mesh>
          {/* Eyes */}
          {[-0.044, 0.044].map((ex, i) => (
            <group key={i} position={[ex, 0.02, 0.125]}>
              <mesh>
                <sphereGeometry args={[0.02, 8, 8]} />
                <meshStandardMaterial color="#f0ece4" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0, 0.014]}>
                <circleGeometry args={[0.012, 8]} />
                <meshStandardMaterial color="#18283c" roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Nose */}
          <mesh position={[0, -0.015, 0.133]}>
            <boxGeometry args={[0.022, 0.029, 0.021]} />
            <meshStandardMaterial color={new THREE.Color(skin).multiplyScalar(0.91)} roughness={0.82} />
          </mesh>
          {/* Hair cap */}
          <mesh position={[0, 0.07, -0.012]}>
            <sphereGeometry args={[0.137, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.54]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.048, -0.102]}>
            <boxGeometry args={[0.25, 0.11, 0.1]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
        </group>
      </group>
    </group>
  )
})

// ─── Walking worker ───────────────────────────────────────────────────────────
const WalkingWorker = memo(({ color }: { color: string }) => {
  const grp  = useRef<THREE.Group>(null)
  const lleg = useRef<THREE.Mesh>(null)
  const rleg = useRef<THREE.Mesh>(null)
  const larm = useRef<THREE.Mesh>(null)
  const rarm = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.48
    if (grp.current) {
      grp.current.position.x = Math.sin(t * 0.6) * 4.2
      grp.current.rotation.y = Math.cos(t * 0.6) > 0 ? 0 : Math.PI
    }
    const w = Math.sin(t * 4.0) * 0.36
    if (lleg.current) lleg.current.rotation.x = w
    if (rleg.current) rleg.current.rotation.x = -w
    if (larm.current) larm.current.rotation.x = -w * 0.52
    if (rarm.current) rarm.current.rotation.x = w * 0.52
    if (head.current) head.current.rotation.y = Math.sin(t * 0.35) * 0.14
  })

  const skin = SKINS[0]; const shirt = color; const trouse = TROUSERS[1]; const hair = HAIRCOLS[0]

  return (
    <group ref={grp} position={[0, 0, 1.6]}>
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} ref={i === 0 ? lleg : rleg} position={[lx, 0.55, 0]}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshStandardMaterial color={trouse} roughness={0.88} />
        </mesh>
      ))}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.07, 0.05]}>
          <boxGeometry args={[0.09, 0.07, 0.17]} />
          <meshStandardMaterial color="#141414" roughness={0.68} />
        </mesh>
      ))}
      <mesh position={[0, 1.07, 0]} castShadow>
        <boxGeometry args={[0.29, 0.38, 0.185]} />
        <meshStandardMaterial color={shirt} roughness={0.84} />
      </mesh>
      {[-0.18, 0.18].map((sx, i) => (
        <mesh key={i} ref={i === 0 ? larm : rarm} position={[sx, 1.05, 0]}>
          <boxGeometry args={[0.075, 0.32, 0.075]} />
          <meshStandardMaterial color={shirt} roughness={0.84} />
        </mesh>
      ))}
      <mesh position={[0, 1.29, 0]}>
        <cylinderGeometry args={[0.054, 0.061, 0.1, 8]} />
        <meshStandardMaterial color={skin} roughness={0.76} />
      </mesh>
      <group ref={head} position={[0, 1.44, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.7} />
        </mesh>
        {[-0.043, 0.043].map((ex, i) => (
          <mesh key={i} position={[ex, 0.02, 0.122]}>
            <sphereGeometry args={[0.019, 8, 8]} />
            <meshStandardMaterial color="#18283c" roughness={0.3} />
          </mesh>
        ))}
        <mesh position={[0, 0.065, -0.012]}>
          <sphereGeometry args={[0.133, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.53]} />
          <meshStandardMaterial color={hair} roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
})

// ─── Workstation (desk + chair + human + monitor) ─────────────────────────────
const WorkStation = memo(({ agent, position, color, index, selected, onSelect }: {
  agent: Agent; position: [number, number, number]; color: string
  index: number; selected: boolean; onSelect: () => void
}) => {
  const [hov, setHov] = useState(false)
  const active = selected || hov
  const behaviors: Behavior[] = ['typing', 'typing', 'reading', 'thinking', 'typing']

  return (
    <group
      position={position}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerOver={e => { e.stopPropagation(); setHov(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHov(false); document.body.style.cursor = 'auto' }}
    >
      {/* Desk furniture */}
      <OfficeDsk color={color} variant={index} />
      <OfficChair />
      {/* Monitor */}
      <DeskMonitor agent={agent} color={color} active={active} />
      {/* Seated human — placed at chair position: [0, 0, +0.92] within desk group */}
      <group position={[0, 0, 0.92]}>
        <SeatedWorker index={index} behavior={behaviors[index % behaviors.length]} />
      </group>
      {/* Selection highlight */}
      {active && (
        <mesh position={[0, 0.004, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} transparent opacity={0.07} />
        </mesh>
      )}
    </group>
  )
})

// ─── Plant ────────────────────────────────────────────────────────────────────
const Plant = memo(({ position, tall = false }: { position: [number, number, number]; tall?: boolean }) => {
  const h = tall ? 1.35 : 0.7
  return (
    <group position={position}>
      <Cylinder args={[0.14, 0.17, 0.33, 12]} position={[0, 0.165, 0]} castShadow>
        <meshStandardMaterial color="#e4ddd2" roughness={0.88} />
      </Cylinder>
      <mesh position={[0, 0.332, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.133, 10]} />
        <meshStandardMaterial color="#1c1408" roughness={1} />
      </mesh>
      <Cylinder args={[0.016, 0.02, h, 6]} position={[0, 0.33 + h / 2, 0]}>
        <meshStandardMaterial color="#163610" roughness={0.9} />
      </Cylinder>
      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
        const r = (deg * Math.PI) / 180
        const ht = 0.38 + (i / 5) * h * 0.82
        return (
          <mesh key={i} position={[Math.sin(r) * 0.19, ht, Math.cos(r) * 0.19]}
            rotation={[0.37 - i * 0.04, r, 0.3]}>
            <boxGeometry args={[0.037, 0.28 - i * 0.008, 0.013]} />
            <meshStandardMaterial color={['#24601e','#2e6824','#1c5016','#287028','#205616','#286422'][i % 6]} roughness={0.87} />
          </mesh>
        )
      })}
    </group>
  )
})

// ─── Lounge area ──────────────────────────────────────────────────────────────
const Lounge = memo(({ color }: { color: string }) => (
  <group position={[6.0, 0, 1.5]}>
    {/* Sofa frame */}
    <mesh position={[0, 0.265, 0]} castShadow>
      <boxGeometry args={[1.85, 0.26, 0.82]} />
      <meshStandardMaterial color="#252535" roughness={0.86} />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.59, -0.33]} castShadow>
      <boxGeometry args={[1.85, 0.62, 0.2]} />
      <meshStandardMaterial color="#22223a" roughness={0.86} />
    </mesh>
    {/* Cushions */}
    {[-0.62, 0, 0.62].map((cx, i) => (
      <RoundedBox key={i} args={[0.54, 0.14, 0.7]} radius={0.06} position={[cx, 0.47, 0]}>
        <meshStandardMaterial color="#1c1c30" roughness={0.92} />
      </RoundedBox>
    ))}
    {/* Arm panels */}
    {[-0.84, 0.84].map((ax, i) => (
      <mesh key={i} position={[ax, 0.56, -0.08]}>
        <boxGeometry args={[0.17, 0.58, 0.74]} />
        <meshStandardMaterial color="#28283c" roughness={0.88} />
      </mesh>
    ))}
    {/* Legs */}
    {[-0.76, 0.76].map(lx => ([-0.32, 0.32].map((lz, j) => (
      <mesh key={`${lx}${j}`} position={[lx, 0.065, lz]}>
        <boxGeometry args={[0.055, 0.13, 0.055]} />
        <meshStandardMaterial color="#181828" metalness={0.82} roughness={0.18} />
      </mesh>
    ))))}
    {/* Coffee table */}
    <group position={[0, 0, -0.88]}>
      <RoundedBox args={[1.15, 0.042, 0.58]} radius={0.013} position={[0, 0.36, 0]}>
        <meshStandardMaterial color="#cca868" roughness={0.27} metalness={0.04} />
      </RoundedBox>
      <mesh position={[0, 0.38, 0.29]}>
        <boxGeometry args={[1.13, 0.007, 0.007]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {[-0.44, 0.44].map(tx => ([-0.22, 0.22].map((tz, j) => (
        <mesh key={`${tx}${j}`} position={[tx, 0.18, tz]}>
          <cylinderGeometry args={[0.013, 0.013, 0.36, 6]} />
          <meshStandardMaterial color="#161620" metalness={0.88} roughness={0.18} />
        </mesh>
      ))))}
      <Cylinder args={[0.032, 0.028, 0.075, 10]} position={[0.32, 0.4, 0.05]}>
        <meshStandardMaterial color="#26202c" roughness={0.82} />
      </Cylinder>
    </group>
  </group>
))

// ─── Whiteboard ───────────────────────────────────────────────────────────────
const Whiteboard = memo(({ position, color }: { position: [number, number, number]; color: string }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[2.25, 1.22, 0.042]} />
      <meshStandardMaterial color="#f6f4ee" roughness={0.66} />
    </mesh>
    {[0.3, 0.11, -0.08, -0.27].map((y, i) => (
      <mesh key={i} position={[(i % 2 === 0 ? 0.04 : -0.06), y, 0.024]}>
        <boxGeometry args={[i === 0 ? 1.55 : 1.0, 0.014, 0.001]} />
        <meshStandardMaterial color={i === 0 ? color : '#bebab2'} emissive={i === 0 ? color : '#0'} emissiveIntensity={i === 0 ? 0.35 : 0} />
      </mesh>
    ))}
    {[
      { p: [0, 0.65, 0.024] as [number, number, number], s: [2.32, 0.056, 0.018] as [number, number, number] },
      { p: [0, -0.65, 0.024] as [number, number, number], s: [2.32, 0.056, 0.018] as [number, number, number] },
      { p: [-1.15, 0, 0.024] as [number, number, number], s: [0.056, 1.28, 0.018] as [number, number, number] },
      { p: [1.15, 0, 0.024] as [number, number, number], s: [0.056, 1.28, 0.018] as [number, number, number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p}><boxGeometry args={f.s} /><meshStandardMaterial color="#c2beb6" metalness={0.42} roughness={0.52} /></mesh>
    ))}
    <mesh position={[0, -0.675, 0.038]}>
      <boxGeometry args={[2.15, 0.04, 0.08]} />
      <meshStandardMaterial color="#c2beb6" metalness={0.42} roughness={0.52} />
    </mesh>
  </group>
))

// ─── Wall art ─────────────────────────────────────────────────────────────────
const WallArt = memo(({ position, color }: { position: [number, number, number]; color: string }) => (
  <group position={position}>
    <mesh><boxGeometry args={[1.15, 0.88, 0.032]} /><meshStandardMaterial color="#f0ece2" roughness={0.72} /></mesh>
    <mesh position={[0, 0, 0.019]}><planeGeometry args={[0.99, 0.72]} /><meshStandardMaterial color="#07071a" emissive={color} emissiveIntensity={0.28} roughness={0.1} /></mesh>
    <mesh position={[0, -0.03, 0.021]}><planeGeometry args={[0.6, 0.022]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.85} /></mesh>
    {[
      { p: [0, 0.46, 0.019] as [number, number, number], s: [1.22, 0.052, 0.018] as [number, number, number] },
      { p: [0, -0.46, 0.019] as [number, number, number], s: [1.22, 0.052, 0.018] as [number, number, number] },
      { p: [-0.6, 0, 0.019] as [number, number, number], s: [0.052, 0.96, 0.018] as [number, number, number] },
      { p: [0.6, 0, 0.019] as [number, number, number], s: [0.052, 0.96, 0.018] as [number, number, number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p}><boxGeometry args={f.s} /><meshStandardMaterial color="#c0bcb4" metalness={0.32} roughness={0.52} /></mesh>
    ))}
  </group>
))

// ─── Office room shell ────────────────────────────────────────────────────────
const OfficeRoom = memo(({ color }: { color: string }) => {
  const floorTex = useMemo(() => makeFloorTex(), [])
  return (
    <group>
      {/* Floor — warm oak */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial map={floorTex} roughness={0.32} metalness={0.02} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, WH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial color="#f4f2ee" roughness={1} />
      </mesh>

      {/* Ceiling light panels */}
      {[[-5, -3.5], [0, -3.5], [5, -3.5], [-5, 0.5], [0, 0.5], [5, 0.5]].map(([cx, cz], i) => (
        <group key={i} position={[cx, WH - 0.007, cz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.55, 0.2]} />
            <meshStandardMaterial color="#ffffff" emissive="#fff6ec" emissiveIntensity={5} />
          </mesh>
          <pointLight position={[0, -0.28, 0]} intensity={2.6} distance={7.5} color="#fff2e0" castShadow={i === 0} shadow-mapSize={[512, 512]} />
        </group>
      ))}

      {/* Left wall — off-white warm */}
      <mesh position={[-HW, WH / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#ece8e0" roughness={0.9} />
      </mesh>

      {/* Right wall — dark corporate accent */}
      <mesh position={[HW, WH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#1a1a28" roughness={0.82} metalness={0.06} />
      </mesh>
      {/* Accent wall glow strips */}
      <mesh position={[HW - 0.022, WH - 0.055, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[FD, 0.055, 0.038]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.65} transparent opacity={0.78} />
      </mesh>
      <mesh position={[HW - 0.022, 0.032, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[FD, 0.04, 0.038]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.52} transparent opacity={0.6} />
      </mesh>

      {/* Front wall */}
      <mesh position={[0, WH / 2, HD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[FW, WH]} />
        <meshStandardMaterial color="#ece8e0" roughness={0.9} />
      </mesh>

      {/* Skirting boards */}
      {[
        { p: [-HW + 0.015, 0.05, 0] as [number, number, number], r: [0, Math.PI / 2, 0] as [number, number, number], w: FD },
        { p: [HW - 0.015, 0.05, 0] as [number, number, number], r: [0, -Math.PI / 2, 0] as [number, number, number], w: FD },
        { p: [0, 0.05, HD - 0.015] as [number, number, number], r: [0, Math.PI, 0] as [number, number, number], w: FW },
      ].map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w, 0.1, 0.026]} />
          <meshStandardMaterial color="#cec8c0" roughness={0.82} />
        </mesh>
      ))}
    </group>
  )
})

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ agents, color, selectedId, onSelect }: {
  agents: Agent[]; color: string; selectedId: string | null; onSelect: (id: string) => void
}) {
  return (
    <>
      {/* Base ambient — very generous, no dark corners */}
      <ambientLight intensity={2.8} color="#f8f4ee" />
      {/* Primary sun through windows */}
      <directionalLight
        position={[-3, 10, -16]} intensity={3.5} color="#cce0ff"
        castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5} shadow-camera-far={40}
        shadow-camera-left={-14} shadow-camera-right={14}
        shadow-camera-top={14} shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
      />
      {/* Warm interior fill */}
      <directionalLight position={[4, 6, 9]} intensity={2.0} color="#fff4e8" />
      {/* Room bounce light */}
      <pointLight position={[0, 3, 3]} intensity={1.5} color="#ffe4c0" distance={20} />
      {/* Right accent wall glow */}
      <pointLight position={[HW - 1.2, 2, 0]} intensity={0.9} color={color} distance={12} />

      <OfficeRoom color={color} />
      <CityView color={color} />
      <GlassWall color={color} />

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

      {/* Walking colleague */}
      <WalkingWorker color={color} />

      {/* Lounge */}
      <Lounge color={color} />

      {/* Plants near windows */}
      <Plant position={[-HW + 0.55, 0, -HD + 1.6]} tall />
      <Plant position={[ HW - 0.65, 0, -HD + 1.6]} tall />
      <Plant position={[-HW + 0.55, 0,  0.8]} />
      <Plant position={[ HW - 0.65, 0,  1.0]} />

      {/* Whiteboards on back wall (between window panels) */}
      <Whiteboard position={[-4.1, 1.96, -HD + 0.065]} color={color} />
      <Whiteboard position={[ 4.1, 1.96, -HD + 0.065]} color={color} />

      {/* Art panels on left wall */}
      <WallArt position={[-HW + 0.022, 2.24, -1.2]} color={color} />
      <WallArt position={[-HW + 0.022, 2.24,  1.8]} color={color} />

      <OrbitControls
        target={[0, 1.5, -1.5]}
        enablePan={false}
        minDistance={4.5}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.03}
        minPolarAngle={0.06}
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
      camera={{ position: [0, 2.6, 10.5], fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.5,
      }}
      style={{ background: '#5a90b8' }}
    >
      <Suspense fallback={null}>
        <Scene agents={agents} color={color} selectedId={selectedId} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  )
}

export default OfficeViewer3D
