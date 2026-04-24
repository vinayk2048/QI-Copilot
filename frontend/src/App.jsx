import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TestCaseGenerator from './pages/TestCaseGenerator'
import ScriptGenerator from './pages/ScriptGenerator'
import ProjectSetup from './pages/ProjectSetup'

export default function App() {
  const [activeTab, setActiveTab] = useState('project-setup')
  const [generatedTestCases, setGeneratedTestCases] = useState(null)
  const [preloadedRequirement, setPreloadedRequirement] = useState('')
  const [generatedScript, setGeneratedScript] = useState(null)
  const [generatedScriptLang, setGeneratedScriptLang] = useState('Python')

  function handleRequirementsLoaded(content) {
    setPreloadedRequirement(content)
    setActiveTab('test-cases')
  }

  return (
    <div className="flex h-screen bg-[#eef1f6]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <main className="flex-1 overflow-auto p-5">
          {activeTab === 'project-setup' && (
            <ProjectSetup
              generatedScript={generatedScript}
              generatedScriptLang={generatedScriptLang}
              onRequirementsLoaded={handleRequirementsLoaded}
            />
          )}
          {activeTab === 'test-cases' && (
            <TestCaseGenerator
              onTestCasesGenerated={setGeneratedTestCases}
              preloadedRequirement={preloadedRequirement}
              onRequirementConsumed={() => setPreloadedRequirement('')}
            />
          )}
          {activeTab === 'script-generator' && (
            <ScriptGenerator
              generatedTestCases={generatedTestCases}
              onScriptGenerated={(script, lang) => { setGeneratedScript(script); setGeneratedScriptLang(lang) }}
            />
          )}
        </main>
      </div>
    </div>
  )
}
