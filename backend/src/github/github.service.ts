import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { parseRepoName } from '../common/utils/repo-parser.util';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class GithubService {
  private readonly octokit: Octokit;
  private readonly logger = new Logger(GithubService.name);

  constructor(
    private configService: ConfigService,
    private auditService: AuditService,
  ) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async listTestRepos(orgName: string, prefix = 'pt-') {
    try {
      const response = await this.octokit.repos.listForUser({
        username: orgName,
        type: 'all',
        per_page: 100,
      });

      const repos = response.data;
      
      const testRepos = repos
        .filter((repo) => repo.name.startsWith(prefix))
        .map((repo) => {
          const parsed = parseRepoName(repo.name, prefix);
          return {
            id: repo.id,
            name: repo.name,
            createdAt: repo.created_at,
            archived: repo.archived,
            htmlUrl: repo.html_url,
            parsed,
          };
        });

      return testRepos;
    } catch (error) {
      this.logger.error(`Failed to fetch repos for org ${orgName}`, error);
      throw error;
    }
  }

  async revokeAccess(actor: string, orgName: string, repoName: string, targetUser: string) {
    try {
      await this.octokit.repos.removeCollaborator({
        owner: orgName,
        repo: repoName,
        username: targetUser,
      });
      
      await this.auditService.logAction(
        actor, 
        'COLLABORATOR_REMOVED', 
        repoName, 
        { targetUser }
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to revoke access for ${targetUser} on ${repoName}`, error);
      throw error;
    }
  }

  async archiveRepo(actor: string, orgName: string, repoName: string) {
    try {
      await this.octokit.repos.update({
        owner: orgName,
        repo: repoName,
        archived: true,
      });
      
      await this.auditService.logAction(actor, 'REPO_ARCHIVED', repoName);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to archive repo ${repoName}`, error);
      throw error;
    }
  }

  async deleteRepo(actor: string, orgName: string, repoName: string) {
    try {
      await this.octokit.repos.delete({
        owner: orgName,
        repo: repoName,
      });
      
      await this.auditService.logAction(actor, 'REPO_DELETED', repoName);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete repo ${repoName}`, error);
      throw error;
    }
  }
}

