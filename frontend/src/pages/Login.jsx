import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  RiRobot2Line,
  RiShieldCheckLine,
  RiUserLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiArrowRightLine,
} from 'react-icons/ri'
import { login } from '../services/api'
import { setToken } from '../auth'
import pravalLogo from '../assets/praval-logo-text.svg'

const FEATURES = [
  {
    title: 'Smart Test Case Generation',
    description: 'Requirements to test cases in seconds',
  },
  {
    title: 'Multi-Framework Support',
    description: 'Selenium, Playwright, Cypress & RestAssured',
  },
  {
    title: 'Enterprise Sync',
    description: 'Seamless integration with Jira & Azure DevOps',
  },
]

export default function Login({ onSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
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
      setToken(data.access_token, remember)
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
    <div className="relative min-h-screen flex flex-col bg-[#0A192F] overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-[#1d4ed8]/20 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-32 w-[600px] h-[600px] rounded-full bg-[#0ea5e9]/15 blur-[150px]"
      />

      <div className="relative flex flex-1">
        <div className="hidden lg:flex flex-col flex-1 justify-between px-14 py-12 text-white animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-white p-2 shadow-md flex items-center">
              <img
                src={pravalLogo}
                alt="Praval"
                className="h-7 w-auto"
              />
            </div>
            <div>
              <p className="text-[11px] text-white/40">Enterprise Quality Engineering</p>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center shadow-2xl shadow-blue-900/50">
                <RiRobot2Line className="text-white text-3xl" />
              </div>
              <h1 className="text-5xl font-extrabold tracking-tight">QI Copilot</h1>
            </div>

            <p className="text-xl font-medium text-[#cfe2f6]">
              AI-Powered Quality Engineering Platform
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-white/55">
              Accelerate testing with AI-generated test cases and automation scripts —
              built for modern QA and engineering teams.
            </p>

            <div className="mt-9 space-y-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3.5 py-2.5 px-3.5 -mx-3.5 rounded-xl transition-colors duration-200 hover:bg-white/5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d4ed8]/90 shadow-lg shadow-blue-900/40">
                    <RiCheckLine className="text-white text-sm" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white/90">{feature.title}</p>
                    <p className="text-[13px] text-white/50">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-7 animate-fade-in">
              <div className="inline-flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] flex items-center justify-center shadow-lg">
                  <RiRobot2Line className="text-white text-2xl" />
                </div>
                <span className="text-white text-2xl font-bold tracking-tight">QI Copilot</span>
              </div>
            </div>

            <div className="rounded-3xl bg-white px-8 sm:px-10 pt-10 sm:pt-12 pb-8 sm:pb-10 shadow-2xl shadow-black/40 ring-1 ring-white/10 animate-fade-in-up">
              <div className="mb-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#1d4ed8] to-[#0ea5e9] shadow-lg shadow-blue-300/40">
                  <RiRobot2Line className="text-white text-2xl" aria-hidden="true" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Sign in to QI Copilot
                </h2>
                <p className="mt-1.5 text-sm text-slate-500">
                  Enter QI Copilot credentials to access your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate autoComplete="on">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Username / Email
                    </label>
                    <div className="relative">
                      <RiUserLine
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                      />
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username or email"
                        autoComplete="username"
                        autoFocus
                        aria-label="Username or email"
                        className="login-focus-ring w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-sm font-medium text-slate-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <RiLockLine
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-slate-400"
                      />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        aria-label="Password"
                        className="login-focus-ring w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-800 placeholder:text-slate-400 transition-colors hover:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-[#1d4ed8]"
                      >
                        {showPassword ? (
                          <RiEyeOffLine className="text-lg" />
                        ) : (
                          <RiEyeLine className="text-lg" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 accent-[#1d4ed8]"
                    />
                    <span className="text-[13px]">Keep me logged in</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => toast('Please contact your QI Copilot administrator to reset your password.', { icon: '🔐' })}
                    className="text-[13px] font-medium text-[#1d4ed8] transition-colors hover:text-[#0ea5e9]"
                  >
                    Forgot password?
                  </button>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mt-4 animate-fade-in rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="login-focus-ring mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#1d4ed8] to-[#0ea5e9] py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/40 hover:from-[#1e40af] hover:to-[#0284c7] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In to QI Copilot
                      <RiArrowRightLine className="text-lg" aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-7 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-white/45">
                <button onClick={() => toast('Privacy Policy', { icon: '🔒' })} className="transition-colors hover:text-white/80">
                  Privacy Policy
                </button>
                <span className="text-white/20">|</span>
                <button onClick={() => toast('Terms of Service', { icon: '📋' })} className="transition-colors hover:text-white/80">
                  Terms of Service
                </button>
              </div>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
                <RiShieldCheckLine className="text-[#9cc9ef] text-sm" aria-hidden="true" />
                <span>
                  Powered by <span className="font-semibold text-white/85">Praval</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}