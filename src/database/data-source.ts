import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// بارگذاری متغیرهای محیطی
config();

// ایمپورت Entityها
// import { Admin } from '../entities/admin.entity';
// import { Role } from '../entities/role.entity';
// import { Permission } from '../entities/permission.entity';
// import { RolePermission } from '../entities/role-permission.entity';
// import { Log } from '../entities/log.entity';
// import { DiscountPackage } from '../entities/discount-package.entity';
// import { TicketDepartment } from '../entities/ticket-department.entity';
// import { AdminDepartment } from '../entities/admin-department.entity';
// import { Ticket } from '../entities/ticket.entity';
// import { TicketMessage } from '../entities/ticket-message.entity';
// import { TicketAssignment } from '../entities/ticket-assignment.entity';
// import { FinancialRecord } from '../entities/financial-record.entity';
// import { AdminTicket } from '../entities/admin-ticket.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '123456789',
  database: process.env.DB_DATABASE || 'pallet-admin-panel-DB',
  
  // Entityها
  entities: [
    // Admin,
    // Role,
    // Permission,
    // RolePermission,
    // Log,
    // DiscountPackage,
    // TicketDepartment,
    // AdminDepartment,
    // Ticket,
    // TicketMessage,
    // TicketAssignment,
    // FinancialRecord,
    // AdminTicket,
  ],
  
  // محل فایل‌های migration
  migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
  
  // تنظیمات migration
  migrationsTableName: 'migrations_history',
  migrationsRun: false,
  
  // همگام‌سازی خودکار (فقط برای توسعه!)
  synchronize: false,
  
  // لاگ‌گیری
  logging: process.env.DB_LOGGING === 'true',
  
  // SSL
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;