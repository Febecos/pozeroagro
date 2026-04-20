import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { registrarEvento, trackWhatsApp, trackTelefono } from '../lib/tracker'
import AdBanner from '../components/AdBanner'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY

// Normaliza texto: minúsculas + sin tildes
function normalizar(texto) {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const geocodeCache = {}
async function geocodificar(localidad, provincia) {
  const key = `${localidad},${provincia}`
  if (geocodeCache[key]) return geocodeCache[key]
  try {
    const res = await fetch(
      `/api/geocode?localidad=${encodeURIComponent(localidad)}&provincia=${encodeURIComponent(provincia)}`
    )
    const data = await res.json()
    if (data.lat && data.lng) {
      geocodeCache[key] = { lat: data.lat, lng: data.lng }
      return geocodeCache[key]
    }
  } catch (e) {
    console.warn('Geocodificación falló:', e.message)
  }
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
  const [campana, setCampana] = useState(null)

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
      const lista = Array.isArray(data) ? data : []
      setPerforistas(lista)
      cargarRatings()
      cargarCampana()
    } catch (e) {}
    setCargando(false)
  }

  async function cargarCampana() {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/campanas_activas?slot_id=eq.listado_mid&limit=1`,
        { headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${ANON_KEY}` } }
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) setCampana(data[0])
    } catch (e) {}
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
    registrarEvento('card_vista', p.id, {
      perforista_nombre: `${p.nombre} ${p.apellido}`,
      origen: 'directorio'
    })
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
          fillColor: p.estado === 'cliente' ? '#1B4F8A' : '#F26419',
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
        ? `<a href="tel:${p.telefono}" style="display:inline-block;margin-top:6px;margin-left:4px;padding:5px 12px;background:#e8f0fa;color:#1B4F8A;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600;">📞 Llamar</a>`
        : ''
      const validadoBadge = p.estado === 'cliente'
        ? `<span style="display:inline-block;margin-top:4px;font-size:10px;background:linear-gradient(135deg,#F5A623,#F0C040);color:#fff;padding:2px 7px;border-radius:4px;font-weight:700;">★ Validado</span>`
        : ''

      marcador.addListener('click', () => {
        registrarEvento('pin_mapa_click', p.id, {
          perforista_nombre: `${p.nombre} ${p.apellido}`,
          origen: 'mapa'
        })
        infoWindow.current.setContent(`
          <div style="font-family:sans-serif;min-width:190px;padding:4px">
            <div style="font-weight:700;font-size:14px;color:#1a1a2e">${p.nombre} ${p.apellido}</div>
            ${validadoBadge}
            <div style="font-size:12px;color:#888;margin-top:4px">📍 <strong>Zona:</strong> ${p.localidad}, ${p.provincia}</div>
            ${p.profundidad_max ? `<div style="font-size:11px;color:#6a0dad;margin-top:3px">⬇️ Hasta ${p.profundidad_max}m</div>` : ''}
            <div style="margin-top:6px">${waLink}${telLink}</div>
            <div style="margin-top:8px">
              <a href="/perforista/${p.id}" style="font-size:11px;color:#1B4F8A;font-weight:600;">Ver perfil completo →</a>
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
    <div style={{ position: 'sticky', top: 0, height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e0e0e8', background: '#e8f0fa' }}>
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

      <div style={{ background: '#1B4F8A', padding: '1.25rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '16px', color: '#fff', fontWeight: '600', marginBottom: '12px' }}>
          Encontrá un perforista rural en tu zona
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Buscar por nombre o localidad..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && ejecutarBusqueda()}
            style={{ flex: '2 1 200px', padding: '10px 14px', borderRadius: '6px', border: '1.5px solid rgba(255,255,255,0.4)', fontSize: '14px', boxSizing: 'border-box', background: '#fff', color: '#333' }}
          />
          <select
            value={provincia}
            onChange={e => { setProvincia(e.target.value); setBusquedaActiva(busqueda) }}
            style={{ flex: '1 1 160px', padding: '10px 14px', borderRadius: '6px', border: '1.5px solid rgba(255,255,255,0.4)', fontSize: '14px', background: '#fff', color: '#333' }}>
            <option value="">Todas las provincias</option>
            {provincias.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={ejecutarBusqueda}
            style={{ padding: '10px 24px', background: '#F26419', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            Buscar
          </button>
          {isMobile && (
            <button
              onClick={() => setMostrarMapa(v => !v)}
              style={{ padding: '10px 14px', background: mostrarMapa ? '#fff' : 'rgba(255,255,255,0.15)', color: mostrarMapa ? '#1B4F8A' : '#fff', border: 'none', borderRadius: '6px', fontSize: '18px', cursor: 'pointer' }}>
              🗺️
            </button>
          )}
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
              const esValidado = p.estado === 'cliente'
              const nombreCompleto = `${p.nombre} ${p.apellido}`
              return (
                <>
                  <div key={p.id}
                    onClick={() => handleCardClick(p)}
                    style={{
                      background: '#fff', borderRadius: '12px', cursor: 'pointer',
                      border: esValidado ? '1.5px solid #1B4F8A' : '0.5px solid #e0e0e8',
                      padding: '1rem', transition: 'box-shadow 0.15s',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                    }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(27,79,138,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e8f0fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', color: '#1B4F8A', flexShrink: 0 }}>
                        {p.nombre?.[0]}{p.apellido?.[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nombreCompleto}
                        </div>
                        <div style={{ fontSize: '11px', color: '#888' }}>📍 {p.localidad} · {p.provincia}</div>
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px', minHeight: '18px' }}>
                      <Estrellas id={p.id} />
                    </div>

                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {esValidado && (
                        <span style={{ fontSize: '10px', background: 'linear-gradient(135deg, #F5A623, #F0C040)', color: '#fff', padding: '2px 7px', borderRadius: '4px', fontWeight: '700', boxShadow: '0 1px 4px rgba(245,166,35,0.4)' }}>
                          ★ Validado
                        </span>
                      )}
                      {p.profundidad_max && (
                        <span style={{ fontSize: '10px', background: '#f3e8ff', color: '#6a0dad', padding: '2px 6px', borderRadius: '4px' }}>
                          ⬇️ {p.profundidad_max}m
                        </span>
                      )}
                      {p.conoce_solar === 'Sí, ya instalé sistemas solares' && (
                        <span style={{ fontSize: '10px', background: '#fff3e0', color: '#E65100', padding: '2px 6px', borderRadius: '4px' }}>
                          ☀️ Solar
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                      {p.visible_telefono && p.telefono && (
                        <a href={`tel:${p.telefono}`}
                          onClick={() => trackTelefono(p.id, p.telefono, nombreCompleto)}
                          style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '0.5px solid #1B4F8A', background: '#e8f0fa', color: '#1B4F8A', fontSize: '11px', textAlign: 'center', textDecoration: 'none', fontWeight: '600' }}>
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

                  {/* Banner publicitario después del item 3 — separación comercial */}
                  {index === 2 && campana && (
                    <div key="ad-banner" style={{ gridColumn: '1 / -1' }}>
                      <AdBanner campaign={campana} />
                    </div>
                  )}
                </>
              )
            })}
          </div>

          {!cargando && filtrados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
              No se encontraron perforistas para esa búsqueda.
            </div>
          )}

          {!cargando && filtrados.length > 0 && (
            <div style={{ marginTop: '16px', padding: '10px 14px', background: '#fff', borderRadius: '8px', border: '0.5px solid #e0e0e8', fontSize: '11px', color: '#aaa', lineHeight: '1.6' }}>
              Pozero Agro es un directorio informativo. No garantiza la calidad ni los resultados de los servicios publicados. La contratación es de exclusiva responsabilidad del usuario.{' '}
              <a href="/terminos" style={{ color: '#1B4F8A', textDecoration: 'none' }}>Términos y condiciones</a>
              {' · '}
              <a href="/terminos#privacidad" style={{ color: '#1B4F8A', textDecoration: 'none' }}>Privacidad</a>
            </div>
          )}
        </div>

        {!isMobile && (
          <div style={{ width: '320px', flexShrink: 0 }}>{MapaDiv}</div>
        )}
      </div>

      <div style={{ background: '#1B4F8A', padding: '1.25rem 1.5rem', marginTop: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
          ¿Necesitás equipar tu pozo con energía solar?
        </div>
        <a href="https://febecos.mitiendanube.com" target="_blank" rel="noreferrer"
          style={{ background: '#F26419', color: '#fff', padding: '9px 24px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '600' }}>
          Ver kits Febecos →
        </a>
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <a href="/terminos" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Términos y condiciones</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="/terminos#privacidad" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Política de privacidad</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <a href="mailto:pozeroagro@gmail.com" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>Contacto</a>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>© 2026 Pozero Agro</span>
        </div>
      </div>

    </div>
  )
}
