import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CarbonEngineService } from './carbon-engine.service';
import { RecalculateDto } from './dto/recalculate.dto';

@ApiTags('Admin — Carbon Engine')
@Controller('admin/carbon-engine')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminCarbonEngineController {
  constructor(private readonly carbonEngineService: CarbonEngineService) {}

  @Post('recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Manually re-run commuting emission recalculation for one/many employees, or all employees, for a given period',
  })
  recalculate(@Body() dto: RecalculateDto) {
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      return this.carbonEngineService.recalculateEmployeeMonthsBulk(
        dto.employeeIds,
        dto.year,
        dto.month,
      );
    }
    return this.carbonEngineService.recalculateAllEmployeesMonth(dto.year, dto.month);
  }
}
