import { IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  bodyHtml?: string;

  @IsOptional()
  @IsString()
  bodyText?: string;
}

