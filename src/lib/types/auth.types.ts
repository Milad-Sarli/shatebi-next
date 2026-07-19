export interface AppRole {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: number;
  name: string;
  title: string;
  expire_date: string;
  status: number;
}

export interface User {
  id: number
  username: string
  phone: string
  fname?: string | null
  name?: string | null
  lname?: string | null
  avatar?: string | null
  email?: string | null
  tenant_id?: number
  send_sms?: boolean
  is_superuser?: boolean | null
  is_admin?: boolean | null
  created_at?: string
  updated_at?: string
  tenant?: Tenant
  tenants?: Tenant[]
  app_roles?: AppRole[]
}

// Assuming these types are defined in auth.service.ts or similar
// If not, define them here based on actual API response
export interface LoginResponse {
  token: string
  phone: string
  message?: string
  bale_not_linked?: boolean
}

export interface VerifyOtpResponse {
  user: User
  access_token: string
  // other verify OTP response fields if any
}


export interface ResendOtpResponse {
  token: string
  // other resend OTP response fields if any
} 