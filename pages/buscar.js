import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import SEO from '../components/SEO'
import { registrarEvento, trackWhatsApp, trackTelefono } from '../lib/tracker'
import { titleCase, nombreCompleto } from '../lib/formato'
import AdBanner from '../components/AdBanner'
import SocialBadge from '../components/SocialBadge'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

function normalizar(texto) {
  if (!texto) return ''
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// Sinónimos de la profesión. Si el usuario busca cualquiera de estos términos,
// lo tratamos como "busca un profesional" (matchea con todos los perforistas).
const SINONIMOS_POZERO = [
  'pozero', 'pozera', 'pozeros', 'pozeras',
  'pocero', 'pocera', 'poceros', 'poceras',
  'posero', 'poseros',
  'perforista', 'perforistas', 'perforador', 'perforadores',
  'pocista', 'pocistas',
  'pozo', 'pozos', 'pozero', 'poceria'
]

function esTerminoProfesion(q) {
  if (!q) return false
  const normalizado = normalizar(q).trim()
  return SINONIMOS_POZERO.includes(normalizado)
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
    let cancelled = false

    async function init() {
      // Si ya está cargado todo
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        if (!cancelled) setMapaListo(true)
        return
      }

      // Cargar el script si no existe
      if (!window.google) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=marker&loading=async&v=weekly`
          script.async = true
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      // Asegurar que la librería marker está cargada
      try {
        await window.google.maps.importLibrary('marker')
        await window.google.maps.importLibrary('maps')
      } catch (e) {
        console.error('Error cargando librerías de Google Maps:', e)
        return
      }

      if (!cancelled) setMapaListo(true)
    }

    init()

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mapaListo || !mapRef.current || mapaInstancia.current) return
    mapaInstancia.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: -38.5, lng: -63.5 }, zoom: 4,
      mapId: 'c3fc81abb800c8c3e62d55d1', // Map ID requerido para AdvancedMarkerElement
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false
    })
    infoWindow.current = new window.google.maps.InfoWindow()
  }, [mapaListo, mostrarMapa])

  // Redimensionar el mapa cuando se muestra/oculta el contenedor
  useEffect(() => {
    if (!mapaInstancia.current || !window.google) return
    if (mostrarMapa) {
      // Pequeño delay para que el DOM termine de mostrar el div
      const t = setTimeout(() => {
        window.google.maps.event.trigger(mapaInstancia.current, 'resize')
      }, 100)
      return () => clearTimeout(t)
    }
  }, [mostrarMapa])

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
    registrarEvento('directorio_visto', null, { pagina: 'buscar' })
  }, [])

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      // Usamos endpoint propio que NO expone whatsapp/teléfono
      const res = await fetch('/api/directorio')
      const data = await res.json()
      const lista = Array.isArray(data) ? data : []

      // Orden: clientes primero (más antiguos arriba), después activos (más antiguos arriba)
      lista.sort((a, b) => {
        const aEsCliente = a.estado === 'cliente' ? 0 : 1
        const bEsCliente = b.estado === 'cliente' ? 0 : 1
        if (aEsCliente !== bEsCliente) return aEsCliente - bEsCliente
        // Misma categoría: más antiguos primero
        return new Date(a.created_at) - new Date(b.created_at)
      })

      setPerforistas(lista)
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
    // Si busca un sinónimo de profesión ("pocero", "perforista", etc.), matchea a todos
    const esProfesion = esTerminoProfesion(busquedaActiva)
    const coincideBusqueda = !busquedaActiva || esProfesion || texto.includes(q)
    const coincideProvincia = !provincia || normalizar(p.provincia) === normalizar(provincia)
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
    if (!window.google.maps.marker?.AdvancedMarkerElement) return // librería marker aún no cargada
    marcadores.current.forEach(m => { m.map = null })
    marcadores.current = []
    const bounds = new window.google.maps.LatLngBounds()
    let hayPins = false

    filtrados.forEach(p => {
      const coord = coordenadas[`${p.localidad},${p.provincia}`]
      if (!coord) return
      hayPins = true
      bounds.extend(coord)

      // AdvancedMarkerElement usa un elemento HTML personalizado
      const esCliente = p.estado === 'cliente'
      const pinColor = esCliente ? '#0F4C81' : '#0F4C81'
      const pinDiv = document.createElement('div')
      pinDiv.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${pinColor};
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        cursor: pointer;
      `

      const marcador = new window.google.maps.marker.AdvancedMarkerElement({
        position: coord,
        map: mapaInstancia.current,
        title: `${p.nombre} ${p.apellido}`,
        content: pinDiv
      })

      const nombreColor = p.estado === 'cliente' ? '#0F4C81' : '#4a5568'
      const nombreFmt = nombreCompleto(p.nombre, p.apellido)
      const localidadFmt = titleCase(p.localidad)
      const provinciaFmt = titleCase(p.provincia)

      marcador.addListener('click', () => {
        registrarEvento('pin_mapa_click', p.id, { perforista_nombre: nombreFmt, origen: 'mapa' })
        infoWindow.current.setContent(`
          <div style="font-family:Inter,sans-serif;min-width:190px;padding:4px">
            <div style="font-weight:700;font-size:14px;color:${nombreColor}">${nombreFmt}</div>
            <div style="font-size:12px;color:#888;margin-top:4px">📍 <strong>Zona:</strong> ${localidadFmt}, ${provinciaFmt}</div>
            ${p.profundidad_max ? `<div style="font-size:11px;color:#6a0dad;margin-top:3px">⬇️ Hasta ${p.profundidad_max}m</div>` : ''}
            <div style="margin-top:10px">
              <a href="/perforista/${p.id}" style="display:inline-block;padding:6px 14px;background:#0F4C81;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">Ver perfil y contactar →</a>
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
  }, [coordenadas, filtrados.length, busquedaActiva, provincia, mostrarMapa])

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
    <div style={{ position: 'sticky', top: 16, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e9f0', background: '#e8f0fa' }}>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />
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
    <>
      <SEO
        path="/buscar"
        title="Buscar Pozero"
        description="Encontrá perforistas rurales en Argentina por provincia o localidad. Perfiles con reviews, zonas de trabajo, y contacto directo por WhatsApp."
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
        html, body { -webkit-text-size-adjust: 100%; }
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
        {/* ─── HEADER ─── */}
        <header className="site-header">
          <div className="header-inner">
            <a href="/" className="logo" aria-label="Pozero Agro — volver al inicio">
              <svg className="logo-mark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M23.5 21H76.5L50 85L23.5 21Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="2.5" strokeLinejoin="round"/>
                <path d="M46 12H54V59H46V12Z" fill="#F8FAFC"/>
                <path d="M50 97C55 97 59 93 59 88.5C59 84 50 75 50 75C50 75 41 84 41 88.5C41 93 45 97 50 97Z" fill="#0F4C81" stroke="#0F4C81" strokeWidth="1" strokeLinejoin="round"/>
                <circle cx="50" cy="88" r="1.5" fill="white" fillOpacity="0.4"/>
              </svg>
              <span className="logo-wordmark">
                <span className="pozero">POZERO</span>
                <span className="agro">AGRO</span>
              </span>
            </a>
          </div>
        </header>

        {/* ─── MINI HERO AZUL ─── */}
        <section className="minihero">
          <div className="minihero-inner">
            <h1 className="mh-title">Encontrá tu Pozero</h1>
            <p className="mh-sub">Buscá por nombre, localidad o filtrá por provincia. Contactá directo, sin intermediarios.</p>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Buscar por nombre o localidad..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && ejecutarBusqueda()}
                className="search-input"
              />
              <select
                value={provincia}
                onChange={e => { setProvincia(e.target.value); setBusquedaActiva(busqueda) }}
                className="search-select"
              >
                <option value="">Todas las provincias</option>
                {provincias.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <button onClick={ejecutarBusqueda} className="search-btn">Buscar</button>
              {isMobile && (
                <button
                  onClick={() => setMostrarMapa(v => !v)}
                  className={`map-toggle ${mostrarMapa ? 'active' : ''}`}
                  aria-label="Mostrar u ocultar mapa"
                >
                  <span className="map-toggle-icon">🗺️</span>
                  <span className="map-toggle-text">{mostrarMapa ? 'Ocultar mapa' : 'Ver mapa'}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ─── MOBILE MAP ─── */}
        {isMobile && mostrarMapa && (
          <div className="mobile-map">{MapaDiv}</div>
        )}

        {/* ─── CONTENIDO ─── */}
        <main className="content">
          <div className="content-inner">
            <div className="results-col">
              <div className="results-count">
                {cargando ? 'Cargando...' : `${filtrados.length} ${filtrados.length === 1 ? 'Pozero encontrado' : 'Pozeros encontrados'}`}
              </div>

              {cargando && (
                <div className="loading-msg">Cargando directorio...</div>
              )}

              <div className="cards-grid">
                {filtrados.map((p, index) => {
                  const esCliente = p.estado === 'cliente'
                  const nombreFormateado = nombreCompleto(p.nombre, p.apellido)
                  const localidadFormateada = titleCase(p.localidad)
                  const provinciaFormateada = titleCase(p.provincia)
                  return (
                    <>
                      <div key={p.id} onClick={() => handleCardClick(p)} className="card">
                        <div className="card-head">
                          <div className="avatar">
                            {nombreFormateado.split(' ').map(w => w[0]).slice(0, 2).join('')}
                          </div>
                          <div className="card-identity">
                            <div className={`card-name ${esCliente ? 'is-cliente' : ''}`}>
                              {nombreFormateado}
                              {esCliente && (
                                <span className="verified-check" title="Cliente verificado Pozero Agro" aria-label="Verificado">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 2L14.39 5.42 18.24 4.76 18.9 8.61 22.32 11 18.9 13.39 18.24 17.24 14.39 16.58 12 20 9.61 16.58 5.76 17.24 5.1 13.39 1.68 11 5.1 8.61 5.76 4.76 9.61 5.42z"/>
                                    <path d="M10.5 13.5l-2-2 1.4-1.4 0.6 0.6 3.6-3.6 1.4 1.4z" fill="#fff"/>
                                  </svg>
                                </span>
                              )}
                            </div>
                            <div className="card-location">📍 {localidadFormateada} · {provinciaFormateada}</div>
                          </div>
                        </div>
                        <div className="card-rating">
                          <Estrellas id={p.id} />
                        </div>
                        <div className="card-tags">
                          {p.profundidad_max && (
                            <span className="tag tag-depth">⬇️ {p.profundidad_max}m</span>
                          )}
                          {p.conoce_solar === 'Si, ya instale sistemas solares' && (
                            <span className="tag tag-solar">☀️ Solar</span>
                          )}
                        </div>
                        <div className="card-actions" onClick={e => e.stopPropagation()}>
                          {p.visible_telefono && (
                            <button
                              onClick={async () => {
                                const num = await trackTelefono(p.id, null, nombreFormateado)
                                if (num) window.location.href = `tel:${num}`
                              }}
                              className="btn-phone">
                              📞 Llamar
                            </button>
                          )}
                          {p.visible_whatsapp && (
                            <button
                              onClick={() => trackWhatsApp(p.id, null, nombreFormateado)}
                              className="btn-wa">
                              💬 WA
                            </button>
                          )}
                        </div>
                      </div>

                      {index === 2 && adMid && (
                        <div key="ad-mid" className="ad-inline">
                          <AdBanner campaign={adMid} />
                        </div>
                      )}
                    </>
                  )
                })}
              </div>

              {!cargando && filtrados.length > 0 && adBottom && (
                <div className="ad-bottom">
                  <AdBanner campaign={adBottom} />
                </div>
              )}

              {!cargando && filtrados.length === 0 && (
                <div className="empty-msg">No se encontraron Pozeros para esa búsqueda.</div>
              )}

              {!cargando && filtrados.length > 0 && (
                <div className="disclaimer">
                  Pozero Agro es un directorio informativo. No garantiza la calidad ni los resultados de los servicios publicados. La contratación es de exclusiva responsabilidad del usuario.{' '}
                  <a href="/terminos">Términos y condiciones</a>
                  {' · '}
                  <a href="/terminos#privacidad">Privacidad</a>
                </div>
              )}
            </div>

            {!isMobile && (
              <div className="map-col">{MapaDiv}</div>
            )}
          </div>
        </main>

        {adFooter && (
          <div className="ad-footer">
            <AdBanner campaign={adFooter} />
          </div>
        )}

        {/* ─── BOTÓN FLOTANTE: SOS POCERO? ─── */}
        <a href="/registrarme" className="fab" aria-label="Soy Pozero, sumarme a la red">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          <span className="fab-text">Soy Pozero</span>
        </a>

        {/* ─── FOOTER ─── */}
        <footer className="site-footer">
          <div className="footer-links">
            <a href="/terminos">Términos y condiciones</a>
            <span className="sep">·</span>
            <a href="/terminos#privacidad">Política de privacidad</a>
            <span className="sep">·</span>
            <a href="/como-funciona">Cómo funciona</a>
            <span className="sep">·</span>
            <a href="/contacto">Contacto</a>
          </div>
          <div className="copyright">© 2026 Pozero Agro · Argentina</div>
        </footer>
      </div>

      <SocialBadge />

      <style jsx>{`
        .page { min-height: 100vh; display: flex; flex-direction: column; }

        /* ─── HEADER ─── */
        .site-header {
          background: #fff;
          border-bottom: 1px solid var(--line);
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .header-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-mark {
          width: 32px;
          height: 32px;
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
          font-size: 18px;
          color: var(--azul-pozero);
        }
        .agro {
          font-weight: 500;
          letter-spacing: 0.04em;
          font-size: 13px;
          color: var(--gris-agro);
          text-transform: uppercase;
        }

        /* ─── MINIHERO ─── */
        .minihero {
          background: linear-gradient(135deg, var(--azul-pozero) 0%, var(--azul-pozero-deep) 100%);
          padding: 36px 20px 28px;
          color: #fff;
        }
        .minihero-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
        .mh-title {
          font-family: "Montserrat", sans-serif;
          font-weight: 800;
          font-size: clamp(28px, 5vw, 42px);
          letter-spacing: -0.02em;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .mh-sub {
          font-size: clamp(14px, 1.4vw, 16px);
          color: rgba(255,255,255,0.85);
          margin-bottom: 20px;
          max-width: 620px;
          line-height: 1.4;
        }

        .search-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
          padding: 8px;
          border-radius: 12px;
        }
        .search-input {
          flex: 2 1 200px;
          padding: 11px 14px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          background: #fff;
          color: var(--ink);
          outline: none;
          font-family: "Inter", sans-serif;
        }
        .search-input:focus {
          box-shadow: 0 0 0 2px var(--verde-solar);
        }
        .search-select {
          flex: 1 1 160px;
          padding: 11px 14px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          background: #fff;
          color: var(--ink);
          outline: none;
          cursor: pointer;
          font-family: "Inter", sans-serif;
        }
        .search-btn {
          padding: 11px 24px;
          background: var(--verde-solar);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          font-family: "Inter", sans-serif;
          transition: background 0.2s;
        }
        .search-btn:hover { background: #16A34A; }
        .map-toggle {
          padding: 12px 16px;
          background: rgba(255,255,255,0.12);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          transition: background 0.2s;
        }
        .map-toggle:hover {
          background: rgba(255,255,255,0.18);
        }
        .map-toggle.active {
          background: rgba(255,255,255,0.25);
          border-color: rgba(255,255,255,0.4);
        }
        .map-toggle-icon {
          font-size: 16px;
        }
        .map-toggle-text {
          font-family: "Inter", sans-serif;
        }

        .mobile-map {
          padding: 16px 20px 0;
        }

        /* ─── CONTENIDO ─── */
        .content {
          flex: 1;
          padding: 24px 20px;
        }
        .content-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }
        .results-col {
          flex: 1;
          min-width: 0;
        }
        .map-col {
          width: 340px;
          flex-shrink: 0;
        }

        .results-count {
          font-size: 13px;
          color: var(--gris-agro);
          margin-bottom: 14px;
          font-weight: 500;
        }

        .loading-msg, .empty-msg {
          text-align: center;
          padding: 3rem 1rem;
          color: #888;
          font-size: 14px;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 14px;
        }

        /* ─── TARJETA ─── */
        .card {
          background: #fff;
          border-radius: 12px;
          cursor: pointer;
          border: 1px solid #e5e9f0;
          padding: 16px;
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .card:hover {
          box-shadow: 0 8px 24px -6px rgba(15, 76, 129, 0.18);
          border-color: rgba(15, 76, 129, 0.25);
          transform: translateY(-1px);
        }
        .card-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 10px;
        }
        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #e8f0fa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 15px;
          color: var(--azul-pozero);
          flex-shrink: 0;
          font-family: "Montserrat", sans-serif;
        }
        .card-identity { min-width: 0; flex: 1; }
        .card-name {
          font-weight: 600;
          font-size: 15px;
          color: #4a5568;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-family: "Inter", sans-serif;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .card-name.is-cliente { color: var(--azul-pozero); }
        .verified-check {
          display: inline-flex;
          color: var(--azul-pozero);
          flex-shrink: 0;
          line-height: 0;
        }
        .card-location {
          font-size: 11px;
          color: #94A3B8;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-rating {
          margin-bottom: 10px;
          min-height: 18px;
        }

        .card-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 12px;
          min-height: 20px;
        }
        .tag {
          font-size: 10px;
          padding: 3px 7px;
          border-radius: 4px;
          font-weight: 500;
        }
        .tag-depth { background: #f3e8ff; color: #6a0dad; }
        .tag-solar { background: #fff3e0; color: #E65100; }

        .card-actions {
          display: flex;
          gap: 6px;
        }
        .btn-phone {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: 1px solid var(--azul-pozero);
          background: #e8f0fa;
          color: var(--azul-pozero);
          font-size: 11px;
          text-align: center;
          font-weight: 600;
          transition: background 0.15s;
        }
        .btn-phone:hover { background: var(--azul-pozero); color: #fff; }
        .btn-wa {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          background: #25D366;
          color: #fff;
          font-size: 11px;
          text-align: center;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-wa:hover { background: #1EB758; }

        .ad-inline, .ad-bottom {
          margin: 4px 0;
        }
        .ad-bottom { margin-top: 14px; }
        .ad-footer {
          padding: 0 20px 16px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .disclaimer {
          margin-top: 18px;
          padding: 12px 14px;
          background: #fff;
          border-radius: 8px;
          border: 1px solid #e5e9f0;
          font-size: 11px;
          color: var(--gris-agro);
          line-height: 1.6;
        }
        .disclaimer a {
          color: var(--azul-pozero);
          font-weight: 500;
        }
        .disclaimer a:hover { text-decoration: underline; }

        /* ─── FAB FLOTANTE SOS POCERO? ─── */
        .fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 30;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          background: var(--azul-pozero);
          color: #fff;
          border-radius: 999px;
          font-family: "Inter", sans-serif;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 8px 24px -4px rgba(15, 76, 129, 0.45), 0 2px 6px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          text-decoration: none;
        }
        .fab:hover {
          background: var(--azul-pozero-deep);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px -4px rgba(15, 76, 129, 0.55), 0 4px 10px rgba(0,0,0,0.15);
        }
        .fab:active {
          transform: translateY(0);
        }
        .fab svg {
          flex-shrink: 0;
          background: rgba(255,255,255,0.2);
          border-radius: 50%;
          padding: 3px;
          width: 24px;
          height: 24px;
        }
        .fab-text {
          line-height: 1;
        }

        /* En mobile, solo el icono (sin texto) para no estorbar */
        @media (max-width: 640px) {
          .fab {
            padding: 14px;
            bottom: 20px;
            right: 20px;
          }
          .fab-text {
            display: none;
          }
        }

        /* ─── FOOTER ─── */
        .site-footer {
          background: var(--azul-pozero);
          padding: 20px;
          text-align: center;
          margin-top: 40px;
        }
        .footer-links {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }
        .footer-links a {
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          transition: color 0.2s;
        }
        .footer-links a:hover { color: #fff; }
        .sep { font-size: 12px; color: rgba(255,255,255,0.3); }
        .copyright { font-size: 12px; color: rgba(255,255,255,0.5); }

        /* ─── MOBILE ─── */
        @media (max-width: 960px) {
          .content-inner {
            flex-direction: column;
          }
          .map-col {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .minihero { padding: 24px 20px; }
          .search-bar {
            flex-direction: column;
            padding: 10px;
          }
          .search-input, .search-select, .search-btn {
            flex: 1 1 auto;
            width: 100%;
          }
          .map-toggle {
            width: 100%;
          }
          .cards-grid {
            grid-template-columns: 1fr;
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
