import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from '../entities/ticket.entity';
import { TicketAnswer } from '../entities/ticket-answer.entity';
import { TicketAssignment } from '../entities/ticket-assignment.entity';
import { SellerTokenSession } from '../entities/seller-token-session.entity';
import { Admins } from '../entities/admins.entity';
import { RolePermission } from '../entities/role-permission.entity';
import { TicketingService } from './ticketing.service';
import { SellerAuthService } from './seller-auth.service';
import { SellerAuthGuard } from './seller-auth.guard';
import { SellerTicketingController } from './seller-ticketing.controller';
import { StaffTicketingController } from './staff-ticketing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Ticket,
      TicketAnswer,
      TicketAssignment,
      SellerTokenSession,
      Admins,
      // Required by PermissionsGuard used on staff ticket routes
      RolePermission,
    ]),
  ],
  controllers: [SellerTicketingController, StaffTicketingController],
  providers: [TicketingService, SellerAuthService, SellerAuthGuard],
  exports: [TicketingService, SellerAuthService],
})
export class TicketingModule {}
