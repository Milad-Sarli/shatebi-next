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
  login: (username: string, phone: string) => Promise<LoginResponse>
  verifyOtp: (phone: string, otp: string, token: string) => Promise<void>
  logout: () => Promise<void>
  resendOtp: (phone: string, token: string) => Promise<ResendOtpResponse>
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

  const login = React.useCallback(async (username: string, phone: string) => {
    return storeLogin(username, phone)
  }, [storeLogin])

  const verifyOtp = React.useCallback(async (phone: string, otp: string, token: string) => {
    await storeVerifyOtp(phone, otp, token, router)
  }, [storeVerifyOtp, router])

  const logout = React.useCallback(async () => {
    await storeLogout(router)
  }, [storeLogout, router])

  const resendOtp = React.useCallback(async (phone: string, token: string) => {
    return storeResendOtp(phone, token)
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