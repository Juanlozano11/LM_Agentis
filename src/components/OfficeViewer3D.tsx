import { Suspense, useRef, useState, useCallback, memo, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, RoundedBox, Text, Cylinder } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

// ─── Layout ──────────────────────────────────────────────────────────────────
const FW = 16, FD = 14, WH = 3.8
const DESK_POS: [number,number][] = [
  [-4.2,-3.6],[0,-3.6],[4.2,-3.6],
  [-2.3,-1.0],[2.3,-1.0],
]

// ─── Procedural textures ──────────────────────────────────────────────────────

/** Light oak wood plank floor */
function makeFloorTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 512
  const ctx = c.getContext('2d')!
  // Base warm wood
  ctx.fillStyle = '#c8a87a'
  ctx.fillRect(0,0,512,512)
  // Planks (horizontal, ~64px wide)
  const plankColors = ['#c2a272','#c8a87a','#be9e6e','#caa87c','#c0a070']
  for(let y=0;y<512;y+=52){
    const offset = (Math.floor(y/52)%2)*128
    ctx.fillStyle = plankColors[Math.floor(y/52)%plankColors.length]
    ctx.fillRect(0,y,512,50)
    // Grain lines
    for(let i=0;i<6;i++){
      ctx.strokeStyle = `rgba(0,0,0,${0.03+Math.random()*0.04})`
      ctx.lineWidth = 0.5+Math.random()
      ctx.beginPath()
      ctx.moveTo(0, y+8+i*7)
      for(let x=0;x<512;x+=40){
        ctx.lineTo(x+40, y+8+i*7 + (Math.random()-0.5)*2)
      }
      ctx.stroke()
    }
    // Plank gap
    ctx.fillStyle = '#9a7a50'
    ctx.fillRect(0, y+50, 512, 2)
    // Vertical seams staggered
    for(let x=offset;x<512;x+=256){
      ctx.fillStyle = '#9a7a50'
      ctx.fillRect(x,y,2,52)
    }
  }
  // Subtle varnish highlight
  const grad = ctx.createLinearGradient(0,0,512,512)
  grad.addColorStop(0,'rgba(255,240,200,0.12)')
  grad.addColorStop(1,'rgba(0,0,0,0.06)')
  ctx.fillStyle = grad
  ctx.fillRect(0,0,512,512)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(5,4)
  return t
}

/** Subtle wall plaster texture */
function makeWallTex(base='#f0ece4'): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0,0,256,256)
  for(let i=0;i<1200;i++){
    const x=Math.random()*256, y=Math.random()*256
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.015})`
    ctx.fillRect(x,y,1+Math.random()*2,1+Math.random()*2)
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(4,2)
  return t
}

/** Oak desk surface */
function makeDeskTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#d4b483'
  ctx.fillRect(0,0,256,256)
  for(let i=0;i<8;i++){
    ctx.strokeStyle = `rgba(0,0,0,${0.04+i*0.01})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 20+i*30)
    for(let x=0;x<256;x+=30) ctx.lineTo(x+30, 20+i*30+(Math.random()-0.5)*3)
    ctx.stroke()
  }
  const grad = ctx.createLinearGradient(0,0,256,0)
  grad.addColorStop(0,'rgba(255,240,200,0.15)')
  grad.addColorStop(0.5,'rgba(255,255,255,0.08)')
  grad.addColorStop(1,'rgba(0,0,0,0.08)')
  ctx.fillStyle = grad
  ctx.fillRect(0,0,256,256)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(2,1)
  return t
}

/** Concrete accent wall */
function makeAccentWallTex(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#2a2a36'
  ctx.fillRect(0,0,256,256)
  for(let i=0;i<2000;i++){
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.025})`
    ctx.fillRect(Math.random()*256, Math.random()*256, 1, 1)
  }
  // Subtle panel lines
  for(let y=0;y<256;y+=64){
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(256,y); ctx.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3,1.5)
  return t
}

// ─── Chair ────────────────────────────────────────────────────────────────────
const Chair = memo(() => (
  <group position={[0,0,0.92]}>
    {/* Seat */}
    <mesh position={[0,0.49,0]} castShadow>
      <boxGeometry args={[0.52,0.07,0.5]}/>
      <meshStandardMaterial color="#1c1c26" roughness={0.75} metalness={0.1}/>
    </mesh>
    <mesh position={[0,0.525,0]}>
      <boxGeometry args={[0.46,0.04,0.44]}/>
      <meshStandardMaterial color="#151520" roughness={0.9}/>
    </mesh>
    {/* Backrest */}
    <mesh position={[0,0.9,-0.23]} castShadow>
      <boxGeometry args={[0.5,0.7,0.06]}/>
      <meshStandardMaterial color="#1c1c26" roughness={0.75}/>
    </mesh>
    <mesh position={[0,0.9,-0.2]}>
      <boxGeometry args={[0.44,0.62,0.03]}/>
      <meshStandardMaterial color="#141420" roughness={0.9}/>
    </mesh>
    {/* Armrests */}
    {[-0.27,0.27].map((ax,i)=>(
      <group key={i}>
        <mesh position={[ax,0.66,0]}>
          <boxGeometry args={[0.05,0.2,0.42]}/>
          <meshStandardMaterial color="#111118" metalness={0.6} roughness={0.3}/>
        </mesh>
        <mesh position={[ax,0.76,0.05]}>
          <boxGeometry args={[0.07,0.04,0.3]}/>
          <meshStandardMaterial color="#1e1e2a" roughness={0.85}/>
        </mesh>
      </group>
    ))}
    {/* Pedestal */}
    <mesh position={[0,0.23,0]}>
      <cylinderGeometry args={[0.032,0.032,0.46,8]}/>
      <meshStandardMaterial color="#303040" metalness={0.9} roughness={0.15}/>
    </mesh>
    {/* Star base */}
    {[0,72,144,216,288].map((deg,i)=>{
      const r=(deg*Math.PI)/180
      return <mesh key={i} position={[Math.sin(r)*0.24,0.035,Math.cos(r)*0.24]}>
        <boxGeometry args={[0.055,0.035,0.22]}/>
        <meshStandardMaterial color="#303040" metalness={0.9} roughness={0.2}/>
      </mesh>
    })}
  </group>
))

// ─── Desk ─────────────────────────────────────────────────────────────────────
const Desk = memo(({ accentColor, variant=0 }: { accentColor:string; variant?:number }) => {
  const deskTex = useMemo(()=>makeDeskTex(),[])
  // Slight shade variation per desk
  const topColors = ['#d4b483','#cbb07c','#d8b888','#c8a870','#dcbc90']
  const topColor = topColors[variant % topColors.length]

  return (
    <group>
      {/* Tabletop */}
      <RoundedBox args={[2.25,0.055,1.0]} radius={0.012} position={[0,0.78,0]} castShadow>
        <meshStandardMaterial map={deskTex} color={topColor} roughness={0.3} metalness={0.02}/>
      </RoundedBox>
      {/* Front accent strip */}
      <mesh position={[0,0.807,0.5]}>
        <boxGeometry args={[2.23,0.007,0.008]}/>
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.55} transparent opacity={0.85}/>
      </mesh>
      {/* Hairpin legs — matte black */}
      {[-0.92,0.92].map((lx,i)=>(
        <group key={i}>
          {[-0.34,0.34].map((lz,j)=>(
            <mesh key={j} position={[lx,0.37,lz]} castShadow>
              <cylinderGeometry args={[0.017,0.017,0.74,8]}/>
              <meshStandardMaterial color="#1a1a22" metalness={0.85} roughness={0.2}/>
            </mesh>
          ))}
          <mesh position={[lx,0.065,0]}>
            <boxGeometry args={[0.033,0.033,0.73]}/>
            <meshStandardMaterial color="#1a1a22" metalness={0.85} roughness={0.2}/>
          </mesh>
        </group>
      ))}
      {/* Keyboard */}
      <mesh position={[0,0.806,0.2]}>
        <boxGeometry args={[0.64,0.015,0.2]}/>
        <meshStandardMaterial color="#252530" roughness={0.8}/>
      </mesh>
      {/* Mousepad */}
      <mesh position={[0.57,0.804,0.18]}>
        <boxGeometry args={[0.25,0.005,0.2]}/>
        <meshStandardMaterial color="#181820" roughness={0.95}/>
      </mesh>
      {/* Coffee cup */}
      {variant%3===0 && (
        <group position={[-0.8,0.808,0.1]}>
          <Cylinder args={[0.035,0.03,0.08,10]} position={[0,0.04,0]}>
            <meshStandardMaterial color="#2a2030" roughness={0.8}/>
          </Cylinder>
          <Cylinder args={[0.033,0.028,0.002,10]} position={[0,0.082,0]}>
            <meshStandardMaterial color="#1a0f0a" roughness={0.5}/>
          </Cylinder>
        </group>
      )}
      {/* Notebook */}
      {variant%3===1 && (
        <mesh position={[-0.75,0.808,-0.1]} rotation={[0,0.15,0]}>
          <boxGeometry args={[0.22,0.008,0.3]}/>
          <meshStandardMaterial color={['#1a2a4a','#2a1a1a','#1a3a2a'][variant%3]} roughness={0.9}/>
        </mesh>
      )}
      <Chair/>
    </group>
  )
})

// ─── Monitor ──────────────────────────────────────────────────────────────────
const Monitor = memo(({ agent, color, active }: { agent:Agent; color:string; active:boolean }) => {
  const screenRef = useRef<THREE.Mesh>(null)
  const glowRef   = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (screenRef.current) {
      const m = screenRef.current.material as THREE.MeshStandardMaterial
      m.emissiveIntensity = active
        ? 0.85 + Math.sin(clock.elapsedTime*2)*0.1
        : 0.3 + Math.sin(clock.elapsedTime*0.8)*0.04
    }
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshStandardMaterial
      m.opacity = active ? 0.18 : 0.06
    }
  })

  return (
    <group>
      {/* Base */}
      <mesh position={[0,0.84,-0.23]}>
        <boxGeometry args={[0.22,0.022,0.16]}/>
        <meshStandardMaterial color="#d8d4cc" metalness={0.7} roughness={0.25}/>
      </mesh>
      {/* Neck */}
      <mesh position={[0,1.04,-0.23]}>
        <boxGeometry args={[0.028,0.4,0.028]}/>
        <meshStandardMaterial color="#c8c4bc" metalness={0.7} roughness={0.2}/>
      </mesh>
      {/* Screen bezel */}
      <RoundedBox args={[1.06,0.62,0.04]} radius={0.01} position={[0,1.35,-0.23]}>
        <meshStandardMaterial color="#141420" metalness={0.4} roughness={0.5}/>
      </RoundedBox>
      {/* Screen */}
      <mesh ref={screenRef} position={[0,1.35,-0.208]}>
        <planeGeometry args={[0.94,0.52]}/>
        <meshStandardMaterial
          color={active ? new THREE.Color(color).multiplyScalar(0.2) : '#080818'}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.3}
          roughness={0.05}
        />
      </mesh>
      {/* Screen ambient glow on desk */}
      <mesh ref={glowRef} position={[0,0.82,-0.1]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[0.9,0.3]}/>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.08}/>
      </mesh>
      {/* Agent info */}
      <Text position={[0,1.41,-0.196]} fontSize={0.07} color={active?'#ffffff':'#9999cc'} anchorX="center">
        {agent.emoji}  {agent.name}
      </Text>
      <Text position={[0,1.31,-0.196]} fontSize={0.046} color={active?color:'#55558a'} anchorX="center">
        {agent.role}
      </Text>
      {/* Status */}
      <mesh position={[0.37,1.185,-0.196]}>
        <circleGeometry args={[0.013,10]}/>
        <meshStandardMaterial
          color={agent.status==='active'?'#22dd88':'#445566'}
          emissive={agent.status==='active'?'#22dd88':'#000'}
          emissiveIntensity={1.2}
        />
      </mesh>
      {active && <pointLight position={[0,1.35,-0.05]} intensity={0.5} distance={1.5} color={color}/>}
    </group>
  )
})

// ─── Human worker ─────────────────────────────────────────────────────────────
const SKINS  = ['#c89060','#a06040','#e0b880','#7a4a30','#d0a060']
const SHIRTS = ['#2a3050','#3a2a40','#1a3028','#3a2810','#2a1a38','#243040']

const HumanWorker = memo(({ index, behavior }: {
  index: number
  behavior: 'typing'|'reading'|'thinking'
}) => {
  const bodyRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  const rRef    = useRef<THREE.Mesh>(null)
  const lRef    = useRef<THREE.Mesh>(null)
  const off     = useMemo(()=>index*1.4,[index])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + off
    if (bodyRef.current) bodyRef.current.position.y = 0.88 + Math.sin(t*0.85)*0.007
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t*0.35)*0.2
      headRef.current.rotation.x = -0.06 + Math.sin(t*0.55)*0.05
    }
    const speed = behavior==='typing' ? 6 : 0.7
    const amp   = behavior==='typing' ? 0.07 : 0.04
    if (rRef.current) rRef.current.rotation.x = -0.55 + Math.sin(t*speed)*amp
    if (lRef.current) lRef.current.rotation.x = -0.55 + Math.cos(t*speed)*amp
  })

  const skin  = SKINS[index%SKINS.length]
  const shirt = SHIRTS[index%SHIRTS.length]

  return (
    <group>
      <group ref={bodyRef} position={[0,0.88,0]}>
        {/* Torso */}
        <mesh castShadow>
          <boxGeometry args={[0.27,0.35,0.17]}/>
          <meshStandardMaterial color={shirt} roughness={0.85}/>
        </mesh>
        {/* Neck */}
        <mesh position={[0,0.215,0]}>
          <cylinderGeometry args={[0.052,0.058,0.09,8]}/>
          <meshStandardMaterial color={skin} roughness={0.8}/>
        </mesh>
        {/* Head */}
        <mesh ref={headRef} position={[0,0.35,0]} castShadow>
          <sphereGeometry args={[0.125,14,14]}/>
          <meshStandardMaterial color={skin} roughness={0.72}/>
        </mesh>
        {/* Eyes */}
        {[-0.042,0.042].map((ex,i)=>(
          <mesh key={i} position={[ex,0.375,0.115]}>
            <sphereGeometry args={[0.016,8,8]}/>
            <meshStandardMaterial color="#111118" roughness={0.3}/>
          </mesh>
        ))}
        {/* Shoulders */}
        {[-0.165,0.165].map((sx,i)=>(
          <mesh key={i} position={[sx,0.14,0]}>
            <sphereGeometry args={[0.065,8,8]}/>
            <meshStandardMaterial color={shirt} roughness={0.85}/>
          </mesh>
        ))}
        {/* Arms */}
        <mesh ref={rRef} position={[-0.19,0.02,0.06]} rotation={[-0.55,0,-0.07]}>
          <boxGeometry args={[0.065,0.27,0.065]}/>
          <meshStandardMaterial color={skin} roughness={0.8}/>
        </mesh>
        <mesh ref={lRef} position={[ 0.19,0.02,0.06]} rotation={[-0.55,0, 0.07]}>
          <boxGeometry args={[0.065,0.27,0.065]}/>
          <meshStandardMaterial color={skin} roughness={0.8}/>
        </mesh>
        {/* Lap */}
        <mesh position={[0,-0.23,0.09]}>
          <boxGeometry args={[0.25,0.11,0.26]}/>
          <meshStandardMaterial color="#22253a" roughness={0.9}/>
        </mesh>
      </group>
    </group>
  )
})

// ─── Walking agent ─────────────────────────────────────────────────────────────
const WalkingAgent = memo(({ color }: { color:string }) => {
  const g  = useRef<THREE.Group>(null)
  const ll = useRef<THREE.Mesh>(null)
  const rl = useRef<THREE.Mesh>(null)
  const la = useRef<THREE.Mesh>(null)
  const ra = useRef<THREE.Mesh>(null)
  const hd = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime*0.55
    if (g.current) {
      g.current.position.x = Math.sin(t*0.65)*3.5
      g.current.rotation.y = Math.cos(t*0.65)>0 ? 0 : Math.PI
    }
    const w = Math.sin(t*4)*0.38
    if (ll.current) ll.current.rotation.x = w
    if (rl.current) rl.current.rotation.x = -w
    if (la.current) la.current.rotation.x = -w*0.5
    if (ra.current) ra.current.rotation.x = w*0.5
    if (hd.current) hd.current.rotation.y = Math.sin(t*0.3)*0.14
  })

  const shirt = color  // use office accent for walking agent shirt

  return (
    <group ref={g} position={[0,0,1.6]}>
      <mesh position={[0,1.28,0]} castShadow>
        <boxGeometry args={[0.26,0.33,0.16]}/>
        <meshStandardMaterial color={shirt} roughness={0.85}/>
      </mesh>
      <mesh position={[0,1.5,0]}>
        <cylinderGeometry args={[0.048,0.055,0.09,8]}/>
        <meshStandardMaterial color="#c89060" roughness={0.8}/>
      </mesh>
      <mesh ref={hd} position={[0,1.63,0]} castShadow>
        <sphereGeometry args={[0.118,14,14]}/>
        <meshStandardMaterial color="#c89060" roughness={0.72}/>
      </mesh>
      {[-0.17,0.17].map((sx,i)=>(
        <mesh key={i} position={[sx,1.26,0]}>
          <sphereGeometry args={[0.062,8,8]}/>
          <meshStandardMaterial color={shirt} roughness={0.85}/>
        </mesh>
      ))}
      <mesh ref={la} position={[-0.18,1.12,0]}>
        <boxGeometry args={[0.065,0.27,0.065]}/>
        <meshStandardMaterial color="#c89060" roughness={0.8}/>
      </mesh>
      <mesh ref={ra} position={[ 0.18,1.12,0]}>
        <boxGeometry args={[0.065,0.27,0.065]}/>
        <meshStandardMaterial color="#c89060" roughness={0.8}/>
      </mesh>
      <mesh ref={ll} position={[-0.08,0.94,0]}>
        <boxGeometry args={[0.1,0.34,0.1]}/>
        <meshStandardMaterial color="#1c202e" roughness={0.9}/>
      </mesh>
      <mesh ref={rl} position={[ 0.08,0.94,0]}>
        <boxGeometry args={[0.1,0.34,0.1]}/>
        <meshStandardMaterial color="#1c202e" roughness={0.9}/>
      </mesh>
    </group>
  )
})

// ─── Workstation ──────────────────────────────────────────────────────────────
const WorkStation = memo(({ agent, position, color, index, selected, onSelect }: {
  agent: Agent; position:[number,number,number]; color:string
  index:number; selected:boolean; onSelect:()=>void
}) => {
  const [hovered, setHovered] = useState(false)
  const active = selected||hovered
  const behaviors: Array<'typing'|'reading'|'thinking'> = ['typing','typing','reading','thinking','typing']

  return (
    <group
      position={position}
      onClick={e=>{e.stopPropagation();onSelect()}}
      onPointerOver={e=>{e.stopPropagation();setHovered(true);document.body.style.cursor='pointer'}}
      onPointerOut={()=>{setHovered(false);document.body.style.cursor='auto'}}
    >
      <Desk accentColor={color} variant={index}/>
      <Monitor agent={agent} color={color} active={active}/>
      <HumanWorker index={index} behavior={behaviors[index%behaviors.length]}/>
      {active && (
        <mesh position={[0,0.004,0.3]} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[2.5,1.6]}/>
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.07}/>
        </mesh>
      )}
    </group>
  )
})

// ─── Plant ───────────────────────────────────────────────────────────────────
const Plant = memo(({ position, tall=false }: { position:[number,number,number]; tall?:boolean }) => {
  const h = tall ? 1.1 : 0.6
  return (
    <group position={position}>
      {/* Pot */}
      <Cylinder args={[0.13,0.16,0.32,12]} position={[0,0.16,0]} castShadow>
        <meshStandardMaterial color="#e8e0d8" roughness={0.8}/>
      </Cylinder>
      {/* Soil */}
      <mesh position={[0,0.32,0]} rotation={[-Math.PI/2,0,0]}>
        <circleGeometry args={[0.12,10]}/>
        <meshStandardMaterial color="#2a1e10" roughness={1}/>
      </mesh>
      {/* Stem */}
      <Cylinder args={[0.016,0.02,h,6]} position={[0,0.32+h/2,0]}>
        <meshStandardMaterial color="#1a4010" roughness={0.9}/>
      </Cylinder>
      {/* Leaves */}
      {[0,65,130,195,260,325].map((deg,i)=>{
        const r=(deg*Math.PI)/180
        const ht = 0.36 + (i/5)*h*0.8
        return (
          <mesh key={i} position={[Math.sin(r)*0.18, ht, Math.cos(r)*0.18]}
            rotation={[0.4-i*0.06, r, 0.3]}>
            <boxGeometry args={[0.04, 0.28-i*0.01, 0.015]}/>
            <meshStandardMaterial color={['#256020','#306828','#1e5018','#287030','#225a1c','#2a6a22'][i%6]} roughness={0.85}/>
          </mesh>
        )
      })}
    </group>
  )
})

// ─── Wall art ─────────────────────────────────────────────────────────────────
const WallArt = memo(({ position, color }: { position:[number,number,number]; color:string }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[1.1,0.8,0.03]}/>
      <meshStandardMaterial color="#f4f0e8" roughness={0.7}/>
    </mesh>
    <mesh position={[0,0,0.018]}>
      <planeGeometry args={[0.96,0.66]}/>
      <meshStandardMaterial color="#0a0a18" emissive={color} emissiveIntensity={0.35} roughness={0.1}/>
    </mesh>
    <mesh position={[0,-0.02,0.02]}>
      <planeGeometry args={[0.6,0.02]}/>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8}/>
    </mesh>
    {/* Frame */}
    {[
      {p:[0,0.42,0.02] as [number,number,number], s:[1.16,0.05,0.02] as [number,number,number]},
      {p:[0,-0.42,0.02] as [number,number,number], s:[1.16,0.05,0.02] as [number,number,number]},
      {p:[-0.57,0,0.02] as [number,number,number], s:[0.05,0.88,0.02] as [number,number,number]},
      {p:[ 0.57,0,0.02] as [number,number,number], s:[0.05,0.88,0.02] as [number,number,number]},
    ].map((f,i)=>(
      <mesh key={i} position={f.p}>
        <boxGeometry args={f.s}/>
        <meshStandardMaterial color="#c8c0b4" metalness={0.3} roughness={0.5}/>
      </mesh>
    ))}
  </group>
))

// ─── Whiteboard ───────────────────────────────────────────────────────────────
const Whiteboard = memo(({ position, color }: { position:[number,number,number]; color:string }) => (
  <group position={position}>
    <mesh castShadow>
      <boxGeometry args={[2.1,1.15,0.04]}/>
      <meshStandardMaterial color="#f8f6f0" roughness={0.65}/>
    </mesh>
    {/* Lines */}
    {[0.25,0.08,-0.1,-0.28].map((y,i)=>(
      <mesh key={i} position={[(i%2===0?0.05:-0.05), y, 0.025]}>
        <boxGeometry args={[i===0?1.4:0.9, 0.013, 0.001]}/>
        <meshStandardMaterial color={i===0?color:'#bbb8b0'} emissive={i===0?color:'#0'} emissiveIntensity={i===0?0.3:0}/>
      </mesh>
    ))}
    {/* Frame */}
    {[
      {p:[0, 0.6,0.023] as [number,number,number], s:[2.18,0.055,0.018] as [number,number,number]},
      {p:[0,-0.6,0.023] as [number,number,number], s:[2.18,0.055,0.018] as [number,number,number]},
      {p:[-1.08,0,0.023] as [number,number,number], s:[0.055,1.2,0.018] as [number,number,number]},
      {p:[ 1.08,0,0.023] as [number,number,number], s:[0.055,1.2,0.018] as [number,number,number]},
    ].map((f,i)=>(
      <mesh key={i} position={f.p}>
        <boxGeometry args={f.s}/>
        <meshStandardMaterial color="#c4c0b8" metalness={0.4} roughness={0.5}/>
      </mesh>
    ))}
    {/* Tray */}
    <mesh position={[0,-0.64,0.035]}>
      <boxGeometry args={[2.0,0.04,0.08]}/>
      <meshStandardMaterial color="#c4c0b8" metalness={0.4} roughness={0.5}/>
    </mesh>
  </group>
))

// ─── Sofa area ────────────────────────────────────────────────────────────────
const Sofa = memo(() => (
  <group position={[5.5, 0, 1.8]}>
    {/* Base */}
    <mesh position={[0,0.25,0]} castShadow>
      <boxGeometry args={[1.6,0.25,0.7]}/>
      <meshStandardMaterial color="#2a2a3a" roughness={0.85}/>
    </mesh>
    {/* Back */}
    <mesh position={[0,0.56,-0.3]} castShadow>
      <boxGeometry args={[1.6,0.58,0.18]}/>
      <meshStandardMaterial color="#252535" roughness={0.85}/>
    </mesh>
    {/* Cushions */}
    {[-0.42,0,0.42].map((cx,i)=>(
      <RoundedBox key={i} args={[0.46,0.12,0.58]} radius={0.06} position={[cx,0.44,0]}>
        <meshStandardMaterial color="#1e1e2e" roughness={0.9}/>
      </RoundedBox>
    ))}
    {/* Legs */}
    {[-0.72,0.72].map((lx,i)=>([-0.28,0.28].map((lz,j)=>(
      <mesh key={`${i}-${j}`} position={[lx,0.06,lz]}>
        <boxGeometry args={[0.06,0.12,0.06]}/>
        <meshStandardMaterial color="#1a1a28" metalness={0.8} roughness={0.2}/>
      </mesh>
    ))))}
    {/* Coffee table */}
    <group position={[0,0,-0.75]}>
      <RoundedBox args={[1.0,0.04,0.5]} radius={0.01} position={[0,0.35,0]}>
        <meshStandardMaterial color="#d4b880" roughness={0.3} metalness={0.02}/>
      </RoundedBox>
      {[-0.38,0.38].map((tx,i)=>([-0.18,0.18].map((tz,j)=>(
        <mesh key={`${i}-${j}`} position={[tx,0.18,tz]}>
          <cylinderGeometry args={[0.013,0.013,0.34,6]}/>
          <meshStandardMaterial color="#1a1a28" metalness={0.8} roughness={0.2}/>
        </mesh>
      ))))}
    </group>
  </group>
))

// ─── Office room ──────────────────────────────────────────────────────────────
const OfficeRoom = memo(({ accentColor }: { accentColor:string }) => {
  const hw = FW/2, hd = FD/2
  const floorTex     = useMemo(()=>makeFloorTex(),[])
  const mainWallTex  = useMemo(()=>makeWallTex('#eeebe4'),[])
  const accentWallTex= useMemo(()=>makeAccentWallTex(),[])

  return (
    <group>
      {/* Floor — warm oak */}
      <mesh rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[FW,FD]}/>
        <meshStandardMaterial map={floorTex} roughness={0.35} metalness={0.02}/>
      </mesh>

      {/* Ceiling */}
      <mesh position={[0,WH,0]} rotation={[Math.PI/2,0,0]}>
        <planeGeometry args={[FW,FD]}/>
        <meshStandardMaterial color="#f5f4f0" roughness={1}/>
      </mesh>

      {/* Ceiling light panels — warm white */}
      {[[-4.0,-3.0],[0,-3.0],[4.0,-3.0],[-4.0,0.3],[0,0.3],[4.0,0.3]].map(([cx,cz],i)=>(
        <group key={i} position={[cx, WH-0.008, cz]}>
          <mesh rotation={[Math.PI/2,0,0]}>
            <planeGeometry args={[1.4,0.18]}/>
            <meshStandardMaterial color="#ffffff" emissive="#fff8f0" emissiveIntensity={4}/>
          </mesh>
          <pointLight position={[0,-0.3,0]} intensity={2.0} distance={6} color="#fff0d8" castShadow={i===0}
            shadow-mapSize={[512,512]}/>
        </group>
      ))}

      {/* Back wall — off-white plaster */}
      <mesh position={[0,WH/2,-hd]} receiveShadow>
        <planeGeometry args={[FW,WH]}/>
        <meshStandardMaterial map={mainWallTex} roughness={0.9}/>
      </mesh>

      {/* Windows on back wall */}
      {[-4.5,0,4.5].map((wx,i)=>(
        <group key={i} position={[wx,1.65,-hd+0.025]}>
          <mesh>
            <boxGeometry args={[2.1,1.55,0.07]}/>
            <meshStandardMaterial color="#d8d4cc" metalness={0.25} roughness={0.5}/>
          </mesh>
          {/* Glass */}
          <mesh position={[0,0,0.04]}>
            <planeGeometry args={[1.92,1.38]}/>
            <meshStandardMaterial color="#a8cce8" emissive="#80b8e0" emissiveIntensity={1.8} transparent opacity={0.72}/>
          </mesh>
          {/* Cross */}
          <mesh position={[0,0,0.05]}>
            <boxGeometry args={[1.96,0.04,0.01]}/>
            <meshStandardMaterial color="#c8c4bc"/>
          </mesh>
          <mesh position={[0,0,0.05]}>
            <boxGeometry args={[0.04,1.42,0.01]}/>
            <meshStandardMaterial color="#c8c4bc"/>
          </mesh>
          {/* Sunbeam */}
          <spotLight position={[0,0,5]} target-position={[0,-1,-5]}
            angle={0.45} penumbra={0.9} intensity={4} color="#c8e0ff" castShadow={false}/>
          <pointLight position={[0,0,2]} intensity={3} distance={10} color="#c0d8ff"/>
        </group>
      ))}

      {/* Left wall — warm plaster */}
      <mesh position={[-hw,WH/2,0]} rotation={[0,Math.PI/2,0]} receiveShadow>
        <planeGeometry args={[FD,WH]}/>
        <meshStandardMaterial map={mainWallTex} roughness={0.9}/>
      </mesh>

      {/* Right wall — accent (dark concrete) */}
      <mesh position={[hw,WH/2,0]} rotation={[0,-Math.PI/2,0]}>
        <planeGeometry args={[FD,WH]}/>
        <meshStandardMaterial map={accentWallTex} color="#282830" roughness={0.85}/>
      </mesh>
      {/* Accent wall glow strip at ceiling */}
      <mesh position={[hw-0.02, WH-0.04, 0]} rotation={[0,-Math.PI/2,0]}>
        <boxGeometry args={[FD,0.06,0.04]}/>
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} transparent opacity={0.7}/>
      </mesh>
      {/* Accent wall glow strip at floor */}
      <mesh position={[hw-0.02, 0.03, 0]} rotation={[0,-Math.PI/2,0]}>
        <boxGeometry args={[FD,0.04,0.04]}/>
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.5} transparent opacity={0.5}/>
      </mesh>

      {/* Front wall partial */}
      <mesh position={[0,WH/2,hd]} rotation={[0,Math.PI,0]} receiveShadow>
        <planeGeometry args={[FW,WH]}/>
        <meshStandardMaterial map={mainWallTex} roughness={0.9}/>
      </mesh>

      {/* Baseboard */}
      {[
        {p:[0,0.05,-hd+0.015] as [number,number,number], r:[0,0,0] as [number,number,number], w:FW},
        {p:[-hw+0.015,0.05,0] as [number,number,number], r:[0,Math.PI/2,0] as [number,number,number], w:FD},
        {p:[hw-0.015,0.05,0] as [number,number,number], r:[0,-Math.PI/2,0] as [number,number,number], w:FD},
      ].map((b,i)=>(
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w,0.1,0.025]}/>
          <meshStandardMaterial color="#d0ccc4" roughness={0.8}/>
        </mesh>
      ))}

      {/* Ceiling cornice */}
      {[
        {p:[0,WH-0.03,-hd+0.015] as [number,number,number], r:[0,0,0] as [number,number,number], w:FW},
        {p:[-hw+0.015,WH-0.03,0] as [number,number,number], r:[0,Math.PI/2,0] as [number,number,number], w:FD},
      ].map((b,i)=>(
        <mesh key={i} position={b.p} rotation={b.r}>
          <boxGeometry args={[b.w,0.06,0.06]}/>
          <meshStandardMaterial color="#e8e4dc" roughness={0.9}/>
        </mesh>
      ))}
    </group>
  )
})

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene({ agents, color, selectedId, onSelect }: {
  agents:Agent[]; color:string; selectedId:string|null; onSelect:(id:string)=>void
}) {
  const hw = FW/2, hd = FD/2

  return (
    <>
      {/* Very strong ambient — guarantee brightness */}
      <ambientLight intensity={2.2} color="#f8f4ee"/>
      {/* Primary sun — upper left, through windows */}
      <directionalLight position={[-5,8,-11]} intensity={2.8} color="#d0e8ff"
        castShadow shadow-mapSize={[1024,1024]}
        shadow-camera-near={0.5} shadow-camera-far={35}
        shadow-camera-left={-12} shadow-camera-right={12}
        shadow-camera-top={12} shadow-camera-bottom={-12}
        shadow-bias={-0.0005}/>
      {/* Fill from front */}
      <directionalLight position={[3,5,7]} intensity={1.6} color="#fff8f0"/>
      {/* Warm interior bounce */}
      <pointLight position={[0,3,2]} intensity={1.2} color="#ffe8c0" distance={16}/>
      {/* Right wall warm glow */}
      <pointLight position={[hw-1,2,0]} intensity={0.6} color="#f0d8ff" distance={10}/>

      <OfficeRoom accentColor={color}/>

      {/* Workstations */}
      {agents.slice(0,5).map((agent,i)=>{
        const [dx,dz] = DESK_POS[i]
        return (
          <WorkStation key={agent.id} agent={agent} position={[dx,0,dz]}
            color={color} index={i} selected={selectedId===agent.id}
            onSelect={()=>onSelect(agent.id)}/>
        )
      })}

      {/* Walking agent */}
      <WalkingAgent color={color}/>

      {/* Props */}
      <Plant position={[-hw+0.5,0,0.8]} tall/>
      <Plant position={[hw-0.6,0,0.5]}/>
      <Plant position={[-hw+0.5,0,-2.5]}/>
      <Sofa/>
      <Whiteboard position={[-3.5,1.92,-hd+0.06]} color={color}/>
      <Whiteboard position={[ 3.5,1.92,-hd+0.06]} color={color}/>
      <WallArt position={[-hw+0.02,2.1,-1]} color={color}/>
      <WallArt position={[-hw+0.02,2.1, 1.5]} color={color}/>

      <OrbitControls target={[0,1.4,-1.8]} enablePan={false}
        minDistance={4} maxDistance={14}
        maxPolarAngle={Math.PI/2.04} minPolarAngle={0.08}
        enableDamping dampingFactor={0.07}
        autoRotate autoRotateSpeed={0.2}/>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function OfficeViewer3D({ agents, color, onAgentSelect }: {
  agents:Agent[]; color:string; onAgentSelect:(a:Agent|null)=>void
}) {
  const [selectedId, setSelectedId] = useState<string|null>(null)

  const handleSelect = useCallback((id:string)=>{
    const next = selectedId===id ? null : id
    setSelectedId(next)
    onAgentSelect(next ? (agents.find(a=>a.id===next)??null) : null)
  },[selectedId,agents,onAgentSelect])

  return (
    <Canvas shadows camera={{position:[0,3.0,9],fov:50}}
      gl={{antialias:true, toneMapping:THREE.ACESFilmicToneMapping, toneMappingExposure:1.4}}
      style={{background:'#b8ccdf'}}>
      <Suspense fallback={null}>
        <Scene agents={agents} color={color} selectedId={selectedId} onSelect={handleSelect}/>
      </Suspense>
    </Canvas>
  )
}

export default OfficeViewer3D
