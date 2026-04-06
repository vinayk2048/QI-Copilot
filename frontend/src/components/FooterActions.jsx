import React from 'react'
import { FiDownload, FiGrid, FiShare2, FiBookmark, FiSave } from 'react-icons/fi'

export default function FooterActions({ onTestRepository }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50/50 rounded-b-xl">
      {/* Left side buttons */}
      <div className="flex items-center gap-2">
        <button className="btn-outline">
          <FiDownload className="text-sm" />
          Export
        </button>
        <button className="btn-outline">
          <FiGrid className="text-sm" />
          Excel
        </button>
        <button className="btn-outline">
          <FiShare2 className="text-sm" />
          Jira
        </button>
        <button className="btn-outline">
          <FiBookmark className="text-sm" />
          TestRail
        </button>
        <button className="btn-outline">
          <FiSave className="text-sm" />
          Save
        </button>
      </div>

      {/* Right side */}
      <button
        onClick={onTestRepository}
        className="btn-primary text-sm py-2 px-4"
      >
        <FiBookmark className="text-sm" />
        Test Repository
      </button>
    </div>
  )
}
