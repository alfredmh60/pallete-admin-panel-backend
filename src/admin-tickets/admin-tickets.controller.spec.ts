import { Test, TestingModule } from '@nestjs/testing';
import { AdminTicketsController } from './admin-tickets.controller';

describe('AdminTicketsController', () => {
  let controller: AdminTicketsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTicketsController],
    }).compile();

    controller = module.get<AdminTicketsController>(AdminTicketsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
