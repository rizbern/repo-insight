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
                    defaultExpiryAction: ExpiryAction.DELETE,
                    preDeletionWarningDays: 7,
                    githubOrgName: 'kennethcrasto',
                    updatedBy: 'SYSTEM',
                },
            });
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

        return this.prisma.systemConfig.update({
            where: {
                id: settings.id,
            },
            data: {
                repoPrefix: data.repoPrefix,
                retentionDays: data.retentionDays,
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

        return this.prisma.systemConfig.update({
            where: {
                id: settings.id,
            },
            data: {
                repoPrefix: 'pt-',
                retentionDays: 90,
                defaultExpiryAction: ExpiryAction.DELETE,
                preDeletionWarningDays: 7,
                githubOrgName: 'kennethcrasto',
                updatedBy,
            },
        });
    }
}