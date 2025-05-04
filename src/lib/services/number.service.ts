import axios from "axios";
import { API_URL } from "@/lib/constants";
import { Dars } from "./optimizedClass.service";

export interface OptimizedNumber {
  id: number;
  class_id: number;
  master_id: number;
  student_id: number;
  droos_id: number;
  hefz: number;
  details: number;
  tajvid: number;
  sout: number;
  number: number;
  practice_count: number;
  description?: string;
  lesson_area_id: number;
  user_id: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
  optimizedClass?: any;
  masterTeacher?: any;
  student?: any;
  droos?: Dars;
  lessonArea?: any;
  user?: any;
  tenant?: any;
}

export interface CreateOptimizedNumberDto {
  class_id: number;
  master_id: number;
  student_id: number;
  droos_id: number;
  hefz: number;
  details: number;
  tajvid: number;
  sout: number;
  number: number;
  practice_count: number;
  description?: string;
  lesson_area_id: number;
  user_id: number;
  tenant_id: number;
}

export interface UpdateOptimizedNumberDto extends Partial<CreateOptimizedNumberDto> {}

export const optimizedNumberService = {
  async getAll(accessToken: string): Promise<OptimizedNumber[]> {
    console.log("Making request to:", `${API_URL}/api/optimized-numbers`);
    console.log("Request headers:", {
      Authorization: `Bearer ${accessToken}`,
    });
    
    try {
      const response = await axios.get(`${API_URL}/api/optimized-numbers`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log("Response received:", response);
      return response.data.data;
    } catch (error) {
      console.error("Error in getAll:", error);
      throw error;
    }
  },

  async getById(id: number, accessToken: string): Promise<OptimizedNumber> {
    const response = await axios.get(`${API_URL}/api/optimized-numbers/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async create(data: CreateOptimizedNumberDto, accessToken: string): Promise<OptimizedNumber> {
    const response = await axios.post(`${API_URL}/api/optimized-numbers`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async update(id: number, data: UpdateOptimizedNumberDto, accessToken: string): Promise<OptimizedNumber> {
    const response = await axios.put(`${API_URL}/api/optimized-numbers/${id}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async delete(id: number, accessToken: string): Promise<void> {
    await axios.delete(`${API_URL}/api/optimized-numbers/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async getByTenant(tenantId: number, accessToken: string): Promise<OptimizedNumber[]> {
    const response = await axios.get(`${API_URL}/api/optimized-numbers/tenant/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async getByStudent(studentId: number, accessToken: string): Promise<OptimizedNumber[]> {
    const response = await axios.get(`${API_URL}/api/optimized-numbers/student/${studentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },

  async getByClass(classId: number, accessToken: string): Promise<OptimizedNumber[]> {
    const response = await axios.get(`${API_URL}/api/optimized-numbers/class/${classId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.data;
  },
};
