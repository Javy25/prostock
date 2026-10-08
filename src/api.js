const baseUrl = import.meta.env.VITE_API_URL || ''

export const apiEnabled = import.meta.env.VITE_USE_API === 'true'

export async function apiRequest(path, options = {}) {
  if (!apiEnabled) throw new Error('La conexión con el backend no está habilitada.')

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    let message = text || `El backend respondió con estado ${response.status}.`
    if (text) {
      try {
        const body = JSON.parse(text)
        message = body.detail || body.message || body.mensaje || message
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return response.text()
  return response.json()
}
