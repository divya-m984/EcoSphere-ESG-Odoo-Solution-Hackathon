import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('me')
  @ApiOperation({
    summary: "Mark the authenticated employee's attendance for a given date (upserts)",
  })
  markMyAttendance(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.markMyAttendance(user.employeeId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: "Get the authenticated employee's attendance history" })
  getMyAttendance(@CurrentUser() user: AuthenticatedUser, @Query() query: QueryAttendanceDto) {
    return this.attendanceService.findMyAttendance(user.employeeId, query);
  }
}
