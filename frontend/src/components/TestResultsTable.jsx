import React, { useState } from 'react'
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiSkipForward, FiChevronDown, FiChevronRight, FiClock } from 'react-icons/fi'
import * as XLSX from 'xlsx'

const STATUS_CONFIG = {
  passed:  { icon: FiCheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-200',  label: 'Passed'  },
  failed:  { icon: FiXCircle,      color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Failed'  },
  error:   { icon: FiAlertCircle,  color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Error'   },
  skipped: { icon: FiSkipForward,  color: 'text-gray-400',   bg: 'bg-gray-50',   border: 'border-gray-200',   label: 'Skipped' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.error
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon className="text-xs" />
      {cfg.label}
    </span>
  )
}

function TestRow({ test }) {
  const [expanded, setExpanded] = useState(false)
  const hasMessage = !!test.message

  return (
    <>
      <tr
        className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => hasMessage && setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {hasMessage && (
              expanded
                ? <FiChevronDown className="text-gray-400 text-xs flex-shrink-0" />
                : <FiChevronRight className="text-gray-400 text-xs flex-shrink-0" />
            )}
            <span className="text-sm font-mono text-gray-700 break-all">{test.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={test.status} />
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
          <span className="flex items-center gap-1">
            <FiClock className="text-xs" />
            {test.duration}s
          </span>
        </td>
      </tr>
      {expanded && hasMessage && (
        <tr className="bg-red-50 border-b border-red-100">
          <td colSpan={3} className="px-4 py-3">
            <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono overflow-x-auto max-h-48">
              {test.message}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

export default function TestResultsTable({ results, runId }) {
  if (!results) return null

  const { tests = [], summary = {} } = results

  function handleExport() {
    const rows = tests.map(t => ({
      'Test Name': t.name,
      'Status': t.status,
      'Duration (s)': t.duration,
      'Error Message': t.message || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Test Results')
    XLSX.writeFile(wb, `test_results_${runId || 'run'}.xlsx`)
  }

  const passRate = summary.total > 0 && summary.passed > 0
    ? Math.round((summary.passed / summary.total) * 100)
    : 0

  return (
    <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
      {/* Summary bar */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-700">
            Run Results
            {runId && <span className="ml-2 text-xs text-gray-400 font-normal">#{runId}</span>}
          </span>
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <FiCheckCircle className="text-xs" /> {summary.passed} Passed
          </span>
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <FiXCircle className="text-xs" /> {summary.failed} Failed
          </span>
          {summary.error > 0 && (
            <span className="flex items-center gap-1 text-orange-600 font-medium">
              <FiAlertCircle className="text-xs" /> {summary.error} Error
            </span>
          )}
          {summary.skipped > 0 && (
            <span className="flex items-center gap-1 text-gray-400 font-medium">
              <FiSkipForward className="text-xs" /> {summary.skipped} Skipped
            </span>
          )}
          {summary.duration > 0 && (
            <span className="flex items-center gap-1 text-gray-500">
              <FiClock className="text-xs" /> {summary.duration}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Pass rate pill */}
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${
            passRate >= 80 ? 'bg-green-100 text-green-700'
            : passRate >= 50 ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
          }`}>
            {passRate}% pass rate
          </div>
          <button
            onClick={handleExport}
            className="text-xs text-[#4a6fa5] hover:underline font-medium"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Test rows */}
      {tests.length > 0 ? (
        <div className="overflow-y-auto max-h-72">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-2">Test Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test, i) => <TestRow key={i} test={test} />)}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-6">No test results found.</p>
      )}
    </div>
  )
}
