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
  is_verified: boolean | number | null;
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
  is_verified: boolean | number | null;
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

export interface StudentTaskReading {
  id: number;
  juz_student_task_id: number;
  juz_assignment_id: number | null;
  student_id: number;
  juz_number: number;
  read_date: string;
  is_verified: boolean | number | null;
  verified_by: number | null;
  verified_at: string | null;
}

export interface StudentTask {
  id: number;
  student_id: number;
  date_from: string;
  date_to: string;
  juz_list: number[];
  status: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_expired: boolean;
  read_juz: number[];
  readings: StudentTaskReading[];
  student?: { id: number; Fname: string; Lname: string };
  assignments?: JuzAssignment[];
}

export interface JuzStudentReadingRecord {
  id: number;
  juz_student_task_id: number;
  juz_assignment_id: number | null;
  student_id: number;
  juz_number: number;
  read_date: string;
  is_verified: boolean | number | null;
  verified_by: number | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  student?: { id: number; Fname: string; Lname: string };
  studentTask?: { id: number; date_from: string; date_to: string };
  assignment?: { id: number; juz_number: number; day_of_week: number };
  verifier?: { id: number; username: string };
}

export interface JuzAssignmentWithRecord {
  id: number;
  juz_student_task_id: number | null;
  student_id: number;
  juz_number: number;
  day_of_week: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  student?: { id: number; Fname: string; Lname: string };
  studentTask?: { id: number; date_from: string; date_to: string; student_id: number };
  readingRecord?: JuzStudentReadingRecord | null;
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
    juz_student_task_id?: number;
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
    is_verified?: boolean | number | string;
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

  // Student tasks (date-range based assignments)
  static async getMyTasks(): Promise<ApiResponse<StudentTask[]>> {
    return this.request('/api/juz/my-tasks');
  }

  static async markTaskJuz(taskId: number, juzNumber: number): Promise<ApiResponse<null>> {
    return this.request(`/api/juz/my-tasks/${taskId}/mark-juz/${juzNumber}`, {
      method: 'POST',
    });
  }

  static async unmarkTaskJuz(taskId: number, juzNumber: number): Promise<ApiResponse<null>> {
    return this.request(`/api/juz/my-tasks/${taskId}/unmark-juz/${juzNumber}`, {
      method: 'POST',
    });
  }

  static async getStudentTasks(params?: {
    student_id?: number;
    status?: string;
    paginate?: 'on' | 'off';
  }): Promise<ApiResponse<StudentTask[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return this.request(`/api/juz/student-tasks?${query.toString()}`);
  }

  static async createStudentTask(data: {
    student_id: number;
    date_from: string;
    date_to: string;
    juz_list: number[];
  }): Promise<ApiResponse<StudentTask>> {
    return this.request('/api/juz/student-tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteStudentTask(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/api/juz/student-tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Reading records (admin)
  static async getReadingRecords(params?: {
    student_id?: number;
    juz_number?: number;
    is_verified?: boolean | number | string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    paginate?: 'on' | 'off';
  }): Promise<ApiResponse<JuzStudentReadingRecord[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return this.request(`/api/juz/reading-records?${query.toString()}`);
  }

  static async verifyReadingRecord(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/juz/reading-records/${id}/verify`, {
      method: 'POST',
    });
  }

  static async rejectReadingRecord(id: number): Promise<ApiResponse<null>> {
    return this.request(`/api/juz/reading-records/${id}/reject`, {
      method: 'POST',
    });
  }

  // All assignments with reading status (admin task list)
  static async getAssignmentsWithStatus(params?: Record<string, string | number | boolean>): Promise<ApiResponse<JuzAssignmentWithRecord[]>> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) query.append(k, String(v));
      });
    }
    return this.request(`/api/juz/assignments-with-status?${query.toString()}`);
  }
}
