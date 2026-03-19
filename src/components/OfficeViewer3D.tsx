import { Suspense, useRef, useState, useCallback, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshReflectorMaterial, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

// ─── Constants ───────────────────────────────────────────────────────────────
const FLOOR_W = 14
const FLOOR_D = 13
const WALL_H = 3.6
const WALL_COLOR = '#0e0e20'
const ACCENT_COLOR = '#a855f7'

// Up to 5 desk positions [x, z], oriented facing +Z (toward viewer)
const DESK_POSITIONS: [number, number][] = [
  [-3.8, -3.2],
  [0,    -3.2],
  [3.8,  -3.2],
  [-2.2, -0.8],
  [2.2,  -0.8],
]

// ─── Chair ───────────────────────────────────────────────────────────────────
const Chair = memo(({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z + 0.95]}>
    {/* Seat */}
    <mesh position={[0, 0.48, 0]} castShadow>
      <boxGeometry args={[0.54, 0.07, 0.54]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
    </mesh>
    {/* Cushion */}
    <mesh position={[0, 0.525, 0]}>
      <boxGeometry args={[0.48, 0.04, 0.48]} />
      <meshStandardMaterial color="#14142a" roughness={0.9} />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.86, -0.24]} castShadow>
      <boxGeometry args={[0.52, 0.66, 0.06]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.7} />
    </mesh>
    {/* Backrest cushion */}
    <mesh position={[0, 0.86, -0.21]}>
      <boxGeometry args={[0.46, 0.6, 0.03]} />
      <meshStandardMaterial color="#14142a" roughness={0.9} />
    </mesh>
    {/* Armrests */}
    {[-0.27, 0.27].map((ax, i) => (
      <group key={i}>
        <mesh position={[ax, 0.65, 0]}>
          <boxGeometry args={[0.05, 0.18, 0.42]} />
          <meshStandardMaterial color="#111122" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[ax, 0.74, 0.06]}>
          <boxGeometry args={[0.07, 0.04, 0.32]} />
          <meshStandardMaterial color="#1c1c30" roughness={0.8} />
        </mesh>
      </group>
    ))}
    {/* Pedestal */}
    <mesh position={[0, 0.22, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.44, 8]} />
      <meshStandardMaterial color="#222233" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Base star */}
    {[0, 72, 144, 216, 288].map((deg, i) => {
      const rad = (deg * Math.PI) / 180
      return (
        <mesh key={i} position={[Math.sin(rad) * 0.24, 0.03, Math.cos(rad) * 0.24]}>
          <boxGeometry args={[0.06, 0.04, 0.22]} />
          <meshStandardMaterial color="#222233" metalness={0.8} roughness={0.2} />
        </mesh>
      )
    })}
  </group>
))

// ─── Desk ─────────────────────────────────────────────────────────────────────
const Desk = memo(({ x, z }: { x: number; z: number }) => (
  <group position={[x, 0, z]}>
    {/* Tabletop */}
    <RoundedBox args={[2.2, 0.06, 1.0]} radius={0.015} position={[0, 0.76, 0]} castShadow>
      <meshStandardMaterial color="#16162a" metalness={0.4} roughness={0.35} />
    </RoundedBox>
    {/* Edge accent strip */}
    <mesh position={[0, 0.79, 0.5]}>
      <boxGeometry args={[2.18, 0.008, 0.01]} />
      <meshStandardMaterial color={ACCENT_COLOR} emissive={ACCENT_COLOR} emissiveIntensity={0.6} />
    </mesh>
    {/* Legs */}
    {([-0.93, 0.93] as number[]).map((lx, i) => (
      <group key={i}>
        <mesh position={[lx, 0.37, -0.33]} castShadow>
          <boxGeometry args={[0.055, 0.74, 0.055]} />
          <meshStandardMaterial color="#0d0d1e" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh position={[lx, 0.37, 0.33]} castShadow>
          <boxGeometry args={[0.055, 0.74, 0.055]} />
          <meshStandardMaterial color="#0d0d1e" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    ))}
    {/* Side crossbar */}
    {[-0.93, 0.93].map((lx, i) => (
      <mesh key={i} position={[lx, 0.12, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.72]} />
        <meshStandardMaterial color="#0d0d1e" metalness={0.9} roughness={0.15} />
      </mesh>
    ))}
    {/* Keyboard */}
    <mesh position={[0, 0.795, 0.22]}>
      <boxGeometry args={[0.68, 0.018, 0.22]} />
      <meshStandardMaterial color="#111122" roughness={0.8} />
    </mesh>
    {/* Mouse pad */}
    <mesh position={[0.55, 0.793, 0.2]}>
      <boxGeometry args={[0.28, 0.006, 0.22]} />
      <meshStandardMaterial color="#0a0a18" roughness={0.95} />
    </mesh>
    {/* Mouse */}
    <mesh position={[0.55, 0.8, 0.2]}>
      <boxGeometry args={[0.065, 0.016, 0.11]} />
      <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.6} />
    </mesh>
    <Chair x={0} z={z} />
  </group>
))

// ─── Monitor ─────────────────────────────────────────────────────────────────
const Monitor = memo(({
  agent, color, hovered, selected,
}: {
  agent: Agent; color: string; hovered: boolean; selected: boolean
}) => {
  const screenRef = useRef<THREE.Mesh>(null)
  const active = hovered || selected

  useFrame(({ clock }) => {
    if (screenRef.current) {
      const mat = screenRef.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = active
        ? 0.7 + Math.sin(clock.elapsedTime * 2) * 0.15
        : 0.25
    }
  })

  return (
    <group>
      {/* Stand base */}
      <mesh position={[0, 0.82, -0.26]}>
        <boxGeometry args={[0.28, 0.03, 0.2]} />
        <meshStandardMaterial color="#0d0d1e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Stand neck */}
      <mesh position={[0, 1.02, -0.26]}>
        <boxGeometry args={[0.04, 0.4, 0.04]} />
        <meshStandardMaterial color="#0d0d1e" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Screen frame */}
      <RoundedBox args={[1.1, 0.64, 0.045]} radius={0.012} position={[0, 1.34, -0.26]}>
        <meshStandardMaterial color="#0a0a1a" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Screen surface */}
      <mesh ref={screenRef} position={[0, 1.34, -0.235]}>
        <planeGeometry args={[0.98, 0.54]} />
        <meshStandardMaterial
          color={active ? new THREE.Color(color).multiplyScalar(0.15) : '#06061a'}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.25}
          roughness={0.1}
        />
      </mesh>
      {/* Screen content: agent name */}
      <Text
        position={[0, 1.39, -0.23]}
        fontSize={0.085}
        color={active ? '#ffffff' : '#7777aa'}
        anchorX="center"
        maxWidth={0.9}
      >
        {agent.emoji}  {agent.name}
      </Text>
      <Text
        position={[0, 1.29, -0.23]}
        fontSize={0.055}
        color={active ? color : '#333355'}
        anchorX="center"
        maxWidth={0.9}
      >
        {agent.role}
      </Text>
      {/* Status indicator on screen */}
      <mesh position={[0.4, 1.16, -0.23]}>
        <circleGeometry args={[0.018, 12]} />
        <meshStandardMaterial
          color={agent.status === 'active' ? '#34d399' : '#334455'}
          emissive={agent.status === 'active' ? '#34d399' : '#000000'}
          emissiveIntensity={0.9}
        />
      </mesh>
      {/* Screen glow when active */}
      {active && (
        <pointLight
          position={[0, 1.34, -0.1]}
          intensity={0.6}
          distance={1.8}
          color={color}
        />
      )}
    </group>
  )
})

// ─── WorkStation ─────────────────────────────────────────────────────────────
const WorkStation = memo(({
  agent, position, color, selected, onSelect,
}: {
  agent: Agent
  position: [number, number, number]
  color: string
  selected: boolean
  onSelect: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const [_x, , _z] = position

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <Desk x={0} z={0} />
      <Monitor agent={agent} color={color} hovered={hovered} selected={selected} />
      {/* Selection glow under desk */}
      {selected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 1.4]} />
          <meshStandardMaterial
            color={color} emissive={color} emissiveIntensity={0.3}
            transparent opacity={0.12}
          />
        </mesh>
      )}
    </group>
  )
})

// ─── Plant ───────────────────────────────────────────────────────────────────
const Plant = memo(({ position }: { position: [number, number, number] }) => (
  <group position={position}>
    <Cylinder args={[0.14, 0.16, 0.32, 10]} position={[0, 0.16, 0]} castShadow>
      <meshStandardMaterial color="#1a1028" roughness={0.9} />
    </Cylinder>
    <mesh position={[0, 0.38, 0]}>
      <sphereGeometry args={[0.22, 10, 10]} />
      <meshStandardMaterial color="#0f3a1e" roughness={0.9} />
    </mesh>
    <mesh position={[0.1, 0.52, 0.06]}>
      <sphereGeometry args={[0.14, 8, 8]} />
      <meshStandardMaterial color="#144a26" roughness={0.9} />
    </mesh>
    <mesh position={[-0.09, 0.5, -0.05]}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial color="#0e3020" roughness={0.9} />
    </mesh>
  </group>
))

// ─── Shelf ────────────────────────────────────────────────────────────────────
const WallShelf = memo(() => (
  <group position={[5.8, 2.1, -2]}>
    <mesh>
      <boxGeometry args={[0.06, 1.1, 0.28]} />
      <meshStandardMaterial color="#111122" metalness={0.6} roughness={0.3} />
    </mesh>
    {[2.4, 1.8, 1.2].map((y, i) => (
      <mesh key={i} position={[0.12, y - 2.1, 0]}>
        <boxGeometry args={[0.28, 0.028, 0.26]} />
        <meshStandardMaterial color="#16162a" metalness={0.4} roughness={0.4} />
      </mesh>
    ))}
    {/* Books */}
    {[-0.06, 0, 0.06, 0.07].map((bx, i) => (
      <mesh key={i} position={[0.12 + bx * 1.1, 0.35 + i * 0.6 * 0.5 - 0.35, 0]}>
        <boxGeometry args={[0.04, 0.18, 0.2]} />
        <meshStandardMaterial color={['#3a2060','#20304a','#1a3020','#3a1520'][i]} roughness={0.9} />
      </mesh>
    ))}
  </group>
))

// ─── Office Room ──────────────────────────────────────────────────────────────
const OfficeRoom = memo(({ accentColor }: { accentColor: string }) => {
  const hw = FLOOR_W / 2
  const hd = FLOOR_D / 2

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <MeshReflectorMaterial
          blur={[500, 200]} resolution={512}
          mixBlur={0.9} mixStrength={15}
          roughness={0.85} depthScale={1}
          minDepthThreshold={0.4} maxDepthThreshold={1.4}
          color="#09091a" metalness={0.4} mirror={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, WALL_H, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_W, FLOOR_D]} />
        <meshStandardMaterial color="#0b0b1c" roughness={1} />
      </mesh>

      {/* Ceiling light panels */}
      {[[-3.5, -2.5], [0, -2.5], [3.5, -2.5], [-3.5, 0.5], [3.5, 0.5]].map(([cx, cz], i) => (
        <group key={i} position={[cx, WALL_H - 0.01, cz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.6, 0.22]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#dde8ff"
              emissiveIntensity={1.8}
            />
          </mesh>
          <pointLight
            position={[0, -0.3, 0]}
            intensity={0.9}
            distance={5}
            color="#c8d8ff"
            castShadow={i === 0}
          />
        </group>
      ))}

      {/* Back wall */}
      <mesh position={[0, WALL_H / 2, -hd]} receiveShadow>
        <planeGeometry args={[FLOOR_W, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Windows on back wall */}
      {[-4.2, 0, 4.2].map((wx, i) => (
        <group key={i} position={[wx, 1.6, -hd + 0.02]}>
          {/* Window frame */}
          <mesh>
            <boxGeometry args={[2.0, 1.4, 0.06]} />
            <meshStandardMaterial color="#0a0a1a" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Glass (sky) */}
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[1.82, 1.22]} />
            <meshStandardMaterial
              color="#1a2a4a"
              emissive="#3060a0"
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* Window cross */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[1.84, 0.04, 0.01]} />
            <meshStandardMaterial color="#0a0a1a" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.04, 1.24, 0.01]} />
            <meshStandardMaterial color="#0a0a1a" metalness={0.7} />
          </mesh>
          {/* Window light */}
          <pointLight position={[0, 0, 0.5]} intensity={0.5} distance={6} color="#6090d0" />
        </group>
      ))}

      {/* Left wall */}
      <mesh position={[-hw, WALL_H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_D, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[hw, WALL_H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_D, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Front wall (partial - entrance side) */}
      <mesh position={[0, WALL_H / 2, hd]} rotation={[0, Math.PI, 0]} receiveShadow>
        <planeGeometry args={[FLOOR_W, WALL_H]} />
        <meshStandardMaterial color={WALL_COLOR} roughness={0.9} />
      </mesh>

      {/* Accent strip - ceiling junction */}
      {[
        { pos: [0, WALL_H - 0.02, -hd + 0.01] as [number,number,number], rot: [0,0,0] as [number,number,number], len: FLOOR_W },
        { pos: [-hw + 0.01, WALL_H - 0.02, 0] as [number,number,number], rot: [0, Math.PI/2, 0] as [number,number,number], len: FLOOR_D },
        { pos: [hw - 0.01, WALL_H - 0.02, 0] as [number,number,number], rot: [0, -Math.PI/2, 0] as [number,number,number], len: FLOOR_D },
      ].map((strip, i) => (
        <mesh key={i} position={strip.pos} rotation={strip.rot}>
          <boxGeometry args={[strip.len, 0.03, 0.03]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Floor accent line */}
      <mesh position={[0, 0.005, -hd + 0.08]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[FLOOR_W, 0.04]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.4} transparent opacity={0.5} />
      </mesh>

      {/* Skirting boards */}
      {[
        { pos: [0, 0.06, -hd + 0.02] as [number,number,number], rot: [0,0,0] as [number,number,number], w: FLOOR_W },
        { pos: [-hw + 0.02, 0.06, 0] as [number,number,number], rot: [0,Math.PI/2,0] as [number,number,number], w: FLOOR_D },
        { pos: [hw - 0.02, 0.06, 0] as [number,number,number], rot: [0,-Math.PI/2,0] as [number,number,number], w: FLOOR_D },
      ].map((sb, i) => (
        <mesh key={i} position={sb.pos} rotation={sb.rot}>
          <boxGeometry args={[sb.w, 0.12, 0.03]} />
          <meshStandardMaterial color="#0d0d1e" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
})

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({
  agents, color, selectedId, onSelect,
}: {
  agents: Agent[]
  color: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.18} color="#b0b0cc" />
      {/* Sunlight from windows */}
      <directionalLight
        position={[-2, 8, -12]}
        intensity={0.7}
        color="#8ab0e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Warm fill */}
      <pointLight position={[0, 3, 2]} intensity={0.25} color="#a080ff" distance={12} />

      <OfficeRoom accentColor={color} />

      {/* Workstations */}
      {agents.slice(0, 5).map((agent, i) => {
        const [dx, dz] = DESK_POSITIONS[i]
        return (
          <WorkStation
            key={agent.id}
            agent={agent}
            position={[dx, 0, dz]}
            color={color}
            selected={selectedId === agent.id}
            onSelect={() => onSelect(agent.id)}
          />
        )
      })}

      {/* Props */}
      <Plant position={[-5.8, 0, 0.8]} />
      <Plant position={[5.6, 0, -0.5]} />
      <WallShelf />

      {/* Camera controls */}
      <OrbitControls
        target={[0, 1.2, -1.5]}
        enablePan={false}
        minDistance={4}
        maxDistance={13}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.15}
        enableDamping
        dampingFactor={0.07}
        autoRotate={false}
      />
    </>
  )
}

// ─── Loading placeholder ──────────────────────────────────────────────────────
export function LoadingPlaceholder({ color }: { color: string }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: '#07070f', gap: 12,
    }}>
      <div style={{ fontSize: 38, animation: 'float 3s ease-in-out infinite' }}>🏢</div>
      <p style={{ fontSize: 12, color: '#333355' }}>Rendering office...</p>
      <div style={{ width: 120, height: 2, background: '#111128', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{
          width: '60%', height: '100%', borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, transparent)`,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function OfficeViewer3D({
  agents, color, onAgentSelect,
}: {
  agents: Agent[]
  color: string
  onAgentSelect: (a: Agent | null) => void
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
      camera={{ position: [0, 2.8, 7.5], fov: 52 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ background: '#07070f' }}
    >
      <Suspense fallback={null}>
        <Scene
          agents={agents}
          color={color}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </Suspense>
    </Canvas>
  )
}

export default OfficeViewer3D
