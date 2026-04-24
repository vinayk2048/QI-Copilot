import React, { useState } from 'react'
import { FiGithub, FiGitlab, FiCloud, FiGitMerge, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

const PLATFORMS = [
  {
    id: 'github',
    label: 'GitHub',
    icon: FiGithub,
    color: '#24292e',
    fields: [{ key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'ghp_xxxxxxxxxxxx' }],
  },
  {
    id: 'gitlab',
    label: 'GitLab',
    icon: FiGitlab,
    color: '#fc6d26',
    fields: [{ key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'glpat-xxxxxxxxxxxx' }],
  },
  {
    id: 'azuredevops',
    label: 'Azure DevOps',
    icon: FiCloud,
    color: '#0078d4',
    fields: [
      { key: 'org_url', label: 'Organization URL', type: 'text', placeholder: 'https://dev.azure.com/your-org' },
      { key: 'project', label: 'Project Name', type: 'text', placeholder: 'MyProject' },
      { key: 'pat', label: 'Personal Access Token', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
  {
    id: 'bitbucket',
    label: 'Bitbucket',
    icon: FiGitMerge,
    color: '#0052cc',
    fields: [
      { key: 'username', label: 'Username', type: 'text', placeholder: 'your-username' },
      { key: 'pat', label: 'App Password', type: 'password', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
    ],
  },
]

export default function DevOpsConnector({ onConnected, loading, setLoading }) {
  const [selectedPlatform, setSelectedPlatform] = useState(null)
  const [credentials, setCredentials] = useState({ pat: '', org_url: '', username: '', project: '' })
  const [status, setStatus] = useState(null) // null | 'success' | 'error'
  const [message, setMessage] = useState('')

  const platform = PLATFORMS.find(p => p.id === selectedPlatform)

  function handleFieldChange(key, value) {
    setCredentials(prev => ({ ...prev, [key]: value }))
    setStatus(null)
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
      onConnected({ platform: selectedPlatform, credentials, repos: result.repos, projects: result.projects || [] })
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.detail || err.message || 'Connection failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Platform selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select DevOps Platform</p>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map(p => {
            const Icon = p.icon
            const isActive = selectedPlatform === p.id
            return (
              <button
                key={p.id}
                onClick={() => { setSelectedPlatform(p.id); setStatus(null) }}
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
            </div>
          ))}

          {/* Status message */}
          {status && (
            <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${
              status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {status === 'success'
                ? <FiCheckCircle className="flex-shrink-0" />
                : <FiAlertCircle className="flex-shrink-0" />}
              {message}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !credentials.pat}
            className="w-full flex items-center justify-center gap-2 bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <><FiLoader className="animate-spin" /> Connecting…</>
              : 'Connect'}
          </button>
        </div>
      )}
    </div>
  )
}
