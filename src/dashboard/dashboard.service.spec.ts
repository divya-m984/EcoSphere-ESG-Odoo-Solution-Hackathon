import { ForbiddenException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

const EMPLOYEE_ID = 'emp-uuid';

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    employeeMonthlyEmission: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { totalEmissionKgCo2e: 10 } }),
      findUnique: jest.fn().mockResolvedValue({ totalEmissionKgCo2e: 5 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    carbonTransaction: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { calculatedEmission: 20 } }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    department: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    ...overrides,
  };
}

describe('DashboardService', () => {
  function build(overrides: Record<string, any> = {}) {
    const prisma = makePrisma(overrides);
    const service = new DashboardService(prisma as unknown as PrismaService);
    return { service, prisma };
  }

  describe('getCarbonSummary', () => {
    it('scopes an Employee to only their own commute emission, not company totals', async () => {
      const { service, prisma } = build();

      const result = await service.getCarbonSummary('Employee', EMPLOYEE_ID, {});

      expect(result.scope).toBe('employee');
      expect((result as any).commuteEmissionKgCo2e).toBe(5);
      expect(prisma.carbonTransaction.aggregate).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for an Employee with no linked employeeId', async () => {
      const { service } = build();
      await expect(service.getCarbonSummary('Employee', null, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns company-wide commute + operational totals for Admin', async () => {
      const { service } = build();

      const result = await service.getCarbonSummary('Admin', null, {});

      expect(result.scope).toBe('company');
      expect((result as any).totalEmissionKgCo2e).toBe(30); // commute(10) + operational(20)
    });
  });

  describe('getCarbonTrend', () => {
    it('returns one series entry per month requested', async () => {
      const { service } = build();

      const result = await service.getCarbonTrend('Admin', null, { months: 3 });

      expect(result.series).toHaveLength(3);
    });

    it('scopes the trend to the employee series when role is Employee', async () => {
      const { service } = build();

      const result = await service.getCarbonTrend('Employee', EMPLOYEE_ID, { months: 2 });

      expect(result.scope).toBe('employee');
      expect(result.series).toHaveLength(2);
    });
  });

  describe('getTopSources', () => {
    it('aggregates calculatedEmission by emissionFactor.activityType, sorted descending', async () => {
      const { service } = build({
        carbonTransaction: {
          findMany: jest.fn().mockResolvedValue([
            { calculatedEmission: 5, emissionFactor: { activityType: 'Electricity' } },
            { calculatedEmission: 15, emissionFactor: { activityType: 'Fuel' } },
            { calculatedEmission: 3, emissionFactor: { activityType: 'Electricity' } },
          ]),
        },
      });

      const result = await service.getTopSources({});

      expect(result.sources[0]).toEqual({ activityType: 'Fuel', emissionKgCo2e: 15 });
      expect(result.sources[1]).toEqual({ activityType: 'Electricity', emissionKgCo2e: 8 });
    });
  });

  describe('getMyCarbonHistory', () => {
    it('throws ForbiddenException when there is no employeeId', async () => {
      const { service } = build();
      await expect(service.getMyCarbonHistory(null)).rejects.toThrow(ForbiddenException);
    });
  });
});
