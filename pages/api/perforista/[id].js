// pages/api/perforista/[id].js
// Devuelve los datos públicos de un perforista específico
// Sin whatsapp, teléfono, email, cuit, dni

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Falta id' })

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Campos públicos seguros (mismos que /api/directorio)
  const camposPublicos = [
    'id',
    'nombre',
    'apellido',
    'provincia',
    'localidad',
    'estado',
    'experiencia',
    'tipo_empresa',
    'profundidad_max',
    'diametros',
    'terrenos',
    'zonas_trabajo',
    'servicios',
    'tipo_bomba',
    'conoce_solar',
    'trabajos_por_mes',
    'descripcion',
    'lat',
    'lng',
    'instagram',
    'facebook',
    'visible_whatsapp',
    'visible_telefono',
    'visible_instagram',
    'visible_facebook',
    'visible_email',
    'created_at'
  ].join(',')

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/perforistas?id=eq.${id}&select=${camposPublicos}&limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`
        }
      }
    )

    if (!r.ok) {
      return res.status(500).json({ error: 'Error al consultar' })
    }

    const data = await r.json()
    if (!Array.isArray(data) || data.length === 0) {
      return res.status(404).json({ error: 'No encontrado' })
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')
    return res.status(200).json(data[0])
  } catch (e) {
    console.error('perforista error:', e.message)
    return res.status(500).json({ error: 'Error interno' })
  }
}
