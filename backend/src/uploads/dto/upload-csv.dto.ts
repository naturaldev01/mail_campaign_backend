import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadCsvDto {
  @IsUUID()
  @IsOptional()
  audienceId?: string;

  @IsString()
  @IsOptional()
  timezoneFallback?: string;
}

