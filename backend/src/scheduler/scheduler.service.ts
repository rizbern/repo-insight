import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from '../github/github.service';
import { NotificationService } from '../notification/notification.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly githubService: GithubService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {}

  // For testing purposes, we run this every minute.
  // In production, this should be @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoDeletion() {
    this.logger.log('Running daily auto-deletion check...');

    try {
      // 1. Get or create system config
      let config = await this.prisma.systemConfig.findFirst();
      
      // Fallback github org/user to check against
      const orgName = this.configService.get<string>('ALLOWED_GITHUB_USERS')?.split(',')[0] || 'kennethcrasto';

      if (!config) {
        this.logger.log('No SystemConfig found, creating default...');
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



      // 2. Fetch all pt- repos
      const repos = await this.githubService.listTestRepos(config.githubOrgName, config.repoPrefix);

      // 3. Fetch any repo overrides and retention history records
      const overrides = await this.prisma.repoOverride.findMany();
      const overrideMap = new Map(overrides.map((o) => [o.repoName, o.overrideDeletionDate]));
      // Fetch retention history records, ensuring at least one record exists
      let retentionHistories = await this.prisma.systemConfigHistory.findMany({
        orderBy: { effectiveAt: 'asc' },
      });

      if (retentionHistories.length === 0) {
        retentionHistories = [
          {
            retentionDays: config.retentionDays,
            effectiveAt: new Date(0),
          } as any,
        ];
      }

      const now = new Date();
      const activeRepoNames = new Set(repos.map((repo) => repo.name));
      await this.notificationService.cleanupStaleRetentionWarnings(activeRepoNames);

      const getRetentionDaysForRepo = (createdAt: Date) => {
        const history = retentionHistories.filter((h) => h.effectiveAt <= createdAt).pop();
        if (history) {
          return history.retentionDays;
        }

        return retentionHistories.length > 0
          ? retentionHistories[0].retentionDays
          : config.retentionDays;
      };

      for (const repo of repos) {
        // Skip already archived repos if our default action is archive (to prevent redundant work)
        if (repo.archived && config.defaultExpiryAction === 'ARCHIVE') {
          continue;
        }

        const createdAt = new Date(repo.createdAt || new Date());
        let deletionDate: Date;

        // Apply repo override if present
        if (overrideMap.has(repo.name)) {
          deletionDate = overrideMap.get(repo.name)!;
        } else {
          const retentionDaysForRepo = getRetentionDaysForRepo(createdAt);
          deletionDate = new Date(createdAt);
          deletionDate.setDate(deletionDate.getDate() + retentionDaysForRepo);
        }

        // If the deletion date has passed, we take action
        if (now > deletionDate) {
          this.logger.log(`Repo ${repo.name} has expired (Threshold: ${deletionDate.toISOString()}). Taking action: ${config.defaultExpiryAction}`);
          
          if (config.defaultExpiryAction === 'ARCHIVE' && !repo.archived) {
            await this.githubService.archiveRepo('SYSTEM_SCHEDULER', config.githubOrgName, repo.name);
          } else if (config.defaultExpiryAction === 'DELETE') {
            await this.githubService.deleteRepo('SYSTEM_SCHEDULER', config.githubOrgName, repo.name);
          }
        } else {
          const daysLeft = Math.ceil((deletionDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
          if (daysLeft <= config.preDeletionWarningDays) {
            this.logger.debug(`Repo ${repo.name} will expire in ${daysLeft} days.`);
            await this.notificationService.createOrUpdateRepoRetentionWarning(repo.name, daysLeft);
          } else {
            await this.notificationService.markRepoWarningsRead(repo.name);
          }
        }
      }

      this.logger.log('Auto-deletion check completed.');
    } catch (error) {
      this.logger.error('Error during auto-deletion check', error);
    }
  }
}
