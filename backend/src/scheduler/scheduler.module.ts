import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { GithubModule } from '../github/github.module';
import { NotificationModule } from '../notification/notification.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [GithubModule, NotificationModule, AuditModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
