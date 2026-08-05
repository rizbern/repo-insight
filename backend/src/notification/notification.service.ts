import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getNotifications(unread = false) {
    return this.prisma.notification.findMany({
      where: unread ? { isRead: false } : {},
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async markRead(id: number) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async cleanupStaleRetentionWarnings(activeRepoNames: Set<string>) {
    return this.prisma.notification.updateMany({
      where: {
        isRead: false,
        repoName: {
          notIn: Array.from(activeRepoNames),
        },
      },
      data: { isRead: true },
    });
  }

  async markRepoWarningsRead(repoName: string) {
    return this.prisma.notification.updateMany({
      where: {
        repoName,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async createOrUpdateRepoRetentionWarning(repoName: string, daysLeft: number) {
    const when = daysLeft <= 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
    const message = `Repository ${repoName} will be auto-deleted ${when}.`;

    const existing = await this.prisma.notification.findFirst({
      where: {
        repoName,
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return this.prisma.notification.update({
        where: { id: existing.id },
        data: {
          message,
          createdAt: new Date(),
        },
      });
    }

    return this.prisma.notification.create({
      data: {
        repoName,
        message,
        isRead: false,
      },
    });
  }
}
