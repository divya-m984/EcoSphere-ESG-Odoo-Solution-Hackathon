import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { AdminRewardsController } from './admin-rewards.controller';
import { RewardsService } from './rewards.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [RewardsController, AdminRewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
