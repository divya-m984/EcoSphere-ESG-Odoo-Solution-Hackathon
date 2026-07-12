import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ReportFormat } from './dto/report-query.dto';
import { renderExcel, renderPdf, type ReportDocument } from './report-renderer';

function currentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboardService: DashboardService,
  ) {}

  private async render(doc: ReportDocument, format?: ReportFormat) {
    if (format === ReportFormat.Xlsx) {
      return {
        buffer: await renderExcel(doc),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        extension: 'xlsx',
      };
    }
    return { buffer: await renderPdf(doc), contentType: 'application/pdf', extension: 'pdf' };
  }

  async buildMonthlyReport(
    year: number | undefined,
    month: number | undefined,
    format?: ReportFormat,
  ) {
    const period = year && month ? { year, month } : currentPeriod();
    const [breakdown, topSources, topDepartments] = await Promise.all([
      this.dashboardService.getPeriodBreakdown(period.year, period.month),
      this.dashboardService.getTopSources(period),
      this.dashboardService.getTopDepartments(period),
    ]);

    const doc: ReportDocument = {
      title: 'Monthly Carbon Emissions Report',
      subtitle: `${period.year}-${String(period.month).padStart(2, '0')}`,
      sections: [
        {
          title: 'Summary',
          summary: [
            { label: 'Total Emission (kgCO2e)', value: breakdown.totalEmissionKgCo2e.toFixed(2) },
            {
              label: 'Commuting Emission (kgCO2e)',
              value: breakdown.commuteEmissionKgCo2e.toFixed(2),
            },
            {
              label: 'Operational Emission (kgCO2e)',
              value: breakdown.operationalEmissionKgCo2e.toFixed(2),
            },
          ],
        },
        {
          title: 'Top Emission Sources',
          table: {
            headers: ['Category', 'Emission (kgCO2e)'],
            rows: topSources.sources.map((s) => [s.activityType, s.emissionKgCo2e.toFixed(2)]),
          },
        },
        {
          title: 'Top Emitting Departments',
          table: {
            headers: ['Department', 'Emission (kgCO2e)'],
            rows: topDepartments.departments.map((d) => [
              d.departmentName,
              d.emissionKgCo2e.toFixed(2),
            ]),
          },
        },
      ],
    };

    return this.render(doc, format);
  }

  async buildYearlyReport(year: number | undefined, format?: ReportFormat) {
    const targetYear = year ?? currentPeriod().year;
    const monthlyBreakdowns = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        this.dashboardService.getPeriodBreakdown(targetYear, i + 1),
      ),
    );

    const totals = monthlyBreakdowns.reduce(
      (acc, b) => ({
        total: acc.total + b.totalEmissionKgCo2e,
        commute: acc.commute + b.commuteEmissionKgCo2e,
        operational: acc.operational + b.operationalEmissionKgCo2e,
      }),
      { total: 0, commute: 0, operational: 0 },
    );

    const doc: ReportDocument = {
      title: 'Yearly Carbon Emissions Report',
      subtitle: `${targetYear}`,
      sections: [
        {
          title: 'Summary',
          summary: [
            { label: 'Total Emission (kgCO2e)', value: totals.total.toFixed(2) },
            { label: 'Commuting Emission (kgCO2e)', value: totals.commute.toFixed(2) },
            { label: 'Operational Emission (kgCO2e)', value: totals.operational.toFixed(2) },
          ],
        },
        {
          title: 'Monthly Breakdown',
          table: {
            headers: ['Month', 'Commuting (kgCO2e)', 'Operational (kgCO2e)', 'Total (kgCO2e)'],
            rows: monthlyBreakdowns.map((b) => [
              b.period.month,
              b.commuteEmissionKgCo2e.toFixed(2),
              b.operationalEmissionKgCo2e.toFixed(2),
              b.totalEmissionKgCo2e.toFixed(2),
            ]),
          },
        },
      ],
    };

    return this.render(doc, format);
  }

  async buildDepartmentReport(
    departmentId: string,
    year: number | undefined,
    month: number | undefined,
    format?: ReportFormat,
  ) {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || !department.active) {
      throw new NotFoundException(`Department ${departmentId} not found`);
    }

    const period = year && month ? { year, month } : currentPeriod();
    const { start, end } = {
      start: new Date(Date.UTC(period.year, period.month - 1, 1)),
      end: new Date(Date.UTC(period.year, period.month, 1)),
    };

    const [operationalTxns, monthlyEmissions] = await Promise.all([
      this.prisma.carbonTransaction.findMany({
        where: { active: true, departmentId, txnDate: { gte: start, lt: end } },
        include: { emissionFactor: { select: { activityType: true } } },
      }),
      this.prisma.employeeMonthlyEmission.findMany({
        where: {
          periodYear: period.year,
          periodMonth: period.month,
          employee: { departmentId },
        },
        include: { employee: { select: { name: true } } },
      }),
    ]);

    const operationalTotal = operationalTxns.reduce(
      (sum, t) => sum + Number(t.calculatedEmission),
      0,
    );
    const commuteTotal = monthlyEmissions.reduce(
      (sum, m) => sum + Number(m.totalEmissionKgCo2e),
      0,
    );

    const doc: ReportDocument = {
      title: 'Department Carbon Emissions Report',
      subtitle: `${department.name} — ${period.year}-${String(period.month).padStart(2, '0')}`,
      sections: [
        {
          title: 'Summary',
          summary: [
            {
              label: 'Total Emission (kgCO2e)',
              value: (operationalTotal + commuteTotal).toFixed(2),
            },
            { label: 'Commuting Emission (kgCO2e)', value: commuteTotal.toFixed(2) },
            { label: 'Operational Emission (kgCO2e)', value: operationalTotal.toFixed(2) },
          ],
        },
        {
          title: 'Operational Emissions by Category',
          table: {
            headers: ['Category', 'Emission (kgCO2e)'],
            rows: operationalTxns.map((t) => [
              t.emissionFactor.activityType,
              Number(t.calculatedEmission).toFixed(2),
            ]),
          },
        },
        {
          title: 'Employee Commuting Emissions',
          table: {
            headers: ['Employee', 'Attended Days', 'Emission (kgCO2e)'],
            rows: monthlyEmissions.map((m) => [
              m.employee.name,
              m.attendedDays,
              Number(m.totalEmissionKgCo2e).toFixed(2),
            ]),
          },
        },
      ],
    };

    return this.render(doc, format);
  }

  async buildEmployeeReport(employeeId: string, year: number | undefined, format?: ReportFormat) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: { select: { name: true } } },
    });
    if (!employee || !employee.active) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const history = await this.prisma.employeeMonthlyEmission.findMany({
      where: { employeeId, ...(year ? { periodYear: year } : {}) },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });

    const totalEmission = history.reduce((sum, h) => sum + Number(h.totalEmissionKgCo2e), 0);

    const doc: ReportDocument = {
      title: 'Employee Carbon Emissions Report',
      subtitle: `${employee.name} — ${employee.department.name}${year ? ` — ${year}` : ''}`,
      sections: [
        {
          title: 'Summary',
          summary: [
            { label: 'Total Commuting Emission (kgCO2e)', value: totalEmission.toFixed(2) },
          ],
        },
        {
          title: 'Monthly History',
          table: {
            headers: ['Year', 'Month', 'Attended Days', 'Distance (km)', 'Emission (kgCO2e)'],
            rows: history.map((h) => [
              h.periodYear,
              h.periodMonth,
              h.attendedDays,
              Number(h.totalDistanceKm).toFixed(2),
              Number(h.totalEmissionKgCo2e).toFixed(2),
            ]),
          },
        },
      ],
    };

    return this.render(doc, format);
  }
}
