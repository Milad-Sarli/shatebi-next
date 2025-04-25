import { Permission } from "@/lib/types";

export type { Permission };

export interface PermissionFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface PermissionResponse {
  permissions: Permission[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export class PermissionService {
  static async getPermissions(filters: PermissionFilters, token: string): Promise<PermissionResponse> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.per_page) queryParams.append("per_page", filters.per_page.toString());
    if (filters.search) queryParams.append("search", filters.search);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch permissions");
    }

    return response.json();
  }

  static async getPermission(id: number, token: string): Promise<{ permission: Permission }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch permission");
    }

    return response.json();
  }

  static async createPermission(data: { name: string }, token: string): Promise<{ permission: Permission }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create permission");
    }

    return response.json();
  }

  static async updatePermission(id: number, data: { name: string }, token: string): Promise<{ permission: Permission }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update permission");
    }

    return response.json();
  }

  static async deletePermission(id: number, token: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete permission");
    }
  }
} 