import { Type } from 'class-transformer';
import { IsArray, IsISO8601, IsIn, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

class DeliveryWindowDto {
  @IsArray()
  @IsString({ each: true })
  daysOfWeek: string[]; // mon-sun

  @IsString()
  startTime: string; // HH:MM

  @IsString()
  endTime: string; // HH:MM
}

class DeliveryIntervalDto {
  @IsIn(['once', 'daily', 'weekly', 'custom'])
  type: 'once' | 'daily' | 'weekly' | 'custom';

  @IsOptional()
  @IsNumber()
  minutes?: number; // for custom cadence

  @IsOptional()
  @IsString()
  sendAt?: string; // HH:MM reference time
}

class DeliveryThrottleDto {
  @IsOptional()
  @IsNumber()
  perMinute?: number;

  @IsOptional()
  @IsNumber()
  perHour?: number;
}

class CampaignSendOptionsDto {
  @IsOptional()
  @IsString()
  timezone?: string; // IANA name

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DeliveryWindowDto)
  @IsArray()
  timeWindows?: DeliveryWindowDto[];

  @IsOptional()
  @IsObject()
  dateRange?: { start: string; end?: string }; // ISO dates

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryIntervalDto)
  cadence?: DeliveryIntervalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryThrottleDto)
  throttle?: DeliveryThrottleDto;
}

export class CreateCampaignDto {
  @IsString()
  name: string;

  @IsUUID()
  @IsOptional()
  templateId?: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @IsString()
  fromEmail?: string;

  @IsOptional()
  @IsString()
  replyTo?: string;

  @IsOptional()
  @IsString()
  subjectOverride?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CampaignSendOptionsDto)
  sendOptions?: CampaignSendOptionsDto;

  @IsArray()
  @IsUUID(undefined, { each: true })
  audienceIds: string[];
}

