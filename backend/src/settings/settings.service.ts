import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpiryAction } from '@prisma/client';

@Injectable()
export class SettingsService {
    constructor(private prisma: PrismaService) {}

    // Get current settings
    async getSettings() {
        let settings = await this.prisma.systemConfig.findFirst();

        if (!settings) {
            settings = await this.prisma.systemConfig.create({
                data: {
                    repoPrefix: 'pt-',
                    retentionDays: 90,
                    retentionDaysEffectiveAt: new Date(),
                    defaultExpiryAction: ExpiryAction.DELETE,
                    preDeletionWarningDays: 7,
                    githubOrgName: 'kennethcrasto',
                    updatedBy: 'SYSTEM',
                },
            });

            await this.prisma.systemConfigHistory.create({
                data: {
                    retentionDays: settings.retentionDays,
                    effectiveAt: new Date(),
                },
            });
        } else {
            const historyCount = await this.prisma.systemConfigHistory.count();
            if (historyCount === 0) {
                await this.prisma.systemConfigHistory.create({
                    data: {
                        retentionDays: settings.retentionDays,
                        effectiveAt: new Date(0),
                    },
                });
            }
        }

        return settings;
    }

    // Update settings
    async updateSettings(data: {
        repoPrefix?: string;
        retentionDays?: number;
        defaultExpiryAction?: ExpiryAction;
        preDeletionWarningDays?: number;
        githubOrgName?: string;
        updatedBy: string;
    }) {
        const settings = await this.prisma.systemConfig.findFirst();

        if (!settings) {
            throw new NotFoundException('System settings not found');
        }
        // If retentionDays is being updated, create a new history record
        if (data.retentionDays !== undefined && data.retentionDays !== settings.retentionDays) {
            await this.prisma.systemConfigHistory.create({
                data: {
                    retentionDays: data.retentionDays,
                    effectiveAt: new Date(),
                },
            });
        }

        return this.prisma.systemConfig.update({
            where: {
                id: settings.id,
            },
            data: {
                repoPrefix: data.repoPrefix,
                retentionDays: data.retentionDays,
                // Update retentionDaysEffectiveAt only if retentionDays has changed
                retentionDaysEffectiveAt:
                  data.retentionDays !== undefined && data.retentionDays !== settings.retentionDays
                    ? new Date()
                    : settings.retentionDaysEffectiveAt,
                defaultExpiryAction: data.defaultExpiryAction,
                preDeletionWarningDays: data.preDeletionWarningDays,
                githubOrgName: data.githubOrgName,
                updatedBy: data.updatedBy,
            },
        });
    }

    // Reset to default values
    async resetDefaults(updatedBy: string) {
        const settings = await this.prisma.systemConfig.findFirst();

        if (!settings) {
            throw new NotFoundException('System settings not found');
        }
        // If retentionDays is not already 90, create a new history record for the default value
        if (settings.retentionDays !== 90) {
            await this.prisma.systemConfigHistory.create({
                data: {
                    retentionDays: 90,
                    effectiveAt: new Date(),
                },
            });
        }

        return this.prisma.systemConfig.update({
            where: {
                id: settings.id,
            },
            data: {
                repoPrefix: 'pt-',
                retentionDays: 90,
                retentionDaysEffectiveAt: new Date(),
                defaultExpiryAction: ExpiryAction.DELETE,
                preDeletionWarningDays: 7,
                githubOrgName: 'kennethcrasto',
                updatedBy,
            },
        });
    }
}