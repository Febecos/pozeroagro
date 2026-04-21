// pages/api/contacto.js
import { createClient } from '@supabase/supabase-js'
import { emailFormContacto } from '../../lib/emailTemplate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { tipo, nombre, apellido, dni, whatsapp, email, mensaje, token } = req.body

  // Validaciones básicas
  if (!tipo || !nombre || !apellido || !whatsapp || !email || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' })
  }

  if (!token) {
    return res.status(400).json({ error: 'Falta verificación de seguridad.' })
  }

  // Verificar Turnstile
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  })
  const verifyData = await verifyRes.json()

  if (!verifyData.success) {
    return res.status(400).json({ error: 'Verificación de seguridad fallida. Intentá de nuevo.' })
  }

  // Guardar en Supabase
  const { error: dbError } = await supabase.from('contactos').insert({
    tipo,
    nombre,
    apellido,
    dni: dni || null,
    whatsapp,
    email,
    mensaje,
  })

  if (dbError) {
    console.error('Error guardando contacto:', dbError)
    return res.status(500).json({ error: 'Error al guardar. Intentá de nuevo.' })
  }

  // Notificar al admin via Resend
  try {
    const tipoLabel = {
      productor: '🌾 Productor agropecuario',
      perforista: '⛏️ Perforista',
      empresa: '🏢 Empresa',
      persona: '👤 Persona particular',
    }[tipo] || tipo

    const html = emailFormContacto({
      tipo: tipoLabel, nombre, apellido, dni, whatsapp, email, mensaje
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pozero Agro <contacto@pozeroagro.ar>',
        to: 'contacto@pozeroagro.ar',
        subject: `📬 Nuevo contacto: ${tipoLabel} — ${nombre} ${apellido}`,
        html,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Resend error:', err)
    }
  } catch (e) {
    console.warn('Notificación admin falló:', e.message)
  }

  return res.status(200).json({ ok: true })
}
