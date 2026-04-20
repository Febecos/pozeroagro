// pages/api/perfil-confirmar.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Token inválido.' })

  // Buscar perforista con ese token
  const { data, error } = await supabase
    .from('perforistas')
    .select('id, cambios_pendientes, cambios_token_expira')
    .eq('cambios_token', token)
    .single()

  if (error || !data) {
    return res.redirect('/perfil-confirmado?estado=invalido')
  }

  // Verificar que no expiró
  if (new Date(data.cambios_token_expira) < new Date()) {
    return res.redirect('/perfil-confirmado?estado=expirado')
  }

  // Aplicar los cambios
  const { error: updateError } = await supabase
    .from('perforistas')
    .update({
      ...data.cambios_pendientes,
      cambios_pendientes: null,
      cambios_token: null,
      cambios_token_expira: null,
    })
    .eq('id', data.id)

  if (updateError) {
    return res.redirect('/perfil-confirmado?estado=error')
  }

  return res.redirect(`/perfil-confirmado?estado=ok&id=${data.id}`)
}
