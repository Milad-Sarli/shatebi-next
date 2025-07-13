import { Grade } from '@/lib/services/optimizedClass.service';

export interface MorakhasiFilters {
  page: number;
  per_page: number;
  search: string;
  type: string;
  status?: number;
  user_id?: number;
}

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
  created_at: string;
  updated_at: string;
  pivot?: {
    role_id: number;
    permission_id: number;
  };
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
  tenant?: {
    id: number;
    name: string;
    title: string;
  };
}

export interface User {
  id: number;
  username: string;
  fname: string | null;
  name: string;
  lname: string | null;
  avatar: string | null;
  phone: string;
  email: string | null;
  tenant_id: number;
  send_sms: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  tenant: {
    id: number;
    name: string;
    title: string;
    expire_date: string;
    status: string;
  };
  tenants?: Array<{
    id: number;
    name: string;
    title: string;
  }>;
  roles?: Role[];
  permissions?: Permission[];
}

export interface AppRole {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  users?: {
    id: number;
    name: string;
    // Add other user fields as needed
  };
}

export interface Morakhasi {
  id: number;
  user_id: number;
  fullname: string;
  dalil: string;
  guardmessage: null;
  datetime: null;
  dayli_date: string | null;
  fromtime_1: string | null;
  totime_1: string | null;
  fromdate: string | null;
  todate: string | null;
  fromtime_2: string | null;
  totime_2: string | null;
  status: number | null;
  sms_sent: null;
  reject_dalil: null;
  exit_ok: null;
  accepted_by: null;
  checked: null;
  late: null;
  late_time: null;
  type: number;
  tenant_id: number;
  deleted_at: null;
  created_at: string;
  updated_at: string;
  user: {
    id: number;
    username: string;
    fname: string;
    name: null;
    lname: string;
    avatar: string;
    send_sms: boolean;
    phone: string;
    email: string;
    tenant_id: number;
    deleted_at: null;
    created_at: string;
    updated_at: string;
  };
  tenant: {
    id: number;
    name: string;
    title: string;
    expire_date: string;
    status: number;
    deleted_at: null;
    created_at: string;
    updated_at: string;
  };
}

export interface ValidationError {
  response?: {
    data?: {
      errors?: Record<string, string[]>;
      message?: string;
    };
  };
  message?: string;
}

export interface EditingGrade extends Grade {
  studentId: number;
}
