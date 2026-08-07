import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('CLIENT_SECRET'),
      callbackURL: configService.get<string>(
        'GITHUB_CALLBACK_URL',
        'http://localhost:3000/auth/github/callback',
      ),
      scope: ['read:user', 'read:org', 'repo', 'admin:org', 'admin:org_hook', 'delete_repo'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    // Pass accessToken and profile downstream to the auth service
    return { accessToken, profile };
  }
}
