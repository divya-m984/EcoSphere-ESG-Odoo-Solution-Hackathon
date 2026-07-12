import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { EmissionSource } from '@prisma/client';

export class UpdateEmissionFactorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  activityType?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  unit?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  region?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  factorValue?: number;

  @IsOptional()
  @IsEnum(EmissionSource)
  source?: EmissionSource;

  @IsOptional()
  @IsInt()
  @Min(1900)
  validYear?: number;

  @IsOptional()
  @IsUrl()
  referenceUrl?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
