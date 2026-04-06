import React from 'react'
import { FiFileText, FiCode, FiSettings, FiHelpCircle } from 'react-icons/fi'
import { RiRobot2Line } from 'react-icons/ri'

const navItems = [
  { id: 'test-cases', label: 'Test Cases', icon: FiFileText },
  { id: 'script-generator', label: 'Script Generator', icon: FiCode },
]

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-16 bg-[#2c3e6b] flex flex-col items-center py-4 gap-1">
      {/* Logo */}
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-6 shadow-md">
        <RiRobot2Line className="text-[#4a6fa5] text-xl" />
      </div>

      {/* Nav items */}
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
              isActive
                ? 'bg-white/20 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}
            title={item.label}
          >
            <Icon className="text-lg" />
            {/* Tooltip */}
            <span className="absolute left-14 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {item.label}
            </span>
          </button>
        )
      })}

      <div className="flex-1" />

      {/* Bottom icons */}
      <button className="w-11 h-11 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" title="Settings">
        <FiSettings className="text-lg" />
      </button>
      <button className="w-11 h-11 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all" title="Help">
        <FiHelpCircle className="text-lg" />
      </button>
    </aside>
  )
}
