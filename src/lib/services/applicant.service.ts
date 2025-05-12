import { API_URL } from '@/lib/constants';

export interface Applicant {
    id: number;
    Fname: string;
    Lname: string;
    FatherName: string;
    Aks?: string;
    Mellicode?: string;
    Birthday?: string;
    Phone?: string;
    TelPhone?: string;
    Ostan: string;
    City: string;
    Vilage?: string;
    Adress?: string;
    Degree?: string;
    Referer?: string;
    Health?: string;
    Description?: string;
    status: number;
    tenant_id: number;
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

export interface ApplicantFilters {
    search?: string;
    with?: string;
    page?: number;
    per_page?: number;
    tenant_id?: number;
    status?: number;
}

export class ApplicantService {
    static async getApplicants(filters: ApplicantFilters = {}, token: string): Promise<PaginatedResponse<Applicant>> {
        const queryParams = new URLSearchParams();

        if (filters.search) queryParams.append('search', filters.search);
        if (filters.with) queryParams.append('with', filters.with);
        if (filters.page) queryParams.append('page', filters.page.toString());
        if (filters.per_page) queryParams.append('per_page', filters.per_page.toString());
        if (filters.tenant_id) queryParams.append('tenant_id', filters.tenant_id.toString());
        if (filters.status !== undefined) queryParams.append('status', filters.status.toString());

        const response = await fetch(`${API_URL}/api/applicants?${queryParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error fetching applicants list');
        }

        return response.json();
    }

    static async createApplicant(applicantData: Partial<Applicant>, token: string): Promise<{ data: Applicant }> {
        const response = await fetch(`${API_URL}/api/applicants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(applicantData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creating applicant');
        }

        return response.json();
    }

    static async getApplicant(id: number, token: string): Promise<{ data: Applicant }> {
        const response = await fetch(`${API_URL}/api/applicants/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error fetching applicant');
        }

        return response.json();
    }

    static async updateApplicant(id: number, applicantData: Partial<Applicant>, token: string): Promise<{ data: Applicant }> {
        const response = await fetch(`${API_URL}/api/applicants/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(applicantData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error updating applicant');
        }

        return response.json();
    }

    static async deleteApplicant(id: number, token: string): Promise<{ message: string }> {
        const response = await fetch(`${API_URL}/api/applicants/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error deleting applicant');
        }

        return response.json();
    }
} 