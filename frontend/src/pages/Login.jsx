import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { RiRobot2Line, RiShieldCheckLine, RiLoginBoxLine, RiSparkling2Line } from 'react-icons/ri'
import { login } from '../services/api'
import { setToken } from '../auth'

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await login(username.trim(), password)
      setToken(data.access_token)
      toast.success(`Welcome, ${data.username}!`)
      onSuccess()
    } catch (err) {
      const msg = err.response?.data?.detail || 'Sign-in failed. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0c1730] via-[#12294f] to-[#0c1730]">
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <RiShieldCheckLine className="text-[#7fd3ff] text-3xl" />
          <div>
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-[#9cc4e8]">Praval</p>
            <p className="text-xs text-white/50">Enterprise Quality Engineering</p>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <RiRobot2Line className="text-[#3b5998] text-3xl" />
            </div>
            <h1 className="text-4xl font-bold tracking-wide">QI Copilot</h1>
          </div>
          <p className="text-xl text-[#bcd4ef] mb-8 leading-snug">
            AI-Powered Test Automation Engine
          </p>
          <ul className="space-y-3 text-white/70">
            {[
              'Generate structured test cases from user stories',
              'Convert test cases into automation scripts',
              'Selenium · Playwright · Cypress · RestAssured',
              'Python · Java · JavaScript',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <RiSparkling2Line className="text-[#7fd3ff]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} Praval. Powered by Praval · AI-Assisted QE
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#3b5998] rounded-xl flex items-center justify-center">
              <RiRobot2Line className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">QI Copilot</h2>
              <p className="text-sm text-slate-500">AI-Powered Test Automation</p>
            </div>
          </div>

          <h2 className="hidden lg:block text-2xl font-bold text-slate-800 mb-1">Sign in</h2>
          <p className="text-sm text-slate-500 mb-6">
            Use your QI Copilot credentials to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b5998] focus:border-transparent"
              />
            </div>

            {error && (
              <div className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#3b5998] to-[#5b8dc9] hover:opacity-95 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <RiLoginBoxLine />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5">
            <RiShieldCheckLine className="text-[#3b5998]" />
            <span className="text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-500">Praval</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}