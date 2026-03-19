import { Link, useLocation } from 'react-router-dom'

export function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(7,7,15,0.85)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      height: 60, display: 'flex', alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
          }}>🏢</div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#f0f0ff', letterSpacing: '-0.3px' }}>
            Agent<span style={{
              background: 'linear-gradient(135deg, #c084fc, #818cf8)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Office</span>
          </span>
        </Link>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { to: '/marketplace', label: 'Marketplace' },
            { to: '/dashboard', label: 'Dashboard' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.2s',
              color: pathname === to ? '#e0e0ff' : '#666688',
              background: pathname === to ? 'rgba(255,255,255,0.06)' : 'transparent',
            }}>{label}</Link>
          ))}
          <Link to="/marketplace" style={{
            marginLeft: 8, padding: '7px 18px', borderRadius: 10, fontSize: 13,
            fontWeight: 600, textDecoration: 'none', color: '#fff',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            border: '1px solid rgba(168,85,247,0.4)',
          }}>Get Started</Link>
        </div>
      </div>
    </nav>
  )
}
