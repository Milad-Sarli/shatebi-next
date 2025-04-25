'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AuthService, LoginResponse, VerifyOtpResponse, ResendOtpResponse } from '@/lib/services/auth.service'
import Cookies from 'js-cookie'

interface User {
  id: number
  username: string
  phone: string
}

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
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [user, setUser] = React.useState<User | null>(null)
  const [accessToken, setAccessToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Check for existing session on mount
    const token = Cookies.get('access_token')
    const userData = Cookies.get('user')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      // Handle legacy data format
      const user = {
        id: parsedUser.id,
        username: parsedUser.username || parsedUser.national_id,
        phone: parsedUser.phone
      }
      setAccessToken(token)
      setUser(user)
      setIsAuthenticated(true)
    }
  }, [])

  const login = async (username: string, phone: string) => {
    try {
      const response = await AuthService.login(username, phone)
      return response
    } catch (error) {
      throw error
    }
  }

  const verifyOtp = async (phone: string, otp: string, token: string) => {
    try {
      const response = await AuthService.verifyOtp(phone, otp, token)
      setAccessToken(response.access_token)
      setUser(response.user)
      setIsAuthenticated(true)
      
      // Store in cookies
      Cookies.set('access_token', response.access_token, { 
        expires: 1, // 1 day
        secure: true,
        sameSite: 'strict'
      })
      Cookies.set('user', JSON.stringify(response.user), {
        expires: 1,
        secure: true,
        sameSite: 'strict'
      })
      
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      if (accessToken) {
        await AuthService.logout(accessToken)
      }
      
      // Clear state and cookies
      setAccessToken(null)
      setUser(null)
      setIsAuthenticated(false)
      Cookies.remove('access_token')
      Cookies.remove('user')
      
      router.push('/auth/login')
      router.refresh()
    } catch (error) {
      throw error
    }
  }

  const resendOtp = async (phone: string, token: string) => {
    try {
      const response = await AuthService.resendOtp(phone, token)
      return response
    } catch (error) {
      throw error
    }
  }

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