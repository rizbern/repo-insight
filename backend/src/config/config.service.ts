import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ExpiryAction } from '@prisma/client';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AuditService))
    private readonly auditService: AuditService,
    private readonly envConfig: NestConfigService,
  ) {}

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      const orgName = this.envConfig.get<string>('GITHUB_ORG') || 'south-group-tt';
      config = await this.prisma.systemConfig.create({
        data: {
          repoPrefix: 'pt-',
          retentionDays: 90,
          retentionDaysEffectiveAt: new Date(), //newer repos to follow new retention days (keeps old repos with old retention days)
          defaultExpiryAction: 'DELETE',
          preDeletionWarningDays: 7,
          githubOrgName: orgName,
          updatedBy: 'SYSTEM',
        },
      });
      // for the first time, create a history record with the initial retention days
      await this.prisma.systemConfigHistory.create({
        data: {
          retentionDays: config.retentionDays,
          effectiveAt: new Date(),
        },
      });
    }
    return config;
  }

  async updateSystemConfig(
    data: {
      retentionDays?: number;
      defaultExpiryAction?: ExpiryAction;
      preDeletionWarningDays?: number;
      githubOrgName?: string;
    },
    actor: string,
    ipAddress?: string,
  ) {
    const config = await this.getSystemConfig();
    // If retentionDays is being updated, create a new history record
    if (data.retentionDays !== undefined && data.retentionDays !== config.retentionDays) {
      await this.prisma.systemConfigHistory.create({
        data: {
          retentionDays: data.retentionDays,
          effectiveAt: new Date(),
        },
      });
    }

    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...data,
        // Update retentionDaysEffectiveAt only if retentionDays has changed
        retentionDaysEffectiveAt:
          data.retentionDays !== undefined && data.retentionDays !== config.retentionDays
            ? new Date()
            : config.retentionDaysEffectiveAt,
        updatedBy: actor,
      },
    });

    await this.auditService.logAction(
      actor,
      'CONFIG_UPDATED',
      config.githubOrgName,
      undefined,
      { changes: data },
      ipAddress,
    );

    return updatedConfig;
  }

  async getOverrides() {
    return this.prisma.repoOverride.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
  // Fetch retention history records, ensuring at least one record exists
  async getRetentionHistory() {
    let histories = await this.prisma.systemConfigHistory.findMany({
      orderBy: { effectiveAt: 'asc' },
    });
    // If no history records exist, create a default one based on the current system config
    if (histories.length === 0) {
      const config = await this.getSystemConfig();
      histories = [
        {
          retentionDays: config.retentionDays,
          effectiveAt: new Date(0),
        } as any,
      ];
    }

    return histories;
  }

  async setOverride(
    repoName: string,
    overrideDeletionDate: Date,
    reason: string,
    actor: string,
    ipAddress?: string,
  ) {
    const override = await this.prisma.repoOverride.upsert({
      where: { repoName },
      update: {
        overrideDeletionDate,
        reason,
        setBy: actor,
      },
      create: {
        repoName,
        overrideDeletionDate,
        reason,
        setBy: actor,
      },
    });

    const config = await this.getSystemConfig();
    await this.auditService.logAction(
      actor,
      'OVERRIDE_CREATED',
      config.githubOrgName,
      repoName,
      { overrideDeletionDate, reason },
      ipAddress,
    );

    return override;
  }

  async deleteOverride(repoName: string, actor: string, ipAddress?: string) {
    const override = await this.prisma.repoOverride.findUnique({
      where: { repoName },
    });

    if (!override) {
      throw new NotFoundException(`Override for repo ${repoName} not found`);
    }

    await this.prisma.repoOverride.delete({
      where: { repoName },
    });

    const config = await this.getSystemConfig();
    await this.auditService.logAction(
      actor,
      'OVERRIDE_REMOVED',
      config.githubOrgName,
      repoName,
      { previousDate: override.overrideDeletionDate },
      ipAddress,
    );

    return { success: true };
  }
}
