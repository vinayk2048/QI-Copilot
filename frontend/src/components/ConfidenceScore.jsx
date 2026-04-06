import React from 'react'

export default function ConfidenceScore({ score = 82 }) {
  const getColor = () => {
    if (score >= 80) return { bar: 'bg-green-500', text: 'text-green-700' }
    if (score >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-700' }
    return { bar: 'bg-red-500', text: 'text-red-700' }
  }

  const colors = getColor()

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">AI Model Confidence Score:</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`text-2xl font-bold ${colors.text}`}>{score}%</span>
        <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${colors.bar} rounded-full transition-all duration-700 ease-out`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}
