import React from 'react'
import { FiGitBranch, FiFileText, FiCode, FiCheckCircle, FiArrowRight, FiPlay, FiAlertCircle } from 'react-icons/fi'

function stepStatus(workspace) {
  const s1 = workspace.connection
    ? { done: true, text: workspace.name !== 'New Project' ? workspace.name : workspace.connection.platform }
    : { done: false, text: 'Connect to a repo to begin' }

  const hasTestCases = workspace.testCases?.length > 0
  const hasRequirement = !!workspace.requirement?.trim()
  const s2 = hasTestCases
    ? { done: true, text: `${workspace.testCases.length} test case${workspace.testCases.length !== 1 ? 's' : ''} generated` }
    : hasRequirement
    ? { ready: true, text: 'Requirement loaded — ready to generate' }
    : { done: false, text: 'Load requirements from repo first' }

  const hasExec = !!workspace.execResults
  const hasScript = !!workspace.generatedScript
  const s3 = hasExec
    ? {
        done: true,
        text: `Executed · ${workspace.execResults.summary?.passed ?? 0} passed, ${workspace.execResults.summary?.failed ?? 0} failed`,
      }
    : hasScript
    ? { ready: true, text: `${workspace.generatedScriptLang || 'Script'} ready — click Run Tests` }
    : hasTestCases
    ? { ready: true, text: 'Test cases ready — generate script next' }
    : { done: false, text: 'Generate test cases first' }

  return [s1, s2, s3]
}

export default function WorkflowStepper({ workspace, onNavigate }) {
  const [s1, s2, s3] = stepStatus(workspace)
  const active = workspace.activeView

  const steps = [
    { id: 'project-setup',    number: 1, label: 'Project Setup',       icon: FiGitBranch, status: s1 },
    { id: 'test-cases',       number: 2, label: 'Test Cases',          icon: FiFileText,  status: s2 },
    { id: 'script-generator', number: 3, label: 'Script & Execution',  icon: FiCode,      status: s3 },
  ]

  return (
    <div className="bg-white border-b border-gray-100 px-5 py-2.5 flex items-center gap-1 overflow-x-auto flex-shrink-0">
      {steps.map((step, i) => {
        const Icon = step.icon
        const isDone = step.status.done
        const isReady = step.status.ready
        const isActive = active === step.id

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => onNavigate(step.id)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all group flex-shrink-0 ${
                isActive
                  ? 'bg-blue-50 ring-1 ring-[#4a6fa5]/30'
                  : 'hover:bg-gray-50'
              }`}
            >
              {/* Step badge */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                isDone
                  ? 'bg-green-500 text-white'
                  : isReady
                  ? 'bg-amber-400 text-white'
                  : isActive
                  ? 'bg-[#4a6fa5] text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {isDone ? <FiCheckCircle className="text-sm" /> : isReady ? <FiPlay className="text-xs" /> : step.number}
              </div>

              {/* Label + status */}
              <div className="text-left min-w-0">
                <p className={`text-xs font-semibold leading-tight ${
                  isActive ? 'text-[#4a6fa5]' : isDone ? 'text-gray-800' : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs leading-tight truncate max-w-[180px] ${
                  isDone ? 'text-green-600' : isReady ? 'text-amber-600' : 'text-gray-400'
                }`}>
                  {step.status.text}
                </p>
              </div>
            </button>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <FiArrowRight className={`flex-shrink-0 mx-0.5 text-sm ${
                isDone ? 'text-green-400' : 'text-gray-200'
              }`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
