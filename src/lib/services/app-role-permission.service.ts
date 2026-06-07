import { AppRole } from "@/lib/types";

export interface AppRolePermission {
    id: number;
    role_id: number;
    name: string;
    permission?: string;
    role?: AppRole;
}

export interface AppRolePermissionFilters {
    page?: number;
    per_page?: number;
    search?: string;
    role_id?: number;
}

export interface AppRolePermissionResponse {
    data: AppRolePermission[];
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

export interface CreateAppRolePermissionData {
    role_id: number;
    name: string;
}

export interface UpdateAppRolePermissionData {
    role_id?: number;
    permission?: string;
}

export class AppRolePermissionService {
    static async getAppRolePermissions(filters: AppRolePermissionFilters, token: string): Promise<AppRolePermissionResponse> {
        const queryParams = new URLSearchParams();
        if (filters.page) queryParams.append("page", filters.page.toString());
        if (filters.per_page) queryParams.append("per_page", filters.per_page.toString());
        if (filters.search) queryParams.append("search", filters.search);
        if (filters.role_id) queryParams.append("role_id", filters.role_id.toString());

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-role-permissions?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch role permissions");
        }

        return response.json();
    }

    static async getAppRolePermission(id: number, token: string): Promise<{ data: AppRolePermission }> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-role-permissions/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch role permission");
        }

        return response.json();
    }

    static async createAppRolePermission(data: CreateAppRolePermissionData, token: string): Promise<{ data: AppRolePermission }> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-role-permissions`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Failed to create role permission");
        }

        return response.json();
    }

    static async updateAppRolePermission(id: number, data: UpdateAppRolePermissionData, token: string): Promise<{ data: AppRolePermission }> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-role-permissions/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Failed to update role permission");
        }

        return response.json();
    }

    static async deleteAppRolePermission(id: number, token: string): Promise<void> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-role-permissions/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete role permission");
        }
    }
} 