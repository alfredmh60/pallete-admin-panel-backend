import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffConversation } from '../entities/staff-conversation.entity';
import { StaffConversationMember } from '../entities/staff-conversation-member.entity';
import { StaffMessage } from '../entities/staff-message.entity';

@Injectable()
export class StaffChatService {
  constructor(
    @InjectRepository(StaffConversation)
    private readonly conversationRepository: Repository<StaffConversation>,
    @InjectRepository(StaffConversationMember)
    private readonly memberRepository: Repository<StaffConversationMember>,
    @InjectRepository(StaffMessage)
    private readonly messageRepository: Repository<StaffMessage>,
  ) {}
}
