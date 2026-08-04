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
  ) {}

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
    
    // Parse the comma-separated list of allowed users
    const allowedUsersString = this.configService.get<string>('ALLOWED_GITHUB_USERS', '');
    const allowedUsers = allowedUsersString
      .split(',')
      .map(u => u.trim().toLowerCase())
      .filter(u => u.length > 0);

    if (allowedUsers.length > 0 && !allowedUsers.includes(username.toLowerCase())) {
      this.logger.warn(`User ${username} denied access — not in the allowed list.`);
      throw new ForbiddenException(`Access denied. Your GitHub account (${username}) is not whitelisted.`);
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
    await this.auditService.logAction(username, 'LOGIN');

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
