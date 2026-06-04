import React, { useState } from 'react'
import { FiPlay, FiCheckCircle, FiAlertCircle, FiX, FiMaximize2, FiLoader } from 'react-icons/fi'
import TestResultsTable from './TestResultsTable'

export default function FloatingRunBadge({ run, onExpand, onDismiss }) {
  const [showResults, setShowResults] = useState(false)

  if (!run) return null

  const { phase, workspaceName, results, errorMsg, elapsed, runId } = run

  const isDone = phase === 'done'
  const isError = phase === 'error'
  const isRunning = phase === 'running'

  const passed = results?.summary?.passed ?? 0
  const failed = results?.summary?.failed ?? 0
  const allPassed = isDone && failed === 0 && passed > 0

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Results panel (expanded) */}
      {showResults && isDone && results && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl w-[520px] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              {allPassed
                ? <FiCheckCircle className="text-green-500" />
                : <FiAlertCircle className="text-red-500" />}
              <span className="font-semibold text-sm text-gray-800">
                Test Results — {workspaceName}
              </span>
            </div>
            <button onClick={() => setShowResults(false)} className="p-1 text-gray-400 hover:text-gray-700">
              <FiX className="text-sm" />
            </button>
          </div>
          <div className="p-3 max-h-80 overflow-auto">
            <TestResultsTable results={results} runId={runId} />
          </div>
        </div>
      )}

      {/* Floating chip */}
      <div
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-xl cursor-pointer select-none transition-all ${
          isRunning ? 'bg-[#2c3e6b] text-white'
          : allPassed ? 'bg-green-600 text-white'
          : isError || (isDone && failed > 0) ? 'bg-red-600 text-white'
          : 'bg-gray-700 text-white'
        }`}
        onClick={() => isDone ? setShowResults(v => !v) : onExpand?.()}
      >
        {/* Icon */}
        {isRunning && <FiLoader className="animate-spin text-base flex-shrink-0" />}
        {isDone && allPassed && <FiCheckCircle className="text-base flex-shrink-0" />}
        {(isDone && !allPassed) || isError ? <FiAlertCircle className="text-base flex-shrink-0" /> : null}

        {/* Label */}
        <div className="text-sm leading-tight">
          {isRunning && (
            <>
              <span className="font-semibold">Running tests</span>
              <span className="ml-1.5 opacity-70 text-xs">{workspaceName} · {elapsed}s</span>
            </>
          )}
          {isDone && (
            <>
              <span className="font-semibold">
                {allPassed ? `All ${passed} passed` : `${passed} passed · ${failed} failed`}
              </span>
              <span className="ml-1.5 opacity-70 text-xs">{workspaceName}</span>
            </>
          )}
          {isError && (
            <>
              <span className="font-semibold">Run failed</span>
              <span className="ml-1.5 opacity-70 text-xs">{workspaceName}</span>
            </>
          )}
        </div>

        {/* Expand / dismiss */}
        {isDone && (
          <button
            onClick={e => { e.stopPropagation(); setShowResults(v => !v) }}
            className="ml-1 opacity-70 hover:opacity-100"
            title="View results"
          >
            <FiMaximize2 className="text-xs" />
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDismiss() }}
          className="opacity-60 hover:opacity-100"
          title="Dismiss"
        >
          <FiX className="text-xs" />
        </button>
      </div>
    </div>
  )
}
