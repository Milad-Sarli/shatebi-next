import { API_URL } from '@/lib/constants';

export interface CurrentlyStudyingStudent {
    id: number;
    Fname: string;
    Lname: string;
    FatherName: string;
    Mellicode: string;
    FatherJob: string;
    Entryday: string;
    Educating: string;
    Ostan: string;
    status: string;
    StudentCode: string;
    tenant_id: number;
    created_at: string;
    updated_at: string;
    tenant: {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
    };
}

export interface CurrentlyStudyingStudentsResponse {
    status: string;
    message: string;
    data: CurrentlyStudyingStudent[] | PaginatedCurrentlyStudyingStudentsData;
}

export interface PaginatedCurrentlyStudyingStudentsData {
    current_page: number;
    data: CurrentlyStudyingStudent[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface CurrentlyStudyingStudentsFilters {
    per_page?: number;
    search?: string;
    paginate?: 'off' | 'on';
    page?: number;
}

export class CurrentlyStudyingStudentsService {
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

    /**
     * Get currently studying students for a specific tenant
     * @param tenantId - The ID of the tenant to get students for
     * @param filters - Optional filters for pagination, search, and pagination control
     * @param token - Authentication token
     * @returns Promise with currently studying students data
     */
    static async getCurrentlyStudyingStudents(
        tenantId: number,
        filters: CurrentlyStudyingStudentsFilters = {},
        token: string
    ): Promise<CurrentlyStudyingStudentsResponse> {
        const queryParams = new URLSearchParams();

        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString());
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.paginate) queryParams.append('paginate', filters.paginate);
        if (filters.page) queryParams.append('page', filters.page.toString());

        const response = await fetch(
            `${API_URL}/api/students/currently-studying/${tenantId}?${queryParams.toString()}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            }
        );
        return this.handleResponse<CurrentlyStudyingStudentsResponse>(response);
    }

    /**
     * Get all currently studying students without pagination
     * @param tenantId - The ID of the tenant to get students for
     * @param search - Optional search term
     * @param token - Authentication token
     * @returns Promise with all currently studying students
     */
    static async getAllCurrentlyStudyingStudents(
        tenantId: number,
        search?: string,
        token?: string
    ): Promise<CurrentlyStudyingStudentsResponse> {
        const filters: CurrentlyStudyingStudentsFilters = {
            paginate: 'off'
        };

        if (search) {
            filters.search = search;
        }

        return this.getCurrentlyStudyingStudents(tenantId, filters, token!);
    }

    /**
     * Search currently studying students by name, national code, or student code
     * @param tenantId - The ID of the tenant to get students for
     * @param searchTerm - Search term to filter students
     * @param perPage - Number of students per page (default: 15)
     * @param token - Authentication token
     * @returns Promise with filtered currently studying students
     */
    static async searchCurrentlyStudyingStudents(
        tenantId: number,
        searchTerm: string,
        perPage: number = 15,
        token: string
    ): Promise<CurrentlyStudyingStudentsResponse> {
        const filters: CurrentlyStudyingStudentsFilters = {
            search: searchTerm,
            per_page: perPage
        };

        return this.getCurrentlyStudyingStudents(tenantId, filters, token);
    }

    /**
     * Get currently studying students with custom pagination
     * @param tenantId - The ID of the tenant to get students for
     * @param perPage - Number of students per page
     * @param token - Authentication token
     * @returns Promise with paginated currently studying students
     */
    static async getCurrentlyStudyingStudentsWithPagination(
        tenantId: number,
        perPage: number,
        token: string
    ): Promise<CurrentlyStudyingStudentsResponse> {
        const filters: CurrentlyStudyingStudentsFilters = {
            per_page: perPage
        };

        return this.getCurrentlyStudyingStudents(tenantId, filters, token);
    }
}

/*
USAGE EXAMPLES:

// 1. Basic usage - get currently studying students with default pagination
const students = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudents(1, {}, token);

// 2. Get all students without pagination
const allStudents = await CurrentlyStudyingStudentsService.getAllCurrentlyStudyingStudents(1, undefined, token);

// 3. Search for students
const searchResults = await CurrentlyStudyingStudentsService.searchCurrentlyStudyingStudents(1, 'احمد', 20, token);

// 4. Custom pagination
const paginatedStudents = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudentsWithPagination(1, 25, token);

// 5. Advanced filtering
const filteredStudents = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudents(1, {
  per_page: 30,
  search: 'محمدی',
  paginate: 'on'
}, token);

// React Hook Example:
import { useState, useEffect } from 'react';
import { CurrentlyStudyingStudentsService } from '@/lib/services/currently-studying-students.service';

const useCurrentlyStudyingStudents = (tenantId: number, token: string) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStudents = async (search = '', perPage = 15) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await CurrentlyStudyingStudentsService.getCurrentlyStudyingStudents(
        tenantId,
        { search, per_page: perPage },
        token
      );
      setStudents(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [tenantId]);

  return { students, loading, error, fetchStudents };
};
*/ 