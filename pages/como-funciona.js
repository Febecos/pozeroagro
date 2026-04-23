// pages/como-funciona.js
// Página "Cómo funciona" — explica el directorio a productores y pozeros
// Sin mencionar Febecos (marca neutral e independiente)

import SEO from '../components/SEO'
import Link from 'next/link'

export default function ComoFunciona() {
  return (
    <>
      <SEO
        path="/como-funciona"
        title="Cómo funciona Pozero Agro"
        description="Conocé cómo funciona el directorio nacional de Pozeros en Argentina. Contacto directo, sin comisiones, sin intermediarios. Gratis para productores y pozeros."
      />

      <div className="page">
        {/* ─── HERO ─── */}
        <section className="hero">
          <div className="hero-inner">
            <Link href="/" className="back-link">← Volver al inicio</Link>
            <h1 className="hero-title">Cómo funciona Pozero Agro</h1>
            <p className="hero-sub">
              Un directorio nacional simple, directo y sin intermediarios.
              Gratis para productores y para Pozeros de toda Argentina.
            </p>
          </div>
        </section>

        {/* ─── QUÉ ES ─── */}
        <section className="section">
          <div className="section-inner">
            <h2 className="h2">¿Qué es Pozero Agro?</h2>
            <p className="text">
              Pozero Agro es un directorio nacional que conecta <strong>productores agropecuarios</strong> con
              <strong> Pozeros</strong> (perforistas rurales) de toda Argentina.
            </p>
            <p className="text">
              El problema que resolvemos es simple: antes, encontrar un Pozero cerca de tu campo
              implicaba depender del boca en boca, recorrer pueblos o googlear sin filtros.
              Y si eras Pozero, darte a conocer fuera de tu zona era difícil.
            </p>
            <p className="text">
              Por eso armamos este directorio: <strong>abierto, gratuito, sin comisiones
              y con contacto directo por WhatsApp</strong>.
            </p>
          </div>
        </section>

        {/* ─── PARA PRODUCTORES ─── */}
        <section className="section section-alt">
          <div className="section-inner">
            <div className="section-badge productor-badge">🌾 Para productores</div>
            <h2 className="h2">Buscás un Pozero</h2>

            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-body">
                  <h3 className="step-title">Entrá al directorio</h3>
                  <p className="step-desc">
                    Buscá Pozeros por provincia o por nombre/localidad en <Link href="/buscar">nuestro directorio</Link>.
                    Cada ficha tiene experiencia, servicios, zona de trabajo y datos de contacto.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-num">2</div>
                <div className="step-body">
                  <h3 className="step-title">Contactá directo</h3>
                  <p className="step-desc">
                    WhatsApp, teléfono, email, Instagram, Facebook. Elegí el canal que prefieras.
                    <strong> Pozero Agro no intermedia</strong>: hablás directo con el Pozero.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-num">3</div>
                <div className="step-body">
                  <h3 className="step-title">Dejá tu experiencia</h3>
                  <p className="step-desc">
                    Después del trabajo, podés dejar una calificación y comentario en la ficha del Pozero,
                    para ayudar a otros productores a decidir.
                  </p>
                </div>
              </div>
            </div>

            <div className="cta-block">
              <p className="cta-text">Usar Pozero Agro es <strong>100% gratuito</strong> para productores.</p>
              <Link href="/buscar" className="cta-btn cta-primary">Buscar un Pozero →</Link>
            </div>
          </div>
        </section>

        {/* ─── PARA POZEROS ─── */}
        <section className="section">
          <div className="section-inner">
            <div className="section-badge pozero-badge">⛏️ Para Pozeros</div>
            <h2 className="h2">Querés que los productores te encuentren</h2>

            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-body">
                  <h3 className="step-title">Registrate gratis</h3>
                  <p className="step-desc">
                    Te toma 2-3 minutos. Cargás tus datos (nombre, zona, experiencia, servicios)
                    y después <strong>nosotros revisamos el perfil</strong> antes de publicarlo.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-num">2</div>
                <div className="step-body">
                  <h3 className="step-title">Apareces en el directorio</h3>
                  <p className="step-desc">
                    Una vez aprobado, tu ficha queda visible en el directorio nacional
                    y también en la landing de tu provincia. <strong>SEO incluido</strong>:
                    te indexamos en Google para que productores te encuentren.
                  </p>
                </div>
              </div>

              <div className="step">
                <div className="step-num">3</div>
                <div className="step-body">
                  <h3 className="step-title">Los productores te contactan directo</h3>
                  <p className="step-desc">
                    Tu WhatsApp queda para vos. Te llaman, te escriben, cerrás el trabajo como siempre.
                    <strong> No cobramos comisión</strong> por ninguno de los trabajos que saques de acá.
                  </p>
                </div>
              </div>
            </div>

            <div className="cta-block">
              <p className="cta-text">Sumate al directorio nacional. <strong>Es gratis y siempre será gratis</strong>.</p>
              <Link href="/registrarme" className="cta-btn cta-secondary">Registrarme como Pozero →</Link>
            </div>
          </div>
        </section>

        {/* ─── PREGUNTAS FRECUENTES ─── */}
        <section className="section section-alt">
          <div className="section-inner">
            <h2 className="h2">Preguntas frecuentes</h2>

            <div className="faq">
              <details className="faq-item">
                <summary className="faq-q">¿Es realmente gratis?</summary>
                <p className="faq-a">
                  Sí. Pozero Agro no cobra nada, ni a productores ni a Pozeros. No hay comisiones
                  sobre trabajos, no hay suscripciones, no hay costos ocultos.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Por qué es gratis? ¿Cuál es el modelo?</summary>
                <p className="faq-a">
                  Queremos que el directorio sea útil para el ecosistema rural argentino.
                  A futuro podríamos incorporar publicidad no intrusiva o servicios premium opcionales,
                  pero el acceso al directorio en sí (buscar, contactar, registrarse) siempre será gratuito.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Pozero Agro garantiza la calidad de los Pozeros?</summary>
                <p className="faq-a">
                  No. Somos una plataforma de contacto, no una agencia. Revisamos los datos básicos
                  antes de publicar cada perfil, pero <strong>la contratación es de exclusiva
                  responsabilidad de cada productor</strong>. Te ayudamos a encontrar opciones,
                  pero vos evaluás y contratás.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Cómo se eliminan Pozeros que dan mal servicio?</summary>
                <p className="faq-a">
                  Los productores pueden dejar calificaciones y comentarios en cada ficha.
                  Si detectamos patrones graves de mala praxis, estafa o faltas éticas,
                  podemos desactivar el perfil. También respondemos a reportes de usuarios.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Qué pasa con mis datos personales?</summary>
                <p className="faq-a">
                  Respetamos tu privacidad. Solo mostramos los datos que vos elegís hacer visibles
                  (teléfono, WhatsApp, Instagram, Facebook, email — cada uno con su toggle independiente).
                  Cuidamos todo bajo las leyes argentinas de privacidad.
                  Podés leer más en nuestra <Link href="/terminos#privacidad">política de privacidad</Link>.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Cómo modifico mis datos si ya me registré?</summary>
                <p className="faq-a">
                  Escribinos por <Link href="/contacto">el formulario de contacto</Link> desde el email que usaste al registrarte.
                  Te mandamos un link de verificación y podés editar tu perfil directamente.
                </p>
              </details>

              <details className="faq-item">
                <summary className="faq-q">¿Aparecen todos los Pozeros juntos?</summary>
                <p className="faq-a">
                  El directorio es nacional. Podés filtrar por provincia o buscar por localidad/nombre.
                  Ordenamos el listado con los <strong>clientes verificados primero</strong> y después
                  por antigüedad de registro.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ─── CTA FINAL ─── */}
        <section className="cta-final">
          <div className="cta-final-inner">
            <h2 className="cta-final-title">Empezá ahora</h2>
            <p className="cta-final-sub">Sin comisiones · Contacto directo · Todo Argentina</p>
            <div className="cta-final-buttons">
              <Link href="/buscar" className="cta-btn cta-primary">Buscar Pozero</Link>
              <Link href="/registrarme" className="cta-btn cta-ghost">Registrarme</Link>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="site-footer">
          <div className="footer-links">
            <Link href="/terminos">Términos y condiciones</Link>
            <span className="sep">·</span>
            <Link href="/terminos#privacidad">Política de privacidad</Link>
            <span className="sep">·</span>
            <Link href="/como-funciona">Cómo funciona</Link>
            <span className="sep">·</span>
            <Link href="/contacto">Contacto</Link>
          </div>
          <div className="copyright">© 2026 Pozero Agro · Argentina</div>
        </footer>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          font-family: "Inter", sans-serif;
          color: #1e293b;
          background: #fff;
        }

        /* ─── HERO ─── */
        .hero {
          background: linear-gradient(135deg, #0F4C81 0%, #0A3A63 100%);
          color: #fff;
          padding: 40px 24px 48px;
        }
        .hero-inner {
          max-width: 700px;
          margin: 0 auto;
        }
        :global(a.back-link),
        .back-link {
          display: inline-block;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8) !important;
          margin-bottom: 20px;
          text-decoration: none;
          font-weight: 500;
        }
        :global(a.back-link:hover),
        .back-link:hover {
          color: #ffffff !important;
          text-decoration: underline;
        }
        .hero-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 800;
          font-size: clamp(26px, 5vw, 40px);
          letter-spacing: -0.02em;
          line-height: 1.15;
          margin: 0 0 14px;
        }
        .hero-sub {
          font-size: clamp(15px, 2vw, 17px);
          color: rgba(255,255,255,0.85);
          line-height: 1.5;
          margin: 0;
        }

        /* ─── SECTIONS ─── */
        .section {
          padding: 56px 24px;
          background: #fff;
        }
        .section-alt {
          background: #F8FAFC;
        }
        .section-inner {
          max-width: 700px;
          margin: 0 auto;
        }
        .section-badge {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 16px;
        }
        .productor-badge {
          background: #FEF3C7;
          color: #92400E;
        }
        .pozero-badge {
          background: #DBEAFE;
          color: #1E40AF;
        }
        .h2 {
          font-family: "Montserrat", sans-serif;
          font-weight: 700;
          font-size: clamp(22px, 3.5vw, 30px);
          letter-spacing: -0.01em;
          line-height: 1.2;
          margin: 0 0 20px;
          color: #0F1E2E;
        }
        .text {
          font-size: 16px;
          line-height: 1.65;
          color: #334155;
          margin: 0 0 16px;
        }
        .text strong { color: #0F1E2E; }

        /* ─── STEPS ─── */
        .steps {
          margin: 28px 0;
        }
        .step {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }
        .step-num {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #0F4C81;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          font-family: "Montserrat", sans-serif;
        }
        .step-title {
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 6px;
          color: #0F1E2E;
        }
        .step-desc {
          font-size: 15px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }
        .step-desc strong { color: #0F1E2E; }

        /* ─── CTA BLOCK ─── */
        .cta-block {
          margin-top: 28px;
          padding: 20px;
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          text-align: center;
        }
        .section-alt .cta-block {
          background: #fff;
        }
        .cta-text {
          font-size: 15px;
          color: #334155;
          margin: 0 0 14px;
        }
        .cta-btn {
          display: inline-block;
          padding: 12px 24px;
          font-weight: 600;
          font-size: 15px;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .cta-btn:hover {
          transform: translateY(-1px);
        }
        .cta-primary {
          background: #0F4C81;
          color: #fff;
        }
        .cta-primary:hover {
          box-shadow: 0 8px 16px rgba(15,76,129,0.25);
        }
        .cta-secondary {
          background: #22C55E;
          color: #fff;
        }
        .cta-secondary:hover {
          box-shadow: 0 8px 16px rgba(34,197,94,0.25);
        }
        .cta-ghost {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.4);
        }
        .cta-ghost:hover {
          background: rgba(255,255,255,0.08);
        }

        /* ─── FAQ ─── */
        .faq {
          margin-top: 20px;
        }
        .faq-item {
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        .faq-q {
          padding: 16px 18px;
          cursor: pointer;
          font-weight: 600;
          font-size: 15px;
          color: #0F1E2E;
          list-style: none;
          position: relative;
          padding-right: 40px;
        }
        .faq-q::-webkit-details-marker { display: none; }
        .faq-q::after {
          content: "+";
          position: absolute;
          right: 18px;
          top: 14px;
          font-size: 22px;
          font-weight: 400;
          color: #94A3B8;
          transition: transform 0.2s;
        }
        .faq-item[open] .faq-q::after {
          transform: rotate(45deg);
        }
        .faq-a {
          padding: 0 18px 16px;
          font-size: 14px;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }
        .faq-a strong { color: #0F1E2E; }

        /* ─── CTA FINAL ─── */
        .cta-final {
          background: linear-gradient(135deg, #0F4C81 0%, #0A3A63 100%);
          padding: 56px 24px;
          text-align: center;
          color: #fff;
        }
        .cta-final-inner {
          max-width: 600px;
          margin: 0 auto;
        }
        .cta-final-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 800;
          font-size: clamp(26px, 4vw, 34px);
          margin: 0 0 8px;
        }
        .cta-final-sub {
          font-size: 14px;
          color: rgba(255,255,255,0.7);
          margin: 0 0 24px;
        }
        .cta-final-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: center;
        }

        /* ─── FOOTER ─── */
        .site-footer {
          background: #F8FAFC;
          border-top: 1px solid #E2E8F0;
          padding: 24px;
          text-align: center;
        }
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .footer-links a {
          color: #64748B;
          text-decoration: none;
        }
        .footer-links a:hover { color: #0F4C81; }
        .sep { color: #CBD5E1; }
        .copyright {
          font-size: 11px;
          color: #94A3B8;
        }
      `}</style>
    </>
  )
}
