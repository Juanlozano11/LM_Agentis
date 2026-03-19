import { Suspense, useRef, useState, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { OrbitControls, MeshReflectorMaterial, RoundedBox, Text } from '@react-three/drei'
import * as THREE from 'three'
import type { Agent } from '../data/offices'

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <MeshReflectorMaterial
        blur={[400, 200]} resolution={512} mixBlur={0.8} mixStrength={20}
        roughness={1} depthScale={1.2} minDepthThreshold={0.4} maxDepthThreshold={1.4}
        color="#07070f" metalness={0.5} mirror={0}
      />
    </mesh>
  )
}

function Desk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[2.4, 0.07, 1.2]} radius={0.03} position={[0, 0.78, 0]} castShadow>
        <meshStandardMaterial color="#18182e" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {[-0.95, 0.95].map((x, i) => (
        <mesh key={i} position={[x, 0.38, 0]} castShadow>
          <boxGeometry args={[0.06, 0.76, 0.06]} />
          <meshStandardMaterial color="#0c0c1e" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Monitor */}
      <RoundedBox args={[1.2, 0.72, 0.05]} radius={0.02} position={[0, 1.32, -0.35]} castShadow>
        <meshStandardMaterial color="#050516" metalness={0.6} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 1.32, -0.32]}>
        <planeGeometry args={[1.08, 0.6]} />
        <meshStandardMaterial color="#0a0a30" emissive="#2222aa" emissiveIntensity={0.5} />
      </mesh>
      {/* Monitor lines */}
      {[0.1, 0, -0.1].map((y, i) => (
        <mesh key={i} position={[0, 1.32 + y, -0.31]}>
          <planeGeometry args={[0.7, 0.03]} />
          <meshStandardMaterial color="#3333aa" emissive="#4444ff" emissiveIntensity={1.2} />
        </mesh>
      ))}
      <mesh position={[0, 0.97, -0.35]}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <meshStandardMaterial color="#0c0c1e" metalness={0.8} />
      </mesh>
    </group>
  )
}

function AgentNode({ agent, position, color, selected, onSelect }: {
  agent: Agent; position: [number, number, number]
  color: string; selected: boolean; onSelect: () => void
}) {
  const coreRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  const active = selected || hovered

  useFrame((state) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += 0.012
      coreRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
    if (ringRef.current) {
      ringRef.current.rotation.y += 0.018
      ringRef.current.rotation.z += 0.005
    }
  })

  const click = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); onSelect()
  }, [onSelect])



  return (
    <group position={position}
      onClick={click}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      {/* Status dot */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          color={agent.status === 'active' ? '#34d399' : '#3a3a55'}
          emissive={agent.status === 'active' ? '#34d399' : '#000'}
          emissiveIntensity={0.9}
        />
      </mesh>

      {/* Core */}
      <mesh ref={coreRef} position={[0, 1.4, 0]} castShadow>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.7 : 0.2} metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Ring */}
      <mesh ref={ringRef} position={[0, 1.4, 0]}>
        <torusGeometry args={[0.4, 0.014, 8, 40]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 1 : 0.3} transparent opacity={0.8} />
      </mesh>

      {/* Point light when active */}
      {active && <pointLight position={[0, 1.6, 0]} intensity={1.2} distance={2.5} color={color} />}

      {/* Name */}
      <Text position={[0, 2.15, 0]} fontSize={0.13} color={active ? '#ffffff' : '#888899'} anchorX="center" fontWeight={600}>
        {agent.name}
      </Text>
      <Text position={[0, 1.97, 0]} fontSize={0.095} color={active ? color : '#44445a'} anchorX="center">
        {agent.role}
      </Text>
    </group>
  )
}

function CeilLight({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh><boxGeometry args={[0.7, 0.04, 0.16]} /><meshStandardMaterial color="#18182e" /></mesh>
      <mesh position={[0, -0.03, 0]}><boxGeometry args={[0.62, 0.01, 0.13]} />
        <meshStandardMaterial color="#fff" emissive="#5555ff" emissiveIntensity={2.5} /></mesh>
      <pointLight intensity={0.7} distance={5} color="#8888ff" />
    </group>
  )
}

function Scene({ agents, color, selectedId, onSelect }: {
  agents: Agent[]; color: string; selectedId: string | null; onSelect: (id: string) => void
}) {
  const positions: [number,number,number][] = [
    [-3.2, 0, -1.2], [0, 0, -1.2], [3.2, 0, -1.2],
    [-1.6, 0, 1.6],  [1.6, 0, 1.6]
  ]

  return (
    <>
      <color attach="background" args={['#07070f']} />
      <fog attach="fog" args={['#07070f', 14, 24]} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[6, 10, 6]} intensity={0.35} color="#c0c0ff" castShadow />
      <pointLight position={[0, 5, 0]} intensity={0.3} color={color} distance={12} />

      <CeilLight pos={[-3, 3.6, 0]} />
      <CeilLight pos={[0, 3.6, 0]} />
      <CeilLight pos={[3, 3.6, 0]} />

      <Floor />
      <gridHelper args={[20, 20, '#111128', '#0d0d1e']} position={[0, 0.002, 0]} />

      {agents.map((_, i) => i < 5 && <Desk key={i} position={positions[i]} />)}

      {/* Back wall accent */}
      <mesh position={[0, 2.5, -6]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#050510" emissive={color} emissiveIntensity={0.03} />
      </mesh>

      {agents.map((agent, i) => i < 5 && (
        <AgentNode key={agent.id} agent={agent} position={positions[i]}
          color={color} selected={selectedId === agent.id}
          onSelect={() => onSelect(agent.id)} />
      ))}

      <OrbitControls enablePan={false} minDistance={5} maxDistance={16}
        maxPolarAngle={Math.PI / 2.1} minPolarAngle={0.3}
        autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

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
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 48 }}>
      <Suspense fallback={null}>
        <Scene agents={agents} color={color} selectedId={selectedId} onSelect={handleSelect} />
      </Suspense>
    </Canvas>
  )
}
