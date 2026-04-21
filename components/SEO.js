// components/SEO.js
import Head from 'next/head'

const SITE_URL = 'https://pozeroagro.ar'
const SITE_NAME = 'Pozero Agro'
const DEFAULT_DESCRIPTION = 'Directorio nacional de perforistas rurales en Argentina. Encontrá tu Pozero por zona, contactá directo por WhatsApp. Sin comisiones, sin intermediarios.'
const DEFAULT_IMAGE = 'https://pozeroagro.ar/og-image.png'

/**
 * Componente SEO reutilizable
 * @param {string} title - Título de la página (se agrega " — Pozero Agro")
 * @param {string} description - Meta description
 * @param {string} path - Path de la página (ej: "/buscar")
 * @param {string} image - URL de imagen para OG (opcional)
 * @param {object} structuredData - JSON-LD opcional
 * @param {boolean} noindex - Si no queremos indexar (por defecto false)
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  structuredData = null,
  noindex = false
}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : `${SITE_NAME} — Conectamos campo con agua`
  const fullUrl = `${SITE_URL}${path}`

  return (
    <Head>
      {/* Básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      )}

      {/* Open Graph (Facebook, WhatsApp, LinkedIn) */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Geo y locale */}
      <meta name="geo.region" content="AR" />
      <meta name="geo.country" content="Argentina" />
      <meta name="language" content="Spanish" />
      <meta httpEquiv="content-language" content="es-AR" />

      {/* Theme y mobile */}
      <meta name="theme-color" content="#0F4C81" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

      {/* Favicon y iconos */}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32" />
      <link rel="icon" href="/favicon-16.png" type="image/png" sizes="16x16" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* JSON-LD estructurado */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}
