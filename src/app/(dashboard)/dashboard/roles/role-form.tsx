"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RoleService } from "@/lib/services/role.service";
import { PermissionService } from "@/lib/services/permission.service";
import { Role, Permission } from "@/lib/types";
import { useAuth } from "@/lib/context/auth.context";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permissions: z.array(z.number()).min(1, "At least one permission is required"),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormProps {
  role?: Role;
  onSuccess?: () => void;
}

export function RoleForm({ role, onSuccess }: RoleFormProps) {
  const { accessToken } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || "",
      permissions: role?.permissions?.map(p => p.id) || [],
    },
  });

  const selectedPermissions = watch("permissions");

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!accessToken) return;
      
      try {
        setIsLoadingPermissions(true);
        const response = await PermissionService.getPermissions({}, accessToken);
        setPermissions(response.permissions || []);
      } catch (error) {
        toast.error("Failed to load permissions");
        console.error(error);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchPermissions();
  }, [accessToken]);

  const onSubmit = async (data: RoleFormData) => {
    if (!accessToken) return;
    
    try {
      setIsLoading(true);
      if (role) {
        await RoleService.updateRole(role.id, data, accessToken);
        toast.success("Role updated successfully");
      } else {
        await RoleService.createRole(data, accessToken);
        toast.success("Role created successfully");
      }
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to save role");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const currentPermissions = selectedPermissions || [];
    if (checked) {
      setValue("permissions", [...currentPermissions, permissionId]);
    } else {
      setValue(
        "permissions",
        currentPermissions.filter((p) => p !== permissionId)
      );
    }
  };

  if (isLoadingPermissions) {
    return <div className="text-center py-4">Loading permissions...</div>;
  }

  if (!permissions || permissions.length === 0) {
    return <div className="text-center py-4 text-red-500">No permissions available</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Role Name</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Enter role name"
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label>Permissions</Label>
        <div className="space-y-2">
          {permissions.map((permission) => (
            <div key={permission.id} className="flex items-center space-x-2">
              <Checkbox
                id={permission.id.toString()}
                checked={selectedPermissions?.includes(permission.id)}
                onCheckedChange={(checked) =>
                  handlePermissionChange(permission.id, checked as boolean)
                }
              />
              <Label htmlFor={permission.id.toString()}>{permission.name}</Label>
            </div>
          ))}
        </div>
        {errors.permissions && (
          <p className="text-sm text-red-500">{errors.permissions.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : role ? "Update Role" : "Create Role"}
      </Button>
    </form>
  );
} 