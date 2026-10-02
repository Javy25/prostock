const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export const apiEnabled = import.meta.env.VITE_USE_API === 'true'

export async function apiRequest(path, options = {}) {
  if (!apiEnabled) throw new Error('La conexión con el backend no está habilitada.')

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(localStorage.getItem('prostock_access_token')
        ? { Authorization: `Bearer ${localStorage.getItem('prostock_access_token')}` }
        : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const text = await response.text()
    let message = text || `El backend respondió con estado ${response.status}.`
    if (text) {
      try {
        const body = JSON.parse(text)
        message = body.detail || body.message || message
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  return response.json()
}
