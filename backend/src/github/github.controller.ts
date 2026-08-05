import { Controller, Get, Put, Delete, Patch, Query, Param, UseGuards, Req } from '@nestjs/common';
import { GithubService } from './github.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { Request } from 'express';

@Controller('github')
@UseGuards(JwtAuthGuard)
export class GithubController {
  constructor(private readonly githubService: GithubService) {}

  @Get('repos')
  async listRepos(
    @Query('org') org: string,
    @Query('prefix') prefix?: string,
  ) {
    return this.githubService.listTestRepos(org, prefix);
  }

  @Delete('repos/:repoName/collaborators/:username')
  async revokeAccess(
    @Req() req: Request,
    @Query('org') org: string,
    @Param('repoName') repoName: string,
    @Param('username') targetUser: string,
  ) {
    const actor = (req.user as any).githubUsername;
    return this.githubService.revokeAccess(actor, org, repoName, targetUser);
  }

  @Put('repos/:repoName/collaborators/:username')
  async grantAccess(
    @Req() req: Request,
    @Query('org') org: string,
    @Param('repoName') repoName: string,
    @Param('username') targetUser: string,
  ) {
    const actor = (req.user as any).githubUsername;
    return this.githubService.grantAccess(actor, org, repoName, targetUser);
  }

  @Patch('repos/:repoName/archive')
  async archiveRepo(
    @Req() req: Request,
    @Query('org') org: string,
    @Param('repoName') repoName: string,
  ) {
    const actor = (req.user as any).githubUsername;
    return this.githubService.archiveRepo(actor, org, repoName);
  }

  @Patch('repos/:repoName/unarchive')
  async unarchiveRepo(
    @Req() req: Request,
    @Query('org') org: string,
    @Param('repoName') repoName: string,
  ) {
    const actor = (req.user as any).githubUsername;
    return this.githubService.unarchiveRepo(actor, org, repoName);
  }

  @Delete('repos/:repoName')
  async deleteRepo(
    @Req() req: Request,
    @Query('org') org: string,
    @Param('repoName') repoName: string,
  ) {
    const actor = (req.user as any).githubUsername;
    return this.githubService.deleteRepo(actor, org, repoName);
  }
}

