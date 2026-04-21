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

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'contacto@pozeroagro.ar',
        to: 'contacto@pozeroagro.ar',
        subject: `📬 Nuevo contacto: ${tipoLabel} — ${nombre} ${apellido}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f5f7fa;">
            <div style="background: #1B4F8A; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">📬 Nuevo contacto en Pozero Agro</h2>
            </div>
            <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e8;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888; width: 140px;">Tipo</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 600;">${tipoLabel}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">Nombre</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 600;">${nombre} ${apellido}</td>
                </tr>
                ${dni ? `
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">DNI</td>
                  <td style="padding: 8px 0; color: #333;">${dni}</td>
                </tr>` : ''}
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">WhatsApp</td>
                  <td style="padding: 8px 0; color: #333;">${whatsapp}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">Email</td>
                  <td style="padding: 8px 0; color: #333;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888; vertical-align: top;">Mensaje</td>
                  <td style="padding: 8px 0; color: #333; line-height: 1.6;">${mensaje}</td>
                </tr>
              </table>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://pozeroagro.ar/admin"
                   style="background: #1B4F8A; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  Ver panel admin →
                </a>
              </div>
            </div>
          </div>
        `,
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
