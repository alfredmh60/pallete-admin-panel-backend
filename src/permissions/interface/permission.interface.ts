export interface IPermission {
  id: number;
  name: string;
  description: string | null;
  category: string;
  createdAt: Date;
}

export interface IPermissionResponse extends IPermission {
  roleCount: number;
}

export interface IPermissionWithRoles extends IPermissionResponse {
  roles: {
    id: number;
    name: string;
    description: string | null;
    adminCount: number;
  }[];
}

export interface IPermissionUsageStats {
  totalPermissions: number;
  totalAssignments: number;
  usageStats: {
    id: number;
    name: string;
    category: string;
    roleCount: number;
  }[];
}

export interface IPermissionCategory {
  [category: string]: IPermission[];
}