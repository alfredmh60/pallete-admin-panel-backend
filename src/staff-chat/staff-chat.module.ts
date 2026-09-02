import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffChatController } from './staff-chat.controller';
import { StaffChatService } from './staff-chat.service';
import { StaffConversation } from '../entities/staff-conversation.entity';
import { StaffConversationMember } from '../entities/staff-conversation-member.entity';
import { StaffMessage } from '../entities/staff-message.entity';
import { Admins } from '../entities/admins.entity';
import { RolePermission } from '../entities/role-permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffConversation,
      StaffConversationMember,
      StaffMessage,
      Admins,
      RolePermission,
    ]),
  ],
  controllers: [StaffChatController],
  providers: [StaffChatService],
  exports: [StaffChatService],
})
export class StaffChatModule {}
