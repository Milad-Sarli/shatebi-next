/* eslint-disable */

import axios from "axios";

import { API_URL } from "@/lib/constants";

export interface OptimizedClass {
  id: number;
  tenant_id: number;
  user_id: number;
  droos_id: number;
  status: boolean; // true for active, false for inactive
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tenant?: any;
  users?: any;
  dars?: Dars;
  optimized_class_masters?: any[];
  optimized_class_items?: any[];
  lesson_area?: LessonArea;
}

export interface PaginatedResponse<T> {
  data: {
    data: T[];
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface GetOptimizedClassesParams {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface CreateOptimizedClassDto {
  tenant_id: number;
  user_id: number;
  droos_id: number;
  status?: boolean; // true for active, false for inactive
  students?: number[];
  masters?: MasterDataItem[];
}

export interface UpdateOptimizedClassDto extends Partial<CreateOptimizedClassDto> { }

export interface MasterDataItem {
  master_id: number;
  assistant_id?: number;
  status: number; // Assuming integer status based on PHP, adjust if boolean
}

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
  is_one_grade?: boolean | number | string;
  children?: Array<Dars>;
}

export interface Grade {
  id: number;
  hefz: number;
  details: number;
  tajvid: number;
  sout: number;
  number: number | null;
  practice_count: number | null;
  description: string | null;
  master_teacher: string | null;
  droos_id: Dars;
  dars: Dars;
  lesson_area: LessonArea;
  date?: string; // تاریخ انتخاب شده برای نمره (ISO timestamp) - اختیاری برای سازگاری با نمرات قدیمی
  created_at: string;
}

export interface StudentActivity {
  id: number;
  class_absent: string | null;
  provideless: string;
  reason: string | null;
  master: {
    id: number;
    name: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface Student {
  student: {
    id: number;
    name: string;
    father_name: string;
    student_code: string;
    phone: string;
    parent_phone: string;
    aks?: string | null;
  };
  grades: Grade[];
  activities: StudentActivity[];
}

export interface StudentsResponse {
  status: string;
  date: string;
  data: Student[];
}

export const optimizedClassService = {
  async getAll(accessToken: string, params?: GetOptimizedClassesParams): Promise<PaginatedResponse<OptimizedClass>> {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.per_page) {
      queryParams.append('per_page', params.per_page.toString());
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const url = `${API_URL}/api/optimized-classes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('Making paginated request to:', url);
    console.log('Access token:', accessToken ? 'Present' : 'Missing');

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
    });

    console.log('Paginated response status:', response.status);
    console.log('Paginated response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Paginated API error response:', errorText);
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Paginated API response data:', data);
    return data;
  },

  async getAllSimple(accessToken: string): Promise<OptimizedClass[]> {
    try {
      // First, try to get all classes with a large per_page parameter
      console.log('Fetching all classes...');
      const response = await this.getAll(accessToken, { per_page: 1000 });

      if (response.data && response.data.data) {
        console.log(`Fetched ${response.data.data.length} classes out of ${response.data.total} total`);

        // If we have more classes than what was returned, fetch all pages
        if (response.data.total > response.data.data.length) {
          const allClasses: OptimizedClass[] = [...response.data.data];
          const totalPages = response.data.last_page;

          console.log(`Need to fetch ${totalPages} pages total`);

          // Fetch remaining pages
          for (let page = 2; page <= totalPages; page++) {
            console.log(`Fetching page ${page}...`);
            const pageResponse = await this.getAll(accessToken, { page, per_page: 1000 });
            if (pageResponse.data && pageResponse.data.data) {
              allClasses.push(...pageResponse.data.data);
            }
          }

          console.log(`Total classes fetched: ${allClasses.length}`);
          return allClasses;
        }

        return response.data.data;
      }

      console.error('Unexpected API response format:', response);
      return [];
    } catch (error) {
      console.error('Error fetching all classes:', error);

      // Fallback to original simple request
      try {
        const url = `${API_URL}/api/optimized-classes`;
        console.log('Falling back to simple request to:', url);

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        console.log('Fallback API response status:', response.status);
        console.log('Fallback API response data:', response.data);

        // Handle different response formats
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data;
        } else {
          console.error('Unexpected API response format:', response.data);
          return [];
        }
      } catch (fallbackError) {
        console.error('Fallback request also failed:', fallbackError);
        throw fallbackError;
      }
    }
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

  async getStudents(id: number, date: string, accessToken: string): Promise<StudentsResponse> {
    const response = await axios.get(`${API_URL}/api/optimized-classes/${id}/students?date=${date}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
    });
    return response.data;
  },
};