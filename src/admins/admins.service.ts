import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { Admins } from '../entities/admins.entity';
 import { Role } from '../entities/role.entity';
 import { AdminDepartment } from '../entities/admin-department.entity';
 import { EmailService } from '../email/email.service';

 import { CreateAdminDto } from './dto/create-admin.dto';
 import { UpdateAdminDto } from './dto/update-admin.dto';
import { IAdminWithRole } from './interfaces/admin.interface';

@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admins)
    private adminRepository: Repository<Admins>,
     @InjectRepository(Role)
     private roleRepository: Repository<Role>,
     @InjectRepository(AdminDepartment)
     private adminDepartmentRepository: Repository<AdminDepartment>,
     private emailService: EmailService,
  ) {}

  async findAll(query: any, user: any): Promise<{ data: IAdminWithRole[]; total: number }> {
    const { roleId, is_active, search, limit = 100, offset = 0 } = query;

    const queryBuilder = this.adminRepository
      .createQueryBuilder('admins')
       .leftJoinAndSelect('admins.role', 'role')
      .where('admins.deletedAt IS NULL');

    // محدودیت بر اساس نقش کاربر
    // if (user.role === 'super_admin') {
    //   const managerRole = await this.roleRepository.findOne({
    //     where: { name: 'manager' },
    //   });
    //   if (managerRole) {
    //     queryBuilder.andWhere('admin.roleId != :managerId', {
    //       managerId: managerRole.id,
    //     });
    //   }
    // }

    // فیلتر بر اساس نقش
    // if (roleId) {
    //   queryBuilder.andWhere('admin.roleId = :roleId', { roleId });
    // }

    // فیلتر بر اساس وضعیت فعال
    if (is_active !== undefined) {
      queryBuilder.andWhere('admins.isActive = :isActive', {
        isActive: is_active === 'true',
      });
    }

    // جستجو در ایمیل یا نام
    if (search) {
      queryBuilder.andWhere(
        '(admins.email ILIKE :search OR admins.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // مرتب‌سازی
    queryBuilder.orderBy('admins.createdAt', 'DESC');

    // صفحه‌بندی
    queryBuilder.skip(offset).take(limit);

    const [admins, total] = await queryBuilder.getManyAndCount();

    // تبدیل به فرمت خروجی (حذف فیلدهای حساس)
    const data = admins.map((admin) => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      avatar: admin.avatar,
      roleId: admin.roleId,
      roleName: admin.role?.name,
      isActive: admin.isActive,
      createdBy: admin.createdBy,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      deletedAt: admin.deletedAt,

    }));

    return { data, total };
  }

  async findOne(id: number, query: any, user: any): Promise<IAdminWithRole> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!admin) {
      throw new NotFoundException('ادمین یافت نشد');
    }

    // بررسی دسترسی سوپرادمین
    if (user.role === 'super_admin' && admin.role?.name === 'manager') {
      throw new ForbiddenException('شما نمی‌توانید اطلاعات مدیر را مشاهده کنید');
    }

    // حذف فیلدهای حساس
    const { passwordHash, resetToken, resetTokenExpiry, ...result } = admin;
    return {
      ...result,
      roleName: admin.role?.name,
    };
  }

  async create(createAdminDto: CreateAdminDto, creatorId: number): Promise<IAdminWithRole> {
    const { email, roleId, name } = createAdminDto;

    // بررسی تکراری بودن ایمیل
    const existing = await this.adminRepository.findOne({
      where: { email },
      withDeleted: true, // حتی اگه soft delete شده باشه
    });
    if (existing) {
      throw new BadRequestException('این ایمیل قبلاً ثبت شده است');
    }

    // بررسی وجود نقش
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
    });
    if (!role) {
      throw new BadRequestException('نقفش انتخاب شده معتبر نیست');
    }

    // تولید رمز تصادفی
    const plainPassword = randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // ایجاد ادمین جدید
    const admin = this.adminRepository.create({
      email,
      name,
      passwordHash,
      roleId,
      createdBy: creatorId,
    });

    const savedAdmin = await this.adminRepository.save(admin);
const emailOptions = {  to: email, name: name || email, password: plainPassword };
    // ارسال ایمیل با رمز عبور
     await this.emailService.sendPasswordEmail(email, plainPassword,emailOptions);

    // بازگشت اطلاعات (بدون رمز)
    const { passwordHash: _, resetToken, resetTokenExpiry, ...result } = savedAdmin;
    
    return {
      ...result,
      roleName: role.name,
    };
  }

  async update(id: number, updateAdminDto: UpdateAdminDto, user: any): Promise<{ message: string }> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!admin) {
      throw new NotFoundException('ادمین یافت نشد');
    }

    // بررسی دسترسی سوپرادمین
    if (user.role === 'super_admin' && admin.role?.name === 'manager') {
      throw new ForbiddenException('شما نمی‌توانید مدیر را ویرایش کنید');
    }

    const updateData: Partial<Admins> = {};

    // بروزرسانی نام
    if (updateAdminDto.name !== undefined) {
      updateData.name = updateAdminDto.name;
    }

    // بروزرسانی ایمیل
    if (updateAdminDto.email !== undefined && updateAdminDto.email !== admin.email) {
      const existing = await this.adminRepository.findOne({
        where: { email: updateAdminDto.email },
      });
      if (existing) {
        throw new BadRequestException('این ایمیل قبلاً ثبت شده است');
      }
      updateData.email = updateAdminDto.email;
    }

    // بروزرسانی نقش
    if (updateAdminDto.roleId !== undefined && updateAdminDto.roleId !== admin.roleId) {
      // بررسی محدودیت سوپرادمین
      if (user.role === 'super_admin') {
        const newRole = await this.roleRepository.findOne({
          where: { id: updateAdminDto.roleId },
        });
        if (newRole?.name === 'manager') {
          throw new ForbiddenException('شما نمی‌توانید نقش مدیر را اختصاص دهید');
        }
      }
      updateData.roleId = updateAdminDto.roleId;
    }

    // بروزرسانی آواتار
    if (updateAdminDto.avatar !== undefined) {
      updateData.avatar = updateAdminDto.avatar;
    }

    // اعمال تغییرات
    if (Object.keys(updateData).length > 0) {
      await this.adminRepository.update(id, updateData);
    }

    return { message: 'اطلاعات ادمین با موفقیت بروزرسانی شد' };
  }

  async toggleActive(id: number, user: any): Promise<{ isActive: boolean }> {
    const admin = await this.adminRepository.findOne({
      where: { id },
      relations: ['role'],
    });
    if (!admin) {
      throw new NotFoundException('ادمین یافت نشد');
    }

    // بررسی دسترسی سوپرادمین
    if (user.role === 'super_admin' && admin.role?.name === 'manager') {
      throw new ForbiddenException('شما نمی‌توانید وضعیت مدیر را تغییر دهید');
    }

    const newStatus = !admin.isActive;
    await this.adminRepository.update(id, { isActive: newStatus });

    return { isActive: newStatus };
  }

  async remove(id: number): Promise<{ message: string }> {
    const admin = await this.adminRepository.findOne({
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException('ادمین یافت نشد');
    }

    // Soft delete
    await this.adminRepository.update(id, {
      deletedAt: new Date(),
    });

    return { message: 'ادمین با موفقیت حذف شد' };
  }

  //========== مدیریت دپارتمان‌های ادمین ==========

  async getAdminDepartments(adminId: number): Promise<number[]> {
    const adminDepts = await this.adminDepartmentRepository.find({
      where: { adminId },
    });
    return adminDepts.map((ad) => ad.departmentId);
  }

  async assignDepartments(adminId: number, departmentIds: number[]): Promise<{ message: string }> {
    const admin = await this.adminRepository.findOne({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('ادمین یافت نشد');
    }

    // حذف دپارتمان‌های قبلی
    await this.adminDepartmentRepository.delete({ adminId });

    // اضافه کردن دپارتمان‌های جدید
    if (departmentIds.length > 0) {
      const adminDepts = departmentIds.map((departmentId) =>
        this.adminDepartmentRepository.create({
          adminId,
          departmentId,
        }),
      );
      await this.adminDepartmentRepository.save(adminDepts);
    }

    return { message: 'دپارتمان‌ها با موفقیت به ادمین اختصاص یافتند' };
  }
}