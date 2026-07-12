import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { EmployeesService } from './employees.service';
import { UpsertCommuteProfileDto } from './dto/upsert-commute-profile.dto';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get('me/commute-profile')
  @ApiOperation({ summary: "Get the authenticated employee's commute profile" })
  getMyCommuteProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.employeesService.getMyCommuteProfile(user.employeeId);
  }

  @Put('me/commute-profile')
  @ApiOperation({ summary: "Create or update the authenticated employee's commute profile" })
  upsertMyCommuteProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertCommuteProfileDto,
  ) {
    return this.employeesService.upsertMyCommuteProfile(user.employeeId, dto);
  }
}
