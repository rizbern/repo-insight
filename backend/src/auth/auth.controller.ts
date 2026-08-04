import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Step 1: Redirect user to GitHub OAuth consent screen
   */
  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubLogin() {
    // Passport handles the redirect automatically
  }

  /**
   * Step 2: GitHub redirects back here with a code.
   * Passport exchanges it for an access token + profile.
   * We verify org membership, create/find user, and return a JWT.
   */
  @Get('callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const { accessToken, profile } = req.user as any;
      const result = await this.authService.validateGithubUser(
        accessToken,
        profile,
      );

      // Redirect to frontend with the JWT token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(
        `${frontendUrl}/auth/callback?token=${result.access_token}`,
      );
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const message = encodeURIComponent(
        error.message || 'Authentication failed',
      );
      return res.redirect(`${frontendUrl}/auth/callback?error=${message}`);
    }
  }

  /**
   * Protected route: returns the current user's info from their JWT
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: Request) {
    return req.user;
  }
}
