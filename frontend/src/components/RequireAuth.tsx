import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <p className="text-muted font-mono text-sm">Loading…</p>
  }

  if (!user) {
    return (
      <div className="card max-w-md">
        <p className="text-sm text-ink mb-3">Please log in from the Account page first.</p>
        <Link to="/" className="btn inline-block">
          Go to Account
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
