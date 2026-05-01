const API_BASE_URL = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'nindyamaya_token'
const responseCache = new Map()

function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

function getHeaders(isJson = true) {
  const token = getAuthToken()
  const headers = {
    Accept: 'application/json',
  }

  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function buildUrl(path) {
  return `${API_BASE_URL}/${path}`
}

function getFormDataHeaders() {
  const token = getAuthToken()
  return token
    ? {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }
    : { Accept: 'application/json' }
}

async function parseResponse(response) {
  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed')
  }

  return data
}

async function request(path, options = {}) {
  const response = await fetch(buildUrl(path), options)
  return parseResponse(response)
}

async function getWithCache(path) {
  if (responseCache.has(path)) {
    return responseCache.get(path)
  }

  const data = await request(path, {
    method: 'GET',
    headers: getHeaders(false),
  })

  responseCache.set(path, data)
  return data
}

function invalidateDashboardCache() {
  responseCache.delete('home')
  responseCache.delete('mentees')
  responseCache.delete('mentor')
  responseCache.delete('mentoring-sessions')
}

export async function login(payload) {
  const response = await fetch(buildUrl('login'), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse(response)
}

export function clearApiCache() {
  responseCache.clear()
}

export function getHome() {
  return getWithCache('home')
}

export function getMentees() {
  return getWithCache('mentees')
}

export function getMentor() {
  return getWithCache('mentor')
}

export function getMentoringSessions() {
  return getWithCache('mentoring-sessions')
}

export async function createMentoringSession(payload) {
  const data = await request('mentoring-sessions', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  invalidateDashboardCache()
  return data
}

export async function updateMentoringSession(sessionId, payload) {
  const isFormData = payload instanceof FormData
  const data = await request(`mentoring-sessions/${sessionId}`, {
    method: 'PUT',
    headers: isFormData ? getFormDataHeaders() : getHeaders(),
    body: isFormData ? payload : JSON.stringify(payload),
  })
  invalidateDashboardCache()
  return data
}

export async function deleteMentoringSession(sessionId) {
  const data = await request(`mentoring-sessions/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(false),
  })
  invalidateDashboardCache()
  return data
}

export async function attendMentoringSession(sessionId) {
  const data = await request(`mentoring-sessions/${sessionId}/attend`, {
    method: 'POST',
    headers: getHeaders(false),
  })
  invalidateDashboardCache()
  return data
}

export async function finishMentoringSession(sessionId, payload) {
  const data = await request(`mentoring-sessions/${sessionId}/finish`, {
    method: 'POST',
    headers: getFormDataHeaders(),
    body: payload,
  })
  invalidateDashboardCache()
  return data
}
