/* eslint-disable */

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
  dars?: Dars;
  optimized_class_masters?: any[];
  optimized_class_items?: any[];
}

export interface CreateOptimizedClassDto {
  tenant_id: number;
  user_id: number;
  droos_id: number;
  status: "active" | "inactive";
}

export interface UpdateOptimizedClassDto extends Partial<CreateOptimizedClassDto> { }

export interface LessonArea {
  id: number;
  start_surah: { id: number; title: string; titleAr: string } | null;
  start_verse: number | null;
  end_surah: { id: number; title: string; titleAr: string } | null;
  end_verse: number | null;
  start_page: number | null;
  end_page: number | null;
  start_joze: number | null;
  end_joze: number | null;
}

export interface Dars {
  id: number;
  title: string;
  is_one_grade?: boolean;
}

export interface Grade {
  hefz: number;
  details: number;
  tajvid: number;
  sout: number;
  number: number | null;
  practice_count: number | null;
  description: string | null;
  master_teacher: string | null;
  dars: Dars;
  lesson_area: LessonArea;
  created_at: string;
}

export interface Student {
  student: {
    id: number;
    name: string;
    father_name: string;
    student_code: string;
    phone: string;
    parent_phone: string;
  };
  grades: Grade[];
}

export interface StudentsResponse {
  status: string;
  date: string;
  data: Student[];
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

  async getStudents(id: number, date: Date | null, accessToken: string): Promise<StudentsResponse> {
    const response = await axios.get(`${API_URL}/api/optimized-classes/${id}/students?date=${date}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
    });
    return response.data;
  },
}; 