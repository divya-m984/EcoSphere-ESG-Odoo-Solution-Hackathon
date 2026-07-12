import { NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { ReportFormat } from './dto/report-query.dto';

const DEPARTMENT_ID = 'dept-uuid';
const EMPLOYEE_ID = 'emp-uuid';

function makeBreakdown(year: number, month: number) {
  return {
    period: { year, month },
    commuteEmissionKgCo2e: 10,
    operationalEmissionKgCo2e: 20,
    totalEmissionKgCo2e: 30,
  };
}

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    department: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: DEPARTMENT_ID, name: 'Engineering', active: true }),
    },
    carbonTransaction: { findMany: jest.fn().mockResolvedValue([]) },
    employeeMonthlyEmission: { findMany: jest.fn().mockResolvedValue([]) },
    employee: {
      findUnique: jest.fn().mockResolvedValue({
        id: EMPLOYEE_ID,
        name: 'Alex Green',
        active: true,
        department: { name: 'Engineering' },
      }),
    },
    ...overrides,
  };
}

function makeDashboardService(): any {
  return {
    getPeriodBreakdown: jest
      .fn()
      .mockImplementation((year: number, month: number) =>
        Promise.resolve(makeBreakdown(year, month)),
      ),
    getTopSources: jest
      .fn()
      .mockResolvedValue({ sources: [{ activityType: 'Electricity', emissionKgCo2e: 20 }] }),
    getTopDepartments: jest.fn().mockResolvedValue({
      departments: [
        { departmentId: DEPARTMENT_ID, departmentName: 'Engineering', emissionKgCo2e: 30 },
      ],
    }),
  };
}

describe('ReportsService', () => {
  function build(prismaOverrides: Record<string, any> = {}) {
    const prisma = makePrisma(prismaOverrides);
    const dashboardService = makeDashboardService();
    const service = new ReportsService(
      prisma as unknown as PrismaService,
      dashboardService as unknown as DashboardService,
    );
    return { service, prisma, dashboardService };
  }

  describe('buildMonthlyReport', () => {
    it('produces a non-empty PDF buffer starting with the %PDF magic bytes', async () => {
      const { service } = build();

      const result = await service.buildMonthlyReport(2026, 6, ReportFormat.Pdf);

      expect(result.contentType).toBe('application/pdf');
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
    });

    it('produces a non-empty XLSX buffer starting with the PK zip signature', async () => {
      const { service } = build();

      const result = await service.buildMonthlyReport(2026, 6, ReportFormat.Xlsx);

      expect(result.contentType).toContain('spreadsheetml');
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.buffer.subarray(0, 2).toString()).toBe('PK');
    });
  });

  describe('buildYearlyReport', () => {
    it('sums 12 monthly breakdowns into the yearly total', async () => {
      const { service, dashboardService } = build();

      const result = await service.buildYearlyReport(2026, ReportFormat.Pdf);

      expect(dashboardService.getPeriodBreakdown).toHaveBeenCalledTimes(12);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('buildDepartmentReport', () => {
    it('throws NotFoundException for an unknown department', async () => {
      const { service } = build({ department: { findUnique: jest.fn().mockResolvedValue(null) } });

      await expect(
        service.buildDepartmentReport('missing-dept', 2026, 6, ReportFormat.Pdf),
      ).rejects.toThrow(NotFoundException);
    });

    it('builds a report for a known department', async () => {
      const { service } = build();

      const result = await service.buildDepartmentReport(DEPARTMENT_ID, 2026, 6, ReportFormat.Pdf);

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });

  describe('buildEmployeeReport', () => {
    it('throws NotFoundException for an unknown employee', async () => {
      const { service } = build({ employee: { findUnique: jest.fn().mockResolvedValue(null) } });

      await expect(
        service.buildEmployeeReport('missing-emp', 2026, ReportFormat.Pdf),
      ).rejects.toThrow(NotFoundException);
    });

    it('builds a report for a known employee', async () => {
      const { service } = build();

      const result = await service.buildEmployeeReport(EMPLOYEE_ID, 2026, ReportFormat.Xlsx);

      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });
});
