/* eslint-disable */
import axios from "axios";
import { API_URL } from "@/lib/constants";

export interface Master {
  id: number;
  user_id: number;
  mellicode: string;
  fullname: string;
  aks: string;
  phone: string;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  tenant?: {
    id: number;
    name: string;
    [key: string]: any;
  };
}

export interface MasterFilters {
  page?: number;
  per_page?: number;
  search?: string;
  tenant_id?: number;
}

export interface PaginationResponse {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
}

export interface MasterResponse {
  status: string;
  data: {
    data: Master[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
    path: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
}

export interface MasterCreateData {
  user_id: number;
  mellicode: string;
  fullname: string;
  aks?: File | string;
  phone: string;
  tenant_id: number;
}

export interface MasterUpdateData {
  user_id?: number;
  mellicode?: string;
  fullname?: string;
  aks?: File | string | null;
  phone?: string;
  tenant_id?: number;
}

export class MasterService {
  static async getMasters(filters: MasterFilters = {}, accessToken: string): Promise<MasterResponse> {
    const { data } = await axios.get(`${API_URL}/api/masters`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      params: filters
    });
    return data;
  }

  static async getAllMasters(accessToken: string): Promise<Master[]> {
    let allMasters: Master[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await this.getMasters({ page: currentPage, per_page: 100 }, accessToken);

        if (response.data && response.data.data) {
          allMasters = [...allMasters, ...response.data.data];

          // Check if there are more pages
          hasMorePages = response.data.current_page < response.data.last_page;
          currentPage++;
        } else {
          hasMorePages = false;
        }
      } catch (error) {
        console.error(`Error fetching masters page ${currentPage}:`, error);
        hasMorePages = false;
      }
    }

    return allMasters;
  }

  static async getMastersByTenant(tenantId: number, accessToken: string): Promise<MasterResponse> {
    const { data } = await axios.get(`${API_URL}/api/masters/tenant/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return data;
  }

  static async getMaster(id: number, accessToken: string): Promise<{ status: string, data: Master }> {
    const { data } = await axios.get(`${API_URL}/api/masters/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return data;
  }

  static async createMaster(masterData: MasterCreateData, accessToken: string): Promise<{ status: string, message: string, data: Master }> {
    let payload: FormData | MasterCreateData = masterData;
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (masterData.aks instanceof File) {
      const formData = new FormData();
      Object.keys(masterData).forEach(key => {
        const value = masterData[key as keyof MasterCreateData];
        if (value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      payload = formData;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    const { data } = await axios.post(`${API_URL}/api/masters`, payload, {
      headers: headers
    });
    return data;
  }

  static async updateMaster(id: number, masterData: MasterUpdateData, accessToken: string): Promise<{ status: string, message: string, data: Master }> {
    let payload: FormData | MasterUpdateData = masterData;
    const headers: { [key: string]: string } = {
      Authorization: `Bearer ${accessToken}`,
    };

    if (masterData.aks instanceof File) {
      const formData = new FormData();
      Object.keys(masterData).forEach(key => {
        const value = masterData[key as keyof MasterUpdateData];
        if (value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value);
          } else if (value === null) {
            formData.append(key, '');
          } else {
            formData.append(key, String(value));
          }
        }
      });
      payload = formData;
    } else {
      headers['Content-Type'] = 'application/json';
    }

    const { data } = await axios.put(`${API_URL}/api/masters/${id}`, payload, {
      headers: headers
    });
    return data;
  }

  static async deleteMaster(id: number, accessToken: string): Promise<{ status: string, message: string }> {
    const { data } = await axios.delete(`${API_URL}/api/masters/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    return data;
  }
} 