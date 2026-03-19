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
        cursor: 'pointer',
        borderRadius: 20,
        overflow: 'hidden',
        background: '#0e0e1c',
        border: `1px solid ${hovered ? office.color + '40' : 'rgba(255,255,255,0.06)'}`,
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${office.color}12` : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${office.color}, transparent)` }} />

      {/* Preview area */}
      <div style={{
        height: 160,
        background: `radial-gradient(ellipse at 30% 60%, ${office.color}20, transparent 65%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 64,
          animation: hovered ? 'float 3s ease-in-out infinite' : 'none',
          filter: `drop-shadow(0 0 24px ${office.color}80)`,
          transition: 'filter 0.3s',
        }}>{office.icon}</div>

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
          background: `${office.color}18`, color: office.accentLight,
          border: `1px solid ${office.color}30`,
        }}>{office.category}</div>

        {/* Agents avatars */}
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: -4 }}>
          {office.agents.slice(0,4).map((a, i) => (
            <div key={a.id} style={{
              width: 28, height: 28, borderRadius: '50%',
              background: `${office.color}20`, border: `2px solid #0e0e1c`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, marginLeft: i > 0 ? -6 : 0, zIndex: i,
            }}>{a.emoji}</div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 20px 20px' }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: hovered ? '#fff' : '#e8e8ff', transition: 'color 0.2s' }}>
            {office.name}
          </div>
          <div style={{ fontSize: 12, color: office.accentLight, marginTop: 2 }}>{office.tagline}</div>
        </div>

        <p style={{ fontSize: 13, color: '#666688', lineHeight: 1.6, margin: '10px 0 16px',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {office.description}
        </p>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>${office.price}</span>
            <span style={{ fontSize: 12, color: '#555577', marginLeft: 3 }}>/mo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: '#555577' }}>{office.agents.length} agents</span>
            <span style={{ fontSize: 12, color: '#555577' }}>{fmtK(office.tokens)} tokens</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
