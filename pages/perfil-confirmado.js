// pages/perfil-confirmado.js
import { useRouter } from 'next/router'

export default function PerfilConfirmado() {
  const router = useRouter()
  const { estado, id } = router.query

  const estados = {
    ok: {
      emoji: '✅',
      titulo: '¡Cambios aplicados!',
      mensaje: 'Tu perfil fue actualizado correctamente.',
      color: '#1B4F8A',
    },
    expirado: {
      emoji: '⏰',
      titulo: 'Link expirado',
      mensaje: 'El link de confirmación expiró. Volvé a tu perfil y guardá los cambios de nuevo.',
      color: '#E65100',
    },
    invalido: {
      emoji: '❌',
      titulo: 'Link inválido',
      mensaje: 'Este link no es válido o ya fue usado.',
      color: '#c0392b',
    },
    error: {
      emoji: '⚠️',
      titulo: 'Error al aplicar cambios',
      mensaje: 'Hubo un error. Intentá de nuevo más tarde.',
      color: '#c0392b',
    },
  }

  const info = estados[estado] || estados.invalido

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '2.5rem', textAlign: 'center', maxWidth: '420px', margin: '1rem', border: '1px solid #e0e0e8', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>{info.emoji}</div>
        <div style={{ fontSize: '22px', fontWeight: '700', color: info.color, marginBottom: '8px' }}>{info.titulo}</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          {info.mensaje}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {estado === 'ok' && id && (
            <a href={`/perforista/${id}`}
              style={{ display: 'inline-block', background: '#F26419', color: '#fff', padding: '11px 28px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              Ver mi perfil →
            </a>
          )}
          <a href="/"
            style={{ display: 'inline-block', background: estado === 'ok' ? 'transparent' : '#1B4F8A', color: estado === 'ok' ? '#1B4F8A' : '#fff', padding: '11px 28px', borderRadius: '8px', textDecoration: estado === 'ok' ? 'underline' : 'none', fontSize: '14px', fontWeight: '600' }}>
            Volver al directorio
          </a>
        </div>
      </div>
    </div>
  )
}
