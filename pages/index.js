import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import SEO from '../components/SEO'
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
      <SEO
        path="/"
        description="Encontrá perforistas rurales en toda Argentina. Directorio nacional de poceros con cobertura en todas las provincias. Contacto directo por WhatsApp, sin comisiones."
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Pozero Agro",
          "url": "https://pozeroagro.ar",
          "description": "Directorio nacional de perforistas rurales en Argentina",
          "inLanguage": "es-AR",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": "https://pozeroagro.ar/buscar?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        }}
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
          --ink-soft: #334155;
          --line: rgba(15, 76, 129, 0.12);
          --surface: #FFFFFF;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { -webkit-text-size-adjust: 100%; overflow-x: hidden; }
        body {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          color: var(--ink);
          background: var(--off-white);
          min-height: 100vh;
        }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div className="page">
        {/* ─── HERO CON IMAGEN DE FONDO ─── */}
        <section className="hero">
          <div className="hero-bg" aria-hidden="true">
            <img src="/images/hero.jpg" alt="" />
            <div className="hero-overlay"></div>
          </div>

          <div className="hero-wrapper">
            <header className="site-header">
              <a href="/" className="logo" aria-label="Pozero Agro — inicio">
                <svg className="logo-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#ffffff" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round"/>
                  <path d="M46 12H54V59H46V12Z" fill="#0F4C81"/>
                  <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#ffffff" stroke="#ffffff" strokeWidth="1" strokeLinejoin="round"/>
                  <circle cx="50" cy="88" r="1.5" fill="#0F4C81" fillOpacity="0.4"/>
                </svg>
                <span className="logo-wordmark">
                  <span className="pozero">POZERO</span>
                  <span className="agro">AGRO</span>
                </span>
              </a>
            </header>

            <div className="hero-content">
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
          </div>
        </section>

        {/* ─── TRUST STRIP ─── */}
        <section className="trust" aria-label="Cómo funciona Pozero Agro">
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

        .hero {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }

        .hero-bg img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center right;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(
              90deg,
              rgba(15, 30, 46, 0.85) 0%,
              rgba(15, 30, 46, 0.7) 40%,
              rgba(15, 30, 46, 0.4) 70%,
              rgba(15, 30, 46, 0.3) 100%
            );
        }

        .hero-wrapper {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          flex: 1;
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
        }

        .site-header {
          padding: 20px 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }
        .logo-mark {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }
        .logo-wordmark {
          display: flex;
          align-items: baseline;
          gap: 5px;
          font-family: "Montserrat", sans-serif;
          line-height: 1;
        }
        .pozero {
          font-weight: 800;
          letter-spacing: 0.005em;
          font-size: 20px;
          color: #fff;
        }
        .agro {
          font-weight: 500;
          letter-spacing: 0.04em;
          font-size: 15px;
          color: rgba(255, 255, 255, 0.75);
          text-transform: uppercase;
        }

        .hero-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 40px 0 60px;
          max-width: 620px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.9);
          padding: 7px 14px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 999px;
          margin-bottom: 28px;
          width: fit-content;
        }
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--verde-solar);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
        }

        .headline {
          font-family: "Montserrat", sans-serif;
          font-weight: 800;
          font-size: clamp(42px, 8vw, 80px);
          line-height: 1;
          letter-spacing: -0.025em;
          color: #fff;
          margin-bottom: 20px;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
        }
        .accent {
          color: #fff;
          position: relative;
          white-space: nowrap;
          display: inline-block;
        }
        .accent::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          bottom: -0.03em;
          height: 4px;
          background: var(--verde-solar);
          border-radius: 2px;
        }

        .sub {
          font-size: clamp(15px, 1.6vw, 18px);
          color: rgba(255, 255, 255, 0.9);
          max-width: 520px;
          margin-bottom: 36px;
          line-height: 1.5;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        }

        .cta-group {
          display: grid;
          gap: 12px;
          max-width: 520px;
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
          transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
          text-align: left;
          width: 100%;
        }
        .cta-primary {
          background: #fff;
          color: var(--azul-pozero);
          box-shadow: 0 1px 0 0 rgba(0,0,0,0.1), 0 10px 30px -6px rgba(0, 0, 0, 0.3);
        }
        .cta-primary:hover {
          background: var(--azul-pozero);
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 4px 0 0 var(--azul-pozero-deep), 0 14px 36px -8px rgba(15, 76, 129, 0.5);
        }
        .cta-primary:active { transform: translateY(0); }
        .cta-secondary {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border: 1.5px solid rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
        }
        .cta-secondary:hover {
          background: #fff;
          color: var(--azul-pozero);
          border-color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 10px 30px -6px rgba(0, 0, 0, 0.3);
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
          background: rgba(15, 76, 129, 0.1);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          transition: transform 0.2s;
        }
        .cta-secondary .cta-arrow {
          background: rgba(255, 255, 255, 0.15);
        }
        .cta:hover .cta-arrow {
          transform: translateX(4px);
        }

        .trust {
          padding: 36px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--line);
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
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 10px;
          background: rgba(15, 76, 129, 0.08);
          color: var(--azul-pozero);
          display: grid;
          place-items: center;
        }
        .trust-icon :global(svg) {
          width: 20px;
          height: 20px;
        }

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

        @media (min-width: 720px) {
          .cta-group {
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            max-width: 640px;
          }
          .hero-wrapper {
            padding: 0 48px;
          }
          .site-header {
            padding: 28px 0;
          }
          .hero-content {
            padding: 60px 0 100px;
          }
          .trust {
            padding: 44px 48px;
          }
          .trust-inner {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
          .site-footer {
            padding: 24px 48px;
          }
          .pozero {
            font-size: 22px;
          }
          .agro {
            font-size: 16px;
          }
        }

        @media (min-width: 1024px) {
          .hero-content {
            padding: 80px 0 140px;
          }
        }

        @media (max-width: 720px) {
          .hero-overlay {
            background:
              linear-gradient(
                180deg,
                rgba(15, 30, 46, 0.7) 0%,
                rgba(15, 30, 46, 0.8) 100%
              );
          }
          .hero-bg img {
            object-position: center center;
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
