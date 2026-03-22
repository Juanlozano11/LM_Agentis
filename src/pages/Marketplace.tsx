import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { offices } from '../data/offices'
import { OfficeCard } from '../components/OfficeCard'

const CATS = ['All', 'Finance', 'Legal', 'Technology', 'Marketing', 'Healthcare', 'Operations']

const COMING_SOON = [
  { emoji: '🗓️', name: 'Lifestyle Planner', desc: 'Manages your schedule, habits, and personal goals. Your life, optimized.', color: '#f472b6', soon: 'Q2 2026' },
  { emoji: '✈️', name: 'Travel Agent', desc: 'Books flights, hotels, and builds full itineraries. Just tell it where you want to go.', color: '#22d3ee', soon: 'Q3 2026' },
  { emoji: '💰', name: 'Finance Agent', desc: 'Tracks expenses, analyzes spending, and gives personal financial advice.', color: '#f59e0b', soon: 'Q3 2026' },
  { emoji: '📧', name: 'Email Manager', desc: 'Reads, prioritizes, drafts and sends emails on your behalf. Inbox zero, always.', color: '#34d399', soon: 'Q4 2026' },
]

function PersonalAgentCard() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => navigate('/personal-agent/general')}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', borderRadius: 20, overflow: 'hidden', background: hovered ? '#100d1e' : '#0e0e1c', border: `1px solid ${hovered ? 'rgba(168,85,247,0.5)' : 'rgba(168,85,247,0.2)'}`, transform: hovered ? 'translateY(-5px)' : 'translateY(0)', boxShadow: hovered ? '0 20px 60px rgba(0,0,0,0.5), 0 0 50px rgba(168,85,247,0.15)' : '0 0 0 1px rgba(168,85,247,0.05)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #7c3aed, #a855f7, #c084fc)' }} />
      <div style={{ height: 150, position: 'relative', background: 'radial-gradient(ellipse at 50% 80%, rgba(168,85,247,0.18), transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 86, height: 86, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: hovered ? '0 0 40px rgba(168,85,247,0.3)' : '0 0 20px rgba(168,85,247,0.15)', transition: 'box-shadow 0.3s' }}>
          <span style={{ fontSize: 50, filter: hovered ? 'drop-shadow(0 0 20px rgba(168,85,247,0.8))' : 'drop-shadow(0 0 10px rgba(168,85,247,0.4))', transition: 'filter 0.3s' }}>🤖</span>
        </div>
        <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }}>PERSONAL</div>
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {['Web Search', 'Memory', 'Voice'].map(cap => (
            <span key={cap} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', color: '#9966cc', border: '1px solid rgba(168,85,247,0.2)' }}>{cap}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: '14px 20px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: hovered ? '#fff' : '#e8e8ff', transition: 'color 0.2s' }}>General Agent</div>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399', display: 'inline-block' }} />
        </div>
        <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 8 }}>Your personal AI assistant</div>
        <p style={{ fontSize: 12, color: '#666688', lineHeight: 1.6, margin: '0 0 14px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          General-purpose AI with real-time web search, persistent memory, and voice input. Always available.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div><span style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$29</span><span style={{ fontSize: 11, color: '#555577', marginLeft: 2 }}>/mo</span></div>
          <div style={{ padding: '6px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: hovered ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(168,85,247,0.12)', color: hovered ? '#fff' : '#c084fc', border: `1px solid ${hovered ? 'transparent' : 'rgba(168,85,247,0.25)'}`, transition: 'all 0.2s' }}>Activate →</div>
        </div>
      </div>
    </motion.div>
  )
}

function ComingSoonCard({ agent, index }: { agent: typeof COMING_SOON[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05, duration: 0.4 }}
      style={{ borderRadius: 20, overflow: 'hidden', background: '#0a0a16', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', cursor: 'default' }}>
      <div style={{ height: 3, background: `linear-gradient(90deg, ${agent.color}44, transparent)` }} />
      {/* Coming soon overlay */}
      <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 2, padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.06)', color: '#555577', border: '1px solid rgba(255,255,255,0.08)', letterSpacing: '0.05em' }}>COMING {agent.soon}</div>
      <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at 50% 80%, ${agent.color}10, transparent 70%)`, opacity: 0.6 }}>
        <span style={{ fontSize: 52, filter: `grayscale(60%) drop-shadow(0 0 12px ${agent.color}40)` }}>{agent.emoji}</span>
      </div>
      <div style={{ padding: '14px 20px 18px', opacity: 0.65 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#a0a0cc', marginBottom: 4 }}>{agent.name}</div>
        <p style={{ fontSize: 12, color: '#444466', lineHeight: 1.6, margin: '0 0 14px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{agent.desc}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontSize: 12, color: '#333355' }}>Price TBD</div>
          <div style={{ padding: '6px 14px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.03)', color: '#333355', border: '1px solid rgba(255,255,255,0.05)' }}>Notify me</div>
        </div>
      </div>
    </motion.div>
  )
}

export function Marketplace() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = offices.filter(o => {
    const matchCat = cat === 'All' || o.category === cat
    const q = search.toLowerCase()
    return matchCat && (!q || o.name.toLowerCase().includes(q) || o.description.toLowerCase().includes(q))
  })

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingTop: 100 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 44 }}>
          <p style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>MARKETPLACE</p>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-1px', marginBottom: 8 }}>
            Browse AI <span style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Agents</span>
          </h1>
          <p style={{ fontSize: 14, color: '#555577' }}>Personal agents for you · Business offices for your team</p>
        </motion.div>

        {/* ── PERSONAL AGENTS ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', letterSpacing: '0.1em', marginBottom: 4 }}>PERSONAL AGENTS</p>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.5px', margin: 0 }}>For individuals</h2>
            </div>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(168,85,247,0.2), transparent)', marginLeft: 12 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            <PersonalAgentCard />
            {COMING_SOON.map((agent, i) => <ComingSoonCard key={agent.name} agent={agent} index={i} />)}
          </div>
        </motion.div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
          <span style={{ fontSize: 11, color: '#333355', fontWeight: 700, letterSpacing: '0.1em' }}>BUSINESS OFFICES</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search offices..."
            style={{ padding: '10px 16px', borderRadius: 10, fontSize: 13, width: 240, background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f0ff', outline: 'none' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: cat===c?'rgba(168,85,247,0.2)':'rgba(255,255,255,0.03)', color: cat===c?'#c084fc':'#555577', border: cat===c?'1px solid rgba(168,85,247,0.35)':'1px solid rgba(255,255,255,0.06)' }}>{c}</button>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#33334a', marginBottom: 20 }}>{filtered.length} {filtered.length===1?'office':'offices'} found</p>
        {filtered.length === 0
          ? <div style={{ textAlign: 'center', padding: '100px 0' }}><div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div><p style={{ color: '#444466' }}>No offices match your search.</p></div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {filtered.map((o, i) => <OfficeCard key={o.id} office={o} index={i} />)}
            </div>
        }
      </div>
    </div>
  )
}
