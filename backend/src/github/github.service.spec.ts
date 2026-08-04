import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// Mock @octokit/rest to avoid ESM import issues in Jest
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      listForOrg: jest.fn().mockResolvedValue({ data: [] }),
    },
  })),
}));

import { GithubService } from './github.service';

const mockConfigService = {
  get: jest.fn().mockReturnValue('fake-token'),
};

describe('GithubService', () => {
  let service: GithubService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
