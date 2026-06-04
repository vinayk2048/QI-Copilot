import React, { useState, useEffect } from 'react'
import { FiFolder, FiFile, FiRefreshCw, FiLoader, FiAlertCircle } from 'react-icons/fi'
import { listBranches, listRepoFiles } from '../services/api.js'

export default function RepoFileBrowser({ platform, credentials, repos, onFilesSelected, onBranchChange }) {
  const [selectedRepo, setSelectedRepo] = useState('')
  const [selectedBranch, setSelectedBranch] = useState('')
  const [branches, setBranches] = useState([])
  const [requirementFiles, setRequirementFiles] = useState([])
  const [checkedPaths, setCheckedPaths] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (selectedRepo && selectedBranch) {
      loadFiles()
    }
  }, [selectedRepo, selectedBranch])

  async function handleRepoChange(repoFullName) {
    setSelectedRepo(repoFullName)
    setSelectedBranch('')
    setBranches([])
    setRequirementFiles([])
    setCheckedPaths([])
    setError('')
    if (!repoFullName) return

    setLoading(true)
    try {
      const data = await listBranches(platform, credentials, repoFullName)
      const branchList = data.branches || []
      setBranches(branchList)
      const defaultBranch = branchList.includes('main') ? 'main'
        : branchList.includes('master') ? 'master'
        : branchList[0] || ''
      setSelectedBranch(defaultBranch)
      onBranchChange?.({ repo: repoFullName, branch: defaultBranch })
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load repository info')
    } finally {
      setLoading(false)
    }
  }

  async function loadFiles() {
    setLoading(true)
    setError('')
    setCheckedPaths([])
    try {
      const data = await listRepoFiles(platform, credentials, selectedRepo, selectedBranch)
      setBranches(data.branches || branches)
      setRequirementFiles(data.requirement_files || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to list files')
    } finally {
      setLoading(false)
    }
  }

  function toggleFile(path) {
    setCheckedPaths(prev =>
      prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]
    )
  }

  function handleLoadSelected() {
    onFilesSelected({
      repo: selectedRepo,
      branch: selectedBranch,
      paths: checkedPaths,
    })
  }

  const repoOptions = repos || []

  return (
    <div className="space-y-4">
      {/* Repo selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Repository</label>
        <select
          value={selectedRepo}
          onChange={e => handleRepoChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] bg-white"
        >
          <option value="">Select a repository…</option>
          {repoOptions.map(r => (
            <option key={r.full_name} value={r.full_name}>{r.path || r.name}</option>
          ))}
        </select>
      </div>

      {/* Branch selector */}
      {branches.length > 0 && (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              value={selectedBranch}
              onChange={e => { setSelectedBranch(e.target.value); onBranchChange?.({ repo: selectedRepo, branch: e.target.value }) }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4a6fa5] bg-white"
            >
              {branches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <button
            onClick={loadFiles}
            disabled={loading}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            title="Refresh files"
          >
            {loading ? <FiLoader className="animate-spin text-sm" /> : <FiRefreshCw className="text-sm" />}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          <FiAlertCircle className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* File list */}
      {requirementFiles.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Requirement Files
            <span className="ml-2 text-xs text-gray-400">({requirementFiles.length} found)</span>
          </p>
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
            {requirementFiles.map(file => (
              <label
                key={file.path}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={checkedPaths.includes(file.path)}
                  onChange={() => toggleFile(file.path)}
                  className="accent-[#4a6fa5]"
                />
                <FiFile className="text-gray-400 flex-shrink-0 text-sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400 truncate">{file.path}</p>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleLoadSelected}
            disabled={checkedPaths.length === 0}
            className="mt-3 w-full bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Load {checkedPaths.length > 0 ? `${checkedPaths.length} file${checkedPaths.length > 1 ? 's' : ''}` : 'Selected Files'} into Test Generator
          </button>
        </div>
      )}

      {selectedRepo && selectedBranch && !loading && requirementFiles.length === 0 && !error && (
        <p className="text-sm text-gray-400 text-center py-4">
          No requirement files (.md, .txt, .rst, .docx) found in this branch.
        </p>
      )}
    </div>
  )
}
