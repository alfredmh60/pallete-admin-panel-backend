import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Admins } from '../../entities/admin.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { RolePermission } from '../../entities/role-permission.entity';

export class InitialSeed {
  async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🌱 شروع seeding...');

      // ========== 1. ایجاد مجوزها ==========
      console.log('ایجاد مجوزها...');
      const permissionRepository = queryRunner.manager.getRepository(Permission);
      
      const permissionsData = [
        // مدیریت ادمین‌ها
        { name: 'view_admins', description: 'مشاهده لیست ادمین‌ها', category: 'admins' },
        { name: 'create_admin', description: 'ایجاد ادمین جدید', category: 'admins' },
        { name: 'edit_admin', description: 'ویرایش ادمین', category: 'admins' },
        { name: 'toggle_admin', description: 'فعال/غیرفعال کردن ادمین', category: 'admins' },
        { name: 'delete_admin', description: 'حذف ادمین', category: 'admins' },
        
        // مدیریت نقش‌ها
        { name: 'manage_roles', description: 'مدیریت نقش‌ها و مجوزها', category: 'roles' },
        
        // مدیریت تخفیف‌ها
        { name: 'view_discounts', description: 'مشاهده تخفیف‌ها', category: 'discounts' },
        { name: 'manage_discounts', description: 'مدیریت تخفیف‌ها', category: 'discounts' },
        
        // مدیریت تیکت‌ها
        { name: 'view_tickets', description: 'مشاهده تیکت‌ها', category: 'tickets' },
        { name: 'reply_ticket', description: 'پاسخ به تیکت', category: 'tickets' },
        { name: 'close_ticket', description: 'بستن تیکت', category: 'tickets' },
        { name: 'assign_ticket', description: 'تخصیص تیکت', category: 'tickets' },
        
        // مدیریت مالی
        { name: 'view_finance', description: 'مشاهده امور مالی', category: 'finance' },
        { name: 'manage_finance', description: 'مدیریت امور مالی', category: 'finance' },
        
        // تیکت‌های مدیریتی
        { name: 'view_admin_tickets', description: 'مشاهده تیکت‌های مدیریتی', category: 'adminTickets' },
        { name: 'send_admin_ticket', description: 'ارسال تیکت مدیریتی', category: 'adminTickets' },
        { name: 'close_admin_ticket', description: 'بستن تیکت مدیریتی', category: 'adminTickets' },
        
        // لاگ‌ها
        { name: 'view_logs', description: 'مشاهده لاگ‌ها', category: 'logs' },
        { name: 'delete_logs', description: 'حذف لاگ‌ها', category: 'logs' },
      ];

      // روش صحیح: create با آرایه
      const permissions = permissionRepository.create(permissionsData);
      const savedPermissions = await permissionRepository.save(permissions);
      console.log(`${savedPermissions.length} مجوز ایجاد شد`);

      // ========== 2. ایجاد نقش‌ها ==========
      console.log('ایجاد نقش‌ها...');
      const roleRepository = queryRunner.manager.getRepository(Role);

      const rolesData = [
        { name: 'manager', description: 'مدیر کل - دسترسی کامل به همه بخش‌ها', createdBy: undefined },
        { name: 'super_admin', description: 'مدیر ارشد - دسترسی مدیریت ادمین‌ها', createdBy: undefined },
        { name: 'admin_finance', description: 'ادمین امور مالی', createdBy: undefined },
        { name: 'admin_support', description: 'ادمین پشتیبانی', createdBy: undefined },
      ];

      // روش صحیح: create با آرایه
      const roles = roleRepository.create(rolesData);
      const savedRoles = await roleRepository.save(roles);
      console.log(`${savedRoles.length} نقش ایجاد شد`);

      // ========== 3. تخصیص مجوزها به نقش‌ها ==========
      console.log('تخصیص مجوزها به نقش‌ها...');
      const rolePermissionRepository = queryRunner.manager.getRepository(RolePermission);

      const rolePermissionsData: Partial<RolePermission>[] = [];

      // MANAGER: همه مجوزها
      savedPermissions.forEach(permission => {
        rolePermissionsData.push({
          roleId: savedRoles[0].id, // manager
          permissionId: permission.id,
        });
      });

      // SUPER_ADMIN: مجوزهای مدیریتی
      const superAdminPerms = savedPermissions.filter(p => 
        ['view_admins', 'create_admin', 'edit_admin', 'toggle_admin', 
         'manage_roles', 'view_logs', 'view_discounts', 'manage_discounts',
         'view_tickets', 'reply_ticket', 'close_ticket', 'view_finance',
         'manage_finance', 'send_admin_ticket', 'view_admin_tickets'
        ].includes(p.name)
      );

      superAdminPerms.forEach(permission => {
        rolePermissionsData.push({
          roleId: savedRoles[1].id, // super_admin
          permissionId: permission.id,
        });
      });

      // ADMIN_FINANCE: مجوزهای مالی
      const financePerms = savedPermissions.filter(p => 
        ['view_finance', 'manage_finance', 'view_tickets', 'reply_ticket'].includes(p.name)
      );

      financePerms.forEach(permission => {
        rolePermissionsData.push({
          roleId: savedRoles[2].id, // admin_finance
          permissionId: permission.id,
        });
      });

      // ADMIN_SUPPORT: مجوزهای پشتیبانی
      const supportPerms = savedPermissions.filter(p => 
        ['view_tickets', 'reply_ticket', 'close_ticket', 'view_admin_tickets'].includes(p.name)
      );

      supportPerms.forEach(permission => {
        rolePermissionsData.push({
          roleId: savedRoles[3].id, // admin_support
          permissionId: permission.id,
        });
      });

      // روش صحیح: create با آرایه
      const rolePermissions = rolePermissionRepository.create(rolePermissionsData);
      await rolePermissionRepository.save(rolePermissions);
      console.log('مجوزها به نقش‌ها تخصیص یافت');

      // ========== 4. ایجاد کاربر MANAGER پیش‌فرض ==========
      console.log('ایجاد کاربر manager پیش‌فرض...');
      const adminRepository = queryRunner.manager.getRepository(Admins);

      // هش کردن رمز عبور
      const plainPassword = 'Manager@123456';
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      const adminData = {
        email: 'manager@example.com',
        passwordHash,
        name: 'مدیر سیستم',
        roleId: savedRoles[0].id, // manager
        isActive: true,
        createdBy: undefined,
      };

      // روش صحیح: create با آبجکت
      const managerUser = adminRepository.create(adminData);
      await adminRepository.save(managerUser);

      console.log('✅ کاربر manager با موفقیت ایجاد شد:');
      console.log('   ایمیل: manager@example.com');
      console.log('   رمز عبور: Manager@123456');

      await queryRunner.commitTransaction();
      console.log('✅ seeding با موفقیت کامل شد!');

    } catch (error) {
      console.error('❌ خطا در seeding:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}