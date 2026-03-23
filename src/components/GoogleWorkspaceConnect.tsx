import { useState } from 'react'
import Nango from '@nangohq/frontend'
import { API_URL } from '../lib/api'

const NEXT_API = API_URL || 'http://localhost:3002'

interface Props {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>
  onConnected: () => void
  onSkip?: () => void
}

export function GoogleWorkspaceConnect({ authFetch, onConnected, onSkip }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setLoading(true)
    setError(null)
    try {
      // 1. Pedir session token al backend
      const sessionRes = await authFetch(`${NEXT_API}/api/nango/create-session`, {
        method: 'POST',
      })
      if (!sessionRes.ok) {
        const e = await sessionRes.json()
        throw new Error(e.error || 'No se pudo crear sesión de Nango')
      }
      const { sessionToken } = await sessionRes.json()

      if (!sessionToken) throw new Error('No se recibió session token de Nango')

      // 2. Abrir popup — usar public key como fallback si no hay session token
      const nango = new Nango({ connectSessionToken: sessionToken })
      const result = await nango.auth('google')

      // 3. Guardar connectionId en backend
      await authFetch(`${NEXT_API}/api/nango/save-connection`, {
        method: 'POST',
        body: JSON.stringify({ connectionId: result.connectionId }),
      })

      onConnected()
    } catch (err: any) {
      // User closed popup — treat as skip
      if (err?.type === 'windowClosed' || err?.message?.includes('closed')) {
        onSkip?.()
        return
      }
      setError(err?.message || 'Error al conectar con Google Workspace')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24,
    }}>
      <div style={{
        background: '#0d0d1e',
        border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: 24, padding: '40px 36px',
        maxWidth: 460, width: '100%', textAlign: 'center',
        boxShadow: '0 0 80px rgba(168,85,247,0.1)',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: 'linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px',
          boxShadow: '0 0 30px rgba(66,133,244,0.3)',
        }}>G</div>

        <h2 style={{ color: '#f0f0ff', fontSize: 22, fontWeight: 800, marginBottom: 10, letterSpacing: '-0.5px' }}>
          Conecta Google Workspace
        </h2>
        <p style={{ color: '#777799', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Tu agente necesita acceso a Gmail, Google Docs, Calendar, Drive y Sheets para trabajar por ti. Solo te lo pedimos una vez.
        </p>

        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'left',
        }}>
          {[
            ['📧', 'Gmail', 'Leer y responder emails'],
            ['📄', 'Docs', 'Crear documentos'],
            ['📊', 'Sheets', 'Crear hojas de cálculo'],
            ['📅', 'Calendar', 'Crear y ver eventos'],
            ['💾', 'Drive', 'Buscar archivos'],
          ].map(([icon, name, desc]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '7px 0' }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <div>
                <span style={{ color: '#c0c0dd', fontSize: 13, fontWeight: 600 }}>{name}</span>
                <span style={{ color: '#555577', fontSize: 12, marginLeft: 8 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 16,
            color: '#f87171', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none',
            background: loading ? 'rgba(66,133,244,0.4)' : 'linear-gradient(135deg, #4285f4, #34a853)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', marginBottom: 12,
          }}
        >
          {loading ? 'Conectando...' : '🚀 Conectar Google Workspace'}
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            style={{
              background: 'none', border: 'none', color: '#444466',
              fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            Conectar más tarde
          </button>
        )}
      </div>
    </div>
  )
}
