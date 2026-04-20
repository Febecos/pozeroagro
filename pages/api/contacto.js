// pages/api/contacto.js
import { createClient } from '@supabase/supabase-js'

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
  const { error } = await supabase.from('contactos').insert({
    tipo,
    nombre,
    apellido,
    dni: dni || null,
    whatsapp,
    email,
    mensaje,
  })

  if (error) {
    console.error('Error guardando contacto:', error)
    return res.status(500).json({ error: 'Error al guardar. Intentá de nuevo.' })
  }

  // Notificar al admin por email
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: 'pozeroagro@gmail.com',
        subject: `Nuevo contacto: ${tipo} — ${nombre} ${apellido}`,
        html: `
          <h2>Nuevo contacto desde Pozero Agro</h2>
          <p><strong>Tipo:</strong> ${tipo}</p>
          <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
          ${dni ? `<p><strong>DNI:</strong> ${dni}</p>` : ''}
          <p><strong>WhatsApp:</strong> ${whatsapp}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${mensaje}</p>
        `,
      }),
    })
  } catch (e) {
    console.warn('Notificación admin falló:', e.message)
  }

  return res.status(200).json({ ok: true })
}
