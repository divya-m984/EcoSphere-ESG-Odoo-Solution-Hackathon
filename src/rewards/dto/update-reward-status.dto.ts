import { IsEnum } from 'class-validator';
import { RewardStatus } from '@prisma/client';

export class UpdateRewardStatusDto {
  @IsEnum(RewardStatus)
  status!: RewardStatus;
}
