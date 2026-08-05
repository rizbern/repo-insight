import { Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async listNotifications(@Query('unread') unread?: string) {
    return this.notificationService.getNotifications(unread === 'true');
  }

  @Patch('read-all')
  async markAllRead() {
    return this.notificationService.markAllRead();
  }
}
