// pages/api/perfil-guardar.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { emailConfirmarCambios } from '../../lib/emailTemplate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { perforista_id, cambios, email } = req.body

  if (!perforista_id || !cambios || !email) {
    return res.status(400).json({ error: 'Faltan datos.' })
  }

  // Verificar que el perforista existe y el email coincide
  const { data: perf, error: perfError } = await supabase
    .from('perforistas')
    .select('id, nombre, apellido, email')
    .eq('id', perforista_id)
    .eq('email', email)
    .single()

  if (perfError || !perf) {
    return res.status(403).json({ error: 'No autorizado.' })
  }

  // Generar token único
  const token = crypto.randomBytes(32).toString('hex')
  const expira = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24hs

  // Guardar cambios pendientes
  const { error: saveError } = await supabase
    .from('perforistas')
    .update({
      cambios_pendientes: cambios,
      cambios_token: token,
      cambios_token_expira: expira,
    })
    .eq('id', perforista_id)

  if (saveError) {
    return res.status(500).json({ error: 'Error al guardar.' })
  }

  // Enviar email de confirmación
  const urlConfirmar = `https://pozeroagro.ar/api/perfil-confirmar?token=${token}`

  try {
    const html = emailConfirmarCambios({
      nombre: perf.nombre,
      urlConfirmar
    })

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Pozero Agro <contacto@pozeroagro.ar>',
        to: email,
        subject: '✅ Confirmá los cambios en tu perfil — Pozero Agro',
        html,
      }),
    })
  } catch (e) {
    console.warn('Email de confirmación falló:', e.message)
  }

  return res.status(200).json({ ok: true })
}
