const BASE_URL = 'http://localhost:3000/api'

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token')

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, config)

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
    return
  }

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  let data = null
  if (isJson) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  } else {
    try {
      await res.text()
    } catch {
      /* ignore */
    }
  }

  if (!res.ok) {
    if (data && data.message) throw new Error(data.message)
    if (res.status === 404) throw new Error(`Endpoint not found: ${endpoint}`)
    throw new Error(`Request failed (${res.status})`)
  }

  if (!isJson) {
    throw new Error('Server returned an unexpected response')
  }

  return data
}
