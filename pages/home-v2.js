// pages/home-v2.js
// Home v2 — mobile-first, alta conversión, dos caminos claros
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function HomeV2() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [ubicacionSolicitada, setUbicacionSolicitada] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function usarUbicacion() {
    setUbicacionSolicitada(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const { latitude, longitude } = pos.coords
          router.push(`/?lat=${latitude}&lng=${longitude}`)
        },
        () => router.push('/')
      )
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", minHeight: '100vh', background: '#FAFAF7', overflowX: 'hidden' }}>

      {/* HEADER */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 1.25rem',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(250,250,247,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#1B4F8A',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 100 100">
              <polygon points="15,15 85,15 50,72" fill="#fff"/>
              <rect x="44" y="8" width="12" height="36" fill="#1B4F8A" rx="2"/>
              <circle cx="50" cy="80" r="9" fill="#fff"/>
              <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
            </svg>
          </div>
          <span style={{ fontSize: '17px', fontWeight: '700', color: '#0D1B2A', letterSpacing: '-0.3px' }}>
            Pozero Agro
          </span>
        </div>
        <a href="#como-funciona" style={{
          fontSize: '13px', color: '#555', textDecoration: 'none',
          padding: '6px 12px', borderRadius: '6px',
          border: '1px solid #ddd', background: '#fff',
          fontFamily: "'Helvetica Neue', sans-serif",
        }}>
          Como funciona
        </a>
      </header>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 1.25rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #EEF4FF 0%, #FAFAF7 60%)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Decoración de fondo */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px',
          background: 'radial-gradient(circle, rgba(27,79,138,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#fff', border: '1px solid #D4E4F7',
          borderRadius: '20px', padding: '5px 14px',
          fontSize: '12px', color: '#1B4F8A', fontWeight: '600',
          fontFamily: "'Helvetica Neue', sans-serif",
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(27,79,138,0.08)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(8px)',
          transition: 'all 0.5s ease 0.1s',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          Directorio nacional de perforistas
        </div>

        {/* Titulo principal */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 8vw, 4rem)',
          fontWeight: '800',
          color: '#0D1B2A',
          lineHeight: '1.1',
          letterSpacing: '-1px',
          marginBottom: '16px',
          maxWidth: '680px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease 0.2s',
        }}>
          Encontra poseros<br />
          <span style={{ color: '#1B4F8A' }}>cerca tuyo</span>
        </h1>

        {/* Subtitulo */}
        <p style={{
          fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          color: '#556',
          lineHeight: '1.5',
          marginBottom: '40px',
          maxWidth: '420px',
          fontFamily: "'Helvetica Neue', sans-serif",
          fontWeight: '400',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease 0.3s',
        }}>
          Conecta con perforistas por zona en toda Argentina
        </p>

        {/* CTA BOTONES */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px',
          width: '100%', maxWidth: '360px',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease 0.4s',
        }}>
          <a href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '16px 24px',
            background: '#1B4F8A',
            color: '#fff',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '17px',
            fontWeight: '700',
            fontFamily: "'Helvetica Neue', sans-serif",
            boxShadow: '0 4px 20px rgba(27,79,138,0.3)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(27,79,138,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(27,79,138,0.3)' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Buscar posero
          </a>

          <a href="/registrarme" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            padding: '16px 24px',
            background: '#fff',
            color: '#0D1B2A',
            borderRadius: '12px',
            textDecoration: 'none',
            fontSize: '17px',
            fontWeight: '700',
            fontFamily: "'Helvetica Neue', sans-serif",
            border: '2px solid #E0E0D8',
            transition: 'transform 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = '#1B4F8A' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = '#E0E0D8' }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Sumar mi perfil de posero
          </a>
        </div>

        {/* Hint de ubicacion */}
        <div style={{
          marginTop: '28px',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s ease 0.6s',
        }}>
          {!ubicacionSolicitada ? (
            <button onClick={usarUbicacion} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '13px', color: '#888',
              fontFamily: "'Helvetica Neue', sans-serif",
              display: 'flex', alignItems: 'center', gap: '6px',
              margin: '0 auto', padding: '6px',
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              Mostrarme poseros cerca tuyo
            </button>
          ) : (
            <span style={{ fontSize: '13px', color: '#22C55E', fontFamily: "'Helvetica Neue', sans-serif" }}>
              Buscando tu ubicacion...
            </span>
          )}
        </div>

        {/* Flecha scroll */}
        <div style={{
          position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
          animation: 'bounce 2s infinite',
          opacity: 0.4,
        }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#1B4F8A" strokeWidth="2">
            <path d="M7 10l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* TRUST SECTION */}
      <section style={{
        padding: '4rem 1.25rem',
        background: '#fff',
        borderTop: '1px solid #F0F0E8',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '1.5rem',
          }}>
            {[
              { icono: '📍', titulo: 'Por zona', desc: 'Poseros en toda Argentina' },
              { icono: '📞', titulo: 'Contacto directo', desc: 'Sin intermediarios' },
              { icono: '🆓', titulo: 'Gratis', desc: 'Para productores' },
            ].map((item, i) => (
              <div key={i} style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                borderRadius: '12px',
                background: '#FAFAF7',
                border: '1px solid #F0F0E8',
              }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icono}</div>
                <div style={{
                  fontSize: '15px', fontWeight: '700', color: '#0D1B2A',
                  marginBottom: '4px',
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}>{item.titulo}</div>
                <div style={{ fontSize: '13px', color: '#888', fontFamily: "'Helvetica Neue', sans-serif" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" style={{
        padding: '4rem 1.25rem',
        background: '#FAFAF7',
      }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: '800', color: '#0D1B2A',
            marginBottom: '2rem', letterSpacing: '-0.5px',
          }}>
            Como funciona
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            {[
              { n: '1', txt: 'Busca poseros en tu provincia o localidad' },
              { n: '2', txt: 'Mira su perfil, zona de trabajo y contacto' },
              { n: '3', txt: 'Contacta directo por telefono o WhatsApp' },
            ].map((paso, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                background: '#fff', borderRadius: '12px',
                padding: '16px 20px',
                border: '1px solid #F0F0E8',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: '#1B4F8A', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: '800', flexShrink: 0,
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}>{paso.n}</div>
                <span style={{
                  fontSize: '15px', color: '#333', lineHeight: '1.4',
                  fontFamily: "'Helvetica Neue', sans-serif",
                }}>{paso.txt}</span>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <a href="/" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '2rem',
            padding: '15px 24px',
            background: '#1B4F8A', color: '#fff',
            borderRadius: '12px', textDecoration: 'none',
            fontSize: '16px', fontWeight: '700',
            fontFamily: "'Helvetica Neue', sans-serif",
            boxShadow: '0 4px 16px rgba(27,79,138,0.25)',
          }}>
            Buscar posero ahora
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        background: '#0D1B2A',
        padding: '1.5rem 1.25rem',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'center', gap: '20px',
          flexWrap: 'wrap',
          fontFamily: "'Helvetica Neue', sans-serif",
        }}>
          <a href="/" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Inicio</a>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terminos</a>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacidad</a>
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Contacto</a>
          <a href="/registrarme" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Registrarme</a>
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '12px', fontFamily: "'Helvetica Neue', sans-serif" }}>
          © 2026 Pozero Agro
        </div>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        a, button { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  )
}
