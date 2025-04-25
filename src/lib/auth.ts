'use client'

import { jwtDecode } from "jwt-decode"

export const AUTH_TOKEN_KEY = 'auth-token'

interface AuthToken {
  sub: string // user id
  name: string
  email: string
  exp: number
}

export function setAuthToken(token: string) {
  if (typeof window === 'undefined') return
  
  try {
    // Verify the token is valid JWT
    const decoded = jwtDecode<AuthToken>(token)
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      throw new Error('Token expired')
    }

    // Store the token
    document.cookie = `${AUTH_TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    
    return decoded
  } catch (error) {
    console.error('Invalid token:', error)
    removeAuthToken()
    return null
  }
}

export function removeAuthToken() {
  if (typeof window === 'undefined') return
  document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  const authCookie = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_TOKEN_KEY}=`))
  
  if (!authCookie) return null
  
  const token = authCookie.split('=')[1]
  
  try {
    // Verify the token is valid JWT
    const decoded = jwtDecode<AuthToken>(token)
    
    // Check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      removeAuthToken()
      return null
    }
    
    return token
  } catch {
    removeAuthToken()
    return null
  }
}

export function getUser(): AuthToken | null {
  const token = getAuthToken()
  if (!token) return null
  
  try {
    return jwtDecode<AuthToken>(token)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
} 