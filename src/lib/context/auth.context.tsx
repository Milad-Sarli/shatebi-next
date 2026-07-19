'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { User, LoginResponse, ResendOtpResponse } from '@/lib/types/auth.types'
import { useAuthStore } from '@/lib/store/auth.store'
import { OtpMethod } from '@/lib/services/auth.service'

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  accessToken: string | null
  impersonatedBy: number | null
  login: (username: string, method?: OtpMethod) => Promise<LoginResponse>
  loginWithUsernameAndPassword: (username: string, password: string) => Promise<void>
  verifyOtp: (otp: string, token: string, phone: string) => Promise<void>
  logout: () => Promise<void>
  resendOtp: (token: string, method?: OtpMethod) => Promise<ResendOtpResponse>
  impersonateUser: (userId: number) => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  
  const { 
    isAuthenticated,
    user,
    accessToken,
    impersonatedBy,
    login: storeLogin,
    verifyOtp: storeVerifyOtp,
    logout: storeLogout,
    resendOtp: storeResendOtp,
    loginWithUsernameAndPassword: loginWithUsernameAndPasswordStore,
    impersonateUser: storeImpersonateUser,
  } = useAuthStore();

  const login = React.useCallback(async (username: string, method?: OtpMethod) => {
    return storeLogin(username, method)
  }, [storeLogin])

  const verifyOtp = React.useCallback(async (otp: string, token: string, phone: string) => {
    await storeVerifyOtp(otp, token, phone, router)
  }, [storeVerifyOtp, router])

  const logout = React.useCallback(async () => {
    await storeLogout(router)
  }, [storeLogout, router])

  const resendOtp = React.useCallback(async (token: string, method?: OtpMethod) => {
    return storeResendOtp(token, method)
  }, [storeResendOtp])

  const loginWithUsernameAndPassword = React.useCallback(async (username: string, password: string) => {
    await loginWithUsernameAndPasswordStore(username, password)
  }, [loginWithUsernameAndPasswordStore])

  const impersonateUser = React.useCallback(async (userId: number) => {
    await storeImpersonateUser(userId)
  }, [storeImpersonateUser])

  const value = {
    isAuthenticated,
    user,
    accessToken,
    impersonatedBy,
    login,
    loginWithUsernameAndPassword,
    verifyOtp,
    logout,
    resendOtp,
    impersonateUser,
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