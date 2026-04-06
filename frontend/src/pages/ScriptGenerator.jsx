import React, { useState, useRef } from 'react'
import { FiPlay, FiEye, FiEdit2, FiRefreshCw, FiUpload } from 'react-icons/fi'
import toast from 'react-hot-toast'
import CodeEditor from '../components/CodeEditor'
import FooterActions from '../components/FooterActions'
import { generateScript, MOCK_SCRIPT } from '../services/api'

export default function ScriptGenerator({ generatedTestCases }) {
  const [scriptSource, setScriptSource] = useState('generated')
  const [manualTestCases, setManualTestCases] = useState('')
  const [appUrl, setAppUrl] = useState('')
  const [framework, setFramework] = useState('Selenium')
  const [language, setLanguage] = useState('Java')
  const [generatedScript, setGeneratedScript] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
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
    try {
      const data = await generateScript(testCases, framework, language)
      setGeneratedScript(data.script)
      toast.success('Script generated successfully!')
    } catch (err) {
      console.error('API call failed, using mock data:', err)
      setGeneratedScript(MOCK_SCRIPT)
      toast.success('Script loaded (demo mode)')
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

  const handlePreview = () => {
    if (!generatedScript) {
      toast.error('Generate a script first')
      return
    }
    setIsEditing(false)
  }

  const handleEdit = () => {
    if (!generatedScript) {
      toast.error('Generate a script first')
      return
    }
    setIsEditing(true)
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
              <label className="text-sm font-medium text-gray-600 mb-2 block">
                Framework:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    onClick={() => setFramework(fw.id)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                      framework === fw.id
                        ? 'bg-[#4a6fa5] text-white border-[#4a6fa5] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
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
            <div className="flex gap-2">
              <button onClick={handlePreview} className="btn-secondary flex-1 justify-center text-sm">
                <FiEye />
                Preview Script
              </button>
              <button onClick={handleEdit} className="btn-secondary flex-1 justify-center text-sm">
                <FiEdit2 />
                Edit Script
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Output */}
      <div className="flex-1 panel-card flex flex-col min-h-0">
        <div className="panel-header">
          <h2>Output Panel</h2>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm bg-white/90 text-gray-800 rounded-md px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {languages.map((l) => (
                <option key={l} value={l}>
                  {framework} {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 p-3 min-h-0">
          <CodeEditor
            code={generatedScript || '// Generated script will appear here...\n// Select your framework, language, and click "Generate Script"'}
            language={language}
            onChange={isEditing ? (val) => setGeneratedScript(val) : undefined}
          />
        </div>

        <FooterActions onTestRepository={() => toast('Test Repository opened')} />
      </div>
    </div>
  )
}
