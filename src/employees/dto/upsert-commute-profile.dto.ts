import { IsBoolean, IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { TransportMode } from '@prisma/client';

export class UpsertCommuteProfileDto {
  @IsEnum(TransportMode)
  transportMode!: TransportMode;

  @IsNumber()
  @Min(0)
  distanceKm!: number;

  @IsOptional()
  @IsBoolean()
  roundTrip?: boolean;
}
