
// pages/api/directorio.js
// Devuelve la lista pública de perforistas SIN teléfonos ni WhatsApp
// Los contactos solo se obtienen via /api/contacto-perforista tras click

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  try {
    // Campos públicos seguros (sin whatsapp, telefono, email, cuit, dni)
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
      'quiere_info_equipos',
      'lat',
      'lng',
      'instagram',
      'facebook',
      'visible_whatsapp',
      'visible_telefono',
      'visible_instagram',
      'visible_facebook',
      'score_visibilidad',
      'created_at'
    ].join(',')

    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/perforistas?select=${camposPublicos}&estado=in.(activo,cliente)&order=score_visibilidad.desc,created_at.desc`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`
        }
      }
    )

    if (!r.ok) {
      return res.status(500).json({ error: 'Error al cargar directorio' })
    }

    const data = await r.json()

    // Cache corto - los perforistas no cambian tan seguido
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60')

    return res.status(200).json(data)
  } catch (e) {
    console.error('directorio error:', e.message)
    return res.status(500).json({ error: 'Error interno' })
  }
}
