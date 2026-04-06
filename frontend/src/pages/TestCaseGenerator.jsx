import React, { useState, useRef } from 'react'
import { FiUpload, FiSearch, FiFilter, FiZap, FiRefreshCw } from 'react-icons/fi'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import ConfidenceScore from '../components/ConfidenceScore'
import TestCaseTable from '../components/TestCaseTable'
import FooterActions from '../components/FooterActions'
import { generateTestCases, uploadRequirements } from '../services/api'

function parseTestCasesFromText(text) {
  // Parse the LLM raw text into structured test case objects
  // Splits on lines containing a Test Case ID pattern (e.g. CC-001, TC_002, TC001)
  const cases = []
  const blocks = text.split(/(?=\*{0,2}Test Case ID\*{0,2}\s*[:：]\s*)/i)

  for (const block of blocks) {
    if (!block.trim()) continue

    // Match ID like CC-001, TC_002, TC001, LOGIN-001 etc.
    const idMatch = block.match(/\*{0,2}Test Case ID\*{0,2}\s*[:：]\s*\*{0,2}\s*([A-Z0-9][-A-Z0-9_]*\d+)/i)
    if (!idMatch) continue
    const id = idMatch[1].trim()

    // Match Title (may be wrapped in ** markdown bold)
    const titleMatch = block.match(/\*{0,2}(?:Title|Scenario|Description)\*{0,2}\s*[:：]\s*\*{0,2}\s*(.+)/i)
    const scenario = titleMatch
      ? titleMatch[1].replace(/\*+/g, '').trim()
      : 'Test scenario'

    // Match Test Steps — grab everything between "Test Steps:" and the next field
    const stepsMatch = block.match(/\*{0,2}(?:Test Steps|Steps)\*{0,2}\s*[:：]\s*([\s\S]*?)(?=\s*[-*]*\s*\*{0,2}(?:Expected|Precondition|Priority|\*{0,2}Test Case ID)|$)/i)
    let steps = ['1. Execute test']
    if (stepsMatch) {
      const parsed = stepsMatch[1]
        .split('\n')
        .map(s => s.trim())
        .filter(s => s && /^\d+[.)]\s|^[-•]\s|^Step\s/i.test(s))
        .map((s, i) => {
          // Normalize to "N. text" format
          const cleaned = s.replace(/^\d+[.)]\s*/, '').replace(/^[-•]\s*/, '').replace(/^Step\s+\d+[.:)]\s*/i, '')
          return `${i + 1}. ${cleaned}`
        })
      if (parsed.length > 0) steps = parsed
    }

    // Match Expected Result (may span the rest of the line, possibly with markdown bold)
    const expectedMatch = block.match(/\*{0,2}Expected\s*(?:Result|Output|Outcome)\*{0,2}\s*[:：]\s*\*{0,2}\s*(.+)/i)
    const expectedResult = expectedMatch
      ? expectedMatch[1].replace(/\*+/g, '').trim()
      : 'Test passes successfully'

    // Match Priority if present, otherwise cycle
    const priorityMatch = block.match(/\*{0,2}Priority\*{0,2}\s*[:：]\s*\*{0,2}\s*(High|Medium|Low)/i)
    const priorities = ['High', 'Medium', 'Low']
    const priority = priorityMatch
      ? priorityMatch[1].charAt(0).toUpperCase() + priorityMatch[1].slice(1).toLowerCase()
      : priorities[cases.length % 3]

    cases.push({ id, scenario, steps, expectedResult, priority })
  }

  return cases.length > 0 ? cases : null
}

export default function TestCaseGenerator({ onTestCasesGenerated }) {
  const [requirement, setRequirement] = useState('')
  const [testType, setTestType] = useState('UI')
  const [loading, setLoading] = useState(false)
  const [testCases, setTestCases] = useState([])
  const [rawTestCases, setRawTestCases] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  const handleGenerate = async () => {
    if (!requirement.trim()) {
      toast.error('Please enter a requirement or user story')
      return
    }

    setLoading(true)
    try {
      const data = await generateTestCases(requirement, testType)
      const raw = data.test_cases
      setRawTestCases(raw)
      setConfidence(data.confidence || 82)

      const parsed = parseTestCasesFromText(raw)
      if (parsed) {
        setTestCases(parsed)
      } else {
        toast.error('Could not parse test cases from the response')
      }
      onTestCasesGenerated?.(raw)
      toast.success('Test cases generated successfully!')
    } catch (err) {
      console.error('Test case generation failed:', err)
      const message = err.response?.data?.detail || err.message || 'Failed to generate test cases'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await uploadRequirements(file)
      setRequirement(data.content)
      toast.success('File uploaded successfully')
    } catch {
      // Fallback: read file client-side
      const reader = new FileReader()
      reader.onload = (ev) => {
        setRequirement(ev.target.result)
        toast.success('File loaded')
      }
      reader.readAsText(file)
    }
  }

  const handleExport = () => {
    if (testCases.length === 0) {
      toast.error('No test cases to export')
      return
    }
    const content = testCases.map(tc =>
      `${tc.id}: ${tc.scenario}\nSteps:\n${tc.steps.join('\n')}\nExpected Result: ${tc.expectedResult}\nPriority: ${tc.priority}\n`
    ).join('\n---\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'test_cases.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Test cases exported')
  }

  const handleExportExcel = () => {
    if (testCases.length === 0) {
      toast.error('No test cases to export')
      return
    }
    const rows = testCases.map(tc => ({
      'Test Case ID': tc.id,
      'Scenario': tc.scenario,
      'Steps': tc.steps.join('\n'),
      'Expected Result': tc.expectedResult,
      'Priority': tc.priority,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Test Cases')
    XLSX.writeFile(wb, 'test_cases.xlsx')
    toast.success('Test cases exported to Excel')
  }

  const filteredCases = testCases.filter(
    (tc) =>
      !searchQuery ||
      tc.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex gap-5 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {/* Requirement Input */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Requirement Input</h2>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="p-4">
            <textarea
              className="input-field h-32 resize-none"
              placeholder="Enter user story, requirements, or BRD here"
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1.5 font-medium"
            >
              <FiUpload className="text-sm" />
              Upload Requirement
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx,.pdf"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Test Configuration */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>Test Configuration</h2>
            <div className="flex gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="p-4">
            <label className="text-sm font-medium text-gray-600 mb-2 block">Test Type:</label>
            <div className="flex gap-2">
              {['UI', 'API', 'Mobile'].map((type) => (
                <button
                  key={type}
                  onClick={() => setTestType(type)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    testType === type
                      ? 'bg-[#4a6fa5] text-white border-[#4a6fa5] shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Generation Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2>AI Generation Panel</h2>
          </div>
          <div className="p-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center text-base py-3"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiZap />
                  Generate Test Cases
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 panel-card flex flex-col min-h-0">
        {/* Header */}
        <div className="panel-header">
          <h2>Generated Test Cases</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md text-sm text-gray-800 bg-white/90 border-0 focus:outline-none focus:ring-2 focus:ring-white/50 w-40"
              />
            </div>
            <button className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <FiFilter className="text-sm" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          {testCases.length > 0 && (
            <ConfidenceScore score={confidence} />
          )}

          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Generated Test Cases</h3>
          </div>

          <TestCaseTable testCases={filteredCases} />
        </div>

        {/* Footer */}
        <FooterActions
          onExport={handleExport}
          onExportExcel={handleExportExcel}
          onTestRepository={() => toast('Test Repository opened')}
        />
      </div>
    </div>
  )
}
