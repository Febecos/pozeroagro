// pages/api/contacto-perforista.js
// Devuelve WhatsApp / teléfono de un perforista específico
// Con rate limiting por IP (20 clicks/hora) y validación de origen

import crypto from 'crypto'

const LIMITE_POR_HORA = 20

export default async function handler(req, res) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id, tipo } = req.query

  if (!id || !tipo) {
    return res.status(400).json({ error: 'Faltan parámetros' })
  }

  if (!['whatsapp', 'telefono'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo inválido' })
  }

  // Obtener IP del cliente
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim()

  // Hash de IP para no guardar IPs en texto plano (privacidad)
  const ipHash = crypto.createHash('sha256').update(ip + 'pozero-salt').digest('hex').slice(0, 32)

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  try {
    // ─── Verificar rate limit ─────────────────────────────────────────────
    // Contar clicks de esta IP en la última hora
    const desde = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rate_limits?ip_hash=eq.${ipHash}&endpoint=eq.contacto-perforista&created_at=gte.${desde}&select=id`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: 'count=exact'
        }
      }
    )

    const total = parseInt(countRes.headers.get('content-range')?.split('/')[1] || '0', 10)

    if (total >= LIMITE_POR_HORA) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        mensaje: `Superaste el límite de ${LIMITE_POR_HORA} contactos por hora. Volvé a intentarlo en un rato.`
      })
    }

    // ─── Obtener datos del perforista ─────────────────────────────────────
    const perfRes = await fetch(
      `${SUPABASE_URL}/rest/v1/perforistas?id=eq.${id}&select=whatsapp,telefono,visible_whatsapp,visible_telefono,estado,nombre,apellido&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`
        }
      }
    )

    if (!perfRes.ok) {
      return res.status(500).json({ error: 'Error al consultar' })
    }

    const perfData = await perfRes.json()
    if (!Array.isArray(perfData) || perfData.length === 0) {
      return res.status(404).json({ error: 'Perforista no encontrado' })
    }

    const p = perfData[0]

    // Solo poceros activos o clientes
    if (!['activo', 'cliente'].includes(p.estado)) {
      return res.status(403).json({ error: 'Perforista no disponible' })
    }

    // Verificar si el dato solicitado está visible
    let valor = null
    if (tipo === 'whatsapp' && p.visible_whatsapp) {
      valor = p.whatsapp || p.telefono // Fallback a teléfono si no hay whatsapp
    } else if (tipo === 'telefono' && p.visible_telefono) {
      valor = p.telefono
    }

    if (!valor) {
      return res.status(403).json({ error: 'Dato no disponible' })
    }

    // ─── Registrar el click en rate_limits ───────────────────────────────
    // Fire-and-forget (no bloquea la respuesta)
    fetch(`${SUPABASE_URL}/rest/v1/rate_limits`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        ip_hash: ipHash,
        endpoint: 'contacto-perforista',
        perforista_id: id
      })
    }).catch(() => {})

    // ─── Registrar evento en eventos_log para analytics ──────────────────
    fetch(`${SUPABASE_URL}/rest/v1/eventos_log`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        tipo_evento: `contacto_${tipo}_servido`,
        perforista_id: id,
        metadata: {
          perforista_nombre: `${p.nombre} ${p.apellido}`,
          canal: tipo,
          user_agent: req.headers['user-agent'] || null
        }
      })
    }).catch(() => {})

    // Cache-Control: nunca cachear, cada click es único
    res.setHeader('Cache-Control', 'no-store, max-age=0')

    return res.status(200).json({ valor })
  } catch (e) {
    console.error('contacto-perforista error:', e.message)
    return res.status(500).json({ error: 'Error interno' })
  }
}
