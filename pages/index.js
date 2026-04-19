import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = 'https://qfesxpcuhsrfdohnsleg.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI'
const MAPS_KEY = 'AIzaSyDKa3m8XzcZRctP9Wpi2EFYWLEj0woGNWY'

const geocodeCache = {}

async function geocodificar(localidad, provincia) {
  const key = `${localidad},${provincia}`
  if (geocodeCache[key]) return geocodeCache[key]
  try {
    const q = encodeURIComponent(`${localidad}, ${provincia}, Argentina`)
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${MAPS_KEY}`)
    const data = await res.json()
    if (data.results && data.results[0]) {
      const loc = data.results[0].geometry.location
      geocodeCache[key] = loc
      return loc
    }
  } catch (e) {}
  return null
}

export default function Directorio() {
  const [perforistas, setPerforistas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [provincia, setProvincia] = useState('')
  const [cargando, setCargando] = useState(true)
  const [coordenadas, setCoordenadas] = useState({})
  const [mapaListo, setMapaListo] = useState(false)
  const [seleccionado, setSeleccionado] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mostrarMapa, setMostrarMapa] = useState(false)

  const mapRef = useRef(null)
  const mapaInstancia = useRef(null)
  const marcadores = useRef([])
  const infoWindow = useRef(null)

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (window.google) { setMapaListo(true); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`
    script.async = true
    script.onload = () => setMapaListo(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapaListo || !mapRef.current || mapaInstancia.current) return
    mapaInstancia.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -38.5, lng: -63.5 },
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
    })
    infoWindow.current = new window.google.maps.InfoWindow()
  }, [mapaListo])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/perforistas?select=*&estado=in.(activo,cliente)&order=created_at.desc`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` }
    })
    const data = await res.json()
    setPerforistas(Array.isArray(data) ? data : [])
    setCargando(false)
  }

  const filtrados = perforistas.filter(p => {
    const q = busqueda.toLowerCase()
    const coincideBusqueda = !busqueda || `${p.nombre} ${p.apellido} ${p.localidad}`.toLowerCase().includes(q)
    const coincideProvincia = !provincia || p.provincia === provincia
    return coincideBusqueda && coincideProvincia
  })

  // Geocodificar perforistas filtrados
  useEffect(() => {
    filtrados.forEach(async (p) => {
      if (!p.localidad || !p.provincia) return
      const key = `${p.localidad},${p.provincia}`
      if (coordenadas[key]) return
      const loc = await geocodificar(p.localidad, p.provincia)
      if (loc) setCoordenadas(prev => ({ ...prev, [key]: loc }))
    })
  }, [filtrados.length, busqueda, provincia])

  // Actualizar marcadores
  useEffect(() => {
    if (!mapaInstancia.current || !window.google) return
    marcadores.current.forEach(m => m.setMap(null))
    marcadores.current = []
    const bounds = new window.google.maps.LatLngBounds()
    let hayPins = false

    filtrados.forEach(p => {
      const key = `${p.localidad},${p.provincia}`
      const coord = coordenadas[key]
      if (!coord) return
      hayPins = true
      bounds.extend(coord)

      const marcador = new window.google.maps.Marker({
        position: coord,
        map: mapaInstancia.current,
        title: `${p.nombre} ${p.apellido}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: p.estado === 'cliente' ? '#1B4F8A' : '#F26419',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        }
      })

      const waLink = p.visible_whatsapp && p.whatsapp
        ? `<a href="https://wa.me/${p.whatsapp.replace(/\D/g,'')}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}" target="_blank" style="display:inline-block;margin-top:6px;padding:5px 12px;background:#25D366;color:#fff;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">💬 WhatsApp</a>`
        : ''
      const telLink = p.visible_telefono && p.telefono
        ? `<a href="tel:${p.telefono}" style="display:inline-block;margin-top:6px;margin-left:4px;padding:5px 12px;background:#e8f0fa;color:#1B4F8A;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">📞 Llamar</a>`
        : ''

      marcador.addListener('click', () => {
        infoWindow.current.setContent(`
          <div style="font-family:sans-serif;min-width:180px;padding:4px">
            <div style="font-weight:700;font-size:14px;color:#1a1a2e">${p.nombre} ${p.apellido}</div>
            <div style="font-size:12px;color:#888;margin-top:2px">📍 ${p.localidad} · ${p.provincia}</div>
            ${p.profundidad_max ? `<div style="font-size:11px;color:#6a0dad;margin-top:4px">⬇️ Hasta ${p.profundidad_max}m</div>` : ''}
            <div style="margin-top:4px">${waLink}${telLink}</div>
          </div>
        `)
        infoWindow.current.open(mapaInstancia.current, marcador)
        setSeleccionado(p.id)
      })

      marcadores.current.push(marcador)
    })

    if (hayPins) {
      filtrados.length === 1
        ? (mapaInstancia.current.setCenter(bounds.getCenter()), mapaInstancia.current.setZoom(10))
        : mapaInstancia.current.fitBounds(bounds, { padding: 60 })
    }
  }, [coordenadas, filtrados.length, busqueda, provincia])

  function linkWhatsApp(numero) {
    const limpio = numero.replace(/\D/g, '')
    return `https://wa.me/${limpio}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}`
  }

  function linkMaps(localidad, prov) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${localidad}, ${prov}, Argentina`)}`
  }

  const MapaDiv = (
    <div style={{
      position: 'sticky', top: '0',
      height: isMobile ? '300px' : 'calc(100vh - 130px)',
      borderRadius: '12px', overflow: 'hidden',
      border: '1px solid #e0e0e8', background: '#e8f0fa'
    }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      {!mapaListo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px' }}>
          Cargando mapa...
        </div>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', background: '#f5f7fa' }}>

      {/* HEADER */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" viewBox="0 0 100 100">
              <polygon points="15,15 85,15 50,75" fill="#fff"/>
              <rect x="44" y="8" width="12" height="38" fill="#1B4F8A" rx="2"/>
              <circle cx="50" cy="80" r="9" fill="#fff"/>
              <circle cx="50" cy="80" r="3.5" fill="#1B4F8A"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Pozero Agro</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', letterSpacing: '2px', textTransform: 'uppercase' }}>Directorio Nacional</div>
          </div>
        </div>
        <a href="/registrarme" style={{ background: '#F26419', color: '#fff', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
          Registrarme gratis
        </a>
      </div>

      {/* HERO BÚSQUEDA */}
      <div style={{ background: '#1B4F8A', padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '16px', color: '#fff', fontWeight: '600', marginBottom: '12px' }}>
          Encontrá un perforista rural en tu zona
        </div>
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o localidad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              padding: '10px 14px', borderRadius: '6px',
              border: '1.5px solid rgba(255,255,255,0.4)',
              fontSize: '14px', width: '100%', boxSizing: 'border-box',
              background: '#fff', color: '#333',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={provincia}
              onChange={e => setProvincia(e.target.value)}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '6px',
                border: '1.5px solid rgba(255,255,255,0.4)',
                fontSize: '14px', background: '#fff', color: '#333',
              }}
            >
              <option value="">Todas las provincias</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={() => {}}
              style={{
                padding: '10px 24px', background: '#F26419', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '14px',
                fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
              Buscar
            </button>
            {isMobile && (
              <button
                onClick={() => setMostrarMapa(v => !v)}
                style={{
                  padding: '10px 14px',
                  background: mostrarMapa ? '#fff' : 'rgba(255,255,255,0.15)',
                  color: mostrarMapa ? '#1B4F8A' : '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '18px',
                  cursor: 'pointer',
                }}>
                🗺️
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAPA MOBILE */}
      {isMobile && mostrarMapa && (
        <div style={{ padding: '1rem 1.5rem 0' }}>{MapaDiv}</div>
      )}

      {/* CONTENIDO */}
      <div style={{ display: 'flex', gap: '16px', padding: '1.25rem 1.5rem', alignItems: 'flex-start' }}>

        {/* CARDS */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            {cargando ? 'Cargando...' : `${filtrados.length} perforistas encontrados`}
          </div>
          {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando directorio...</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtrados.map(p => (
              <div
                key={p.id}
                onClick={() => setSeleccionado(p.id)}
                style={{
                  background: '#fff', borderRadius: '12px', cursor: 'pointer',
                  border: seleccionado === p.id
                    ? '2px solid #F26419'
                    : p.estado === 'cliente' ? '1.5px solid #1B4F8A' : '0.5px solid #e0e0e8',
                  padding: '1rem 1.25rem',
                  boxShadow: seleccionado === p.id ? '0 4px 16px rgba(242,100,25,0.15)' : 'none',
                  transition: 'box-shadow 0.15s',
                }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '15px', color: '#1B4F8A', flexShrink: 0 }}>
                    {p.nombre?.[0]}{p.apellido?.[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '15px', color: '#1a1a2e' }}>{p.nombre} {p.apellido}</div>
                    <a
                      href={linkMaps(p.localidad, p.provincia)}
                      target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: '12px', color: '#1B4F8A', textDecoration: 'none' }}
                    >
                      📍 {p.localidad} · {p.provincia}
                    </a>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {p.estado === 'cliente' && (
                    <span style={{ fontSize: '11px', background: '#e8f0fa', color: '#1B4F8A', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>✓ Verificado Febecos</span>
                  )}
                  {p.conoce_solar === 'Sí, ya instalé sistemas solares' && (
                    <span style={{ fontSize: '11px', background: '#fff3e0', color: '#E65100', padding: '2px 8px', borderRadius: '4px' }}>Instala solar</span>
                  )}
                  {p.profundidad_max && (
                    <span style={{ fontSize: '11px', background: '#f3e8ff', color: '#6a0dad', padding: '2px 8px', borderRadius: '4px' }}>{p.profundidad_max}m máx</span>
                  )}
                </div>

                {p.servicios && p.servicios.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {p.servicios.slice(0, 3).map(s => (
                      <span key={s} style={{ fontSize: '11px', background: '#f5f5f5', color: '#666', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '6px' }}>
                  {p.visible_telefono && p.telefono && (
                    <a href={`tel:${p.telefono}`} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '0.5px solid #1B4F8A', background: '#e8f0fa', color: '#1B4F8A', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}>
                      📞 Llamar
                    </a>
                  )}
                  {p.visible_whatsapp && p.whatsapp ? (
                    <a
                      href={linkWhatsApp(p.whatsapp)}
                      target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ flex: 1, padding: '7px', borderRadius: '6px', background: '#25D366', color: '#fff', fontSize: '12px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}
                    >
                      💬 WhatsApp
                    </a>
                  ) : p.visible_whatsapp === false ? (
                    <div style={{ flex: 1, padding: '7px', borderRadius: '6px', background: '#f0f0f0', color: '#aaa', fontSize: '12px', textAlign: 'center' }}>
                      WA 🔒
                    </div>
                  ) : null}
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

        {/* MAPA DESKTOP */}
        {!isMobile && (
          <div style={{ width: '420px', flexShrink: 0 }}>
            {MapaDiv}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ background: '#1B4F8A', padding: '1rem 1.5rem', marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>¿Necesitás equipar tu pozo con energía solar?</div>
        <a href="https://febecos.mitiendanube.com" target="_blank" rel="noreferrer"
          style={{ background: '#F26419', color: '#fff', padding: '9px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
          Ver kits Febecos →
        </a>
      </div>

    </div>
  )
}
