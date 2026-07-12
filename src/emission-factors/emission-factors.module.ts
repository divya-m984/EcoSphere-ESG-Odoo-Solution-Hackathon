import { Module } from '@nestjs/common';
import { AdminEmissionFactorsController } from './admin-emission-factors.controller';
import { EmissionFactorsService } from './emission-factors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AdminEmissionFactorsController],
  providers: [EmissionFactorsService],
  exports: [EmissionFactorsService],
})
export class EmissionFactorsModule {}
