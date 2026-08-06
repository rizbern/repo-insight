import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

function formatMetadataForCsv(actionType: string, metadata: any, ipAddress: string | null): string {
  if (!metadata) {
    return ipAddress ? `IP: ${ipAddress}` : '';
  }
  try {
    const meta = metadata as any;
    switch (actionType) {
      case 'CONFIG_UPDATED':
<<<<<<< HEAD
        return meta.changes
=======
        return meta.changes 
>>>>>>> 1c05dafd7307ac1a5fb91daf47f31a5ff31d992a
          ? `Changes: ${Object.keys(meta.changes).map(k => `${k}=${meta.changes[k]}`).join(', ')}`
          : 'Config updated';
      case 'OVERRIDE_CREATED':
        const date = meta.overrideDeletionDate ? new Date(meta.overrideDeletionDate).toLocaleDateString() : '';
        return `Date: ${date}${meta.reason ? `, Reason: ${meta.reason}` : ''}`;
      case 'OVERRIDE_REMOVED':
        const prev = meta.previousDate ? new Date(meta.previousDate).toLocaleDateString() : '';
        return `Previous date: ${prev}`;
      case 'COLLABORATOR_REMOVED':
        return meta.targetUsers ? `Removed: ${meta.targetUsers.join(', ')}` : (meta.targetUser ? `Removed: ${meta.targetUser}` : 'Collaborators removed');
      case 'COLLABORATOR_ADDED':
        return meta.targetUser ? `Added: ${meta.targetUser}` : 'Collaborator added';
      default:
        return Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  } catch (e) {
    return JSON.stringify(metadata);
  }
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) { }

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
      let details = formatMetadataForCsv(log.actionType, log.metadata, log.ipAddress);
      // Escape double quotes for CSV
      details = details.replace(/"/g, '""');
<<<<<<< HEAD

      return `${log.id},${log.createdAt.toISOString()},${log.actor},${log.actionType},${log.targetRepo || ''
        },"${details}"`;
=======
      
      return `${log.id},${log.createdAt.toISOString()},${log.actor},${log.actionType},${
        log.targetRepo || ''
      },"${details}"`;
>>>>>>> 1c05dafd7307ac1a5fb91daf47f31a5ff31d992a
    });

    return header + rows.join('\n');
  }
}

