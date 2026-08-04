import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
