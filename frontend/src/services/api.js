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

export async function generateScript(testCases, framework, language, appUrl = '') {
  const { data } = await api.post('/generate-script', {
    test_cases: testCases,
    framework,
    language,
    app_url: appUrl,
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

// ------------------------------------------------------------------ //
// Execution API
// ------------------------------------------------------------------ //

export async function executeTests(script, framework, language) {
  const { data } = await api.post('/execute-tests', { script, framework, language }, { timeout: 300000 })
  return data
}

// ------------------------------------------------------------------ //
// Project Setup API
// ------------------------------------------------------------------ //

export async function connectDevOps(platform, credentials) {
  const { data } = await api.post('/project/connect', { platform, ...credentials })
  return data
}

export async function listRepoFiles(platform, credentials, repo, branch, path = '') {
  const { data } = await api.post('/project/list-files', {
    platform, ...credentials, repo, branch, path,
  })
  return data
}

export async function fetchRequirements(platform, credentials, repo, branch, paths) {
  const { data } = await api.post('/project/fetch-requirements', {
    platform, ...credentials, repo, branch, paths,
  })
  return data
}

export async function pushScripts(platform, credentials, repo, branch, scripts) {
  const { data } = await api.post('/project/push-scripts', {
    platform, ...credentials, repo, branch, scripts,
  })
  return data
}

export async function triggerPipeline(platform, credentials, repo, branch) {
  const { data } = await api.post('/project/trigger-pipeline', {
    platform, ...credentials, repo, branch,
  })
  return data
}
