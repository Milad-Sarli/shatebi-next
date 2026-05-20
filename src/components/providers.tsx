'use client'

import { AuthProvider } from '@/lib/context/auth.context'
import { ThemeProvider as ShadcnThemeProvider } from '@/components/ui/theme-provider'
import { ThemeProvider } from '@/lib/context/theme.context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ShadcnThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </ShadcnThemeProvider>
  )
} 