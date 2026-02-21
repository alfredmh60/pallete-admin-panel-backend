import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';

import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Admins } from '../entities/admin.entity';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { IRoleResponse, IRoleWithPermissions } from './interface/role.interface';


@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
  ) {}

  async findAll(query: any): Promise<{ data: IRoleResponse[]; total: number }> {
    const { search, limit = 100, offset = 0 } = query;

    const queryBuilder = this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission')
      .leftJoinAndSelect('role.admins', 'admins');

    if (search) {
      queryBuilder.where(
        '(role.name ILIKE :search OR role.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder.orderBy('role.createdAt', 'DESC');
    queryBuilder.skip(offset).take(limit);

    const [roles, total] = await queryBuilder.getManyAndCount();

    const data = roles.map((role) => this.mapToResponse(role));
    return { data, total };
  }

  async findOne(id: number, query: any): Promise<IRoleWithPermissions> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: [
        'rolePermissions',
        'rolePermissions.permission',
        'admins',
      ],
    });

    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    return this.mapToDetailResponse(role);
  }

  async create(createRoleDto: CreateRoleDto, creatorId: number): Promise<IRoleResponse> {
    const { name, description, permissionIds = [] } = createRoleDto;

    // بررسی تکراری نبودن نام نقش
    const existingRole = await this.roleRepository.findOne({
      where: { name },
    });
    if (existingRole) {
      throw new ConflictException('نقشی با این نام قبلاً ثبت شده است');
    }

    // ایجاد نقش جدید
    const role = this.roleRepository.create({
      name,
      description,
      createdBy: creatorId,
    });

    const savedRole = await this.roleRepository.save(role);

    // تخصیص مجوزها (اگر وجود داشته باشند)
    if (permissionIds.length > 0) {
      await this.assignPermissions(savedRole.id, permissionIds);
    }

    // بازگشت نقش با مجوزها
    return this.findOne(savedRole.id, {});
  }

  async update(id: number, updateRoleDto: UpdateRoleDto): Promise<IRoleResponse> {
    const role = await this.roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    const { name, description, permissionIds } = updateRoleDto;

    // بررسی تکراری نبودن نام (اگر نام تغییر کرده باشد)
    if (name && name !== role.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name },
      });
      if (existingRole) {
        throw new ConflictException('نقشی با این نام قبلاً ثبت شده است');
      }
    }

    // بروزرسانی اطلاعات نقش
    const updateData: Partial<Role> = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await this.roleRepository.update(id, updateData);

    // بروزرسانی مجوزها (اگر ارسال شده باشند)
    if (permissionIds) {
      await this.assignPermissions(id, permissionIds);
    }

    return this.findOne(id, {});
  }

  async remove(id: number): Promise<{ message: string }> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['admins'],
    });

    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    // بررسی اینکه آیا ادمینی با این نقش وجود دارد
    if (role.admins && role.admins.length > 0) {
      throw new BadRequestException(
        'این نقش به ادمین‌هایی اختصاص دارد و قابل حذف نیست',
      );
    }

    // حذف ارتباط‌های نقش با مجوزها
    await this.rolePermissionRepository.delete({ roleId: id });

    // حذف نقش
    await this.roleRepository.delete(id);

    return { message: 'نقش با موفقیت حذف شد' };
  }

  // ========== مدیریت مجوزهای نقش ==========

  // async getRolePermissions(roleId: number): Promise<Permission[]> {
  //   const rolePermissions = await this.rolePermissionRepository.find({
  //     where: { roleId },
  //     relations: ['permission'],
  //   });

  //   return rolePermissions.map((rp) => rp.permission);
  // }

  async assignPermissions(roleId: number, permissionIds: number[]): Promise<{ message: string }> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    // بررسی وجود مجوزها
    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException('بعضی از مجوزها معتبر نیستند');
    }

    // حذف مجوزهای قبلی
    await this.rolePermissionRepository.delete({ roleId });

    // اضافه کردن مجوزهای جدید
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map((permissionId) =>
        this.rolePermissionRepository.create({
          roleId,
          permissionId,
        }),
      );
      await this.rolePermissionRepository.save(rolePermissions);
    }

    return { message: 'مجوزها با موفقیت به نقش اختصاص یافتند' };
  }

  async removePermission(roleId: number, permissionId: number): Promise<{ message: string }> {
    const rolePermission = await this.rolePermissionRepository.findOne({
      where: { roleId, permissionId },
    });

    if (!rolePermission) {
      throw new NotFoundException('این مجوز به نقش اختصاص داده نشده است');
    }

    await this.rolePermissionRepository.delete({ roleId, permissionId });

    return { message: 'مجوز با موفقیت از نقش حذف شد' };
  }

  // ========== آمار نقش‌ها ==========

  async getRoleStats(): Promise<any> {
    const totalRoles = await this.roleRepository.count();

    const rolesWithAdmins = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoin('role.admins', 'admins')
      .select('role.id', 'id')
      .addSelect('role.name', 'name')
      .addSelect('COUNT(admins.id)', 'adminCount')
      .groupBy('role.id')
      .orderBy('adminCount', 'DESC')
      .getRawMany();

    return {
      totalRoles,
      rolesWithAdmins,
    };
  }

  // ========== توابع کمکی ==========

  private mapToResponse(role: any): IRoleResponse {
    const permissions = role.rolePermissions?.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
    })) || [];

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdBy: role.createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions,
      adminCount: role.admins?.length || 0,
    };
  }

  private mapToDetailResponse(role: any): IRoleWithPermissions {
    const permissions = role.rolePermissions?.map((rp) => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      createdAt: rp.permission.createdAt,
    })) || [];

    const admins = role.admins?.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      isActive: admin.isActive,
    })) || [];

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdBy: role.createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions,
      admins,
      adminCount: admins.length,
    };
  }
}