import {
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) { }

  /**
   * Validates a GitHub user after OAuth callback.
   * 1. Checks if the user is in the allowed users list
   * 2. Finds or creates user in DB
   * 3. Logs the LOGIN audit event
   * 4. Returns a signed JWT
   */
  async validateGithubUser(
    accessToken: string,
    profile: any,
  ): Promise<{ access_token: string }> {
    const username: string = profile.username;

    // Get target org from SystemConfig or fallback to ENV
    const config = await this.prisma.systemConfig.findFirst();
    const targetOrg = config?.githubOrgName || this.configService.get<string>('GITHUB_ORG') || 'rizbern';

    // Verify org membership via GitHub API
    try {
      const orgsResponse = await fetch('https://api.github.com/user/orgs', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!orgsResponse.ok) {
        throw new Error('Failed to fetch user orgs');
      }

      const orgs = await orgsResponse.json();
      const isMember =
        username.toLowerCase() === targetOrg.toLowerCase() ||
        orgs.some((org: any) => org.login.toLowerCase() === targetOrg.toLowerCase());

      if (!isMember) {
        this.logger.warn(`User ${username} denied access — not a member of ${targetOrg}.`);
        throw new ForbiddenException(`Access denied. You must be a member of the ${targetOrg} organization.`);
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error verifying org membership for ${username}: ${message}`);
      throw new ForbiddenException('Access denied. Could not verify organization membership.');
    }

    // Verify Webhook Setup
    const proxyUrl = this.configService.get<string>('WEBHOOK_PROXY_URL');
    if (!proxyUrl || !proxyUrl.includes('smee.io')) {
      this.logger.warn(`User ${username} denied access — invalid or missing WEBHOOK_PROXY_URL locally.`);
      throw new ForbiddenException('Access denied. You must configure a valid WEBHOOK_PROXY_URL in your .env to connect to the organization webhooks before logging in.');
    }

    try {
      const systemToken = this.configService.get<string>('GITHUB_TOKEN');
      const hooksResponse = await fetch(`https://api.github.com/orgs/${targetOrg}/hooks`, {
        headers: {
          Authorization: `Bearer ${systemToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'RepoManager',
        },
      });

      if (!hooksResponse.ok) {
        const errorText = await hooksResponse.text();
        this.logger.error(`Failed to fetch hooks using backend PAT for ${targetOrg}. Status: ${hooksResponse.status}, Body: ${errorText}`);
        throw new Error(`Failed to fetch organization hooks (${hooksResponse.status}). Ensure your backend GITHUB_TOKEN has the 'admin:org_hook' permission.`);
      }

      const hooks = await hooksResponse.json();

      const normalizeUrl = (url: string) => (url || '').replace(/\/$/, '').toLowerCase();
      const targetUrl = normalizeUrl(proxyUrl);

      const hasWebhook = hooks.some((hook: any) => normalizeUrl(hook.config?.url) === targetUrl);

      if (!hasWebhook) {
        const foundUrls = hooks.map((h: any) => h.config?.url).join(', ') || 'none';
        this.logger.warn(`User ${username} denied access — GitHub org ${targetOrg} has no webhook matching ${proxyUrl}. Found URLs: ${foundUrls}`);
        throw new ForbiddenException(`Access denied. The GitHub organization '${targetOrg}' does not have an active webhook pointing to your local proxy URL (${proxyUrl}).`);
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error verifying webhooks for ${targetOrg}: ${message}`);
      throw new ForbiddenException(`Access denied. Could not verify organization webhooks: ${message}`);
    }

    // Find or create the user in our database
    let user = await this.prisma.user.findUnique({
      where: { githubUsername: username },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          githubUsername: username,
          role: 'TECH_LEAD', // default role for new users
        },
      });
      this.logger.log(`Created new user: ${username}`);
    }

    // Log the login event
    //await this.auditService.logAction(username, 'LOGIN', targetOrg);

    // Sign and return JWT
    const payload = {
      sub: user.id,
      githubUsername: user.githubUsername,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
