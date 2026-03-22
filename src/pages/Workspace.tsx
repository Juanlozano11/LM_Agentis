import { useState, useRef, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useUser } from '@clerk/clerk-react'
import { useAuthFetch } from '../lib/api'

const HomeOfficeViewer3D = lazy(() => import('../components/HomeOfficeViewer3D').then(m => ({ default: m.HomeOfficeViewer3D })))

const AGENTS: Record<string, { name: string; emoji: string; color: string; role: string }> = {
  general: { name: 'General Agent', emoji: '🤖', color: '#a855f7', role: 'Personal AI Assistant' },
}

interface Message { role: 'user' | 'assistant'; content: string }

function ChatPanel({ userId, agentColor, authFetch }: { userId: string; agentColor: string; authFetch: (url: string, opts?: RequestInit) => Promise<Response> }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Estoy listo para ayudarte. Puedo buscar información en internet, responder preguntas, ayudarte a escribir o analizar datos. ¿En qué trabajamos hoy? 🚀' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const streamBuffer = useRef('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, searchQuery])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setLoading(true); setSearchQuery(null); streamBuffer.current = ''
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }])

    try {
      const res = await authFetch('/api/agent', {
        method: 'POST',
        body: JSON.stringify({ message: text, userId }),
      })
      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: `❌ ${err.error}` }; return n })
        setLoading(false); return
      }
      const reader = res.body!.getReader(); const decoder = new TextDecoder(); let buf = ''
      while (true) {
        const { done, value } = await reader.read(); if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim(); if (!raw) continue
          try {
            const ev = JSON.parse(raw)
            if (ev.type === 'text') {
              streamBuffer.current += ev.text; const snap = streamBuffer.current
              setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: snap }; return n })
            } else if (ev.type === 'search') { setSearchQuery(ev.query)
            } else if (ev.type === 'done') { setSearchQuery(null)
            } else if (ev.type === 'error') {
              setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: `❌ ${ev.error}` }; return n })
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => { const n = [...prev]; n[n.length-1] = { ...n[n.length-1], content: `❌ ${e.message}` }; return n })
    }
    setSearchQuery(null); setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#07070f' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 28, height: 28, borderRadius: 9, background: `linear-gradient(135deg, ${agentColor}aa, ${agentColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '78%', padding: '11px 15px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? `linear-gradient(135deg, ${agentColor}cc, ${agentColor})` : 'rgba(255,255,255,0.04)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
              color: '#f0f0ff', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content || (msg.role === 'assistant' && loading && i === messages.length - 1
                ? <span style={{ color: '#444466' }}>Thinking...</span> : null)}
            </div>
          </motion.div>
        ))}
        <AnimatePresence>
          {searchQuery && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 13px', borderRadius: 10, background: `${agentColor}10`, border: `1px solid ${agentColor}25`, alignSelf: 'flex-start' }}>
              <span>🔍</span>
              <span style={{ fontSize: 12, color: agentColor }}>Searching: <em>{searchQuery}</em></span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '10px 12px 10px 16px' }}>
          <textarea
            ref={textareaRef}
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0f0ff', fontSize: 14, lineHeight: 1.5, resize: 'none', fontFamily: 'inherit', maxHeight: 140, overflowY: 'auto' }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            style={{ width: 38, height: 38, borderRadius: 11, border: 'none', flexShrink: 0, cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', background: !input.trim() || loading ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${agentColor}cc, ${agentColor})`, color: !input.trim() || loading ? '#333355' : '#fff', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>↑</button>
        </div>
        <p style={{ fontSize: 11, color: '#1e1e30', textAlign: 'center', marginTop: 8 }}>2 credits/msg · 5 credits/web search</p>
      </div>
    </div>
  )
}

export function Workspace() {
  const { agentId } = useParams<{ agentId: string }>()
  const navigate = useNavigate()
  const { user } = useUser()
  const authFetch = useAuthFetch()
  const [credits, setCredits] = useState<number | null>(null)

  const agent = AGENTS[agentId ?? '']

  useEffect(() => {
    authFetch('/api/dashboard')
      .then(r => r.json())
      .then(d => setCredits(d.credits))
      .catch(() => {})
  }, [])

  if (!agent) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
        <p style={{ color: '#666688', marginBottom: 20 }}>Agent not found.</p>
        <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', borderRadius: 10, background: 'rgba(168,85,247,0.2)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)', cursor: 'pointer', fontSize: 14 }}>← Dashboard</button>
      </div>
    </div>
  )

  const userId = user?.id ?? 'anonymous'

  return (
    <div style={{ background: '#07070f', height: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 60 }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(7,7,15,0.9)', flexShrink: 0 }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
          onMouseEnter={e => e.currentTarget.style.color = '#8888aa'}
          onMouseLeave={e => e.currentTarget.style.color = '#444466'}>
          ← Dashboard
        </button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ width: 36, height: 36, borderRadius: 11, background: `linear-gradient(135deg, ${agent.color}aa, ${agent.color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{agent.emoji}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>{agent.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#34d399' }}>Active · Claude Sonnet 4.5</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {/* Credits */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <span style={{ fontSize: 12, color: '#555577' }}>Credits:</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>{credits ?? '—'}</span>
        </div>
        {/* User avatar */}
        {user?.imageUrl && (
          <img src={user.imageUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${agent.color}44` }} />
        )}
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* LEFT: 3D home office */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
          <Suspense fallback={
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07070f' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
                <p style={{ color: '#333355', fontSize: 12 }}>Loading workspace...</p>
              </div>
            </div>
          }>
            <HomeOfficeViewer3D color={agent.color} active={true} />
          </Suspense>
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', padding: '5px 14px', borderRadius: 99, fontSize: 11, whiteSpace: 'nowrap', background: 'rgba(0,0,0,0.6)', color: '#444466', border: '1px solid rgba(255,255,255,0.06)', pointerEvents: 'none' }}>
            Drag · Zoom
          </div>
        </div>

        {/* RIGHT: Chat */}
        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatPanel userId={userId} agentColor={agent.color} authFetch={authFetch} />
        </div>
      </div>
    </div>
  )
}
