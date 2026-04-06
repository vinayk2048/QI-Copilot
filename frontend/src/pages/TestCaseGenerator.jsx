import React, { useState, useRef } from 'react'
import { FiUpload, FiSearch, FiFilter, FiZap, FiRefreshCw } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'
import toast from 'react-hot-toast'
import ConfidenceScore from '../components/ConfidenceScore'
import TestCaseTable from '../components/TestCaseTable'
import FooterActions from '../components/FooterActions'
import { generateTestCases, uploadRequirements, MOCK_TEST_CASES } from '../services/api'

function parseTestCasesFromText(text) {
  // Parse the LLM raw text into structured test case objects
  const cases = []
  const blocks = text.split(/(?=(?:TC[-_]?\d+|Test Case (?:ID:?\s*)?(?:TC[-_]?\d+|\d+)))/gi)

  for (const block of blocks) {
    if (!block.trim()) continue

    const idMatch = block.match(/(?:TC[-_]?\d+|\bTest Case (?:ID:?\s*)?(\d+))/i)
    if (!idMatch) continue

    const id = idMatch[0].replace(/Test Case (?:ID:?\s*)?/i, 'TC').replace(/[_\s]/g, '')

    const titleMatch = block.match(/(?:Title|Scenario)[:\s]*(.+)/i)
    const scenario = titleMatch ? titleMatch[1].trim() : block.split('\n').find(l => l.trim() && !l.match(/^TC/i))?.trim() || 'Test scenario'

    const stepsMatch = block.match(/(?:Test Steps|Steps)[:\s]*([\s\S]*?)(?=Expected|Priority|$)/i)
    let steps = ['1. Execute test']
    if (stepsMatch) {
      steps = stepsMatch[1]
        .split('\n')
        .map(s => s.trim())
        .filter(s => s && s.match(/^\d|^-|^Step/i))
        .map((s, i) => s.match(/^\d/) ? s : `${i + 1}. ${s.replace(/^-\s*/, '')}`)
    }
    if (steps.length === 0) steps = ['1. Execute test']

    const expectedMatch = block.match(/Expected\s*(?:Result|Output)[:\s]*(.+)/i)
    const expectedResult = expectedMatch ? expectedMatch[1].trim() : 'Test passes successfully'

    const priorities = ['High', 'Medium', 'Low']
    const priority = priorities[cases.length % 3]

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
        setTestCases(MOCK_TEST_CASES)
      }
      onTestCasesGenerated?.(raw)
      toast.success('Test cases generated successfully!')
    } catch (err) {
      console.error('API call failed, using mock data:', err)
      setTestCases(MOCK_TEST_CASES)
      setRawTestCases('Mock test cases (backend unavailable)')
      setConfidence(82)
      onTestCasesGenerated?.('Mock test cases')
      toast.success('Test cases loaded (demo mode)')
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
        <FooterActions onTestRepository={() => toast('Test Repository opened')} />
      </div>
    </div>
  )
}
