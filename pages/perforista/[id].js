import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const SUPABASE_URL = 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'

export default function PerfilPerforista() {
  const router = useRouter()
  const { id } = router.query

  const [p, setP] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [comentarios, setComentarios] = useState([])
  const [usuario, setUsuario] = useState(null)
  const [emailMagic, setEmailMagic] = useState('')
  const [enviandoMagic, setEnviandoMagic] = useState(false)
  const [magicEnviado, setMagicEnviado] = useState(false)
  const [miRating, setMiRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comentario, setComentario] = useState('')
  const [aceptoTC, setAceptoTC] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')

  useEffect(() => {
    if (!id) return
    cargar()
    cargarComentarios()
    verificarSesion()
  }, [id])

  async function verificarSesion() {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.includes('access_token')) return
    const params = new URLSearchParams(hash.replace('#', ''))
    const token = params.get('access_token')
    if (!token) return
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.email) {
        setUsuario({ email: data.email, token })
        window.history.replaceState({}, '', window.location.pathname)
      }
    } catch (e) {}
  }

  async function cargar() {
    setCargando(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/perforistas?id=eq.${id}&select=*`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      setP(Array.isArray(data) && data[0] ? data[0] : null)
    } catch (e) {}
    setCargando(false)
  }

  async function cargarComentarios() {
    try {
      // Solo trae comentarios en estado 'publicado' (RLS lo garantiza, este filtro es doble seguro)
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comentarios?perforista_id=eq.${id}&estado=eq.publicado&order=created_at.desc`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      setComentarios(Array.isArray(data) ? data : [])
    } catch (e) {}
  }

  async function enviarMagicLink() {
    if (!emailMagic) return
    setEnviandoMagic(true)
    setErrorEnvio('')
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailMagic,
          options: { emailRedirectTo: `${window.location.origin}/perforista/${id}` }
        })
      })
      if (res.ok) {
        setMagicEnviado(true)
      } else {
        setErrorEnvio('No se pudo enviar el email. Intentá de nuevo.')
      }
    } catch (e) {
      setErrorEnvio('Error de red. Intentá de nuevo.')
    }
    setEnviandoMagic(false)
  }

  async function registrarAceptacionComentarista() {
    try {
      const docRes = await fetch(
        `${SUPABASE_URL}/rest/v1/legal_documentos?tipo=eq.terminos&activo=eq.true&select=id,version`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const docs = await docRes.json()
      const doc = Array.isArray(docs) && docs[0] ? docs[0] : null
      if (!doc) return
      await fetch(`${SUPABASE_URL}/rest/v1/legal_aceptaciones`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          documento_id: doc.id,
          tipo_actor: 'comentarista',
          email: usuario?.email || emailMagic,
          metodo: 'checkbox',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          session_token: typeof crypto !== 'undefined' ? crypto.randomUUID() : null
        })
      })
    } catch (e) {
      console.warn('No se pudo registrar aceptación comentarista:', e.message)
    }
  }

  async function enviarComentario() {
    if (!miRating) { setErrorEnvio('Por favor seleccioná una puntuación'); return }
    if (!usuario) { setErrorEnvio('Necesitás verificar tu email primero'); return }
    if (!aceptoTC) { setErrorEnvio('Debés aceptar los Términos y Condiciones para comentar'); return }

    setEnviando(true)
    setErrorEnvio('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/comentarios`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${usuario.token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          perforista_id: id,
          estrellas: miRating,
          comentario,
          nombre_cliente: usuario.email,
          email_verificado: usuario.email,
          estado: 'publicado',
          ip_address: null
        })
      })
      if (res.ok || res.status === 201) {
        // Registrar aceptación legal del comentarista
        await registrarAceptacionComentarista()
        setEnviado(true)
        setMiRating(0)
        setComentario('')
        setAceptoTC(false)
        cargarComentarios()
      } else {
        setErrorEnvio('Hubo un error al enviar. Intentá de nuevo.')
      }
    } catch (e) {
      setErrorEnvio('Error de red. Intentá de nuevo.')
    }
    setEnviando(false)
  }

  function whatsappNum(perf) {
    const num = perf.whatsapp || perf.telefono || ''
    return num.replace(/\D/g, '')
  }

  function promedioEstrellas() {
    if (!comentarios.length) return 0
    return comentarios.reduce((a, b) => a + b.estrellas, 0) / comentarios.length
  }

  function EstrellasDisplay({ valor, size = 20 }) {
    const llenas = Math.round(valor)
    return (
      <span style={{ fontSize: size, color: '#F5A623', letterSpacing: 2 }}>
        {'★'.repeat(llenas)}{'☆'.repeat(5 - llenas)}
      </span>
    )
  }

  // ─── ESTADOS DE CARGA ────────────────────────────────────────────────────────
  if (cargando) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      Cargando perfil...
    </div>
  )

  if (!p) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ fontSize: '18px', color: '#888' }}>Perforista no encontrado</div>
      <button onClick={() => router.push('/')} style={{ padding: '8px 20px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>← Volver</button>
    </div>
  )

  const wa = whatsappNum(p)
  const promedio = promedioEstrellas()
  const esValidado = p.estado === 'cliente'

  // ─── RENDER PRINCIPAL ────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* HEADER */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => router.push('/')}>
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
        <button onClick={() => router.push('/')}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
          ← Volver
        </button>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ── TARJETA PRINCIPAL ── */}
        <div style={{ background: '#fff', borderRadius: '16px', border: esValidado ? '2px solid #1B4F8A' : '1px solid #e0e0e8', padding: '1.5rem', marginBottom: '16px' }}>

          {/* Avatar + nombre + insignia */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '22px', color: '#1B4F8A', flexShrink: 0 }}>
              {p.nombre?.[0]}{p.apellido?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{p.nombre} {p.apellido}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>📍 {p.localidad} · {p.provincia}</div>

              {/* Estrellas promedio */}
              {comentarios.length > 0 && (
                <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <EstrellasDisplay valor={promedio} size={16} />
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    {promedio.toFixed(1)} ({comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'})
                  </span>
                </div>
              )}

              {/* Badges */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                {esValidado && (
                  <span style={{
                    fontSize: '12px',
                    background: 'linear-gradient(135deg, #F5A623, #F0C040)',
                    color: '#fff', padding: '4px 10px', borderRadius: '5px',
                    fontWeight: '700', boxShadow: '0 2px 6px rgba(245,166,35,0.4)'
                  }}>
                    ★ Perforista Validado
                  </span>
                )}
                {p.conoce_solar === 'Sí, ya instalé sistemas solares' && (
                  <span style={{ fontSize: '11px', background: '#fff3e0', color: '#E65100', padding: '3px 8px', borderRadius: '4px' }}>☀️ Instala solar</span>
                )}
                {p.quiere_info_equipos && (
                  <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>🔧 Interesado en equipos</span>
                )}
              </div>

              {/* Aviso insignia — cumplimiento legal */}
              {esValidado && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa', lineHeight: '1.4' }}>
                  La insignia indica revisión interna básica de datos. No implica certificación técnica ni garantía de calidad.{' '}
                  <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A' }}>Ver términos</a>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          {p.descripcion && (
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#444', lineHeight: '1.6' }}>
              {p.descripcion}
            </div>
          )}

          {/* Datos técnicos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {p.experiencia && <Dato icono="🗓️" label="Experiencia" valor={p.experiencia} />}
            {p.tipo_empresa && <Dato icono="🏢" label="Tipo de empresa" valor={p.tipo_empresa} />}
            {p.profundidad_max && <Dato icono="⬇️" label="Profundidad máx." valor={`${p.profundidad_max} metros`} />}
            {p.trabajos_por_mes && <Dato icono="📊" label="Trabajos por mes" valor={p.trabajos_por_mes} />}
          </div>

          {/* Tags */}
          {p.servicios?.length > 0 && <TagGroup label="Servicios" items={p.servicios} color="#e8f0fa" textColor="#1B4F8A" />}
          {p.diametros?.length > 0 && <TagGroup label="Diámetros" items={p.diametros} color="#f3e8ff" textColor="#6a0dad" />}
          {p.terrenos?.length > 0 && <TagGroup label="Tipos de terreno" items={p.terrenos} color="#f0fdf4" textColor="#166534" />}
          {p.tipo_bomba?.length > 0 && <TagGroup label="Tipos de bomba" items={p.tipo_bomba} color="#fff3e0" textColor="#E65100" />}
          {p.zonas_trabajo?.length > 0 && <TagGroup label="Zonas de trabajo" items={p.zonas_trabajo} color="#fef3c7" textColor="#92400e" />}

          {/* Contacto */}
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contacto</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {p.visible_telefono && p.telefono && (
                <a href={`tel:${p.telefono}`} style={btnStyle('#e8f0fa', '#1B4F8A', '1px solid #1B4F8A')}>📞 {p.telefono}</a>
              )}
              {wa && (
                <a href={`https://wa.me/${wa}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}`}
                  target="_blank" rel="noreferrer" style={btnStyle('#25D366', '#fff')}>
                  💬 WhatsApp
                </a>
              )}
              {p.visible_email && p.email && (
                <a href={`mailto:${p.email}?subject=Consulta desde Pozero Agro`}
                  style={btnStyle('#e8f0fa', '#1B4F8A', '1px solid #1B4F8A')}>✉️ {p.email}</a>
              )}
              {p.visible_instagram && p.instagram && (
                <a href={`https://instagram.com/${p.instagram.replace('@','')}`}
                  target="_blank" rel="noreferrer" style={btnStyle('#fce4ec', '#c2185b', '1px solid #c2185b')}>📸 Instagram</a>
              )}
              {p.visible_facebook && p.facebook && (
                <a href={p.facebook.startsWith('http') ? p.facebook : `https://facebook.com/${p.facebook}`}
                  target="_blank" rel="noreferrer" style={btnStyle('#e3f2fd', '#1565c0', '1px solid #1565c0')}>👍 Facebook</a>
              )}
            </div>
          </div>

          {/* Disclaimer de contacto */}
          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8f9fa', borderRadius: '6px', fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
            Pozero Agro facilita el contacto pero no garantiza la calidad ni los resultados de los servicios. La contratación es de exclusiva responsabilidad del usuario.{' '}
            <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A' }}>Términos y condiciones</a>
          </div>
        </div>

        {/* ── COMENTARIOS ── */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e8', padding: '1.5rem', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>⭐ Comentarios y puntuación</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
            Opiniones de usuarios verificados. No representan la posición de Pozero Agro.
          </div>

          {/* Resumen de puntuación */}
          {comentarios.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f9fa', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: '700', color: '#1B4F8A' }}>{promedio.toFixed(1)}</div>
                <EstrellasDisplay valor={promedio} size={16} />
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                  {comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {[5,4,3,2,1].map(n => {
                  const cant = comentarios.filter(r => r.estrellas === n).length
                  const pct = comentarios.length ? (cant / comentarios.length) * 100 : 0
                  return (
                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#888', width: '8px' }}>{n}</span>
                      <span style={{ fontSize: '12px', color: '#F5A623' }}>★</span>
                      <div style={{ flex: 1, height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#F5A623', borderRadius: '3px' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#888', width: '20px' }}>{cant}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Lista de comentarios */}
          {comentarios.map((r, i) => (
            <div key={r.id || i} style={{ borderBottom: i < comentarios.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a2e' }}>
                  {r.nombre_cliente || 'Usuario verificado'}
                  <span style={{ marginLeft: '6px', fontSize: '10px', color: '#aaa', fontWeight: '400' }}>✓ email verificado</span>
                </div>
                <span style={{ fontSize: '14px', color: '#F5A623' }}>
                  {'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}
                </span>
              </div>
              {r.comentario && (
                <div style={{ fontSize: '13px', color: '#555', marginTop: '4px', lineHeight: '1.5' }}>{r.comentario}</div>
              )}
              <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>
                {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          ))}

          {comentarios.length === 0 && (
            <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>
              Todavía no hay comentarios. ¡Sé el primero en opinar!
            </div>
          )}

          {/* ── FORMULARIO COMENTARIO ── */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' }}>Dejá tu opinión</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
              Tu comentario es tu opinión personal. Pozero Agro puede moderar contenido inapropiado.
            </div>

            {!usuario ? (
              !magicEnviado ? (
                /* Paso 1: verificar email */
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Ingresá tu email para verificar tu identidad. Te enviamos un link, sin contraseña.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={emailMagic}
                      onChange={e => setEmailMagic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && enviarMagicLink()}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
                    />
                    <button onClick={enviarMagicLink} disabled={enviandoMagic || !emailMagic}
                      style={{ padding: '9px 16px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: enviandoMagic ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                      {enviandoMagic ? 'Enviando...' : 'Verificar email'}
                    </button>
                  </div>
                  {errorEnvio && <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '6px' }}>{errorEnvio}</div>}
                </div>
              ) : (
                /* Paso 2: link enviado */
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1B4F8A', marginBottom: '4px' }}>¡Revisá tu email!</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Te enviamos un link a <strong>{emailMagic}</strong>.<br />
                    Hacé clic en el link y volvé a esta página para comentar.
                  </div>
                </div>
              )
            ) : (
              !enviado ? (
                /* Usuario autenticado */
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    Comentando como <strong>{usuario.email}</strong> ✓
                  </div>

                  {/* Estrellas */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>Tu puntuación *</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setMiRating(n)}
                          style={{ fontSize: '28px', cursor: 'pointer', color: n <= (hoverRating || miRating) ? '#F5A623' : '#ddd', transition: 'color 0.1s' }}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Texto */}
                  <textarea
                    placeholder="Contá tu experiencia (opcional)..."
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical', background: '#fff', marginBottom: '10px' }}
                  />

                  {/* Checkbox T&C obligatorio */}
                  <div style={{ background: aceptoTC ? '#f0fdf4' : '#fff8f0', border: `1px solid ${aceptoTC ? '#86efac' : '#fcd34d'}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={aceptoTC} onChange={e => setAceptoTC(e.target.checked)}
                        style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#444', lineHeight: '1.5' }}>
                        Entiendo que este comentario es mi opinión personal y acepto los{' '}
                        <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A', fontWeight: '600' }}>
                          Términos y Condiciones
                        </a>{' '}
                        de Pozero Agro. *
                      </span>
                    </label>
                  </div>

                  {errorEnvio && <div style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '8px' }}>{errorEnvio}</div>}

                  <button onClick={enviarComentario} disabled={enviando || !aceptoTC}
                    style={{
                      padding: '9px 24px',
                      background: aceptoTC ? '#1B4F8A' : '#ccc',
                      color: '#fff', border: 'none', borderRadius: '6px',
                      fontSize: '13px', fontWeight: '600',
                      cursor: aceptoTC ? 'pointer' : 'not-allowed',
                      opacity: enviando ? 0.7 : 1
                    }}>
                    {enviando ? 'Enviando...' : 'Enviar comentario'}
                  </button>
                </div>
              ) : (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', textAlign: 'center', color: '#166534', fontWeight: '600', fontSize: '14px' }}>
                  ✅ ¡Gracias por tu comentario!
                </div>
              )
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ background: '#1B4F8A', borderRadius: '12px', padding: '1rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>¿Necesitás equipar tu pozo con energía solar?</div>
          <a href="https://febecos.mitiendanube.com" target="_blank" rel="noreferrer"
            style={{ background: '#F26419', color: '#fff', padding: '9px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
            Ver kits Febecos →
          </a>
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
            <a href="/terminos" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginRight: '12px' }}>Términos y condiciones</a>
            <a href="/terminos#privacidad" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Política de privacidad</a>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function Dato({ icono, label, valor }) {
  return (
    <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px' }}>
      <div style={{ fontSize: '11px', color: '#888', marginBottom: '2px' }}>{icono} {label}</div>
      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e' }}>{valor}</div>
    </div>
  )
}

function TagGroup({ label, items, color, textColor }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {items.map(s => (
          <span key={s} style={{ fontSize: '12px', background: color, color: textColor, padding: '3px 10px', borderRadius: '4px', fontWeight: '500' }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

function btnStyle(bg, color, border = 'none') {
  return {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '8px 14px', borderRadius: '6px',
    background: bg, color, border,
    textDecoration: 'none', fontSize: '13px', fontWeight: '600'
  }
}
