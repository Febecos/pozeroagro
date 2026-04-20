// pages/mi-perfil.js
import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

export default function MiPerfil() {
  const [paso, setPaso] = useState('login') // login | cargando | editar | enviado
  const [email, setEmail] = useState('')
  const [enviandoLink, setEnviandoLink] = useState(false)
  const [usuario, setUsuario] = useState(null)
  const [perforista, setPerforista] = useState(null)
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

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
    const hash = window.location.hash
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const token = params.get('access_token')
      if (token) {
        window.history.replaceState({}, '', window.location.pathname)
        verificarToken(token)
      }
    }
  }, [])

  async function verificarToken(token) {
    setPaso('cargando')
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data?.email) {
        setUsuario({ email: data.email, token })
        await cargarPerfil(data.email)
      } else {
        setPaso('login')
      }
    } catch (e) {
      setPaso('login')
    }
  }

  async function cargarPerfil(emailUsuario) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/perforistas?email=eq.${encodeURIComponent(emailUsuario)}&select=*&limit=1`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const p = data[0]
        setPerforista(p)
        setForm({
          nombre: p.nombre || '',
          apellido: p.apellido || '',
          provincia: p.provincia || '',
          localidad: p.localidad || '',
          instagram: p.instagram || '',
          facebook: p.facebook || '',
          experiencia: p.experiencia || '',
          tipo_empresa: p.tipo_empresa || '',
          profundidad_max: p.profundidad_max || 80,
          diametros: p.diametros || [],
          terrenos: p.terrenos || [],
          zonas_trabajo: p.zonas_trabajo || [],
          servicios: p.servicios || [],
          tipo_bomba: p.tipo_bomba || [],
          conoce_solar: p.conoce_solar || '',
          trabajos_por_mes: p.trabajos_por_mes || '',
          descripcion: p.descripcion || '',
          quiere_info_equipos: p.quiere_info_equipos || false,
        })
        setPaso('editar')
      } else {
        setError('No encontramos un perforista registrado con ese email.')
        setPaso('login')
      }
    } catch (e) {
      setError('Error al cargar el perfil.')
      setPaso('login')
    }
  }

  async function enviarMagicLink() {
    if (!email) return
    setEnviandoLink(true)
    setError('')
    localStorage.setItem('pza_auth_destino', '/mi-perfil')
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          options: { emailRedirectTo: 'https://pozeroagro.ar/mi-perfil' }
        })
      })
      if (res.ok) {
        setPaso('link_enviado')
      } else {
        setError('No se pudo enviar el link. Intentá de nuevo.')
      }
    } catch (e) {
      setError('Error de red.')
    }
    setEnviandoLink(false)
  }

  useEffect(() => {
    if (paso === 'editar' && MAPS_KEY) {
      if (window.google?.maps?.places) {
        initAutocomplete()
      } else {
        const existing = document.querySelector('script[src*="maps.googleapis"]')
        if (!existing) {
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`
          script.async = true
          script.onload = () => setTimeout(() => initAutocomplete(), 100)
          document.head.appendChild(script)
        } else {
          existing.addEventListener('load', () => setTimeout(() => initAutocomplete(), 100))
        }
      }
    }
  }, [paso])

  function initAutocomplete() {
    if (!localidadRef.current || autocompleteRef.current) return
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      localidadRef.current,
      { componentRestrictions: { country: 'ar' }, types: ['(cities)'], fields: ['address_components', 'name'] }
    )
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace()
      if (!place?.address_components) return
      let localidadNombre = ''
      let provinciaNombre = ''
      for (const comp of place.address_components) {
        if (comp.types.includes('locality') && !localidadNombre) localidadNombre = comp.long_name
        if (comp.types.includes('administrative_area_level_1')) provinciaNombre = comp.long_name
      }
      if (!localidadNombre) localidadNombre = place.name.replace(/,\s*Provincia de [^,]+/, '').replace(/,\s*Argentina/, '').trim()
      const mapaProvincias = {
        'Buenos Aires': 'Buenos Aires', 'Provincia de Buenos Aires': 'Buenos Aires',
        'Ciudad Autónoma de Buenos Aires': 'CABA', 'Córdoba': 'Córdoba',
        'Santa Fe': 'Santa Fe', 'Mendoza': 'Mendoza', 'Tucumán': 'Tucumán',
        'Entre Ríos': 'Entre Ríos', 'Salta': 'Salta', 'Misiones': 'Misiones',
        'Chaco': 'Chaco', 'Corrientes': 'Corrientes', 'Santiago del Estero': 'Santiago del Estero',
        'San Juan': 'San Juan', 'Jujuy': 'Jujuy', 'Río Negro': 'Río Negro',
        'Neuquén': 'Neuquén', 'Formosa': 'Formosa', 'Chubut': 'Chubut',
        'San Luis': 'San Luis', 'Catamarca': 'Catamarca', 'La Rioja': 'La Rioja',
        'La Pampa': 'La Pampa', 'Santa Cruz': 'Santa Cruz', 'Tierra del Fuego': 'Tierra del Fuego',
      }
      if (localidadRef.current) localidadRef.current.value = localidadNombre
      setForm(f => ({ ...f, localidad: localidadNombre, provincia: mapaProvincias[provinciaNombre] || provinciaNombre || f.provincia }))
    })
  }

  function set(campo, valor) { setForm(f => ({ ...f, [campo]: valor })) }

  function toggleArray(campo, valor) {
    setForm(f => ({
      ...f,
      [campo]: f[campo].includes(valor) ? f[campo].filter(v => v !== valor) : [...f[campo], valor]
    }))
  }

  function Tag({ campo, valor }) {
    const activo = form[campo].includes(valor)
    return (
      <span onClick={() => toggleArray(campo, valor)} style={{
        padding: '5px 12px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer', userSelect: 'none',
        border: activo ? '1.5px solid #1B4F8A' : '0.5px solid #ccc',
        background: activo ? '#e8f0fa' : '#fff',
        color: activo ? '#1B4F8A' : '#666',
        fontWeight: activo ? '600' : '400'
      }}>{valor}</span>
    )
  }

  async function guardar() {
    setError('')
    if (!form.nombre || !form.apellido || !form.localidad || !form.provincia) {
      setError('Nombre, apellido, localidad y provincia son obligatorios.')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/perfil-guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perforista_id: perforista.id,
          email: usuario.email,
          cambios: form,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        setPaso('enviado')
      } else {
        setError(data.error || 'Error al guardar.')
      }
    } catch (e) {
      setError('Error de red.')
    }
    setGuardando(false)
  }

  // ── PANTALLAS ──

  if (paso === 'cargando') return (
    <Wrapper>
      <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando tu perfil...</div>
    </Wrapper>
  )

  if (paso === 'link_enviado') return (
    <Wrapper>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📧</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B4F8A', marginBottom: '8px' }}>¡Revisá tu email!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7' }}>
          Te enviamos un link a <strong>{email}</strong>.<br />
          Hacé click en el link para acceder a tu perfil.
        </div>
      </div>
    </Wrapper>
  )

  if (paso === 'enviado') return (
    <Wrapper>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B4F8A', marginBottom: '8px' }}>¡Revisá tu email!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.7', marginBottom: '1.5rem' }}>
          Te enviamos un email a <strong>{usuario?.email}</strong> para confirmar los cambios.<br /><br />
          Los cambios <strong>no se aplican hasta que confirmes</strong> haciendo click en el link del email.
        </div>
        <a href="/" style={{ display: 'inline-block', background: '#1B4F8A', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Volver al directorio →
        </a>
      </div>
    </Wrapper>
  )

  if (paso === 'login') return (
    <Wrapper>
      <div style={{ fontSize: '18px', fontWeight: '700', color: '#1B4F8A', marginBottom: '4px' }}>Editá tu perfil</div>
      <div style={{ fontSize: '13px', color: '#888', marginBottom: '1.5rem' }}>Ingresá el email con el que te registraste</div>
      {error && <div style={{ fontSize: '13px', color: '#c0392b', marginBottom: '12px', padding: '8px 12px', background: '#fef2f2', borderRadius: '6px' }}>{error}</div>}
      <input
        type="email"
        placeholder="tu@email.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && enviarMagicLink()}
        style={{ width: '100%', padding: '10px 12px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px' }}
      />
      <button onClick={enviarMagicLink} disabled={enviandoLink || !email}
        style={{ width: '100%', padding: '10px', background: email ? '#1B4F8A' : '#ccc', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: email ? 'pointer' : 'not-allowed', opacity: enviandoLink ? 0.7 : 1 }}>
        {enviandoLink ? 'Enviando...' : 'Acceder a mi perfil →'}
      </button>
    </Wrapper>
  )

  if (paso === 'editar' && form) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* Header */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="22" height="22" viewBox="0 0 100 100">
            <polygon points="15,15 85,15 50,75" fill="#fff"/>
            <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
            <circle cx="50" cy="80" r="9" fill="#fff"/>
            <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
          </svg>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Mi perfil — Pozero Agro</div>
        </div>
        <a href={`/perforista/${perforista.id}`} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '7px 14px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px' }}>
          Ver perfil público →
        </a>
      </div>

      <div style={{ maxWidth: '600px', margin: '1.5rem auto', padding: '0 1rem' }}>

        {/* Aviso datos bloqueados */}
        <div style={{ background: '#fff3e0', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '12px', color: '#E65100', lineHeight: '1.6' }}>
          📞 Para cambiar teléfono, WhatsApp o email escribinos a{' '}
          <a href={`mailto:contacto@pozeroagro.ar?subject=Solicito Modificacion de Telefono y/o Email`}
            style={{ color: '#1B4F8A', fontWeight: '600' }}>
            contacto@pozeroagro.ar
          </a>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '1rem' }}>Datos personales</div>

          {/* Campos bloqueados */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <Campo label="Email (no editable)" valor={perforista.email} bloqueado />
            <Campo label="Teléfono (no editable)" valor={perforista.telefono} bloqueado />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {perforista.dni && <Campo label="DNI (no editable)" valor={perforista.dni} bloqueado />}
            {perforista.cuit && <Campo label="CUIT (no editable)" valor={perforista.cuit} bloqueado />}
          </div>

          {/* Campos editables */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Apellido *</label>
              <input value={form.apellido} onChange={e => set('apellido', e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Localidad *</label>
            <input
              ref={localidadRef}
              type="text"
              defaultValue={form.localidad}
              onChange={e => set('localidad', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={labelStyle}>Provincia *</label>
            <select value={form.provincia} onChange={e => set('provincia', e.target.value)} style={inputStyle}>
              <option value="">Seleccioná...</option>
              {provincias.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Instagram</label>
              <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@tuperfil" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Facebook</label>
              <input value={form.facebook} onChange={e => set('facebook', e.target.value)} placeholder="fb.com/tuperfil" style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '1rem' }}>Experiencia técnica</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Años de experiencia</label>
              <select value={form.experiencia} onChange={e => set('experiencia', e.target.value)} style={inputStyle}>
                <option value="">Seleccioná...</option>
                {['Menos de 2 años','2 a 5 años','5 a 10 años','10 a 20 años','Más de 20 años'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Tipo de empresa</label>
              <select value={form.tipo_empresa} onChange={e => set('tipo_empresa', e.target.value)} style={inputStyle}>
                <option value="">Seleccioná...</option>
                {['Trabajador independiente','Empresa unipersonal','Empresa con empleados'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Profundidad máxima</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <input type="range" min="10" max="200" step="5" value={form.profundidad_max}
                onChange={e => set('profundidad_max', parseInt(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1B4F8A', minWidth: '70px' }}>{form.profundidad_max} metros</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Diámetros</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {['3 pulgadas','4 pulgadas','6 pulgadas','8 pulgadas','Más de 8"'].map(v => <Tag key={v} campo="diametros" valor={v} />)}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Zonas de trabajo</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {['Buenos Aires','Santa Fe','Córdoba','Entre Ríos','La Pampa','Corrientes','Chaco','Salta','Mendoza','Otras'].map(v => <Tag key={v} campo="zonas_trabajo" valor={v} />)}
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#1B4F8A', marginBottom: '1rem' }}>Servicios y equipos</div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Servicios</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {['Perforación de pozos de agua','Instalación de bombas','Mantenimiento de pozos','Instalación solar','Aguadas para ganado','Perforación para riego','Relevamiento de napas'].map(v => <Tag key={v} campo="servicios" valor={v} />)}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tipo de bomba</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {['Bomba eléctrica','Bomba a gasoil','Bomba solar','Molino','Bomba manual'].map(v => <Tag key={v} campo="tipo_bomba" valor={v} />)}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>¿Instalás sistemas solares?</label>
            <select value={form.conoce_solar} onChange={e => set('conoce_solar', e.target.value)} style={{ ...inputStyle, marginTop: '6px' }}>
              <option value="">Seleccioná...</option>
              {['Sí, ya instalé sistemas solares','Conozco el sistema pero no lo instalé','Me interesa aprender','No trabajo con solar'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Trabajos por mes</label>
            <select value={form.trabajos_por_mes} onChange={e => set('trabajos_por_mes', e.target.value)} style={{ ...inputStyle, marginTop: '6px' }}>
              <option value="">Seleccioná...</option>
              {['1 a 2','3 a 5','6 a 10','Más de 10'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Descripción / diferencial</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', fontFamily: 'sans-serif' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.quiere_info_equipos}
              onChange={e => set('quiere_info_equipos', e.target.checked)} />
            <span style={{ fontSize: '13px', color: '#444' }}>Quiero recibir info sobre equipos solares</span>
          </label>
        </div>

        {error && (
          <div style={{ fontSize: '13px', color: '#c0392b', marginBottom: '12px', padding: '10px 14px', background: '#fef2f2', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <button onClick={guardar} disabled={guardando}
          style={{ width: '100%', padding: '12px', background: '#F26419', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: guardando ? 0.7 : 1, marginBottom: '2rem' }}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>

      </div>
    </div>
  )

  return null
}

function Wrapper({ children }) {
  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="22" height="22" viewBox="0 0 100 100">
          <polygon points="15,15 85,15 50,75" fill="#fff"/>
          <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
          <circle cx="50" cy="80" r="9" fill="#fff"/>
          <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
        </svg>
        <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Mi perfil — Pozero Agro</div>
      </div>
      <div style={{ maxWidth: '480px', margin: '2rem auto', padding: '0 1rem' }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0e8', padding: '1.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function Campo({ label, valor, bloqueado }) {
  return (
    <div>
      <label style={{ ...labelStyle, color: bloqueado ? '#aaa' : '#666' }}>{label}</label>
      <input
        value={valor || '—'}
        disabled={bloqueado}
        style={{ ...inputStyle, background: bloqueado ? '#f5f5f5' : '#fff', color: bloqueado ? '#aaa' : '#333', cursor: bloqueado ? 'not-allowed' : 'text' }}
      />
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#666', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px'
}

const inputStyle = {
  width: '100%', padding: '9px 12px', border: '0.5px solid #ccc',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', color: '#333'
}
