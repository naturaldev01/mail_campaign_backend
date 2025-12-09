import { IsArray, IsIn, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AudienceFilterRule {
  @IsString()
  field: string;

  @IsString()
  operator: string; // equals | contains | gt | lt | in | not_in | between

  @IsOptional()
  value?: any;

  @IsOptional()
  @IsArray()
  values?: any[];

  @IsOptional()
  @IsString()
  source?: string; // e.g. zoho, manual
}

export class AudienceSyncConfig {
  @IsOptional()
  @IsString()
  resource?: string; // e.g. Contacts, Deals

  @IsOptional()
  @IsObject()
  auth?: Record<string, any>; // token or connection id

  @IsOptional()
  @IsObject()
  cursor?: Record<string, any>; // pagination cursors for incremental syncs

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AudienceFilterRule)
  rules?: AudienceFilterRule[];
}

