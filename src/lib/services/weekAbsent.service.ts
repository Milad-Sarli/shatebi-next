import { API_URL } from '@/lib/constants';

export interface WeekAbsentStudent {
    id?: number;
    student_id: number;
    absent: boolean;
    delay: boolean;
    delay_time?: string | null;
    absent_reason?: string | null;
    status: number;
    student?: {
        id: number;
        Fname: string;
        Lname: string;
        Mellicode: string;
        StudentCode: string;
    };
}

export interface WeekAbsent {
    id?: number;
    date: string;
    user_id?: number;
    tenant_id?: number;
    created_at?: string;
    updated_at?: string;
    user?: {
        id: number;
        fname: string;
        lname: string;
    };
    tenant?: {
        id: number;
        name: string;
    };
    students: WeekAbsentStudent[];
}

export interface WeekAbsentFilters {
    per_page?: number;
    paginate?: 'on' | 'off';
    search?: string;
    date?: string;
    user_id?: number;
    tenant_id?: number;
    sort_by?: 'date' | 'created_at' | 'updated_at';
    sort_order?: 'asc' | 'desc';
}

export interface DateRangeFilters {
    start_date: string;
    end_date: string;
    per_page?: number;
    paginate?: 'on' | 'off';
}

export interface StudentStatistics {
    student: {
        id: number;
        Fname: string;
        Lname: string;
    };
    statistics: {
        total_days: number;
        absent_days: number;
        delay_days: number;
        present_days: number;
    };
    date_range: {
        start_date: string;
        end_date: string;
    };
}

export interface StudentsForDateResponse {
    date: string;
    students: Array<{
        id: number;
        Fname: string;
        Lname: string;
        Mellicode: string;
        StudentCode: string;
    }>;
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
}

export class WeekAbsentService {
    private static async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorPayload: { data: { message?: string;[key: string]: unknown } | null; status: number; statusText: string } = {
                data: null,
                status: response.status,
                statusText: response.statusText,
            };
            try {
                errorPayload.data = await response.json() as { message?: string;[key: string]: unknown };
            }
            catch (_e) {
                errorPayload.data = { message: `Request failed with status ${response.status}. No parsable error details from server.` };
            }

            const errorMessage =
                (errorPayload.data && typeof errorPayload.data.message === 'string')
                    ? errorPayload.data.message
                    : `Request failed: ${response.status} ${response.statusText}`;

            const error: Error & { response?: typeof errorPayload } = new Error(errorMessage);
            error.response = errorPayload;
            throw error;
        }
        return response.json() as Promise<T>;
    }

    // Get all attendance records
    static async getAll(token: string, filters?: WeekAbsentFilters): Promise<ApiResponse<PaginatedResponse<WeekAbsent>>> {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`${API_URL}/api/week-absents?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<PaginatedResponse<WeekAbsent>>>(response);
    }

    // Create new attendance record
    static async create(data: { date: string; students: WeekAbsentStudent[] }, token: string): Promise<ApiResponse<WeekAbsent>> {
        const response = await fetch(`${API_URL}/api/week-absents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return this.handleResponse<ApiResponse<WeekAbsent>>(response);
    }

    // Get specific attendance record
    static async getById(id: number, token: string): Promise<ApiResponse<WeekAbsent>> {
        const response = await fetch(`${API_URL}/api/week-absents/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<WeekAbsent>>(response);
    }

    // Update attendance record
    static async update(id: number, data: { date: string; students: WeekAbsentStudent[] }, token: string): Promise<ApiResponse<WeekAbsent>> {
        const response = await fetch(`${API_URL}/api/week-absents/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return this.handleResponse<ApiResponse<WeekAbsent>>(response);
    }

    // Delete attendance record
    static async delete(id: number, token: string): Promise<ApiResponse<{ message: string }>> {
        const response = await fetch(`${API_URL}/api/week-absents/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<{ message: string }>>(response);
    }

    // Get students for date
    static async getStudentsForDate(date: string, token: string): Promise<ApiResponse<StudentsForDateResponse>> {
        const response = await fetch(`${API_URL}/api/week-absents/students-for-date?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<StudentsForDateResponse>>(response);
    }

    // Get attendance records by date range
    static async getByDateRange(filters: DateRangeFilters, token: string): Promise<ApiResponse<PaginatedResponse<WeekAbsent>>> {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, value.toString());
            }
        });

        const response = await fetch(`${API_URL}/api/week-absents/date-range?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<PaginatedResponse<WeekAbsent>>>(response);
    }

    // Get student statistics
    static async getStudentStatistics(studentId: number, startDate: string, endDate: string, token: string): Promise<ApiResponse<StudentStatistics>> {
        const params = new URLSearchParams({
            start_date: startDate,
            end_date: endDate
        });

        const response = await fetch(`${API_URL}/api/week-absents/student/${studentId}/statistics?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<StudentStatistics>>(response);
    }

    // Update attendance status
    static async updateStatus(id: number, status: number, token: string): Promise<ApiResponse<WeekAbsent>> {
        const response = await fetch(`${API_URL}/api/week-absents/${id}/status`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        return this.handleResponse<ApiResponse<WeekAbsent>>(response);
    }

    // Get attendance records by tenant
    static async getByTenant(tenantId: number, token: string, filters?: Partial<WeekAbsentFilters>): Promise<ApiResponse<PaginatedResponse<WeekAbsent>>> {
        const params = new URLSearchParams();

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`${API_URL}/api/week-absents/tenant/${tenantId}?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return this.handleResponse<ApiResponse<PaginatedResponse<WeekAbsent>>>(response);
    }
} 