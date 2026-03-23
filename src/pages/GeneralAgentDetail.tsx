import { useState, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useAuthFetch } from '../lib/api'
import { GoogleWorkspaceConnect } from '../components/GoogleWorkspaceConnect'

const HomeOfficeViewer3D = lazy(() => import('../components/HomeOfficeViewer3D').then(m => ({ default: m.HomeOfficeViewer3D })))

const AGENT_COLOR = '#a855f7'

const CAPABILITIES = [
  { emoji: '🔍', title: 'Real-time web search', desc: 'Searches the internet via Tavily for up-to-date information.' },
  { emoji: '🧠', title: 'Persistent memory', desc: 'Remembers your conversations across sessions.' },
  { emoji: '⚡', title: 'Streaming responses', desc: 'Answers appear token by token — no waiting.' },
  { emoji: '🛠️', title: 'Tool calling', desc: 'Autonomously decides when and how to use tools.' },
  { emoji: '🎙️', title: 'Voice input (soon)', desc: 'Transcribe audio messages with Whisper.' },
  { emoji: '💬', title: 'Multilingual', desc: 'Responds naturally in any language you write in.' },
]

const USE_CASES = ['Research', 'Writing', 'Q&A', 'Brainstorming', 'Coding', 'Translations', 'Summaries', 'Planning']

export function GeneralAgentDetail() {
  const navigate = useNavigate()
  const { user, isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const authFetch = useAuthFetch()
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showGoogleConnect, setShowGoogleConnect] = useState(false)

  const handleActivate = async () => {
    if (!isSignedIn) {
      openSignIn({ redirectUrl: '/personal-agent/general' })
      return
    }

    setActivating(true)
    setError(null)

    try {
      const res = await authFetch('/api/activate', {
        method: 'POST',
        body: JSON.stringify({ agentId: 'general', agentName: 'General Agent' }),
      })

      if (!res.ok) {
        const e = await res.json()
        setError(e.error ?? 'Error activating agent')
        setActivating(false)
        return
      }

      const data = await res.json()

      // If Google Workspace not connected yet, show OAuth flow first
      if (data.requiresGoogleAuth) {
        setActivating(false)
        setShowGoogleConnect(true)
        return
      }

      // Already connected — go to dashboard
      navigate('/dashboard')
    } catch (e: any) {
      setError(e.message)
      setActivating(false)
    }
  }

  return (
    <div style={{ background: '#07070f', minHeight: '100vh', paddingTop: 60 }}>

      {/* Google Workspace OAuth modal */}
      <AnimatePresence>
        {showGoogleConnect && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 480, borderRadius: 20, background: '#0d0d1e', border: '1px solid rgba(168,85,247,0.3)', padding: 32 }}>
              <h2 style={{ color: '#f0f0ff', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Connect Google Workspace</h2>
              <p style={{ color: '#7777aa', fontSize: 13, marginBottom: 24 }}>
                Connect your Google account so the agent can manage your Gmail, Calendar, and Drive directly from chat.
              </p>
              <GoogleWorkspaceConnect
                authFetch={authFetch}
                onConnected={() => { setShowGoogleConnect(false); navigate('/dashboard') }}
                onSkip={() => { setShowGoogleConnect(false); navigate('/dashboard') }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.1), transparent 60%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 28px' }}>
          <button onClick={() => navigate('/marketplace')} style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
            onMouseEnter={e => e.currentTarget.style.color = '#8888aa'}
            onMouseLeave={e => e.currentTarget.style.color = '#444466'}>
            ← Marketplace
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, boxShadow: '0 0 30px rgba(168,85,247,0.35)' }}>🤖</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', letterSpacing: '0.06em' }}>PERSONAL AGENT</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#f0f0ff', letterSpacing: '-0.5px', lineHeight: 1.2, margin: 0 }}>General Agent</h1>
              <p style={{ fontSize: 14, color: '#a855f7', marginTop: 2 }}>Your personal AI assistant, always on.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 80px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 28 }}>

        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* 3D */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div style={{ height: 480, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(168,85,247,0.2)', background: '#87ceeb', position: 'relative' }}>
              <Suspense fallback={
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
                    <p style={{ color: '#333355', fontSize: 12 }}>Loading home office...</p>
                  </div>
                </div>
              }>
                <HomeOfficeViewer3D color={AGENT_COLOR} active={false} />
              </Suspense>
              <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', padding: '5px 14px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.55)', color: '#444466', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }}>
                Drag · Zoom
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            style={{ fontSize: 14, color: '#7777aa', lineHeight: 1.75, margin: 0 }}>
            A general-purpose AI agent powered by Claude Sonnet 4.5 — with real-time web search, persistent memory across sessions, and streaming responses. Handles anything you throw at it.
          </motion.p>

          {/* Capabilities grid */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}>
            <p style={{ fontSize: 11, color: '#555577', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 14 }}>CAPABILITIES</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {CAPABILITIES.map(cap => (
                <div key={cap.title} style={{ padding: '14px', borderRadius: 12, background: 'rgba(14,14,28,0.8)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{cap.emoji}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0ff', marginBottom: 3 }}>{cap.title}</div>
                    <div style={{ fontSize: 11, color: '#555577', lineHeight: 1.5 }}>{cap.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Use cases */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
            <p style={{ fontSize: 11, color: '#555577', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 10 }}>GREAT FOR</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {USE_CASES.map(uc => (
                <span key={uc} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 99, background: 'rgba(255,255,255,0.03)', color: '#666688', border: '1px solid rgba(255,255,255,0.07)' }}>{uc}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — pricing + CTA */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ borderRadius: 20, padding: '28px', background: 'linear-gradient(135deg, #0d0d1e, #130a22)', border: '1px solid rgba(168,85,247,0.25)', position: 'sticky', top: 80 }}>

            {/* User greeting */}
            <AnimatePresence>
              {isSignedIn && user && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', borderRadius: 12, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
                  {user.imageUrl && <img src={user.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
                  <span style={{ fontSize: 13, color: '#c084fc' }}>Hi, {user.firstName ?? user.emailAddresses[0]?.emailAddress} 👋</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
              <span style={{ fontSize: 44, fontWeight: 900, background: 'linear-gradient(135deg, #c084fc, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$29</span>
              <span style={{ fontSize: 14, color: '#444466' }}>/month</span>
            </div>
            <p style={{ fontSize: 12, color: '#444466', marginBottom: 24 }}>100 credits included · 2 per message · 5 per web search</p>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {['Claude Sonnet 4.5', 'Real-time web search (Tavily)', 'Persistent memory', 'Streaming responses', 'Voice input (coming soon)'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#8888aa' }}>
                  <span style={{ color: '#a855f7', fontSize: 15, flexShrink: 0 }}>✓</span>{f}
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleActivate}
              disabled={activating}
              style={{
                width: '100%', padding: '15px', borderRadius: 13, fontWeight: 700, fontSize: 15,
                color: '#fff', cursor: activating ? 'wait' : 'pointer',
                border: '1px solid rgba(168,85,247,0.4)',
                background: activating ? 'rgba(168,85,247,0.4)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                boxShadow: activating ? 'none' : '0 8px 30px rgba(168,85,247,0.3)',
                transition: 'all 0.2s', marginBottom: 10,
              }}
              onMouseEnter={e => { if (!activating) e.currentTarget.style.boxShadow = '0 12px 40px rgba(168,85,247,0.5)' }}
              onMouseLeave={e => { if (!activating) e.currentTarget.style.boxShadow = '0 8px 30px rgba(168,85,247,0.3)' }}
            >
              {activating ? 'Activating...' : isSignedIn ? 'Activate Agent ✨' : 'Sign in to Activate'}
            </button>

            {!isSignedIn && (
              <p style={{ fontSize: 11, color: '#444466', textAlign: 'center', marginTop: 8 }}>
                Sign in with Google in one click
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
