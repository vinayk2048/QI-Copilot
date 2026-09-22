import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  RiRobot2Line,
  RiShieldCheckLine,
  RiUserLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckboxCircleLine,
  RiArrowRightLine,
  RiSparkling2Line,
} from 'react-icons/ri'
import { login } from '../services/api'
import { setToken } from '../auth'

const FEATURES = [
  'Generate test cases from business requirements',
  'Create automation scripts instantly using AI',
  'Support Selenium, Playwright, Cypress, and RestAssured',
  'Multi-language support: Java, Python, and JavaScript',
  'Improve QA productivity and reduce manual effort',
]

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) {
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
    <div className="min-h-screen flex bg-gradient-to-br from-[#0c1730] via-[#12294f] to-[#0b1226]">
      <div className="hidden lg:flex flex-col flex-1 justify-between p-12 text-white animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center backdrop-blur">
            <RiShieldCheckLine className="text-[#7fd3ff] text-2xl" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] uppercase text-[#bcd9f2]">
              Praval
            </p>
            <p className="text-xs text-white/45">Enterprise Quality Engineering</p>
          </div>
        </div>

        <div className="max-w-xl">
          <div className="flex items-center gap-5 mb-8 animate-float-glow">
            <div className="w-16 h-16 bg-gradient-to-br from-[#4a6fa5] to-[#5b8dc9] rounded-2xl flex items-center justify-center shadow-2xl shadow-[#3b5998]/40">
              <RiRobot2Line className="text-white text-4xl" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              QI Copilot
            </h1>
          </div>

          <p className="text-xl font-medium text-[#cfe2f6]">AI-Powered Quality Engineering Platform</p>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60 max-w-lg">
            Accelerate software testing with AI-generated test cases, automation scripts,
            and intelligent quality engineering workflows.
          </p>

          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[15px] text-white/75">
                <RiCheckboxCircleLine className="mt-0.5 shrink-0 text-[#7fd3ff] text-lg" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-white/35 text-xs">
          <RiSparkling2Line className="text-sm" />
          <span>AI-Assisted Quality Engineering · © {new Date().getFullYear()} Praval</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#4a6fa5] to-[#5b8dc9] rounded-2xl flex items-center justify-center shadow-lg">
                <RiRobot2Line className="text-white text-2xl" />
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">QI Copilot</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 ring-1 ring-black/5 px-8 py-9 sm:px-10 sm:py-10 animate-fade-in-up">
            <div className="flex flex-col items-center text-center mb-7">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b5998] to-[#5b8dc9] flex items-center justify-center shadow-lg shadow-[#3b5998]/30 mb-4">
                <RiRobot2Line className="text-white text-3xl" />
              </div>
              <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-800">
                Welcome Back
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs">
                Sign in to access AI-powered test case generation and automation capabilities.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <RiUserLine
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
                  />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.form.requestSubmit()}
                    placeholder="Enter your username"
                    autoComplete="username"
                    autoFocus
                    aria-label="Username"
                    className="login-focus-ring w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 text-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <RiLockLine
                    aria-hidden="true"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none"
                  />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.form.requestSubmit()}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    aria-label="Password"
                    className="login-focus-ring w-full pl-11 pr-11 py-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-white text-slate-800 text-sm placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#3b5998] p-1 rounded-md transition-colors login-focus-ring"
                  >
                    {showPassword ? <RiEyeOffLine className="text-lg" /> : <RiEyeLine className="text-lg" />}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="text-sm bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-2.5 animate-fade-in"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#27407a] via-[#3b5998] to-[#5b8dc9] hover:from-[#1f3568] hover:via-[#3b5998] hover:to-[#4a7fc0] text-white font-semibold py-3 rounded-xl shadow-lg shadow-[#3b5998]/30 transition-all duration-200 hover:shadow-xl hover:shadow-[#3b5998]/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 login-focus-ring"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Access QI Copilot
                    <RiArrowRightLine aria-hidden="true" className="text-lg" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center justify-center gap-1.5 text-center animate-fade-in">
            <RiShieldCheckLine className="text-[#9cc9ef] text-sm" aria-hidden="true" />
            <span className="text-xs text-white/55">
              Powered by <span className="font-semibold text-white/80">Praval</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}