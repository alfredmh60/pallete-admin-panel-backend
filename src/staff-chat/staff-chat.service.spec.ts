import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { StaffChatService } from './staff-chat.service';
import { StaffConversation } from '../entities/staff-conversation.entity';
import { StaffConversationMember } from '../entities/staff-conversation-member.entity';
import { StaffMessage } from '../entities/staff-message.entity';

describe('StaffChatService', () => {
  let service: StaffChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffChatService,
        { provide: getRepositoryToken(StaffConversation), useValue: {} },
        { provide: getRepositoryToken(StaffConversationMember), useValue: {} },
        { provide: getRepositoryToken(StaffMessage), useValue: {} },
      ],
    }).compile();

    service = module.get<StaffChatService>(StaffChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
