import { API_URL } from '@/lib/constants';

export interface Student {
  id: number;
  Fname: string;
  Lname: string;
  FatherName: string;
  Mellicode: string;
  FatherJob: string;
  Ostan: string;
  status: string;
  Aks?: string;
  juz?: string;
  ziafat?: string;
  ziafatdate?: string;
  Birthday?: string;
  Birthplace?: string;
  Entryday?: string;
  Phone?: string;
  TelPhone?: string;
  ParentPhone?: string;
  City?: string;
  Vilage?: string;
  Adress?: string;
  Educating?: string;
  degree?: string;
  StudentCode?: string;
  Referer?: string;
  documents?: string;
  EconomicStatus?: string;
  course?: string;
  master_status?: string;
  Health?: string;
  Description?: string;
  endDate?: string;
  tenant: {
    id: number;
    name: string;
    title: string;
    expire_date: string;
    status: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

export interface StudentFilters {
  search?: string;
  with?: string;
  page?: number;
  per_page?: number;
  tenant_id?: number;
  status?: 'active' | 'inactive';
}

export class StudentService {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      catch (_e) {
        // If parsing fails, data can remain null or have a default message
        errorPayload.data = { message: `Request failed with status ${response.status}. No parsable error details from server.` };
      }

      const errorMessage =
        (errorPayload.data && typeof errorPayload.data.message === 'string')
          ? errorPayload.data.message
          : `Request failed: ${response.status} ${response.statusText}`;

      const error: Error & { response?: typeof errorPayload } = new Error(errorMessage);
      error.response = errorPayload; // Attach the structured payload
      throw error;
    }
    return response.json() as Promise<T>;
  }

  static async getStudents(filters: StudentFilters = {}, token: string): Promise<PaginatedResponse<Student>> {
    const queryParams = new URLSearchParams();

    if (filters.search) queryParams.append('search', filters.search);
    if (filters.with) queryParams.append('with', filters.with);
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.per_page) queryParams.append('per_page', filters.per_page.toString());
    if (filters.tenant_id) queryParams.append('tenant_id', filters.tenant_id.toString());
    if (filters.status) queryParams.append('status', filters.status);

    const response = await fetch(`${API_URL}/api/students?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return this.handleResponse<PaginatedResponse<Student>>(response);
  }

  static async createStudent(studentData: Partial<Student>, token: string): Promise<{ data: Student }> {
    const response = await fetch(`${API_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    return this.handleResponse<{ data: Student }>(response);
  }

  static async getStudent(id: number, token: string): Promise<{ data: Student }> {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return this.handleResponse<{ data: Student }>(response);
  }

  static async updateStudent(id: number, studentData: Partial<Student>, token: string): Promise<{ data: Student }> {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(studentData)
    });
    return this.handleResponse<{ data: Student }>(response);
  }

  static async deleteStudent(id: number, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return this.handleResponse<{ message: string }>(response);
  }

  static async getStudentsByTenant(tenantId: number, token: string): Promise<PaginatedResponse<Student>> {
    const response = await fetch(`${API_URL}/api/students/tenant/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    return this.handleResponse<PaginatedResponse<Student>>(response);
  }
} 