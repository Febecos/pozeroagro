import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Registro() {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [form, setForm] = useState({
    nombre: '', apellido: '', provincia: '', localidad: '',
    telefono: '', whatsapp: '', instagram: '', facebook: '', email: '',
    experiencia: '', tipo_empresa: '', profundidad_max: 80,
    diametros: [], terrenos: [], zonas_trabajo: [], servicios: [],
    tipo_bomba: [], conoce_solar: '', trabajos_por_mes: '', descripcion: '',
    quiere_info_equipos: false
  })

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

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
      <span
        onClick={() => toggleArray(campo, valor)}
        style={{
          padding: '5px 12px', borderRadius: '20px', fontSize: '13px',
          cursor: 'pointer', userSelect: 'none',
          border: activo ? '1px solid #1D9E75' : '0.5px solid #ccc',
          background: activo ? '#E1F5EE' : '#fff',
          color: activo ? '#085041' : '#666',
          fontWeight: activo ? '500' : '400'
        }}
      >
        {valor}
      </span>
    )
  }

  async function enviar() {
    setEnviando(true)
    const { error } = await supabase.from('perforistas').insert([{
      ...form,
      estado: 'pendiente',
      visible_telefono: true,
      visible_whatsapp: false,
      visible_instagram: true,
      visible_facebook: true,
      visible_email: false,
    }])
    setEnviando(false)
    if (!error) setExito(true)
    else alert('Hubo un error al enviar. Intentá de nuevo.')
  }

  const input = (campo, placeholder, tipo = 'text') => (
    <input
      type={tipo}
      placeholder={placeholder}
      value={form[campo]}
      onChange={e => set(campo, e.target.value)}
      style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
    />
  )

  if (exito) return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '2rem', textAlign: 'center', maxWidth: '400px', margin: '1rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '24px' }}>✓</div>
        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>¡Registro enviado!</div>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '1.25rem' }}>
          En breve revisamos tu perfil y aparecés en el directorio. Te vamos a contactar por WhatsApp con información sobre kits de bombeo solar para tu zona.
        </div>
        <a href="/" style={{ background: '#085041', color: '#fff', padding: '10px 24px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
          Ver el directorio →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f0' }}>

      <div style={{ background: '#085041', padding: '1rem 1.5rem' }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#E1F5EE' }}>Pozeros Agro</div>
        <div style={{ fontSize: '12px', color: '#5DCAA5' }}>Registrate como perforista rural — gratis</div>
      </div>

      <div style={{ maxWidth: '560px', margin: '1.5rem auto', padding: '0 1rem' }}>

        {/* Barra de progreso */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Paso {paso} de 4</div>
          <div style={{ height: '4px', background: '#e0e0d8', borderRadius: '2px' }}>
            <div style={{ height: '100%', background: '#1D9E75', borderRadius: '2px', width: `${paso * 25}%`, transition: 'width .3s' }} />
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8', padding: '1.5rem' }}>

          {/* PASO 1 */}
          {paso === 1 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Datos personales</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Cómo te van a encontrar los productores</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Nombre *</label><br />{input('nombre', 'Juan')}</div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Apellido *</label><br />{input('apellido', 'Pérez')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Provincia *</label><br />
                  <select value={form.provincia} onChange={e => set('provincia', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px' }}>
                    <option value="">Seleccioná...</option>
                    {provincias.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Localidad *</label><br />{input('localidad', 'Ej: Venado Tuerto')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Teléfono *</label><br />{input('telefono', '+54 9 11 XXXX-XXXX', 'tel')}</div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>WhatsApp</label><br />{input('whatsapp', 'Si es distinto al tel.')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Instagram</label><br />{input('instagram', '@tuperfil')}</div>
                <div><label style={{ fontSize: '12px', color: '#666' }}>Facebook</label><br />{input('facebook', 'fb.com/tuperfil')}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Email</label><br />
                {input('email', 'juan@ejemplo.com', 'email')}
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {paso === 2 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Experiencia técnica</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Tu capacidad como perforista</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Años de experiencia *</label><br />
                  <select value={form.experiencia} onChange={e => set('experiencia', e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px' }}>
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
                    style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px' }}>
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
                    onChange={e => set('profundidad_max', parseInt(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontSize: '14px', fontWeight: '600', minWidth: '70px' }}>{form.profundidad_max} metros</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Diámetros que perforás</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['3 pulgadas','4 pulgadas','6 pulgadas','8 pulgadas','Más de 8"'].map(v => <Tag key={v} campo="diametros" valor={v} />)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Zonas donde trabajás</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Buenos Aires','Santa Fe','Córdoba','Entre Ríos','La Pampa','Corrientes','Chaco','Salta','Mendoza','Otras'].map(v => <Tag key={v} campo="zonas_trabajo" valor={v} />)}
                </div>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {paso === 3 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Servicios y equipos</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Qué hacés y con qué trabajás</div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Servicios que ofrecés *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Perforación de pozos de agua','Instalación de bombas','Mantenimiento de pozos','Instalación solar','Aguadas para ganado','Perforación para riego','Relevamiento de napas'].map(v => <Tag key={v} campo="servicios" valor={v} />)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '6px' }}>Tipo de bomba que instalás</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {['Bomba eléctrica','Bomba a gasoil','Bomba solar','Molino','Bomba manual'].map(v => <Tag key={v} campo="tipo_bomba" valor={v} />)}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>¿Instalás o conocés sistemas de bombeo solar?</label><br />
                <select value={form.conoce_solar} onChange={e => set('conoce_solar', e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', marginTop: '4px' }}>
                  <option value="">Seleccioná...</option>
                  <option>Sí, ya instalé sistemas solares</option>
                  <option>Conozco el sistema pero no lo instalé</option>
                  <option>Me interesa aprender</option>
                  <option>No trabajo con solar</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Trabajos por mes (promedio)</label><br />
                <select value={form.trabajos_por_mes} onChange={e => set('trabajos_por_mes', e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', marginTop: '4px' }}>
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
                  placeholder="Ej: Trabajo en el norte de Buenos Aires hace 15 años. Especializado en pozos para ganadería extensiva..."
                  style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box', marginTop: '4px' }} />
              </div>
            </div>
          )}

          {/* PASO 4 */}
          {paso === 4 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>Últimos detalles</div>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem' }}>Ya casi estás en el directorio</div>

              <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#085041', marginBottom: '4px' }}>Accedé a equipos de bombeo solar</div>
                <div style={{ fontSize: '13px', color: '#0F6E56', lineHeight: '1.6' }}>Al registrarte te contactamos con las mejores opciones en kits solares para tus clientes de campo. Sin cargo y sin compromiso.</div>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
                <input type="checkbox" checked={form.quiere_info_equipos} onChange={e => set('quiere_info_equipos', e.target.checked)} style={{ marginTop: '2px' }} />
                <span style={{ fontSize: '13px', color: '#444' }}>Quiero recibir información sobre equipos y kits solares para el agro</span>
              </label>

              <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem', padding: '10px', background: '#f5f5f0', borderRadius: '8px' }}>
                <strong>Resumen:</strong> {form.nombre} {form.apellido} · {form.localidad}, {form.provincia} · {form.profundidad_max}m máx
              </div>
            </div>
          )}

          {/* NAVEGACIÓN */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '1.25rem' }}>
            {paso > 1 && (
              <button onClick={() => setPaso(p => p - 1)}
                style={{ flex: 1, padding: '10px', border: '0.5px solid #ccc', borderRadius: '8px', background: '#fff', fontSize: '14px', cursor: 'pointer' }}>
                ← Anterior
              </button>
            )}
            {paso < 4 && (
              <button onClick={() => setPaso(p => p + 1)}
                style={{ flex: 1, padding: '10px', background: '#1D9E75', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' }}>
                Siguiente →
              </button>
            )}
            {paso === 4 && (
              <button onClick={enviar} disabled={enviando}
                style={{ flex: 1, padding: '10px', background: '#085041', color: '#E1F5EE', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', fontWeight: '500' }}>
                {enviando ? 'Enviando...' : 'Publicar mi perfil gratis'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
