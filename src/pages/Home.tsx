'use client'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { offices } from '../data/offices'
import { OfficeCard } from '../components/OfficeCard'

const STATS = [
  { value: '1', label: 'Personal Agent' },
  { value: '6', label: 'Business Offices' },
  { value: '24+', label: 'AI Agents' },
  { value: '$29', label: 'Starts at' },
]

export function Home() {
  const navigate = useNavigate()
  return (
    <div style={{ background: '#07070f', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(120,40,240,0.14) 0%, transparent 70%)' }} />
        <div style={{ maxWidth: 820, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32, padding: '6px 16px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', fontSize: 12, fontWeight: 600, color: '#c084fc', letterSpacing: '0.06em' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 8px #a855f7', display: 'inline-block' }} />
            THE FUTURE OF AI WORK IS HERE
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(40px, 7vw, 70px)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-2px', marginBottom: 24, color: '#f0f0ff' }}>
            Your personal AI.<br />Your entire <span style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Office.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 17, color: '#7777aa', lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: '0 auto 40px' }}>
            One platform, two products: a personal AI agent for you, and full AI offices for your business. Skip the hiring, start working.
          </motion.p>

          {/* Two CTAs — one per product */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <button onClick={() => navigate('/personal-agent/general')}
                style={{ padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', border: '1px solid rgba(168,85,247,0.4)', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', boxShadow: '0 0 30px rgba(168,85,247,0.25)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 0 50px rgba(168,85,247,0.5)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='0 0 30px rgba(168,85,247,0.25)'}>
                🤖 Personal Agent — $29/mo
              </button>
              <span style={{ fontSize: 11, color: '#444466' }}>For individuals · General-purpose AI</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              <button onClick={() => navigate('/marketplace')}
                style={{ padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 500, color: '#c084fc', cursor: 'pointer', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(168,85,247,0.15)'; e.currentTarget.style.color='#e0b0ff' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(168,85,247,0.08)'; e.currentTarget.style.color='#c084fc' }}>
                🏢 Business Offices — from $149/mo
              </button>
              <span style={{ fontSize: 11, color: '#444466' }}>For teams · Specialized agents by industry</span>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 70, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, maxWidth: 660, width: '100%' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: 'rgba(14,14,28,0.8)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: '18px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#555577', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Personal Agent spotlight ── */}
      <section style={{ padding: '60px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <span style={{ fontSize: 11, color: '#555577', fontWeight: 700, letterSpacing: '0.1em' }}>PERSONAL AGENTS</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, padding: '5px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', fontSize: 11, fontWeight: 700, color: '#c084fc' }}>🤖 FOR YOU</div>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-0.8px', marginBottom: 14 }}>One agent.<br /><span style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Infinite tasks.</span></h2>
            <p style={{ fontSize: 14, color: '#666688', lineHeight: 1.7, marginBottom: 24 }}>Research, writing, coding, planning — the General Agent handles it all with real-time web search, persistent memory, and streaming responses.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
              {['Real-time search','Memory','Streaming','Claude Sonnet 4.5'].map(f => (
                <span key={f} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 99, background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>{f}</span>
              ))}
            </div>
            <button onClick={() => navigate('/personal-agent/general')}
              style={{ padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', border: '1px solid rgba(168,85,247,0.4)', background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
              Meet the General Agent →
            </button>
          </div>
          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
            style={{ background: 'rgba(14,14,28,0.8)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20, padding: '28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'Research the latest trends in AI agents', a: 'Searching Tavily... Found 8 relevant sources. Here\'s a summary of the 2025 landscape...', searching: true },
              { q: 'Write a product description for my app', a: 'Based on what I know about your project from our last conversation...' },
              { q: 'Help me plan my week', a: 'Looking at your priorities, I\'d suggest starting Monday with...' },
            ].map((ex, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ alignSelf: 'flex-end', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', fontSize: 12, padding: '7px 12px', borderRadius: '12px 12px 3px 12px', maxWidth: '85%' }}>{ex.q}</div>
                <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#a0a0cc', fontSize: 11, padding: '7px 12px', borderRadius: '12px 12px 12px 3px', maxWidth: '85%', lineHeight: 1.5 }}>
                  {ex.searching && <span style={{ color: '#a855f7', marginRight: 6 }}>🔍</span>}{ex.a}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Business Offices ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
          <span style={{ fontSize: 11, color: '#555577', fontWeight: 700, letterSpacing: '0.1em' }}>BUSINESS OFFICES</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 34, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-0.8px', marginBottom: 8 }}>Pre-built <span style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Offices</span></h2>
          <p style={{ fontSize: 14, color: '#555577' }}>6 industry verticals. 24+ specialized agents. Ready to deploy.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {offices.slice(0, 3).map((o, i) => <OfficeCard key={o.id} office={o} index={i} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <button onClick={() => navigate('/marketplace')} style={{ padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 500, color: '#8888aa', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            View all 6 offices →
          </button>
        </div>
      </section>

      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 12, color: '#33334a' }}>© 2026 Agent Office — Personal AI · Business Offices</span>
      </footer>
    </div>
  )
}
