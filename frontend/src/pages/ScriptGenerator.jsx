import React, { useState, useRef, useEffect } from 'react'
import { FiPlay, FiRefreshCw, FiUpload, FiZap, FiLoader, FiArrowLeft, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import CodeEditor from '../components/CodeEditor'
import FooterActions from '../components/FooterActions'
import TestResultsTable from '../components/TestResultsTable'
import { generateScript, executeTests } from '../services/api'

export default function ScriptGenerator({ workspace, onUpdate, onOpenTestModal }) {
  const { rawTestCases, generatedScript, generatedScriptLang, framework, execResults } = workspace

  const [scriptSource, setScriptSource] = useState('generated')

  // Auto-generate when navigated from Test Cases via "Generate Test Script"
  useEffect(() => {
    if (workspace.autoGenerateScript && rawTestCases) {
      onUpdate({ autoGenerateScript: false })
      handleGenerate()
    }
  }, [])
  const [manualTestCases, setManualTestCases] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [language, setLanguage] = useState(generatedScriptLang || 'Python')
  const [loading, setLoading] = useState(false)
  const [execLoading, setExecLoading] = useState(false)
  const [execRunId, setExecRunId] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const frameworks = [
    { id: 'Selenium', label: 'Selenium Java' },
    { id: 'Playwright', label: 'Playwright Python' },
    { id: 'Appium', label: 'Appium' },
    { id: 'RestAssured', label: 'Rest Assured' },
  ]
  const languages = ['Python', 'Java', 'JavaScript']

  function getTestCasesForGeneration() {
    if (scriptSource === 'generated') return rawTestCases || ''
    return manualTestCases
  }

  const handleGenerate = async () => {
    const testCases = getTestCasesForGeneration()
    if (!testCases.trim()) {
      toast.error('No test cases available. Please provide test cases first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await generateScript(testCases, framework, language, appUrl)
      onUpdate({ generatedScript: data.script, generatedScriptLang: language, execResults: null })
      toast.success('Script generated successfully!')
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to generate script'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setManualTestCases(ev.target.result)
      toast.success('Test cases file loaded')
    }
    reader.readAsText(file)
  }

  const handleLanguageChange = async (newLanguage) => {
    setLanguage(newLanguage)
    onUpdate({ generatedScriptLang: newLanguage })
    if (!generatedScript) return
    const testCases = getTestCasesForGeneration()
    if (!testCases.trim()) return
    setLoading(true)
    setError('')
    try {
      const data = await generateScript(testCases, framework, newLanguage, appUrl)
      onUpdate({ generatedScript: data.script, generatedScriptLang: newLanguage })
      toast.success(`Script regenerated in ${newLanguage}`)
    } catch (err) {
      const message = err.response?.data?.detail || err.message || 'Failed to regenerate script'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleFrameworkChange = (newFramework) => {
    onUpdate({ framework: newFramework })
  }

  const handleRunTests = async () => {
    if (!generatedScript) {
      toast.error('Generate a script first before running tests')
      return
    }
    if (language !== 'Python') {
      toast.error('Execution is currently supported for Python only. Switch language to Python.')
      return
    }
    setExecLoading(true)
    onUpdate({ execResults: null })
    try {
      const data = await executeTests(generatedScript, framework, language)
      const results = { tests: data.tests, summary: data.summary }
      onUpdate({ execResults: results })
      setExecRunId(data.run_id)
      const s = data.summary
      toast.success(`Execution complete — ${s.passed} passed, ${s.failed} failed`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Test execution failed')
    } finally {
      setExecLoading(false)
    }
  }

  const getFileExtension = () => ({ Python: 'py', Java: 'java', JavaScript: 'js' }[language] || 'txt')

  const handleExport = () => {
    if (!generatedScript) { toast.error('No script to export'); return }
    const blob = new Blob([generatedScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `generated_script.${getFileExtension()}`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Script exported')
  }

  const handleExportExcel = () => {
    if (!generatedScript) { toast.error('No script to export'); return }
    const rows = generatedScript.split('\n').map((line, i) => ({ 'Line': i + 1, 'Code': line }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Script')
    XLSX.writeFile(wb, 'generated_script.xlsx')
    toast.success('Script exported to Excel')
  }

  return (
    <>
    <div className="flex gap-5 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        <div className="panel-card">
          <div className="panel-header"><h2>Script Source</h2></div>
          <div className="p-4 space-y-2.5">
            {[
              { value: 'generated', label: 'Use Generated Test Cases' },
              { value: 'manual', label: 'Provide Test Cases Manually' },
              { value: 'upload', label: 'Upload Test Cases File' },
            ].map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="scriptSource"
                  value={opt.value}
                  checked={scriptSource === opt.value}
                  onChange={e => setScriptSource(e.target.value)}
                  className="w-4 h-4 text-[#4a6fa5] focus:ring-[#4a6fa5]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt.label}</span>
              </label>
            ))}

            {scriptSource === 'manual' && (
              <textarea
                className="input-field h-24 resize-none mt-2"
                placeholder="Paste your test cases here..."
                value={manualTestCases}
                onChange={e => setManualTestCases(e.target.value)}
              />
            )}
            {scriptSource === 'upload' && (
              <div className="mt-2">
                <button onClick={() => fileInputRef.current?.click()} className="btn-outline w-full justify-center">
                  <FiUpload />Choose File
                </button>
                <input ref={fileInputRef} type="file" accept=".txt,.csv,.md" onChange={handleFileUpload} className="hidden" />
                {manualTestCases && <p className="text-xs text-green-600 mt-1.5">File loaded successfully</p>}
              </div>
            )}
            {scriptSource === 'generated' && !rawTestCases && (
              <p className="text-xs text-amber-600 mt-1">No generated test cases yet. Generate them first in the Test Cases tab.</p>
            )}
            {scriptSource === 'generated' && rawTestCases && (
              <p className="text-xs text-green-600 mt-1">Using previously generated test cases</p>
            )}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h2>Input Panel</h2></div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Application URL:</label>
              <input
                type="url"
                className="input-field"
                placeholder="Enter application URL..."
                value={appUrl}
                onChange={e => setAppUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Test Case Selection</label>
              <select className="input-field">
                <option>Select test cases</option>
                <option>All Generated Test Cases</option>
                <option>High Priority Only</option>
                <option>Medium &amp; High Priority</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Framework:</label>
              <select value={framework} onChange={e => handleFrameworkChange(e.target.value)} className="input-field">
                {frameworks.map(fw => <option key={fw.id} value={fw.id}>{fw.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Language:</label>
              <select value={language} onChange={e => handleLanguageChange(e.target.value)} disabled={loading} className="input-field">
                {languages.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-header"><h2>Script Generation Panel</h2></div>
          <div className="p-4 space-y-2">
            <button
              onClick={handleGenerate}
              disabled={loading || execLoading}
              className="btn-primary w-full justify-center"
            >
              {loading ? <><FiRefreshCw className="animate-spin" />Generating...</> : <><FiPlay />Generate Script</>}
            </button>
            <button
              onClick={handleRunTests}
              disabled={!generatedScript || execLoading || loading}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={language !== 'Python' ? 'Switch to Python to enable execution' : ''}
            >
              {execLoading ? <><FiLoader className="animate-spin" />Running Tests…</> : <><FiZap />Run Tests</>}
            </button>
            {language !== 'Python' && generatedScript && (
              <p className="text-xs text-amber-600">Execution requires Python. Switch language to Python to enable Run Tests.</p>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
      </div>

      {/* Step navigation sidebar */}
      <div className="w-52 flex-shrink-0 flex flex-col gap-3">
        {/* Back to test cases */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Step 2</p>
          <p className="text-sm text-gray-700">
            {workspace.testCases?.length > 0
              ? <><span className="font-bold text-gray-800">{workspace.testCases.length}</span> test cases</>
              : 'No test cases yet'}
          </p>
          <button
            onClick={() => onUpdate({ activeView: 'test-cases' })}
            className="w-full flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#4a6fa5] text-xs font-medium py-1.5 px-3 rounded-lg border border-gray-200 hover:border-[#4a6fa5] transition-colors"
          >
            <FiArrowLeft className="text-xs" /> Test Cases
          </button>
        </div>

        {/* Push to repo */}
        {workspace.connection && generatedScript && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Script Ready</p>
            <p className="text-sm text-green-800">Push this script to <span className="font-bold">{workspace.name}</span></p>
            <button
              onClick={() => onUpdate({ activeView: 'project-setup' })}
              className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
            >
              Push to Repo <FiArrowRight className="text-xs" />
            </button>
          </div>
        )}

        {/* Execution summary */}
        {execResults && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1">
              <FiCheckCircle /> Executed
            </p>
            <p className="text-sm text-blue-800 font-bold">{execResults.summary?.passed ?? 0} passed</p>
            {execResults.summary?.failed > 0 && (
              <p className="text-sm text-red-600 font-bold">{execResults.summary.failed} failed</p>
            )}
          </div>
        )}

        {!workspace.connection && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-700">Connect a repo in Project Setup to push scripts after generation.</p>
            <button
              onClick={() => onUpdate({ activeView: 'project-setup' })}
              className="mt-2 w-full flex items-center justify-center gap-1.5 text-amber-700 text-xs font-medium py-1.5 px-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              Project Setup <FiArrowRight className="text-xs" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 panel-card flex flex-col min-h-0">
        <div className="panel-header"><h2>Output Panel</h2></div>
        <div className="flex-1 p-3 min-h-0 overflow-auto flex flex-col gap-3">
          <CodeEditor
            code={generatedScript || '// Generated script will appear here...\n// Select your framework, language, and click "Generate Script"'}
            language={language}
            onChange={val => onUpdate({ generatedScript: val })}
          />
          {execLoading && (
            <div className="flex items-center justify-center gap-3 py-6 text-gray-500 text-sm border border-gray-200 rounded-xl">
              <FiLoader className="animate-spin text-green-600 text-lg" />
              Running tests against your application… this may take up to 3 minutes
            </div>
          )}
          {execResults && <TestResultsTable results={execResults} runId={execRunId} />}
        </div>
        <FooterActions
          onExport={handleExport}
          onExportExcel={handleExportExcel}
          onTestRepository={onOpenTestModal}
        />
      </div>
    </div>

    </>
  )
}
