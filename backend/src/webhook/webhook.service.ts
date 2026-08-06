import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async handleEvent(event: string, payload: any) {
    const actor = payload.sender?.login || 'github_webhook';
    const orgName = payload.organization?.login;

    if (!orgName) {
      this.logger.debug('Ignoring webhook without organization');
      return;
    }

    if (event === 'repository') {
      const repoName = payload.repository?.name;
      const action = payload.action;

      if (action === 'archived') {
        await this.logEvent(actor, 'REPO_ARCHIVED', orgName, repoName);
      } else if (action === 'unarchived') {
        await this.logEvent(actor, 'REPO_UNARCHIVED', orgName, repoName);
      } else if (action === 'deleted') {
        await this.logEvent(actor, 'REPO_DELETED', orgName, repoName);
      }
    } else if (event === 'member') {
      const repoName = payload.repository?.name;
      const targetUser = payload.member?.login;
      const action = payload.action;

      if (action === 'added') {
        await this.logEvent(actor, 'COLLABORATOR_ADDED', orgName, repoName, { targetUser });
      } else if (action === 'removed') {
        await this.logEvent(actor, 'COLLABORATOR_REMOVED', orgName, repoName, { targetUser });
      }
    }
  }

  private async logEvent(
    actor: string,
    actionType: AuditAction,
    orgName: string,
    targetRepo?: string,
    metadata?: any,
  ) {
    // Basic deduplication: if this exact event was logged in the last 5 seconds, skip it.
    // This prevents double-logging when the app makes the change via API AND receives the webhook.
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const existing = await this.prisma.auditLog.findFirst({
      where: {
        actionType,
        orgName,
        targetRepo,
        createdAt: { gte: fiveSecondsAgo },
      },
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      this.logger.debug(`Skipping duplicate webhook event: ${actionType} on ${targetRepo}`);
      return;
    }

    await this.auditService.logAction(actor, actionType, orgName, targetRepo, metadata);
    this.logger.log(`Webhook triggered log: ${actionType} on ${targetRepo} by ${actor}`);
  }
}
