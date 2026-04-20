// pages/api/perfil-guardar.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'contacto@pozeroagro.ar',
        to: email,
        subject: '✅ Confirmá los cambios en tu perfil — Pozero Agro',
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f5f7fa;">
            <div style="background: #1B4F8A; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">Confirmá los cambios en tu perfil</h2>
            </div>
            <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e8;">
              <p style="font-size: 14px; color: #444; line-height: 1.6;">
                Hola <strong>${perf.nombre}</strong>, recibimos una solicitud para modificar tu perfil en Pozero Agro.
              </p>
              <p style="font-size: 14px; color: #444; line-height: 1.6;">
                Si fuiste vos, hacé click en el botón para confirmar los cambios. Si no fuiste vos, ignorá este email — tus datos no cambiarán.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${urlConfirmar}"
                   style="background: #1B4F8A; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
                  Confirmar cambios →
                </a>
              </div>
              <p style="font-size: 12px; color: #aaa; text-align: center; line-height: 1.6;">
                Este link expira en 24 horas.<br/>
                Si no solicitaste cambios, ignorá este mensaje.
              </p>
            </div>
          </div>
        `,
      }),
    })
  } catch (e) {
    console.warn('Email de confirmación falló:', e.message)
  }

  return res.status(200).json({ ok: true })
}
