import axios from "axios";
import { API_URL } from "@/lib/constants";

export interface OptimizedClass {
  id: number;
  tenant_id: number;
  user_id: number;
  droos_id: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant?: any;
  users?: any;
  dars?: any;
  optimized_class_masters?: any[];
  optimized_class_items?: any[];
}

export interface CreateOptimizedClassDto {
  tenant_id: number;
  user_id: number;
  droos_id: number;
  status: "active" | "inactive";
}

export interface UpdateOptimizedClassDto extends Partial<CreateOptimizedClassDto> {}

export interface Student {
  id: number;
  Fname: string;
  Lname: string;
  name?: string;
  email?: string;
}

export const optimizedClassService = {
  async getAll(accessToken: string): Promise<OptimizedClass[]> {
    const response = await axios.get(`${API_URL}/api/optimized-classes`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async getById(id: number, accessToken: string): Promise<OptimizedClass> {
    const response = await axios.get(`${API_URL}/api/optimized-classes/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async create(data: CreateOptimizedClassDto, accessToken: string): Promise<OptimizedClass> {
    const response = await axios.post(`${API_URL}/api/optimized-classes`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async update(id: number, data: UpdateOptimizedClassDto, accessToken: string): Promise<OptimizedClass> {
    const response = await axios.put(`${API_URL}/api/optimized-classes/${id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async delete(id: number, accessToken: string): Promise<void> {
    await axios.delete(`${API_URL}/api/optimized-classes/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getStudents(id: number, accessToken: string): Promise<Student[]> {
    const response = await axios.get(`${API_URL}/api/optimized-classes/${id}/students`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
    });
    return response.data.data;
  },
}; 