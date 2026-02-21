import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { PermissionsService } from '../permissions.service';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Role } from '../../entities/role.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let permissionRepository: Repository<Permission>;

  const mockPermission = {
    id: 1,
    name: 'view_admins',
    description: 'Can view admins list',
    category: 'admins',
    createdAt: new Date(),
    rolePermissions: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getRepositoryToken(Permission),
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPermission),
            find: jest.fn().mockResolvedValue([mockPermission]),
            create: jest.fn().mockReturnValue(mockPermission),
            save: jest.fn().mockResolvedValue(mockPermission),
            update: jest.fn().mockResolvedValue({ affected: 1 }),
            delete: jest.fn().mockResolvedValue({ affected: 1 }),
            count: jest.fn().mockResolvedValue(10),
            createQueryBuilder: jest.fn(() => ({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              addOrderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getManyAndCount: jest.fn().mockResolvedValue([[mockPermission], 1]),
              leftJoin: jest.fn().mockReturnThis(),
              select: jest.fn().mockReturnThis(),
              addSelect: jest.fn().mockReturnThis(),
              groupBy: jest.fn().mockReturnThis(),
              getRawMany: jest.fn().mockResolvedValue([]),
            })),
          },
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            count: jest.fn().mockResolvedValue(5),
          },
        },
        {
          provide: getRepositoryToken(Role),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    permissionRepository = module.get<Repository<Permission>>(getRepositoryToken(Permission));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of permissions', async () => {
      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by search term', async () => {
      const spy = jest.spyOn(permissionRepository, 'createQueryBuilder');
      await service.findAll({ search: 'view' });
      expect(spy).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      const spy = jest.spyOn(permissionRepository, 'createQueryBuilder');
      await service.findAll({ category: 'admins' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single permission', async () => {
      const result = await service.findOne(1, {});
      expect(result.id).toBe(1);
      expect(result.name).toBe('view_admins');
    });

    it('should throw NotFoundException if permission not found', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(null);
      await expect(service.findOne(999, {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new permission', async () => {
      const createDto = {
        name: 'create_admin',
        description: 'Can create new admins',
        category: 'admins',
      };
      const result = await service.create(createDto);
      expect(result).toBeDefined();
      expect(result.name).toBe('view_admins');
    });

    it('should throw ConflictException if permission name exists', async () => {
      jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce(mockPermission);
      const createDto = {
        name: 'view_admins',
        description: 'Duplicate permission',
      };
      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a permission', async () => {
      const updateDto = {
        name: 'view_all_admins',
      };
      const result = await service.update(1, updateDto);
      expect(result).toBeDefined();
    });
  });

  // describe('remove', () => {
  //   it('should delete a permission', async () => {
  //     const result = await service.remove(1);
  //     expect(result.message).toBeDefined();
  //   });

  //   it('should throw BadRequestException if permission is assigned to roles', async () => {
  //     jest.spyOn(permissionRepository, 'findOne').mockResolvedValueOnce({
  //       ...mockPermission,
  //       rolePermissions: [{ id: 1 }],
  //     });
  //     await expect(service.remove(1)).rejects.toThrow('این مجوز به نقش‌هایی اختصاص دارد');
  //   });
  // });

  describe('getPermissionUsageStats', () => {
    it('should return usage statistics', async () => {
      const result = await service.getPermissionUsageStats();
      expect(result.totalPermissions).toBe(10);
      expect(result.totalAssignments).toBe(5);
    });
  });

  // describe('getPermissionsByCategory', () => {
  //   it('should group permissions by category', async () => {
  //     const result = await service.getPermissionsByCategory();
  //     expect(result).toBeDefined();
  //   });
  // });
});