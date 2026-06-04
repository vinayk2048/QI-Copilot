import React, { useState, useEffect } from 'react'
import { FiGithub, FiCloud, FiLoader, FiCheckCircle, FiAlertCircle, FiSave, FiTrash2, FiChevronDown } from 'react-icons/fi'
import { listSavedProjects, saveProject, deleteSavedProject } from '../services/api'

const PLATFORMS = [
  {
    id: 'github',
    label: 'GitHub',
    icon: FiGithub,
    color: '#24292e',
    fields: [
      {
        key: 'pat',
        label: 'Personal Access Token',
        type: 'password',
        placeholder: 'ghp_xxxxxxxxxxxx',
        hint: 'For private repos: select "repo" scope when creating the token. For public repos only: "public_repo" scope is enough. Generate at GitHub → Settings → Developer settings → Personal access tokens.',
      },
    ],
  },
  {
    id: 'azuredevops',
    label: 'Azure DevOps',
    icon: FiCloud,
    color: '#0078d4',
    fields: [
      { key: 'org_url', label: 'Organization URL', type: 'text', placeholder: 'https://dev.azure.com/your-org  or  https://yourorg.visualstudio.com', hint: 'Enter only the org root URL, not the repo/project path' },
      { key: 'project', label: 'Project Name', type: 'text', placeholder: 'MyProject' },
      { key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
]

function maskPat(pat) {
  if (!pat || pat.length < 8) return '••••••••'
  return pat.slice(0, 4) + '••••••••' + pat.slice(-4)
}

export default function DevOpsConnector({ onConnected, loading, setLoading }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [credentials, setCredentials] = useState({ pat: '', org_url: '', username: '', project: '' })
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')

  // Saved projects
  const [savedProjects, setSavedProjects] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)

  useEffect(() => { loadSaved() }, [])

  async function loadSaved() {
    try {
      const data = await listSavedProjects()
      setSavedProjects(data.projects || [])
    } catch { /* silently ignore */ }
  }

  function handleFieldChange(key, value) {
    setCredentials(prev => ({ ...prev, [key]: value }))
    setStatus(null)
  }

  function loadSavedProject(proj) {
    setSelectedPlatform(proj.platform)
    setCredentials({
      pat: proj.pat,
      org_url: proj.org_url || '',
      project: proj.project || '',
      username: proj.username || '',
    })
    setShowSaved(false)
    setStatus(null)
    setSaveName(proj.name)
  }

  async function handleConnect() {
    if (!selectedPlatform) return
    setLoading(true)
    setStatus(null)
    try {
      const { connectDevOps } = await import('../services/api.js')
      const result = await connectDevOps(selectedPlatform, credentials)
      setStatus('success')
      setMessage(`Connected as ${result.user}`)
      // Auto-suggest save name from project field or platform
      if (!saveName) setSaveName(credentials.project || selectedPlatform)
      setShowSaveForm(true)
      onConnected({ platform: selectedPlatform, credentials, repos: result.repos, projects: result.projects || [] })
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!saveName.trim()) return
    setSaveLoading(true)
    try {
      await saveProject({
        name: saveName.trim(),
        platform: selectedPlatform,
        pat: credentials.pat,
        org_url: credentials.org_url || '',
        project: credentials.project || '',
        username: credentials.username || '',
      })
      await loadSaved()
      setShowSaveForm(false)
    } catch { /* ignore */ } finally {
      setSaveLoading(false)
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation()
    try {
      await deleteSavedProject(id)
      setSavedProjects(prev => prev.filter(p => p.id !== id))
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-4">

      {/* Saved projects dropdown */}
      {savedProjects.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowSaved(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm border border-[#4a6fa5] rounded-lg bg-blue-50 text-[#4a6fa5] font-medium hover:bg-blue-100 transition-colors"
          >
            <span>Load saved project ({savedProjects.length})</span>
            <FiChevronDown className={`transition-transform ${showSaved ? 'rotate-180' : ''}`} />
          </button>

          {showSaved && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
              {savedProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => loadSavedProject(proj)}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{proj.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {proj.platform}{proj.project ? ` · ${proj.project}` : ''} · {maskPat(proj.pat)}
                    </p>
                  </div>
                  <button
                    onClick={e => handleDelete(e, proj.id)}
                    className="ml-2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    title="Remove saved project"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      {savedProjects.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <hr className="flex-1 border-gray-200" />
          or connect manually
          <hr className="flex-1 border-gray-200" />
        </div>
      )}

      {/* Platform selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select Platform</p>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map(p => {
            const Icon = p.icon
            const isActive = selectedPlatform === p.id
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPlatform(p.id); setStatus(null); setShowSaveForm(false) }}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  isActive
                    ? 'border-[#4a6fa5] bg-blue-50 text-[#4a6fa5]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="text-xl flex-shrink-0" style={{ color: isActive ? p.color : undefined }} />
                <span className="text-sm font-medium">{p.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Credential fields */}
      {platform && (
        <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {platform.label} Credentials
          </p>
          {platform.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <input
                type={field.type}
                value={credentials[field.key] || ''}
                onChange={e => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] focus:border-transparent bg-white"
              />
              {field.hint && (
                <p className="mt-1 text-xs text-gray-400">{field.hint}</p>
              )}
            </div>
          ))}

          {/* Status */}
          {status && (
            <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status === 'success' ? <FiCheckCircle className="flex-shrink-0" /> : <FiAlertCircle className="flex-shrink-0" />}
              {message}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !credentials.pat}
            className="w-full flex items-center justify-center gap-2 bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <><FiLoader className="animate-spin" /> Connecting…</> : 'Connect'}
          </button>
        </div>
      )}

      {/* Save project form — shown after successful connect */}
      {showSaveForm && status === 'success' && (
        <div className="border border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide flex items-center gap-1.5">
            <FiSave /> Save this project
          </p>
          <p className="text-xs text-green-600">Save credentials so you can reconnect without re-entering details.</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="Project name (e.g. DT CoE - Azure)"
              className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
            />
            <button
              onClick={handleSave}
              disabled={saveLoading || !saveName.trim()}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {saveLoading ? <FiLoader className="animate-spin text-sm" /> : <FiSave className="text-sm" />}
              Save
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-white transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
