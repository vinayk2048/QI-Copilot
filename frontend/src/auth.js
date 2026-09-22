const TOKEN_KEY = 'qi_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function decodePayload(token) {
  const part = token.split('.')[1]
  if (!part) return {}
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')
  try {
    return JSON.parse(atob(b64))
  } catch {
    return {}
  }
}

export function getUserName() {
  const token = getToken()
  if (!token) return ''
  return decodePayload(token).sub || ''
}