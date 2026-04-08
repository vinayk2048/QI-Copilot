import React, { useState, useRef } from 'react'
import { FiPlay, FiRefreshCw, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import CodeEditor from '../components/CodeEditor'
import FooterActions from '../components/FooterActions'
import { generateScript } from '../services/api'

export default function ScriptGenerator({ generatedTestCases }) {
  const [scriptSource, setScriptSource] = useState('generated')
  const [manualTestCases, setManualTestCases] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [framework, setFramework] = useState('Selenium')
  const [language, setLanguage] = useState('Java')
  const [generatedScript, setGeneratedScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const frameworks = [
    { id: 'Selenium', label: 'Selenium Java' },
    { id: 'Playwright', label: 'Playwright Python' },
    { id: 'Appium', label: 'Appium' },
    { id: 'RestAssured', label: 'Rest Assured' },
  ]

  const languages = ['Python', 'Java', 'JavaScript']

  const getTestCasesForGeneration = () => {
    if (scriptSource === 'generated') return generatedTestCases || ''
    if (scriptSource === 'manual') return manualTestCases
    return manualTestCases // uploaded file content also goes here
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
      const data = await generateScript(testCases, framework, language)
      setGeneratedScript(data.script)
      toast.success('Script generated successfully!')
    } catch (err) {
      console.error('Script generation failed:', err)
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
    if (!generatedScript) return

    const testCases = getTestCasesForGeneration()
    if (!testCases.trim()) return

    setLoading(true)
    setError('')
    try {
      const data = await generateScript(testCases, framework, newLanguage)
      setGeneratedScript(data.script)
      toast.success(`Script regenerated in ${newLanguage}`)
    } catch (err) {
      console.error('Language switch regeneration failed:', err)
      const message = err.response?.data?.detail || err.message || 'Failed to regenerate script'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const getFileExtension = () => {
    const extMap = { Python: 'py', Java: 'java', JavaScript: 'js' }
    return extMap[language] || 'txt'
  }

  const handleExport = () => {
    if (!generatedScript) {
      toast.error('No script to export')
      return
    }
    const blob = new Blob([generatedScript], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `generated_script.${getFileExtension()}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Script exported')
  }

  const handleExportExcel = () => {
    if (!generatedScript) {
      toast.error('No script to export')
      return
    }
    const lines = generatedScript.split('\n')
    const rows = lines.map((line, i) => ({ 'Line': i + 1, 'Code': line }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Script')
    XLSX.writeFile(wb, `generated_script.xlsx`)
    toast.success('Script exported to Excel')
  }

  return (
    <div className="flex gap-5 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Script Source */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Script Source</h2>
          </div>
          <div className="p-4 space-y-2.5">
            {[
              { value: 'generated', label: 'Use Generated Test Cases' },
              { value: 'manual', label: 'Provide Test Cases Manually' },
              { value: 'upload', label: 'Upload Test Cases File' },
            ].map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="scriptSource"
                  value={opt.value}
                  checked={scriptSource === opt.value}
                  onChange={(e) => setScriptSource(e.target.value)}
                  className="w-4 h-4 text-[#4a6fa5] focus:ring-[#4a6fa5]"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900">
                  {opt.label}
                </span>
              </label>
            ))}

            {/* Dynamic content based on source */}
            {scriptSource === 'manual' && (
              <textarea
                className="input-field h-24 resize-none mt-2"
                placeholder="Paste your test cases here..."
                value={manualTestCases}
                onChange={(e) => setManualTestCases(e.target.value)}
              />
            )}
            {scriptSource === 'upload' && (
              <div className="mt-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-outline w-full justify-center"
                >
                  <FiUpload />
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {manualTestCases && (
                  <p className="text-xs text-green-600 mt-1.5">File loaded successfully</p>
                )}
              </div>
            )}
            {scriptSource === 'generated' && !generatedTestCases && (
              <p className="text-xs text-amber-600 mt-1">
                No generated test cases yet. Generate them first in the Test Cases tab.
              </p>
            )}
            {scriptSource === 'generated' && generatedTestCases && (
              <p className="text-xs text-green-600 mt-1">
                Using previously generated test cases
              </p>
            )}
          </div>
        </div>

        {/* Input Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Input Panel</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Application URL */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Application URL:
              </label>
              <input
                type="url"
                className="input-field"
                placeholder="Enter application URL..."
                value={appUrl}
                onChange={(e) => setAppUrl(e.target.value)}
              />
            </div>

            {/* Test Case Selection */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Test Case Selection
              </label>
              <select className="input-field">
                <option>Select test cases</option>
                <option>All Generated Test Cases</option>
                <option>High Priority Only</option>
                <option>Medium & High Priority</option>
              </select>
            </div>

            {/* Framework Selection */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Framework:
              </label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value)}
                className="input-field"
              >
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">
                Language:
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={loading}
                className="input-field"
              >
                {languages.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Script Generation Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Script Generation Panel</h2>
          </div>
          <div className="p-4 space-y-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiPlay />
                  Generate Script
                </>
              )}
            </button>
            {error && (
              <p className="text-xs text-red-600 mt-1">{error}</p>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Output */}
      <div className="flex-1 panel-card flex flex-col min-h-0">
        <div className="panel-header">
          <h2>Output Panel</h2>
        </div>

        <div className="flex-1 p-3 min-h-0">
          <CodeEditor
            code={generatedScript || '// Generated script will appear here...\n// Select your framework, language, and click "Generate Script"'}
            language={language}
            onChange={(val) => setGeneratedScript(val)}
          />
        </div>

        <FooterActions
          onExport={handleExport}
          onExportExcel={handleExportExcel}
          onTestRepository={() => toast('Test Repository opened')}
        />
      </div>
    </div>
  )
}
