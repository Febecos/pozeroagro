// components/AdBanner.jsx
export default function AdBanner({ campaign }) {
  if (!campaign) return null

  const handleClick = async () => {
    const res = await fetch('/api/ads/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: campaign.id,
        referrer_path: window.location.pathname,
      }),
    })
    const { redirect_url } = await res.json()
    if (redirect_url) {
      window.open(redirect_url, '_blank', 'noopener,noreferrer')
    }
  }

  const etiquetas = {
    propio:  { texto: 'Contenido propio',     color: 'bg-blue-100 text-blue-700' },
    febecos: { texto: 'Solución recomendada', color: 'bg-green-100 text-green-700' },
    tercero: { texto: 'Publicidad',           color: 'bg-gray-100 text-gray-600' },
  }

  const etiqueta = etiquetas[campaign.ad_type] || etiquetas.tercero

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 my-4">

      {/* Etiqueta visible — separación comercial obligatoria */}
      <span className={`text-xs font-semibold px-2 py-0.5 rounded mb-3 inline-block ${etiqueta.color}`}>
        {etiqueta.texto}
      </span>

      {/* Imagen opcional */}
      {campaign.imagen_url && (
        <img
          src={campaign.imagen_url}
          alt={campaign.nombre}
          className="w-full rounded mb-3 object-cover max-h-40"
        />
      )}

      {/* Nombre de la campaña */}
      <p className="text-sm font-medium text-gray-700 mb-3">
        {campaign.nombre}
      </p>

      {/* Botón CTA */}
      <button
        onClick={handleClick}
        className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition-colors text-sm font-medium"
      >
        {campaign.cta_texto || 'Ver más'}
      </button>

      {/* Disclaimer legal — obligatorio */}
      <p className="text-xs text-gray-400 mt-2 text-center leading-tight">
        {campaign.ad_type === 'tercero'
          ? 'Espacio publicitario pago.'
          : 'Contenido de la plataforma.'}{' '}
        No afecta rankings ni reputación de los perforistas.
      </p>

    </div>
  )
}
