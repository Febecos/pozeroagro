import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

export default function Confirmado() {
  const router = useRouter()
  const [estado, setEstado] = useState('cargando')

  useEffect(() => {
    // Supabase redirige acá con el token en el hash
    // El usuario ya quedó autenticado automáticamente
    const hash = window.location.hash
    if (hash.includes('access_token') || hash.includes('type=signup') || hash.includes('type=magiclink')) {
      setEstado('ok')
    } else {
      setEstado('ok') // igual mostramos confirmación
    }
  }, [])

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: '440px', margin: '1rem', border: '1px solid #e0e0e8', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: '#1B4F8A', marginBottom: '8px' }}>¡Email confirmado!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          Tu registro fue confirmado exitosamente.<br />
          Tu perfil está en revisión — en breve aparecés en el directorio de Pozero Agro.
        </div>
        <div style={{ background: '#e8f0fa', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#1B4F8A', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          🔔 Te avisaremos por email cuando tu perfil esté activo y visible para los productores.
        </div>
        <a href="/" style={{ display: 'inline-block', background: '#1B4F8A', color: '#fff', padding: '11px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Ver el directorio →
        </a>
      </div>
    </div>
  )
}
