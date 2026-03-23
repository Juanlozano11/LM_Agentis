import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_URL } from '../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AgentChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '¡Hola! Soy el General Agent con búsqueda web en tiempo real. ¿En qué puedo ayudarte? 🚀' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Ref para acumular texto del stream — evita duplicados por re-renders
  const streamBuffer = useRef('')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, searchQuery])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setLoading(true)
    setSearchQuery(null)
    streamBuffer.current = ''

    setMessages(prev => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ])

    try {
      const res = await fetch(`${API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId: 'test-user' }),
      })

      if (!res.ok) {
        const err = await res.json()
        setMessages(prev => {
          const n = [...prev]
          n[n.length - 1] = { ...n[n.length - 1], content: `❌ ${err.error}` }
          return n
        })
        setLoading(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue

          try {
            const event = JSON.parse(raw)

            if (event.type === 'text') {
              // Acumular en ref, luego SET (no +=) en el estado
              streamBuffer.current += event.text
              const snapshot = streamBuffer.current
              setMessages(prev => {
                const n = [...prev]
                n[n.length - 1] = { ...n[n.length - 1], content: snapshot }
                return n
              })
            } else if (event.type === 'search') {
              setSearchQuery(event.query)
            } else if (event.type === 'done') {
              setSearchQuery(null)
            } else if (event.type === 'error') {
              const snapshot = streamBuffer.current || `❌ ${event.error}`
              setMessages(prev => {
                const n = [...prev]
                n[n.length - 1] = { ...n[n.length - 1], content: snapshot }
                return n
              })
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages(prev => {
        const n = [...prev]
        n[n.length - 1] = { ...n[n.length - 1], content: `❌ ${e.message}` }
        return n
      })
    }

    setSearchQuery(null)
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ type: 'spring', damping: 24, stiffness: 300 }}
      style={{
        position: 'fixed', bottom: 90, right: 28, zIndex: 1000,
        width: 400, height: 560, borderRadius: 24,
        background: '#0d0d1e', border: '1px solid rgba(168,85,247,0.3)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(14,14,28,0.8)' }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff' }}>General Agent</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 5px #34d399', display: 'inline-block' }} />
            <span style={{ fontSize: 11, color: '#34d399' }}>Online · Claude Sonnet 4.5</span>
          </div>
        </div>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: '#555577', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 8 }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 26, height: 26, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>🤖</div>
            )}
            <div style={{
              maxWidth: '80%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.05)',
              border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
              color: '#f0f0ff', fontSize: 13, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content
                ? msg.content
                : (msg.role === 'assistant' && loading && i === messages.length - 1)
                  ? <span style={{ color: '#444466' }}>Pensando...</span>
                  : null}
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {searchQuery && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', alignSelf: 'flex-start' }}>
              <span style={{ fontSize: 13 }}>🔍</span>
              <span style={{ fontSize: 12, color: '#c084fc' }}>Buscando: <em>{searchQuery}</em></span>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '8px 10px 8px 14px' }}>
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Escribe un mensaje... (Enter para enviar)"
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#f0f0ff', fontSize: 13, lineHeight: 1.5, resize: 'none', fontFamily: 'inherit', maxHeight: 100, overflowY: 'auto' }}
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 100) + 'px' }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || loading}
            style={{ width: 32, height: 32, borderRadius: 9, border: 'none', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer', background: !input.trim() || loading ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: !input.trim() || loading ? '#333355' : '#fff', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}>↑</button>
        </div>
        <p style={{ fontSize: 10, color: '#1e1e30', textAlign: 'center', marginTop: 6 }}>2 créditos/msg · 5 créditos/búsqueda</p>
      </div>
    </motion.div>
  )
}
