import React from 'react'
import Editor from '@monaco-editor/react'

const languageMap = {
  java: 'java',
  python: 'python',
  javascript: 'javascript',
  Java: 'java',
  Python: 'python',
  JavaScript: 'javascript',
}

export default function CodeEditor({ code = '', language = 'java', onChange }) {
  const monacoLang = languageMap[language] || 'java'

  return (
    <div className="h-full rounded-lg overflow-hidden border border-gray-700">
      <Editor
        height="100%"
        language={monacoLang}
        value={code}
        onChange={onChange}
        theme="vs-dark"
        options={{
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          minimap: { enabled: false },
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          padding: { top: 12 },
          readOnly: !onChange,
          renderLineHighlight: 'all',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
        }}
      />
    </div>
  )
}
