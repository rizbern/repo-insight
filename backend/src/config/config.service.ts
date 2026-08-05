import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ExpiryAction } from '@prisma/client';

@Injectable()
export class ConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly envConfig: NestConfigService,
  ) {}

  async getSystemConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      const orgName = this.envConfig.get<string>('ALLOWED_GITHUB_USERS')?.split(',')[0] || 'kennethcrasto';
      config = await this.prisma.systemConfig.create({
        data: {
          repoPrefix: 'pt-',
          retentionDays: 90,
          defaultExpiryAction: 'DELETE',
          preDeletionWarningDays: 7,
          githubOrgName: orgName,
          updatedBy: 'SYSTEM',
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
    },
    actor: string,
    ipAddress?: string,
  ) {
    const config = await this.getSystemConfig();

    const updatedConfig = await this.prisma.systemConfig.update({
      where: { id: config.id },
      data: {
        ...data,
        updatedBy: actor,
      },
    });

    await this.auditService.logAction(
      actor,
      'CONFIG_UPDATED',
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

    await this.auditService.logAction(
      actor,
      'OVERRIDE_CREATED',
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

    await this.auditService.logAction(
      actor,
      'OVERRIDE_REMOVED',
      repoName,
      { previousDate: override.overrideDeletionDate },
      ipAddress,
    );

    return { success: true };
  }
}
