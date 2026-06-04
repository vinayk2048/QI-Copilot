import React, { useState, useRef, useEffect } from 'react'
import { FiUpload, FiSearch, FiFilter, FiZap, FiRefreshCw, FiArrowRight, FiArrowLeft, FiCode } from 'react-icons/fi'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'
import ConfidenceScore from '../components/ConfidenceScore'
import TestCaseTable from '../components/TestCaseTable'
import FooterActions from '../components/FooterActions'
import { generateTestCases, uploadRequirements } from '../services/api'

function extractField(block, ...names) {
  for (const name of names) {
    const re = new RegExp(
      `\\*{0,2}${name}\\*{0,2}\\s*[:：]\\s*\\*{0,2}\\s*([^\\n]+)`,
      'i'
    )
    const m = block.match(re)
    if (m) return m[1].replace(/\*+/g, '').trim()
  }
  return null
}

function parseTestCasesFromText(text) {
  if (!text || !text.trim()) return null

  // Split on --- separator (preferred) or on "Test Case ID:" occurrences
  let blocks = text.split(/\n\s*---+\s*\n/g).map(b => b.trim()).filter(Boolean)

  // If --- splitting gives only one block but it contains multiple IDs, fall back
  if (blocks.length <= 1) {
    blocks = text.split(/(?=\*{0,2}Test\s*Case\s*ID\*{0,2}\s*[:：])/i)
      .map(b => b.trim()).filter(Boolean)
  }

  // Last resort: split on numbered headings like "1." "2." or "### Test Case 1"
  if (blocks.length <= 1) {
    blocks = text.split(/(?=\n(?:#{1,3}\s*)?(?:Test\s*Case\s*)?\d+[.)]\s)/i)
      .map(b => b.trim()).filter(Boolean)
  }

  const cases = []
  const priorityCycle = ['High', 'Medium', 'Low']

  for (const block of blocks) {
    if (!block.trim()) continue

    // ID: accept TC-001, TC001, TC_001, 1, LOGIN-001, or any word+digits
    let id = extractField(block, 'Test Case ID', 'Test ID', 'ID', 'Case ID')
    if (!id) {
      // try numbered heading like "1." or "**1.**"
      const numMatch = block.match(/^\*{0,2}(\d+)\*{0,2}[.)]\s/)
      if (numMatch) id = `TC-${numMatch[1].padStart(3, '0')}`
    }
    if (!id) {
      // derive from position
      id = `TC-${String(cases.length + 1).padStart(3, '0')}`
    }
    // Normalise: if it's just a bare number, prefix TC-
    if (/^\d+$/.test(id)) id = `TC-${id.padStart(3, '0')}`

    const scenario = extractField(block, 'Title', 'Scenario', 'Description', 'Name') || 'Test scenario'

    // Steps: everything between "Test Steps:" / "Steps:" and the next labelled field
    let steps = ['1. Execute test']
    const stepsMatch = block.match(
      /(?:Test\s*Steps?|Steps?)\s*[:：]\s*\n?([\s\S]*?)(?=\n\s*\*{0,2}(?:Expected|Precondition|Priority|Test\s*Case\s*ID|---)|$)/i
    )
    if (stepsMatch) {
      const parsed = stepsMatch[1]
        .split('\n')
        .map(s => s.replace(/\*+/g, '').trim())
        .filter(s => s && /^\d+[.)]\s|^[-•*]\s|^Step\s/i.test(s))
        .map((s, i) => {
          const cleaned = s
            .replace(/^\d+[.)]\s*/, '')
            .replace(/^[-•*]\s*/, '')
            .replace(/^Step\s+\d+[.:)]\s*/i, '')
          return `${i + 1}. ${cleaned}`
        })
      if (parsed.length > 0) steps = parsed
    }

    // Expected result — may be multi-word on same line or next line
    const expectedResult =
      extractField(block, 'Expected Result', 'Expected Output', 'Expected Outcome', 'Expected') ||
      'Test passes successfully'

    // Priority
    const rawPriority = extractField(block, 'Priority', 'Severity')
    let priority = priorityCycle[cases.length % 3]
    if (rawPriority) {
      const p = rawPriority.toLowerCase()
      if (p.includes('high')) priority = 'High'
      else if (p.includes('medium') || p.includes('med')) priority = 'Medium'
      else if (p.includes('low')) priority = 'Low'
    }

    cases.push({ id, scenario, steps, expectedResult, priority })
  }

  return cases.length > 0 ? cases : null
}

export default function TestCaseGenerator({ workspace, onUpdate, onOpenTestModal }) {
  const { requirement, testType, testCases, confidence, preloadedRequirement } = workspace

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (preloadedRequirement) {
      onUpdate({ requirement: preloadedRequirement, preloadedRequirement: '' })
    }
  }, [preloadedRequirement])

  const handleGenerate = async () => {
    if (!requirement.trim()) {
      toast.error('Please enter a requirement or user story')
      return
    }
    setLoading(true)
    try {
      const data = await generateTestCases(requirement, testType)
      const raw = data.test_cases
      const parsed = parseTestCasesFromText(raw)
      onUpdate({
        rawTestCases: raw,
        testCases: parsed || [],
        confidence: data.confidence || 82,
      })
      if (parsed) {
        toast.success('Test cases generated successfully!')
      } else {
        toast.error('Could not parse test cases from the response')
      }
    } catch (err) {
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
      onUpdate({ requirement: data.content })
      toast.success('File uploaded successfully')
    } catch {
      const reader = new FileReader()
      reader.onload = (ev) => {
        onUpdate({ requirement: ev.target.result })
        toast.success('File loaded')
      }
      reader.readAsText(file)
    }
  }

  const handleExport = () => {
    if (testCases.length === 0) { toast.error('No test cases to export'); return }
    const content = testCases.map(tc =>
      `${tc.id}: ${tc.scenario}\nSteps:\n${tc.steps.join('\n')}\nExpected Result: ${tc.expectedResult}\nPriority: ${tc.priority}\n`
    ).join('\n---\n\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'test_cases.txt'; a.click()
    URL.revokeObjectURL(url)
    toast.success('Test cases exported')
  }

  const handleExportExcel = () => {
    if (testCases.length === 0) { toast.error('No test cases to export'); return }
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

  const filteredCases = testCases.filter(tc =>
    !searchQuery ||
    tc.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
    <div className="flex gap-5 h-full">
      {/* LEFT PANEL */}
      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
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
              onChange={e => onUpdate({ requirement: e.target.value })}
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
              {['UI', 'API', 'Mobile'].map(type => (
                <button
                  key={type}
                  onClick={() => onUpdate({ testType: type })}
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

        <div className="panel-card">
          <div className="panel-header"><h2>AI Generation Panel</h2></div>
          <div className="p-4">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center text-base py-3"
            >
              {loading ? (
                <><FiRefreshCw className="animate-spin" />Generating...</>
              ) : (
                <><FiZap />Generate Test Cases</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 panel-card flex flex-col min-h-0">
        <div className="panel-header">
          <h2>Generated Test Cases</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md text-sm text-gray-800 bg-white/90 border-0 focus:outline-none focus:ring-2 focus:ring-white/50 w-40"
              />
            </div>
            <button className="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-md transition-colors">
              <FiFilter className="text-sm" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-auto">
          {testCases.length > 0 && <ConfidenceScore score={confidence} />}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Generated Test Cases</h3>
          </div>
          <TestCaseTable testCases={filteredCases} />
        </div>

        <FooterActions
          onExport={handleExport}
          onExportExcel={handleExportExcel}
          primaryAction={testCases.length > 0 ? {
            label: 'Generate Test Script',
            icon: FiCode,
            onClick: () => onUpdate({ activeView: 'script-generator', autoGenerateScript: true }),
          } : null}
          onTestRepository={onOpenTestModal}
        />
      </div>

      {/* Next-step side panel */}
      {(testCases.length > 0 || workspace.connection) && (
        <div className="w-52 flex-shrink-0 flex flex-col gap-3">
          {testCases.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Next Step</p>
              <p className="text-sm text-blue-800">
                <span className="font-bold">{testCases.length}</span> test cases ready — generate an automation script
              </p>
              <button
                onClick={() => onUpdate({ activeView: 'script-generator' })}
                className="w-full flex items-center justify-center gap-1.5 bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
              >
                Script Generator <FiArrowRight />
              </button>
            </div>
          )}
          {workspace.connection && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Project</p>
              <p className="text-sm text-gray-700 font-medium truncate">{workspace.name}</p>
              <button
                onClick={() => onUpdate({ activeView: 'project-setup' })}
                className="w-full flex items-center justify-center gap-1.5 text-gray-600 hover:text-[#4a6fa5] text-xs font-medium py-1.5 px-3 rounded-lg border border-gray-200 hover:border-[#4a6fa5] transition-colors"
              >
                <FiArrowLeft className="text-xs" /> Back to Setup
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    </>
  )
}
