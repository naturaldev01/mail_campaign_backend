import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class FilterCsvDto {
  @IsString()
  filterField: string; // e.g., timezone, country, language

  @IsIn(['equals', 'contains', 'in'])
  operator: 'equals' | 'contains' | 'in';

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsArray()
  values?: string[];

  @IsOptional()
  @IsString()
  audienceName?: string;

  @IsOptional()
  @IsString()
  timezoneFallback?: string;
}

