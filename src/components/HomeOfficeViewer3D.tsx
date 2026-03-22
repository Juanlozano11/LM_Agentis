/**
 * HomeOfficeViewer3D — Cozy personal home office
 * One agent working at a warm, personal desk setup
 */
import { Suspense, useRef, useMemo, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'

// ─── Scene constants ──────────────────────────────────────────────────────────
const RW = 10, RD = 9, WH = 3.2
const HW = RW / 2, HD = RD / 2

// ─── Procedural textures ──────────────────────────────────────────────────────
function makeWoodFloor() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 512
  const g = c.getContext('2d')!
  const planks = ['#c4894a','#b87e42','#cc9250','#be8448','#c69058']
  for (let y = 0; y < 512; y += 52) {
    const pi = Math.floor(y / 52)
    g.fillStyle = planks[pi % planks.length]; g.fillRect(0, y, 512, 50)
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `rgba(0,0,0,${0.02 + i * 0.006})`; g.lineWidth = 0.5
      g.beginPath(); g.moveTo(0, y + 6 + i * 7)
      for (let x = 0; x < 512; x += 40) g.lineTo(x + 40, y + 6 + i * 7 + (Math.random() - 0.5) * 1.5)
      g.stroke()
    }
    g.fillStyle = '#7a5030'; g.fillRect(0, y + 50, 512, 2)
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3)
  return t
}

function makeDeskTop() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256
  const g = c.getContext('2d')!
  g.fillStyle = '#e8c88a'; g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 8; i++) {
    g.strokeStyle = `rgba(0,0,0,${0.02 + i * 0.007})`; g.lineWidth = 0.6
    g.beginPath(); g.moveTo(0, 14 + i * 28)
    for (let x = 0; x < 256; x += 40) g.lineTo(x + 40, 14 + i * 28 + (Math.random() - 0.5) * 1.5)
    g.stroke()
  }
  const vg = g.createLinearGradient(0, 0, 256, 0)
  vg.addColorStop(0, 'rgba(255,245,210,0.2)'); vg.addColorStop(1, 'rgba(0,0,0,0.08)')
  g.fillStyle = vg; g.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1)
  return t
}

// ─── City skyline window view (dusk) ──────────────────────────────────────────
const CozyWindow = memo(() => (
  <group position={[0, WH * 0.54, -HD + 0.05]}>
    {/* Frame — dark modern */}
    {[
      { p: [0, 0.9, 0] as [number,number,number], s: [3.2, 0.1, 0.12] as [number,number,number] },
      { p: [0, -0.9, 0] as [number,number,number], s: [3.2, 0.1, 0.12] as [number,number,number] },
      { p: [-1.6, 0, 0] as [number,number,number], s: [0.1, 1.8, 0.12] as [number,number,number] },
      { p: [1.6, 0, 0] as [number,number,number], s: [0.1, 1.8, 0.12] as [number,number,number] },
      { p: [0, 0, 0] as [number,number,number], s: [0.06, 1.8, 0.08] as [number,number,number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p}><boxGeometry args={f.s} /><meshStandardMaterial color="#1a1a2e" roughness={0.5} metalness={0.3} /></mesh>
    ))}
    {/* Dusk sky gradient */}
    <mesh position={[0, 0.3, -2]}>
      <planeGeometry args={[6, 2.5]} />
      <meshStandardMaterial color="#1a0a2e" emissive="#2a0a4a" emissiveIntensity={1} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -0.3, -2]}>
      <planeGeometry args={[6, 1.2]} />
      <meshStandardMaterial color="#ff4500" emissive="#ff6020" emissiveIntensity={0.6} transparent opacity={0.4} side={THREE.DoubleSide} />
    </mesh>
    {/* City buildings silhouette */}
    {[
      [-1.3, -0.55, 0.9, 0.6],
      [-0.8, -0.4, 0.5, 0.9],
      [-0.2, -0.45, 0.6, 0.8],
      [0.4, -0.35, 0.55, 1.0],
      [1.0, -0.5, 0.7, 0.7],
      [1.5, -0.6, 0.5, 0.5],
      [-1.6, -0.6, 0.4, 0.5],
    ].map(([bx, by, bw, bh], i) => (
      <mesh key={i} position={[bx, by, -1.8]}>
        <boxGeometry args={[bw, bh, 0.05]} />
        <meshStandardMaterial color="#0a0818" roughness={1} />
      </mesh>
    ))}
    {/* Building windows (lights) */}
    {[
      [-1.3, -0.3], [-1.1, -0.45], [-0.8, -0.15], [-0.5, -0.3], [-0.2, -0.2],
      [0.1, -0.35], [0.4, -0.1], [0.7, -0.25], [1.0, -0.3], [1.3, -0.45],
      [-1.4, -0.6], [0.3, -0.6], [0.9, -0.55], [-0.6, -0.55],
    ].map(([wx, wy], i) => (
      <mesh key={i} position={[wx, wy, -1.75]}>
        <planeGeometry args={[0.06, 0.05]} />
        <meshStandardMaterial
          color={['#ffe090','#90c0ff','#ffb060','#c0e0ff'][i % 4]}
          emissive={['#ffe090','#90c0ff','#ffb060','#c0e0ff'][i % 4]}
          emissiveIntensity={1.5}
        />
      </mesh>
    ))}
    {/* Glass pane */}
    <mesh position={[0, 0, 0.02]}>
      <planeGeometry args={[3.08, 1.78]} />
      <meshStandardMaterial color="#6080c0" emissive="#3050a0" emissiveIntensity={0.2} transparent opacity={0.15} side={THREE.DoubleSide} />
    </mesh>
    {/* Ambient glow from city */}
    <pointLight position={[0, 0, 2]} intensity={5} distance={10} color="#6030c0" />
    <spotLight position={[0, 0.5, 4]} angle={0.6} penumbra={1} intensity={8} color="#8040e0" />
  </group>
))

// ─── Home office chair (comfy, not corporate) ─────────────────────────────────
const HomeChair = memo(() => (
  <group>
    {/* Cushy seat */}
    <RoundedBox args={[0.62, 0.1, 0.58]} radius={0.04} position={[0, 0.5, 0]}>
      <meshStandardMaterial color="#d4785a" roughness={0.85} />
    </RoundedBox>
    {/* Seat cushion */}
    <RoundedBox args={[0.54, 0.06, 0.5]} radius={0.04} position={[0, 0.55, 0]}>
      <meshStandardMaterial color="#e08868" roughness={0.9} />
    </RoundedBox>
    {/* Backrest */}
    <RoundedBox args={[0.58, 0.75, 0.09]} radius={0.04} position={[0, 0.98, -0.26]} rotation={[-0.05, 0, 0]}>
      <meshStandardMaterial color="#d4785a" roughness={0.85} />
    </RoundedBox>
    <RoundedBox args={[0.5, 0.65, 0.05]} radius={0.04} position={[0, 0.98, -0.22]} rotation={[-0.05, 0, 0]}>
      <meshStandardMaterial color="#e08868" roughness={0.9} />
    </RoundedBox>
    {/* Armrests */}
    {[-0.33, 0.33].map((ax, i) => (
      <group key={i}>
        <RoundedBox args={[0.06, 0.24, 0.42]} radius={0.02} position={[ax, 0.74, -0.02]}>
          <meshStandardMaterial color="#c06848" roughness={0.88} />
        </RoundedBox>
        <RoundedBox args={[0.07, 0.04, 0.28]} radius={0.02} position={[ax, 0.86, 0.06]}>
          <meshStandardMaterial color="#cc7050" roughness={0.9} />
        </RoundedBox>
      </group>
    ))}
    {/* Wood legs */}
    {[[-0.24, -0.22], [0.24, -0.22], [-0.24, 0.22], [0.24, 0.22]].map(([lx, lz], i) => (
      <mesh key={i} position={[lx, 0.22, lz]}>
        <cylinderGeometry args={[0.022, 0.022, 0.44, 8]} />
        <meshStandardMaterial color="#7a4820" roughness={0.7} metalness={0.05} />
      </mesh>
    ))}
  </group>
))

// ─── Personal desk (L-shape, cozy) ───────────────────────────────────────────
const HomeDesk = memo(({ color }: { color: string }) => {
  const tex = useMemo(() => makeDeskTop(), [])
  return (
    <group>
      {/* Main surface */}
      <RoundedBox args={[2.6, 0.06, 1.1]} radius={0.015} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial map={tex} color="#e0b878" roughness={0.24} metalness={0.02} />
      </RoundedBox>
      {/* Side shelf */}
      <RoundedBox args={[1.0, 0.05, 0.65]} radius={0.012} position={[-1.58, 0.78, -0.4]} castShadow>
        <meshStandardMaterial map={tex} color="#dab070" roughness={0.26} />
      </RoundedBox>
      {/* Desk LED strip */}
      <mesh position={[0, 0.815, 0.548]}>
        <boxGeometry args={[2.58, 0.008, 0.006]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      {/* Wooden legs */}
      {[[-1.18, -0.42], [1.18, -0.42], [-1.18, 0.42], [1.18, 0.42]].map(([lx, lz], i) => (
        <mesh key={i} position={[lx, 0.38, lz]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.76, 8]} />
          <meshStandardMaterial color="#7a4820" roughness={0.7} />
        </mesh>
      ))}
      {/* Keyboard */}
      <RoundedBox args={[0.68, 0.016, 0.23]} radius={0.008} position={[0.1, 0.81, 0.17]}>
        <meshStandardMaterial color="#2a2838" roughness={0.82} />
      </RoundedBox>
      {/* Mouse + pad */}
      <mesh position={[0.7, 0.807, 0.14]}>
        <boxGeometry args={[0.3, 0.005, 0.24]} />
        <meshStandardMaterial color="#1e1c2c" roughness={0.94} />
      </mesh>
      <RoundedBox args={[0.09, 0.022, 0.13]} radius={0.01} position={[0.7, 0.818, 0.12]}>
        <meshStandardMaterial color="#2e2c3e" roughness={0.7} />
      </RoundedBox>
      {/* Coffee mug ☕ */}
      <group position={[-0.92, 0.81, 0.06]}>
        <Cylinder args={[0.045, 0.04, 0.09, 12]} position={[0, 0.045, 0]}>
          <meshStandardMaterial color="#c04020" roughness={0.7} />
        </Cylinder>
        <Cylinder args={[0.038, 0.034, 0.002, 12]} position={[0, 0.092, 0]}>
          <meshStandardMaterial color="#180c08" roughness={0.5} />
        </Cylinder>
        {/* Handle */}
        <mesh position={[0.055, 0.045, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.028, 0.007, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#c04020" roughness={0.7} />
        </mesh>
      </group>
      {/* Small plant 🌱 */}
      <group position={[-1.0, 0.81, -0.3]}>
        <Cylinder args={[0.055, 0.06, 0.07, 10]} position={[0, 0.035, 0]}>
          <meshStandardMaterial color="#e8d8b0" roughness={0.85} />
        </Cylinder>
        <mesh position={[0, 0.1, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#2a7020" roughness={0.9} /></mesh>
        {[0, 90, 180, 270].map((deg, i) => {
          const r = deg * Math.PI / 180
          return <mesh key={i} position={[Math.sin(r)*0.06, 0.12, Math.cos(r)*0.06]} rotation={[0.4, r, 0.2]}>
            <boxGeometry args={[0.025, 0.09, 0.01]} />
            <meshStandardMaterial color={['#2e7022','#367828','#2a6820','#3a7c2e'][i]} roughness={0.87} />
          </mesh>
        })}
      </group>
      {/* Notebook */}
      <mesh position={[-0.3, 0.812, -0.1]} rotation={[0, 0.15, 0]}>
        <boxGeometry args={[0.22, 0.008, 0.3]} />
        <meshStandardMaterial color="#2a1e3a" roughness={0.9} />
      </mesh>
    </group>
  )
})

// ─── Dual monitor setup ───────────────────────────────────────────────────────
const DualMonitor = memo(({ color, active }: { color: string; active: boolean }) => {
  const s1 = useRef<THREE.Mesh>(null)
  const s2 = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const glow = active ? 0.85 + Math.sin(clock.elapsedTime * 1.8) * 0.1 : 0.22
    ;[s1, s2].forEach(r => {
      if (r.current) (r.current.material as THREE.MeshStandardMaterial).emissiveIntensity = glow
    })
  })
  return (
    <group>
      {/* Left monitor */}
      <group position={[-0.65, 0, 0]} rotation={[0, 0.18, 0]}>
        <mesh position={[0, 0.845, -0.22]}><boxGeometry args={[0.18, 0.02, 0.14]} /><meshStandardMaterial color="#ccc0a0" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 1.06, -0.22]}><boxGeometry args={[0.025, 0.42, 0.025]} /><meshStandardMaterial color="#c0b898" metalness={0.7} roughness={0.25} /></mesh>
        <RoundedBox args={[0.96, 0.58, 0.04]} radius={0.01} position={[0, 1.37, -0.22]}>
          <meshStandardMaterial color="#111020" metalness={0.4} roughness={0.55} />
        </RoundedBox>
        <mesh ref={s1} position={[0, 1.37, -0.198]}>
          <planeGeometry args={[0.86, 0.5]} />
          <meshStandardMaterial color={active ? new THREE.Color(color).multiplyScalar(0.2) : '#050514'} emissive={new THREE.Color(color)} emissiveIntensity={0.22} roughness={0.04} />
        </mesh>
        <Text position={[0, 1.4, -0.185]} fontSize={0.065} color={active ? '#fff' : '#6666aa'} anchorX="center">🤖 General Agent</Text>
        <Text position={[0, 1.3, -0.185]} fontSize={0.042} color={active ? color : '#33336a'} anchorX="center">Running tasks...</Text>
      </group>
      {/* Right monitor */}
      <group position={[0.65, 0, 0]} rotation={[0, -0.18, 0]}>
        <mesh position={[0, 0.845, -0.22]}><boxGeometry args={[0.18, 0.02, 0.14]} /><meshStandardMaterial color="#ccc0a0" metalness={0.7} roughness={0.3} /></mesh>
        <mesh position={[0, 1.06, -0.22]}><boxGeometry args={[0.025, 0.42, 0.025]} /><meshStandardMaterial color="#c0b898" metalness={0.7} roughness={0.25} /></mesh>
        <RoundedBox args={[0.96, 0.58, 0.04]} radius={0.01} position={[0, 1.37, -0.22]}>
          <meshStandardMaterial color="#111020" metalness={0.4} roughness={0.55} />
        </RoundedBox>
        <mesh ref={s2} position={[0, 1.37, -0.198]}>
          <planeGeometry args={[0.86, 0.5]} />
          <meshStandardMaterial color={active ? new THREE.Color(color).multiplyScalar(0.15) : '#050514'} emissive={new THREE.Color(color).multiplyScalar(0.8)} emissiveIntensity={0.18} roughness={0.04} />
        </mesh>
        <Text position={[0, 1.4, -0.185]} fontSize={0.055} color={active ? '#aaa8ff' : '#33336a'} anchorX="center">Search · Memory · Tools</Text>
        {active && <Text position={[0, 1.3, -0.185]} fontSize={0.04} color="#66ff88" anchorX="center">● ACTIVE</Text>}
      </group>
      {active && <pointLight position={[0, 1.37, -0.05]} intensity={0.7} distance={2.2} color={color} />}
    </group>
  )
})

// ─── The agent (home worker style) ───────────────────────────────────────────
const HomeWorker = memo(({ active }: { active: boolean }) => {
  const torso = useRef<THREE.Group>(null)
  const head  = useRef<THREE.Group>(null)
  const rArm  = useRef<THREE.Group>(null)
  const lArm  = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (torso.current) torso.current.position.y = Math.sin(t * 0.8) * 0.005
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.3) * 0.2
      head.current.rotation.x = -0.05 + Math.sin(t * 0.5) * 0.05
    }
    const spd = active ? 5.5 : 0.4
    const amp = active ? 0.08 : 0.025
    if (rArm.current) rArm.current.rotation.x = Math.sin(t * spd) * amp
    if (lArm.current) lArm.current.rotation.x = Math.cos(t * spd) * amp
  })

  // Casual look: hoodie + jeans
  const skin = '#c89868'; const hoodie = '#4a5878'; const jeans = '#2a3a5a'; const hair = '#1c1008'

  return (
    <group>
      {/* Legs */}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.49, -0.22]}><boxGeometry args={[0.1, 0.12, 0.44]} /><meshStandardMaterial color={jeans} roughness={0.88} /></mesh>
      ))}
      {[-0.09, 0.09].map((lx, i) => (
        <mesh key={i} position={[lx, 0.27, -0.44]}><boxGeometry args={[0.09, 0.44, 0.09]} /><meshStandardMaterial color={jeans} roughness={0.88} /></mesh>
      ))}
      {/* Sneakers */}
      {[-0.09, 0.09].map((lx, i) => (
        <group key={i} position={[lx, 0.06, -0.38]}>
          <mesh><boxGeometry args={[0.1, 0.06, 0.2]} /><meshStandardMaterial color="#e8e0d0" roughness={0.65} /></mesh>
          <mesh position={[0, 0.04, -0.02]}><boxGeometry args={[0.1, 0.06, 0.16]} /><meshStandardMaterial color="#2a2a3a" roughness={0.7} /></mesh>
        </group>
      ))}
      {/* Hips */}
      <mesh position={[0, 0.65, -0.05]}><boxGeometry args={[0.28, 0.16, 0.2]} /><meshStandardMaterial color={jeans} roughness={0.88} /></mesh>

      {/* Torso */}
      <group ref={torso}>
        <RoundedBox args={[0.32, 0.38, 0.2]} radius={0.02} position={[0, 0.88, -0.05]} rotation={[-0.08, 0, 0]}>
          <meshStandardMaterial color={hoodie} roughness={0.86} />
        </RoundedBox>
        {/* Hood detail */}
        <mesh position={[0, 1.07, -0.04]}><boxGeometry args={[0.12, 0.06, 0.045]} /><meshStandardMaterial color={hoodie} roughness={0.86} /></mesh>

        {/* Shoulders */}
        {[-0.19, 0.19].map((sx, i) => (
          <mesh key={i} position={[sx, 1.01, -0.05]}><sphereGeometry args={[0.076, 10, 10]} /><meshStandardMaterial color={hoodie} roughness={0.86} /></mesh>
        ))}

        {/* Right arm */}
        <group ref={rArm} position={[-0.19, 0.97, -0.06]}>
          <mesh position={[0, -0.1, -0.2]} rotation={[-1.05, 0, -0.07]}><boxGeometry args={[0.076, 0.27, 0.076]} /><meshStandardMaterial color={hoodie} roughness={0.86} /></mesh>
          <mesh position={[-0.01, -0.22, -0.48]} rotation={[-1.22, 0, -0.04]}><boxGeometry args={[0.066, 0.25, 0.066]} /><meshStandardMaterial color={skin} roughness={0.76} /></mesh>
        </group>

        {/* Left arm */}
        <group ref={lArm} position={[0.19, 0.97, -0.06]}>
          <mesh position={[0, -0.1, -0.2]} rotation={[-1.05, 0, 0.07]}><boxGeometry args={[0.076, 0.27, 0.076]} /><meshStandardMaterial color={hoodie} roughness={0.86} /></mesh>
          <mesh position={[0.01, -0.22, -0.48]} rotation={[-1.22, 0, 0.04]}><boxGeometry args={[0.066, 0.25, 0.066]} /><meshStandardMaterial color={skin} roughness={0.76} /></mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 1.1, -0.04]}><cylinderGeometry args={[0.056, 0.063, 0.1, 8]} /><meshStandardMaterial color={skin} roughness={0.76} /></mesh>

        {/* Head */}
        <group ref={head} position={[0, 1.27, -0.05]}>
          <mesh castShadow><sphereGeometry args={[0.135, 16, 16]} /><meshStandardMaterial color={skin} roughness={0.7} /></mesh>
          {/* Eyes */}
          {[-0.045, 0.045].map((ex, i) => (
            <group key={i} position={[ex, 0.02, 0.126]}>
              <mesh><sphereGeometry args={[0.021, 8, 8]} /><meshStandardMaterial color="#f0ece4" roughness={0.5} /></mesh>
              <mesh position={[0, 0, 0.014]}><circleGeometry args={[0.013, 8]} /><meshStandardMaterial color="#1a2a3c" roughness={0.2} /></mesh>
            </group>
          ))}
          {/* Slight smile */}
          <mesh position={[0, -0.025, 0.13]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.03, 0.006, 6, 10, Math.PI * 0.6]} />
            <meshStandardMaterial color={new THREE.Color(skin).multiplyScalar(0.82)} roughness={0.8} />
          </mesh>
          {/* Casual hair */}
          <mesh position={[0, 0.075, -0.01]}>
            <sphereGeometry args={[0.138, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          <mesh position={[0.06, 0.12, 0.04]} rotation={[0.2, -0.4, 0.3]}>
            <boxGeometry args={[0.08, 0.04, 0.06]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>
          {/* Headphones */}
          <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.148, 0.014, 8, 16, Math.PI * 1.1]} />
            <meshStandardMaterial color="#1a1828" metalness={0.6} roughness={0.3} />
          </mesh>
          {[-0.148, 0.148].map((ex, i) => (
            <RoundedBox key={i} args={[0.052, 0.068, 0.038]} radius={0.01} position={[ex, 0, 0]}>
              <meshStandardMaterial color="#141222" metalness={0.5} roughness={0.4} />
            </RoundedBox>
          ))}
        </group>
      </group>
    </group>
  )
})

// ─── Bookshelf on the wall ────────────────────────────────────────────────────
const Bookshelf = memo(({ color }: { color: string }) => {
  const bookColors = ['#c04020','#2040a0','#208040','#a06010','#601880','#c09020','#1060a0','#802010']
  return (
    <group position={[HW - 0.08, 0, 0.5]} rotation={[0, -Math.PI / 2, 0]}>
      {/* Frame */}
      <mesh position={[0, 1.1, 0]} castShadow><boxGeometry args={[1.6, 2.2, 0.32]} /><meshStandardMaterial color="#8a5a28" roughness={0.7} /></mesh>
      {/* Shelves */}
      {[0.2, 0.72, 1.24, 1.76].map((sy, i) => (
        <mesh key={i} position={[0, sy, 0.01]}><boxGeometry args={[1.54, 0.04, 0.29]} /><meshStandardMaterial color="#9a6a30" roughness={0.68} /></mesh>
      ))}
      {/* Books */}
      {[0.2, 0.72, 1.24].map((sy, si) => {
        let x = -0.68
        return Array.from({ length: 7 }, (_, bi) => {
          const w = 0.05 + (bi % 3) * 0.02; const bx = x + w / 2; x += w + 0.01
          return (
            <mesh key={`${si}-${bi}`} position={[bx, sy + 0.08 + (bi%3)*0.01, 0.01]}>
              <boxGeometry args={[w, 0.16 + (bi%2)*0.04, 0.26]} />
              <meshStandardMaterial color={bookColors[(si*7+bi)%bookColors.length]} roughness={0.85} />
            </mesh>
          )
        })
      })}
      {/* Top: plant + figure */}
      <mesh position={[-0.45, 2.22, 0.02]}><boxGeometry args={[0.12, 0.02, 0.12]} /><meshStandardMaterial color="#c08030" roughness={0.7} /></mesh>
      <mesh position={[-0.45, 2.24, 0.02]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#2a7020" roughness={0.9} /></mesh>
      <mesh position={[0.3, 2.25, 0.02]} rotation={[0, 0.3, 0]}><boxGeometry args={[0.05, 0.14, 0.04]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} /></mesh>
    </group>
  )
})

// ─── Cozy rug ─────────────────────────────────────────────────────────────────
const CozyRug = memo(({ color }: { color: string }) => (
  <group>
    <mesh position={[0, 0.003, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.2, 2.2]} />
      <meshStandardMaterial color="#2a1e3a" roughness={0.98} />
    </mesh>
    {/* Border */}
    {[
      { p: [0, 0.004, 0.12] as [number,number,number], s: [3.2, 0.001, 0.1] as [number,number,number] },
      { p: [0, 0.004, 2.28] as [number,number,number], s: [3.2, 0.001, 0.1] as [number,number,number] },
      { p: [-1.55, 0.004, 1.2] as [number,number,number], s: [0.1, 0.001, 2.2] as [number,number,number] },
      { p: [1.55, 0.004, 1.2] as [number,number,number], s: [0.1, 0.001, 2.2] as [number,number,number] },
    ].map((f, i) => (
      <mesh key={i} position={f.p} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[f.s[0], f.s[2]]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.5} />
      </mesh>
    ))}
  </group>
))

// ─── Room shell (dark modern office) ─────────────────────────────────────────
const HomeRoom = memo(({ color }: { color: string }) => {
  const floor = useMemo(() => makeWoodFloor(), [])
  return (
    <group>
      {/* Floor — dark wood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial map={floor} color="#6a4828" roughness={0.4} metalness={0.04} />
      </mesh>
      {/* Ceiling — dark */}
      <mesh position={[0, WH, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW, RD]} />
        <meshStandardMaterial color="#0d0d1a" roughness={1} />
      </mesh>
      {/* Ceiling LED strip accent */}
      <mesh position={[0, WH - 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[RW - 1, RD - 1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.12} transparent opacity={0.18} />
      </mesh>
      {/* Ceiling pendant light */}
      <group position={[-0.5, WH - 0.01, -0.5]}>
        <Cylinder args={[0.006, 0.006, 0.5, 6]} position={[0, -0.25, 0]}>
          <meshStandardMaterial color="#333340" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <mesh position={[0, -0.52, 0]}>
          <cylinderGeometry args={[0.18, 0.08, 0.22, 16, 1, true]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, -0.6, 0]} intensity={8} distance={10} color="#ffd080" castShadow shadow-mapSize={[512,512]} />
      </group>
      {/* Second pendant */}
      <group position={[2.5, WH - 0.01, -0.5]}>
        <Cylinder args={[0.006, 0.006, 0.7, 6]} position={[0, -0.35, 0]}>
          <meshStandardMaterial color="#333340" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <mesh position={[0, -0.72, 0]}>
          <cylinderGeometry args={[0.14, 0.06, 0.18, 16, 1, true]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, -0.78, 0]} intensity={5} distance={7} color="#ffc860" />
      </group>
      {/* Back wall — dark charcoal */}
      <mesh position={[0, WH / 2, -HD]} receiveShadow>
        <planeGeometry args={[RW, WH]} />
        <meshStandardMaterial color="#0f0f1e" roughness={0.85} />
      </mesh>
      {/* Back wall vertical accent panels */}
      {[-3.2, -0.8, 0.8, 3.2].map((px, i) => (
        <mesh key={i} position={[px, WH / 2, -HD + 0.015]}>
          <boxGeometry args={[1.2, WH * 0.85, 0.03]} />
          <meshStandardMaterial color="#141428" roughness={0.7} />
        </mesh>
      ))}
      {/* Horizontal accent trim */}
      <mesh position={[0, WH * 0.7, -HD + 0.018]}>
        <boxGeometry args={[RW, 0.05, 0.03]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.7} />
      </mesh>
      {/* Left wall — dark */}
      <mesh position={[-HW, WH / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[RD, WH]} />
        <meshStandardMaterial color="#0c0c1c" roughness={0.88} />
      </mesh>
      {/* Right wall — dark */}
      <mesh position={[HW, WH / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[RD, WH]} />
        <meshStandardMaterial color="#0e0e1e" roughness={0.88} />
      </mesh>
      {/* Accent LED strip on right wall (vertical) */}
      <mesh position={[HW - 0.02, WH / 2, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[0.04, WH * 0.9, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} transparent opacity={0.8} />
      </mesh>
      {/* Accent LED strip on left wall (vertical) */}
      <mesh position={[-HW + 0.02, WH / 2, -1]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.04, WH * 0.9, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} transparent opacity={0.6} />
      </mesh>
      {/* Front wall */}
      <mesh position={[0, WH / 2, HD]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[RW, WH]} />
        <meshStandardMaterial color="#0d0d1c" roughness={0.88} />
      </mesh>
      {/* Floor skirting — glowing */}
      {[
        { p: [-HW + 0.012, 0.03, 0] as [number,number,number], r: [0, Math.PI/2, 0] as [number,number,number], w: RD },
        { p: [HW - 0.012, 0.03, 0] as [number,number,number], r: [0, -Math.PI/2, 0] as [number,number,number], w: RD },
        { p: [0, 0.03, -HD + 0.012] as [number,number,number], r: [0, 0, 0] as [number,number,number], w: RW },
        { p: [0, 0.03, HD - 0.012] as [number,number,number], r: [0, Math.PI, 0] as [number,number,number], w: RW },
      ].map((b, i) => (
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w, 0.06, 0.02]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Wall art — abstract glowing canvas */}
      <group position={[-2.8, 1.8, -HD + 0.05]}>
        <mesh><boxGeometry args={[1.4, 0.9, 0.04]} /><meshStandardMaterial color="#080818" roughness={0.5} /></mesh>
        <mesh position={[0, 0, 0.025]}><planeGeometry args={[1.28, 0.78]} /><meshStandardMaterial color="#0a0a2a" emissive={color} emissiveIntensity={0.3} /></mesh>
        {[[-0.3, 0.1], [0.1, -0.2], [0.35, 0.2], [-0.1, -0.1]].map(([ax, ay], i) => (
          <mesh key={i} position={[ax, ay, 0.03]}>
            <planeGeometry args={[0.18 + i*0.06, 0.18 + i*0.04]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6 + i*0.1} transparent opacity={0.4 + i*0.1} />
          </mesh>
        ))}
        <pointLight position={[0, 0, 0.5]} intensity={1.5} distance={2.5} color={color} />
      </group>
    </group>
  )
})

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ color, active }: { color: string; active: boolean }) {
  return (
    <>
      <ambientLight intensity={0.6} color="#1a1030" />
      <directionalLight position={[2, 8, 4]} intensity={1.2} color="#ffe0a0" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-near={0.5} shadow-camera-far={30} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0004} />
      <directionalLight position={[-4, 4, -6]} intensity={0.5} color="#8060ff" />
      <pointLight position={[0, 2, 3]} intensity={0.8} color="#ffd080" distance={14} />
      <pointLight position={[HW - 1, 1.5, 0]} intensity={1.2} color={color} distance={10} />
      <pointLight position={[-HW + 1, 1.5, 0]} intensity={0.8} color={color} distance={8} />

      <HomeRoom color={color} />
      <CozyWindow />
      <CozyRug color={color} />

      {/* Main desk setup — centered, facing the window */}
      <group position={[0, 0, -0.8]}>
        <HomeDesk color={color} />
        <HomeChair />
        <DualMonitor color={color} active={active} />
        {/* Worker sitting at desk */}
        <group position={[0, 0, 0.92]}>
          <HomeWorker active={active} />
        </group>
        {/* Desk glow on floor */}
        <mesh position={[0, 0.004, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.8, 1.6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={active ? 0.08 : 0.03} />
        </mesh>
      </group>

      <Bookshelf color={color} />

      {/* Floor lamp */}
      <group position={[-3.8, 0, -1.5]}>
        <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.018, 0.022, 2.2, 8]} /><meshStandardMaterial color="#7a6840" metalness={0.6} roughness={0.4} /></mesh>
        <mesh position={[0, 2.28, 0]}>
          <sphereGeometry args={[0.18, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
          <meshStandardMaterial color="#e8d8a0" roughness={0.5} emissive="#ffd060" emissiveIntensity={0.4} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 2.1, 0]} intensity={3} distance={7} color="#ffc860" />
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI/2, 0, 0]}>
          <circleGeometry args={[0.2, 12]} />
          <meshStandardMaterial color="#3a3020" roughness={0.9} />
        </mesh>
      </group>

      {/* Small side table with books */}
      <group position={[3.5, 0, 1.5]}>
        <RoundedBox args={[0.7, 0.04, 0.5]} radius={0.01} position={[0, 0.55, 0]}>
          <meshStandardMaterial color="#a07840" roughness={0.7} />
        </RoundedBox>
        {[[-0.2, -0.25, 0], [0.27, -0.25, 0]].map(([lx, lz], i) => (
          <mesh key={i} position={[lx, 0.26, lz as number]}>
            <cylinderGeometry args={[0.025, 0.025, 0.52, 8]} />
            <meshStandardMaterial color="#7a5820" roughness={0.7} />
          </mesh>
        ))}
        {[0, 1, 2].map(i => (
          <mesh key={i} position={[-0.12 + i * 0.1, 0.62, 0]} rotation={[0, (i-1)*0.1, 0]}>
            <boxGeometry args={[0.07, 0.18, 0.16]} />
            <meshStandardMaterial color={['#803020','#204080','#207040'][i]} roughness={0.85} />
          </mesh>
        ))}
      </group>

      <OrbitControls
        target={[0, 1.2, -0.2]}
        enablePan={false}
        minDistance={3.5}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.08}
        enableDamping
        dampingFactor={0.07}
        autoRotate
        autoRotateSpeed={0.22}
      />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function HomeOfficeViewer3D({ color, active = true }: { color: string; active?: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 2.2, 7.5], fov: 52 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.4 }}
      style={{ background: '#080818' }}
    >
      <Suspense fallback={null}>
        <Scene color={color} active={active} />
      </Suspense>
    </Canvas>
  )
}

export default HomeOfficeViewer3D
