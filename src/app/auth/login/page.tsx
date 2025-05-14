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
import { OTPInput } from '@/components/ui/otp-input'
import SpotlightCard from '@/components/reactbit/SpotlightCard/SpotlightCard'

// Step 1: National ID and Phone Number
const loginFormSchema = z.object({
  username: z.string()
    .min(10, 'کد ملی باید ۱۰ رقم باشد')
    .max(10, 'کد ملی باید ۱۰ رقم باشد')
    .regex(/^\d+$/, 'کد ملی باید فقط شامل اعداد باشد'),
  phone: z.string()
    .min(11, 'شماره موبایل باید ۱۱ رقم باشد')
    .max(11, 'شماره موبایل باید ۱۱ رقم باشد')
    .regex(/^09\d{9}$/, 'شماره موبایل باید با ۰۹ شروع شود'),
})

// Step 2: OTP Verification
const otpFormSchema = z.object({
  otp: z.string()
    .min(6, 'کد تایید باید ۶ رقم باشد')
    .max(6, 'کد تایید باید ۶ رقم باشد')
    .regex(/^\d+$/, 'کد تایید باید فقط شامل اعداد باشد'),
})

export default function LoginPage() {
  const { login, verifyOtp, resendOtp } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showOTP, setShowOTP] = React.useState(false)
  const [phoneNumber, setPhoneNumber] = React.useState('')
  const [countdown, setCountdown] = React.useState(0)
  const [otpToken, setOtpToken] = React.useState('')

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: '',
      phone: '',
    },
  })

  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: {
      otp: '',
    },
  })

  // Reset OTP form when switching to OTP screen
  React.useEffect(() => {
    if (showOTP) {
      otpForm.reset({ otp: '' });
    }
  }, [showOTP, otpForm]);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  async function onLoginSubmit(values: z.infer<typeof loginFormSchema>) {
    setIsLoading(true)

    try {
      const response = await login(values.username, values.phone)
      setPhoneNumber(values.phone)
      setOtpToken(response.token)
      // Reset OTP form before showing OTP screen
      otpForm.reset({ otp: '' })
      setShowOTP(true)
      setCountdown(120) // 2 minutes countdown
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function onOTPSubmit(values: z.infer<typeof otpFormSchema>) {
    setIsLoading(true)

    try {
      await verifyOtp(phoneNumber, values.otp, otpToken)
    } catch (error) {
      console.error('OTP verification error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResendOTP() {
    if (countdown > 0) return

    setIsLoading(true)
    try {
      const response = await resendOtp(phoneNumber, otpToken)
      setOtpToken(response.token)
      setCountdown(120) // Reset countdown to 2 minutes
    } catch (error) {
      console.error('Resend OTP error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Primary Gradient Background */}
      <div className="" />
      
     
      
    

      <div className="relative z-10 min-h-screen w-full grid lg:grid-cols-2 items-center justify-center gap-8 lg:gap-0 p-4">
        {/* Logo and Brand Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center lg:text-right order-1 lg:order-none hidden md:block lg:px-20"
        >
          <div className="max-w-2xl mx-auto lg:ml-auto lg:mr-0 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className=""
            />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6">
              سامانه شاطبی
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground">
              سیستم مدیریت یکپارچه اطلاعات
            </p>
          </div>
        </motion.div>
        <SpotlightCard className="w-full max-w-fit "> 
          {/* Login Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full "
          >
            {/* Mobile Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8 md:hidden"
            >
              <h1 className="text-3xl font-bold text-white mb-2">
                سامانه شاطبی
              </h1>
              <p className="text-sm text-slate-300/90">
                سیستم مدیریت یکپارچه اطلاعات
              </p>
            </motion.div>

            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className=""
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-1 text-center pb-6"
              >
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  ورود به سامانه
                </h2>
                <p className="pt-2 text-sm md:text-base text-slate-300">
                  {!showOTP 
                    ? 'برای ورود به سامانه، کد ملی و شماره موبایل خود را وارد کنید'
                    : 'کد تایید ارسال شده به شماره موبایل خود را وارد کنید'
                  }
                </p>
              </motion.div>

              <div className="pb-6">
                {!showOTP ? (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Form {...loginForm}>
                      <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="space-y-2"
                        >
                          <FormField
                            control={loginForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">کد ملی</FormLabel>
                                <FormControl>
                                  <Input
                                    dir="ltr"
                                    disabled={isLoading}
                                    placeholder="0123456789"
                                    className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs text-red-400" />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="space-y-2"
                        >
                          <FormField
                            control={loginForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200">شماره موبایل</FormLabel>
                                <FormControl>
                                  <Input
                                    dir="ltr"
                                    disabled={isLoading}
                                    placeholder="09123456789"
                                    className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-slate-400 focus:border-primary/50 focus:ring-primary/50"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs text-red-400" />
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="pt-2"
                        >
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
                                  className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                                />
                                در حال ارسال کد...
                              </>
                            ) : (
                              'دریافت کد تایید'
                            )}
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <Form {...otpForm}>
                      <form onSubmit={otpForm.handleSubmit(onOTPSubmit)} className="space-y-4">
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="space-y-2"
                          dir="ltr"
                        >
                          <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-200" dir="rtl">کد تایید</FormLabel>
                                <FormControl>
                                  <OTPInput
                                    disabled={isLoading}
                                    maxLength={6}
                                    className="justify-center [&_input]:text-white [&_input]:bg-white/[0.06] [&_input]:border-white/[0.08] [&_input]:focus:border-blue-500 [&_input]:focus:ring-blue-500 [&_input]:placeholder-gray-400"
                                    value={field.value ?? ''}
                                    onChange={(value) => {
                                      console.log('Current OTP value:', value);
                                      field.onChange(value);
                                      otpForm.setValue('otp', value);
                                    }}
                                  />
                                </FormControl>
                                <div className="text-center mt-2">
                                  <p className="text-slate-300 text-sm">
                                    کد وارد شده: <span className="font-mono text-blue-500">{field.value ?? '------'}</span>
                                  </p>
                                </div>
                                <FormMessage className="text-xs text-red-400" dir='rtl'/>
                              </FormItem>
                            )}
                          />
                        </motion.div>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="text-sm text-center"
                        >
                          {countdown > 0 ? (
                            <p className="text-slate-400">
                              ارسال مجدد کد تا {formatTime(countdown)}
                            </p>
                          ) : (
                            <Button
                              type="button"
                              variant="link"
                              className="px-0 text-primary hover:text-primary/90"
                              disabled={isLoading}
                              onClick={handleResendOTP}
                            >
                              ارسال مجدد کد تایید
                            </Button>
                          )}
                        </motion.div>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="pt-2"
                        >
                          <Button
                            type="submit"
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                                />
                                در حال بررسی...
                              </>
                            ) : (
                              'ورود به سامانه'
                            )}
                          </Button>
                        </motion.div>
                        <motion.div
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full text-slate-300 hover:text-white hover:bg-white/[0.06]"
                            disabled={isLoading}
                            onClick={() => {
                              setShowOTP(false)
                              setPhoneNumber('')
                              setCountdown(0)
                              setOtpToken('')
                              otpForm.reset()
                            }}
                          >
                            بازگشت
                          </Button>
                        </motion.div>
                      </form>
                    </Form>
                  </motion.div>
                )}
                </div>
              </motion.div>
            </motion.div>

          </SpotlightCard>
      </div>
    </div>
  )
} 