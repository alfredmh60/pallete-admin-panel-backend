import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RolePermission } from '../../entities/role-permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // Manager همه دسترسی‌ها رو داره
    if (user?.role === 'manager') {
      return true;
    }

    // گرفتن مجوزهای نقش کاربر
    const rolePermissions = await this.rolePermissionRepository.find({
      where: { roleId: user?.roleId },
      relations: ['permission'],
    });

    const userPermissions = rolePermissions.map(rp => rp.permission.name);
    
    const hasAll = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAll) {
      throw new ForbiddenException('شما دسترسی لازم برای این عملیات را ندارید');
    }

    return true;
  }
}