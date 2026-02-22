import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
 import { Admins } from '../entities/admin.entity';
 import { Role } from '../entities/role.entity';
 import { Permission } from '../entities/permission.entity';
 import { RolePermission } from '../entities/role-permission.entity';
// import { Log } from '../entities/log.entity';
// import { DiscountPackage } from '../entities/discount-package.entity';
// import { TicketDepartment } from '../entities/ticket-department.entity';
// import { AdminDepartment } from '../entities/admin-department.entity';
// import { Ticket } from '../entities/ticket.entity';
// import { TicketMessage } from '../entities/ticket-message.entity';
// import { TicketAssignment } from '../entities/ticket-assignment.entity';
// import { FinancialRecord } from '../entities/financial-record.entity';
// import { AdminTicket } from '../entities/admin-ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', '123456789'),
        database: configService.get('DB_DATABASE', 'pallet-admin-panel-DB'),
        entities: [
           Admins,
           Role,
           Permission,
           RolePermission,
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
        synchronize: configService.get('NODE_ENV') !== 'production', // فقط برای توسعه
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}