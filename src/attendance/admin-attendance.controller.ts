import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AttendanceService } from './attendance.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@ApiTags('Admin — Attendance')
@Controller('admin/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  @ApiOperation({
    summary: 'List/filter attendance records by employee, department, status, and period',
  })
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.adminFindAll(query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Correct an attendance record (date/status/transport override)' })
  update(@Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.adminUpdate(id, dto);
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Mark attendance for multiple employees at once (e.g. company holiday)',
  })
  bulkMark(@Body() dto: BulkAttendanceDto) {
    return this.attendanceService.adminBulkMark(dto);
  }
}
