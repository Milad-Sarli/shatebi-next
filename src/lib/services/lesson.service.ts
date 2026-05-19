/* eslint-disable */
import axios from "axios";
import { API_URL } from "@/lib/constants";

export interface Lesson {
  id: number;
  title: string;
  description?: string;
  tenant_id?: number;
  parent_id?: number;
  created_at?: string;
  updated_at?: string;
  is_one_grade?: boolean | string | number | null;
  pages?: number | null;
  start_page?: number | null;
  tenant?: {
    id: number;
    title: string;
  };
  parent?: Lesson;
  children?: Lesson[];
}

export interface LessonFilters {
  page?: number;
  per_page?: number;
  search?: string;
  tenant_id?: number;
  parent_id?: number | null;
}

export interface PaginationResponse {
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
  from: number;
  to: number;
}

export interface LessonResponse {
  data: Lesson[];
  pagination: PaginationResponse;
  status: boolean;
}

export interface LessonCreateData {
  title: string;
  description?: string;
  tenant_id: number;
  parent_id?: number | null;
  is_one_grade?: string;
  pages?: number | null;
  start_page?: number | null;
  lesson_area_id?: number | null;
}

export interface LessonUpdateData extends Partial<LessonCreateData> { }

export class LessonService {
  static async getLessons(filters: LessonFilters = {}, token: string): Promise<LessonResponse> {
    const response = await axios.get(`${API_URL}/api/droos`, {
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getLessonById(id: number, token: string) {
    const response = await axios.get(`${API_URL}/api/droos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getRelatedLessons(darsId: number, token: string) {
    const response = await axios.get(`${API_URL}/api/droos/${darsId}/related`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async createLesson(data: LessonCreateData, token: string) {
    const response = await axios.post(`${API_URL}/api/droos`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async updateLesson(id: number, data: LessonUpdateData, token: string) {
    // اطمینان از اینکه parent_id به درستی ارسال می‌شود
    // تبدیل مستقیم به عدد برای اطمینان از ارسال صحیح به سرور
    const formattedData = {
      ...data,
    };

    // اگر parent_id وجود دارد، آن را به عدد تبدیل می‌کنیم
    if (data.parent_id !== null && data.parent_id !== undefined) {
      formattedData.parent_id = Number(data.parent_id);
    } else {
      // در غیر این صورت، مقدار null را به صورت صریح ارسال می‌کنیم
      formattedData.parent_id = null;
    }

    console.log("Final data sent to API:", JSON.stringify(formattedData));

    const response = await axios.put(`${API_URL}/api/droos/${id}`, formattedData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async deleteLesson(id: number, token: string) {
    const response = await axios.delete(`${API_URL}/api/droos/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getLessonsByTenant(tenantId: number, token: string) {
    const response = await axios.get(`${API_URL}/api/droos/tenant/${tenantId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async getLessonsByParent(parentId: number | null, token: string) {
    const url = parentId
      ? `${API_URL}/api/droos/parent/${parentId}`
      : `${API_URL}/api/droos/parent/null`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  static async toggleOneGrade(id: number, token: string) {
    const response = await axios.post(`${API_URL}/api/droos/${id}/toggle-one-grade`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  // متدهای جدید برای مدیریت زیرشاخه‌ها

  /**
   * حذف والد از یک درس (جدا کردن زیرشاخه)
   * @param id شناسه درسی که می‌خواهیم از والد آن جدا شود
   * @param token توکن دسترسی
   */
  static async removeParent(id: number, token: string) {
    const response = await axios.put(`${API_URL}/api/droos/${id}/remove-parent`, null, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  /**
   * اضافه کردن زیرشاخه به یک درس
   * @param parentId شناسه درس والد
   * @param childId شناسه درسی که می‌خواهیم به عنوان زیرشاخه اضافه کنیم
   * @param token توکن دسترسی
   */
  static async addChild(parentId: number, childId: number, token: string) {
    const response = await axios.put(`${API_URL}/api/droos/${parentId}/add-child`, { child_id: childId }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }

  /**
   * دریافت لیست دروس قابل انتساب به عنوان والد
   * توجه: این متد از API موجود استفاده می‌کند و فیلترینگ در سمت کلاینت انجام می‌شود
   * @param excludeId شناسه درسی که می‌خواهیم از لیست خارج شود (اختیاری)
   * @param token توکن دسترسی
   */
  static async getAvailableForParent(token: string, excludeId?: number | string) {
    // استفاده از API موجود به جای API ناموجود
    const response = await this.getLessons({ parent_id: null }, token);

    if (response && response.data) {
      // فیلتر کردن دروس برای حذف درس فعلی از لیست
      const filteredData = excludeId
        ? response.data.filter(lesson => lesson.id !== Number(excludeId))
        : response.data;

      return {
        status: true,
        data: filteredData
      };
    }

    return { status: false, data: [] };
  }
}