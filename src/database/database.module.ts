import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Admins } from '../entities/admins.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { Log } from '../entities/log.entity';
import { StaffConversation } from '../entities/staff-conversation.entity';
import { StaffConversationMember } from '../entities/staff-conversation-member.entity';
import { StaffMessage } from '../entities/staff-message.entity';
import { BlacklistedToken } from '../entities/blacklisted-token.entity';
import { Ticket } from '../entities/ticket.entity';
import { TicketAnswer } from '../entities/ticket-answer.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { SellerTokenSession } from '../entities/seller-token-session.entity';

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
        database: configService.get('DB_DATABASE', 'palette_ap_db'),
        entities: [
          Admins,
          Role,
          Permission,
          RolePermission,
          Log,
          StaffConversation,
          StaffConversationMember,
          StaffMessage,
          BlacklistedToken,
          Ticket,
          TicketAnswer,
          TicketAssignment,
          SellerTokenSession,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
  ],
})
export class DatabaseModule {}
