export default async function handler(req, res) {
  const { localidad, provincia } = req.query

  if (!localidad || !provincia) {
    return res.status(400).json({ error: 'Faltan parámetros' })
  }

  const apiKey = process.env.MAPS_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key no configurada' })
  }

  try {
    // Intento 1: localidad + provincia + Argentina forzando país AR
    // Usamos "provincia de X" para evitar confusión entre provincia y ciudad (ej: Buenos Aires)
    const provinciaLabel = provincia === 'Buenos Aires' ? 'provincia de Buenos Aires' : provincia
    const address1 = encodeURIComponent(`${localidad}, ${provinciaLabel}, Argentina`)
    const response1 = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address1}&region=ar&components=country:AR&key=${apiKey}`
    )
    const data1 = await response1.json()

    if (data1.results?.[0]) {
      const loc = data1.results[0].geometry.location
      return res.json({ lat: loc.lat, lng: loc.lng })
    }

    // Fallback: solo provincia forzando país AR
    const address2 = encodeURIComponent(`${provincia}, Argentina`)
    const response2 = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address2}&region=ar&components=country:AR&key=${apiKey}`
    )
    const data2 = await response2.json()

    if (data2.results?.[0]) {
      const loc = data2.results[0].geometry.location
      return res.json({ lat: loc.lat, lng: loc.lng })
    }

    return res.json({ lat: null, lng: null })

  } catch (e) {
    console.error('Geocode error:', e.message)
    return res.status(500).json({ lat: null, lng: null })
  }
}
