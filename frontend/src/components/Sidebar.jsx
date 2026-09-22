import React, { useState } from 'react'
import { FiFileText, FiCode, FiSettings, FiHelpCircle, FiX } from 'react-icons/fi'
import { RiRobot2Line, RiCheckLine, RiCloseLine } from 'react-icons/ri'

const navItems = [
  { id: 'test-cases', label: 'Test Cases', icon: FiFileText },
  { id: 'script-generator', label: 'Script Generator', icon: FiCode },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  const [modal, setModal] = useState(null)
  const [health, setHealth] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)

  const openSettings = async () => {
    setModal('settings')
    setHealthLoading(true)
    try {
      const res = await fetch('/api/health')
      const json = await res.json()
      setHealth(json)
    } catch {
      setHealth(null)
    } finally {
      setHealthLoading(false)
    }
  }

  return (
    <aside className="w-56 bg-[#2c3e6b] flex flex-col py-4 px-3 gap-1">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
          <RiRobot2Line className="text-[#4a6fa5] text-xl" />
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">QI Copilot</span>
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-left ${
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={item.label}
          >
            <Icon className="text-lg flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        )
      })}

      <div className="flex-1" />

      {/* Bottom items */}
      <button
        onClick={openSettings}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-left"
        title="Settings"
      >
        <FiSettings className="text-lg flex-shrink-0" />
        <span className="text-sm font-medium">Settings</span>
      </button>
      <button
        onClick={() => setModal('help')}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-left"
        title="Help"
      >
        <FiHelpCircle className="text-lg flex-shrink-0" />
        <span className="text-sm font-medium">Help</span>
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-800">
                {modal === 'settings' ? 'Settings' : 'Help'}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FiX className="text-lg" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm">
              {modal === 'settings' ? (
                <>
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Application</p>
                    <div className="flex justify-between"><span className="text-gray-500">App</span><span className="font-medium text-gray-800">QI Copilot</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Version</span><span className="font-medium text-gray-800">1.0.0</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Environment</span><span className="font-medium text-gray-800">Production (Azure)</span></div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">AI Engine</p>
                    {healthLoading ? (
                      <p className="text-gray-500">Checking backend...</p>
                    ) : health ? (
                      <>
                        <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-green-600">Online</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Model</span><span className="font-medium text-gray-800">{health.model || 'gpt-oss-120b'}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">API Key</span>
                          {health.api_key_configured ? (
                            <span className="inline-flex items-center gap-1 font-medium text-green-600"><RiCheckLine /> Configured</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-red-500"><RiCloseLine /> Missing</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">Backend unreachable</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Model and API key are managed in Azure App Settings (MODEL_NAME, GROK_API_KEY).
                  </p>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-gray-50 p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">How to use</p>
                    <div className="space-y-2 text-gray-600">
                      <p><span className="font-semibold text-gray-800">1.</span> Test Cases tab — paste a requirement/user story and click Generate.</p>
                      <p><span className="font-semibold text-gray-800">2.</span> Script Generator tab — pick your test case source, framework, and language, then Generate Script.</p>
                      <p><span className="font-semibold text-gray-800">3.</span> Use Export / Excel to download, or Save to keep your work in this browser.</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Integrations</p>
                    <p className="text-gray-600">Jira, Azure DevOps, TestRail and CI/CD are planned — coming soon.</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-2">Support</p>
                    <p className="text-gray-600">Contact your QI Copilot administrator for access or help.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}