import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(
    actor: string,
    actionType: AuditAction,
    targetRepo?: string,
    metadata?: any,
    ipAddress?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actor,
        actionType,
        targetRepo,
        metadata,
        ipAddress,
      },
    });
  }

  async findAll(params?: {
    actionType?: AuditAction;
    targetRepo?: string;
    skip?: number;
    take?: number;
  }) {
    const { actionType, targetRepo, skip = 0, take = 50 } = params || {};
    const where: any = {};
    if (actionType) where.actionType = actionType;
    if (targetRepo) where.targetRepo = targetRepo;

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
}

