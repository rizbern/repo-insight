import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { parseRepoName } from '../common/utils/repo-parser.util';
import { AuditAction } from '@prisma/client';
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
      // listForUser only returns public repos. To get private repos, we must use listForAuthenticatedUser
      // and filter by the requested org/user name.
      const response = await this.octokit.repos.listForAuthenticatedUser({
        per_page: 100,
        affiliation: 'owner,organization_member',
      });

      const repos = response.data.filter((r) => r.owner.login === orgName);
      
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

  async revokeAccess(actor: string, orgName: string, repoName: string) {
    try {
      const { data: collaborators } = await this.octokit.repos.listCollaborators({
        owner: orgName,
        repo: repoName,
        affiliation: 'outside',
      });

      const removedUsers: string[] = [];
      for (const collaborator of collaborators) {
        await this.octokit.repos.removeCollaborator({
          owner: orgName,
          repo: repoName,
          username: collaborator.login,
        });
        removedUsers.push(collaborator.login);
      }
      
      await this.auditService.logAction(
        actor, 
        'COLLABORATOR_REMOVED', 
        orgName,
        repoName, 
        { targetUsers: removedUsers }
      );
      
      return { success: true, removedUsers };
    } catch (error) {
      this.logger.error(`Failed to revoke access on ${repoName}`, error);
      throw error;
    }
  }

  async grantAccess(actor: string, orgName: string, repoName: string, targetUser: string) {
    try {
      await this.octokit.repos.addCollaborator({
        owner: orgName,
        repo: repoName,
        username: targetUser,
        permission: 'push', // default to push (write) access, adjust if necessary
      });
      
      await this.auditService.logAction(
        actor, 
        'COLLABORATOR_ADDED', 
        orgName,
        repoName, 
        { targetUser }
      );
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to grant access for ${targetUser} on ${repoName}`, error);
      throw error;
    }
  }

  async archiveRepo(actor: string, orgName: string, repoName: string) {
    try {
      const repo = await this.octokit.repos.get({
        owner: orgName,
        repo: repoName,
      });

      if (repo.data.archived) {
        this.logger.log(`Repo ${repoName} is already archived; skipping archive.`);
        return { success: true, skipped: true };
      }

      await this.octokit.repos.update({
        owner: orgName,
        repo: repoName,
        archived: true,
      });
      
      await this.auditService.logAction(actor, 'REPO_ARCHIVED', orgName, repoName);
      
      return { success: true };
    } catch (error: any) {
      const message = String(error?.message ?? '');
      if (error?.status === 403 && message.includes('archived so is read-only')) {
        this.logger.log(`Repo ${repoName} is already archived and read-only; skipping archive.`);
        return { success: true, skipped: true };
      }

      this.logger.error(`Failed to archive repo ${repoName}`, error);
      throw error;
    }
  }

  async unarchiveRepo(actor: string, orgName: string, repoName: string) {
    try {
      const repo = await this.octokit.repos.get({
        owner: orgName,
        repo: repoName,
      });

      if (!repo.data.archived) {
        this.logger.log(`Repo ${repoName} is not archived; skipping unarchive.`);
        return { success: true, skipped: true };
      }

      await this.octokit.repos.update({
        owner: orgName,
        repo: repoName,
        archived: false,
      });
      
      await this.auditService.logAction(actor, 'REPO_UNARCHIVED', orgName, repoName);
      
      return { success: true };
    } catch (error: any) {
      const message = String(error?.message ?? '');
      if (error?.status === 403 && message.includes('archived so is read-only')) {
        this.logger.error(`Failed to unarchive repo ${repoName} because repo is archived and read-only.`, error);
      }

      this.logger.error(`Failed to unarchive repo ${repoName}`, error);
      throw error;
    }
  }

  async deleteRepo(actor: string, orgName: string, repoName: string) {
    try {
      await this.octokit.repos.delete({
        owner: orgName,
        repo: repoName,
      });
      
      await this.auditService.logAction(actor, 'REPO_DELETED', orgName, repoName);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to delete repo ${repoName}`, error);
      throw error;
    }
  }

  async fetchRecentEvents(orgName: string) {
    try {
      const { data: user } = await this.octokit.users.getAuthenticated();
      
      try {
        const { data } = await this.octokit.activity.listOrgEventsForAuthenticatedUser({
          username: user.login,
          org: orgName,
          per_page: 100,
        });
        return data;
      } catch (e) {
        // Fallback to received events for the user (dashboard feed) if not an org
        const { data } = await this.octokit.activity.listReceivedEventsForUser({
          username: user.login,
          per_page: 100,
        });
        return data;
      }
    } catch (error) {
      this.logger.error(`Failed to fetch events for org ${orgName}`, error);
      return [];
    }
  }
}

