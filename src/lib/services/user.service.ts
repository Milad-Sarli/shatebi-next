import { API_URL } from '@/lib/constants';

export interface User {
  id: number;
  username: string;
  fname: string;
  name: string;
  lname: string;
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
  tenants: Array<{
    id: number;
    name: string;
    title: string;
    expire_date: string;
    status: string;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface UserFilters {
  search?: string;
  with?: string;
  page?: number;
  per_page?: number;
  role?: 'admin' | 'superuser' | 'user';
  tenant_id?: number;
  status?: 'active' | 'inactive';
}

export class UserService {
  static async getUsers(filters: UserFilters = {}, accessToken: string): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.with) queryParams.append('with', filters.with);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.tenant_id) queryParams.append('tenant_id', filters.tenant_id.toString());
    if (filters.status) queryParams.append('status', filters.status);

    const response = await fetch(`${API_URL}/api/users?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در دریافت لیست کاربران');
    }

    return response.json();
  }

  static async createUser(userData: Partial<User>, accessToken: string): Promise<{ data: User }> {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در ایجاد کاربر');
    }

    return response.json();
  }

  static async updateUser(id: number, userData: Partial<User>, accessToken: string): Promise<{ data: User }> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در بروزرسانی کاربر');
    }

    return response.json();
  }

  static async deleteUser(id: number, accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'خطا در حذف کاربر');
    }

    return response.json();
  }
} 