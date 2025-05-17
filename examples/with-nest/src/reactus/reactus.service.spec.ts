import { Test, TestingModule } from '@nestjs/testing';
import { ReactusService } from './reactus.service.js';

describe('ReactusService', () => {
  let service: ReactusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReactusService],
    }).compile();

    service = module.get<ReactusService>(ReactusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
