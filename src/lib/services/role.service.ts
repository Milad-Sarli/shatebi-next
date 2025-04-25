import { Role, Permission } from "@/lib/types";

export type { Role };
export type { Permission };

export interface RoleFilters {
  page?: number;
  per_page?: number;
  search?: string;
}

export interface RoleResponse {
  roles: Role[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export class RoleService {
  static async getRoles(filters: RoleFilters, token: string): Promise<RoleResponse> {
    const queryParams = new URLSearchParams();
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.per_page) queryParams.append("per_page", filters.per_page.toString());
    if (filters.search) queryParams.append("search", filters.search);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch roles");
    }

    return response.json();
  }

  static async getRole(id: number, token: string): Promise<{ role: Role }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch role");
    }

    return response.json();
  }

  static async createRole(data: { name: string; permissions: number[] }, token: string): Promise<{ role: Role }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create role");
    }

    return response.json();
  }

  static async updateRole(id: number, data: { name: string; permissions: number[] }, token: string): Promise<{ role: Role }> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update role");
    }

    return response.json();
  }

  static async deleteRole(id: number, token: string): Promise<void> {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roles/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete role");
    }
  }
} 