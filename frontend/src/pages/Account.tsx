import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import * as api from '../api/client'
import type { DashboardSummary } from '../types'

type Tab = 'login' | 'signup'

export default function Account() {
  const { user } = useAuth()

  if (user) return <LoggedInView />
  return <AuthView />
}

function AuthView() {
  const { login, signup } = useAuth()
  const [tab, setTab] = useState<Tab>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setBusy(true)
    try {
      await signup(signupEmail, fullName, signupPassword)
      setSuccess('Account created — you can log in now.')
      setTab('login')
    } catch (err) {
      setError(err instanceof api.ApiError ? err.detail : 'Signup failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 items-stretch">
      {/* Hero: signature scan-line moment */}
      <div className="card relative overflow-hidden min-h-[360px] flex flex-col justify-between">
        <div className="absolute inset-0 barcode-pattern opacity-[0.06]" />
        <div className="absolute left-0 right-0 top-12 bottom-0 overflow-hidden">
          <div className="absolute left-0 right-0 h-0.5 bg-laser shadow-glow animate-scan" />
      </div>
        <div className="relative">
          <p className="font-mono text-xs uppercase tracking-widest text-laser mb-3">Scanning ready</p>
          <h1 className="display text-3xl font-bold leading-tight mb-3">
            Know what's
            <br />
            in every product.
          </h1>
          <p className="text-muted text-sm leading-relaxed max-w-sm">
            Point a camera at any barcode, or upload a photo. SmartScan looks it up, reads the label, and
            runs an AI health analysis in seconds.
          </p>
        </div>

      </div>

      {/* Auth card */}
      <div className="card">
        <div className="flex border-b border-line mb-5">
          <button
            className={`tab-btn ${tab === 'login' ? 'tab-btn-active' : ''}`}
            onClick={() => {
              setTab('login')
              setError(null)
            }}
          >
            Login
          </button>
          <button
            className={`tab-btn ${tab === 'signup' ? 'tab-btn-active' : ''}`}
            onClick={() => {
              setTab('signup')
              setError(null)
            }}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-laser/40 bg-laser/10 px-3 py-2 text-sm text-laser">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-mint/40 bg-mint/10 px-3 py-2 text-sm text-mint">
            {success}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button className="btn-solid w-full" disabled={busy} type="submit">
              {busy ? 'Logging in…' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="input"
                required
                minLength={2}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                required
                minLength={8}
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
              />
              <p className="text-xs text-muted mt-1">At least 8 characters.</p>
            </div>
            <button className="btn-solid w-full" disabled={busy} type="submit">
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function LoggedInView() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    api.getDashboardSummary().then(setSummary).catch(() => setSummary(null))
  }, [])

  return (
    <div>
      <h1 className="display text-2xl font-bold mb-1">Welcome back, {user?.full_name} 👋</h1>
      <p className="text-muted text-sm mb-8">
        Use the sidebar to navigate: Dashboard, Scanner, and Shopping List.
      </p>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Scans" value={summary.total_scans} />
          <StatCard label="Unique Products Scanned" value={summary.unique_products_scanned} />
          <StatCard label="Shopping List Pending" value={summary.shopping_list_pending} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p className="label mb-2">{label}</p>
      <p className="display text-3xl font-bold text-laser">{value}</p>
    </div>
  )
}
