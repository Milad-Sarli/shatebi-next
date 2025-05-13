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
            let errorDetails = 'Error fetching applicants list';
            try {
                const error = await response.json();
                errorDetails = error.message || errorDetails;
            } catch (e) {
                errorDetails = response.statusText || errorDetails;
            }
            throw new Error(errorDetails);
        }

        const backendResponse: any = await response.json();
        console.log('Received backend response for applicants:', backendResponse);

        let paginatorObject: any;

        // Scenario 1: Backend response matches { some_outer_key: '...', data: PAGINATOR_OBJECT }
        if (backendResponse && typeof backendResponse.data === 'object' && backendResponse.data !== null && typeof backendResponse.data.current_page !== 'undefined') {
            paginatorObject = backendResponse.data;
        }
        // Scenario 2: Backend response IS the PAGINATOR_OBJECT directly
        else if (backendResponse && typeof backendResponse.current_page !== 'undefined') {
            paginatorObject = backendResponse;
        }
        // Scenario 3: Backend response is a simple array (handle as non-paginated data)
        else if (Array.isArray(backendResponse)) {
            console.warn('Backend returned a simple array for applicants. Pagination will be mocked. Please update backend to return a paginated response.');
            paginatorObject = {
                data: backendResponse as Applicant[],
                current_page: 1,
                from: 1,
                last_page: 1,
                path: queryParams.toString(), // Or some default path
                per_page: backendResponse.length,
                to: backendResponse.length,
                total: backendResponse.length,
                first_page_url: null,
                last_page_url: null,
                prev_page_url: null,
                next_page_url: null,
            };
        }
        else {
            console.error('Unexpected backend response structure. Could not identify paginator object or a simple array:', backendResponse);
            throw new Error('Invalid response structure from server for applicants list.');
        }

        // This check is now more about ensuring the identified/mocked paginatorObject is usable
        if (!paginatorObject || !Array.isArray(paginatorObject.data) || typeof paginatorObject.current_page === 'undefined') {
            console.error('Identified/mocked paginator object is malformed or missing essential fields:', paginatorObject);
            throw new Error('Paginator data (real or mocked) is malformed or incomplete.');
        }

        return {
            data: paginatorObject.data as Applicant[],
            links: {
                first: paginatorObject.first_page_url || null,
                last: paginatorObject.last_page_url || null,
                prev: paginatorObject.prev_page_url || null,
                next: paginatorObject.next_page_url || null,
            },
            meta: {
                current_page: paginatorObject.current_page,
                from: paginatorObject.from,
                last_page: paginatorObject.last_page,
                path: paginatorObject.path,
                per_page: paginatorObject.per_page,
                to: paginatorObject.to,
                total: paginatorObject.total,
            }
        };
    }

    static async createApplicant(applicantData: Partial<Applicant> | FormData, token: string): Promise<{ data: Applicant }> {
        let headers: Record<string, string> = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        };
        let body: BodyInit;
        if (applicantData instanceof FormData) {
            body = applicantData;
            // Do not set Content-Type for FormData; browser will set it
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify(applicantData);
        }
        const response = await fetch(`${API_URL}/api/applicants`, {
            method: 'POST',
            headers,
            body
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