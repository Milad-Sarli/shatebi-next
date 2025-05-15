import { API_URL } from '@/lib/constants';

export interface Morakhasi {
  id: number;
  user_id: number;
  fullname: string;
  dalil?: string;
  guardmessage?: string;
  datetime?: string;
  dayli_date?: string;
  fromtime_1?: string;
  totime_1?: string;
  fromdate?: string;
  todate?: string;
  fromtime_2?: string;
  totime_2?: string;
  status?: number;
  sms_sent?: number;
  reject_dalil?: string;
  exit_ok?: number;
  accepted_by?: number;
  checked?: number;
  late?: number;
  late_time?: string;
  type?: number;
  tenant_id?: number;
  user?: unknown;
  accepted_by_user?: unknown;
  tenant?: unknown;
  [key: string]: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string | null;
    last: string | null;
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

export interface MorakhasiFilters {
  search?: string;
  with?: string;
  page?: number;
  per_page?: number;
  tenant_id?: number;
  status?: number;
}

export class MorakhasiService {
  static async getMorakhasiList(token: string): Promise<Morakhasi[]> {
    const response = await fetch(`${API_URL}/api/morakhasi`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      let errorDetails = 'Error fetching morakhasi list';
      try {
        const error = await response.json();
        errorDetails = error.message || errorDetails;
      } catch {} // ignore
      throw new Error(errorDetails);
    }
    return response.json();
  }

  static async getMorakhasi(id: number, token: string): Promise<Morakhasi> {
    const response = await fetch(`${API_URL}/api/morakhasi/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      let errorDetails = 'Error fetching morakhasi';
      try {
        const error = await response.json();
        errorDetails = error.message || errorDetails;
      } catch {} // ignore
      throw new Error(errorDetails);
    }
    return response.json();
  }

  static async createMorakhasi(data: Partial<Morakhasi>, token: string): Promise<Morakhasi> {
    const response = await fetch(`${API_URL}/api/morakhasi`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorDetails = 'Error creating morakhasi';
      try {
        const error = await response.json();
        errorDetails = error.message || errorDetails;
      } catch {} // ignore
      throw new Error(errorDetails);
    }
    return response.json();
  }

  static async updateMorakhasi(id: number, data: Partial<Morakhasi>, token: string): Promise<Morakhasi> {
    const response = await fetch(`${API_URL}/api/morakhasi/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let errorDetails = 'Error updating morakhasi';
      try {
        const error = await response.json();
        errorDetails = error.message || errorDetails;
      } catch {} // ignore
      throw new Error(errorDetails);
    }
    return response.json();
  }

  static async deleteMorakhasi(id: number, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/morakhasi/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    if (!response.ok) {
      let errorDetails = 'Error deleting morakhasi';
      try {
        const error = await response.json();
        errorDetails = error.message || errorDetails;
      } catch {} // ignore
      throw new Error(errorDetails);
    }
    return response.json();
  }
} 