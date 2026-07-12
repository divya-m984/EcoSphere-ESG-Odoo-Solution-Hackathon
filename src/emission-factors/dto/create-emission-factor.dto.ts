import {
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

export class CreateEmissionFactorDto {
  @IsString()
  @MinLength(1)
  activityType!: string;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsString()
  @MinLength(1)
  region!: string;

  @IsNumber()
  @Min(0)
  factorValue!: number;

  @IsEnum(EmissionSource)
  source!: EmissionSource;

  @IsInt()
  @Min(1900)
  validYear!: number;

  @IsOptional()
  @IsUrl()
  referenceUrl?: string;
}
