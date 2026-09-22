import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TestCaseGenerator from './pages/TestCaseGenerator'
import ScriptGenerator from './pages/ScriptGenerator'
import Login from './pages/Login'
import { getToken, clearToken, getUserName } from './auth'

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken())
  const [activeTab, setActiveTab] = useState('test-cases')
  const [generatedTestCases, setGeneratedTestCases] = useState(null)

  useEffect(() => {
    const onUnauthorized = () => setAuthed(false)
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized)
  }, [])

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />
  }

  return (
    <div className="flex h-screen bg-[#eef1f6]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          activeTab={activeTab}
          userName={getUserName()}
          onLogout={() => {
            clearToken()
            setAuthed(false)
          }}
        />
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