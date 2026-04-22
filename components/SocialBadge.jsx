// components/SocialBadge.jsx
// Badge flotante tipo "notificación" que aparece en esquina inferior-izquierda
// mostrando el último pozero sumado al directorio.
//
// Aparece 3s después de cargar la página, se queda 6s, luego hace fade-out.
// Si el usuario lo cierra con X, no vuelve a aparecer en esa sesión.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { titleCase, nombreCompleto } from '../lib/formato'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function tiempoHace(fecha) {
  const ahora = new Date()
  const luego = new Date(fecha)
  const diffMs = ahora - luego
  const min = Math.floor(diffMs / 60000)
  const hrs = Math.floor(min / 60)
  const dias = Math.floor(hrs / 24)

  if (min < 1) return 'hace instantes'
  if (min < 60) return `hace ${min} min`
  if (hrs < 24) return `hace ${hrs} ${hrs === 1 ? 'hora' : 'horas'}`
  if (dias < 7) return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
  if (dias < 30) return `hace ${Math.floor(dias / 7)} sem`
  return `hace ${Math.floor(dias / 30)} ${Math.floor(dias / 30) === 1 ? 'mes' : 'meses'}`
}

export default function SocialBadge() {
  const [pozero, setPozero] = useState(null)
  const [visible, setVisible] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Si el usuario ya cerró el badge en esta sesión, no mostrarlo
    if (typeof window !== 'undefined' && sessionStorage.getItem('pza_badge_cerrado') === '1') return

    let mounted = true
    let timerShow, timerHide, timerFade

    async function cargar() {
      try {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/perforistas?select=id,nombre,apellido,localidad,provincia,estado,created_at&estado=in.(activo,cliente)&order=created_at.desc&limit=1`,
          { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
        )
        if (!r.ok) return
        const data = await r.json()
        if (!Array.isArray(data) || data.length === 0) return
        if (!mounted) return
        setPozero(data[0])

        // Mostrar a los 3s
        timerShow = setTimeout(() => {
          if (!mounted) return
          setVisible(true)

          // Empezar fade-out después de 6s
          timerFade = setTimeout(() => {
            if (!mounted) return
            setFadingOut(true)
            // Remover del DOM después del fade (400ms)
            timerHide = setTimeout(() => {
              if (!mounted) return
              setVisible(false)
            }, 400)
          }, 6000)
        }, 3000)
      } catch (e) { /* silencioso */ }
    }

    cargar()

    return () => {
      mounted = false
      clearTimeout(timerShow)
      clearTimeout(timerHide)
      clearTimeout(timerFade)
    }
  }, [])

  if (!visible || !pozero) return null

  const nombre = nombreCompleto(pozero.nombre, pozero.apellido)
  const localidad = titleCase(pozero.localidad)
  const cuando = tiempoHace(pozero.created_at)
  const iniciales = nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const esCliente = pozero.estado === 'cliente'

  function abrirFicha() {
    router.push(`/perforista/${pozero.id}`)
  }

  function cerrar(e) {
    e.stopPropagation()
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pza_badge_cerrado', '1')
    }
    setFadingOut(true)
    setTimeout(() => setVisible(false), 400)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={abrirFicha}
      className={`social-badge ${fadingOut ? 'fade-out' : 'fade-in'}`}
    >
      <div className="badge-avatar" aria-hidden="true">{iniciales}</div>
      <div className="badge-content">
        <div className="badge-head">
          <span className="badge-name">
            {nombre}
            {esCliente && (
              <svg className="badge-check" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2L14.39 5.42 18.24 4.76 18.9 8.61 22.32 11 18.9 13.39 18.24 17.24 14.39 16.58 12 20 9.61 16.58 5.76 17.24 5.1 13.39 1.68 11 5.1 8.61 5.76 4.76 9.61 5.42z"/>
                <path d="M10.5 13.5l-2-2 1.4-1.4 0.6 0.6 3.6-3.6 1.4 1.4z" fill="#fff"/>
              </svg>
            )}
          </span>
        </div>
        <div className="badge-detail">
          se sumó al directorio <span className="badge-time">{cuando}</span>
        </div>
        <div className="badge-location">📍 {localidad}</div>
      </div>
      <button onClick={cerrar} className="badge-close" aria-label="Cerrar notificación">×</button>

      <style jsx>{`
        .social-badge {
          position: fixed;
          bottom: 24px;
          left: 24px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 14px;
          box-shadow: 0 10px 30px rgba(15, 76, 129, 0.18);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 320px;
          min-width: 260px;
          z-index: 1000;
          cursor: pointer;
          font-family: "Inter", sans-serif;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .social-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 35px rgba(15, 76, 129, 0.24);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        .fade-in {
          animation: slideIn 0.4s ease forwards;
        }
        .fade-out {
          animation: slideOut 0.4s ease forwards;
        }
        .badge-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0F4C81, #22C55E);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }
        .badge-content {
          flex: 1;
          min-width: 0;
        }
        .badge-head {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .badge-name {
          font-weight: 600;
          font-size: 14px;
          color: #0F1E2E;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          line-height: 1.2;
        }
        .badge-check {
          color: #0F4C81;
          flex-shrink: 0;
        }
        .badge-detail {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        .badge-time {
          color: #94A3B8;
        }
        .badge-location {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 3px;
        }
        .badge-close {
          background: none;
          border: none;
          color: #cbd5e1;
          font-size: 20px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          margin-left: 2px;
          align-self: flex-start;
          transition: color 0.15s;
        }
        .badge-close:hover {
          color: #64748b;
        }
        @media (max-width: 480px) {
          .social-badge {
            bottom: 16px;
            left: 16px;
            right: 16px;
            max-width: none;
            min-width: 0;
          }
        }
      `}</style>
    </div>
  )
}

