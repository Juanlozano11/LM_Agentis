import { useState } from 'react'
import { motion } from 'framer-motion'
import { offices } from '../data/offices'
import { OfficeCard } from '../components/OfficeCard'

const CATS = ['All', 'Finance', 'Legal', 'Technology', 'Marketing', 'Healthcare', 'Operations']

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
            Browse AI <span className="gradient-text">Offices</span>
          </h1>
          <p style={{ fontSize: 14, color: '#555577' }}>
            {offices.length} offices · {offices.reduce((a, o) => a + o.agents.length, 0)} agents ready to deploy
          </p>
        </motion.div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search offices..."
            style={{
              padding: '10px 16px', borderRadius: 10, fontSize: 13, width: 240,
              background: 'rgba(14,14,28,0.9)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#f0f0ff', outline: 'none',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.4)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: cat === c ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.03)',
                color: cat === c ? '#c084fc' : '#555577',
                border: cat === c ? '1px solid rgba(168,85,247,0.35)' : '1px solid rgba(255,255,255,0.06)',
              }}>{c}</button>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#33334a', marginBottom: 20 }}>
          {filtered.length} {filtered.length === 1 ? 'office' : 'offices'} found
        </p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <p style={{ color: '#444466' }}>No offices match your search.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map((o, i) => <OfficeCard key={o.id} office={o} index={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
