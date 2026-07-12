import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AdminAttendanceController } from './admin-attendance.controller';
import { AttendanceService } from './attendance.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CarbonEngineModule } from '../carbon-engine/carbon-engine.module';

@Module({
  imports: [PrismaModule, AuthModule, CarbonEngineModule],
  controllers: [AttendanceController, AdminAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
