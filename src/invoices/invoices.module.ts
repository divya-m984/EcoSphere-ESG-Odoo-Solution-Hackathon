import { Module } from '@nestjs/common';
import { AdminInvoicesController } from './admin-invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CarbonEngineModule } from '../carbon-engine/carbon-engine.module';

@Module({
  imports: [PrismaModule, AuthModule, CarbonEngineModule],
  controllers: [AdminInvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
