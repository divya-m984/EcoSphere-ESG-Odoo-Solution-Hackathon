import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';

/**
 * These are the first file-download endpoints in this codebase — they use a raw
 * Express `Response` (`@Res({ passthrough: false })`) to stream a PDF/XLSX buffer
 * with the correct Content-Type/Content-Disposition, instead of the app's usual
 * plain-return-value controller style.
 */
@ApiTags('Admin — Reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('carbon/monthly')
  @ApiOperation({ summary: 'Company-wide monthly carbon report (PDF or Excel)' })
  async monthly(@Query() query: ReportQueryDto, @Res({ passthrough: false }) res: Response) {
    const { buffer, contentType, extension } = await this.reportsService.buildMonthlyReport(
      query.year,
      query.month,
      query.format,
    );
    this.send(res, buffer, contentType, `carbon-monthly-report.${extension}`);
  }

  @Get('carbon/yearly')
  @ApiOperation({ summary: 'Company-wide yearly carbon report (PDF or Excel)' })
  async yearly(@Query() query: ReportQueryDto, @Res({ passthrough: false }) res: Response) {
    const { buffer, contentType, extension } = await this.reportsService.buildYearlyReport(
      query.year,
      query.format,
    );
    this.send(res, buffer, contentType, `carbon-yearly-report.${extension}`);
  }

  @Get('carbon/department/:departmentId')
  @ApiOperation({ summary: 'Department carbon report for a given period (PDF or Excel)' })
  async department(
    @Param('departmentId') departmentId: string,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { buffer, contentType, extension } = await this.reportsService.buildDepartmentReport(
      departmentId,
      query.year,
      query.month,
      query.format,
    );
    this.send(res, buffer, contentType, `carbon-department-report.${extension}`);
  }

  @Get('carbon/employee/:employeeId')
  @ApiOperation({ summary: 'Employee commuting emissions report for a given year (PDF or Excel)' })
  async employee(
    @Param('employeeId') employeeId: string,
    @Query() query: ReportQueryDto,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { buffer, contentType, extension } = await this.reportsService.buildEmployeeReport(
      employeeId,
      query.year,
      query.format,
    );
    this.send(res, buffer, contentType, `carbon-employee-report.${extension}`);
  }

  private send(res: Response, buffer: Buffer, contentType: string, fileName: string) {
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
