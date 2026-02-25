import { Test, TestingModule } from '@nestjs/testing';
import { AdminTicketsService } from './admin-tickets.service';

describe('AdminTicketsService', () => {
  let service: AdminTicketsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminTicketsService],
    }).compile();

    service = module.get<AdminTicketsService>(AdminTicketsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
