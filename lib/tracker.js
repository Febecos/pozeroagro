// lib/tracker.js
// Módulo de trazabilidad de eventos — Pozero Agro
// No modificar sin revisar el Módulo 2 de arquitectura

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'

// ─── SESSION ID ANÓNIMO ───────────────────────────────────────────────────────
// Se genera una vez por tab/sesión. Se limpia al cerrar el tab (sessionStorage).
export function getSessionId() {
  if (typeof window === 'undefined') return null
  try {
    let sid = sessionStorage.getItem('pza_sid')
    if (!sid) {
      sid = crypto.randomUUID()
      sessionStorage.setItem('pza_sid', sid)
    }
    return sid
  } catch (e) {
    return null
  }
}

// ─── UTMs Y ORIGEN ───────────────────────────────────────────────────────────
// Captura parámetros de campaña si están en la URL
export function getUTMs() {
  if (typeof window === 'undefined') return {}
  try {
    const params = new URLSearchParams(window.location.search)
    const utms = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => {
      if (params.get(k)) utms[k] = params.get(k)
    })
    return utms
  } catch (e) {
    return {}
  }
}

// ─── REGISTRAR EVENTO ────────────────────────────────────────────────────────
// Nunca bloquea el flujo principal — fire and forget
// tipo_evento: string — ver lista de eventos en Módulo 2
// perforista_id: uuid | null
// extra: objeto con metadata adicional
export async function registrarEvento(tipo_evento, perforista_id = null, extra = {}) {
  if (typeof window === 'undefined') return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/eventos_log`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        tipo_evento,
        perforista_id: perforista_id || null,
        session_id: getSessionId(),
        metadata: {
          ...getUTMs(),
          referrer: document.referrer || null,
          user_agent: navigator.userAgent || null,
          url: window.location.pathname || null,
          ...extra
        }
      })
    })
  } catch (e) {
    // Silencioso — nunca interrumpe la experiencia del usuario
  }
}

// ─── REDIRECCIÓN CON TRACKING ────────────────────────────────────────────────
// Registra el evento ANTES de redirigir
// Pausa máxima de 150ms para dar tiempo al fetch sin bloquear al usuario
export async function redirigirConTracking(url, tipo_evento, perforista_id = null, extra = {}) {
  if (typeof window === 'undefined') return

  // Disparar evento sin esperar
  registrarEvento(tipo_evento, perforista_id, extra)

  // Pausa mínima para dar tiempo al registro
  await new Promise(r => setTimeout(r, 150))

  // Redirigir siempre, independientemente del resultado del evento
  window.open(url, '_blank', 'noopener,noreferrer')
}

// ─── HELPERS DE CONTACTO ─────────────────────────────────────────────────────
// Funciones listas para usar en los componentes

export async function trackWhatsApp(perforista_id, numero, nombre_perforista) {
  const url = `https://wa.me/${numero}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}`
  await redirigirConTracking(url, 'contacto_whatsapp', perforista_id, {
    canal: 'whatsapp',
    perforista_nombre: nombre_perforista
  })
}

export async function trackTelefono(perforista_id, telefono, nombre_perforista) {
  // Para tel: no abrimos nueva pestaña, dejamos que el navegador maneje
  registrarEvento('contacto_telefono', perforista_id, {
    canal: 'telefono',
    perforista_nombre: nombre_perforista
  })
  // La redirección tel: la maneja el href del <a> directamente
}

export async function trackEmail(perforista_id, email, nombre_perforista) {
  registrarEvento('contacto_email', perforista_id, {
    canal: 'email',
    perforista_nombre: nombre_perforista
  })
}

export async function trackInstagram(perforista_id, instagram, nombre_perforista) {
  const url = `https://instagram.com/${instagram.replace('@', '')}`
  await redirigirConTracking(url, 'contacto_instagram', perforista_id, {
    canal: 'instagram',
    perforista_nombre: nombre_perforista
  })
}

export async function trackFacebook(perforista_id, facebook, nombre_perforista) {
  const url = facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`
  await redirigirConTracking(url, 'contacto_facebook', perforista_id, {
    canal: 'facebook',
    perforista_nombre: nombre_perforista
  })
}
