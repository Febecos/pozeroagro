// pages/api/notificar-alta.js
// Manda 2 mails al registrarse un perforista:
//  1. Al admin (notificación de nuevo registro)
//  2. Al perforista (confirmación de datos recibidos)

import { emailNuevoRegistroAdmin, emailRegistroRecibido } from '../../lib/emailTemplate'

async function enviarMail({ from, to, subject, html }) {
  return await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, html })
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const datos = req.body || {}
  const { nombre, apellido, localidad, provincia, telefono, email, experiencia } = datos

  if (!email) {
    return res.status(400).json({ error: 'Falta email' })
  }

  const errores = []

  // ─── Mail 1: al admin ──────────────────────────────────────────────────
  try {
    const htmlAdmin = emailNuevoRegistroAdmin({
      nombre, apellido, localidad, provincia, telefono, email, experiencia
    })
    const r1 = await enviarMail({
      from: 'Pozero Agro <alta@pozeroagro.ar>',
      to: 'contacto@pozeroagro.ar',
      subject: `🆕 Nuevo perforista: ${nombre} ${apellido}`,
      html: htmlAdmin
    })
    if (!r1.ok) {
      const err = await r1.text()
      console.error('Resend admin error:', err)
      errores.push('admin')
    }
  } catch (e) {
    console.error('Mail admin falló:', e.message)
    errores.push('admin')
  }

  // ─── Mail 2: al perforista (confirmación con resumen de datos) ─────────
  try {
    const htmlPocero = emailRegistroRecibido({ datos })
    const r2 = await enviarMail({
      from: 'Pozero Agro <contacto@pozeroagro.ar>',
      to: email,
      subject: `✅ Recibimos tu registro — Pozero Agro`,
      html: htmlPocero
    })
    if (!r2.ok) {
      const err = await r2.text()
      console.error('Resend pocero error:', err)
      errores.push('pocero')
    }
  } catch (e) {
    console.error('Mail pocero falló:', e.message)
    errores.push('pocero')
  }

  if (errores.length === 0) {
    return res.json({ ok: true })
  }
  return res.status(500).json({ error: 'Error parcial enviando mails', fallaron: errores })
}
