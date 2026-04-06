import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TestCaseGenerator from './pages/TestCaseGenerator'
import ScriptGenerator from './pages/ScriptGenerator'

export default function App() {
  const [activeTab, setActiveTab] = useState('test-cases')
  const [generatedTestCases, setGeneratedTestCases] = useState(null)

  return (
    <div className="flex h-screen bg-[#eef1f6]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeTab={activeTab} />
        <main className="flex-1 overflow-auto p-5">
          {activeTab === 'test-cases' && (
            <TestCaseGenerator
              onTestCasesGenerated={setGeneratedTestCases}
            />
          )}
          {activeTab === 'script-generator' && (
            <ScriptGenerator
              generatedTestCases={generatedTestCases}
            />
          )}
        </main>
      </div>
    </div>
  )
}
