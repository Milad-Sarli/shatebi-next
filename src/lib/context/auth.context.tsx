'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
// Remove AuthService import if only used by store
// import Cookies from 'js-cookie' // Remove unused import
import { User, LoginResponse, ResendOtpResponse } from '@/lib/types/auth.types'
import { useAuthStore } from '@/lib/store/auth.store' // Import the zustand store

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  login: (username: string) => Promise<LoginResponse>
  verifyOtp: (otp: string, token: string, phone: string) => Promise<void>
  logout: () => Promise<void>
  resendOtp: (token: string) => Promise<ResendOtpResponse>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  const { 
    isAuthenticated,
    user,
    accessToken,
    login: storeLogin,
    verifyOtp: storeVerifyOtp,
    logout: storeLogout,
    resendOtp: storeResendOtp,
    // _setState // Remove unused variable
  } = useAuthStore();

  const login = React.useCallback(async (username: string) => {
    return storeLogin(username)
  }, [storeLogin])

  const verifyOtp = React.useCallback(async (otp: string, token: string, phone: string) => {
    await storeVerifyOtp(otp, token, phone, router)
  }, [storeVerifyOtp, router])

  const logout = React.useCallback(async () => {
    await storeLogout(router)
  }, [storeLogout, router])

  const resendOtp = React.useCallback(async (token: string) => {
    return storeResendOtp(token)
  }, [storeResendOtp])

  const value = {
    isAuthenticated,
    user,
    accessToken,
    login,
    verifyOtp,
    logout,
    resendOtp,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 