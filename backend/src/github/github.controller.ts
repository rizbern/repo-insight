import { Controller, Get, Query } from '@nestjs/common';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repos')
  async listRepos(
    @Query('org') org: string,
    @Query('prefix') prefix?: string,
  ) {
    return this.githubService.listTestRepos(org, prefix);
  }
}
