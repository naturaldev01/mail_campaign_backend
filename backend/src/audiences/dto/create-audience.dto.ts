import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, ValidateNested, IsArray } from 'class-validator';
import { AudienceFilterRule, AudienceSyncConfig } from './audience-filter.dto';

export class CreateAudienceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['static', 'dynamic'])
  type?: 'static' | 'dynamic';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceFilterRule)
  filterRules?: AudienceFilterRule[];

  @IsOptional()
  @IsString()
  syncProvider?: 'zoho' | 'manual';

  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceSyncConfig)
  syncConfig?: AudienceSyncConfig;
}

