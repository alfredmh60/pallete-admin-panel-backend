export interface IRole {
  id: number;
  name: string;
  description: string | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermission {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

export interface IRoleResponse extends IRole {
  permissions: IPermission[];
  adminCount: number;
}

export interface IRoleWithPermissions extends IRoleResponse {
  admins: {
    id: number;
    email: string;
    name: string | null;
    isActive: boolean;
  }[];
}

export interface IRoleStats {
  totalRoles: number;
  rolesWithAdmins: {
    id: number;
    name: string;
    adminCount: number;
  }[];
}