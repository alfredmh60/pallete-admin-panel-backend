import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { RolesService } from '../roles.service';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';
import { Admins } from '../../entities/admin.entity';

// describe('RolesService', () => {
//   let service: RolesService;
//   let roleRepository: Repository<Role>;

//   const mockRole = {
//     id: 1,
//     name: 'admin',
//     description: 'Administrator role',
//     createdBy: 1,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//     rolePermissions: [],
//     admins: [],
//   };

//   const mockPermission = {
//     id: 1,
//     name: 'view_admins',
//     description: 'Can view admins',
//     createdAt: new Date(),
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         RolesService,
//         {
//           provide: getRepositoryToken(Role),
//           useValue: {
//             findOne: jest.fn().mockResolvedValue(mockRole),
//             find: jest.fn().mockResolvedValue([mockRole]),
//             create: jest.fn().mockReturnValue(mockRole),
//             save: jest.fn().mockResolvedValue(mockRole),
//             update: jest.fn().mockResolvedValue({ affected: 1 }),
//             delete: jest.fn().mockResolvedValue({ affected: 1 }),
//             count: jest.fn().mockResolvedValue(5),
//             createQueryBuilder: jest.fn(() => ({
//               leftJoinAndSelect: jest.fn().mockReturnThis(),
//               where: jest.fn().mockReturnThis(),
//               orderBy: jest.fn().mockReturnThis(),
//               skip: jest.fn().mockReturnThis(),
//               take: jest.fn().mockReturnThis(),
//               getManyAndCount: jest.fn().mockResolvedValue([[mockRole], 1]),
//               leftJoin: jest.fn().mockReturnThis(),
//               select: jest.fn().mockReturnThis(),
//               addSelect: jest.fn().mockReturnThis(),
//               groupBy: jest.fn().mockReturnThis(),
//               getRawMany: jest.fn().mockResolvedValue([]),
//             })),
//           },
//         },
//         {
//           provide: getRepositoryToken(Permission),
//           useValue: {
//             find: jest.fn().mockResolvedValue([mockPermission]),
//           },
//         },
//         {
//           provide: getRepositoryToken(RolePermission),
//           useValue: {
//             find: jest.fn().mockResolvedValue([]),
//             delete: jest.fn().mockResolvedValue({ affected: 1 }),
//             create: jest.fn().mockReturnValue({}),
//             save: jest.fn().mockResolvedValue({}),
//           },
//         },
//         {
//           provide: getRepositoryToken(Admin),
//           useValue: {
//             find: jest.fn().mockResolvedValue([]),
//           },
//         },
//       ],
//     }).compile();

//     service = module.get<RolesService>(RolesService);
//     roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
//   });

//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });

//   describe('findAll', () => {
//     it('should return list of roles', async () => {
//       const result = await service.findAll({});
//       expect(result.data).toHaveLength(1);
//       expect(result.total).toBe(1);
//     });
//   });

//   describe('findOne', () => {
//     it('should return a single role', async () => {
//       const result = await service.findOne(1, {});
//       expect(result.id).toBe(1);
//       expect(result.name).toBe('admin');
//     });

//     it('should throw NotFoundException if role not found', async () => {
//       jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(null);
//       await expect(service.findOne(999, {})).rejects.toThrow(NotFoundException);
//     });
//   });

//   describe('create', () => {
//     it('should create a new role', async () => {
//       const createDto = {
//         name: 'new-role',
//         description: 'New role description',
//       };
//       const result = await service.create(createDto, 1);
//       expect(result).toBeDefined();
//       expect(result.name).toBe('admin');
//     });

//     it('should throw ConflictException if role name exists', async () => {
//       jest.spyOn(roleRepository, 'findOne').mockResolvedValueOnce(mockRole);
//       const createDto = {
//         name: 'admin',
//         description: 'Duplicate role',
//       };
//       await expect(service.create(createDto, 1)).rejects.toThrow(ConflictException);
//     });
//   });

//   describe('update', () => {
//     it('should update a role', async () => {
//       const updateDto = {
//         name: 'updated-role',
//       };
//       const result = await service.update(1, updateDto);
//       expect(result).toBeDefined();
//     });
//   });

//   describe('remove', () => {
//     it('should delete a role', async () => {
//       const result = await service.remove(1);
//       expect(result.message).toBeDefined();
//     });
//   });

//   describe('assignPermissions', () => {
//     it('should assign permissions to role', async () => {
//       const result = await service.assignPermissions(1, [1, 2, 3]);
//       expect(result.message).toBeDefined();
//     });
//   });
// });