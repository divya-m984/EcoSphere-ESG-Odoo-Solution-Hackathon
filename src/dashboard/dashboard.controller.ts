import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { DashboardService } from './dashboard.service';
import { TrendQueryDto } from './dto/trend-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('carbon/summary')
  @ApiOperation({
    summary:
      'Total emissions for the current (or given) period vs. the previous one. Admin/ESG_Manager see company-wide totals; Employee sees only their own commute contribution.',
  })
  getCarbonSummary(@CurrentUser() user: AuthenticatedUser, @Query() query: PeriodQueryDto) {
    return this.dashboardService.getCarbonSummary(user.role, user.employeeId, query);
  }

  @Get('carbon/trend')
  @ApiOperation({ summary: 'Monthly emission time series for the last N months (default 12)' })
  getCarbonTrend(@CurrentUser() user: AuthenticatedUser, @Query() query: TrendQueryDto) {
    return this.dashboardService.getCarbonTrend(user.role, user.employeeId, query);
  }

  @Get('carbon/top-sources')
  @ApiOperation({
    summary: 'Top emission-factor categories (activityType) by total kgCO2e for a period',
  })
  getTopSources(@Query() query: PeriodQueryDto) {
    return this.dashboardService.getTopSources(query);
  }

  @Get('carbon/top-departments')
  @ApiOperation({ summary: 'Department leaderboard by total emissions for a period' })
  getTopDepartments(@Query() query: PeriodQueryDto) {
    return this.dashboardService.getTopDepartments(query);
  }

  @Get('carbon/me')
  @ApiOperation({ summary: "The authenticated employee's own monthly commute-emission history" })
  getMyCarbonHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getMyCarbonHistory(user.employeeId);
  }
}
