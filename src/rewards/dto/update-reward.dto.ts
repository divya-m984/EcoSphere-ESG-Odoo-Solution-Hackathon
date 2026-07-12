import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { RewardStatus } from '@prisma/client';

export class UpdateRewardDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pointsRequired?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;
}
