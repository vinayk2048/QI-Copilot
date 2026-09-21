import React from 'react'
import { FiFileText, FiCode, FiSettings, FiHelpCircle } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'

const navItems = [
  { id: 'test-cases', label: 'Test Cases', icon: FiFileText },
  { id: 'script-generator', label: 'Script Generator', icon: FiCode },
]

export default function Sidebar({ activeTab, setActiveTab }) {
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
      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-left" title="Settings">
        <FiSettings className="text-lg flex-shrink-0" />
        <span className="text-sm font-medium">Settings</span>
      </button>
      <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-left" title="Help">
        <FiHelpCircle className="text-lg flex-shrink-0" />
        <span className="text-sm font-medium">Help</span>
      </button>
    </aside>
  )
}