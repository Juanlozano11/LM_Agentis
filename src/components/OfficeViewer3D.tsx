import { Suspense, useRef, useState, useCallback, memo, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

// ─── Layout constants ────────────────────────────────────────────────────────
const FW = 16   // floor width
const FD = 14   // floor depth
const WH = 3.8  // wall height

// Desk positions [x, z] — three front row, two back row
const DESK_POS: [number, number][] = [
  [-4.2, -3.4],
  [0,    -3.4],
  [4.2,  -3.4],
  [-2.2, -0.8],
  [ 2.2, -0.8],
]

// ─── Helpers ─────────────────────────────────────────────────────────────────
const useOffset = (i: number) => useMemo(() => i * 1.3 + Math.random() * 0.5, [i])

// ─── Low-poly seated human ───────────────────────────────────────────────────
const HumanWorker = memo(({ color, agentIndex, behavior }: {
  color: string
  agentIndex: number
  behavior: 'typing' | 'reading' | 'thinking'
}) => {
  const bodyRef  = useRef<THREE.Group>(null)
  const headRef  = useRef<THREE.Mesh>(null)
  const rArmRef  = useRef<THREE.Mesh>(null)
  const lArmRef  = useRef<THREE.Mesh>(null)
  const offset   = useOffset(agentIndex)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + offset

    // Breathing — subtle body bob
    if (bodyRef.current) {
      bodyRef.current.position.y = 0.88 + Math.sin(t * 0.9) * 0.006
    }
    // Head — gentle look-around
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.18
      headRef.current.rotation.x = -0.05 + Math.sin(t * 0.6) * 0.04
    }

    // Arms
    if (behavior === 'typing') {
      if (rArmRef.current) rArmRef.current.rotation.x = -0.55 + Math.sin(t * 6) * 0.06
      if (lArmRef.current) lArmRef.current.rotation.x = -0.55 + Math.cos(t * 6) * 0.06
    } else if (behavior === 'thinking') {
      if (rArmRef.current) rArmRef.current.rotation.x = -0.3 + Math.sin(t * 0.5) * 0.05
      if (lArmRef.current) lArmRef.current.rotation.x = -0.7 + Math.sin(t * 0.5) * 0.04
    } else {
      if (rArmRef.current) rArmRef.current.rotation.x = -0.4
      if (lArmRef.current) lArmRef.current.rotation.x = -0.4
    }
  })

  // Skin-tone palette cycling per agent
  const skinTones = ['#c8956c','#a0694a','#e0b890','#8a5540','#d4a070']
  const shirtColors = [color, '#334466','#223322','#443322','#332244']
  const skin   = skinTones[agentIndex % skinTones.length]
  const shirt  = shirtColors[agentIndex % shirtColors.length]

  return (
    <group>
      {/* Body group (sits at y≈0.88) */}
      <group ref={bodyRef} position={[0, 0.88, 0]}>
        {/* Torso */}
        <mesh castShadow>
          <boxGeometry args={[0.28, 0.36, 0.18]} />
          <meshStandardMaterial color={shirt} roughness={0.85} />
        </mesh>
        {/* Neck */}
        <mesh position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.055, 0.06, 0.1, 8]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        {/* Head */}
        <mesh ref={headRef} position={[0, 0.36, 0]} castShadow>
          <sphereGeometry args={[0.13, 14, 14]} />
          <meshStandardMaterial color={skin} roughness={0.75} />
        </mesh>
        {/* Eyes */}
        {[-0.045, 0.045].map((ex, i) => (
          <mesh key={i} position={[ex, 0.39, 0.12]}>
            <sphereGeometry args={[0.018, 8, 8]} />
            <meshStandardMaterial color="#1a1a2a" roughness={0.3} />
          </mesh>
        ))}
        {/* Shoulders */}
        {[-0.17, 0.17].map((sx, i) => (
          <mesh key={i} position={[sx, 0.15, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={shirt} roughness={0.85} />
          </mesh>
        ))}
        {/* Right arm */}
        <mesh ref={rArmRef} position={[-0.2, 0.04, 0.06]} rotation={[-0.55, 0, -0.08]}>
          <boxGeometry args={[0.07, 0.28, 0.07]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        {/* Left arm */}
        <mesh ref={lArmRef} position={[0.2, 0.04, 0.06]} rotation={[-0.55, 0, 0.08]}>
          <boxGeometry args={[0.07, 0.28, 0.07]} />
          <meshStandardMaterial color={skin} roughness={0.8} />
        </mesh>
        {/* Lap / thighs */}
        <mesh position={[0, -0.22, 0.08]}>
          <boxGeometry args={[0.26, 0.12, 0.28]} />
          <meshStandardMaterial color="#22253a" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
})

// ─── Chair (lean, modern) ─────────────────────────────────────────────────────
const Chair = memo(() => (
  <group position={[0, 0, 0.9]}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[0.5, 0.06, 0.48]} />
      <meshStandardMaterial color="#1e1e32" roughness={0.7} />
    </mesh>
    <mesh position={[0, 0.54, 0]}>
      <boxGeometry args={[0.44, 0.04, 0.42]} />
      <meshStandardMaterial color="#17172a" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0.88, -0.22]} castShadow>
      <boxGeometry args={[0.48, 0.62, 0.06]} />
      <meshStandardMaterial color="#1e1e32" roughness={0.7} />
    </mesh>
    {[-0.24, 0.24].map((ax, i) => (
      <mesh key={i} position={[ax, 0.66, 0]}>
        <boxGeometry args={[0.05, 0.2, 0.4]} />
        <meshStandardMaterial color="#18182e" metalness={0.5} roughness={0.4} />
      </mesh>
    ))}
    <mesh position={[0, 0.24, 0]}>
      <cylinderGeometry args={[0.035, 0.035, 0.48, 8]} />
      <meshStandardMaterial color="#252535" metalness={0.9} roughness={0.15} />
    </mesh>
    {[0,72,144,216,288].map((deg,i) => {
      const r = (deg*Math.PI)/180
      return <mesh key={i} position={[Math.sin(r)*0.22,0.03,Math.cos(r)*0.22]}>
        <boxGeometry args={[0.05,0.03,0.2]}/>
        <meshStandardMaterial color="#252535" metalness={0.9} roughness={0.2}/>
      </mesh>
    })}
  </group>
))

// ─── Desk ─────────────────────────────────────────────────────────────────────
const Desk = memo(({ accentColor }: { accentColor: string }) => (
  <group>
    <RoundedBox args={[2.3, 0.055, 1.0]} radius={0.012} position={[0, 0.78, 0]} castShadow>
      <meshStandardMaterial color="#f0ece4" roughness={0.25} metalness={0.05} />
    </RoundedBox>
    {/* Desk accent strip front */}
    <mesh position={[0, 0.808, 0.5]}>
      <boxGeometry args={[2.28, 0.006, 0.008]} />
      <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.7} />
    </mesh>
    {/* Hairpin legs */}
    {[-0.94, 0.94].map((lx, i) => (
      <group key={i}>
        {[-0.35, 0.35].map((lz, j) => (
          <mesh key={j} position={[lx, 0.37, lz]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.74, 8]} />
            <meshStandardMaterial color="#c0c0c8" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}
        {/* Foot crossbar */}
        <mesh position={[lx, 0.06, 0]}>
          <boxGeometry args={[0.036, 0.036, 0.74]} />
          <meshStandardMaterial color="#c0c0c8" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
    ))}
    {/* Keyboard */}
    <mesh position={[0, 0.808, 0.2]}>
      <boxGeometry args={[0.66, 0.015, 0.21]} />
      <meshStandardMaterial color="#2a2a3a" roughness={0.8} />
    </mesh>
    {/* Mouse pad */}
    <mesh position={[0.58, 0.805, 0.18]}>
      <boxGeometry args={[0.26, 0.005, 0.2]} />
      <meshStandardMaterial color="#1a1a2a" roughness={0.95} />
    </mesh>
    <Chair />
  </group>
))

// ─── Monitor ──────────────────────────────────────────────────────────────────
const Monitor = memo(({ agent, color, active }: {
  agent: Agent; color: string; active: boolean
}) => {
  const screenRef = useRef<THREE.Mesh>(null)
  const offset = useOffset(0)

  useFrame(({ clock }) => {
    if (!screenRef.current) return
    const mat = screenRef.current.material as THREE.MeshStandardMaterial
    mat.emissiveIntensity = active
      ? 0.9 + Math.sin(clock.elapsedTime * 2.2 + offset) * 0.1
      : 0.35
  })

  return (
    <group>
      {/* Monitor foot */}
      <mesh position={[0, 0.84, -0.24]}>
        <boxGeometry args={[0.24, 0.025, 0.18]} />
        <meshStandardMaterial color="#d0ccc4" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.04, -0.24]}>
        <boxGeometry args={[0.03, 0.4, 0.03]} />
        <meshStandardMaterial color="#c8c4bc" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Frame */}
      <RoundedBox args={[1.08, 0.62, 0.04]} radius={0.01} position={[0, 1.35, -0.24]}>
        <meshStandardMaterial color="#1c1c2a" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Screen */}
      <mesh ref={screenRef} position={[0, 1.35, -0.218]}>
        <planeGeometry args={[0.96, 0.52]} />
        <meshStandardMaterial
          color={active ? new THREE.Color(color).multiplyScalar(0.18) : '#0a0a1e'}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.35}
          roughness={0.05}
        />
      </mesh>
      {/* Agent info on screen */}
      <Text position={[0, 1.41, -0.208]} fontSize={0.072} color={active ? '#ffffff' : '#9999cc'} anchorX="center">
        {agent.emoji}  {agent.name}
      </Text>
      <Text position={[0, 1.31, -0.208]} fontSize={0.048} color={active ? color : '#555588'} anchorX="center">
        {agent.role}
      </Text>
      {/* Status dot */}
      <mesh position={[0.38, 1.18, -0.208]}>
        <circleGeometry args={[0.014, 10]} />
        <meshStandardMaterial
          color={agent.status === 'active' ? '#22dd88' : '#445566'}
          emissive={agent.status === 'active' ? '#22dd88' : '#000'}
          emissiveIntensity={1}
        />
      </mesh>
      {/* Screen glow when active */}
      {active && <pointLight position={[0, 1.35, -0.1]} intensity={0.4} distance={1.4} color={color} />}
    </group>
  )
})

// ─── Full workstation ─────────────────────────────────────────────────────────
const WorkStation = memo(({ agent, position, color, index, selected, onSelect }: {
  agent: Agent
  position: [number, number, number]
  color: string
  index: number
  selected: boolean
  onSelect: () => void
}) => {
  const [hovered, setHovered] = useState(false)
  const active = selected || hovered

  const behaviors: Array<'typing'|'reading'|'thinking'> = ['typing','typing','reading','thinking','typing']
  const behavior = behaviors[index % behaviors.length]

  return (
    <group
      position={position}
      onClick={e => { e.stopPropagation(); onSelect() }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      <Desk accentColor={color} />
      <Monitor agent={agent} color={color} active={active} />
      <HumanWorker color={color} agentIndex={index} behavior={behavior} />
      {/* Selection halo on floor */}
      {active && (
        <mesh position={[0, 0.003, 0.3]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[2.6, 1.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.07} />
        </mesh>
      )}
    </group>
  )
})

// ─── Walking agent ────────────────────────────────────────────────────────────
const WalkingAgent = memo(({ color }: { color: string }) => {
  const groupRef = useRef<THREE.Group>(null)
  const lLegRef  = useRef<THREE.Mesh>(null)
  const rLegRef  = useRef<THREE.Mesh>(null)
  const lArmRef  = useRef<THREE.Mesh>(null)
  const rArmRef  = useRef<THREE.Mesh>(null)
  const headRef  = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.6
    // Walk path: back and forth along X between -3 and 3
    const x = Math.sin(t * 0.7) * 3.2
    const facing = Math.cos(t * 0.7) > 0 ? 0 : Math.PI

    if (groupRef.current) {
      groupRef.current.position.x = x
      groupRef.current.rotation.y = facing
    }
    const walk = Math.sin(t * 4) * 0.4
    if (lLegRef.current) lLegRef.current.rotation.x = walk
    if (rLegRef.current) rLegRef.current.rotation.x = -walk
    if (lArmRef.current) lArmRef.current.rotation.x = -walk * 0.5
    if (rArmRef.current) rArmRef.current.rotation.x = walk * 0.5
    if (headRef.current) headRef.current.rotation.y = Math.sin(t * 0.3) * 0.15
  })

  return (
    <group ref={groupRef} position={[0, 0, 1.5]}>
      {/* Torso */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <boxGeometry args={[0.26, 0.34, 0.16]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.52, 0]}>
        <cylinderGeometry args={[0.05, 0.055, 0.09, 8]} />
        <meshStandardMaterial color="#c8956c" roughness={0.8} />
      </mesh>
      {/* Head */}
      <mesh ref={headRef} position={[0, 1.65, 0]} castShadow>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshStandardMaterial color="#c8956c" roughness={0.75} />
      </mesh>
      {/* Arms */}
      <mesh ref={lArmRef} position={[-0.18, 1.28, 0]}>
        <boxGeometry args={[0.07, 0.28, 0.07]} />
        <meshStandardMaterial color="#c8956c" roughness={0.8} />
      </mesh>
      <mesh ref={rArmRef} position={[0.18, 1.28, 0]}>
        <boxGeometry args={[0.07, 0.28, 0.07]} />
        <meshStandardMaterial color="#c8956c" roughness={0.8} />
      </mesh>
      {/* Legs */}
      <mesh ref={lLegRef} position={[-0.08, 0.95, 0]}>
        <boxGeometry args={[0.1, 0.36, 0.1]} />
        <meshStandardMaterial color="#22253a" roughness={0.9} />
      </mesh>
      <mesh ref={rLegRef} position={[0.08, 0.95, 0]}>
        <boxGeometry args={[0.1, 0.36, 0.1]} />
        <meshStandardMaterial color="#22253a" roughness={0.9} />
      </mesh>
    </group>
  )
})

// ─── Plant ────────────────────────────────────────────────────────────────────
const Plant = memo(({ position }: { position: [number,number,number] }) => (
  <group position={position}>
    <Cylinder args={[0.12, 0.15, 0.3, 10]} position={[0,0.15,0]} castShadow>
      <meshStandardMaterial color="#e8e0d8" roughness={0.9} />
    </Cylinder>
    {/* Soil */}
    <mesh position={[0,0.315,0]} rotation={[-Math.PI/2,0,0]}>
      <circleGeometry args={[0.11,10]} />
      <meshStandardMaterial color="#3a2a1a" roughness={1} />
    </mesh>
    {[0,0.12,-0.08,0.07,-0.1].map((ox,i) => (
      <mesh key={i} position={[ox*1.1, 0.36+i*0.06, (i%2===0?0.08:-0.06)]}
        rotation={[(-0.3+i*0.15), 0, ox > 0 ? 0.3 : -0.3]}>
        <boxGeometry args={[0.04, 0.22, 0.02]} />
        <meshStandardMaterial color={['#2d6a2a','#3a8030','#245520','#1e4a18','#306a28'][i]} roughness={0.9} />
      </mesh>
    ))}
  </group>
))

// ─── Whiteboard ───────────────────────────────────────────────────────────────
const Whiteboard = memo(({ x, color }: { x: number; color: string }) => (
  <group position={[x, 1.9, -FD/2 + 0.08]}>
    <mesh castShadow>
      <boxGeometry args={[2.0, 1.1, 0.04]} />
      <meshStandardMaterial color="#f8f6f2" roughness={0.6} />
    </mesh>
    {/* Frame */}
    {[
      {p:[0, 0.56, 0.025] as [number,number,number], s:[2.08,0.06,0.02] as [number,number,number]},
      {p:[0,-0.56, 0.025] as [number,number,number], s:[2.08,0.06,0.02] as [number,number,number]},
      {p:[-1.04,0,0.025] as [number,number,number], s:[0.06,1.12,0.02] as [number,number,number]},
      {p:[ 1.04,0,0.025] as [number,number,number], s:[0.06,1.12,0.02] as [number,number,number]},
    ].map((f,i) => (
      <mesh key={i} position={f.p}>
        <boxGeometry args={f.s} />
        <meshStandardMaterial color="#c8c4c0" metalness={0.5} roughness={0.4} />
      </mesh>
    ))}
    {/* "Written" lines */}
    {[0.2, 0.05, -0.1, -0.25].map((ly, i) => (
      <mesh key={i} position={[(-0.3 + i * 0.1)*0, ly, 0.028]}>
        <boxGeometry args={[0.8 - i*0.15, 0.012, 0.001]} />
        <meshStandardMaterial color={i===0 ? color : '#aaa8a4'} emissive={i===0 ? color : '#0'} emissiveIntensity={i===0?0.3:0} />
      </mesh>
    ))}
    {/* Tray */}
    <mesh position={[0, -0.6, 0.04]}>
      <boxGeometry args={[1.9, 0.04, 0.08]} />
      <meshStandardMaterial color="#c8c4c0" metalness={0.5} roughness={0.4} />
    </mesh>
  </group>
))

// ─── Office room ──────────────────────────────────────────────────────────────
const OfficeRoom = memo(({ accentColor }: { accentColor: string }) => {
  const hw = FW/2, hd = FD/2
  // Tiling for floor
  const floorTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256; canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f2ede6'
    ctx.fillRect(0,0,256,256)
    ctx.strokeStyle = '#e0dbd2'
    ctx.lineWidth = 2
    for (let i=0;i<256;i+=64){
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,256); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(256,i); ctx.stroke()
    }
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(6,5)
    return t
  }, [])

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,0,0]} receiveShadow>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.02} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, WH, 0]} rotation={[Math.PI/2,0,0]}>
        <planeGeometry args={[FW, FD]} />
        <meshStandardMaterial color="#f8f8f8" roughness={1} />
      </mesh>

      {/* Ceiling light panels — bright white strips */}
      {[[-4.2,-2.8],[0,-2.8],[4.2,-2.8],[-4.2,0.5],[0,0.5],[4.2,0.5]].map(([cx,cz],i)=>(
        <group key={i} position={[cx, WH-0.01, cz]}>
          <mesh rotation={[Math.PI/2,0,0]}>
            <planeGeometry args={[1.5, 0.2]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
          </mesh>
          <rectAreaLight
            position={[0,-0.05,0]} rotation={[-Math.PI/2,0,0]}
            width={1.5} height={0.2} intensity={8} color="#e8f0ff"
          />
          <pointLight position={[0,-0.3,0]} intensity={1.6} distance={5.5} color="#dde8ff" castShadow={i===2} />
        </group>
      ))}

      {/* Back wall — light warm white */}
      <mesh position={[0, WH/2, -hd]} receiveShadow>
        <planeGeometry args={[FW, WH]} />
        <meshStandardMaterial color="#f0eee8" roughness={0.9} />
      </mesh>

      {/* Windows on back wall */}
      {[-4.5, 0, 4.5].map((wx, i) => (
        <group key={i} position={[wx, 1.65, -hd+0.02]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[2.0, 1.5, 0.07]} />
            <meshStandardMaterial color="#e0ddd8" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Glass — sky blue, bright */}
          <mesh position={[0,0,0.04]}>
            <planeGeometry args={[1.84, 1.34]} />
            <meshStandardMaterial
              color="#b8d4f0"
              emissive="#88b8e8"
              emissiveIntensity={1.2}
              transparent opacity={0.75}
            />
          </mesh>
          {/* Window cross */}
          <mesh position={[0,0,0.05]}>
            <boxGeometry args={[1.88, 0.04, 0.01]} />
            <meshStandardMaterial color="#d8d4ce" />
          </mesh>
          <mesh position={[0,0,0.05]}>
            <boxGeometry args={[0.04,1.38,0.01]} />
            <meshStandardMaterial color="#d8d4ce" />
          </mesh>
          {/* Sunlight shaft */}
          <pointLight position={[0,0,1.5]} intensity={2.5} distance={9} color="#d0e8ff" />
          <spotLight
            position={[0,0,3]} target-position={[0,0,-10]}
            angle={0.35} penumbra={0.8} intensity={3} color="#c0d8ff"
            castShadow={false}
          />
        </group>
      ))}

      {/* Left wall */}
      <mesh position={[-hw, WH/2, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#eeece6" roughness={0.9} />
      </mesh>

      {/* Right wall */}
      <mesh position={[hw, WH/2, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[FD, WH]} />
        <meshStandardMaterial color="#eeece6" roughness={0.9} />
      </mesh>

      {/* Accent wall band (right wall) */}
      <mesh position={[hw-0.01, WH/2, 0]} rotation={[0, -Math.PI/2, 0]}>
        <planeGeometry args={[FD, 0.08]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} transparent opacity={0.6} />
      </mesh>

      {/* Floor baseboard */}
      {[
        { p:[0, 0.05, -hd+0.015] as [number,number,number], r:[0,0,0] as [number,number,number], w:FW },
        { p:[-hw+0.015,0.05,0] as [number,number,number], r:[0,Math.PI/2,0] as [number,number,number], w:FD },
        { p:[hw-0.015,0.05,0] as [number,number,number], r:[0,-Math.PI/2,0] as [number,number,number], w:FD },
      ].map((b,i)=>(
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w, 0.1, 0.02]} />
          <meshStandardMaterial color="#d8d4cc" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
})

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ agents, color, selectedId, onSelect }: {
  agents: Agent[]
  color: string
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <>
      {/* Strong ambient — no dark corners */}
      <ambientLight intensity={1.4} color="#f8f4ee" />
      {/* Main sun from upper-left through windows */}
      <directionalLight
        position={[-6, 9, -10]}
        intensity={2.2}
        color="#d8ecff"
        castShadow
        shadow-mapSize={[1024,1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={32}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.001}
      />
      {/* Warm fill from front/above */}
      <directionalLight position={[4, 6, 6]} intensity={0.8} color="#fff8f0" />
      {/* Soft back fill */}
      <pointLight position={[0, 3.2, 3]} intensity={0.6} color="#f0f4ff" distance={14} />

      <OfficeRoom accentColor={color} />

      {/* Workstations */}
      {agents.slice(0,5).map((agent, i) => {
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

      {/* Walking agent (manager/PM) */}
      <WalkingAgent color={color} />

      {/* Props */}
      <Plant position={[-7.2, 0, 0.8]} />
      <Plant position={[ 7.0, 0, 0.5]} />
      <Plant position={[-7.0, 0,-3.0]} />
      <Whiteboard x={-4.2} color={color} />
      <Whiteboard x={ 4.2} color={color} />

      {/* Camera */}
      <OrbitControls
        target={[0, 1.4, -1.8]}
        enablePan={false}
        minDistance={4.5}
        maxDistance={13}
        maxPolarAngle={Math.PI/2.05}
        minPolarAngle={0.1}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={0.25}
      />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function OfficeViewer3D({ agents, color, onAgentSelect }: {
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
      camera={{ position: [0, 3.2, 9], fov: 50 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.35,
      }}
      style={{ background: '#c8d8ee' }}
    >
      <Suspense fallback={null}>
        <Scene agents={agents} color={color} selectedId={selectedId} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  )
}

export default OfficeViewer3D
