import { Controller, Post, Headers, Req, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import type { Request } from 'express';

@Controller('github/webhook')
export class WebhookController {
  constructor(
    private readonly webhookService: WebhookService,
    private readonly configService: ConfigService,
  ) { }

  @Post()
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: any,
  ) {
    const secret = this.configService.get<string>('GITHUB_WEBHOOK_SECRET');

    if (secret) {
      if (!signature) {
        throw new HttpException('Missing signature', HttpStatus.UNAUTHORIZED);
      }

      const hmac = crypto.createHmac('sha256', secret);
      // NestJS raw body is stored in req.rawBody when { rawBody: true } is enabled
      const digest = 'sha256=' + hmac.update(req.rawBody).digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))) {
        throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
      }
    }

    const payload = req.body;
    await this.webhookService.handleEvent(event, payload);

    return { status: 'ok' };
  }
}
