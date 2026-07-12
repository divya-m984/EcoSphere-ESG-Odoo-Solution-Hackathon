import { Module } from '@nestjs/common';
import { AdminCarbonEngineController } from './admin-carbon-engine.controller';
import { CarbonEngineService } from './carbon-engine.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmissionFactorsModule } from '../emission-factors/emission-factors.module';

@Module({
  imports: [PrismaModule, AuthModule, EmissionFactorsModule],
  controllers: [AdminCarbonEngineController],
  providers: [CarbonEngineService],
  exports: [CarbonEngineService],
})
export class CarbonEngineModule {}
