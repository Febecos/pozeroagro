import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'

export default function Directorio() {
  const [perforistas, setPerforistas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [provincia, setProvincia] = useState('')
  const [cargando, setCargando] = useState(true)

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/perforistas?select=*&estado=in.(activo,cliente)&order=created_at.desc`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const data = await res.json()
    setPerforistas(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  const filtrados = perforistas.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.localidad}`.toLowerCase().includes(q)
    const coincideProvincia = !provincia || p.provincia === provincia
    return coincideBusqueda && coincideProvincia
  })

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* HEADER */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 100 100">
              <polygon points="15,15 85,15 50,75" fill="#fff"/>
              <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
              <circle cx="50" cy="80" r="9" fill="#fff"/>
              <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Pozero Agro</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>Directorio Nacional</div>
          </div>
        </div>
        <a href="/registrarme" style={{ background: '#F26419', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
          Registrarme gratis
        </a>
      </div>

      {/* HERO BÚSQUEDA */}
      <div style={{ background: '#1B4F8A', padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '16px', color: '#fff', fontWeight: '600', marginBottom: '12px' }}>
          Encontrá un perforista rural en tu zona
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o localidad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '9px 12px', borderRadius: '6px', border: '1.5px solid rgba(255,255,255,0.5)', fontSize: '14px', background: 'rgba(255,255,255,0.12)', color: '#fff' }}
          />
          <select
            value={provincia}
            onChange={e => setProvincia(e.target.value)}
            style={{ padding: '9px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', minWidth: '160px', background: 'rgba(255,255,255,0.15)', color: '#fff' }}
          >
            <option value="">Todas las provincias</option>
            {provincias.map(p => <option key={p} style={{ color: '#333' }}>{p}</option>)}
          </select>
          <button
            onClick={() => {}}
            style={{ padding: '9px 20px', background: '#F26419', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            Buscar
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
          {cargando ? 'Cargando...' : `${filtrados.length} perforistas encontrados`}
        </div>

        {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando directorio...</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtrados.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '12px', border: p.estado === 'cliente' ? '1.5px solid #1B4F8A' : '0.5px solid #e0e0e8', padding: '1rem 1.25rem' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px', color: '#1B4F8A', flexShrink: 0 }}>
                  {p.nombre?.[0]}{p.apellido?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.localidad} · {p.provincia}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {p.estado === 'cliente' && (
                  <span style={{ fontSize: '11px', background: '#e8f0fa', color: '#1B4F8A', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>✓ Verificado Febecos</span>
                )}
                {p.conoce_solar === 'Sí, ya instalé sistemas solares' && (
                  <span style={{ fontSize: '11px', background: '#fff3e0', color: '#E65100', padding: '2px 8px', borderRadius: '4px' }}>Instala solar</span>
                )}
                {p.profundidad_max && (
                  <span style={{ fontSize: '11px', background: '#f3e8ff', color: '#6a0dad', padding: '2px 8px', borderRadius: '4px' }}>{p.profundidad_max}m máx</span>
                )}
              </div>

              {p.servicios && p.servicios.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {p.servicios.slice(0, 3).map(s => (
                    <span key={s} style={{ fontSize: '11px', background: '#f5f5f5', color: '#666', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                {p.visible_telefono && p.telefono && (
                  <a href={`tel:${p.telefono}`} style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '0.5px solid #1B4F8A', background: '#e8f0fa', color: '#1B4F8A', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}>
                    📞 Llamar
                  </a>
                )}
                {p.visible_whatsapp && p.whatsapp ? (
                  <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ flex: 1, padding: '7px', borderRadius: '6px', background: '#25D366', color: '#fff', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}>
                    WhatsApp
                  </a>
                ) : p.visible_whatsapp === false ? (
                  <div style={{ flex: 1, padding: '7px', borderRadius: '6px', background: '#f0f0f0', color: '#aaa', fontSize: '12px', textAlign: 'center' }}>
                    WA 🔒
                  </div>
                ) : null}
              </div>

            </div>
          ))}
        </div>

        {!cargando && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            No se encontraron perforistas para esa búsqueda.
          </div>
        )}
      </div>

      {/* FOOTER FEBECOS */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>¿Necesitás equipar tu pozo con energía solar?</div>
        <a href="https://febecos.mitiendanube.com" target="_blank" rel="noreferrer"
          style={{ background: '#F26419', color: '#fff', padding: '9px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
          Ver kits Febecos →
        </a>
      </div>

    </div>
  )
}
