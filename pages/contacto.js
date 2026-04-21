// pages/contacto.js
import { useState, useEffect, useRef } from 'react'
import SEO from '../components/SEO'

const TURNSTILE_SITE_KEY = '0x4AAAAAADAEeI6Am4GwlZZD'

const TIPOS = [
  { value: 'productor', label: '🌾 Productor agropecuario' },
  { value: 'perforista', label: '⛏️ Perforista' },
  { value: 'empresa', label: '🏢 Empresa' },
  { value: 'persona', label: '👤 Persona particular' },
]

export default function Contacto() {
  const [form, setForm] = useState({
    tipo: '', nombre: '', apellido: '', dni: '',
    whatsapp: '', email: '', mensaje: ''
  })
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [hp, setHp] = useState('') // honeypot
  const [formStart] = useState(Date.now())
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)

  useEffect(() => {
    // Cargar script de Turnstile
    if (window.turnstile) { renderTurnstile(); return }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => renderTurnstile()
    document.head.appendChild(script)
  }, [])

  function renderTurnstile() {
    if (!turnstileRef.current || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: (token) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
      'error-callback': () => setTurnstileToken(''),
    })
  }

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  async function enviar() {
    setError('')

    // Honeypot: bot detectado, simulamos éxito
    if (hp) {
      console.warn('Honeypot activado')
      setEnviado(true)
      return
    }

    // Envío sospechosamente rápido
    if (Date.now() - formStart < 3000) {
      console.warn('Envío demasiado rápido')
      setEnviado(true)
      return
    }

    if (!form.tipo) { setError('Por favor seleccioná quién sos.'); return }
    if (!form.nombre || !form.apellido) { setError('Nombre y apellido son obligatorios.'); return }
    if (!form.whatsapp) { setError('El WhatsApp es obligatorio.'); return }
    if (!form.email) { setError('El email es obligatorio.'); return }
    if (!form.mensaje) { setError('Por favor escribí tu mensaje.'); return }
    if (!turnstileToken) { setError('Completá la verificación de seguridad.'); return }

    setEnviando(true)
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token: turnstileToken }),
      })
      const data = await res.json()
      if (data.ok) {
        setEnviado(true)
      } else {
        setError(data.error || 'Error al enviar. Intentá de nuevo.')
        // Resetear Turnstile
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
          setTurnstileToken('')
        }
      }
    } catch (e) {
      setError('Error de red. Intentá de nuevo.')
    }
    setEnviando(false)
  }

  if (enviado) return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid rgba(15, 76, 129, 0.12)', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
              <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
              <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
            </svg>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.005em', fontSize: '18px', color: '#0F4C81' }}>POZERO</span>
              <span style={{ fontWeight: 500, letterSpacing: '0.04em', fontSize: '13px', color: '#94A3B8', textTransform: 'uppercase' }}>AGRO</span>
            </span>
          </a>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '2.5rem 2rem', textAlign: 'center', maxWidth: '460px', border: '1px solid rgba(15, 76, 129, 0.12)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
          <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '22px', fontWeight: 700, color: '#0F4C81', marginBottom: '8px' }}>¡Mensaje enviado!</div>
          <div style={{ fontSize: '14px', color: '#334155', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Recibimos tu consulta. Te contactamos a la brevedad por WhatsApp o email.
          </div>
          <a href="/" style={{ display: 'inline-block', background: '#0F4C81', color: '#fff', padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: 600 }}>
            Volver al directorio →
          </a>
        </div>
      </div>

      <footer style={{ background: '#0F4C81', padding: '20px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Términos y condiciones</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Política de privacidad</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Contacto</a>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 Pozero Agro · Argentina</div>
      </footer>
    </div>
    </>
  )

  return (
    <>
      <SEO
        path="/contacto"
        title="Contacto"
        description="Contactanos para consultas sobre Pozero Agro, sumarte al directorio, o cualquier consulta. Respondemos por WhatsApp o email."
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
      <section style={{ background: 'linear-gradient(135deg, var(--azul-pozero) 0%, var(--azul-pozero-deep) 100%)', padding: '36px 20px 28px', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
            Contactanos
          </h1>
          <p style={{ fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'rgba(255,255,255,0.85)', maxWidth: '620px', lineHeight: 1.4 }}>
            Completá el formulario y te respondemos a la brevedad por WhatsApp o email.
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '560px', margin: '1.5rem auto', padding: '0 1rem', width: '100%', flex: 1 }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid var(--line)', padding: '1.5rem' }}>

          {/* Tipo */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>¿Quién sos? *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
              {TIPOS.map(t => (
                <div key={t.value}
                  onClick={() => set('tipo', t.value)}
                  style={{
                    padding: '10px 12px', borderRadius: '8px', cursor: 'pointer',
                    border: form.tipo === t.value ? '1.5px solid #1B4F8A' : '0.5px solid #ccc',
                    background: form.tipo === t.value ? '#e8f0fa' : '#fff',
                    fontSize: '13px', fontWeight: form.tipo === t.value ? '600' : '400',
                    color: form.tipo === t.value ? '#1B4F8A' : '#444',
                    transition: 'all 0.15s'
                  }}>
                  {t.label}
                </div>
              ))}
            </div>
          </div>

          {/* Nombre y Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Juan" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Apellido *</label>
              <input value={form.apellido} onChange={e => set('apellido', e.target.value)}
                placeholder="Pérez" style={inputStyle} />
            </div>
          </div>

          {/* DNI */}
          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>DNI <span style={{ color: '#bbb', fontWeight: '400', textTransform: 'none' }}>(opcional)</span></label>
            <input
              value={form.dni}
              onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="12345678"
              maxLength={8}
              style={inputStyle}
            />
          </div>

          {/* WhatsApp y Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>WhatsApp *</label>
              <input value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)}
                placeholder="+54 9 11 XXXX-XXXX" type="tel" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="juan@ejemplo.com" type="email" style={inputStyle} />
            </div>
          </div>

          {/* Mensaje */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Mensaje *</label>
            <textarea
              value={form.mensaje}
              onChange={e => set('mensaje', e.target.value)}
              placeholder="Contanos en qué podemos ayudarte..."
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '100px' }}
            />
          </div>

          {/* Honeypot: invisible para humanos, bots lo llenan */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1px', height: '1px', overflow: 'hidden', opacity: 0 }}>
            <label htmlFor="website_url">Website (no llenar)</label>
            <input
              type="text"
              id="website_url"
              name="website_url"
              tabIndex="-1"
              autoComplete="off"
              value={hp}
              onChange={e => setHp(e.target.value)}
            />
          </div>

          {/* Turnstile */}
          <div style={{ marginBottom: '16px' }}>
            <div ref={turnstileRef} />
          </div>

          {error && (
            <div style={{ fontSize: '13px', color: '#c0392b', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <button
            onClick={enviar}
            disabled={enviando || !turnstileToken}
            style={{
              width: '100%', padding: '12px',
              background: turnstileToken ? '#1B4F8A' : '#ccc',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: '700',
              cursor: turnstileToken ? 'pointer' : 'not-allowed',
              opacity: enviando ? 0.7 : 1,
              transition: 'background 0.2s'
            }}>
            {enviando ? 'Enviando...' : 'Enviar mensaje'}
          </button>

          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '10px', textAlign: 'center', lineHeight: '1.5' }}>
            Tus datos no se comparten con terceros.{' '}
            <a href="/terminos#privacidad" style={{ color: '#1B4F8A' }}>Política de privacidad</a>
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
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Contacto</a>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 Pozero Agro · Argentina</div>
      </footer>
    </div>
    </>
  )
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#666', marginBottom: '4px',
  textTransform: 'uppercase', letterSpacing: '0.3px'
}

const inputStyle = {
  width: '100%', padding: '9px 12px',
  border: '0.5px solid #ccc', borderRadius: '8px',
  fontSize: '14px', boxSizing: 'border-box', color: '#333',
  fontFamily: 'sans-serif'
}
