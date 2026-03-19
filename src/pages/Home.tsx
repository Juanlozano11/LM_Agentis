import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { offices } from '../data/offices'
import { OfficeCard } from '../components/OfficeCard'

const STATS = [
  { value: '6', label: 'Verticals' },
  { value: '24+', label: 'AI Agents' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '$149', label: 'Starts at' },
]

export function Home() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#07070f', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '80px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* bg blobs */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(120,40,240,0.14) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', left: '-15%', top: '30%', width: 500, height: 500,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', right: '-10%', top: '25%', width: 400, height: 400,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)',
        }} />

        <div style={{ maxWidth: 760, textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 32,
              padding: '6px 16px', borderRadius: 99,
              background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)',
              fontSize: 12, fontWeight: 600, color: '#c084fc', letterSpacing: '0.06em',
            }}
          >
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#a855f7',
              boxShadow: '0 0 8px #a855f7', animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
            THE FUTURE OF AI WORK IS HERE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontSize: 'clamp(44px, 8vw, 76px)', fontWeight: 900, lineHeight: 1.04,
              letterSpacing: '-2px', marginBottom: 24, color: '#f0f0ff' }}
          >
            Hire an entire<br />
            <span className="shimmer">AI Office</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ fontSize: 18, color: '#7777aa', lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}
          >
            Pre-built offices staffed with specialized AI agents.
            Finance, Legal, Dev, Marketing — skip the hiring, start working.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <button onClick={() => navigate('/marketplace')} style={{
              padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              color: '#fff', cursor: 'pointer', border: '1px solid rgba(168,85,247,0.4)',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              boxShadow: '0 0 30px rgba(168,85,247,0.25)',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 50px rgba(168,85,247,0.5)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 30px rgba(168,85,247,0.25)')}
            >Browse Offices →</button>
            <button onClick={() => navigate('/dashboard')} style={{
              padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 500,
              color: '#8888aa', cursor: 'pointer', transition: 'all 0.2s',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e0e0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >View Dashboard</button>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            marginTop: 80, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12, maxWidth: 700, width: '100%',
          }}
        >
          {STATS.map(s => (
            <div key={s.label} style={{
              background: 'rgba(14,14,28,0.8)', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16, padding: '20px 16px', textAlign: 'center',
            }}>
              <div className="gradient-text" style={{ fontSize: 28, fontWeight: 900 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#555577', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Office grid */}
      <section style={{ padding: '60px 24px 80px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.1em', marginBottom: 10 }}>MARKETPLACE</p>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-0.8px', marginBottom: 8 }}>
            Featured <span className="gradient-text">Offices</span>
          </h2>
          <p style={{ fontSize: 14, color: '#555577' }}>6 industry verticals. 24+ specialized agents. Ready to deploy.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {offices.map((o, i) => <OfficeCard key={o.id} office={o} index={i} />)}
        </div>
      </section>

      {/* How it works */}
      <section style={{
        padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.04)',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 34, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-0.8px', marginBottom: 10 }}>How it works</h2>
            <p style={{ color: '#555577', fontSize: 14 }}>From zero to a full AI team in three steps.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { n: '01', icon: '🏪', title: 'Browse the marketplace', desc: 'Explore 6 industry offices. Filter by category, compare pricing and agent capabilities.' },
              { n: '02', icon: '🌐', title: 'Explore in 3D', desc: 'Enter any office, rotate the view, click agents to see exactly what you\'re hiring.' },
              { n: '03', icon: '⚡', title: 'Subscribe & deploy', desc: 'Pay monthly. Your AI office is live in seconds — no setup, no onboarding.' },
            ].map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                style={{
                  background: 'rgba(14,14,28,0.7)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: 20, padding: '32px 28px',
                }}>
                <div style={{ fontSize: 36, marginBottom: 20 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>STEP {s.n}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 10 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: '#666688', lineHeight: 1.65 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{
          maxWidth: 640, margin: '0 auto', textAlign: 'center',
          background: 'linear-gradient(135deg, #0d0d1a, #140a22)',
          border: '1px solid rgba(168,85,247,0.2)', borderRadius: 28, padding: '64px 40px',
        }}>
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#f0f0ff', letterSpacing: '-0.8px', marginBottom: 12 }}>
            Ready to hire your<br /><span className="gradient-text">AI office?</span>
          </h2>
          <p style={{ fontSize: 14, color: '#666688', marginBottom: 32 }}>Starting at $149/month. Cancel anytime.</p>
          <button onClick={() => navigate('/marketplace')} style={{
            padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 600,
            color: '#fff', cursor: 'pointer', border: '1px solid rgba(168,85,247,0.4)',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          }}>Get Started →</button>
        </div>
      </section>

      <footer style={{ padding: '24px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ fontSize: 12, color: '#33334a' }}>© 2026 Agent Office — Your AI Workforce</span>
      </footer>
    </div>
  )
}
