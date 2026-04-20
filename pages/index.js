import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { registrarEvento } from '../lib/tracker'

export default function Home() {
  const router = useRouter()

  // ─── CALLBACK OAUTH ─────────────────────────────────────────────────────────
  // Preserva el flujo post-confirmación por email (Supabase vuelve con #access_token)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const token = params.get('access_token')
      if (token) {
        sessionStorage.setItem('pza_auth_token', token)
        window.history.replaceState({}, '', window.location.pathname)
        setTimeout(() => {
          const destino = localStorage.getItem('pza_auth_destino')
          if (destino) {
            localStorage.removeItem('pza_auth_destino')
            localStorage.setItem('pza_auth_token_perfil', token)
            window.location.href = destino
          }
        }, 100)
      }
    }
    registrarEvento('home_vista', null, { pagina: 'home' })
  }, [])

  function irABuscar() {
    registrarEvento('cta_click', null, { cta: 'buscar_pocero', origen: 'home' })
    router.push('/buscar')
  }

  function irARegistrarme() {
    registrarEvento('cta_click', null, { cta: 'sumar_perfil', origen: 'home' })
    router.push('/registrarme')
  }

  return (
    <>
      <Head>
        <title>Pozero Agro — Conectamos campo con agua</title>
        <meta name="description" content="La forma simple de contratar perforistas rurales en Argentina. Buscá tu pocero en minutos o sumate al directorio nacional." />
        <meta name="theme-color" content="#0F4C81" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        :root {
          --azul-pozero: #0F4C81;
          --azul-pozero-deep: #0A3A63;
          --gris-agro: #94A3B8;
          --off-white: #F8FAFC;
          --verde-solar: #22C55E;
          --ink: #0F1E2E;
          --ink-soft: #334155;
          --line: rgba(15, 76, 129, 0.12);
          --surface: #FFFFFF;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { -webkit-text-size-adjust: 100%; }
        body {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: var(--ink);
          background: var(--off-white);
          background-image:
            radial-gradient(ellipse 70% 50% at 80% 0%, rgba(15, 76, 129, 0.07), transparent 60%),
            radial-gradient(ellipse 60% 40% at 0% 100%, rgba(34, 197, 94, 0.06), transparent 60%);
          min-height: 100vh;
          overflow-x: hidden;
        }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div className="page">
        {/* ─── HEADER ─── */}
        <header className="site-header">
          <a href="/" className="logo" aria-label="Pozero Agro — inicio">
            <svg className="logo-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
          <a href="#como-funciona" className="nav-link">¿Cómo funciona?</a>
        </header>

        {/* ─── HERO ─── */}
        <main className="hero">
          <div className="hero-inner">
            <span className="eyebrow">
              <span className="dot" aria-hidden="true"></span>
              Directorio nacional de perforistas rurales
            </span>

            <h1 className="headline">
              Conectamos<br />
              <span className="accent">campo con agua.</span>
            </h1>

            <p className="sub">
              La forma simple de contratar perforistas rurales en Argentina. Encontrá tu pocero en minutos, con cobertura nacional y contacto directo.
            </p>

            <div className="cta-group">
              <button className="cta cta-primary" onClick={irABuscar} aria-label="Buscar pocero cerca tuyo">
                <span>
                  <span className="cta-label">Buscar pocero</span>
                  <span className="cta-sub">encontralo en minutos</span>
                </span>
                <span className="cta-arrow" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </span>
              </button>

              <button className="cta cta-secondary" onClick={irARegistrarme} aria-label="Sumar mi perfil como pocero">
                <span>
                  <span className="cta-label">Sumar mi perfil de pocero</span>
                  <span className="cta-sub">sumate a la red</span>
                </span>
                <span className="cta-arrow" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* ─── TRUST STRIP ─── */}
        <section className="trust" id="como-funciona" aria-label="Cómo funciona Pozero Agro">
          <div className="trust-inner">
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
              </span>
              <span>Poceros en toda Argentina</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              </span>
              <span>Contacto directo por WhatsApp</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7L9 18l-5-5"/></svg>
              </span>
              <span>Sin comisiones, sin intermediarios</span>
            </div>
          </div>
        </section>

        {/* ─── DISCLAIMER LEGAL ─── */}
        <div className="disclaimer">
          Pozero Agro es un directorio informativo. No garantiza la calidad ni los resultados de los servicios publicados.{' '}
          <a href="/terminos">Términos y condiciones</a>
          {' · '}
          <a href="/terminos#privacidad">Privacidad</a>
        </div>

        {/* ─── FOOTER ─── */}
        <footer className="site-footer">
          <div className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <span className="sep">·</span>
            <a href="/terminos#privacidad">Política de privacidad</a>
            <span className="sep">·</span>
            <a href="/contacto">Contacto</a>
          </div>
          <div className="copyright">© 2026 Pozero Agro · Argentina</div>
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* ─── HEADER ─── */
        .site-header {
          padding: 18px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 10;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--azul-pozero);
        }
        .logo-mark {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
        }
        .logo-wordmark {
          display: flex;
          align-items: baseline;
          gap: 3px;
          font-family: "Montserrat", sans-serif;
          line-height: 1;
        }
        .pozero {
          font-weight: 700;
          letter-spacing: 0.02em;
          font-size: 18px;
          color: var(--azul-pozero);
        }
        .agro {
          font-weight: 400;
          letter-spacing: 0.08em;
          font-size: 14px;
          color: var(--gris-agro);
          text-transform: uppercase;
        }
        .nav-link {
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-soft);
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--line);
          transition: background 0.2s, border-color 0.2s, color 0.2s;
        }
        .nav-link:hover {
          background: var(--surface);
          border-color: var(--azul-pozero);
          color: var(--azul-pozero);
        }

        /* ─── HERO ─── */
        .hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 24px 56px;
          position: relative;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }
        .hero-inner {
          position: relative;
          z-index: 2;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-soft);
          padding: 6px 14px;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 999px;
          margin-bottom: 28px;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--verde-solar);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
        }
        .headline {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: clamp(40px, 8.5vw, 88px);
          line-height: 1.02;
          letter-spacing: -0.025em;
          color: var(--ink);
          margin-bottom: 20px;
        }
        .accent {
          color: var(--azul-pozero);
          position: relative;
          white-space: nowrap;
        }
        .accent::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -0.05em;
          height: 3px;
          background: var(--verde-solar);
          border-radius: 2px;
        }
        .sub {
          font-size: clamp(16px, 1.6vw, 18px);
          color: var(--ink-soft);
          max-width: 560px;
          margin-bottom: 36px;
          line-height: 1.5;
        }

        /* ─── CTAs ─── */
        .cta-group {
          display: grid;
          gap: 12px;
          max-width: 640px;
        }
        .cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 22px;
          border-radius: 12px;
          font-family: "Inter", sans-serif;
          font-size: 17px;
          font-weight: 600;
          min-height: 68px;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
          text-align: left;
          width: 100%;
        }
        .cta-primary {
          background: var(--azul-pozero);
          color: var(--off-white);
          box-shadow: 0 1px 0 0 var(--azul-pozero-deep), 0 8px 24px -8px rgba(15, 76, 129, 0.5);
        }
        .cta-primary:hover {
          background: var(--azul-pozero-deep);
          transform: translateY(-2px);
          box-shadow: 0 3px 0 0 #062640, 0 12px 30px -8px rgba(15, 76, 129, 0.55);
        }
        .cta-primary:active {
          transform: translateY(0);
        }
        .cta-secondary {
          background: var(--surface);
          color: var(--azul-pozero);
          border: 1.5px solid var(--azul-pozero);
        }
        .cta-secondary:hover {
          background: var(--azul-pozero);
          color: var(--off-white);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -8px rgba(15, 76, 129, 0.35);
        }
        .cta-label {
          display: block;
          line-height: 1.15;
        }
        .cta-sub {
          display: block;
          font-size: 13px;
          font-weight: 400;
          opacity: 0.8;
          margin-top: 3px;
        }
        .cta-arrow {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .cta-secondary .cta-arrow {
          background: rgba(15, 76, 129, 0.08);
        }
        .cta:hover .cta-arrow {
          transform: translateX(4px);
        }

        /* ─── TRUST STRIP ─── */
        .trust {
          border-top: 1px solid var(--line);
          padding: 28px 24px;
          background: var(--surface);
        }
        .trust-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--ink-soft);
        }
        .trust-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          border-radius: 10px;
          background: rgba(15, 76, 129, 0.08);
          color: var(--azul-pozero);
          display: grid;
          place-items: center;
        }
        .trust-icon :global(svg) {
          width: 18px;
          height: 18px;
        }

        /* ─── DISCLAIMER LEGAL ─── */
        .disclaimer {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 16px 24px;
          font-size: 12px;
          color: var(--gris-agro);
          line-height: 1.6;
          text-align: center;
        }
        .disclaimer a {
          color: var(--azul-pozero);
          font-weight: 500;
        }
        .disclaimer a:hover {
          text-decoration: underline;
        }

        /* ─── FOOTER ─── */
        .site-footer {
          background: var(--azul-pozero);
          padding: 20px 24px;
          text-align: center;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .footer-links a {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          transition: color 0.2s;
        }
        .footer-links a:hover {
          color: #fff;
        }
        .sep {
          font-size: 12px;
          color: rgba(255,255,255,0.3);
        }
        .copyright {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-top: 4px;
        }

        /* ─── DESKTOP ─── */
        @media (min-width: 720px) {
          .cta-group {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
          }
          .site-header {
            padding: 24px 48px;
          }
          .hero {
            padding: 56px 48px 80px;
          }
          .trust {
            padding: 36px 48px;
          }
          .trust-inner {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          .site-footer {
            padding: 24px 48px;
          }
          .pozero {
            font-size: 20px;
          }
          .agro {
            font-size: 15px;
          }
        }
        @media (min-width: 1024px) {
          .hero {
            padding: 88px 48px 120px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </>
  )
}
