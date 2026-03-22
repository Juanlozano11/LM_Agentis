import { useState, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { offices } from '../data/offices'
import type { Agent } from '../data/offices'

const OfficeViewer3D = lazy(() => import('../components/OfficeViewer3D').then(m => ({ default: m.OfficeViewer3D })))

function AgentModal({ agent, color, onClose }: { agent: Agent; color: string; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 440, borderRadius: 24, padding: 28,
            background: '#0d0d1e', border: `1px solid ${color}50`,
            boxShadow: `0 0 60px ${color}18`, position: 'relative',
          }}
        >
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14, width: 28, height: 28,
            borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: 'none',
            color: '#666688', cursor: 'pointer', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${color}18`, border: `1px solid ${color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>{agent.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#f0f0ff' }}>{agent.name}</div>
              <div style={{ fontSize: 13, color, marginTop: 2 }}>{agent.role}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: agent.status === 'active' ? '#34d399' : '#3a3a55',
                  boxShadow: agent.status === 'active' ? '0 0 6px #34d399' : 'none',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 11, color: agent.status === 'active' ? '#34d399' : '#555577', textTransform: 'capitalize' }}>
                  {agent.status}
                </span>
              </div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#777799', lineHeight: 1.65, marginBottom: 20 }}>{agent.description}</p>

          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: '#444466', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 10 }}>CAPABILITIES</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {agent.capabilities.map(cap => (
                <span key={cap} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 99,
                  background: `${color}14`, color, border: `1px solid ${color}25`,
                }}>{cap}</span>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <span style={{ fontSize: 13, color: '#666688' }}>Token consumption</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0ff' }}>
              ~{agent.tokenUsage.toLocaleString()}/mo
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export function OfficeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const office = offices.find(o => o.id === id)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [tab, setTab] = useState<'agents' | 'capabilities'>('agents')

  if (!office) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
        <p style={{ color: '#666688', marginBottom: 20 }}>Office not found.</p>
        <button onClick={() => navigate('/marketplace')} style={{
          padding: '10px 24px', borderRadius: 10, background: 'rgba(168,85,247,0.2)',
          color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer', fontSize: 14,
        }}>← Back to Marketplace</button>
      </div>
    </div>
  )

  const fmtK = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${(n / 1000).toFixed(0)}K`
  const handleAgentSelect = useCallback((a: Agent | null) => { if (a) setSelectedAgent(a) }, [])

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingTop: 60 }}>

      {/* Hero */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: `radial-gradient(ellipse at 20% 50%, ${office.color}10, transparent 60%)`,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 28px' }}>
          <button onClick={() => navigate('/marketplace')} style={{
            background: 'none', border: 'none', color: '#444466', cursor: 'pointer',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16,
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#8888aa'}
            onMouseLeave={e => e.currentTarget.style.color = '#444466'}
          >← Marketplace</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 44, opacity: 0.7 }}>{office.icon}</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                  background: `${office.color}18`, color: office.accentLight,
                  border: `1px solid ${office.color}25`, letterSpacing: '0.06em',
                }}>{office.category.toUpperCase()}</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.05)', color: '#555577',
                  border: '1px solid rgba(255,255,255,0.07)', letterSpacing: '0.05em',
                }}>COMING SOON</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#e0e0ee', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
                {office.name}
              </h1>
              <p style={{ fontSize: 14, color: office.accentLight + '88', marginTop: 2 }}>{office.tagline}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>

        {/* LEFT: 3D viewer */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{
            height: 520, borderRadius: 20, overflow: 'hidden',
            border: `1px solid ${office.color}20`, background: '#07070f',
            position: 'sticky', top: 80, opacity: 0.85,
          }}>
            <Suspense fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>🏢</div>
                  <p style={{ color: '#333355', fontSize: 12 }}>Loading 3D office...</p>
                </div>
              </div>
            }>
              <OfficeViewer3D agents={office.agents} color={office.color} onAgentSelect={handleAgentSelect} />
            </Suspense>
            <div style={{
              position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              padding: '5px 14px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.65)', color: '#444466', border: '1px solid rgba(255,255,255,0.06)',
              pointerEvents: 'none',
            }}>Drag · Zoom · Click agent</div>
          </div>
        </motion.div>

        {/* RIGHT: Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <p style={{ fontSize: 13, color: '#555577', lineHeight: 1.65 }}>{office.description}</p>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Agents', value: String(office.agents.length) },
              { label: 'Tokens/mo', value: fmtK(office.tokens) },
              { label: 'Extra token', value: `$${office.extraTokenPrice}` },
            ].map(m => (
              <div key={m.label} style={{
                background: 'rgba(14,14,28,0.7)', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 12, padding: '12px 0', textAlign: 'center',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#888899' }}>{m.value}</div>
                <div style={{ fontSize: 11, color: '#333355', marginTop: 3 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: 'rgba(14,14,28,0.9)' }}>
            {(['agents', 'capabilities'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                background: tab === t ? `${office.color}18` : 'transparent',
                color: tab === t ? office.accentLight + 'aa' : '#333355',
              }}>{t}</button>
            ))}
          </div>

          {/* Agents list */}
          {tab === 'agents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {office.agents.map(agent => (
                <button key={agent.id} onClick={() => setSelectedAgent(agent)} style={{
                  background: 'rgba(14,14,28,0.6)', border: '1px solid rgba(255,255,255,0.04)',
                  borderRadius: 14, padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${office.color}12`, border: `1px solid ${office.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, opacity: 0.8,
                  }}>{agent.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#888899' }}>{agent.name}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#444466', marginTop: 2 }}>{agent.role}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#2a2a40', flexShrink: 0 }}>{(agent.tokenUsage / 1000).toFixed(0)}K</span>
                </button>
              ))}
            </div>
          )}

          {/* Capabilities */}
          {tab === 'capabilities' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {office.capabilities.map(cap => (
                  <div key={cap} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#555577' }}>
                    <span style={{ color: office.accentLight + '66', fontSize: 16 }}>✓</span>{cap}
                  </div>
                ))}
              </div>
              <div style={{
                padding: '14px 16px', borderRadius: 14,
                background: `${office.color}06`, border: `1px solid ${office.color}14`,
              }}>
                <p style={{ fontSize: 11, color: office.accentLight + '66', fontWeight: 700, letterSpacing: '0.07em', marginBottom: 10 }}>BEST FOR</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {office.useCases.map(uc => (
                    <span key={uc} style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 99,
                      background: 'rgba(255,255,255,0.03)', color: '#444466',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}>{uc}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pricing CTA — Coming Soon */}
          <div style={{
            borderRadius: 18, padding: '22px 20px 24px',
            background: 'linear-gradient(135deg, #0a0a16, #0e0a18)',
            border: '1px solid rgba(255,255,255,0.06)',
            marginTop: 4,
          }}>
            <div style={{ marginBottom: 14 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 99,
                background: 'rgba(255,255,255,0.05)', color: '#555577',
                border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.06em',
              }}>COMING SOON</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 34, fontWeight: 900, color: '#444466' }}>${office.price}</span>
              <span style={{ fontSize: 13, color: '#2a2a40' }}>/month</span>
            </div>
            <p style={{ fontSize: 12, color: '#2a2a40', marginBottom: 20 }}>
              Includes {fmtK(office.tokens)} tokens · ${office.extraTokenPrice}/extra token
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                disabled
                style={{
                  width: '100%', padding: '13px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                  color: '#555577', cursor: 'not-allowed',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                🔔 Notify me when available
              </button>
              <button
                onClick={() => navigate('/marketplace')}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontWeight: 500, fontSize: 14,
                  color: '#444466', cursor: 'pointer',
                  background: 'transparent', border: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#888899'}
                onMouseLeave={e => e.currentTarget.style.color = '#444466'}
              >← Back to Marketplace</button>
            </div>
          </div>

        </motion.div>
      </div>

      {selectedAgent && (
        <AgentModal agent={selectedAgent} color={office.color} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}
