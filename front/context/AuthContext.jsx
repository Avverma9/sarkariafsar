'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchMe, clearToken, loginWithGoogle as _loginWithGoogle } from '@/lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const me = await fetchMe()
    setUser(me)
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const loginWithGoogle = useCallback(() => {
    _loginWithGoogle()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isLoggedIn: !!user, logout, loginWithGoogle, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
