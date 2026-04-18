import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'

async function apiFetch(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${token || ANON_KEY}`,
      'Prefer': 'return=representation',
      ...(options.headers || {})
    }
  })
  if (!res.ok) return []
  const text = await res.text()
  return text ? JSON.parse(text) : []
}

export default function AdminWrapper() {
  const [listo, setListo] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      window.location.href = '/login'
    } else {
      setListo(true)
    }
  }, [])

  if (!listo) return null
  return <Admin />
}

function Admin() {
  const [perforistas, setPerforistas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await apiFetch('perforistas?select=*&order=created_at.desc')
    setPerforistas(data)
    setCargando(false)
  }

  async function actualizar(id, campo, valor) {
    await apiFetch(`perforistas?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [campo]: valor })
    })
    setPerforistas(prev => prev.map(p => p.id === id ? { ...p, [campo]: valor } : p))
  }

  async function cambiarEstado(id, estado) {
    const extras = {}
    if (estado === 'cliente') extras.visible_whatsapp = true
    if (estado === 'pendiente') extras.visible_whatsapp = false
    await apiFetch(`perforistas?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, ...extras })
    })
    setPerforistas(prev => prev.map(p => p.id === id ? { ...p, estado, ...extras } : p))
  }

  function cerrarSesion() {
    localStorage.removeItem('admin_token')
    window.location.href = '/login'
  }

  function Toggle({ id, campo, valor }) {
    return (
      <div onClick={() => actualizar(id, campo, !valor)}
        style={{ width: '36px', height: '20px', borderRadius: '10px', background: valor ? '#1D9E75' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: valor ? '18px' : '2px', transition: 'left .2s' }} />
      </div>
    )
  }

  const filtrados = perforistas.filter(p => {
    const coincideFiltro = filtro === 'todos' || p.estado === filtro
    const coincideBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.localidad} ${p.provincia}`.toLowerCase().includes(busqueda.toLowerCase())
    return coincideFiltro && coincideBusqueda
  })

  const stats = {
    total: perforistas.length,
    pendientes: perforistas.filter(p => p.estado === 'pendiente').length,
    activos: perforistas.filter(p => p.estado === 'activo').length,
    clientes: perforistas.filter(p => p.estado === 'cliente').length,
  }

  const badgeColor = {
    pendiente: { bg: '#FAEEDA', color: '#633806' },
    activo: { bg: '#E6F1FB', color: '#0C447C' },
    cliente: { bg: '#E1F5EE', color: '#085041' },
    inactivo: { bg: '#f0f0f0', color: '#888' },
  }

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f0' }}>
      <div style={{ background: '#085041', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#E1F5EE' }}>Panel Admin — Pozeros Agro</div>
          <div style={{ fontSize: '12px', color: '#5DCAA5' }}>Gestioná perforistas y toggles de contacto</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '13px', color: '#9FE1CB', textDecoration: 'none' }}>← Ver directorio</a>
          <button onClick={cerrarSesion} style={{ fontSize: '13px', color: '#9FE1CB', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total', valor: stats.total, bg: '#fff' },
            { label: 'Pendientes', valor: stats.pendientes, bg: '#FAEEDA' },
            { label: 'Activos', valor: stats.activos, bg: '#E6F1FB' },
            { label: 'Clientes', valor: stats.clientes, bg: '#E1F5EE' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '8px', padding: '.75rem 1rem', border: '0.5px solid #e0e0d8' }}>
              <div style={{ fontSize: '22px', fontWeight: '600' }}>{s.valor}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <input type="text" placeholder="Buscar perforista..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
            style={{ padding: '7px 12px', border: '0.5px solid #ccc', borderRadius: '6px', fontSize: '13px', flex: 1, minWidth: '200px' }} />
          {['todos','pendiente','activo','cliente','inactivo'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              style={{ padding: '7px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: filtro === f ? '1px solid #1D9E75' : '0.5px solid #ccc', background: filtro === f ? '#E1F5EE' : '#fff', color: filtro === f ? '#085041' : '#666', fontWeight: filtro === f ? '500' : '400', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 70px 70px 70px 70px 70px 100px', padding: '.6rem 1rem', background: '#f5f5f0', fontSize: '11px', color: '#888', fontWeight: '500', borderBottom: '0.5px solid #e0e0d8' }}>
            <div>Perforista</div><div>Estado</div>
            <div style={{ textAlign: 'center' }}>Tel.</div>
            <div style={{ textAlign: 'center' }}>WA</div>
            <div style={{ textAlign: 'center' }}>IG</div>
            <div style={{ textAlign: 'center' }}>FB</div>
            <div style={{ textAlign: 'center' }}>Email</div>
            <div style={{ textAlign: 'center' }}>Prof.</div>
            <div>Acciones</div>
          </div>

          {cargando && <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando...</div>}
          {!cargando && filtrados.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No hay perforistas.</div>}

          {filtrados.map((p, i) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 80px 70px 70px 70px 70px 70px 100px', padding: '.65rem 1rem', alignItems: 'center', borderBottom: i < filtrados.length - 1 ? '0.5px solid #f0f0e8' : 'none', fontSize: '13px' }}>
              <div>
                <div style={{ fontWeight: '500' }}>{p.nombre} {p.apellido}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>{p.localidad}, {p.provincia}</div>
              </div>
              <div>
                <select value={p.estado || 'pendiente'} onChange={e => cambiarEstado(p.id, e.target.value)}
                  style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', border: '0.5px solid #ccc', background: badgeColor[p.estado]?.bg || '#f0f0f0', color: badgeColor[p.estado]?.color || '#666', fontWeight: '500' }}>
                  <option value="pendiente">Pendiente</option>
                  <option value="activo">Activo</option>
                  <option value="cliente">Cliente</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle id={p.id} campo="visible_telefono" valor={p.visible_telefono} /></div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle id={p.id} campo="visible_whatsapp" valor={p.visible_whatsapp} /></div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle id={p.id} campo="visible_instagram" valor={p.visible_instagram} /></div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle id={p.id} campo="visible_facebook" valor={p.visible_facebook} /></div>
              <div style={{ display: 'flex', justifyContent: 'center' }}><Toggle id={p.id} campo="visible_email" valor={p.visible_email} /></div>
              <div style={{ textAlign: 'center', color: '#666' }}>{p.profundidad_max ? `${p.profundidad_max}m` : '—'}</div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {p.telefono && <a href={`tel:${p.telefono}`} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#E1F5EE', color: '#085041', textDecoration: 'none' }}>📞</a>}
                {p.whatsapp && <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: '#EAF3DE', color: '#27500A', textDecoration: 'none' }}>WA</a>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '1rem' }}>
          {filtrados.length} perforistas · Al cambiar a "Cliente" el WhatsApp se activa automáticamente
        </div>
      </div>
    </div>
  )
}
