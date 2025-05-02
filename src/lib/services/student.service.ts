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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error fetching students list');
    }

    return response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error creating student');
    }

    return response.json();
  }

  static async getStudent(id: number, token: string): Promise<{ data: Student }> {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error fetching student');
    }

    return response.json();
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error updating student');
    }

    return response.json();
  }

  static async deleteStudent(id: number, token: string): Promise<{ message: string }> {
    const response = await fetch(`${API_URL}/api/students/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error deleting student');
    }

    return response.json();
  }

  static async getStudentsByTenant(tenantId: number, token: string): Promise<PaginatedResponse<Student>> {
    const response = await fetch(`${API_URL}/api/students/tenant/${tenantId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error fetching students by tenant');
    }

    return response.json();
  }
} 