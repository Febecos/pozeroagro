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

  const config = {
    propio:  { label: 'Contenido propio'     },
    febecos: { label: 'Solución recomendada' },
    tercero: { label: 'Publicidad'           },
  }

  const c = config[campaign.ad_type] || config.tercero

  return (
    <div style={{
      border: '0.5px solid #e0e0e8',
      borderRadius: '8px',
      padding: '10px 14px',
      background: '#fff',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    }}>

      {/* Etiqueta discreta */}
      <span style={{
        fontSize: '9px',
        fontWeight: '600',
        color: '#b0b0b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        flexShrink: 0,
        borderRight: '1px solid #e0e0e8',
        paddingRight: '10px',
      }}>
        {c.label}
      </span>

      {/* Nombre */}
      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: '#444', lineHeight: '1.3' }}>
          {campaign.nombre}
        </div>
        <div style={{ fontSize: '10px', color: '#c0c0c8', marginTop: '2px' }}>
          No afecta rankings ni reputación.
        </div>
      </div>

      {/* Imagen opcional */}
      {campaign.imagen_url && (
        <img
          src={campaign.imagen_url}
          alt={campaign.nombre}
          style={{ width: '60px', height: '36px', objectFit: 'contain', borderRadius: '4px', flexShrink: 0, opacity: 0.85 }}
        />
      )}

      {/* Botón CTA */}
      <button
        onClick={handleClick}
        style={{
          flexShrink: 0,
          background: 'transparent',
          color: '#1B4F8A',
          padding: '6px 14px',
          borderRadius: '6px',
          border: '1px solid #1B4F8A',
          fontSize: '12px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {campaign.cta_texto || 'Ver más'}
      </button>

    </div>
  )
}
