import axios from 'axios'
import { getToken, clearToken } from '../auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 120000, // LLM calls can be slow
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearToken()
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  }
)

export async function login(username, password) {
  const { data } = await api.post('/login', { username, password })
  return data
}

export async function logout() {
  try {
    await api.post('/logout')
  } catch {
    // token is discarded client-side regardless
  }
}

export async function generateTestCases(userStory, testType = 'UI') {
  const { data } = await api.post('/generate-test-cases', {
    user_story: userStory,
    test_type: testType,
  })
  return data
}

export async function generateScript(testCases, framework, language) {
  const { data } = await api.post('/generate-script', {
    test_cases: testCases,
    framework,
    language,
  })
  return data
}

export async function getTestCases() {
  const { data } = await api.get('/test-cases')
  return data
}

export async function uploadRequirements(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/upload-requirements', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}
