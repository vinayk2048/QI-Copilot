import React, { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import WorkflowStepper from './components/WorkflowStepper'
import TestCaseGenerator from './pages/TestCaseGenerator'
import ScriptGenerator from './pages/ScriptGenerator'
import ProjectSetup from './pages/ProjectSetup'
import TestRunModal from './components/TestRunModal'
import FloatingRunBadge from './components/FloatingRunBadge'
import { FiPlus, FiX, FiGitBranch } from 'react-icons/fi'
import { pollRunStatus } from './services/api'

function newWorkspace() {
  return {
    id: `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'New Project',
    activeView: 'project-setup',
    connection: null,
    repoContext: null,
    pushResult: null,
    pipelineResult: null,
    preloadedRequirement: '',
    requirement: '',
    testType: 'UI',
    rawTestCases: '',
    testCases: [],
    confidence: 0,
    generatedScript: '',
    generatedScriptLang: 'Python',
    framework: 'Selenium',
    execResults: null,
  }
}

export default function App() {
  const [workspaces, setWorkspaces] = useState(() => {
    const ws = newWorkspace()
    return [ws]
  })
  const [activeWsId, setActiveWsId] = useState(() => workspaces[0]?.id)

  // Modal: which workspace's test run modal is open
  const [modalWsId, setModalWsId] = useState(null)

  // Background run: { runId, workspaceId, workspaceName, phase, results, errorMsg, elapsed, runId }
  const [bgRun, setBgRun] = useState(null)
  const elapsedRef = useRef(null)
  const pollRef = useRef(null)

  const activeWs = workspaces.find(w => w.id === activeWsId) ?? workspaces[0]
  const modalWs = workspaces.find(w => w.id === modalWsId) ?? null

  function updateWs(id, patch) {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w))
  }

  function addWorkspace() {
    const ws = newWorkspace()
    setWorkspaces(prev => [...prev, ws])
    setActiveWsId(ws.id)
  }

  function closeWorkspace(id) {
    setWorkspaces(prev => {
      const next = prev.filter(w => w.id !== id)
      if (next.length === 0) {
        const ws = newWorkspace()
        setActiveWsId(ws.id)
        return [ws]
      }
      if (activeWsId === id) setActiveWsId(next[next.length - 1].id)
      return next
    })
    if (modalWsId === id) setModalWsId(null)
  }

  // Open test modal for a workspace
  function openTestModal(wsId) {
    setModalWsId(wsId)
  }

  // Called by TestRunModal when "Run in Background" is clicked
  function handleRunInBackground(runId, wsId) {
    setModalWsId(null) // close modal
    const ws = workspaces.find(w => w.id === wsId)
    setBgRun({ runId, workspaceId: wsId, workspaceName: ws?.name || 'Project', phase: 'running', results: null, errorMsg: '', elapsed: 0 })
  }

  // Poll background run
  useEffect(() => {
    if (!bgRun || bgRun.phase !== 'running') {
      clearInterval(pollRef.current)
      clearInterval(elapsedRef.current)
      return
    }

    // Elapsed timer
    elapsedRef.current = setInterval(() => {
      setBgRun(r => r ? { ...r, elapsed: (r.elapsed ?? 0) + 1 } : r)
    }, 1000)

    // Status poller
    pollRef.current = setInterval(async () => {
      try {
        const res = await pollRunStatus(bgRun.runId)
        if (res.status === 'done') {
          clearInterval(pollRef.current)
          clearInterval(elapsedRef.current)
          setBgRun(r => ({ ...r, phase: 'done', results: res.data, runId: res.data?.run_id || r.runId }))
          updateWs(bgRun.workspaceId, { execResults: res.data })
        } else if (res.status === 'error') {
          clearInterval(pollRef.current)
          clearInterval(elapsedRef.current)
          setBgRun(r => ({ ...r, phase: 'error', errorMsg: res.error }))
        }
      } catch { /* network blip — keep polling */ }
    }, 3000)

    return () => {
      clearInterval(pollRef.current)
      clearInterval(elapsedRef.current)
    }
  }, [bgRun?.runId, bgRun?.phase])

  const ws = activeWs

  return (
    <div className="flex h-screen bg-[#eef1f6] flex-col">
      <Header activeTab={ws.activeView} />

      {/* Workspace tab bar */}
      <div className="flex items-center bg-white border-b border-gray-200 px-3 gap-0.5 overflow-x-auto flex-shrink-0 min-h-[38px]">
        {workspaces.map(w => (
          <button
            key={w.id}
            onClick={() => setActiveWsId(w.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm cursor-pointer border-b-2 transition-all whitespace-nowrap select-none h-[38px] ${
              w.id === activeWsId
                ? 'border-[#4a6fa5] text-[#4a6fa5] font-semibold bg-blue-50/70'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiGitBranch className="text-xs flex-shrink-0" />
            <span className="max-w-[150px] truncate">{w.name}</span>
            {workspaces.length > 1 && (
              <span
                role="button"
                onClick={e => { e.stopPropagation(); closeWorkspace(w.id) }}
                className="ml-0.5 p-0.5 rounded hover:bg-red-100 hover:text-red-500 text-gray-300 transition-colors leading-none"
              >
                <FiX className="text-xs" />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={addWorkspace}
          className="ml-1 p-1.5 text-gray-400 hover:text-[#4a6fa5] hover:bg-blue-50 rounded transition-colors flex-shrink-0"
          title="New project workspace"
        >
          <FiPlus className="text-sm" />
        </button>
      </div>

      <WorkflowStepper
        workspace={ws}
        onNavigate={view => updateWs(ws.id, { activeView: view })}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={ws.activeView}
          setActiveTab={view => updateWs(ws.id, { activeView: view })}
        />
        <main className="flex-1 overflow-auto p-5">
          {ws.activeView === 'project-setup' && (
            <ProjectSetup
              key={ws.id}
              workspace={ws}
              onUpdate={patch => updateWs(ws.id, patch)}
            />
          )}
          {ws.activeView === 'test-cases' && (
            <TestCaseGenerator
              key={ws.id}
              workspace={ws}
              onUpdate={patch => updateWs(ws.id, patch)}
              onOpenTestModal={() => openTestModal(ws.id)}
            />
          )}
          {ws.activeView === 'script-generator' && (
            <ScriptGenerator
              key={ws.id}
              workspace={ws}
              onUpdate={patch => updateWs(ws.id, patch)}
              onOpenTestModal={() => openTestModal(ws.id)}
            />
          )}
        </main>
      </div>

      {/* App-level test run modal — persists across tab switches */}
      {modalWsId && modalWs && (
        <TestRunModal
          workspace={modalWs}
          onClose={() => setModalWsId(null)}
          onResultsSaved={results => updateWs(modalWsId, { execResults: results })}
          onRunInBackground={(runId) => handleRunInBackground(runId, modalWsId)}
        />
      )}

      {/* Floating background run badge */}
      <FloatingRunBadge
        run={bgRun}
        onExpand={() => bgRun && openTestModal(bgRun.workspaceId)}
        onDismiss={() => setBgRun(null)}
      />
    </div>
  )
}
