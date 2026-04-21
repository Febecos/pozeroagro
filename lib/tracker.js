// lib/tracker.js
// Módulo de trazabilidad de eventos — Pozero Agro
// No modificar sin revisar el Módulo 2 de arquitectura

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

  // ─── Google Analytics 4: enviar evento en paralelo ─────────────────────────
  // Mapeo de nuestros eventos internos a eventos GA4 significativos
  try {
    if (typeof window.gtag === 'function') {
      const eventosGA4 = {
        'contacto_whatsapp': 'contact_whatsapp',
        'contacto_telefono': 'contact_phone',
        'contacto_email': 'contact_email',
        'contacto_instagram': 'contact_instagram',
        'contacto_facebook': 'contact_facebook',
        'busqueda_realizada': 'search',
        'card_vista': 'select_item',
        'pin_mapa_click': 'select_item_map',
        'cta_click': 'cta_click',
        'comentario_enviado': 'leave_review',
        'registro_perforista': 'sign_up',
        'formulario_contacto': 'contact_form_submit',
        'directorio_visto': 'view_directory',
        'home_vista': 'view_home'
      }
      const eventGA = eventosGA4[tipo_evento] || tipo_evento
      window.gtag('event', eventGA, {
        perforista_id: perforista_id || undefined,
        ...extra
      })
    }
  } catch (e) {
    // Silencioso
  }

  // ─── Meta Pixel: enviar eventos estándar o custom ─────────────────────────
  // Meta tiene "eventos estándar" (Contact, Lead, Search, etc.) que funcionan
  // mejor para optimizar ads. Mapeamos a esos cuando podemos, custom si no.
  try {
    if (typeof window.fbq === 'function') {
      const eventosMeta = {
        // Eventos estándar de Meta (optimizan mejor las campañas)
        'contacto_whatsapp':    { tipo: 'standard', nombre: 'Contact' },
        'contacto_telefono':    { tipo: 'standard', nombre: 'Contact' },
        'contacto_email':       { tipo: 'standard', nombre: 'Contact' },
        'busqueda_realizada':   { tipo: 'standard', nombre: 'Search' },
        'registro_perforista':  { tipo: 'standard', nombre: 'CompleteRegistration' },
        'formulario_contacto':  { tipo: 'standard', nombre: 'Lead' },
        'card_vista':           { tipo: 'standard', nombre: 'ViewContent' },
        // Eventos custom (no tienen equivalente estándar)
        'comentario_enviado':   { tipo: 'custom', nombre: 'DejarComentario' },
        'cta_click':            { tipo: 'custom', nombre: 'CTAClick' },
      }
      const ev = eventosMeta[tipo_evento]
      if (ev) {
        const metodo = ev.tipo === 'standard' ? 'track' : 'trackCustom'
        window.fbq(metodo, ev.nombre, {
          perforista_id: perforista_id || undefined,
          ...extra
        })
      }
    }
  } catch (e) {
    // Silencioso
  }

  // ─── Tracking interno en Supabase ──────────────────────────────────────────
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
// NOTA: Estas funciones obtienen el número via /api/contacto-perforista
// (protegido con rate limiting) — evitan que el número viaje en el listado público

export async function trackWhatsApp(perforista_id, numero, nombre_perforista) {
  // Si ya nos pasaron el número (casos legacy), lo usamos directo
  if (numero) {
    registrarEvento('contacto_whatsapp', perforista_id, {
      canal: 'whatsapp',
      perforista_nombre: nombre_perforista
    })
    await new Promise(r => setTimeout(r, 150))
    const url = `https://wa.me/${numero}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}`
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  // Si no tenemos número, lo pedimos al endpoint seguro
  try {
    const res = await fetch(`/api/contacto-perforista?id=${perforista_id}&tipo=whatsapp`)
    const data = await res.json()

    if (res.status === 429) {
      alert(data.mensaje || 'Demasiadas solicitudes. Esperá un rato.')
      return
    }
    if (!res.ok || !data.valor) {
      alert('No se pudo obtener el WhatsApp. Intentalo de nuevo.')
      return
    }

    registrarEvento('contacto_whatsapp', perforista_id, {
      canal: 'whatsapp',
      perforista_nombre: nombre_perforista
    })

    const num = data.valor.replace(/\D/g, '')
    const url = `https://wa.me/${num}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (e) {
    alert('Error al obtener el contacto. Intentalo de nuevo.')
  }
}

export async function trackTelefono(perforista_id, telefono, nombre_perforista) {
  // Si ya nos pasaron el teléfono (casos legacy), lo usamos directo
  if (telefono) {
    registrarEvento('contacto_telefono', perforista_id, {
      canal: 'telefono',
      perforista_nombre: nombre_perforista
    })
    return
  }

  // Si no tenemos teléfono, lo pedimos al endpoint seguro
  try {
    const res = await fetch(`/api/contacto-perforista?id=${perforista_id}&tipo=telefono`)
    const data = await res.json()

    if (res.status === 429) {
      alert(data.mensaje || 'Demasiadas solicitudes. Esperá un rato.')
      return null
    }
    if (!res.ok || !data.valor) {
      alert('No se pudo obtener el teléfono.')
      return null
    }

    registrarEvento('contacto_telefono', perforista_id, {
      canal: 'telefono',
      perforista_nombre: nombre_perforista
    })

    return data.valor
  } catch (e) {
    alert('Error al obtener el contacto.')
    return null
  }
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
