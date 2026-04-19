// v3
import { useState } from 'react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function entrar() {
    if (!email || !password) { setError('Completá email y contraseña.'); return }
    setCargando(true)
    setError('')
    try {
      const res = await fetch('https://qfesxpcuhsrfdohnsleg.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'
        },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (data.access_token) {
        localStorage.setItem('admin_token', data.access_token)
        window.location.href = '/admin'
      } else {
        setError('Email o contraseña incorrectos.')
      }
    } catch(e) { setError('Error de conexión.') }
    setCargando(false)
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '2rem', width: '100%', maxWidth: '380px', margin: '1rem' }}>

        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ width: '52px', height: '52px', background: '#1B4F8A', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="28" height="28" viewBox="0 0 100 100">
              <polygon points="15,15 85,15 50,75" fill="#fff"/>
              <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
              <circle cx="50" cy="80" r="9" fill="#fff"/>
              <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
            </svg>
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B4F8A' }}>Pozero Agro</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Panel de administración</div>
        </div>

        {error && (
          <div style={{ background: '#fff0f0', border: '0.5px solid #ffcdd2', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#c62828', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com"
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Contraseña</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && entrar()}
            style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
        </div>

        <button onClick={entrar} disabled={cargando}
          style={{ width: '100%', padding: '11px', background: '#F26419', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '700' }}>
          {cargando ? 'Entrando...' : 'Entrar al panel'}
        </button>

      </div>
    </div>
  )
}
