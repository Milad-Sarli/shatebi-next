import { API_URL } from '@/lib/constants';

export interface JuzSummary {
  total_students: number;
  active_students_this_month: number;
  total_readings: number;
  total_khatms: number;
  juz_distribution: Record<number, number>;
}

export interface JuzAssignment {
  id: number;
  tenant_id: number;
  student_id: number;
  juz_number: number;
  day_of_week: number;
  is_active: boolean;
  assigned_by: number;
  created_at: string;
  updated_at: string;
  student?: { id: number; Fname: string; Lname: string };
  assigned_by_user?: { id: number; username: string };
}

export interface JuzReadingLog {
  id: number;
  tenant_id: number;
  student_id: number;
  recorded_by: number;
  juz_number: number;
  read_date: string;
  source: string;
  is_verified: boolean;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  student?: { id: number; Fname: string; Lname: string };
  recorder?: { id: number; username: string };
  verifier?: { id: number; username: string };
}

export interface KhatmRecord {
  id: number;
  tenant_id: number;
  student_id: number;
  khatm_number: number;
  completed_date: string;
  is_verified: boolean;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentProgress {
  student: { id: number; Fname: string; Lname: string };
  completed_juz: number[];
  completed_count: number;
  remaining_juz: number[];
  remaining_count: number;
  total_readings: number;
  this_month_readings: number;
  khatms: KhatmRecord[];
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  total: number;
  per_page: number;
  last_page: number;
}

export interface JuzDistributionItem {
  juz_number: number;
  count: number;
}

export interface WeeklyCompletion {
  week_start: string;
  week_end: string;
  daily: Array<{ day: string; count: number }>;
}

const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'];

export function getDayName(dayIndex: number): string {
  return dayNames[dayIndex] || 'نامشخص';
}

function getToken(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem('auth-storage');
  if (!stored) return '';
  try {
    const { state } = JSON.parse(stored);
    return state?.accessToken || '';
  } catch {
    return '';
  }
}

export class JuzService {
  private static async request<T>(url: string, options?: RequestInit): Promise<T> {
    const token = getToken();
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  // Summary
  static async getSummary(): Promise<ApiResponse<JuzSummary>> {
    return this.request('/api/juz-reports/summary');
  }

  // Weekly completion
  static async getWeeklyCompletion(weekStart?: string): Promise<ApiResponse<WeeklyCompletion>> {
    const params = weekStart ? `?week_start=${weekStart}` : '';
    return this.request(`/api/juz-reports/weekly-completion${params}`);
  }

  // Juz distribution
  static async getJuzDistribution(): Promise<ApiResponse<JuzDistributionItem[]>> {
    return this.request('/api/juz-reports/juz-distribution');
  }

  // Student progress
  static async getStudentProgress(studentId: number): Promise<ApiResponse<StudentProgress>> {
    return this.request(`/api/juz-reports/student-progress/${studentId}`);
  }

  // Assignments
  static async getAssignments(params?: {
    student_id?: number;
    day_of_week?: number;
    is_active?: boolean;
    per_page?: number;
    paginate?: 'on' | 'off';
  }): Promise<ApiResponse<PaginatedResponse<JuzAssignment> | JuzAssignment[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return this.request(`/api/juz-assignments?${query.toString()}`);
  }

  static async createAssignment(data: {
    student_id: number;
    juz_number: number;
    day_of_week: number;
  }): Promise<ApiResponse<JuzAssignment>> {
    return this.request('/api/juz-assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async bulkCreateAssignments(assignments: Array<{
    student_id: number;
    juz_number: number;
    day_of_week: number;
  }>): Promise<ApiResponse<JuzAssignment[]>> {
    return this.request('/api/juz-assignments/bulk', {
      method: 'POST',
      body: JSON.stringify({ assignments }),
    });
  }

  static async applyWeek(studentIds: number[], weekStart: string): Promise<ApiResponse<{ generated: number }>> {
    return this.request('/api/juz-assignments/apply-week', {
      method: 'POST',
      body: JSON.stringify({ student_ids: studentIds, week_start: weekStart }),
    });
  }

  static async updateAssignment(id: number, data: {
    juz_number?: number;
    day_of_week?: number;
    is_active?: boolean;
  }): Promise<ApiResponse<JuzAssignment>> {
    return this.request(`/api/juz-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteAssignment(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/juz-assignments/${id}`, {
      method: 'DELETE',
    });
  }

  // Reading logs
  static async getReadingLogs(params?: {
    student_id?: number;
    juz_number?: number;
    date_from?: string;
    date_to?: string;
    is_verified?: boolean;
    per_page?: number;
    paginate?: 'on' | 'off';
  }): Promise<ApiResponse<PaginatedResponse<JuzReadingLog> | JuzReadingLog[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return this.request(`/api/juz-reading-logs?${query.toString()}`);
  }

  static async createReadingLog(data: {
    student_id: number;
    juz_number: number;
    read_date: string;
    source?: string;
  }): Promise<ApiResponse<JuzReadingLog>> {
    return this.request('/api/juz-reading-logs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async verifyReadingLog(id: number): Promise<ApiResponse<JuzReadingLog>> {
    return this.request(`/api/juz-reading-logs/${id}/verify`, {
      method: 'POST',
    });
  }

  static async deleteReadingLog(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/juz-reading-logs/${id}`, {
      method: 'DELETE',
    });
  }
}
