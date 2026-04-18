import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Directorio() {
  const [perforistas, setPerforistas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [provincia, setProvincia] = useState('')
  const [cargando, setCargando] = useState(true)

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  useEffect(() => { cargarPerforistas() }, [])

  async function cargarPerforistas() {
    setCargando(true)
    const { data, error } = await supabase
      .from('perforistas')
      .select('*')
      .eq('estado', 'activo')
      .order('created_at', { ascending: false })
    if (!error) setPerforistas(data || [])
    setCargando(false)
  }

  const filtrados = perforistas.filter(p => {
    const coincideBusqueda = !busqueda ||
      `${p.nombre} ${p.apellido} ${p.localidad}`.toLowerCase().includes(busqueda.toLowerCase())
    const coincideProvincia = !provincia || p.provincia === provincia
    return coincideBusqueda && coincideProvincia
  })

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f5f0' }}>

      <div style={{ background: '#085041', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#E1F5EE' }}>Pozeros Agro</div>
          <div style={{ fontSize: '12px', color: '#5DCAA5' }}>Directorio nacional de perforistas rurales</div>
        </div>
        <a href="/registrarme" style={{ background: '#1D9E75', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
          Registrarme gratis
        </a>
      </div>

      <div style={{ background: '#0F6E56', padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '16px', color: '#E1F5EE', fontWeight: '500', marginBottom: '12px' }}>
          Encontrá un perforista rural en tu zona
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o localidad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px' }}
          />
          <select
            value={provincia}
            onChange={e => setProvincia(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', fontSize: '14px', minWidth: '180px' }}
          >
            <option value="">Todas las provincias</option>
            {provincias.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
          {cargando ? 'Cargando...' : `${filtrados.length} perforistas encontrados`}
        </div>

        {cargando && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando directorio...</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {filtrados.map(p => (
            <div key={p.id} style={{ background: '#fff', borderRadius: '12px', border: '0.5px solid #e0e0d8', padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '15px', color: '#085041', flexShrink: 0 }}>
                  {p.nombre?.[0]}{p.apellido?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px' }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{p.localidad} · {p.provincia}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {p.estado === 'cliente' && (
                  <span style={{ fontSize: '11px', background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: '4px' }}>✓ Verificado Febecos</span>
                )}
                {p.conoce_solar === 'Sí, ya instalé sistemas solares' && (
                  <span style={{ fontSize: '11px', background: '#FAEEDA', color: '#633806', padding: '2px 8px', borderRadius: '4px' }}>Instala solar</span>
                )}
                {p.profundidad_max && (
                  <span style={{ fontSize: '11px', background: '#EEEDFE', color: '#3C3489', padding: '2px 8px', borderRadius: '4px' }}>{p.profundidad_max}m máx</span>
                )}
              </div>

              {p.servicios && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                  {p.servicios.slice(0,3).map(s => (
                    <span key={s} style={{ fontSize: '11px', background: '#f5f5f0', color: '#666', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '6px' }}>
                {p.visible_telefono && p.telefono && (
                  <a href={`tel:${p.telefono}`} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '0.5px solid #9FE1CB', background: '#E1F5EE', color: '#085041', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '500' }}>
                    Llamar
                  </a>
                )}
                {p.visible_whatsapp && p.whatsapp ? (
                  <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '0.5px solid #97C459', background: '#EAF3DE', color: '#27500A', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '500' }}>
                    WhatsApp
                  </a>
                ) : (
                  <div style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '0.5px solid #e0e0d8', background: '#f5f5f0', color: '#aaa', fontSize: '12px', textAlign: 'center' }}>
                    WA 🔒
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {!cargando && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
            No se encontraron perforistas para esa búsqueda.
          </div>
        )}
      </div>

      <div style={{ background: '#085041', padding: '1rem 1.5rem', marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: '#9FE1CB', marginBottom: '6px' }}>¿Necesitás equipar tu pozo con energía solar?</div>
        <a href="https://febecos.mitiendanube.com" target="_blank" rel="noreferrer" style={{ background: '#1D9E75', color: '#fff', padding: '8px 20px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '500' }}>
          Ver kits Febecos →
        </a>
      </div>

    </div>
  )
}
