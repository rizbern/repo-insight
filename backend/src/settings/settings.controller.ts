import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    UseGuards,
    Req,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ExpiryAction } from '@prisma/client';
import type { Request } from 'express';
import {UpdateSettingsDto} from "./dto/update-settings.dto";

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) {}


    @Get()
    async getSettings() {
        return this.settingsService.getSettings();
    }


    @Patch()
    async updateSettings(
        @Req() req: Request,
        @Body()
        body: UpdateSettingsDto,
    ) {
        const updatedBy = (req.user as any).githubUsername;

        return this.settingsService.updateSettings({
            ...body,
            updatedBy,
        });
    }


    @Post('reset')
    async resetSettings(@Req() req: Request) {
        const updatedBy = (req.user as any).githubUsername;

        return this.settingsService.resetDefaults(updatedBy);
    }
}