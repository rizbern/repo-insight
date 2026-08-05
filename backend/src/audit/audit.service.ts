import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    actor: string,
    actionType: AuditAction,
    orgName?: string,
    targetRepo?: string,
    metadata?: any,
    ipAddress?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actor,
        actionType,
        orgName,
        targetRepo,
        metadata,
        ipAddress,
      },
    });
  }

  async findAll(params?: {
    actionType?: AuditAction;
    targetRepo?: string;
    actor?: string;
    orgName?: string;
    startDate?: string;
    endDate?: string;
    skip?: number;
    take?: number;
  }) {
    const { actionType, targetRepo, actor, orgName, startDate, endDate, skip = 0, take = 50 } = params || {};
    const where: any = {};
    if (actionType) where.actionType = actionType;
    if (targetRepo) where.targetRepo = targetRepo;
    if (actor) where.actor = { contains: actor, mode: 'insensitive' };
    if (orgName) where.orgName = orgName;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async exportCsv(orgName: string): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      where: { orgName },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'ID,Date,Actor,Action,Target,Details\n';
    const rows = logs.map((log) => {
      const details = log.metadata
        ? JSON.stringify(log.metadata).replace(/"/g, '""')
        : log.ipAddress || '';
      return `${log.id},${log.createdAt.toISOString()},${log.actor},${log.actionType},${
        log.targetRepo || ''
      },"${details}"`;
    });

    return header + rows.join('\n');
  }
}

