// lib/emailTemplate.js
// Template HTML unificado para todos los mails de Pozero Agro
// Compatible con Gmail, Outlook, Apple Mail, clientes móviles

/**
 * Genera un mail HTML con el header de marca y estructura consistente.
 *
 * @param {object} opciones
 * @param {string} opciones.preheader - Texto corto que aparece en la preview del inbox (no se ve en el mail)
 * @param {string} opciones.titulo - Título principal (H1) del mail
 * @param {string} opciones.contenido - HTML del cuerpo (párrafos, tablas, etc.)
 * @param {string} [opciones.ctaTexto] - Texto del botón CTA (opcional)
 * @param {string} [opciones.ctaUrl] - URL del botón CTA (opcional)
 * @param {string} [opciones.footnote] - Texto chico al pie (tipo "Este link expira en 24h")
 * @returns {string} HTML completo del mail
 */
export function wrapEmail({ preheader, titulo, contenido, ctaTexto, ctaUrl, footnote }) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Pozero Agro</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: #0F4C81; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
      .mobile-title { font-size: 22px !important; line-height: 28px !important; }
      .mobile-hero-title { font-size: 28px !important; letter-spacing: -1px !important; }
      .mobile-cta { padding: 14px 26px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f5f7fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',Arial,sans-serif;">
  <!-- Preheader (texto oculto que aparece en la preview) -->
  <div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#f5f7fa;opacity:0;">
    ${preheader || 'Pozero Agro — Conectamos campo con agua'}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fa;">
    <tr>
      <td align="center" style="padding:32px 20px;">

        <!-- Container principal -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" width="600" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(15,76,129,0.08);">

          <!-- Header azul con logo y marca -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #0F4C81 0%, #0A3A63 100%);padding:36px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" valign="middle" style="padding-right:14px;">
                    <!-- Logo SVG inline (pintado en blanco para el fondo azul) -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 100 100">
                      <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.5" stroke-linejoin="round"/>
                      <path d="M46 12H54V59H46V12Z" fill="#0F4C81"/>
                      <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1" stroke-linejoin="round"/>
                      <circle cx="50" cy="88" r="1.5" fill="#0F4C81" fill-opacity="0.4"/>
                    </svg>
                  </td>
                  <td align="left" valign="middle">
                    <div class="mobile-hero-title" style="font-family:'Montserrat',Arial,sans-serif;font-size:32px;font-weight:800;color:#ffffff;letter-spacing:-1px;line-height:1;">POZERO</div>
                    <div style="font-family:'Montserrat',Arial,sans-serif;font-size:16px;font-weight:500;color:rgba(255,255,255,0.75);letter-spacing:3px;margin-top:2px;">AGRO</div>
                  </td>
                </tr>
              </table>
              <!-- Línea verde decorativa -->
              <div style="height:3px;width:48px;background-color:#22C55E;border-radius:2px;margin:18px auto 10px;"></div>
              <div style="color:rgba(255,255,255,0.85);font-size:13px;font-weight:500;">Conectamos campo con agua</div>
            </td>
          </tr>

          <!-- Contenido principal -->
          <tr>
            <td class="mobile-padding" style="padding:36px 40px 28px;">

              <!-- Título -->
              <h1 class="mobile-title" style="margin:0 0 18px;font-family:'Montserrat',Arial,sans-serif;font-size:26px;font-weight:700;color:#0F1E2E;line-height:1.25;letter-spacing:-0.5px;">${titulo}</h1>

              <!-- Cuerpo -->
              <div style="font-size:15px;line-height:1.65;color:#334155;">
                ${contenido}
              </div>

              ${ctaTexto && ctaUrl ? `
              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px;">
                <tr>
                  <td align="center" bgcolor="#0F4C81" style="border-radius:10px;">
                    <a href="${ctaUrl}" class="mobile-cta" target="_blank" style="display:inline-block;padding:14px 34px;font-family:Inter,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;letter-spacing:0.2px;">
                      ${ctaTexto}
                    </a>
                  </td>
                </tr>
              </table>
              ` : ''}

              ${footnote ? `
              <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#94A3B8;">
                ${footnote}
              </p>
              ` : ''}

            </td>
          </tr>

          <!-- Separador fino -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e5e9f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="mobile-padding" align="center" style="padding:24px 40px 30px;">
              <div style="font-size:12px;color:#94A3B8;line-height:1.6;">
                <a href="https://pozeroagro.ar" target="_blank" style="color:#0F4C81;font-weight:600;text-decoration:none;">pozeroagro.ar</a>
                &nbsp;·&nbsp;
                <a href="https://pozeroagro.ar/contacto" target="_blank" style="color:#94A3B8;text-decoration:none;">Contacto</a>
                &nbsp;·&nbsp;
                <a href="https://pozeroagro.ar/terminos" target="_blank" style="color:#94A3B8;text-decoration:none;">Términos</a>
              </div>
              <div style="font-size:11px;color:#94A3B8;margin-top:12px;line-height:1.5;">
                Directorio nacional de perforistas rurales en Argentina.<br>
                Te enviamos este mail porque interactuaste con Pozero Agro.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ═══════════════════════════════════════════════════════════════════════════
// TEMPLATES ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mail que recibe el pocero cuando el admin aprueba su perfil
 */
export function emailAprobacionPerforista({ nombre, perforista_id }) {
  const titulo = `¡${nombre}, tu perfil ya está activo!`
  const contenido = `
    <p style="margin:0 0 14px;">
      Aprobamos tu registro en <strong>Pozero Agro</strong>. Desde ahora, productores de tu zona pueden verte en el directorio y contactarte directamente por WhatsApp.
    </p>
    <p style="margin:0 0 14px;">
      Podés ver cómo se muestra tu perfil público haciendo click abajo. Si necesitás ajustar algo (zonas de trabajo, servicios, descripción), desde "Editar mis datos" podés hacerlo en cualquier momento.
    </p>
    <p style="margin:0 0 14px;font-size:14px;color:#64748b;">
      💡 <strong>Consejo:</strong> los perfiles completos (con descripción, servicios detallados y zonas de trabajo) reciben hasta 3 veces más consultas.
    </p>
  `
  return wrapEmail({
    preheader: `Tu perfil ya está visible. Productores de tu zona pueden contactarte.`,
    titulo,
    contenido,
    ctaTexto: 'Ver mi perfil público',
    ctaUrl: `https://pozeroagro.ar/perforista/${perforista_id}`,
    footnote: `Si tenés dudas o querés darte de baja, respondé este mail y te ayudamos.`
  })
}

/**
 * Mail al pocero para confirmar cambios en su perfil
 */
export function emailConfirmarCambios({ nombre, urlConfirmar }) {
  const titulo = `Confirmá los cambios en tu perfil`
  const contenido = `
    <p style="margin:0 0 14px;">
      Hola <strong>${nombre}</strong>, recibimos una solicitud para modificar tu perfil en Pozero Agro.
    </p>
    <p style="margin:0 0 14px;">
      Si fuiste vos, hacé click en el botón para aplicar los cambios. Si no fuiste vos, simplemente ignorá este mail — tus datos no se modificarán.
    </p>
  `
  return wrapEmail({
    preheader: `Confirmá los cambios en tu perfil de Pozero Agro`,
    titulo,
    contenido,
    ctaTexto: 'Confirmar cambios',
    ctaUrl: urlConfirmar,
    footnote: `Este link expira en 24 horas. Si no solicitaste cambios, ignorá este mensaje.`
  })
}

/**
 * Mail al admin cuando un pocero nuevo se registra
 */
export function emailNuevoRegistroAdmin({ nombre, apellido, localidad, provincia, telefono, email, experiencia }) {
  const titulo = `Nuevo perforista registrado`
  const contenido = `
    <p style="margin:0 0 20px;">
      Se registró un nuevo pocero en Pozero Agro. Revisalo en el panel admin y aprobalo si todo está en orden.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:6px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Nombre</span><br><strong style="font-size:15px;color:#0F1E2E;">${nombre} ${apellido}</strong></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Ubicación</span><br><span style="font-size:15px;color:#0F1E2E;">${localidad}, ${provincia}</span></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Teléfono</span><br><span style="font-size:15px;color:#0F1E2E;">${telefono || '-'}</span></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Email</span><br><span style="font-size:15px;color:#0F1E2E;">${email || '-'}</span></td></tr>
      <tr><td style="padding:10px 16px;"><span style="color:#94A3B8;font-size:13px;">Experiencia</span><br><span style="font-size:15px;color:#0F1E2E;">${experiencia || '-'}</span></td></tr>
    </table>
  `
  return wrapEmail({
    preheader: `Nuevo registro de pocero en Pozero Agro: ${nombre} ${apellido}`,
    titulo,
    contenido,
    ctaTexto: 'Ver panel admin',
    ctaUrl: 'https://pozeroagro.ar/admin',
    footnote: `El perforista está en estado <strong>pendiente</strong> hasta que lo aprobes.`
  })
}

/**
 * Mail al admin cuando alguien usa el form de contacto
 */
export function emailFormContacto({ tipo, nombre, apellido, dni, whatsapp, email, mensaje }) {
  const titulo = `Nueva consulta desde el formulario`
  const contenido = `
    <p style="margin:0 0 16px;color:#64748b;">
      Alguien mandó una consulta desde el formulario de contacto. Acá los datos:
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;border-radius:10px;padding:6px;margin-bottom:18px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Tipo</span><br><strong style="font-size:15px;color:#0F1E2E;">${tipo || '-'}</strong></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">Nombre</span><br><span style="font-size:15px;color:#0F1E2E;">${nombre} ${apellido}</span></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">DNI</span><br><span style="font-size:15px;color:#0F1E2E;">${dni || '-'}</span></td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #eef2f7;"><span style="color:#94A3B8;font-size:13px;">WhatsApp</span><br><span style="font-size:15px;color:#0F1E2E;">${whatsapp}</span></td></tr>
      <tr><td style="padding:10px 16px;"><span style="color:#94A3B8;font-size:13px;">Email</span><br><span style="font-size:15px;color:#0F1E2E;">${email}</span></td></tr>
    </table>
    <div style="background:#fffbe8;border-left:3px solid #F59E0B;padding:14px 18px;border-radius:6px;">
      <div style="color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;margin-bottom:6px;">Mensaje</div>
      <div style="font-size:14px;color:#0F1E2E;line-height:1.6;white-space:pre-wrap;">${mensaje || ''}</div>
    </div>
  `
  return wrapEmail({
    preheader: `${nombre} ${apellido} (${tipo}) mandó una consulta`,
    titulo,
    contenido,
    ctaTexto: `Responder por WhatsApp`,
    ctaUrl: `https://wa.me/${(whatsapp || '').replace(/\D/g, '')}`,
    footnote: `También podés responder por mail directamente a ${email}`
  })
}
