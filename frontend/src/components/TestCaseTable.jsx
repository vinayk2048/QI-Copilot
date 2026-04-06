import React from 'react'

function PriorityBadge({ priority }) {
  const cls =
    priority === 'High'
      ? 'badge-high'
      : priority === 'Medium'
      ? 'badge-medium'
      : 'badge-low'

  return <span className={cls}>{priority}</span>
}

export default function TestCaseTable({ testCases = [] }) {
  if (testCases.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        No test cases generated yet. Enter a requirement and click "Generate Test Cases".
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[400px]">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-gray-50 z-10">
          <tr className="border-b border-gray-200">
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-24">Test Case ID</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600">Scenario</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-64">Steps</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-48">Expected Result</th>
            <th className="text-left py-2.5 px-3 font-semibold text-gray-600 w-24">Priority</th>
          </tr>
        </thead>
        <tbody>
          {testCases.map((tc, idx) => (
            <tr
              key={tc.id}
              className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              }`}
            >
              <td className="py-2.5 px-3 font-mono text-blue-600 font-medium">{tc.id}</td>
              <td className="py-2.5 px-3 text-gray-700">{tc.scenario}</td>
              <td className="py-2.5 px-3 text-gray-600">
                {tc.steps.map((step, i) => (
                  <div key={i} className="leading-relaxed">{step}</div>
                ))}
              </td>
              <td className="py-2.5 px-3 text-gray-600">{tc.expectedResult}</td>
              <td className="py-2.5 px-3">
                <PriorityBadge priority={tc.priority} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
