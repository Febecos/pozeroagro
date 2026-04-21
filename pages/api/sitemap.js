// pages/api/sitemap.js
// Sitemap dinámico — se regenera con cada request, lista todas las pantallas + cada perforista activo

const SITE_URL = 'https://pozeroagro.ar'

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Páginas estáticas con prioridades
  const paginasEstaticas = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/buscar', changefreq: 'daily', priority: '0.9' },
    { loc: '/registrarme', changefreq: 'weekly', priority: '0.8' },
    { loc: '/contacto', changefreq: 'monthly', priority: '0.5' },
    { loc: '/terminos', changefreq: 'monthly', priority: '0.3' },
  ]

  // Landings por provincia (24 provincias)
  const provinciasSlugs = [
    'buenos-aires','caba','catamarca','chaco','chubut',
    'cordoba','corrientes','entre-rios','formosa','jujuy',
    'la-pampa','la-rioja','mendoza','misiones','neuquen',
    'rio-negro','salta','san-juan','san-luis','santa-cruz',
    'santa-fe','santiago-del-estero','tierra-del-fuego','tucuman'
  ]
  const landingsProvinciales = provinciasSlugs.map(slug => ({
    loc: `/provincia/${slug}`,
    changefreq: 'weekly',
    priority: '0.85'
  }))

  // Páginas dinámicas (perforistas activos y clientes)
  let perforistas = []
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/perforistas?select=id,updated_at,created_at&estado=in.(activo,cliente)`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    )
    if (r.ok) perforistas = await r.json()
  } catch (e) {
    console.warn('Sitemap: error cargando perforistas', e.message)
  }

  const hoy = new Date().toISOString().split('T')[0]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginasEstaticas.map(p => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${landingsProvinciales.map(p => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <lastmod>${hoy}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${perforistas.map(p => {
    const lastmod = (p.updated_at || p.created_at || new Date().toISOString()).split('T')[0]
    return `  <url>
    <loc>${SITE_URL}/perforista/${p.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  }).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600') // 1h cache
  res.status(200).send(xml)
}
