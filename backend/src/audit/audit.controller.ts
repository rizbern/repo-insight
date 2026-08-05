import { Controller, Get, Post, Body, Query, Res, Inject, forwardRef } from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';
import { ConfigService } from '../config/config.service';

@Controller('audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    @Inject(forwardRef(() => ConfigService))
    private readonly configService: ConfigService,
  ) {}

  @Get('logs')
  async getLogs(
    @Query('actionType') actionType?: AuditAction,
    @Query('targetRepo') targetRepo?: string,
    @Query('actor') actor?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const config = await this.configService.getSystemConfig();
    return this.auditService.findAll({
      actionType,
      targetRepo,
      actor,
      orgName: config.githubOrgName,
      startDate,
      endDate,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('export')
  async exportCsv(@Res() res: Response) {
    const config = await this.configService.getSystemConfig();
    // Assuming exportCsv doesn't take params yet, but let's pass it anyway or update it later.
    // Wait, let's look at exportCsv in AuditService.
    const csv = await this.auditService.exportCsv(config.githubOrgName);
    res.header('Content-Type', 'text/csv');
    res.attachment('audit-export.csv');
    return res.send(csv);
  }

  @Post('logs')
  async createLog(
    @Body()
    body: {
      actor: string;
      actionType: AuditAction;
      targetRepo?: string;
      metadata?: any;
      ipAddress?: string;
    },
  ) {
    const config = await this.configService.getSystemConfig();
    return this.auditService.logAction(
      body.actor,
      body.actionType,
      config.githubOrgName,
      body.targetRepo,
      body.metadata,
      body.ipAddress,
    );
  }
}
