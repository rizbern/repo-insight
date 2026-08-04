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
}
