'use client'

import { AuthProvider } from '@/lib/context/auth.context'
import { ThemeProvider } from '@/components/ui/theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
} 