// pages/api/ads/click.js
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const { campaign_id, referrer_path } = req.body

  if (!campaign_id) {
    return res.status(400).json({ error: 'Falta campaign_id' })
  }

  // Hash de IP — nunca guardamos la IP directa
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
  const ip_hash = crypto.createHash('sha256').update(ip).digest('hex')

  // Registrar el clic
  const { error: clickError } = await supabase
    .from('ad_clicks')
    .insert({
      campaign_id,
      ip_hash,
      referrer_path: referrer_path || '/',
    })

  if (clickError) {
    console.error('Error registrando clic:', clickError)
    return res.status(500).json({ error: 'Error interno' })
  }

  // Incrementar impresiones
  await supabase.rpc('incrementar_impresiones', { cid: campaign_id })

  // Obtener URL destino
  const { data, error: urlError } = await supabase
    .from('ad_campaigns')
    .select('cta_url')
    .eq('id', campaign_id)
    .single()

  if (urlError || !data) {
    return res.status(404).json({ error: 'Campaña no encontrada' })
  }

  return res.status(200).json({ redirect_url: data.cta_url })
}
