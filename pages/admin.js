// v6 — con pestaña Contactos
import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'

async function apiFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
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
  const [tab, setTab] = useState('perforistas')
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
          <div style={{ fontSize: '12px', color: '#5DCAA5' }}>Gestioná perforistas, publicidades y contactos</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="/" style={{ fontSize: '13px', color: '#9FE1CB', textDecoration: 'none' }}>← Ver directorio</a>
          <button onClick={cerrarSesion} style={{ fontSize: '13px', color: '#9FE1CB', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cerrar sesión</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderBottom: '0.5px solid #e0e0d8', padding: '0 1.5rem', display: 'flex', gap: '0' }}>
        {[
          { key: 'perforistas', label: '👷 Perforistas' },
          { key: 'publicidad',  label: '📢 Publicidad' },
          { key: 'contactos',   label: '📬 Contactos' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '12px 20px', fontSize: '13px', fontWeight: tab === t.key ? '600' : '400',
              color: tab === t.key ? '#085041' : '#888',
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #085041' : '2px solid transparent',
              marginBottom: '-0.5px'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>

        {tab === 'perforistas' && (
          <>
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
          </>
        )}

        {tab === 'publicidad' && <TabPublicidad />}
        {tab === 'contactos' && <TabContactos />}

      </div>
    </div>
  )
}

// ── TAB CONTACTOS ──
function TabContactos() {
  const [contactos, setContactos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const data = await apiFetch('contactos?select=*&order=created_at.desc')
    setContactos(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  async function marcarLeido(id, leido) {
    await apiFetch(`contactos?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ leido })
    })
    setContactos(prev => prev.map(c => c.id === id ? { ...c, leido } : c))
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este contacto?')) return
    await apiFetch(`contactos?id=eq.${id}`, { method: 'DELETE' })
    setContactos(prev => prev.filter(c => c.id !== id))
    if (expandido === id) setExpandido(null)
  }

  const tipoLabel = {
    productor: '🌾 Productor',
    perforista: '⛏️ Perforista',
    empresa: '🏢 Empresa',
    persona: '👤 Persona',
  }

  const filtrados = contactos.filter(c => {
    if (filtro === 'no_leidos') return !c.leido
    if (filtro === 'leidos') return c.leido
    return true
  })

  const noLeidos = contactos.filter(c => !c.leido).length

  return (
    <div>
      {/* Stats y filtros */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'todos', label: `Todos (${contactos.length})` },
            { key: 'no_leidos', label: `No leídos (${noLeidos})` },
            { key: 'leidos', label: `Leídos (${contactos.length - noLeidos})` },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', border: filtro === f.key ? '1px solid #085041' : '0.5px solid #ccc', background: filtro === f.key ? '#E1F5EE' : '#fff', color: filtro === f.key ? '#085041' : '#666', fontWeight: filtro === f.key ? '600' : '400' }}>
              {f.label}
            </button>
          ))}
        </div>
        {noLeidos > 0 && (
          <span style={{ fontSize: '12px', color: '#085041', fontWeight: '600' }}>
            {noLeidos} mensaje{noLeidos !== 1 ? 's' : ''} sin leer
          </span>
        )}
      </div>

      {cargando && <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando...</div>}

      {!cargando && filtrados.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8' }}>
          No hay contactos {filtro !== 'todos' ? 'en esta categoría' : 'todavía'}.
        </div>
      )}

      {filtrados.map(c => (
        <div key={c.id} style={{
          background: '#fff', borderRadius: '10px',
          border: `0.5px solid ${!c.leido ? '#085041' : '#e0e0d8'}`,
          marginBottom: '8px', overflow: 'hidden'
        }}>
          {/* Fila resumen */}
          <div
            onClick={() => {
              setExpandido(expandido === c.id ? null : c.id)
              if (!c.leido) marcarLeido(c.id, true)
            }}
            style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexWrap: 'wrap' }}
          >
            {/* Indicador no leído */}
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: !c.leido ? '#085041' : '#e0e0e0', flexShrink: 0 }} />

            {/* Tipo */}
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#666', flexShrink: 0 }}>
              {tipoLabel[c.tipo] || c.tipo}
            </span>

            {/* Nombre */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: !c.leido ? '600' : '500', fontSize: '13px', color: '#1a1a2e' }}>
                {c.nombre} {c.apellido}
              </div>
              <div style={{ fontSize: '11px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.mensaje}
              </div>
            </div>

            {/* Fecha */}
            <div style={{ fontSize: '11px', color: '#aaa', flexShrink: 0 }}>
              {new Date(c.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>

            {/* Flecha */}
            <span style={{ fontSize: '12px', color: '#aaa', flexShrink: 0 }}>
              {expandido === c.id ? '▲' : '▼'}
            </span>
          </div>

          {/* Detalle expandido */}
          {expandido === c.id && (
            <div style={{ padding: '0 16px 16px', borderTop: '0.5px solid #f0f0f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', marginBottom: '12px' }}>
                <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>EMAIL</div>
                  <a href={`mailto:${c.email}`} style={{ fontSize: '13px', color: '#1B4F8A', textDecoration: 'none', fontWeight: '500' }}>{c.email}</a>
                </div>
                <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '8px 12px' }}>
                  <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>WHATSAPP</div>
                  <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: '13px', color: '#25D366', textDecoration: 'none', fontWeight: '500' }}>{c.whatsapp}</a>
                </div>
                {c.dni && (
                  <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '8px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '2px' }}>DNI</div>
                    <div style={{ fontSize: '13px', color: '#333' }}>{c.dni}</div>
                  </div>
                )}
              </div>

              <div style={{ background: '#f8f9fa', borderRadius: '6px', padding: '10px 12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '4px' }}>MENSAJE</div>
                <div style={{ fontSize: '13px', color: '#333', lineHeight: '1.6' }}>{c.mensaje}</div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a href={`https://mail.google.com/mail/?view=cm&to=${c.email}&su=Re: Contacto desde Pozero Agro&from=contacto@pozeroagro.ar`}
                  style={{ padding: '6px 14px', background: '#1B4F8A', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                  ✉️ Responder por email
                </a>
                <a href={`https://wa.me/${c.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Hola! Te contactamos desde Pozero Agro.')}`}
                  target="_blank" rel="noreferrer"
                  style={{ padding: '6px 14px', background: '#25D366', color: '#fff', borderRadius: '6px', textDecoration: 'none', fontSize: '12px', fontWeight: '600' }}>
                  💬 WhatsApp
                </a>
                <button onClick={() => marcarLeido(c.id, !c.leido)}
                  style={{ padding: '6px 14px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                  {c.leido ? 'Marcar no leído' : 'Marcar leído'}
                </button>
                <button onClick={() => eliminar(c.id)}
                  style={{ padding: '6px 14px', background: '#fef2f2', color: '#b91c1c', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', marginLeft: 'auto' }}>
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const SLOTS = [
  { id: 'listado_mid',    label: 'Después de fila 1 (entre perforistas)' },
  { id: 'listado_bottom', label: 'Al final del listado' },
  { id: 'debajo_mapa',    label: 'Debajo del mapa (desktop)' },
  { id: 'footer_top',     label: 'Sobre el footer' },
]

const AD_TYPES = [
  { value: 'febecos', label: 'Solución recomendada (Febecos)' },
  { value: 'propio',  label: 'Contenido propio' },
  { value: 'tercero', label: 'Publicidad de tercero' },
]

const EMPTY_FORM = {
  nombre: '', ad_type: 'febecos', slot_id: 'listado_mid',
  cta_url: '', cta_texto: '', imagen_url: '',
  fecha_inicio: '', fecha_fin: '', max_impresiones: '',
  activo: false,
}

function TabPublicidad() {
  const [campanas, setCampanas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => { cargarCampanas() }, [])

  async function cargarCampanas() {
    setCargando(true)
    const data = await apiFetch('ad_campaigns?select=*&order=created_at.desc')
    setCampanas(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  async function toggleActivo(camp) {
    const nuevoValor = !camp.activo
    await apiFetch(`ad_campaigns?id=eq.${camp.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ activo: nuevoValor })
    })
    setCampanas(prev => prev.map(c => c.id === camp.id ? { ...c, activo: nuevoValor } : c))
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar esta campaña?')) return
    await apiFetch(`ad_campaigns?id=eq.${id}`, { method: 'DELETE' })
    setCampanas(prev => prev.filter(c => c.id !== id))
  }

  function editar(camp) {
    setForm({
      nombre: camp.nombre || '',
      ad_type: camp.ad_type || 'febecos',
      slot_id: camp.slot_id || 'listado_mid',
      cta_url: camp.cta_url || '',
      cta_texto: camp.cta_texto || '',
      imagen_url: camp.imagen_url || '',
      fecha_inicio: camp.fecha_inicio ? camp.fecha_inicio.slice(0,10) : '',
      fecha_fin: camp.fecha_fin ? camp.fecha_fin.slice(0,10) : '',
      max_impresiones: camp.max_impresiones || '',
      activo: camp.activo || false,
    })
    setEditandoId(camp.id)
    setMostrarForm(true)
  }

  function nuevaCampana() {
    setForm(EMPTY_FORM)
    setEditandoId(null)
    setMostrarForm(true)
  }

  async function guardar() {
    if (!form.nombre || !form.cta_url) {
      setMsg('Nombre y URL destino son obligatorios.')
      return
    }
    setGuardando(true)
    setMsg('')

    const payload = {
      nombre: form.nombre,
      ad_type: form.ad_type,
      slot_id: form.slot_id,
      cta_url: form.cta_url,
      cta_texto: form.cta_texto || 'Ver más',
      imagen_url: form.imagen_url || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      max_impresiones: form.max_impresiones ? parseInt(form.max_impresiones) : null,
      activo: form.activo,
    }

    if (editandoId) {
      await apiFetch(`ad_campaigns?id=eq.${editandoId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      })
    } else {
      await apiFetch('ad_campaigns', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
    }

    await cargarCampanas()
    setMostrarForm(false)
    setEditandoId(null)
    setForm(EMPTY_FORM)
    setGuardando(false)
  }

  const slotLabel = id => SLOTS.find(s => s.id === id)?.label || id
  const typeLabel = t => AD_TYPES.find(a => a.value === t)?.label || t

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '13px', color: '#666' }}>
          {campanas.length} campaña{campanas.length !== 1 ? 's' : ''} registrada{campanas.length !== 1 ? 's' : ''}
        </div>
        <button onClick={nuevaCampana}
          style={{ padding: '8px 18px', background: '#085041', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
          + Nueva campaña
        </button>
      </div>

      {mostrarForm && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '1rem' }}>
            {editandoId ? 'Editar campaña' : 'Nueva campaña'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nombre de la campaña *</label>
              <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Kits solares Febecos — Q2 2026" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={form.ad_type} onChange={e => setForm(f => ({ ...f, ad_type: e.target.value }))} style={inputStyle}>
                {AD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Ubicación (slot)</label>
              <select value={form.slot_id} onChange={e => setForm(f => ({ ...f, slot_id: e.target.value }))} style={inputStyle}>
                {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>URL destino (al hacer clic) *</label>
              <input value={form.cta_url} onChange={e => setForm(f => ({ ...f, cta_url: e.target.value }))}
                placeholder="https://febecos.mitiendanube.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Texto del botón</label>
              <input value={form.cta_texto} onChange={e => setForm(f => ({ ...f, cta_texto: e.target.value }))}
                placeholder="Ver más" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>URL de imagen (opcional)</label>
              <input value={form.imagen_url} onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))}
                placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fecha inicio (opcional)</label>
              <input type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fecha fin (opcional)</label>
              <input type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Máx. impresiones (opcional)</label>
              <input type="number" value={form.max_impresiones} onChange={e => setForm(f => ({ ...f, max_impresiones: e.target.value }))}
                placeholder="Sin límite" style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '20px' }}>
              <div onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                style={{ width: '36px', height: '20px', borderRadius: '10px', background: form.activo ? '#1D9E75' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: form.activo ? '18px' : '2px', transition: 'left .2s' }} />
              </div>
              <span style={{ fontSize: '13px', color: '#444' }}>Activa al guardar</span>
            </div>
          </div>
          {msg && <div style={{ marginTop: '10px', fontSize: '12px', color: '#c0392b' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
            <button onClick={guardar} disabled={guardando}
              style={{ padding: '8px 20px', background: '#085041', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: guardando ? 0.6 : 1 }}>
              {guardando ? 'Guardando...' : 'Guardar campaña'}
            </button>
            <button onClick={() => { setMostrarForm(false); setEditandoId(null); setForm(EMPTY_FORM) }}
              style={{ padding: '8px 16px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando && <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Cargando...</div>}

      {!cargando && campanas.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#aaa', background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8' }}>
          No hay campañas. Creá la primera con el botón de arriba.
        </div>
      )}

      {campanas.map(c => (
        <div key={c.id} style={{ background: '#fff', borderRadius: '10px', border: '0.5px solid #e0e0d8', padding: '12px 16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div onClick={() => toggleActivo(c)}
            style={{ width: '36px', height: '20px', borderRadius: '10px', background: c.activo ? '#1D9E75' : '#ccc', position: 'relative', cursor: 'pointer', transition: 'background .2s', flexShrink: 0 }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '2px', left: c.activo ? '18px' : '2px', transition: 'left .2s' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a2e' }}>{c.nombre}</div>
            <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
              {slotLabel(c.slot_id)} · {typeLabel(c.ad_type)}
              {c.impresiones > 0 && ` · ${c.impresiones} impresiones`}
              {c.fecha_fin && ` · Vence ${c.fecha_fin.slice(0,10)}`}
            </div>
          </div>
          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', background: c.activo ? '#E1F5EE' : '#f0f0f0', color: c.activo ? '#085041' : '#888', flexShrink: 0 }}>
            {c.activo ? 'ACTIVA' : 'INACTIVA'}
          </span>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => editar(c)}
              style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', background: '#E6F1FB', color: '#0C447C', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              Editar
            </button>
            <button onClick={() => eliminar(c.id)}
              style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '4px', background: '#fef2f2', color: '#b91c1c', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#666', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px'
}

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '0.5px solid #ccc',
  borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box', color: '#333'
}
