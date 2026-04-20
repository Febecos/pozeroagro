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
    propio:  { label: 'Contenido propio',     labelBg: '#dbeafe', labelColor: '#1d4ed8', borderColor: '#bfdbfe', bg: '#f0f7ff' },
    febecos: { label: 'Solución recomendada', labelBg: '#dcfce7', labelColor: '#15803d', borderColor: '#bbf7d0', bg: '#f0fdf4' },
    tercero: { label: 'Publicidad',           labelBg: '#f3f4f6', labelColor: '#6b7280', borderColor: '#e5e7eb', bg: '#fafafa' },
  }

  const c = config[campaign.ad_type] || config.tercero

  return (
    <div style={{
      border: `1px solid ${c.borderColor}`,
      borderRadius: '10px',
      padding: '12px 16px',
      background: c.bg,
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      flexWrap: 'wrap',
    }}>

      {/* Izquierda: etiqueta + nombre */}
      <div style={{ flex: '1 1 160px', minWidth: 0 }}>
        <span style={{
          fontSize: '10px', fontWeight: '700',
          padding: '2px 8px', borderRadius: '4px',
          background: c.labelBg, color: c.labelColor,
          display: 'inline-block', marginBottom: '6px'
        }}>
          {c.label}
        </span>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a1a2e', lineHeight: '1.3' }}>
          {campaign.nombre}
        </div>
        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
          {campaign.ad_type === 'tercero' ? 'Espacio publicitario pago.' : 'Contenido de la plataforma.'}{' '}
          No afecta rankings.
        </div>
      </div>

      {/* Imagen opcional */}
      {campaign.imagen_url && (
        <img
          src={campaign.imagen_url}
          alt={campaign.nombre}
          style={{ width: '80px', height: '50px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }}
        />
      )}

      {/* Botón CTA */}
      <button
        onClick={handleClick}
        style={{
          flexShrink: 0,
          background: '#F26419', color: '#fff',
          padding: '8px 18px', borderRadius: '6px',
          border: 'none', fontSize: '13px', fontWeight: '600',
          cursor: 'pointer', whiteSpace: 'nowrap'
        }}
      >
        {campaign.cta_texto || 'Ver más'}
      </button>

    </div>
  )
}
