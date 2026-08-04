import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { parseRepoName } from '../common/utils/repo-parser.util';

@Injectable()
export class GithubService {
  private readonly octokit: Octokit;
  private readonly logger = new Logger(GithubService.name);

  constructor(private configService: ConfigService) {
    const token = this.configService.get<string>('GITHUB_TOKEN');
    this.octokit = new Octokit({
      auth: token,
    });
  }

  async listTestRepos(orgName: string, prefix = 'pt-') {
    try {
      const response = await this.octokit.repos.listForOrg({
        org: orgName,
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
}
