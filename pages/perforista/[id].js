import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import SEO from '../../components/SEO'
import {
  registrarEvento,
  getSessionId,
  trackWhatsApp,
  trackTelefono,
  trackEmail,
  trackInstagram,
  trackFacebook
} from '../../lib/tracker'
import { titleCase, nombreCompleto as formatNombreCompleto } from '../../lib/formato'


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const MOTIVOS_REPORTE = [
  { value: 'falso', label: 'Comentario falso o inventado' },
  { value: 'ofensivo', label: 'Contenido ofensivo o discriminatorio' },
  { value: 'spam', label: 'Spam o publicidad no solicitada' },
  { value: 'irrelevante', label: 'No tiene relacion con el servicio' },
  { value: 'otro', label: 'Otro motivo' },
]

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
  const [reporteModal, setReporteModal] = useState(null)
  const [motivoReporte, setMotivoReporte] = useState('')
  const [detalleReporte, setDetalleReporte] = useState('')
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [reporteEnviado, setReporteEnviado] = useState(false)
  const [errorReporte, setErrorReporte] = useState('')
  const [hpComent, setHpComent] = useState('') // honeypot comentarios
  const [comentStart] = useState(Date.now())

  useEffect(() => {
    if (!id) return
    cargar()
    cargarComentarios()
    verificarSesion()
    registrarEvento('perfil_visto', id)
  }, [id])

  async function verificarSesion() {
    if (typeof window === 'undefined') return
    let token = null
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      token = params.get('access_token')
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (!token) {
      token = sessionStorage.getItem('pza_auth_token')
      if (token) sessionStorage.removeItem('pza_auth_token')
    }
    if (!token) return
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.email) setUsuario({ email: data.email, token })
    } catch (e) {}
  }

  async function cargar() {
    setCargando(true)
    try {
      // Endpoint propio que NO expone whatsapp/teléfono/email/cuit/dni
      const res = await fetch(`/api/perforista/${id}`)
      if (res.ok) {
        const data = await res.json()
        setP(data)
      }
    } catch (e) {}
    setCargando(false)
  }

  async function cargarComentarios() {
    try {
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
      const redirectUrl = `${window.location.origin}/perforista/${id}`
      // La REST API de Supabase espera `redirect_to` en el body (no `emailRedirectTo`).
      // También se puede pasar como query param `?redirect_to=` para asegurar.
      const res = await fetch(
        `${SUPABASE_URL}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectUrl)}`,
        {
          method: 'POST',
          headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailMagic,
            options: { emailRedirectTo: redirectUrl }
          })
        }
      )
      if (res.ok) setMagicEnviado(true)
      else setErrorEnvio('No se pudo enviar el email. Intenta de nuevo.')
    } catch (e) {
      setErrorEnvio('Error de red. Intenta de nuevo.')
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
    } catch (e) {}
  }

  async function enviarComentario() {
    // Honeypot
    if (hpComent) {
      console.warn('Honeypot activado en comentario')
      setEnviado(true)
      return
    }
    // Envío rapidísimo
    if (Date.now() - comentStart < 3000) {
      console.warn('Comentario enviado demasiado rápido')
      setEnviado(true)
      return
    }

    if (!miRating) { setErrorEnvio('Por favor selecciona una puntuacion'); return }
    if (!usuario) { setErrorEnvio('Necesitas verificar tu email primero'); return }
    if (!aceptoTC) { setErrorEnvio('Debes aceptar los Terminos y Condiciones para comentar'); return }
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
          origen: 'web',
          reportado: false,
          ip_address: null
        })
      })
      if (res.ok || res.status === 201) {
        await registrarAceptacionComentarista()
        registrarEvento('comentario_enviado', id, { estrellas: miRating, tiene_texto: comentario.length > 0 })
        setEnviado(true)
        setMiRating(0)
        setComentario('')
        setAceptoTC(false)
        cargarComentarios()
      } else {
        // Detectar violación de unicidad (ya comentó antes este mismo pocero)
        const errText = await res.text().catch(() => '')
        if (res.status === 409 || errText.includes('23505') || errText.includes('duplicate') || errText.includes('unique')) {
          setErrorEnvio('Ya dejaste un comentario a este Pozero. Cada persona puede comentar una sola vez.')
        } else {
          setErrorEnvio('Hubo un error al enviar. Intenta de nuevo.')
        }
      }
    } catch (e) {
      setErrorEnvio('Error de red. Intenta de nuevo.')
    }
    setEnviando(false)
  }

  function abrirReporte(comentarioId) {
    setReporteModal(comentarioId)
    setMotivoReporte('')
    setDetalleReporte('')
    setReporteEnviado(false)
    setErrorReporte('')
  }

  function cerrarReporte() {
    setReporteModal(null)
    setMotivoReporte('')
    setDetalleReporte('')
    setReporteEnviado(false)
    setErrorReporte('')
  }

  async function enviarReporte() {
    if (!motivoReporte) { setErrorReporte('Por favor selecciona un motivo'); return }
    setEnviandoReporte(true)
    setErrorReporte('')
    try {
      const resReporte = await fetch(`${SUPABASE_URL}/rest/v1/comentarios_reportes`, {
        method: 'POST',
        headers: {
          'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          comentario_id: reporteModal,
          motivo: motivoReporte,
          detalle: detalleReporte || null,
          session_id: getSessionId(),
          email_reportante: usuario?.email || null
        })
      })
      if (!resReporte.ok && resReporte.status !== 201) {
        setErrorReporte('No se pudo enviar el reporte. Intenta de nuevo.')
        setEnviandoReporte(false)
        return
      }
      await fetch(`${SUPABASE_URL}/rest/v1/comentarios?id=eq.${reporteModal}`, {
        method: 'PATCH',
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportado: true })
      })
      registrarEvento('comentario_reportado', id, { comentario_id: reporteModal, motivo: motivoReporte })
      setReporteEnviado(true)
    } catch (e) {
      setErrorReporte('Error de red. Intenta de nuevo.')
    }
    setEnviandoReporte(false)
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

  if (cargando) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      Cargando perfil...
    </div>
  )

  if (!p) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
      <div style={{ fontSize: '18px', color: '#888' }}>Perforista no encontrado</div>
      <button onClick={() => router.push('/')} style={{ padding: '8px 20px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Volver</button>
    </div>
  )

  const promedio = promedioEstrellas()
  const esValidado = p.estado === 'cliente'
  const nombreCompleto = formatNombreCompleto(p.nombre, p.apellido)
  const localidadFmt = titleCase(p.localidad)
  const provinciaFmt = titleCase(p.provincia)
  // esPropietario lo veremos via /mi-perfil (no dejamos p.email en respuesta pública)
  const esPropietario = false

  // Construir JSON-LD LocalBusiness para SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": nombreCompleto,
    "description": p.descripcion || `Perforista rural en ${localidadFmt}, ${provinciaFmt}. ${p.experiencia ? `Experiencia: ${p.experiencia}. ` : ''}${p.servicios?.length ? `Servicios: ${p.servicios.join(', ')}.` : ''}`,
    "url": `https://pozeroagro.ar/perforista/${p.id}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": localidadFmt,
      "addressRegion": provinciaFmt,
      "addressCountry": "AR"
    },
    ...(p.lat && p.lng ? {
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": p.lat,
        "longitude": p.lng
      }
    } : {}),
    ...(p.servicios?.length ? { "knowsAbout": p.servicios } : {}),
    ...(comentarios.length > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": promedio.toFixed(1),
        "reviewCount": comentarios.length,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {})
  }

  const seoDescription = p.descripcion
    ? p.descripcion.slice(0, 155)
    : `Pocero en ${localidadFmt}, ${provinciaFmt}. ${p.experiencia ? `${p.experiencia} de experiencia. ` : ''}Contacto directo por WhatsApp.`

  return (
    <>
      <SEO
        path={`/perforista/${p.id}`}
        title={`${nombreCompleto} — Pocero en ${localidadFmt}, ${provinciaFmt}`}
        description={seoDescription}
        structuredData={jsonLd}
      />
      <style jsx global>{`
        :root {
          --azul-pozero: #0F4C81;
          --azul-pozero-deep: #0A3A63;
          --gris-agro: #94A3B8;
          --off-white: #F8FAFC;
          --verde-solar: #22C55E;
          --ink: #0F1E2E;
          --line: rgba(15, 76, 129, 0.12);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { -webkit-text-size-adjust: 100%; }
        body {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          color: var(--ink);
          background: var(--off-white);
          min-height: 100vh;
        }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>

      {reporteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', maxWidth: '420px', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            {!reporteEnviado ? (
              <>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>Reportar comentario</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
                  Los reportes son revisados por el equipo de Pozero Agro. No implican eliminacion automatica.
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Motivo *</label>
                  {MOTIVOS_REPORTE.map(m => (
                    <label key={m.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                      <input type="radio" name="motivo" value={m.value} checked={motivoReporte === m.value} onChange={() => setMotivoReporte(m.value)} />
                      <span style={{ fontSize: '13px', color: '#444' }}>{m.label}</span>
                    </label>
                  ))}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Detalle adicional (opcional)</label>
                  <textarea value={detalleReporte} onChange={e => setDetalleReporte(e.target.value)}
                    placeholder="Describe brevemente el problema..."
                    rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical' }} />
                </div>
                {errorReporte && <div style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '8px' }}>{errorReporte}</div>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={cerrarReporte} style={{ flex: 1, padding: '9px', border: '1px solid #ddd', borderRadius: '6px', background: '#fff', fontSize: '13px', cursor: 'pointer', color: '#666' }}>Cancelar</button>
                  <button onClick={enviarReporte} disabled={enviandoReporte || !motivoReporte}
                    style={{ flex: 1, padding: '9px', background: motivoReporte ? '#e53e3e' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: motivoReporte ? 'pointer' : 'not-allowed', opacity: enviandoReporte ? 0.7 : 1 }}>
                    {enviandoReporte ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '8px' }}>Reporte enviado</div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: '1.6' }}>
                  Gracias por tu reporte. El equipo de Pozero Agro lo revisara a la brevedad.
                </div>
                <button onClick={cerrarReporte} style={{ padding: '9px 24px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--line)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} aria-label="Volver al inicio">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
              <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
              <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
            </svg>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.005em', fontSize: '18px', color: 'var(--azul-pozero)' }}>POZERO</span>
              <span style={{ fontWeight: 500, letterSpacing: '0.04em', fontSize: '13px', color: 'var(--gris-agro)', textTransform: 'uppercase' }}>AGRO</span>
            </span>
          </a>
        </div>
      </header>

      {/* ─── MINI HERO AZUL ─── */}
      <section style={{ background: 'linear-gradient(135deg, var(--azul-pozero) 0%, var(--azul-pozero-deep) 100%)', padding: '32px 20px 24px', color: '#fff' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <a href="/buscar" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '12px' }}>
            ← Volver al directorio
          </a>
          <div style={{ marginTop: '12px' }}>
            <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 34px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '4px', display: 'inline-flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {nombreCompleto}
              {p.estado === 'cliente' && (
                <span title="Cliente verificado Pozero Agro" aria-label="Verificado" style={{ display: 'inline-flex', color: '#22C55E', lineHeight: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2L14.39 5.42 18.24 4.76 18.9 8.61 22.32 11 18.9 13.39 18.24 17.24 14.39 16.58 12 20 9.61 16.58 5.76 17.24 5.1 13.39 1.68 11 5.1 8.61 5.76 4.76 9.61 5.42z"/>
                    <path d="M10.5 13.5l-2-2 1.4-1.4 0.6 0.6 3.6-3.6 1.4 1.4z" fill="#fff"/>
                  </svg>
                </span>
              )}
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            📍 {localidadFmt} · {provinciaFmt}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem', width: '100%', flex: 1 }}>

        {/* TARJETA PRINCIPAL */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--line)', padding: '1.5rem', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '22px', color: '#0F4C81', flexShrink: 0, fontFamily: 'Montserrat, sans-serif' }}>
              {p.nombre?.[0]}{p.apellido?.[0]}
            </div>
            <div style={{ flex: 1 }}>
              {comentarios.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <EstrellasDisplay valor={promedio} size={16} />
                  <span style={{ fontSize: '13px', color: '#666' }}>
                    {promedio.toFixed(1)} ({comentarios.length} {comentarios.length === 1 ? 'comentario' : 'comentarios'})
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {p.conoce_solar === 'Si, ya instale sistemas solares' && (
                  <span style={{ fontSize: '11px', background: '#fff3e0', color: '#E65100', padding: '3px 8px', borderRadius: '4px' }}>Instala solar</span>
                )}
                {p.quiere_info_equipos && (
                  <span style={{ fontSize: '11px', background: '#f0fdf4', color: '#166534', padding: '3px 8px', borderRadius: '4px' }}>Interesado en equipos</span>
                )}
              </div>
            </div>
          </div>

          {p.descripcion && (
            <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: '#444', lineHeight: '1.6' }}>
              {p.descripcion}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {p.experiencia && <Dato icono="🗓️" label="Experiencia" valor={p.experiencia} />}
            {p.tipo_empresa && <Dato icono="🏢" label="Tipo de empresa" valor={p.tipo_empresa} />}
            {p.profundidad_max && <Dato icono="⬇️" label="Profundidad max." valor={`${p.profundidad_max} metros`} />}
            {p.trabajos_por_mes && <Dato icono="📊" label="Trabajos por mes" valor={p.trabajos_por_mes} />}
          </div>

          {p.servicios?.length > 0 && <TagGroup label="Servicios" items={p.servicios} color="#e8f0fa" textColor="#1B4F8A" />}
          {p.diametros?.length > 0 && <TagGroup label="Diametros" items={p.diametros} color="#f3e8ff" textColor="#6a0dad" />}
          {p.terrenos?.length > 0 && <TagGroup label="Tipos de terreno" items={p.terrenos} color="#f0fdf4" textColor="#166534" />}
          {p.tipo_bomba?.length > 0 && <TagGroup label="Tipos de bomba" items={p.tipo_bomba} color="#fff3e0" textColor="#E65100" />}
          {p.zonas_trabajo?.length > 0 && <TagGroup label="Zonas de trabajo" items={p.zonas_trabajo} color="#fef3c7" textColor="#92400e" />}

          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', marginTop: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#666', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contacto</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {p.visible_telefono && (
                <button
                  onClick={async () => {
                    const num = await trackTelefono(id, null, nombreCompleto)
                    if (num) window.location.href = `tel:${num}`
                  }}
                  style={{ ...btnStyle('#e8f0fa', '#1B4F8A', '1px solid #1B4F8A'), border: '1px solid #1B4F8A', cursor: 'pointer' }}>
                  📞 Llamar
                </button>
              )}
              {p.visible_whatsapp && (
                <button onClick={() => trackWhatsApp(id, null, nombreCompleto)} style={{ ...btnStyle('#25D366', '#fff'), border: 'none', cursor: 'pointer' }}>
                  💬 WhatsApp
                </button>
              )}
              {p.visible_email && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/contacto-perforista?id=${id}&tipo=email`)
                    const data = await res.json()
                    if (res.status === 429) { alert(data.mensaje || 'Demasiadas solicitudes.'); return }
                    if (!res.ok || !data.valor) { alert('No se pudo obtener el email.'); return }
                    registrarEvento('contacto_email', id, { canal: 'email', perforista_nombre: nombreCompleto })
                    window.location.href = `mailto:${data.valor}?subject=Consulta desde Pozero Agro`
                  }}
                  style={{ ...btnStyle('#e8f0fa', '#1B4F8A', '1px solid #1B4F8A'), border: '1px solid #1B4F8A', cursor: 'pointer' }}>
                  ✉️ Email
                </button>
              )}
              {p.visible_instagram && p.instagram && (
                <button onClick={() => trackInstagram(id, p.instagram, nombreCompleto)} style={{ ...btnStyle('#fce4ec', '#c2185b', '1px solid #c2185b'), border: '1px solid #c2185b', cursor: 'pointer' }}>
                  📸 Instagram
                </button>
              )}
              {p.visible_facebook && p.facebook && (
                <button onClick={() => trackFacebook(id, p.facebook, nombreCompleto)} style={{ ...btnStyle('#e3f2fd', '#1565c0', '1px solid #1565c0'), border: '1px solid #1565c0', cursor: 'pointer' }}>
                  👍 Facebook
                </button>
              )}
            </div>
          </div>

          <div style={{ marginTop: '12px', padding: '10px 12px', background: '#f8f9fa', borderRadius: '6px', fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
            Pozero Agro facilita el contacto pero no garantiza la calidad ni los resultados de los servicios. La contratacion es de exclusiva responsabilidad del usuario.{' '}
            <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A' }}>Terminos y condiciones</a>
          </div>

          {esPropietario && (
            <div style={{ marginTop: '12px', padding: '10px 14px', background: '#e8f0fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#1B4F8A' }}>Este es tu perfil</span>
              <a href="/mi-perfil" style={{ fontSize: '13px', fontWeight: '600', color: '#fff', background: '#1B4F8A', padding: '6px 14px', borderRadius: '6px', textDecoration: 'none' }}>
                Editar mis datos
              </a>
            </div>
          )}
        </div>

        {/* COMENTARIOS */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e8', padding: '1.5rem', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a2e', marginBottom: '4px' }}>Comentarios y puntuacion</div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
            Opiniones de usuarios verificados. No representan la posicion de Pozero Agro.
          </div>

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

          {comentarios.map((r, i) => (
            <div key={r.id || i} style={{ borderBottom: i < comentarios.length - 1 ? '1px solid #f0f0f0' : 'none', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a2e' }}>
                  {r.nombre_cliente || 'Usuario verificado'}
                  <span style={{ marginLeft: '6px', fontSize: '10px', color: '#aaa', fontWeight: '400' }}>email verificado</span>
                </div>
                <span style={{ fontSize: '14px', color: '#F5A623' }}>
                  {'★'.repeat(r.estrellas)}{'☆'.repeat(5 - r.estrellas)}
                </span>
              </div>
              {r.comentario && (
                <div style={{ fontSize: '13px', color: '#555', marginTop: '4px', lineHeight: '1.5' }}>{r.comentario}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <div style={{ fontSize: '11px', color: '#bbb' }}>
                  {new Date(r.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                {!r.reportado && (
                  <button onClick={() => abrirReporte(r.id)}
                    style={{ fontSize: '11px', color: '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px' }}
                    onMouseEnter={e => e.target.style.color = '#e53e3e'}
                    onMouseLeave={e => e.target.style.color = '#ccc'}
                    title="Reportar este comentario">
                    Reportar
                  </button>
                )}
                {r.reportado && <span style={{ fontSize: '11px', color: '#e0b0b0' }}>Reportado</span>}
              </div>
            </div>
          ))}

          {comentarios.length === 0 && (
            <div style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>
              Todavia no hay comentarios.
            </div>
          )}

          <div style={{ background: '#f8f9fa', borderRadius: '10px', padding: '16px', marginTop: '8px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '4px' }}>Deja tu opinion</div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '12px' }}>
              Tu comentario es tu opinion personal. Pozero Agro puede moderar contenido inapropiado.
            </div>

            {!usuario ? (
              !magicEnviado ? (
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                    Ingresa tu email para verificar tu identidad. Te enviamos un link, sin contrasena.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="email" placeholder="tu@email.com" value={emailMagic}
                      onChange={e => setEmailMagic(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && enviarMagicLink()}
                      style={{ flex: 1, padding: '9px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }} />
                    <button onClick={enviarMagicLink} disabled={enviandoMagic || !emailMagic}
                      style={{ padding: '9px 16px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: enviandoMagic ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                      {enviandoMagic ? 'Enviando...' : 'Verificar email'}
                    </button>
                  </div>
                  {errorEnvio && <div style={{ fontSize: '12px', color: '#e53e3e', marginTop: '6px' }}>{errorEnvio}</div>}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📧</div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#1B4F8A', marginBottom: '4px' }}>Revisa tu email!</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Te enviamos un link a <strong>{emailMagic}</strong>.
                  </div>
                </div>
              )
            ) : comentarios.some(c => (c.email_verificado || '').toLowerCase() === (usuario.email || '').toLowerCase()) ? (
              <div style={{ textAlign: 'center', padding: '16px', background: '#e8f0fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '28px', marginBottom: '6px' }}>✅</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#1B4F8A', marginBottom: '4px' }}>Ya dejaste tu comentario</div>
                <div style={{ fontSize: '12px', color: '#666', lineHeight: 1.6 }}>
                  Cada persona puede comentar una sola vez por Pozero.<br/>
                  Si querés modificar tu opinión, escribinos a <a href="/contacto" style={{ color: '#1B4F8A', fontWeight: 500 }}>Contacto</a>.
                </div>
              </div>
            ) : (
              !enviado ? (
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
                    Comentando como <strong>{usuario.email}</strong>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>Tu puntuacion *</div>
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
                  <textarea placeholder="Conta tu experiencia (opcional)..." value={comentario}
                    onChange={e => setComentario(e.target.value)} rows={3}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px', resize: 'vertical', background: '#fff', marginBottom: '10px' }} />
                  <div style={{ background: aceptoTC ? '#f0fdf4' : '#fff8f0', border: `1px solid ${aceptoTC ? '#86efac' : '#fcd34d'}`, borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={aceptoTC} onChange={e => setAceptoTC(e.target.checked)} style={{ marginTop: '3px', flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: '#444', lineHeight: '1.5' }}>
                        Entiendo que este comentario es mi opinion personal y acepto los{' '}
                        <a href="/terminos" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A', fontWeight: '600' }}>Terminos y Condiciones</a>{' '}
                        de Pozero Agro. *
                      </span>
                    </label>
                  </div>
                  {errorEnvio && <div style={{ fontSize: '12px', color: '#e53e3e', marginBottom: '8px' }}>{errorEnvio}</div>}

                  {/* Honeypot: invisible para humanos */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}>
                    <label htmlFor="comment_url">URL (no llenar)</label>
                    <input
                      type="text"
                      id="comment_url"
                      name="comment_url"
                      tabIndex="-1"
                      autoComplete="off"
                      value={hpComent}
                      onChange={e => setHpComent(e.target.value)}
                    />
                  </div>

                  <button onClick={enviarComentario} disabled={enviando || !aceptoTC}
                    style={{ padding: '9px 24px', background: aceptoTC ? '#1B4F8A' : '#ccc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: aceptoTC ? 'pointer' : 'not-allowed', opacity: enviando ? 0.7 : 1 }}>
                    {enviando ? 'Enviando...' : 'Enviar comentario'}
                  </button>
                </div>
              ) : (
                <div style={{ background: '#f0fdf4', borderRadius: '10px', padding: '16px', textAlign: 'center', color: '#166534', fontWeight: '600', fontSize: '14px' }}>
                  Gracias por tu comentario!
                </div>
              )
            )}
          </div>
        </div>

      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'var(--azul-pozero)', padding: '20px', textAlign: 'center', marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Términos y condiciones</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Política de privacidad</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/como-funciona" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Cómo funciona</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Contacto</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/mi-perfil" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Editar mi perfil</a>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 Pozero Agro · Argentina</div>
      </footer>
    </div>
    </>
  )
}

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
