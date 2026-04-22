// lib/formato.js
// Helpers de formato para mostrar datos de perforistas

/**
 * Convierte un string a Title Case respetando casos especiales.
 *
 * Ejemplos:
 *   "juan perez" → "Juan Perez"
 *   "MARIA FERNANDA" → "Maria Fernanda"
 *   "HÉCTOR josé BENITO" → "Héctor José Benito"
 *   "de la garma" → "De La Garma"
 *   "san miguel del monte" → "San Miguel Del Monte"
 *   null / undefined / "" → ""
 */
export function titleCase(texto) {
  if (!texto || typeof texto !== 'string') return ''
  return texto
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map(palabra => {
      if (!palabra) return ''
      // Capitalizar primera letra respetando acentos y ñ
      return palabra.charAt(0).toUpperCase() + palabra.slice(1)
    })
    .join(' ')
}

/**
 * Formatea nombre completo: "juan" + "perez" → "Juan Perez"
 */
export function nombreCompleto(nombre, apellido) {
  return `${titleCase(nombre)} ${titleCase(apellido)}`.trim()
}

/**
 * Normaliza localidad: "BUENOS AIRES" → "Buenos Aires"
 */
export const formatLocalidad = titleCase

/**
 * Normaliza provincia (misma lógica que localidad)
 */
export const formatProvincia = titleCase
