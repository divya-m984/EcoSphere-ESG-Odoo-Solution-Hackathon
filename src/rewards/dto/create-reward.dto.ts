import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { RewardStatus } from '@prisma/client';

export class CreateRewardDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsInt()
  @Min(1)
  pointsRequired!: number;

  @IsInt()
  @Min(0)
  stock!: number;

  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;
}
