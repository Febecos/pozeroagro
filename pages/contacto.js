// pages/contacto.js
import { useState, useEffect, useRef } from 'react'

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
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: '420px', margin: '1rem', border: '1px solid #e0e0e8', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#1B4F8A', marginBottom: '8px' }}>¡Mensaje enviado!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          Recibimos tu consulta. Te contactamos a la brevedad por WhatsApp o email.
        </div>
        <a href="/" style={{ display: 'inline-block', background: '#1B4F8A', color: '#fff', padding: '11px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Volver al directorio →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* Header */}
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
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>Contacto</div>
          </div>
        </div>
        <a href="/" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px' }}>
          ← Volver
        </a>
      </div>

      <div style={{ maxWidth: '560px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem' }}>

          <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Contactanos</div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>
            Completá el formulario y te respondemos a la brevedad.
          </div>

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
    </div>
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
