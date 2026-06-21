"use client"

import { useEffect, useState, useCallback } from "react"
import { ArrowLeft, LayoutDashboard, UserPlus, RefreshCw, GraduationCap } from "lucide-react"
import Link from "next/link"
import { ApplicantOtpService } from "@/lib/services/applicant-otp.service"

const FALLBACK_TENANTS: Record<number, { name: string; title: string }> = {
  1: { name: "shatebi", title: "دارالقرآن امام شاطبی (رح)" },
  7: { name: "rahmate", title: "مسجد و مکتبخانه رحمت" },
}

function Skeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-8 px-6 w-full max-w-lg mx-auto">
        <div className="h-10 w-44 animate-pulse rounded-full bg-muted" />
        <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-muted" />
        <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-6" dir="rtl">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="rounded-full bg-muted p-4">
          <GraduationCap className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">مرکز مورد نظر یافت نشد</h2>
          <p className="text-muted-foreground">ممکن است این مرکز آموزشی در دسترس نباشد</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            تلاش مجدد
          </button>
        )}
      </div>
    </div>
  )
}

interface TenantLandingPageProps {
  tenantId: number
}

export default function TenantLandingPage({ tenantId }: TenantLandingPageProps) {
  const [tenant, setTenant] = useState<{ name: string; title: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTenants = useCallback(() => {
    setLoading(true)
    ApplicantOtpService.getPublicTenants()
      .then(tenants => {
        const found = tenants.find(t => t.id === tenantId)
        if (found) {
          setTenant({ name: found.name, title: found.title || found.name })
        } else {
          setTenant(FALLBACK_TENANTS[tenantId] || null)
        }
      })
      .catch(() => {
        setTenant(FALLBACK_TENANTS[tenantId] || null)
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  if (loading) return <Skeleton />
  if (!tenant) return <ErrorState onRetry={fetchTenants} />

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background" dir="rtl">
      <main className="flex flex-col items-center justify-center gap-10 px-6 w-full max-w-lg mx-auto py-12">
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-muted text-sm font-medium text-muted-foreground border border-border">
            سامانه جامع آموزشی
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-[1.4]">
            {tenant.title}
          </h1>
        </div>

        <div className="w-full">
          <Link href={`/registeration/${tenantId}`} className="block">
            <div className="group rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
                    <UserPlus className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      ثبت نام
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {tenant.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
          <p className="text-center text-sm text-muted-foreground mt-3">
            برای ثبت نام در این مرکز کلیک کنید
          </p>
        </div>

        <Link href="/dashboard">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-6 py-3.5 text-base font-medium text-foreground shadow-sm hover:bg-accent transition-colors">
            <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
            <span>ورود به داشبورد</span>
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </main>
    </div>
  )
}
