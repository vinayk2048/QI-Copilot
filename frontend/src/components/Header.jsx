import React from 'react'
import { RiRobot2Line, RiLogoutCircleRLine } from 'react-icons/ri'

const titles = {
  'test-cases': 'AI Test Case Generator',
  'script-generator': 'Test Script Generator',
}

export default function Header({ activeTab, userName = '', onLogout }) {
  return (
    <header className="bg-gradient-to-r from-[#3b5998] to-[#5b8dc9] px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow">
          <RiRobot2Line className="text-[#4a6fa5] text-lg" />
        </div>
        <h1 className="text-white text-lg font-semibold tracking-wide">
          {titles[activeTab] || 'QI Copilot'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {activeTab === 'script-generator' && (
          <>
            <HeaderButton icon="📤" label="Export Script" />
            <HeaderButton icon="📌" label="Push to Git" />
            <HeaderButton icon="🚀" label="Send to CI/CD" />
          </>
        )}
        {activeTab === 'test-cases' && (
          <>
            <HeaderButton icon="📤" label="Export" />
            <HeaderButton icon="📌" label="Push" />
            <HeaderButton icon="🧪" label="TestRail" />
          </>
        )}
        {userName && (
          <div className="flex items-center gap-2.5 ml-3 pl-3 border-l border-white/25">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="text-white/90 text-sm font-medium hidden sm:inline">{userName}</span>
            <button
              onClick={onLogout}
              title="Sign out"
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10 transition-all"
            >
              <RiLogoutCircleRLine />
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

function HeaderButton({ icon, label }) {
  return (
    <button className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all">
      <span className="text-base">{icon}</span>
      {label}
    </button>
  )
}
