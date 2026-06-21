"use client"
import { useParams } from "next/navigation"
import TenantLandingPage from "@/components/tenant-landing-page"

export default function TenantPage() {
  const params = useParams()
  return <TenantLandingPage tenantId={Number(params.id)} />
}
