export default async function handler(req, res) {
  const { localidad, provincia } = req.query
  const apiKey = process.env.MAPS_KEY // sin NEXT_PUBLIC_
  
  const address = encodeURIComponent(`${localidad}, ${provincia}, Argentina`)
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`
  )
  const data = await response.json()
  
  if (data.results?.[0]) {
    const loc = data.results[0].geometry.location
    res.json({ lat: loc.lat, lng: loc.lng })
  } else {
    res.json({ lat: null, lng: null })
  }
}
