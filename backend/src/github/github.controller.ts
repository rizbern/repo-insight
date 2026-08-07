import { Controller, Get, Put, Delete, Patch, Query, Param, UseGuards, Req } from '@nestjs/common';
import { GithubService } from './github.service';
import { ConfigService } from '../config/config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
  ) { }

  @Get('repos')
  async listRepos(
    @Query('prefix') prefix?: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const [repos, overrides, retentionHistory] = await Promise.all([
      this.githubService.listTestRepos(config.githubOrgName, prefix),
      this.configService.getOverrides(),
      this.configService.getRetentionHistory(),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.repoName, o.overrideDeletionDate]));
    const getRetentionDaysForRepo = (createdAt: Date) => {
      const history = retentionHistory.filter((h) => h.effectiveAt <= createdAt).pop();
      if (history) {
        return history.retentionDays;
      }
      return retentionHistory.length > 0
        ? retentionHistory[0].retentionDays
        : config.retentionDays;
    };

    return repos.map((repo) => {
      const createdAt = repo.createdAt ? new Date(repo.createdAt) : new Date();
      const retentionDaysForRepo = getRetentionDaysForRepo(createdAt);
      const defaultDeletion = new Date(createdAt.getTime() + retentionDaysForRepo * 86400000).toISOString();
      const scheduledDeletionAt = overrideMap.get(repo.name) || defaultDeletion;
      return {
        ...repo,
        scheduledDeletionAt,
      };
    });
  }

  @Delete('repos/:repoName/collaborators')
  async revokeAccess(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const actor = (req.user as any).githubUsername;
    return this.githubService.revokeAccess(actor, config.githubOrgName, repoName);
  }

  @Put('repos/:repoName/collaborators/:username')
  async grantAccess(
    @Req() req: Request,
    @Param('repoName') repoName: string,
    @Param('username') targetUser: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const actor = (req.user as any).githubUsername;
    return this.githubService.grantAccess(actor, config.githubOrgName, repoName, targetUser);
  }

  @Patch('repos/:repoName/archive')
  async archiveRepo(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const actor = (req.user as any).githubUsername;
    return this.githubService.archiveRepo(actor, config.githubOrgName, repoName);
  }

  @Patch('repos/:repoName/unarchive')
  async unarchiveRepo(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const actor = (req.user as any).githubUsername;
    return this.githubService.unarchiveRepo(actor, config.githubOrgName, repoName);
  }

  @Delete('repos/:repoName')
  async deleteRepo(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ) {
    const config = await this.configService.getSystemConfig();
    const actor = (req.user as any).githubUsername;
    return this.githubService.deleteRepo(actor, config.githubOrgName, repoName);
  }
}
