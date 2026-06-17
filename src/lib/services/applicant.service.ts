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
    created_at?: string;
    updated_at?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
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
            } catch (_e) { // eslint-disable-line @typescript-eslint/no-unused-vars
                errorDetails = response.statusText || errorDetails;
            }
            throw new Error(errorDetails);
        }

        const backendResponse: unknown = await response.json();
        console.log('Received backend response for applicants:', backendResponse);

        // Define a more specific type for what we expect from backendResponse or its .data property
        type ExpectedPaginatorData = {
            data?: Applicant[];
            current_page?: unknown;
            first_page_url?: unknown;
            last_page_url?: unknown;
            prev_page_url?: unknown;
            next_page_url?: unknown;
            from?: unknown;
            last_page?: unknown;
            path?: unknown;
            per_page?: unknown;
            to?: unknown;
            total?: unknown;
        };

        let paginatorObject: ExpectedPaginatorData | null = null;

        // Check if backendResponse itself is the paginator or if it's nested under '.data'
        const brAsRecord = backendResponse as Record<string, unknown>;

        if (brAsRecord && typeof brAsRecord.data === 'object' && brAsRecord.data !== null && typeof (brAsRecord.data as Record<string, unknown>).current_page !== 'undefined') {
            paginatorObject = brAsRecord.data as ExpectedPaginatorData;
        }
        else if (brAsRecord && typeof brAsRecord.current_page !== 'undefined') {
            paginatorObject = brAsRecord as ExpectedPaginatorData;
        }
        else if (Array.isArray(backendResponse)) {
            console.warn('Backend returned a simple array for applicants. Pagination will be mocked. Please update backend to return a paginated response.');
            paginatorObject = {
                data: backendResponse as Applicant[],
                current_page: 1,
                from: 1,
                last_page: 1,
                path: queryParams.toString(),
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

        if (!paginatorObject || !Array.isArray(paginatorObject.data) || typeof paginatorObject.current_page !== 'number') {
            if (paginatorObject && typeof paginatorObject.current_page !== 'undefined' && paginatorObject.current_page !== null) {
                paginatorObject.current_page = Number(paginatorObject.current_page);
                if (isNaN(paginatorObject.current_page as number)) {
                    console.error('Paginator current_page is not a valid number:', paginatorObject.current_page);
                    throw new Error('Paginator data (real or mocked) current_page is malformed.');
                }
            } else {
                console.error('Identified/mocked paginator object is malformed or missing essential fields (current_page, data array):', paginatorObject);
                throw new Error('Paginator data (real or mocked) is malformed or incomplete.');
            }
        }

        return {
            data: paginatorObject.data as Applicant[],
            links: {
                first: (paginatorObject.first_page_url as string | null) || null,
                last: (paginatorObject.last_page_url as string | null) || null,
                prev: (paginatorObject.prev_page_url as string | null) || null,
                next: (paginatorObject.next_page_url as string | null) || null,
            },
            meta: {
                current_page: paginatorObject.current_page as number,
                from: Number(paginatorObject.from) || 0,
                last_page: Number(paginatorObject.last_page) || 0,
                path: String(paginatorObject.path) || '',
                per_page: Number(paginatorObject.per_page) || 0,
                to: Number(paginatorObject.to) || 0,
                total: Number(paginatorObject.total) || 0,
            }
        };
    }

    static async createApplicant(applicantData: Partial<Applicant> | FormData): Promise<{ data: Applicant }> {
        // eslint-disable-next-line prefer-const
        let headers: Record<string, string> = {
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

    static async exportExcel(token: string, ids?: number[]): Promise<Blob> {
        const params = new URLSearchParams();
        if (ids && ids.length > 0) {
            params.append('ids', ids.join(','));
        }
        const query = params.toString();
        const response = await fetch(`${API_URL}/api/applicants/export${query ? '?' + query : ''}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Error exporting applicants' }));
            throw new Error(error.message || 'Error exporting applicants');
        }

        return response.blob();
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