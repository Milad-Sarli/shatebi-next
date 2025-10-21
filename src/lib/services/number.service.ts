/* eslint-disable */
import axios from "axios";
import { API_URL } from "@/lib/constants";
import { Dars, OptimizedClass } from "./optimizedClass.service";

export interface MasterTeacher {
  id: number;
  user_id: string;
  mellicode: string;
  fullname: string;
  aks: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  phone: string;
  tenant_id: string;
}

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
  date?: string; // تاریخ انتخاب شده برای نمره (ISO timestamp with time)
  created_at: string;
  updated_at: string;
  optimized_class?: OptimizedClass;
  optimizedClass?: OptimizedClass;
  master_teacher?: MasterTeacher;
  masterTeacher?: MasterTeacher;
  student?: any;
  dars?: Dars;
  droos?: Dars;
  lesson_area?: any;
  lessonArea?: any;
  user?: any;
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
  date: string; // تاریخ انتخاب شده برای نمره (ISO timestamp with time) - required
  user_id?: number;
  tenant_id?: number;
  // فیلدهای اضافی برای محدوده درسی
  start_page?: number;
  end_page?: number;
  start_surah?: string;
  start_verse?: number;
  end_surah?: string;
  end_verse?: number;
  start_joze?: number;
  end_joze?: number;
}

export interface UpdateOptimizedNumberDto extends Partial<CreateOptimizedNumberDto> { }

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export const optimizedNumberService = {
  async getAll(
    accessToken: string,
    page: number = 1,
    per_page: number = 10,
    search: string = "",
    teacherId: string = "all",
    studentId: string = "all",
    scoreRange: string = "all",
    startDate: string | null = null,
    endDate: string | null = null,
    negative_scores: boolean = false
  ): Promise<PaginatedResponse<OptimizedNumber>> {
    console.log("Making request to:", `${API_URL}/api/optimized-numbers`);
    console.log("Request headers:", {
      Authorization: `Bearer ${accessToken}`,
    });

    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("per_page", per_page.toString());
    if (search && search !== "") params.append("search", search);
    if (teacherId && teacherId !== "all") params.append("master_id", teacherId);
    if (studentId && studentId !== "all") params.append("student_id", studentId);
    if (scoreRange && scoreRange !== "all") params.append("score_range", scoreRange);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (negative_scores) params.append("negative_scores", "true");

    try {
      const response = await axios.get(`${API_URL}/api/optimized-numbers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data; // Return the entire pagination object
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
