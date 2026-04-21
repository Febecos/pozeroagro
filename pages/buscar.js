import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { registrarEvento, trackWhatsApp, trackTelefono } from '../lib/tracker'
import AdBanner from '../components/AdBanner'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

function normalizar(texto) {
  if (!texto) return ''
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const geocodeCache = {}
async function geocodificar(localidad, provincia) {
  const key = `${localidad},${provincia}`
  if (geocodeCache[key]) return geocodeCache[key]
  try {
    const res = await fetch(`/api/geocode?localidad=${encodeURIComponent(localidad)}&provincia=${encodeURIComponent(provincia)}`)
    const data = await res.json()
    if (data.lat && data.lng) {
      geocodeCache[key] = { lat: data.lat, lng: data.lng }
      return geocodeCache[key]
    }
  } catch (e) { console.warn('Geocodificacion fallo:', e.message) }
  return null
}

export default function Directorio() {
  const router = useRouter()
  const [perforistas, setPerforistas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState('')
  const [provincia, setProvincia] = useState('')
  const [cargando, setCargando] = useState(true)
  const [coordenadas, setCoordenadas] = useState({})
  const [mapaListo, setMapaListo] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mostrarMapa, setMostrarMapa] = useState(false)
  const [ratings, setRatings] = useState({})
  const [adMid, setAdMid] = useState(null)
  const [adBottom, setAdBottom] = useState(null)
  const [adMapa, setAdMapa] = useState(null)
  const [adFooter, setAdFooter] = useState(null)

  const mapRef = useRef(null)
  const mapaInstancia = useRef(null)
  const marcadores = useRef([])
  const infoWindow = useRef(null)

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Cordoba','Corrientes','Entre Rios','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquen',
    'Rio Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucuman'
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
      center: { lat: -38.5, lng: -63.5 }, zoom: 4,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      styles: [{ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] }]
    })
    infoWindow.current = new window.google.maps.InfoWindow()
  }, [mapaListo])

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
    registrarEvento('directorio_visto', null, { pagina: 'inicio' })
  }, [])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/perforistas?select=*&estado=in.(activo,cliente)&order=score_visibilidad.desc,created_at.desc`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      setPerforistas(Array.isArray(data) ? data : [])
      cargarRatings()
      cargarAds()
    } catch (e) {}
    setCargando(false)
  }

  async function cargarSlot(slot_id) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/campanas_activas?slot_id=eq.${slot_id}&limit=1`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      return Array.isArray(data) && data.length > 0 ? data[0] : null
    } catch (e) { return null }
  }

  async function cargarAds() {
    const [mid, bottom, mapa, footer] = await Promise.all([
      cargarSlot('listado_mid'),
      cargarSlot('listado_bottom'),
      cargarSlot('debajo_mapa'),
      cargarSlot('footer_top'),
    ])
    setAdMid(mid)
    setAdBottom(bottom)
    setAdMapa(mapa)
    setAdFooter(footer)
  }

  async function cargarRatings() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/comentarios?select=perforista_id,estrellas&estado=eq.publicado`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      if (!Array.isArray(data)) return
      const map = {}
      data.forEach(r => {
        if (!map[r.perforista_id]) map[r.perforista_id] = []
        map[r.perforista_id].push(r.estrellas)
      })
      const promedios = {}
      Object.keys(map).forEach(id => {
        const arr = map[id]
        promedios[id] = { promedio: arr.reduce((a, b) => a + b, 0) / arr.length, total: arr.length }
      })
      setRatings(promedios)
    } catch (e) {}
  }

  const filtrados = perforistas.filter(p => {
    const q = normalizar(busquedaActiva)
    const texto = normalizar(`${p.nombre} ${p.apellido} ${p.localidad}`)
    const coincideBusqueda = !busquedaActiva || texto.includes(q)
    const coincideProvincia = !provincia || p.provincia === provincia
    return coincideBusqueda && coincideProvincia
  })

  function ejecutarBusqueda() {
    setBusquedaActiva(busqueda)
    if (busqueda || provincia) {
      registrarEvento('busqueda_realizada', null, {
        termino: busqueda || null,
        provincia: provincia || null,
        resultados: filtrados.length
      })
    }
  }

  function handleCardClick(p) {
    registrarEvento('card_vista', p.id, { perforista_nombre: `${p.nombre} ${p.apellido}`, origen: 'directorio' })
    router.push(`/perforista/${p.id}`)
  }

  useEffect(() => {
    filtrados.forEach(async (p) => {
      if (!p.localidad || !p.provincia) return
      const key = `${p.localidad},${p.provincia}`
      if (coordenadas[key]) return
      const loc = await geocodificar(p.localidad, p.provincia)
      if (loc) setCoordenadas(prev => ({ ...prev, [key]: loc }))
    })
  }, [filtrados.length, busquedaActiva, provincia])

  useEffect(() => {
    if (!mapaInstancia.current || !window.google) return
    marcadores.current.forEach(m => m.setMap(null))
    marcadores.current = []
    const bounds = new window.google.maps.LatLngBounds()
    let hayPins = false

    filtrados.forEach(p => {
      const coord = coordenadas[`${p.localidad},${p.provincia}`]
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
          fillColor: '#0F4C81',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      })

      const wa = whatsappNum(p)
      const waLink = wa
        ? `<a href="javascript:void(0)" onclick="window.open('https://wa.me/${wa}?text=${encodeURIComponent('Me contacto desde Pozero Agro')}','_blank')" style="display:inline-block;margin-top:6px;padding:5px 12px;background:#25D366;color:#fff;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">💬 WhatsApp</a>`
        : ''
      const telLink = p.visible_telefono && p.telefono
        ? `<a href="tel:${p.telefono}" style="display:inline-block;margin-top:6px;margin-left:4px;padding:5px 12px;background:#e8f0fa;color:#0F4C81;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">📞 Llamar</a>`
        : ''
      const nombreColor = p.estado === 'cliente' ? '#0F4C81' : '#4a5568'

      marcador.addListener('click', () => {
        registrarEvento('pin_mapa_click', p.id, { perforista_nombre: `${p.nombre} ${p.apellido}`, origen: 'mapa' })
        infoWindow.current.setContent(`
          <div style="font-family:sans-serif;min-width:190px;padding:4px">
            <div style="font-weight:700;font-size:14px;color:${nombreColor}">${p.nombre} ${p.apellido}</div>
            <div style="font-size:12px;color:#888;margin-top:4px">📍 <strong>Zona:</strong> ${p.localidad}, ${p.provincia}</div>
            ${p.profundidad_max ? `<div style="font-size:11px;color:#6a0dad;margin-top:3px">⬇️ Hasta ${p.profundidad_max}m</div>` : ''}
            <div style="margin-top:6px">${waLink}${telLink}</div>
            <div style="margin-top:8px">
              <a href="/perforista/${p.id}" style="font-size:11px;color:#0F4C81;font-weight:600;">Ver perfil completo →</a>
            </div>
          </div>
        `)
        infoWindow.current.open(mapaInstancia.current, marcador)
      })

      marcadores.current.push(marcador)
    })

    if (hayPins) {
      filtrados.length === 1
        ? (mapaInstancia.current.setCenter(bounds.getCenter()), mapaInstancia.current.setZoom(10))
        : mapaInstancia.current.fitBounds(bounds, { padding: 60 })
    }
  }, [coordenadas, filtrados.length, busquedaActiva, provincia])

  function whatsappNum(p) {
    const num = p.whatsapp || p.telefono || ''
    return num.replace(/\D/g, '')
  }

  function Estrellas({ id, size = 13 }) {
    const r = ratings[id]
    if (!r) return null
    const llenas = Math.round(r.promedio)
    return (
      <span style={{ fontSize: size, color: '#F5A623' }}>
        {'★'.repeat(llenas)}{'☆'.repeat(5 - llenas)}
        <span style={{ fontSize: size - 1, color: '#999', marginLeft: 4 }}>({r.total})</span>
      </span>
    )
  }

  const MapaDiv = (
    <div style={{ position: 'sticky', top: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e8', background: '#e8f0fa' }}>
      <div ref={mapRef} style={{ width: '100%', height: '300px' }} />
      {!mapaListo && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '13px' }}>
          Cargando mapa...
        </div>
      )}
      {adMapa && !isMobile && (
        <div style={{ padding: '10px' }}>
          <AdBanner campaign={adMapa} />
        </div>
      )}
    </div>
  )

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, system-ui, sans-serif', minHeight: '100vh', background: '#F8FAFC' }}>

      {/* HEADER — blanco con wordmark nuevo */}
      <div style={{ background: '#fff', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', borderBottom: '1px solid rgba(15,76,129,0.1)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#0F4C81' }}>
          <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
            <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
            <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
            <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
          </svg>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: '5px', fontFamily: '"Montserrat", sans-serif', lineHeight: 1 }}>
            <span style={{ fontWeight: 800, letterSpacing: '0.005em', fontSize: '20px', color: '#0F4C81' }}>POZERO</span>
            <span style={{ fontWeight: 500, letterSpacing: '0.04em', fontSize: '15px', color: '#94A3B8', textTransform: 'uppercase' }}>AGRO</span>
          </span>
        </a>
      </div>

      {/* BANNER DE BÚSQUEDA — fondo claro, título con Montserrat */}
      <div style={{ background: '#fff', padding: '28px 24px 24px', borderBottom: '1px solid rgba(15,76,129,0.1)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: '"Montserrat", sans-serif', color: '#0F1E2E', marginBottom: '4px', letterSpacing: '-0.02em' }}>
            Encontrá un pocero en tu zona
          </div>
          <div style={{ fontSize: '14px', color: '#334155', marginBottom: '18px' }}>
            Directorio nacional de perforistas rurales
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Buscar por nombre o localidad..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && ejecutarBusqueda()}
              style={{ flex: '2 1 200px', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(15,76,129,0.2)', fontSize: '14px', boxSizing: 'border-box', background: '#F8FAFC', color: '#0F1E2E', fontFamily: 'inherit' }}
            />
            <select
              value={provincia}
              onChange={e => { setProvincia(e.target.value); setBusquedaActiva(busqueda) }}
              style={{ flex: '1 1 160px', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(15,76,129,0.2)', fontSize: '14px', background: '#F8FAFC', color: '#0F1E2E', fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="">Todas las provincias</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button
              onClick={ejecutarBusqueda}
              style={{ padding: '12px 28px', background: '#0F4C81', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#0A3A63'}
              onMouseLeave={e => e.currentTarget.style.background = '#0F4C81'}>
              Buscar
            </button>
            {isMobile && (
              <button
                onClick={() => setMostrarMapa(v => !v)}
                style={{ padding: '12px 16px', background: mostrarMapa ? '#0F4C81' : '#F8FAFC', color: mostrarMapa ? '#fff' : '#0F4C81', border: '1px solid rgba(15,76,129,0.2)', borderRadius: '8px', fontSize: '18px', cursor: 'pointer' }}>
                🗺️
              </button>
            )}
          </div>
        </div>
      </div>

      {isMobile && mostrarMapa && (
        <div style={{ padding: '1rem 1.5rem 0' }}>{MapaDiv}</div>
      )}

      <div style={{ display: 'flex', gap: '16px', padding: '1.25rem 1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            {cargando ? 'Cargando...' : `${filtrados.length} perforistas encontrados`}
          </div>
          {cargando && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Cargando directorio...</div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {filtrados.map((p, index) => {
              const wa = whatsappNum(p)
              const esCliente = p.estado === 'cliente'
              const nombreCompleto = `${p.nombre} ${p.apellido}`
              return (
                <>
                  <div key={p.id}
                    onClick={() => handleCardClick(p)}
                    style={{
                      background: '#fff', borderRadius: '12px', cursor: 'pointer',
                      border: '0.5px solid #e0e0e8',
                      padding: '1rem', transition: 'box-shadow 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,79,138,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', color: '#0F4C81', flexShrink: 0 }}>
                        {p.nombre?.[0]}{p.apellido?.[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: esCliente ? '#0F4C81' : '#4a5568', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nombreCompleto}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>📍 {p.localidad} · {p.provincia}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '8px', minHeight: '18px' }}>
                      <Estrellas id={p.id} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {p.profundidad_max && (
                        <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#6a0dad', padding: '2px 6px', borderRadius: '4px' }}>
                          ⬇️ {p.profundidad_max}m
                        </span>
                      )}
                      {p.conoce_solar === 'Si, ya instale sistemas solares' && (
                        <span style={{ fontSize: '10px', background: '#fff3e0', color: '#E65100', padding: '2px 6px', borderRadius: '4px' }}>
                          ☀️ Solar
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      {p.visible_telefono && p.telefono && (
                        <a href={`tel:${p.telefono}`}
                          onClick={() => trackTelefono(p.id, p.telefono, nombreCompleto)}
                          style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '0.5px solid #0F4C81', background: '#e8f0fa', color: '#0F4C81', fontSize: '11px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}>
                          📞 Llamar
                        </a>
                      )}
                      {wa && (
                        <button
                          onClick={() => trackWhatsApp(p.id, wa, nombreCompleto)}
                          style={{ flex: 1, padding: '6px', borderRadius: '6px', background: '#25D366', color: '#fff', fontSize: '11px', textAlign: 'center', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                          💬 WA
                        </button>
                      )}
                    </div>
                  </div>

                  {index === 2 && adMid && (
                    <div key="ad-mid">
                      <AdBanner campaign={adMid} />
                    </div>
                  )}
                </>
              )
            })}
          </div>

          {!cargando && filtrados.length > 0 && adBottom && (
            <div style={{ marginTop: '12px' }}>
              <AdBanner campaign={adBottom} />
            </div>
          )}

          {!cargando && filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              No se encontraron perforistas para esa busqueda.
            </div>
          )}

          {!cargando && filtrados.length > 0 && (
            <div style={{ marginTop: '16px', padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '0.5px solid #e0e0e8', fontSize: '11px', color: '#aaa', lineHeight: '1.6' }}>
              Pozero Agro es un directorio informativo. No garantiza la calidad ni los resultados de los servicios publicados. La contratación es de exclusiva responsabilidad del usuario.{' '}
              <a href="/terminos" style={{ color: '#0F4C81', textDecoration: 'none' }}>Términos y condiciones</a>
              {' · '}
              <a href="/terminos#privacidad" style={{ color: '#0F4C81', textDecoration: 'none' }}>Privacidad</a>
            </div>
          )}
        </div>

        {!isMobile && (
          <div style={{ width: '320px', flexShrink: 0 }}>{MapaDiv}</div>
        )}
      </div>

      {adFooter && (
        <div style={{ padding: '0 1.5rem 1rem' }}>
          <AdBanner campaign={adFooter} />
        </div>
      )}

      <div style={{ background: '#0F4C81', padding: '20px 24px', marginTop: '0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Términos y condiciones</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Política de privacidad</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/contacto" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Contacto</a>
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 Pozero Agro · Argentina</div>
      </div>

    </div>
  )
}
