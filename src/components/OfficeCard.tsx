import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Office } from '../data/offices'

export function OfficeCard({ office, index }: { office: Office; index: number }) {
  const [hovered, setHovered] = useState(false)
  const navigate = useNavigate()
  const fmtK = (n: number) => n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : `${(n/1000).toFixed(0)}K`

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.4,0,0.2,1] }}
      onClick={() => navigate(`/office/${office.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer', borderRadius: 20, overflow: 'hidden',
        background: '#0a0a16',
        border: `1px solid ${hovered ? office.color + '30' : 'rgba(255,255,255,0.05)'}`,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? `0 16px 48px rgba(0,0,0,0.4), 0 0 30px ${office.color}08` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        opacity: 0.65,
        position: 'relative',
      }}
    >
      {/* Coming Soon badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 2,
        padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
        background: 'rgba(255,255,255,0.06)', color: '#555577',
        border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.05em',
      }}>COMING SOON</div>

      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${office.color}44, transparent)` }} />

      {/* Preview area */}
      <div style={{
        height: 160,
        background: `radial-gradient(ellipse at 30% 60%, ${office.color}12, transparent 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
      }}>
        <div style={{ fontSize: 64, filter: `grayscale(50%) drop-shadow(0 0 16px ${office.color}40)` }}>{office.icon}</div>
        <div style={{
          position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 99,
          fontSize: 11, fontWeight: 600, background: `${office.color}12`,
          color: office.accentLight + '88', border: `1px solid ${office.color}20`,
        }}>{office.category}</div>
        <div style={{ position: 'absolute', top: 12, right: 52, display: 'flex' }}>
          {office.agents.slice(0,4).map((a, i) => (
            <div key={a.id} style={{
              width: 28, height: 28, borderRadius: '50%', background: `${office.color}14`,
              border: '2px solid #0a0a16', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, marginLeft: i > 0 ? -6 : 0,
              opacity: 0.7,
            }}>{a.emoji}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#8888aa' }}>{office.name}</div>
        <div style={{ fontSize: 12, color: office.accentLight + '66', marginTop: 2 }}>{office.tagline}</div>
        <p style={{ fontSize: 13, color: '#444466', lineHeight: 1.6, margin: '10px 0 16px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {office.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#555577' }}>${office.price}</span>
            <span style={{ fontSize: 12, color: '#333355', marginLeft: 3 }}>/mo</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#333355' }}>{office.agents.length} agents</span>
            <span style={{ fontSize: 12, color: '#333355' }}>{fmtK(office.tokens)} tokens</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
