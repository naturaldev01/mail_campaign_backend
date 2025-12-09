import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContactDto {
  @IsUUID()
  audienceId: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  attributes?: Record<string, any>;
}

