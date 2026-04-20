export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { nombre, apellido, localidad, provincia, telefono, email, experiencia } = req.body

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'alta@pozeroagro.ar',
        to: 'pozeroagro@gmail.com',
        subject: `🆕 Nuevo perforista registrado: ${nombre} ${apellido}`,
        html: `
          <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f5f7fa;">
            <div style="background: #1B4F8A; padding: 16px 24px; border-radius: 8px 8px 0 0;">
              <h2 style="color: #fff; margin: 0; font-size: 18px;">🆕 Nuevo perforista en Pozero Agro</h2>
            </div>
            <div style="background: #fff; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e8;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888; width: 140px;">Nombre</td>
                  <td style="padding: 8px 0; color: #333; font-weight: 600;">${nombre} ${apellido}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">Localidad</td>
                  <td style="padding: 8px 0; color: #333;">${localidad}, ${provincia}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">Teléfono</td>
                  <td style="padding: 8px 0; color: #333;">${telefono || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f0f0;">
                  <td style="padding: 8px 0; color: #888;">Email</td>
                  <td style="padding: 8px 0; color: #333;">${email || '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #888;">Experiencia</td>
                  <td style="padding: 8px 0; color: #333;">${experiencia || '-'}</td>
                </tr>
              </table>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://pozeroagro.ar/admin" 
                   style="background: #1B4F8A; color: #fff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
                  Ver panel admin →
                </a>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: #aaa; text-align: center;">
                Este perforista está en estado <strong>pendiente</strong> y necesita aprobación.
              </p>
            </div>
          </div>
        `
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Resend error:', err)
      return res.status(500).json({ error: 'Error enviando mail' })
    }

    return res.json({ ok: true })

  } catch (e) {
    console.error('Error notificación alta:', e.message)
    return res.status(500).json({ error: e.message })
  }
}
