import React, { useEffect, useState } from 'react'
import { FiX, FiLoader, FiCheckCircle, FiAlertCircle, FiGitBranch, FiCode, FiPlay, FiMinimize2 } from 'react-icons/fi'
import { executeTests, generateScript, executeTestsBackground } from '../services/api'
import TestResultsTable from './TestResultsTable'

export default function TestRunModal({ workspace, onClose, onResultsSaved, onRunInBackground }) {
  const [phase, setPhase] = useState('idle') // idle | running | done | error | no-script
  const [bgLoading, setBgLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [runId, setRunId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const script = workspace.generatedScript
  const lang = workspace.generatedScriptLang || 'Python'
  const framework = workspace.framework || 'Playwright'

  // Auto-start on mount
  useEffect(() => {
    if (!script && !workspace.rawTestCases) {
      setPhase('no-script')
      return
    }
    run()
  }, [])

  // Elapsed timer while running
  useEffect(() => {
    if (phase !== 'running') return
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  async function run() {
    setPhase('running')
    setElapsed(0)
    setResults(null)
    setErrorMsg('')
    try {
      let scriptToRun = script

      // If script is not Python (or missing), auto-generate a Python version from raw test cases
      if (!scriptToRun || lang !== 'Python') {
        const rawTc = workspace.rawTestCases
        if (!rawTc) {
          setPhase('no-script')
          return
        }
        const gen = await generateScript(rawTc, 'Playwright', 'Python', '')
        scriptToRun = gen.script
      }

      // API throws 400 for unsupported language — caught below
      const data = await executeTests(scriptToRun, 'Playwright', 'Python')

      const r = { tests: data.tests || [], summary: data.summary || {} }
      setResults(r)
      setRunId(data.run_id)
      setPhase('done')
      onResultsSaved?.(r)
    } catch (err) {
      setPhase('error')
      setErrorMsg(err.response?.data?.detail || err.message || 'Test execution failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <FiPlay className="text-[#4a6fa5] text-lg" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800 text-base">Test Repository</h2>
              <p className="text-xs text-gray-400">Execute · Playwright Python {lang !== 'Python' ? `(auto-converted from ${lang})` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX />
          </button>
        </div>

        {/* Project context */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <FiGitBranch className="text-xs text-[#4a6fa5]" />
            <span className="font-medium">{workspace.name || 'Project'}</span>
          </span>
          {workspace.connection && (
            <span className="text-gray-400">· {workspace.connection.platform}</span>
          )}
          {workspace.repoContext?.branch && (
            <span className="flex items-center gap-1 text-gray-400">
              <FiCode className="text-xs" /> {workspace.repoContext.branch}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-5">

          {/* Running state */}
          {phase === 'running' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-[#4a6fa5] animate-spin" />
                <FiPlay className="absolute inset-0 m-auto text-[#4a6fa5] text-xl" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-700">Running tests…</p>
                <p className="text-sm text-gray-400 mt-1">This may take up to 3 minutes · {elapsed}s elapsed</p>
              </div>
              <div className="w-full max-w-xs bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-[#4a6fa5] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(elapsed * 0.8, 90)}%` }}
                />
              </div>
            </div>
          )}

          {/* No script */}
          {phase === 'no-script' && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <FiAlertCircle className="text-amber-400 text-4xl" />
              <p className="text-base font-semibold text-gray-700">No script generated yet</p>
              <p className="text-sm text-gray-500 max-w-sm">
                Go to the <strong>Script Generator</strong> tab, generate a Python script from your test cases, then come back to run it against your repository.
              </p>
            </div>
          )}

          {/* Error */}
          {phase === 'error' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
              <FiAlertCircle className="text-red-400 text-4xl" />
              <div>
                <p className="text-base font-semibold text-gray-700 mb-1">Execution failed</p>
                <p className="text-sm text-red-600 max-w-md">{errorMsg}</p>
              </div>
              <button
                onClick={run}
                className="flex items-center gap-2 bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <FiPlay /> Retry
              </button>
            </div>
          )}

          {/* Results */}
          {phase === 'done' && results && (
            <div className="space-y-3">
              {/* Quick summary */}
              <div className="flex items-center gap-3">
                {results.summary?.total === 0 || results.summary?.error > 0 ? (
                  <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                    <FiAlertCircle className="text-lg" />
                    {results.summary?.total === 0 ? 'No tests were collected — check the script' : `${results.summary.error} error${results.summary.error !== 1 ? 's' : ''}`}
                  </div>
                ) : results.summary?.failed === 0 && results.summary?.passed > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                    <FiCheckCircle className="text-lg" /> All {results.summary.passed} test{results.summary.passed !== 1 ? 's' : ''} passed
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                    <FiAlertCircle className="text-lg" /> {results.summary.failed} failed · {results.summary.passed} passed
                  </div>
                )}
                <span className="text-xs text-gray-400">Run #{runId}</span>
              </div>
              <TestResultsTable results={results} runId={runId} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {phase === 'done' && (
              <button
                onClick={run}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#4a6fa5] font-medium transition-colors"
              >
                <FiPlay className="text-xs" /> Re-run
              </button>
            )}
            {/* Run in Background — available while running or before done */}
            {phase === 'running' && onRunInBackground && (
              <button
                onClick={async () => {
                  setBgLoading(true)
                  try {
                    const script = workspace.generatedScript
                    const lang = workspace.generatedScriptLang || 'Python'
                    let scriptToRun = script
                    if (!scriptToRun || lang !== 'Python') {
                      const gen = await generateScript(workspace.rawTestCases || '', 'Playwright', 'Python', '')
                      scriptToRun = gen.script
                    }
                    const { run_id } = await executeTestsBackground(scriptToRun, 'Playwright', 'Python')
                    onRunInBackground(run_id)
                  } catch { setBgLoading(false) }
                }}
                disabled={bgLoading}
                className="flex items-center gap-1.5 text-sm bg-[#2c3e6b] hover:bg-[#1e2d4f] text-white font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {bgLoading ? <FiLoader className="animate-spin text-xs" /> : <FiMinimize2 className="text-xs" />}
                Run in Background
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-800 font-medium px-4 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
