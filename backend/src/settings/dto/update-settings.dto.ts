import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
} from 'class-validator';
import { ExpiryAction } from '@prisma/client';

export class UpdateSettingsDto {
    @IsOptional()
    @IsString()
    repoPrefix?: string;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(3650)
    retentionDays?: number;

    @IsOptional()
    @IsEnum(ExpiryAction)
    defaultExpiryAction?: ExpiryAction;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(30)
    preDeletionWarningDays?: number;

    @IsOptional()
    @IsString()
    githubOrgName?: string;
}