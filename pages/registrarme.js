import { useState } from 'react'

export default function Registro() {
  const [paso, setPaso] = useState(1)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [form, setForm] = useState({
    nombre: '', apellido: '', provincia: '', localidad: '',
    telefono: '', whatsapp: '', instagram: '', facebook: '', email: '',
    experiencia: '', tipo_empresa: '', profundidad_max: 80,
    diametros: [], terrenos: [], zonas_trabajo: [], servicios: [],
    tipo_bomba: [], conoce_solar: '', trabajos_por_mes: '', descripcion: '',
    quiere_info_equipos: false
  })

  const provincias = [
    'Buenos Aires','CABA','Catamarca','Chaco','Chubut',
    'Córdoba','Corrientes','Entre Ríos','Formosa','Jujuy',
    'La Pampa','La Rioja','Mendoza','Misiones','Neuquén',
    'Río Negro','Salta','San Juan','San Luis','Santa Cruz',
    'Santa Fe','Santiago del Estero','Tierra del Fuego','Tucumán'
  ]

  function set(campo, valor) {
    setForm(f => ({ ...f, [campo]: valor }))
  }

  function toggleArray(campo, valor) {
    setForm(f => ({
      ...f,
      [campo]: f[campo].includes(valor)
        ? f[campo].filter(v => v !== valor)
        : [...f[campo], valor]
    }))
  }

  function Tag({ campo, valor }) {
    const activo = form[campo].includes(valor)
    return (
      <span
        onClick={() => toggleArray(campo, valor)}
        style={{
          padding: '5px 12px', borderRadius: '20px', fontSize: '13px',
          cursor: 'pointer', userSelect: 'none',
          border: activo ? '1px solid #1D9E75' : '0.5px solid #ccc',
          background: activo ? '#E1F5EE' : '#fff',
          color: activo ? '#085041' : '#666',
          fontWeight: activo ? '500' : '400'
        }}
      >
        {valor}
      </span>
    )
  }

  async function enviar() {
    setEnviando(true)
    try {
      const response = await fetch(
        'https://qfesxpcuhsrfdohnsleg.supabase.co/rest/v1/perforistas',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXN4cGN1aHNyZmRvaG5zbGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTI5ODMsImV4cCI6MjA5MjA4ODk4M30.oWNCt4XUMfhcubdVOzHd1-o340nRHc9n9ipQTw1pdiI',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            ...form,
            estado: 'pendiente',
            visible_telefono: true,
            visible_whatsapp: false,
            visible_instagram: true,
            visible_facebook: true,
            visible_email: false,
          })
        }
      )
      if (response.ok) {
        setExito(true)
      } else {
        const err = await response.text()
        alert('Error: ' + err)
      }
    } catch(e) {
      alert('Error de red: ' + e.message)
    }
    setEnviando(false)
  }

  function siguiente() {
    if (paso === 1) {
      if (!form.nombre || !form.apellido || !form.provincia || !form.localidad || !form.telefono) {
        alert('Por favor completá Nombre, Apellido, Provincia, Localidad y Teléfono.')
        return
      }
    }
    if (paso === 2) {
      if (!form.experiencia) {
        alert('Por favor indicá tus años de experiencia.')
        return
      }
    }
    setPaso(p => p + 1)
  }

  const input = (campo, placeholder, tipo = 'text') => (
    <input
      type={tipo}
      placeholder={placeholder}
      value={form[campo]}
      onChange={e => set(campo, e.target.value)}
      style={{ width: '100%', padding: '8px 10px', border: '0.5px solid #ccc', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
    />
  )

  if (exito) return (
    <div style={{ fontFamily:
