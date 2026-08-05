import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ConfigService } from './config.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpiryAction } from '@prisma/client';
import type { Request } from 'express';

@Controller('config')
@UseGuards(JwtAuthGuard)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  async getSystemConfig() {
    return this.configService.getSystemConfig();
  }

  @Put()
  async updateSystemConfig(
    @Req() req: Request,
    @Body()
    body: {
      retentionDays?: number;
      defaultExpiryAction?: ExpiryAction;
      preDeletionWarningDays?: number;
      githubOrgName?: string;
    },
  ) {
    const actor = (req.user as any).githubUsername;
    const ipAddress = req.ip;
    return this.configService.updateSystemConfig(body, actor, ipAddress);
  }

  @Get('overrides')
  async getOverrides() {
    return this.configService.getOverrides();
  }

  @Post('overrides')
  async setOverride(
    @Req() req: Request,
    @Body()
    body: {
      repoName: string;
      overrideDeletionDate: string;
      reason: string;
    },
  ) {
    const actor = (req.user as any).githubUsername;
    const ipAddress = req.ip;
    return this.configService.setOverride(
      body.repoName,
      new Date(body.overrideDeletionDate),
      body.reason,
      actor,
      ipAddress,
    );
  }

  @Delete('overrides/:repoName')
  async deleteOverride(@Req() req: Request, @Param('repoName') repoName: string) {
    const actor = (req.user as any).githubUsername;
    const ipAddress = req.ip;
    return this.configService.deleteOverride(repoName, actor, ipAddress);
  }
}
