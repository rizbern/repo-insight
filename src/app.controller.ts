import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  // /health() checks if server is running, uptime etc
  health() {
    return { status: 'ok' };
  }
}


