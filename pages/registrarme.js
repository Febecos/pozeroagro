import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  return res
}

export default function Registro() {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [form, setForm] = useState({
    nombre: '', apellido: '', provincia: '', localidad: '',
    telefono: '', whatsapp: '', instagram: '', facebook: '', email: '',
    cuit: '', dni: '',
    experiencia: '', tipo_empresa: '', profundidad_max: 80,
    diametros: [], terrenos: [], zonas_trabajo: [], servicios: [],
    tipo_bomba: [], conoce_solar: '', trabajos_por_mes: '', descripcion: '',
    quiere_info_equipos: false,
    acepto_terminos: false
  })

  const localidadRef = useRef(null)
  const autocompleteRef = useRef(null)

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      initAutocomplete()
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
    script.async = true
    script.onload = () => initAutocomplete()
    document.head.appendChild(script)
  }, [])

  function initAutocomplete() {
    if (!localidadRef.current) return
    if (autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      localidadRef.current,
      {
        componentRestrictions: { country: 'ar' },
        types: ['(cities)'],
        fields: ['address_components', 'name', 'geometry']
      }
    )

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (!place || !place.address_components) return

      // Extraer nombre corto de la localidad desde address_components
      let localidadNombre = ''
      let provinciaNombre = ''

      for (const comp of place.address_components) {
        // locality = ciudad/pueblo principal
        if (comp.types.includes('locality') && !localidadNombre) {
          localidadNombre = comp.long_name
        }
        // sublocality = barrios o partidos dentro de una ciudad grande
        if (comp.types.includes('sublocality_level_1') && !localidadNombre) {
          localidadNombre = comp.long_name
        }
        // administrative_area_level_2 = partido/departamento (fallback para Buenos Aires)
        if (comp.types.includes('administrative_area_level_2') && !localidadNombre) {
          localidadNombre = comp.long_name
        }
        // administrative_area_level_1 = provincia
        if (comp.types.includes('administrative_area_level_1')) {
          provinciaNombre = comp.long_name
        }
      }

      // Fallback: si ningún componente dio nombre, usar place.name pero limpiar el sufijo
      if (!localidadNombre) {
        localidadNombre = place.name
          .replace(/,\s*Provincia de [^,]+/, '')
          .replace(/,\s*Argentina/, '')
          .trim()
      }

      const mapaProvincias = {
        'Buenos Aires': 'Buenos Aires',
        'Provincia de Buenos Aires': 'Buenos Aires',
        'Ciudad Autónoma de Buenos Aires': 'CABA',
        'Catamarca': 'Catamarca',
        'Chaco': 'Chaco',
        'Chubut': 'Chubut',
        'Córdoba': 'Córdoba',
        'Corrientes': 'Corrientes',
        'Entre Ríos': 'Entre Ríos',
        'Formosa': 'Formosa',
        'Jujuy': 'Jujuy',
        'La Pampa': 'La Pampa',
        'La Rioja': 'La Rioja',
        'Mendoza': 'Mendoza',
        'Misiones': 'Misiones',
        'Neuquén': 'Neuquén',
        'Río Negro': 'Río Negro',
        'Salta': 'Salta',
        'San Juan': 'San Juan',
        'San Luis': 'San Luis',
        'Santa Cruz': 'Santa Cruz',
        'Santa Fe': 'Santa Fe',
        'Santiago del Estero': 'Santiago del Estero',
        'Tierra del Fuego': 'Tierra del Fuego',
        'Tucumán': 'Tucumán'
      }

      const provinciaFinal = mapaProvincias[provinciaNombre] || provinciaNombre

      // Actualizar el input visualmente con el nombre corto
      if (localidadRef.current) {
        localidadRef.current.value = localidadNombre
      }

      setForm(f => ({
        ...f,
        localidad: localidadNombre,
        provincia: provinciaFinal || f.provincia
      }))
    })
  }

  useEffect(() => {
    if (paso === 1 && window.google && window.google.maps && window.google.maps.places) {
      setTimeout(() => initAutocomplete(), 100)
    }
  }, [paso])

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  function toggleArray(campo, valor) {
    setForm(f => ({
      ...f,
      [campo]: f[campo].includes(valor)
        ? f[campo].filter(v => v !== valor)
        : [...f[campo], valor]
    }))
  }

  function Tag({ campo, valor }) {
    const activo = form[campo].includes(valor)
    return (
      <span onClick={() => toggleArray(campo, valor)} style={{
        padding: '5px 12px', borderRadius: '20px', fontSize: '13px',
        cursor: 'pointer', userSelect: 'none',
        border: activo ? '1.5px solid #1B4F8A' : '0.5px solid #ccc',
        background: activo ? '#e8f0fa' : '#fff',
        color: activo ? '#1B4F8A' : '#666',
        fontWeight: activo ? '600' : '400'
      }}>{valor}</span>
    )
  }

  async function registrarAceptacion(perforista_id) {
    try {
      const docRes = await sbFetch(
        '/rest/v1/legal_documentos?tipo=eq.terminos&activo=eq.true&select=id,version',
        { headers: { 'Prefer': 'return=representation' } }
      )
      const docs = await docRes.json()
      const doc = Array.isArray(docs) && docs[0] ? docs[0] : null
      if (!doc) return
      await sbFetch('/rest/v1/legal_aceptaciones', {
        method: 'POST',
        headers: { 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          documento_id: doc.id,
          tipo_actor: 'perforista',
          email: form.email,
          perforista_id: perforista_id || null,
          metodo: 'checkbox',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          session_token: typeof crypto !== 'undefined' ? crypto.randomUUID() : null
        })
      })
    } catch (e) {
      console.warn('No se pudo registrar aceptación legal:', e.message)
    }
  }

  async function enviar() {
    if (!form.email) {
      alert('El email es obligatorio para confirmar tu registro.')
      return
    }
    if (!form.acepto_terminos) {
      alert('Debés aceptar los Términos y Condiciones para registrarte.')
      return
    }

    setEnviando(true)
    try {
      const ahora = new Date().toISOString()

      let lat = null, lng = null
      try {
        const geoRes = await fetch(
          `/api/geocode?localidad=${encodeURIComponent(form.localidad)}&provincia=${encodeURIComponent(form.provincia)}`
        )
        const geoData = await geoRes.json()
        lat = geoData.lat
        lng = geoData.lng
      } catch (e) {
        console.warn('Geocodificación falló:', e.message)
      }

      const datosPerforista = {
        nombre: form.nombre,
        apellido: form.apellido,
        provincia: form.provincia,
        localidad: form.localidad,
        telefono: form.telefono,
        whatsapp: form.whatsapp || form.telefono,
        instagram: form.instagram,
        facebook: form.facebook,
        email: form.email,
        cuit: form.cuit || null,
        dni: form.dni || null,
        experiencia: form.experiencia,
        tipo_empresa: form.tipo_empresa,
        profundidad_max: form.profundidad_max,
        diametros: form.diametros,
        terrenos: form.terrenos,
        zonas_trabajo: form.zonas_trabajo,
        servicios: form.servicios,
        tipo_bomba: form.tipo_bomba,
        conoce_solar: form.conoce_solar,
        trabajos_por_mes: form.trabajos_por_mes,
        descripcion: form.descripcion,
        quiere_info_equipos: form.quiere_info_equipos,
        lat: lat,
        lng: lng,
        estado: 'pendiente',
        visible_telefono: true,
        visible_whatsapp: true,
        visible_instagram: true,
        visible_facebook: true,
        visible_email: false,
        acepto_terminos: true,
        acepto_terminos_at: ahora,
        acepto_terminos_version: '1.0'
      }

      const dataRes = await sbFetch('/rest/v1/perforistas', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(datosPerforista)
      })

      if (!dataRes.ok && dataRes.status !== 201) {
        const err = await dataRes.text()
        throw new Error(err)
      }

      const perforistaNuevo = await dataRes.json()
      const perforista_id = Array.isArray(perforistaNuevo)
        ? perforistaNuevo[0]?.id
        : perforistaNuevo?.id

      await registrarAceptacion(perforista_id)

      if (perforista_id) {
        sessionStorage.setItem('pza_perforista_id', perforista_id)
      }

      try {
        await fetch('/api/notificar-alta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: form.nombre,
            apellido: form.apellido,
            localidad: form.localidad,
            provincia: form.provincia,
            telefono: form.telefono,
            email: form.email,
            experiencia: form.experiencia
          })
        })
      } catch (notifErr) {
        console.warn('Notificación admin falló:', notifErr.message)
      }

      try {
        await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
          method: 'POST',
          headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            options: {
              emailRedirectTo: 'https://pozeroagro.ar/confirmado',
              data: { tipo: 'perforista' }
            }
          })
        })
      } catch (mailErr) {
        console.warn('Mail no enviado, datos guardados igual:', mailErr.message)
      }

      setExito(true)

    } catch (e) {
      alert('Error al registrarse: ' + e.message)
    }
    setEnviando(false)
  }

  function siguiente() {
    if (paso === 1) {
      if (!form.nombre || !form.apellido || !form.provincia || !form.localidad || !form.telefono) {
        alert('Por favor completá Nombre, Apellido, Provincia, Localidad y Teléfono.')
        return
      }
      if (!form.email) {
        alert('El email es obligatorio para confirmar tu registro.')
        return
      }
    }
    if (paso === 2) {
      if (!form.experiencia) { alert('Por favor indicá tus años de experiencia.'); return }
      if (form.diametros.length === 0) { alert('Por favor seleccioná al menos un diámetro.'); return }
      if (form.zonas_trabajo.length === 0) { alert('Por favor seleccioná al menos una zona.'); return }
    }
    if (paso === 3) {
      if (form.servicios.length === 0) { alert('Por favor seleccioná al menos un servicio.'); return }
      if (form.tipo_bomba.length === 0) { alert('Por favor seleccioná al menos un tipo de bomba.'); return }
      if (!form.conoce_solar) { alert('Por favor indicá si instalás sistemas solares.'); return }
      if (!form.trabajos_por_mes) { alert('Por favor indicá cuántos trabajos hacés por mes.'); return }
    }
    setPaso(p => p + 1)
  }

  const input = (campo, placeholder, tipo = 'text') => (
    <input
      type={tipo}
      placeholder={placeholder}
      value={form[campo]}
      onChange={e => set(campo, e.target.value)}
      style={{
        width: '100%', padding: '9px 12px',
        border: '0.5px solid #ccc', borderRadius: '8px',
        fontSize: '14px', boxSizing: 'border-box'
      }}
    />
  )

  if (exito) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', textAlign: 'center', maxWidth: '420px', margin: '1rem', border: '0.5px solid #e0e0e8' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
        <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1B4F8A' }}>¡Registro recibido!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          Tu perfil fue enviado correctamente y está <strong>en revisión</strong>.<br /><br />
          En breve aparecés en el directorio de Pozero Agro.<br />
          Si dejaste tu email, te avisamos cuando esté activo.
        </div>
        <div style={{ background: '#f5f7fa', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#888', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Al registrarte aceptaste nuestros{' '}
          <a href="/terminos" style={{ color: '#1B4F8A' }}>Términos y Condiciones</a>.
        </div>
        <a href="/" style={{ display: 'inline-block', background: '#1B4F8A', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Ver el directorio →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 100 100">
            <polygon points="15,15 85,15 50,75" fill="#fff"/>
            <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
            <circle cx="50" cy="80" r="9" fill="#fff"/>
            <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Pozero Agro</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Registrate gratis · 2 minutos</div>
        </div>
      </div>

      <div style={{ maxWidth: '560px', margin: '1.5rem auto', padding: '0 1rem' }}>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '6px' }}>Paso {paso} de 4</div>
          <div style={{ height: '5px', background: '#e0e0e8', borderRadius: '3px' }}>
            <div style={{ height: '100%', background: '#1B4F8A', borderRadius: '3px', width: `${paso * 25}%`, transition: 'width .3s' }} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem' }}>

          {paso === 1 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Datos personales</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Cómo te van a encontrar los productores</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Nombre *</label><br />{input('nombre', 'Juan')}</div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Apellido *</label><br />{input('apellido', 'Pérez')}</div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Localidad * <span style={{ color: '#1B4F8A', fontWeight: '600' }}>(escribí y seleccioná de la lista)</span></label>
                <input
                  ref={localidadRef}
                  type="text"
                  placeholder="Ej: Bolívar, Venado Tuerto, Rafaela..."
                  defaultValue={form.localidad}
                  onChange={e => set('localidad', e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px',
                    border: '0.5px solid #ccc', borderRadius: '8px',
                    fontSize: '14px', boxSizing: 'border-box', marginTop: '2px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Provincia * <span style={{ color: '#aaa' }}>(se completa sola al elegir localidad)</span></label>
                <select value={form.provincia} onChange={e => set('provincia', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', marginTop: '2px' }}>
                  <option value="">Seleccioná...</option>
                  {provincias.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Teléfono *</label><br />{input('telefono', '+54 9 11 XXXX-XXXX', 'tel')}</div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>WhatsApp <span style={{ color: '#aaa' }}>(si es distinto)</span></label><br />
                  {input('whatsapp', 'Se usa el teléfono si no completás')}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Instagram</label><br />{input('instagram', '@tuperfil')}</div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Facebook</label><br />{input('facebook', 'fb.com/tuperfil')}</div>
              </div>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>
                  Email * <span style={{ color: '#1B4F8A', fontWeight: '600' }}>(para confirmar tu registro)</span>
                </label><br />
                {input('email', 'juan@ejemplo.com', 'email')}
              </div>

              <div style={{ borderTop: '0.5px solid #f0f0f0', paddingTop: '12px', marginTop: '4px' }}>
                <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Identificación fiscal (opcional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666' }}>CUIT <span style={{ color: '#aaa' }}>(sin guiones)</span></label><br />
                    <input
                      type="text"
                      placeholder="20123456789"
                      value={form.cuit}
                      onChange={e => set('cuit', e.target.value.replace(/\D/g, '').slice(0, 11))}
                      maxLength={11}
                      style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#666' }}>DNI <span style={{ color: '#aaa' }}>(sin puntos)</span></label><br />
                    <input
                      type="text"
                      placeholder="12345678"
                      value={form.dni}
                      onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))}
                      maxLength={8}
                      style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#bbb', marginTop: '6px' }}>
                  No se muestran públicamente. Solo para verificación interna.
                </div>
              </div>

              <div style={{ marginTop: '10px', background: '#fff3e0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#E65100' }}>
                📧 Te enviaremos un mail para confirmar tu registro.
              </div>
            </div>
          )}

          {paso === 2 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Experiencia técnica</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Tu capacidad como perforista</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Años de experiencia *</label><br />
                  <select value={form.experiencia} onChange={e => set('experiencia', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">Seleccioná...</option>
                    <option>Menos de 2 años</option>
                    <option>2 a 5 años</option>
                    <option>5 a 10 años</option>
                    <option>10 a 20 años</option>
                    <option>Más de 20 años</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Tipo de empresa</label><br />
                  <select value={form.tipo_empresa} onChange={e => set('tipo_empresa', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">Seleccioná...</option>
                    <option>Trabajador independiente</option>
                    <option>Empresa unipersonal</option>
                    <option>Empresa con empleados</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Profundidad máxima de perforación</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <input type="range" min="10" max="200" step="5" value={form.profundidad_max}
                    onChange={e => set('profundidad_max', parseInt(e.target.value))} style={{ flex: 1 }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B4F8A', minWidth: '70px' }}>{form.profundidad_max} metros</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Diámetros que perforás *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['3 pulgadas','4 pulgadas','6 pulgadas','8 pulgadas','Más de 8"'].map(v => <Tag key={v} campo="diametros" valor={v} />)}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Zonas donde trabajás *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Buenos Aires','Santa Fe','Córdoba','Entre Ríos','La Pampa','Corrientes','Chaco','Salta','Mendoza','Otras'].map(v => <Tag key={v} campo="zonas_trabajo" valor={v} />)}
                </div>
              </div>
            </div>
          )}

          {paso === 3 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Servicios y equipos</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Qué hacés y con qué trabajás</div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Servicios que ofrecés *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Perforación de pozos de agua','Instalación de bombas','Mantenimiento de pozos','Instalación solar','Aguadas para ganado','Perforación para riego','Relevamiento de napas'].map(v => <Tag key={v} campo="servicios" valor={v} />)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Tipo de bomba que instalás *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Bomba eléctrica','Bomba a gasoil','Bomba solar','Molino','Bomba manual'].map(v => <Tag key={v} campo="tipo_bomba" valor={v} />)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>¿Instalás o conocés sistemas de bombeo solar? *</label><br />
                <select value={form.conoce_solar} onChange={e => set('conoce_solar', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', marginTop: '4px' }}>
                  <option value="">Seleccioná...</option>
                  <option>Sí, ya instalé sistemas solares</option>
                  <option>Conozco el sistema pero no lo instalé</option>
                  <option>Me interesa aprender</option>
                  <option>No trabajo con solar</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Trabajos por mes (promedio) *</label><br />
                <select value={form.trabajos_por_mes} onChange={e => set('trabajos_por_mes', e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', marginTop: '4px' }}>
                  <option value="">Seleccioná...</option>
                  <option>1 a 2</option>
                  <option>3 a 5</option>
                  <option>6 a 10</option>
                  <option>Más de 10</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#666' }}>Contanos tu experiencia o diferencial</label>
                <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
                  placeholder="Ej: Trabajo en el norte de Buenos Aires hace 15 años..."
                  style={{ width: '100%', padding: '9px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          )}

          {paso === 4 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Últimos detalles</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Ya casi estás en el directorio</div>

              <div style={{ background: '#e8f0fa', border: '0.5px solid #1B4F8A', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Accedé a equipos de bombeo solar</div>
                <div style={{ fontSize: '13px', color: '#1B4F8A', lineHeight: '1.6' }}>
                  Al registrarte te contactamos con las mejores opciones en kits solares para tus clientes de campo. Sin cargo y sin compromiso.
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
                <input type="checkbox" checked={form.quiere_info_equipos}
                  onChange={e => set('quiere_info_equipos', e.target.checked)}
                  style={{ marginTop: '3px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#444' }}>
                  Quiero recibir información sobre equipos y kits solares para el agro
                </span>
              </label>

              <div style={{ fontSize: '13px', color: '#888', padding: '12px', background: '#f5f7fa', borderRadius: '8px', marginBottom: '16px' }}>
                <strong>Resumen:</strong> {form.nombre} {form.apellido} · {form.localidad}, {form.provincia} · {form.profundidad_max}m máx
                {form.cuit && <span> · CUIT: {form.cuit}</span>}
                {form.dni && <span> · DNI: {form.dni}</span>}
              </div>

              <div style={{ background: form.acepto_terminos ? '#f0fdf4' : '#fff8f0', border: `1px solid ${form.acepto_terminos ? '#86efac' : '#fcd34d'}`, borderRadius: '8px', padding: '12px 14px', marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.acepto_terminos}
                    onChange={e => set('acepto_terminos', e.target.checked)}
                    style={{ marginTop: '3px', flexShrink: 0, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '13px', color: '#333', lineHeight: '1.6' }}>
                    Leí y acepto los{' '}
                    <a href="/terminos" target="_blank" rel="noreferrer"
                      style={{ color: '#1B4F8A', fontWeight: '600', textDecoration: 'underline' }}>
                      Términos y Condiciones
                    </a>
                    {' '}y la{' '}
                    <a href="/terminos#privacidad" target="_blank" rel="noreferrer"
                      style={{ color: '#1B4F8A', fontWeight: '600', textDecoration: 'underline' }}>
                      Política de Privacidad
                    </a>
                    {' '}de Pozero Agro. Entiendo que la plataforma actúa como directorio informativo y no garantiza la calidad ni los resultados de los servicios publicados. *
                  </span>
                </label>
              </div>

              <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#E65100' }}>
                📧 Al publicar, te enviamos un mail a <strong>{form.email}</strong> para confirmar tu perfil.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
            {paso > 1 && (
              <button onClick={() => setPaso(p => p - 1)}
                style={{ flex: 1, padding: '10px', border: '0.5px solid #ccc', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                ← Anterior
              </button>
            )}
            {paso < 4 && (
              <button onClick={siguiente}
                style={{ flex: 1, padding: '10px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
                Siguiente →
              </button>
            )}
            {paso === 4 && (
              <button onClick={enviar} disabled={enviando || !form.acepto_terminos}
                style={{
                  flex: 1, padding: '10px',
                  background: form.acepto_terminos ? '#F26419' : '#ccc',
                  color: '#fff', border: 'none', borderRadius: '8px',
                  fontSize: '15px', cursor: form.acepto_terminos ? 'pointer' : 'not-allowed',
                  fontWeight: '700', opacity: enviando ? 0.7 : 1,
                  transition: 'background 0.2s'
                }}>
                {enviando ? 'Enviando...' : 'Publicar mi perfil gratis'}
              </button>
            )}
          </div>

          {paso === 4 && !form.acepto_terminos && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#E65100', textAlign: 'center' }}>
              ⚠️ Debés aceptar los Términos y Condiciones para continuar
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
