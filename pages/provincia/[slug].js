// pages/provincia/[slug].js
// Landing page dinámica por provincia — SEO local

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import SEO from '../../components/SEO'
import { registrarEvento, trackWhatsApp, trackTelefono } from '../../lib/tracker'
import { titleCase, nombreCompleto as formatNombreCompleto } from '../../lib/formato'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ─── DATOS DE LAS 24 PROVINCIAS ──────────────────────────────────────────────
// slug → usado en URL (sin acentos, minúsculas, guiones)
// nombre → mostrado al usuario y usado en base de datos
// contexto → párrafo descriptivo para SEO
const PROVINCIAS_DATA = {
  'buenos-aires': {
    nombre: 'Buenos Aires',
    contexto: 'Buenos Aires es la provincia agropecuaria más grande de Argentina. Sus miles de hectáreas de campo dedicadas a ganadería, soja, trigo y maíz requieren acceso constante a agua subterránea para riego, bebederos y consumo humano. La perforación rural es clave para productores del interior bonaerense, desde el oeste hasta la cuenca del Salado.'
  },
  'caba': {
    nombre: 'CABA',
    contexto: 'La Ciudad Autónoma de Buenos Aires cuenta con demandas puntuales de perforación para edificios, parques y proyectos especiales. Aunque es un entorno urbano, el servicio de perforistas rurales es requerido en zonas de quintas y proyectos cercanos.'
  },
  'catamarca': {
    nombre: 'Catamarca',
    contexto: 'Catamarca combina zonas áridas con valles productivos donde el agua es un recurso crítico. La perforación de pozos es fundamental para olivares, nogales, viñas y actividades ganaderas en el oeste argentino, especialmente con sistemas solares adaptados al clima.'
  },
  'chaco': {
    nombre: 'Chaco',
    contexto: 'En Chaco, el acceso al agua es determinante para la producción algodonera, ganadera y de cultivos extensivos. Las perforaciones rurales permiten desarrollar actividad productiva en zonas alejadas de fuentes superficiales de agua, con inversión creciente en bombeo solar.'
  },
  'chubut': {
    nombre: 'Chubut',
    contexto: 'Chubut requiere soluciones de perforación adaptadas a su estepa patagónica. Los productores ganaderos y agricultores del valle inferior del Río Chubut utilizan pozos para aguadas, riego y consumo, con tecnología robusta que soporte las condiciones del clima.'
  },
  'cordoba': {
    nombre: 'Córdoba',
    contexto: 'Córdoba es una de las provincias agropecuarias más importantes del país. La perforación rural es clave para el cinturón productor de soja, maíz y ganado, especialmente en el este cordobés, donde los campos dependen de pozos para complementar las precipitaciones.'
  },
  'corrientes': {
    nombre: 'Corrientes',
    contexto: 'Corrientes combina producción arrocera, ganadería y cultivos frutihortícolas. Las perforaciones rurales son esenciales para riego de arrozales, aguadas y consumo humano en establecimientos rurales del interior correntino.'
  },
  'entre-rios': {
    nombre: 'Entre Ríos',
    contexto: 'Entre Ríos tiene una matriz productiva diversa con avicultura, arroz, soja y ganadería. La perforación rural abastece desde granjas avícolas hasta sistemas de riego en zonas de islas y tierra firme, con perforaciones que pueden ir de pozos someros a profundos.'
  },
  'formosa': {
    nombre: 'Formosa',
    contexto: 'En Formosa, la perforación rural es crítica para productores ganaderos y agrícolas del oeste y centro de la provincia, donde el acceso al agua define la viabilidad de la actividad productiva. El bombeo solar es tendencia creciente en la zona.'
  },
  'jujuy': {
    nombre: 'Jujuy',
    contexto: 'Jujuy tiene perfil productor con tabaco, caña de azúcar, hortalizas y cítricos. Las perforaciones rurales son claves para sistemas de riego en las zonas bajas y para acceso a agua en la Puna.'
  },
  'la-pampa': {
    nombre: 'La Pampa',
    contexto: 'La Pampa combina ganadería extensiva y agricultura con limitaciones hídricas importantes. Las perforaciones rurales son esenciales para bebederos, aguadas, riego y consumo doméstico en establecimientos rurales de toda la provincia.'
  },
  'la-rioja': {
    nombre: 'La Rioja',
    contexto: 'La Rioja es provincia vitivinícola, olivícola y frutícola donde el acceso a agua subterránea define la actividad productiva. Las perforaciones profundas y sistemas de bombeo son clave para sostener la producción agrícola bajo condiciones áridas.'
  },
  'mendoza': {
    nombre: 'Mendoza',
    contexto: 'Mendoza es la capital del vino argentino y tiene larga tradición en perforaciones rurales para riego de viñas, olivares y frutales. La eficiencia hídrica y el uso de sistemas solares para bombeo son cada vez más importantes para la región.'
  },
  'misiones': {
    nombre: 'Misiones',
    contexto: 'Misiones tiene producción de yerba mate, té, tabaco y forestación. Aunque es provincia húmeda, las perforaciones rurales abastecen consumo humano, agroindustria y establecimientos alejados de fuentes superficiales.'
  },
  'neuquen': {
    nombre: 'Neuquén',
    contexto: 'Neuquén combina fruticultura en los valles con ganadería ovina en la meseta. Las perforaciones rurales son clave para el riego de chacras frutícolas y para abastecer puestos ganaderos alejados en zonas patagónicas.'
  },
  'rio-negro': {
    nombre: 'Río Negro',
    contexto: 'Río Negro es provincia frutícola de referencia con peras y manzanas del Alto Valle. Las perforaciones rurales complementan los sistemas de riego en chacras y abastecen establecimientos ganaderos en la línea sur.'
  },
  'salta': {
    nombre: 'Salta',
    contexto: 'Salta tiene producción diversa con tabaco, caña, cítricos, soja y ganadería. Las perforaciones rurales son esenciales tanto en zonas de riego intensivo como en establecimientos ganaderos del Chaco salteño.'
  },
  'san-juan': {
    nombre: 'San Juan',
    contexto: 'San Juan es provincia vitivinícola y olivícola con limitaciones hídricas severas. Las perforaciones rurales y el uso eficiente de agua definen la viabilidad productiva en sus valles irrigados.'
  },
  'san-luis': {
    nombre: 'San Luis',
    contexto: 'San Luis combina ganadería con agricultura en zonas de riego. Las perforaciones rurales son clave para bebederos, aguadas y sistemas de riego complementario.'
  },
  'santa-cruz': {
    nombre: 'Santa Cruz',
    contexto: 'Santa Cruz tiene perfil ganadero ovino con estancias extensas donde las perforaciones rurales son clave para garantizar agua en todo el año bajo condiciones patagónicas adversas.'
  },
  'santa-fe': {
    nombre: 'Santa Fe',
    contexto: 'Santa Fe es una de las principales provincias productoras de soja, trigo y leche del país. Las perforaciones rurales son vitales para tambos, riego complementario, aguadas y consumo en establecimientos del centro y norte santafesino.'
  },
  'santiago-del-estero': {
    nombre: 'Santiago del Estero',
    contexto: 'Santiago del Estero combina ganadería, algodón y soja en un clima de calor y baja precipitación. Las perforaciones rurales son absolutamente determinantes para la actividad productiva en toda la provincia.'
  },
  'tierra-del-fuego': {
    nombre: 'Tierra del Fuego',
    contexto: 'Tierra del Fuego tiene actividad ganadera ovina principalmente. Las perforaciones son utilizadas en estancias y establecimientos rurales para garantizar disponibilidad de agua todo el año.'
  },
  'tucuman': {
    nombre: 'Tucumán',
    contexto: 'Tucumán es capital de la producción azucarera y también fuerte en cítricos. Las perforaciones rurales abastecen sistemas de riego de citricultura y cañaverales, así como establecimientos ganaderos del interior tucumano.'
  },
}

function normalizar(texto) {
  if (!texto) return ''
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export async function getStaticPaths() {
  const paths = Object.keys(PROVINCIAS_DATA).map(slug => ({ params: { slug } }))
  return {
    paths,
    fallback: false // Solo renderizamos las 24 conocidas, el resto tira 404
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params
  const data = PROVINCIAS_DATA[slug]

  if (!data) return { notFound: true }

  // Cargar perforistas de esta provincia (con normalización para tolerar datos sin tilde)
  let perforistas = []
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/perforistas?select=*&estado=in.(activo,cliente)&order=created_at.asc`,
      {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        }
      }
    )
    if (res.ok) {
      const todos = await res.json()
      // Filtrar por provincia normalizando
      const nombreNormalizado = normalizar(data.nombre)
      perforistas = todos.filter(p => normalizar(p.provincia) === nombreNormalizado)
      // Orden: clientes primero, después activos (ambos más antiguos arriba)
      perforistas.sort((a, b) => {
        const aEsCliente = a.estado === 'cliente' ? 0 : 1
        const bEsCliente = b.estado === 'cliente' ? 0 : 1
        if (aEsCliente !== bEsCliente) return aEsCliente - bEsCliente
        return new Date(a.created_at) - new Date(b.created_at)
      })
    }
  } catch (e) {
    console.warn('Error cargando perforistas:', e.message)
  }

  return {
    props: {
      slug,
      nombre: data.nombre,
      contexto: data.contexto,
      perforistasIniciales: perforistas
    },
    revalidate: 60 // Regenera cada 60s — los cambios se ven casi en tiempo real
  }
}

export default function LandingProvincia({ slug, nombre, contexto, perforistasIniciales }) {
  const router = useRouter()
  const [perforistas] = useState(perforistasIniciales || [])

  useEffect(() => {
    registrarEvento('landing_provincia_vista', null, { provincia: nombre })
  }, [nombre])

  // JSON-LD para SEO local
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Pozeros en ${nombre}`,
    "description": `Directorio de perforistas rurales en ${nombre}, Argentina. ${contexto.slice(0, 140)}`,
    "url": `https://pozeroagro.ar/provincia/${slug}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Inicio", "item": "https://pozeroagro.ar" },
        { "@type": "ListItem", "position": 2, "name": "Buscar Pozero", "item": "https://pozeroagro.ar/buscar" },
        { "@type": "ListItem", "position": 3, "name": nombre, "item": `https://pozeroagro.ar/provincia/${slug}` }
      ]
    },
    ...(perforistas.length > 0 && {
      "mainEntity": {
        "@type": "ItemList",
        "numberOfItems": perforistas.length,
        "itemListElement": perforistas.slice(0, 10).map((p, i) => ({
          "@type": "ListItem",
          "position": i + 1,
          "item": {
            "@type": "LocalBusiness",
            "name": formatNombreCompleto(p.nombre, p.apellido),
            "address": {
              "@type": "PostalAddress",
              "addressLocality": titleCase(p.localidad),
              "addressRegion": titleCase(p.provincia),
              "addressCountry": "AR"
            },
            "url": `https://pozeroagro.ar/perforista/${p.id}`
          }
        }))
      }
    })
  }

  function whatsappNum(p) {
    const num = p.whatsapp || p.telefono || ''
    return num.replace(/\D/g, '')
  }

  function irAFicha(id) {
    registrarEvento('card_vista', id, { origen: `landing_provincia_${slug}` })
    router.push(`/perforista/${id}`)
  }

  return (
    <>
      <SEO
        path={`/provincia/${slug}`}
        title={`Pozeros en ${nombre}`}
        description={`Encontrá perforistas rurales en ${nombre}. ${perforistas.length > 0 ? `${perforistas.length} ${perforistas.length === 1 ? 'Pozero disponible' : 'Pozeros disponibles'}.` : ''} Directorio con contacto directo por WhatsApp, sin comisiones.`}
        structuredData={jsonLd}
      />
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --azul-pozero: #0F4C81;
          --azul-pozero-deep: #0A3A63;
          --gris-agro: #94A3B8;
          --off-white: #F8FAFC;
          --verde-solar: #22C55E;
          --ink: #0F1E2E;
          --line: rgba(15, 76, 129, 0.12);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          color: var(--ink);
          background: var(--off-white);
          min-height: 100vh;
        }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div className="page">
        {/* ─── HEADER ─── */}
        <header className="site-header">
          <div className="header-inner">
            <a href="/" className="logo" aria-label="Pozero Agro — inicio">
              <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
                <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
                <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
              </svg>
              <span className="logo-wordmark">
                <span className="pozero">POZERO</span>
                <span className="agro">AGRO</span>
              </span>
            </a>
          </div>
        </header>

        {/* ─── MINI HERO AZUL ─── */}
        <section className="minihero">
          <div className="minihero-inner">
            <nav className="breadcrumb" aria-label="Migas de pan">
              <a href="/">Inicio</a>
              <span>›</span>
              <a href="/buscar">Pozeros</a>
              <span>›</span>
              <span className="current">{nombre}</span>
            </nav>
            <h1 className="mh-title">Pozeros en {nombre}</h1>
            <p className="mh-sub">
              {perforistas.length > 0
                ? `${perforistas.length} ${perforistas.length === 1 ? 'perforista disponible' : 'perforistas disponibles'} en ${nombre}. Contactalos directo.`
                : `Directorio de perforistas rurales en ${nombre}. Contacto directo por WhatsApp.`
              }
            </p>
          </div>
        </section>

        {/* ─── CONTENIDO ─── */}
        <main className="content">
          <div className="content-inner">

            {/* ─── CONTEXTO ─── */}
            <section className="contexto">
              <h2 className="h2">Perforación rural en {nombre}</h2>
              <p className="contexto-texto">{contexto}</p>
            </section>

            {/* ─── LISTA DE PERFORISTAS ─── */}
            {perforistas.length > 0 ? (
              <section className="listado">
                <h2 className="h2">{perforistas.length === 1 ? 'Pozero disponible' : 'Pozeros disponibles'}</h2>
                <div className="cards-grid">
                  {perforistas.map(p => {
                    const wa = whatsappNum(p)
                    const esCliente = p.estado === 'cliente'
                    const nombreFmt = formatNombreCompleto(p.nombre, p.apellido)
                    const localidadFmt = titleCase(p.localidad)
                    return (
                      <div key={p.id} onClick={() => irAFicha(p.id)} className="card">
                        <div className="card-head">
                          <div className="avatar">
                            {nombreFmt.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </div>
                          <div className="card-identity">
                            <div className={`card-name ${esCliente ? 'is-cliente' : ''}`}>
                              {nombreFmt}
                              {esCliente && (
                                <span className="verified-check" title="Cliente verificado Pozero Agro" aria-label="Verificado">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2L14.39 5.42 18.24 4.76 18.9 8.61 22.32 11 18.9 13.39 18.24 17.24 14.39 16.58 12 20 9.61 16.58 5.76 17.24 5.1 13.39 1.68 11 5.1 8.61 5.76 4.76 9.61 5.42z"/>
                                    <path d="M10.5 13.5l-2-2 1.4-1.4 0.6 0.6 3.6-3.6 1.4 1.4z" fill="#fff"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="card-location">📍 {localidadFmt}</div>
                          </div>
                        </div>
                        <div className="card-tags">
                          {p.profundidad_max && (
                            <span className="tag tag-depth">⬇️ {p.profundidad_max}m</span>
                          )}
                          {p.conoce_solar === 'Si, ya instale sistemas solares' && (
                            <span className="tag tag-solar">☀️ Solar</span>
                          )}
                        </div>
                        <div className="card-actions" onClick={e => e.stopPropagation()}>
                          {p.visible_telefono && p.telefono && (
                            <a href={`tel:${p.telefono}`}
                              onClick={() => trackTelefono(p.id, p.telefono, nombreFmt)}
                              className="btn-phone">
                              📞 Llamar
                            </a>
                          )}
                          {wa && (
                            <button
                              onClick={() => trackWhatsApp(p.id, wa, nombreFmt)}
                              className="btn-wa">
                              💬 WA
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ) : (
              <section className="empty">
                <div className="empty-icon">🔍</div>
                <h2 className="empty-title">Todavía no hay Pozeros registrados en {nombre}</h2>
                <p className="empty-desc">
                  ¿Sos perforista en {nombre}? Sumate gratis al directorio nacional y empezá a recibir contactos de productores de tu zona.
                </p>
                <div className="empty-ctas">
                  <a href="/registrarme" className="cta-primary">Sumar mi perfil</a>
                  <a href="/buscar" className="cta-secondary">Ver otras provincias</a>
                </div>
              </section>
            )}

            {/* ─── CTA FINAL ─── */}
            {perforistas.length > 0 && (
              <section className="cta-final">
                <h2 className="cta-title">¿No encontraste lo que buscabas?</h2>
                <p className="cta-sub">Buscá por nombre o localidad específica en el directorio completo.</p>
                <div className="cta-buttons">
                  <a href="/buscar" className="cta-primary">Ver todo el directorio</a>
                  <a href="/registrarme" className="cta-secondary">Soy Pozero, sumarme</a>
                </div>
              </section>
            )}

          </div>
        </main>

        {/* ─── FOOTER ─── */}
        <footer className="site-footer">
          <div className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <span className="sep">·</span>
            <a href="/terminos#privacidad">Política de privacidad</a>
            <span className="sep">·</span>
            <a href="/como-funciona">Cómo funciona</a>
            <span className="sep">·</span>
            <a href="/contacto">Contacto</a>
          </div>
          <div className="copyright">© 2026 Pozero Agro · Argentina</div>
        </footer>
      </div>

      <style jsx>{`
        .page { min-height: 100vh; display: flex; flex-direction: column; }

        .site-header {
          background: #fff;
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
          position: sticky; top: 0; z-index: 20;
        }
        .header-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 20px;
          display: flex; align-items: center;
        }
        .logo { display: flex; align-items: center; gap: 10px; }
        .logo-wordmark {
          display: flex; align-items: baseline; gap: 5px;
          font-family: "Montserrat", sans-serif; line-height: 1;
        }
        .pozero {
          font-weight: 800; font-size: 18px; color: var(--azul-pozero);
        }
        .agro {
          font-weight: 500; letter-spacing: 0.04em; font-size: 13px;
          color: var(--gris-agro); text-transform: uppercase;
        }

        .minihero {
          background: linear-gradient(135deg, var(--azul-pozero) 0%, var(--azul-pozero-deep) 100%);
          padding: 32px 20px 28px;
          color: #fff;
        }
        .minihero-inner {
          max-width: 1200px; margin: 0 auto;
        }
        .breadcrumb {
          font-size: 12px;
          color: rgba(255,255,255,0.65);
          margin-bottom: 12px;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .breadcrumb a:hover { color: #fff; }
        .breadcrumb .current {
          color: rgba(255,255,255,0.85);
          font-weight: 500;
        }
        .mh-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 800;
          font-size: clamp(28px, 5vw, 42px);
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .mh-sub {
          font-size: clamp(14px, 1.4vw, 16px);
          color: rgba(255,255,255,0.85);
          max-width: 720px;
          line-height: 1.4;
        }

        .content {
          flex: 1;
          padding: 32px 20px;
        }
        .content-inner {
          max-width: 1000px;
          margin: 0 auto;
        }

        .contexto {
          background: #fff;
          padding: 28px;
          border-radius: 12px;
          border: 1px solid var(--line);
          margin-bottom: 28px;
        }
        .h2 {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: var(--ink);
          margin-bottom: 14px;
          letter-spacing: -0.01em;
        }
        .contexto-texto {
          font-size: 15px;
          line-height: 1.7;
          color: #334155;
        }

        .listado { margin-bottom: 32px; }
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 14px;
        }

        .card {
          background: #fff;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid #e5e9f0;
          padding: 16px;
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card:hover {
          box-shadow: 0 8px 24px -6px rgba(15, 76, 129, 0.18);
          border-color: rgba(15, 76, 129, 0.25);
          transform: translateY(-1px);
        }
        .card-head {
          display: flex; align-items: center; gap: 12px;
          margin-bottom: 12px;
        }
        .avatar {
          width: 44px; height: 44px; border-radius: 50%;
          background: #e8f0fa;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 15px;
          color: var(--azul-pozero);
          flex-shrink: 0;
          font-family: "Montserrat", sans-serif;
        }
        .card-identity { min-width: 0; flex: 1; }
        .card-name {
          font-weight: 600; font-size: 15px;
          color: #4a5568;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .card-name.is-cliente { color: var(--azul-pozero); }
        .verified-check {
          display: inline-flex;
          color: var(--azul-pozero);
          flex-shrink: 0;
          line-height: 0;
        }
        .card-location {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 2px;
        }
        .card-tags {
          display: flex; gap: 4px; flex-wrap: wrap;
          margin-bottom: 12px; min-height: 20px;
        }
        .tag {
          font-size: 10px; padding: 3px 7px;
          border-radius: 4px; font-weight: 500;
        }
        .tag-depth { background: #f3e8ff; color: #6a0dad; }
        .tag-solar { background: #fff3e0; color: #E65100; }

        .card-actions {
          display: flex; gap: 6px;
        }
        .btn-phone {
          flex: 1; padding: 8px; border-radius: 6px;
          border: 1px solid var(--azul-pozero);
          background: #e8f0fa; color: var(--azul-pozero);
          font-size: 11px; text-align: center; font-weight: 600;
          transition: background 0.15s;
        }
        .btn-phone:hover {
          background: var(--azul-pozero); color: #fff;
        }
        .btn-wa {
          flex: 1; padding: 8px; border-radius: 6px;
          background: #25D366; color: #fff;
          font-size: 11px; text-align: center; font-weight: 600;
          border: none; cursor: pointer;
          transition: background 0.15s;
        }
        .btn-wa:hover { background: #1EB758; }

        .empty {
          background: #fff;
          padding: 48px 24px;
          border-radius: 12px;
          border: 1px solid var(--line);
          text-align: center;
        }
        .empty-icon {
          font-size: 48px; margin-bottom: 16px;
        }
        .empty-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: 20px;
          color: var(--ink);
          margin-bottom: 10px;
        }
        .empty-desc {
          font-size: 14px;
          color: #334155;
          max-width: 480px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }
        .empty-ctas {
          display: flex; gap: 10px; justify-content: center;
          flex-wrap: wrap;
        }

        .cta-final {
          text-align: center;
          background: #fff;
          padding: 32px 24px;
          border-radius: 12px;
          border: 1px solid var(--line);
          margin-top: 28px;
        }
        .cta-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: 22px;
          color: var(--ink);
          margin-bottom: 8px;
        }
        .cta-sub {
          font-size: 14px;
          color: #94A3B8;
          margin-bottom: 20px;
        }
        .cta-buttons {
          display: flex; gap: 10px; justify-content: center;
          flex-wrap: wrap;
        }
        .cta-primary {
          display: inline-block;
          padding: 12px 24px;
          background: var(--azul-pozero);
          color: #fff;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .cta-primary:hover { background: var(--azul-pozero-deep); }
        .cta-secondary {
          display: inline-block;
          padding: 12px 24px;
          background: transparent;
          color: var(--azul-pozero);
          border: 1.5px solid var(--azul-pozero);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .cta-secondary:hover {
          background: var(--azul-pozero);
          color: #fff;
        }

        .site-footer {
          background: var(--azul-pozero);
          padding: 20px; text-align: center;
        }
        .footer-links {
          display: flex; justify-content: center;
          gap: 12px; flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .footer-links a {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
        }
        .footer-links a:hover { color: #fff; }
        .sep { font-size: 12px; color: rgba(255,255,255,0.3); }
        .copyright {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
        }

        @media (max-width: 640px) {
          .cards-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  )
}
