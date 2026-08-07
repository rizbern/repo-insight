import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { GithubModule } from './github/github.module';
import { AuthModule } from './auth/auth.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationModule } from './notification/notification.module';
import { AppConfigModule } from './config/config.module';
import { WebhookModule } from './webhook/webhook.module';
import {SettingsModule} from "./settings/settings.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    GithubModule,
    AuthModule,
    NotificationModule,
    SchedulerModule,
    SettingsModule,

    AppConfigModule,
    WebhookModule,
    SettingsModule,
  ],
})
export class AppModule {}

