import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';

@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getLogs(
    @Query('actionType') actionType?: AuditAction,
    @Query('targetRepo') targetRepo?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.auditService.findAll({
      actionType,
      targetRepo,
      skip: skip ? parseInt(skip, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('export')
  async exportCsv(@Res() res: Response) {
    const csv = await this.auditService.exportCsv();
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
    return this.auditService.logAction(
      body.actor,
      body.actionType,
      body.targetRepo,
      body.metadata,
      body.ipAddress,
    );
  }
}
