import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EmissionSource } from '@prisma/client';

export class QueryEmissionFactorsDto {
  @IsOptional()
  @IsString()
  activityType?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsEnum(EmissionSource)
  source?: EmissionSource;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  validYear?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
