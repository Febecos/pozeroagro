// pages/api/notificar-aprobacion.js
// Manda un mail al pocero cuando el admin aprueba su perfil

import { createClient } from '@supabase/supabase-js'
import { emailAprobacionPerforista } from '../../lib/emailTemplate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { perforista_id } = req.body
  if (!perforista_id) return res.status(400).json({ error: 'Falta perforista_id' })

  try {
    // Traer los datos del perforista
    const { data: perf, error } = await supabase
      .from('perforistas')
      .select('id, nombre, apellido, email, estado')
      .eq('id', perforista_id)
      .single()

    if (error || !perf) {
      return res.status(404).json({ error: 'Perforista no encontrado' })
    }

    if (!perf.email) {
      return res.status(400).json({ error: 'El perforista no tiene email' })
    }

    // Solo mandamos mail si está activo o cliente
    if (!['activo', 'cliente'].includes(perf.estado)) {
      return res.status(400).json({ error: 'Perforista no activo' })
    }

    const html = emailAprobacionPerforista({
      nombre: perf.nombre,
      perforista_id: perf.id
    })

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Pozero Agro <contacto@pozeroagro.ar>',
        to: perf.email,
        subject: `✅ Tu perfil está activo — Pozero Agro`,
        html
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Resend error:', err)
      return res.status(500).json({ error: 'Error enviando mail' })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('Error notificar-aprobacion:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
