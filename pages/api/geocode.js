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
    const address = encodeURIComponent(`${localidad}, ${provincia}, Argentina`)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
    )
    const data = await response.json()

    if (data.results?.[0]) {
      const loc = data.results[0].geometry.location
      return res.json({ lat: loc.lat, lng: loc.lng })
    }

    // Fallback: intentar solo con provincia
    const address2 = encodeURIComponent(`${provincia}, Argentina`)
    const response2 = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${address2}&key=${apiKey}`
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
