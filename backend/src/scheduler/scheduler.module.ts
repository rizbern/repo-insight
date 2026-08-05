import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { GithubModule } from '../github/github.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [GithubModule, NotificationModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
