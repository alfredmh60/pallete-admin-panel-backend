export interface IAdmin {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  roleId: number | null;
  isActive: boolean;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}


export interface IAdminWithRole extends Omit<IAdmin, 'roleId'> {
  roleId: number | null;
  roleName?: string;
}

export interface IAdminResponse {
  data: IAdminWithRole[];
  total: number;
}

export interface IAdminCreateResponse extends IAdminWithRole {}

export interface IAdminUpdateResponse {
  message: string;
}

export interface IAdminToggleActiveResponse {
  isActive: boolean;
}