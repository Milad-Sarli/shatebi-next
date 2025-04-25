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