import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 120000, // LLM calls can be slow
})

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
