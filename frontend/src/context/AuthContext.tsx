import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as api from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, fullName: string, password: string) => Promise<void>
  logout: () => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    if (!api.getAccessToken()) {
      setUser(null)
      return
    }
    try {
      const profile = await api.getProfile()
      setUser(profile)
    } catch {
      api.setTokens(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api.login(email, password)
    api.setTokens(tokens)
    const profile = await api.getProfile()
    setUser(profile)
  }, [])

  const signup = useCallback(async (email: string, fullName: string, password: string) => {
    await api.signup(email, fullName, password)
  }, [])

  const logout = useCallback(() => {
    api.setTokens(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
