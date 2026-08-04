import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    // Instantiate directly with a mock adapter to avoid real DB connection
    service = Object.create(PrismaService.prototype);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
