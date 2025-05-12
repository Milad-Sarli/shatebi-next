import { AppRole } from "@/lib/types";

export type { AppRole };

export interface AppRoleFilters {
    page?: number;
    per_page?: number;
    search?: string;
}

export interface AppRoleResponse {
    data: AppRole[];
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
}

export interface SingleAppRoleResponse {
    data: AppRole;
}

export interface RoleAssignmentResponse {
    message: string;
}

export interface AppRoleCreateData {
    name: string;
    user_id: number;
    description?: string;
}

export interface AppRoleUpdateData {
    name?: string;
    user_id?: number;
    description?: string;
}

export interface RoleAssignmentData {
    user_id: number;
    role_id: number;
}

export class AppRoleService {
    static async getAppRoles(filters: AppRoleFilters, token: string): Promise<AppRoleResponse> {
        const queryParams = new URLSearchParams();
        if (filters.page) queryParams.append("page", filters.page.toString());
        if (filters.per_page) queryParams.append("per_page", filters.per_page.toString());
        if (filters.search) queryParams.append("search", filters.search);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles?${queryParams}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch app roles");
        }

        return response.json();
    }

    static async getAppRole(id: number, token: string): Promise<SingleAppRoleResponse> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch app role");
        }

        return response.json();
    }

    static async createAppRole(data: AppRoleCreateData, token: string): Promise<SingleAppRoleResponse> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create app role");
        }

        return response.json();
    }

    static async updateAppRole(id: number, data: AppRoleUpdateData, token: string): Promise<SingleAppRoleResponse> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles/${id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update app role");
        }

        return response.json();
    }

    static async deleteAppRole(id: number, token: string): Promise<void> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete app role");
        }
    }

    static async assignRole(data: RoleAssignmentData, token: string): Promise<RoleAssignmentResponse> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles/assign`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to assign role");
        }

        return response.json();
    }

    static async removeRole(data: RoleAssignmentData, token: string): Promise<RoleAssignmentResponse> {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/app-roles/${data.role_id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to remove role");
        }

        return response.json();
    }

    static async hasMasterRole(userId: number, token: string): Promise<boolean> {
        try {
            const response = await this.getAppRoles({}, token);
            const userRoles = response.data.filter(role => role.user_id === userId);
            return userRoles.some(role => role.name.toLowerCase() === 'master');
        } catch (error) {
            console.error('Error checking master role:', error);
            return false;
        }
    }
} 