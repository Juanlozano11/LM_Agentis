import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useUser, SignedIn, SignedOut } from '@clerk/clerk-react'
import { useAuthFetch } from '../lib/api'

interface UserAgent {
  id: string
  agent_id: string
  agent_name: string
  activated_at: string
}

interface DashboardData {
  agents: UserAgent[]
  credits: number
}

const AGENT_META: Record<string, { emoji: string; color: string; desc: string }> = {
  general: {
    emoji: '🤖',
    color: '#a855f7',
    desc: 'General-purpose AI with web search and memory',
  },
}

export function Dashboard() {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()
  const authFetch = useAuthFetch()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setLoading(false); return }

    authFetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [isLoaded, user])

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Not signed in */}
        <SignedOut>
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#f0f0ff', marginBottom: 12 }}>Sign in to view your dashboard</h2>
            <p style={{ color: '#555577', marginBottom: 28 }}>You need an account to access your AI agents.</p>
            <button onClick={() => navigate('/marketplace')} style={{
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: '1px solid rgba(168,85,247,0.4)',
            }}>Browse Marketplace →</button>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36, display: 'flex', alignItems: 'center', gap: 16 }}>
            {user?.imageUrl && (
              <img src={user.imageUrl} alt="" style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid rgba(168,85,247,0.4)' }} />
            )}
            <div>
              <p style={{ fontSize: 13, color: '#444466', marginBottom: 4 }}>Welcome back 👋</p>
              <h1 style={{ fontSize: 34, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-1px', margin: 0 }}>
                {user?.firstName ? `${user.firstName}'s ` : ''}
                <span style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard</span>
              </h1>
            </div>
          </motion.div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 40 }}>
            {[
              { label: 'Active Agents', value: loading ? '—' : String(data?.agents.length ?? 0), color: '#a855f7' },
              { label: 'Credits Available', value: loading ? '—' : String(data?.credits ?? 0), color: '#34d399' },
              { label: 'Plan', value: 'Personal', color: '#c084fc' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                style={{ background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '22px 20px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#444466', marginTop: 5 }}>{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#444466' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
              Loading your agents...
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', marginBottom: 24 }}>
              Error loading data: {error}
            </div>
          )}

          {/* No agents yet */}
          {!loading && !error && data?.agents.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '80px 40px', borderRadius: 24, background: 'rgba(14,14,28,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0ff', marginBottom: 10 }}>No agents activated yet</h2>
              <p style={{ color: '#555577', marginBottom: 28, fontSize: 14 }}>Activate your first agent to get started.</p>
              <button onClick={() => navigate('/personal-agent/general')} style={{
                padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: '#fff', cursor: 'pointer', background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                border: '1px solid rgba(168,85,247,0.4)',
              }}>Activate General Agent ✨</button>
            </motion.div>
          )}

          {/* Active agents grid */}
          {!loading && !error && data && data.agents.length > 0 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#e0e0ff', marginBottom: 16 }}>Your Agents</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {data.agents.map((agent, i) => {
                  const meta = AGENT_META[agent.agent_id] ?? { emoji: '🤖', color: '#a855f7', desc: 'AI Agent' }
                  return (
                    <motion.div key={agent.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      style={{ background: 'rgba(14,14,28,0.9)', border: `1px solid ${meta.color}22`, borderRadius: 20, padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                      {/* Agent header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 14, background: `${meta.color}18`, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{meta.emoji}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>{agent.agent_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
                            <span style={{ fontSize: 11, color: '#34d399' }}>Active</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: `${meta.color}14`, color: meta.color, border: `1px solid ${meta.color}25` }}>PERSONAL</span>
                      </div>

                      {/* Description */}
                      <p style={{ fontSize: 12, color: '#555577', lineHeight: 1.6, margin: 0 }}>{meta.desc}</p>

                      {/* Credits */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ fontSize: 12, color: '#444466' }}>Credits available</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>{data.credits}</span>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => navigate(`/workspace/${agent.agent_id}`)}
                        style={{
                          width: '100%', padding: '12px', borderRadius: 12, fontWeight: 600, fontSize: 14,
                          color: '#fff', cursor: 'pointer',
                          background: `linear-gradient(135deg, ${meta.color}cc, ${meta.color})`,
                          border: `1px solid ${meta.color}44`,
                          boxShadow: `0 4px 20px ${meta.color}22`,
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 8px 30px ${meta.color}44`}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 4px 20px ${meta.color}22`}
                      >
                        Open Workspace →
                      </button>
                    </motion.div>
                  )
                })}

                {/* Add more */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                  onClick={() => navigate('/marketplace')}
                  style={{ background: 'transparent', border: '2px dashed rgba(255,255,255,0.07)', borderRadius: 20, padding: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 180 }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(168,85,247,0.3)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>
                    <div style={{ fontSize: 13, color: '#444466' }}>Add another agent</div>
                  </div>
                </motion.div>
              </div>
            </div>
          )}
        </SignedIn>
      </div>
    </div>
  )
}
