import React, { useState } from 'react'
import { FiUploadCloud, FiGitBranch, FiPlay, FiCheckCircle, FiLoader, FiAlertCircle, FiPackage, FiArrowRight } from 'react-icons/fi'
import toast from 'react-hot-toast'
import DevOpsConnector from '../components/DevOpsConnector.jsx'
import RepoFileBrowser from '../components/RepoFileBrowser.jsx'
import { fetchRequirements, pushScripts, triggerPipeline } from '../services/api.js'

export default function ProjectSetup({ workspace, onUpdate }) {
  const { connection, repoContext, pushResult, pipelineResult, generatedScript, generatedScriptLang } = workspace

  const [loading, setLoading] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [pipelineLoading, setPipelineLoading] = useState(false)

  const step = !connection ? 1 : !repoContext?.branch ? 2 : 3

  function handleConnected(connData) {
    const name = connData.credentials?.project
      ? connData.credentials.project
      : connData.platform
    onUpdate({ connection: connData, name, repoContext: null, pushResult: null, pipelineResult: null })
  }

  function handleBranchChange(ctx) {
    // Derive display name from repos list if available
    const repos = connection?.repos || []
    const match = repos.find(r => r.full_name === ctx.repo || r.name === ctx.repo)
    const repoName = match?.name || ctx.repo?.split('/').pop() || ctx.repo
    const baseName = connection?.credentials?.project || connection?.platform || 'Project'
    const name = repoName && repoName !== baseName ? `${baseName} / ${repoName}` : baseName
    onUpdate({ repoContext: ctx, name })
  }

  async function handleFilesSelected({ repo, branch, paths }) {
    if (paths.length === 0) {
      toast.error('Select at least one file to load')
      return
    }
    setLoading(true)
    try {
      const result = await fetchRequirements(
        connection.platform, connection.credentials, repo, branch, paths
      )
      onUpdate({ preloadedRequirement: result.content, activeView: 'test-cases' })
      toast.success(`Loaded ${paths.length} requirement file${paths.length > 1 ? 's' : ''} into Test Generator`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to fetch requirements')
    } finally {
      setLoading(false)
    }
  }

  async function handlePushScripts() {
    if (!generatedScript) {
      toast.error('No generated script to push. Generate a script first.')
      return
    }
    if (!repoContext?.repo || !repoContext?.branch) {
      toast.error('Select a repository and branch first')
      return
    }
    const ext = { Python: 'py', Java: 'java', JavaScript: 'js' }[generatedScriptLang] || 'py'
    const scriptPath = `tests/qi_copilot/test_generated.${ext}`
    setPushLoading(true)
    onUpdate({ pushResult: null })
    try {
      const result = await pushScripts(
        connection.platform, connection.credentials,
        repoContext.repo, repoContext.branch,
        [{ path: scriptPath, content: generatedScript }]
      )
      onUpdate({ pushResult: result })
      if (result.pushed > 0) {
        toast.success(`Script pushed to ${repoContext.repo} → ${repoContext.branch}`)
      } else {
        toast.error('Push failed: ' + (result.results?.[0]?.error || 'unknown error'))
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to push script')
    } finally {
      setPushLoading(false)
    }
  }

  async function handleTriggerPipeline() {
    if (!repoContext?.repo || !repoContext?.branch) {
      toast.error('Select a repository and branch first')
      return
    }
    setPipelineLoading(true)
    onUpdate({ pipelineResult: null })
    try {
      const result = await triggerPipeline(
        connection.platform, connection.credentials,
        repoContext.repo, repoContext.branch
      )
      onUpdate({ pipelineResult: result })
      if (result.success) {
        toast.success('Pipeline triggered successfully!')
      } else {
        toast.error(result.message || 'Failed to trigger pipeline')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to trigger pipeline')
    } finally {
      setPipelineLoading(false)
    }
  }

  return (
    <div className="flex gap-5 h-full">
      {/* Left panel — Connect + Browse */}
      <div className="w-[380px] flex-shrink-0 flex flex-col gap-4">

        {/* Step 1: Connect */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <StepHeader number={1} title="Connect to Project" done={!!connection} active={step === 1} />
          {connection ? (
            <div className="flex items-center justify-between mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                <FiCheckCircle />
                Connected — {connection.platform}
              </div>
              <button
                onClick={() => onUpdate({ connection: null, repoContext: null, name: 'New Project' })}
                className="text-xs text-gray-500 hover:text-red-500 underline"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <DevOpsConnector
                onConnected={handleConnected}
                loading={loading}
                setLoading={setLoading}
              />
            </div>
          )}
        </div>

        {/* Step 2: Browse Repository */}
        {connection && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <StepHeader number={2} title="Browse Repository" done={repoContext?.branch} active={step === 2} />
            <div className="mt-4">
              <RepoFileBrowser
                platform={connection.platform}
                credentials={connection.credentials}
                repos={connection.repos}
                onFilesSelected={handleFilesSelected}
                onBranchChange={handleBranchChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right panel — Actions */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <FiPackage className="text-[#4a6fa5] text-lg" />
            <h3 className="font-semibold text-gray-800">Project Actions</h3>
          </div>

          {!connection && (
            <div className="text-center py-10 text-gray-400">
              <FiGitBranch className="text-4xl mx-auto mb-3 opacity-30" />
              <p className="text-sm">Connect to a DevOps platform to get started</p>
            </div>
          )}

          {connection && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <InfoCard label="Platform" value={connection.platform} />
                <InfoCard label="Repository" value={repoContext?.repo ? (connection.repos?.find(r => r.full_name === repoContext.repo)?.name || repoContext.repo.split('/').pop()) : '—'} />
                <InfoCard label="Branch" value={repoContext?.branch || '—'} />
              </div>

              <hr className="border-gray-100" />

              <ActionCard
                icon={FiUploadCloud}
                title="Push Generated Scripts to Repo"
                description={
                  generatedScript
                    ? `Push the generated ${generatedScriptLang || 'Python'} test script to ${repoContext?.repo ? (connection.repos?.find(r => r.full_name === repoContext.repo)?.name || repoContext.repo) : 'selected repo'}`
                    : 'Generate a test script first in the Script Generator tab'
                }
                buttonLabel={pushLoading ? 'Pushing…' : 'Push Script to Repo'}
                disabled={!generatedScript || !repoContext?.branch || pushLoading}
                loading={pushLoading}
                onClick={handlePushScripts}
                result={pushResult ? (
                  pushResult.pushed > 0
                    ? <span className="text-green-600 flex items-center gap-1"><FiCheckCircle /> Pushed {pushResult.pushed} file(s) successfully</span>
                    : <span className="text-red-600 flex items-center gap-1"><FiAlertCircle /> Push failed</span>
                ) : null}
              />

              <ActionCard
                icon={FiPlay}
                title="Trigger CI/CD Pipeline"
                description={`Trigger the pipeline on ${repoContext?.branch || 'selected branch'} to run automated tests`}
                buttonLabel={pipelineLoading ? 'Triggering…' : 'Trigger Pipeline'}
                disabled={!repoContext?.branch || pipelineLoading}
                loading={pipelineLoading}
                onClick={handleTriggerPipeline}
                result={pipelineResult ? (
                  pipelineResult.success
                    ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <FiCheckCircle />
                        Pipeline triggered
                        {pipelineResult.url && (
                          <a href={pipelineResult.url} target="_blank" rel="noreferrer"
                            className="underline ml-1 text-[#4a6fa5]">View run →</a>
                        )}
                      </span>
                    )
                    : <span className="text-red-600 flex items-center gap-1"><FiAlertCircle /> {pipelineResult.message}</span>
                ) : null}
              />
            </div>
          )}
        </div>

        {/* Next-step navigation banners */}
        {connection && workspace.testCases?.length > 0 && !workspace.generatedScript && (
          <NextStepBanner
            message={`${workspace.testCases.length} test cases generated — ready to create a script`}
            action="Go to Script Generator"
            onClick={() => onUpdate({ activeView: 'script-generator' })}
            color="blue"
          />
        )}
        {connection && !workspace.testCases?.length && workspace.requirement && (
          <NextStepBanner
            message="Requirements loaded — generate test cases next"
            action="Go to Test Cases"
            onClick={() => onUpdate({ activeView: 'test-cases' })}
            color="amber"
          />
        )}
        {workspace.generatedScript && (
          <NextStepBanner
            message={`${workspace.generatedScriptLang} script is ready to push to your repo`}
            action="Push Script now ↑"
            onClick={handlePushScripts}
            color="green"
          />
        )}

        {!connection && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-700 mb-3 text-sm">Quick Start Guide</h4>
            <ol className="space-y-3">
              {[
                { step: '1', text: 'Select GitHub or Azure DevOps and enter your Personal Access Token' },
                { step: '2', text: 'Connect to load your repositories automatically' },
                { step: '3', text: 'Pick a repo and branch, then select requirement files to import' },
                { step: '4', text: 'Load files → auto-navigates to Test Case Generator' },
                { step: '5', text: 'After generating a script, push it back and trigger your CI/CD pipeline' },
              ].map(item => (
                <li key={item.step} className="flex gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 bg-[#4a6fa5] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {item.step}
                  </span>
                  {item.text}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

function NextStepBanner({ message, action, onClick, color }) {
  const colors = {
    blue:  'bg-blue-50  border-blue-200  text-blue-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
  }
  const btnColors = {
    blue:  'bg-[#4a6fa5] hover:bg-[#3b5998]',
    amber: 'bg-amber-500 hover:bg-amber-600',
    green: 'bg-green-600 hover:bg-green-700',
  }
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${colors[color]}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <FiArrowRight className="flex-shrink-0" />
        {message}
      </div>
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-3 ${btnColors[color]}`}
      >
        {action} <FiArrowRight className="text-xs" />
      </button>
    </div>
  )
}

function StepHeader({ number, title, done, active }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
        done ? 'bg-green-500 text-white' : active ? 'bg-[#4a6fa5] text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {done ? <FiCheckCircle className="text-sm" /> : number}
      </div>
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-700 truncate" title={value}>{value}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, title, description, buttonLabel, disabled, loading, onClick, result }) {
  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="text-[#4a6fa5] text-lg" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-center gap-2 bg-[#4a6fa5] hover:bg-[#3b5998] text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading && <FiLoader className="animate-spin text-sm" />}
        {buttonLabel}
      </button>
      {result && <div className="text-xs">{result}</div>}
    </div>
  )
}
