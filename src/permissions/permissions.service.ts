import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, Like } from 'typeorm';

import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Role } from '../entities/role.entity';

import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IPermissionResponse, IPermissionWithRoles } from './interface/permission.interface';


@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findAll(query: any): Promise<{ data: IPermissionResponse[]; total: number }> {
    const { search, category, limit = 100, offset = 0 } = query;

    const queryBuilder = this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.role', 'role');

    if (search) {
      queryBuilder.where(
        '(permission.name ILIKE :search OR permission.description ILIKE :search OR permission.category ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('permission.category = :category', { category });
    }

    queryBuilder.orderBy('permission.category', 'ASC')
      .addOrderBy('permission.name', 'ASC');

    queryBuilder.skip(offset).take(limit);

    const [permissions, total] = await queryBuilder.getManyAndCount();

    const data = permissions.map((permission) => this.mapToResponse(permission));
    return { data, total };
  }


  async findOne(id: number, query: any): Promise<IPermissionWithRoles> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: [
        'rolePermissions',
        'rolePermissions.role',
        'rolePermissions.role.admins',
      ],
    });

    if (!permission) {
      throw new NotFoundException('مجوز مورد نظر یافت نشد');
    }

    return this.mapToDetailResponse(permission);
  }
 

  async create(createPermissionDto: CreatePermissionDto): Promise<IPermissionResponse> {
    const { name, description, category } = createPermissionDto;

    // بررسی تکراری نبودن نام مجوز
    const existingPermission = await this.permissionRepository.findOne({
      where: { name },
    });
    if (existingPermission) {
      throw new ConflictException('مجوزی با این نام قبلاً ثبت شده است');
    }

    // ایجاد مجوز جدید
    const permission = this.permissionRepository.create({
      name,
      description,
      category: category || 'general',
    });

    const savedPermission = await this.permissionRepository.save(permission);

    return this.mapToResponse(savedPermission);
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<IPermissionResponse> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('مجوز مورد نظر یافت نشد');
    }

    const { name, description, category } = updatePermissionDto;

    // بررسی تکراری نبودن نام (اگر نام تغییر کرده باشد)
    if (name && name !== permission.name) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { name },
      });
      if (existingPermission) {
        throw new ConflictException('مجوزی با این نام قبلاً ثبت شده است');
      }
    }

    // بروزرسانی اطلاعات مجوز
    const updateData: Partial<Permission> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;

    await this.permissionRepository.update(id, updateData);

    return this.findOne(id, {});
  }

  async remove(id: number): Promise<{ message: string }> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['rolePermissions'],
    });

    if (!permission) {
      throw new NotFoundException('مجوز مورد نظر یافت نشد');
    }

    // بررسی اینکه آیا مجوز به نقشی اختصاص دارد
    if (permission.rolePermissions && permission.rolePermissions.length > 0) {
      throw new BadRequestException(
        'این مجوز به نقش‌هایی اختصاص دارد و قابل حذف نیست',
      );
    }

    await this.permissionRepository.delete(id);

    return { message: 'مجوز با موفقیت حذف شد' };
  }

  // ========== آمار و گزارشات ==========

  async getPermissionUsageStats(): Promise<any> {
    // تعداد نقش‌هایی که از هر مجوز استفاده می‌کنند
    const usageStats = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.rolePermissions', 'rolePermissions')
      .select('permission.id', 'id')
      .addSelect('permission.name', 'name')
      .addSelect('permission.category', 'category')
      .addSelect('COUNT(rolePermissions.roleId)', 'roleCount')
      .groupBy('permission.id')
      .orderBy('roleCount', 'DESC')
      .getRawMany();

    // مجموع آمار
    const totalPermissions = await this.permissionRepository.count();
    const totalAssignments = await this.rolePermissionRepository.count();

    return {
      totalPermissions,
      totalAssignments,
      usageStats,
    };
  }

  async getUnusedPermissions(): Promise<Permission[]> {
    // مجوزهایی که به هیچ نقشی اختصاص ندارند
    const unusedPermissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoin('permission.rolePermissions', 'rolePermissions')
      .where('rolePermissions.roleId IS NULL')
      .getMany();

    return unusedPermissions;
  }

  async getPermissionsByCategory(): Promise<Record<string, Permission[]>> {
    const permissions = await this.permissionRepository.find({
      order: {
        category: 'ASC',
        name: 'ASC',
      },
    });

    // گروه‌بندی بر اساس دسته‌بندی
    const grouped = permissions.reduce((acc, permission) => {
      const category = permission.category || 'سایر';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    return grouped;
  }

  // ========== توابع کمکی ==========

  private mapToResponse(permission: any): IPermissionResponse {
    const roleCount = permission.rolePermissions?.length || 0;

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category || 'general',
      createdAt: permission.createdAt,
      roleCount,
    };
  }

  private mapToDetailResponse(permission: any): IPermissionWithRoles {
    const roles = permission.rolePermissions?.map((rp) => ({
      id: rp.role.id,
      name: rp.role.name,
      description: rp.role.description,
      adminCount: rp.role.admins?.length || 0,
    })) || [];

    return {
      id: permission.id,
      name: permission.name,
      description: permission.description,
      category: permission.category || 'general',
      createdAt: permission.createdAt,
      roles,
      roleCount: roles.length,
    };
  }
}