import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default function Terminos() {
  const router = useRouter()
  const [seccionActiva, setSeccionActiva] = useState('terminos')
  const [versionTC, setVersionTC] = useState('1.0')
  const [versionPriv, setVersionPriv] = useState('1.0')
  const [fechaTC, setFechaTC] = useState('abril de 2026')
  const [fechaPriv, setFechaPriv] = useState('abril de 2026')

  useEffect(() => {
    // Cargar versiones activas desde Supabase
    async function cargarVersiones() {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/legal_documentos?activo=eq.true&select=tipo,version,fecha_vigencia`,
          { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
        )
        const docs = await res.json()
        if (Array.isArray(docs)) {
          docs.forEach(d => {
            const fecha = new Date(d.fecha_vigencia).toLocaleDateString('es-AR', {
              month: 'long', year: 'numeric'
            })
            if (d.tipo === 'terminos') { setVersionTC(d.version); setFechaTC(fecha) }
            if (d.tipo === 'privacidad') { setVersionPriv(d.version); setFechaPriv(fecha) }
          })
        }
      } catch (e) {
        // Usa valores por defecto si falla
      }
    }
    cargarVersiones()
  }, [])

  // Detectar anchor en URL para mostrar sección correcta
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash === '#privacidad') setSeccionActiva('privacidad')
  }, [])

  return (
    <>
      <style jsx global>{`
        :root {
          --azul-pozero: #0F4C81;
          --azul-pozero-deep: #0A3A63;
          --gris-agro: #94A3B8;
          --off-white: #F8FAFC;
          --verde-solar: #22C55E;
          --ink: #0F1E2E;
          --line: rgba(15, 76, 129, 0.12);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { -webkit-text-size-adjust: 100%; }
        body {
          font-family: "Inter", -apple-system, system-ui, sans-serif;
          color: var(--ink);
          background: var(--off-white);
          min-height: 100vh;
        }
        a { color: inherit; text-decoration: none; }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

    <div style={{ minHeight: '100vh', background: 'var(--off-white)', display: 'flex', flexDirection: 'column' }}>

      {/* ─── HEADER ─── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--line)', padding: '16px 0', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }} aria-label="Volver al inicio">
            <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
              <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
              <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
              <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
            </svg>
            <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>
              <span style={{ fontWeight: 800, letterSpacing: '0.005em', fontSize: '18px', color: 'var(--azul-pozero)' }}>POZERO</span>
              <span style={{ fontWeight: 500, letterSpacing: '0.04em', fontSize: '13px', color: 'var(--gris-agro)', textTransform: 'uppercase' }}>AGRO</span>
            </span>
          </a>
        </div>
      </header>

      {/* ─── MINI HERO AZUL ─── */}
      <section style={{ background: 'linear-gradient(135deg, var(--azul-pozero) 0%, var(--azul-pozero-deep) 100%)', padding: '36px 20px 28px', color: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 800, fontSize: 'clamp(28px, 5vw, 42px)', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '8px' }}>
            {seccionActiva === 'terminos' ? 'Términos y Condiciones' : 'Política de Privacidad'}
          </h1>
          <p style={{ fontSize: 'clamp(14px, 1.4vw, 16px)', color: 'rgba(255,255,255,0.85)', maxWidth: '620px', lineHeight: 1.4 }}>
            {seccionActiva === 'terminos'
              ? 'Reglas de uso del directorio Pozero Agro. Leelos antes de registrarte o contratar servicios.'
              : 'Cómo cuidamos tus datos personales. En línea con la Ley 25.326 de Argentina.'}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem', width: '100%', flex: 1 }}>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', background: '#fff', borderRadius: '10px', padding: '4px', border: '1px solid var(--line)', width: 'fit-content' }}>
          {[
            { id: 'terminos', label: '📋 Términos y Condiciones' },
            { id: 'privacidad', label: '🔒 Política de Privacidad' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setSeccionActiva(tab.id)}
              style={{
                padding: '8px 16px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                fontSize: '13px', fontWeight: seccionActiva === tab.id ? '600' : '400',
                background: seccionActiva === tab.id ? 'var(--azul-pozero)' : 'transparent',
                color: seccionActiva === tab.id ? '#fff' : '#666',
                transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TÉRMINOS Y CONDICIONES ── */}
        {seccionActiva === 'terminos' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e8', padding: '2rem', marginBottom: '16px' }}>

            <div style={{ fontSize: '22px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>
              Términos y Condiciones de Uso
            </div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '2rem' }}>
              Versión {versionTC} · Vigente desde {fechaTC} · República Argentina
            </div>

            <Seccion titulo="1. Naturaleza de la plataforma">
              Pozero Agro es una plataforma digital de directorio que facilita el encuentro entre personas del sector agropecuario que necesitan servicios de perforación de pozos de agua ("usuarios") y los profesionales o empresas que brindan dichos servicios ("perforistas"). Pozero Agro actúa exclusivamente como intermediario informativo y de contacto. No presta servicios de perforación, no interviene en la ejecución de los trabajos, no intermedia en contratos, no cobra comisiones por contrataciones y no es parte de ninguna relación comercial entre usuarios y perforistas.
            </Seccion>

            <Seccion titulo="2. Sin garantía sobre la información publicada">
              Pozero Agro no verifica, valida ni garantiza la exactitud, veracidad, completitud ni vigencia de los datos publicados por los perforistas, incluyendo sin limitación: nombre, localidad, provincia, zonas de trabajo, servicios ofrecidos, profundidad de perforación, tipo de equipamiento, datos de contacto y experiencia declarada. Toda la información es provista por los propios perforistas bajo su exclusiva responsabilidad.
            </Seccion>

            <Seccion titulo="3. Sin garantía sobre la calidad de los servicios">
              Pozero Agro no garantiza la calidad, idoneidad técnica, habilitación profesional, ni el cumplimiento de los servicios prestados por los perforistas listados. Cualquier contratación generada a partir del uso de la plataforma es de exclusiva responsabilidad del usuario y el perforista. Los usuarios deben realizar las verificaciones que consideren necesarias antes de contratar.
            </Seccion>

            <Seccion titulo="4. Exención de responsabilidad">
              Pozero Agro, sus administradores y colaboradores no serán responsables bajo ninguna circunstancia por:
              <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: '2', color: '#444', fontSize: '14px' }}>
                <li>Daños directos, indirectos, incidentales o consecuentes derivados del uso de la plataforma.</li>
                <li>Incumplimiento, mala ejecución o deficiencia de servicios por parte de los perforistas listados.</li>
                <li>Errores, omisiones o inexactitudes en la información publicada.</li>
                <li>Pérdidas económicas derivadas de contrataciones realizadas a través del directorio.</li>
                <li>Disputas, conflictos o reclamaciones entre usuarios y perforistas.</li>
                <li>Indisponibilidad temporal o permanente de la plataforma por cualquier causa.</li>
                <li>Acceso no autorizado a datos almacenados en la plataforma.</li>
              </ul>
            </Seccion>

            <Seccion titulo="5. Insignias e indicadores internos">
              Pozero Agro podrá mostrar insignias, etiquetas o indicadores en los perfiles de los perforistas, como "Perforista Validado" u otras denominaciones. Estas insignias indican únicamente que el perforista ha completado un proceso de revisión interna básica de sus datos por parte del equipo de Pozero Agro. <strong>No constituyen certificación profesional, habilitación técnica, recomendación ni garantía de calidad</strong> de los servicios. La validación puede ser otorgada, modificada o revocada en cualquier momento sin necesidad de notificación previa.
            </Seccion>

            <Seccion titulo="6. Comentarios y puntuaciones">
              Los comentarios y puntuaciones publicados en los perfiles de perforistas son opiniones de terceros verificados por email y no representan la posición ni la opinión de Pozero Agro. La plataforma no puede garantizar la veracidad de las opiniones. Pozero Agro se reserva el derecho de moderar o eliminar comentarios que resulten ofensivos, falsos, discriminatorios o contrarios a la legislación vigente. El sistema de puntuación es de carácter informativo y no implica ningún tipo de ranking oficial, recomendación ni validación.
            </Seccion>

            <Seccion titulo="7. Publicidad y contenido promocional">
              Pozero Agro puede mostrar publicidad propia o de terceros en la plataforma, incluyendo contenido promocional de productos y servicios complementarios al sector agropecuario. Dicha publicidad está claramente diferenciada del contenido orgánico del directorio y no implica validación, recomendación ni respaldo de ningún perforista en particular.
            </Seccion>

            <Seccion titulo="8. Responsabilidades de los perforistas registrados">
              Al registrarse, los perforistas declaran que: (a) la información proporcionada es veraz y actualizada; (b) cuentan con las habilitaciones, permisos e inscripciones necesarias para ejercer su actividad conforme a la legislación argentina aplicable; (c) se comprometen a brindar un trato respetuoso a los usuarios; (d) aceptan que Pozero Agro puede dar de baja su perfil ante información falsa, engañosa, o reportes reiterados de mal servicio.
            </Seccion>

            <Seccion titulo="9. Aceptación de términos">
              El uso de Pozero Agro implica la aceptación plena de estos Términos y Condiciones. Para los perforistas, la aceptación es expresa mediante checkbox obligatorio al momento del registro, quedando constancia del acto con timestamp, versión del documento aceptado e identificación del usuario.
            </Seccion>

            <Seccion titulo="10. Modificaciones">
              Pozero Agro se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán publicados en esta página con la versión y fecha actualizadas. El uso continuado de la plataforma tras la publicación de los cambios implica su aceptación.
            </Seccion>

            <Seccion titulo="11. Legislación aplicable y jurisdicción">
              Estos Términos y Condiciones se rigen por las leyes de la República Argentina. Para cualquier controversia derivada del uso de la plataforma, las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires, con renuncia expresa a cualquier otro fuero que pudiera corresponder.
            </Seccion>

            <Seccion titulo="12. Contacto">
              Para consultas, reclamos o reportes: <a href="mailto:contacto@pozeroagro.ar" style={{ color: '#1B4F8A' }}>contacto@pozeroagro.ar</a>
            </Seccion>

            <div style={{ marginTop: '2rem', padding: '16px', background: '#f8f9fa', borderRadius: '10px', fontSize: '13px', color: '#888', lineHeight: '1.6', textAlign: 'center' }}>
              Al usar Pozero Agro aceptás estos Términos y Condiciones (versión {versionTC}).<br />
              © 2026 Pozero Agro · Todos los derechos reservados.
            </div>
          </div>
        )}

        {/* ── POLÍTICA DE PRIVACIDAD ── */}
        {seccionActiva === 'privacidad' && (
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e0e0e8', padding: '2rem', marginBottom: '16px' }}>

            <div style={{ fontSize: '22px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>
              Política de Privacidad y Tratamiento de Datos Personales
            </div>
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '2rem' }}>
              Versión {versionPriv} · Vigente desde {fechaPriv} · República Argentina · Ley 25.326
            </div>

            <Seccion titulo="1. Responsable del tratamiento">
              El responsable del archivo y tratamiento de los datos personales recolectados a través de Pozero Agro es <strong>Pozero Agro</strong>, con domicilio en la República Argentina. Contacto: <a href="mailto:contacto@pozeroagro.ar" style={{ color: '#1B4F8A' }}>contacto@pozeroagro.ar</a>
            </Seccion>

            <Seccion titulo="2. Datos que recolectamos">
              <strong>De los perforistas registrados:</strong> nombre, apellido, provincia, localidad, teléfono, WhatsApp, email, Instagram, Facebook, experiencia, servicios, equipamiento y descripción profesional. Estos datos son publicados en el directorio con el consentimiento expreso del perforista al momento del registro.
              <br /><br />
              <strong>De los usuarios que comentan:</strong> dirección de email, verificada mediante enlace mágico. No se almacena contraseña.
              <br /><br />
              <strong>Datos técnicos:</strong> user agent del navegador y token de sesión anónimo, a los efectos de registrar la aceptación de términos y condiciones.
            </Seccion>

            <Seccion titulo="3. Finalidad del tratamiento">
              Los datos son utilizados exclusivamente para: (a) publicar el perfil del perforista en el directorio; (b) permitir que usuarios interesados los contacten; (c) registrar la aceptación de términos y condiciones con respaldo auditable; (d) moderar comentarios; (e) enviar comunicaciones operativas relacionadas con el servicio (activación de perfil, novedades de la plataforma). No se utilizan para perfilado comercial de terceros ni se venden a terceros.
            </Seccion>

            <Seccion titulo="4. Publicación de datos personales">
              Los perforistas consienten expresamente la publicación de sus datos de contacto en el directorio público de Pozero Agro al momento de completar el registro. Pueden solicitar la modificación o eliminación de sus datos en cualquier momento escribiendo a <a href="mailto:contacto@pozeroagro.ar" style={{ color: '#1B4F8A' }}>contacto@pozeroagro.ar</a>.
            </Seccion>

            <Seccion titulo="5. Derechos del titular (Ley 25.326)">
              Conforme a la Ley 25.326 de Protección de los Datos Personales de la República Argentina, los titulares de los datos tienen derecho a:
              <ul style={{ marginTop: '10px', paddingLeft: '20px', lineHeight: '2', color: '#444', fontSize: '14px' }}>
                <li><strong>Acceso:</strong> conocer qué datos personales están almacenados.</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de sus datos del sistema.</li>
                <li><strong>Oposición:</strong> oponerse al tratamiento de sus datos en determinados supuestos.</li>
              </ul>
              Para ejercer estos derechos, escribir a <a href="mailto:contacto@pozeroagro.ar" style={{ color: '#1B4F8A' }}>contacto@pozeroagro.ar</a> con el asunto "Datos Personales".
              <br /><br />
              <em>La Dirección Nacional de Protección de Datos Personales (DNPDP) es el organismo de control. Sitio web: <a href="https://www.argentina.gob.ar/aaip/datospersonales" target="_blank" rel="noreferrer" style={{ color: '#1B4F8A' }}>argentina.gob.ar/aaip/datospersonales</a></em>
            </Seccion>

            <Seccion titulo="6. Almacenamiento y seguridad">
              Los datos son almacenados en la plataforma Supabase, con servidores ubicados en la región de São Paulo, Brasil, bajo estándares de seguridad internacionales. Pozero Agro implementa controles de acceso mediante Row Level Security (RLS) para limitar el acceso a los datos según el rol del usuario.
            </Seccion>

            <Seccion titulo="7. Cookies y tecnologías de seguimiento">
              Pozero Agro puede utilizar cookies técnicas necesarias para el funcionamiento del sitio. No se utilizan cookies de seguimiento publicitario de terceros sin consentimiento previo. El sistema puede registrar tokens de sesión anónimos a los únicos efectos de respaldar la aceptación de términos y condiciones.
            </Seccion>

            <Seccion titulo="8. Comunicaciones por email">
              Los emails recolectados pueden ser utilizados para enviar comunicaciones operativas relacionadas con el servicio (ej: confirmación de registro, activación de perfil). No se enviarán comunicaciones comerciales de terceros sin consentimiento previo. El perforista puede solicitar la baja de comunicaciones en cualquier momento.
            </Seccion>

            <Seccion titulo="9. Modificaciones a esta política">
              Pozero Agro puede actualizar esta Política de Privacidad en cualquier momento. Los cambios serán publicados en esta página con versión y fecha actualizadas. Se notificará a los perforistas registrados ante cambios sustanciales en el tratamiento de sus datos.
            </Seccion>

            <Seccion titulo="10. Contacto">
              Para ejercer derechos o realizar consultas sobre privacidad: <a href="mailto:contacto@pozeroagro.ar" style={{ color: '#1B4F8A' }}>contacto@pozeroagro.ar</a>
            </Seccion>

            <div style={{ marginTop: '2rem', padding: '16px', background: '#e8f0fa', borderRadius: '10px', fontSize: '13px', color: '#1B4F8A', lineHeight: '1.6' }}>
              🔒 Esta política cumple con la <strong>Ley 25.326 de Protección de los Datos Personales</strong> de la República Argentina.<br />
              Versión {versionPriv} — © 2026 Pozero Agro · Todos los derechos reservados.
            </div>
          </div>
        )}

        {/* FOOTER INTERNO - TABS */}
        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '12px', color: '#aaa' }}>
          <a href="/terminos" onClick={e => { e.preventDefault(); setSeccionActiva('terminos') }} style={{ color: 'var(--azul-pozero)', textDecoration: 'none', marginRight: '12px', fontWeight: 500 }}>Términos y Condiciones</a>
          <a href="/terminos#privacidad" onClick={e => { e.preventDefault(); setSeccionActiva('privacidad') }} style={{ color: 'var(--azul-pozero)', textDecoration: 'none', marginRight: '12px', fontWeight: 500 }}>Política de Privacidad</a>
        </div>
      </div>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: 'var(--azul-pozero)', padding: '20px', textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '6px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Términos y condiciones</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Política de privacidad</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Contacto</a>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 Pozero Agro · Argentina</div>
      </footer>
    </div>
    </>
  )
}

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: '28px', borderBottom: '1px solid #f5f5f5', paddingBottom: '28px' }}>
      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a1a2e', marginBottom: '10px' }}>{titulo}</div>
      <div style={{ fontSize: '14px', color: '#444', lineHeight: '1.85' }}>{children}</div>
    </div>
  )
}
