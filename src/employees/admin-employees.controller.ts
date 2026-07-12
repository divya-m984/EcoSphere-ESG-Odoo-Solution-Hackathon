import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmployeesService } from './employees.service';
import { UpsertCommuteProfileDto } from './dto/upsert-commute-profile.dto';

@ApiTags('Admin — Employees')
@Controller('admin/employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminEmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get(':employeeId/commute-profile')
  @ApiOperation({ summary: "Get an employee's commute profile" })
  getCommuteProfile(@Param('employeeId') employeeId: string) {
    return this.employeesService.getCommuteProfile(employeeId);
  }

  @Put(':employeeId/commute-profile')
  @ApiOperation({ summary: "Create or correct an employee's commute profile" })
  upsertCommuteProfile(
    @Param('employeeId') employeeId: string,
    @Body() dto: UpsertCommuteProfileDto,
  ) {
    return this.employeesService.upsertCommuteProfile(employeeId, dto);
  }
}
