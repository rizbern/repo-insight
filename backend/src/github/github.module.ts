import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubController } from './github.controller';
import { AuditModule } from '../audit/audit.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AuditModule, AppConfigModule],
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}

