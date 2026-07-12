import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { LeaderboardController } from './leaderboard.controller';
import { DashboardService } from './dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [DashboardController, LeaderboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
