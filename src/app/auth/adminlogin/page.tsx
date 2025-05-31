'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import * as motion from "motion/react-client"
import { useAuth } from '@/lib/context/auth.context'
import SpotlightCard from '@/components/reactbit/SpotlightCard/SpotlightCard'
import { useRouter } from 'next/navigation'

const loginFormSchema = z.object({
  username: z.string().min(3, 'نام کاربری الزامی است'),
  password: z.string().min(3, 'رمز عبور الزامی است'),
})

export default function AdminLoginPage() {
  const { loginWithUsernameAndPassword } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const router = useRouter()

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  async function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true)
    setError('')
    try {
      await loginWithUsernameAndPassword(values.username, values.password)
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      let message = 'خطا در ورود'
      if (e instanceof Error) {
        message = e.message
      }
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-800 to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        <SpotlightCard className="p-8 shadow-xl rounded-2xl bg-white/10 backdrop-blur border border-white/20">
          <h2 className="text-2xl font-bold text-center text-white mb-6">ورود ادمین</h2>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <FormField
                control={loginForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">نام کاربری</FormLabel>
                    <FormControl>
                      <Input
                        dir="ltr"
                        disabled={isLoading}
                        placeholder="admin"
                        className="bg-white/[0.08] border-white/[0.12] text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-400" />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-200">رمز عبور</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        dir="ltr"
                        disabled={isLoading}
                        placeholder="••••••••"
                        className="bg-white/[0.08] border-white/[0.12] text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-400" />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-center text-red-400 text-sm">{error}</div>
              )}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block align-middle"
                    />
                    در حال ورود...
                  </>
                ) : (
                  'ورود'
                )}
              </Button>
            </form>
          </Form>
        </SpotlightCard>
      </motion.div>
    </div>
  )
} 