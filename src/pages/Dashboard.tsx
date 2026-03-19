import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { offices } from '../data/offices'

const MY = [offices[0], offices[3]]
const ACTIVITY = [
  { name: 'Risk Analyst', office: 'Fintech Office', action: 'Credit scoring batch — 47 applications processed', time: '2m ago', emoji: '📊', color: '#f59e0b' },
  { name: 'Content Strategist', office: 'Growth Office', action: 'Published 3 articles and updated content calendar', time: '18m ago', emoji: '✍️', color: '#f472b6' },
  { name: 'KYC Agent', office: 'Fintech Office', action: '12 identities verified — 0 flagged', time: '1h ago', emoji: '🔍', color: '#f59e0b' },
  { name: 'SEO Agent', office: 'Growth Office', action: 'Q2 keyword research report ready', time: '3h ago', emoji: '📈', color: '#f472b6' },
  { name: 'Credit Engine', office: 'Fintech Office', action: '8 loan decisions processed', time: '5h ago', emoji: '⚡', color: '#f59e0b' },
]

export function Dashboard() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <p style={{ fontSize: 13, color: '#444466', marginBottom: 4 }}>Welcome back 👋</p>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-1px' }}>
            Your <span className="gradient-text">Dashboard</span>
          </h1>
        </motion.div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 36 }}>
          {[
            { label: 'Active Offices', value: '2', color: '#a855f7' },
            { label: 'Active Agents', value: '8', color: '#22d3ee' },
            { label: 'Tokens Used', value: '124K', color: '#f59e0b' },
            { label: 'Monthly Spend', value: '$498', color: '#34d399' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{
                background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 16, padding: '20px 18px',
              }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#444466', marginTop: 5 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

          {/* Offices */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0e0ff', marginBottom: 16 }}>Active Offices</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {MY.map((office, i) => (
                <motion.div key={office.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i*0.1 }}
                  style={{ background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, fontSize: 20,
                        background: `${office.color}18`, border: `1px solid ${office.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{office.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0ff' }}>{office.name}</div>
                        <div style={{ fontSize: 11, color: '#444466' }}>{office.category} · Pro Plan</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 99,
                      background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)',
                    }}>Active</span>
                  </div>

                  {/* Token bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#444466', marginBottom: 6 }}>
                      <span>Token usage</span>
                      <span>124K / {Math.floor(office.tokens/1000)}K</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: '#1a1a30' }}>
                      <div style={{
                        height: '100%', width: '26%', borderRadius: 99,
                        background: `linear-gradient(90deg, ${office.color}, ${office.accentLight})`,
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: -4 }}>
                      {office.agents.map((a, j) => (
                        <div key={a.id} style={{
                          width: 30, height: 30, borderRadius: '50%', fontSize: 14,
                          background: `${office.color}18`, border: `2px solid #07070f`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: j > 0 ? -6 : 0, zIndex: j,
                        }}>{a.emoji}</div>
                      ))}
                    </div>
                    <button onClick={() => navigate(`/office/${office.id}`)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 500, color: office.accentLight,
                    }}>Open Office →</button>
                  </div>
                </motion.div>
              ))}

              {/* Add */}
              <div onClick={() => navigate('/marketplace')} style={{
                background: 'transparent', border: '2px dashed rgba(255,255,255,0.07)',
                borderRadius: 18, padding: '20px', cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12,
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, fontSize: 18,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444466',
                }}>+</div>
                <span style={{ fontSize: 13, color: '#444466' }}>Add another office</span>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0e0ff', marginBottom: 16 }}>Agent Activity</h2>
            <div style={{ background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, overflow: 'hidden' }}>
              {ACTIVITY.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i*0.06 }}
                  style={{
                    display: 'flex', gap: 12, padding: '12px 16px', transition: 'background 0.2s',
                    borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, fontSize: 14, flexShrink: 0,
                    background: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{item.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#c0c0dd', marginBottom: 2 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: '#555577', lineHeight: 1.5 }}>{item.action}</div>
                    <div style={{ fontSize: 10, color: '#33334a', marginTop: 4 }}>{item.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
