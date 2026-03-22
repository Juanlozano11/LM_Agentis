'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { GoogleWorkspaceConnect } from './GoogleWorkspaceConnect'

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser()
  const [showModal, setShowModal] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { setChecked(true); return }

    fetch(`/api/nango/check-connection?userId=${user.id}`)
      .then(r => r.json())
      .then(data => {
        setChecked(true)
        if (!data.connected) setShowModal(true)
      })
      .catch(() => setChecked(true))
  }, [isLoaded, user])

  // Mientras carga, muestra un splash mínimo
  if (!isLoaded || (user && !checked)) {
    return (
      <div style={{
        minHeight: '100vh', background: '#07070f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div style={{ color: '#333355', fontSize: 13 }}>Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {showModal && user && (
        <GoogleWorkspaceConnect
          userId={user.id}
          onConnected={() => setShowModal(false)}
        />
      )}
      {children}
    </>
  )
}
