import { IsEmail, IsOptional, IsString } from 'class-validator';

export class SendCsvDto {
  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  campaignName?: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;

  @IsOptional()
  @IsString()
  fromName?: string;

  @IsOptional()
  @IsEmail()
  fromEmail?: string;

  @IsOptional()
  @IsEmail()
  replyTo?: string;

  @IsOptional()
  @IsString()
  timezoneFallback?: string;
}

