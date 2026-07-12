import { ConflictException, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, EmissionSource, TransportMode } from '@prisma/client';
import { CarbonEngineService } from './carbon-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmissionFactorsService } from '../emission-factors/emission-factors.service';

const EMPLOYEE_ID = 'emp-uuid';

const employee = {
  id: EMPLOYEE_ID,
  active: true,
  department: { id: 'dept-uuid', countryCode: 'US' },
};

const commuteProfile = {
  employeeId: EMPLOYEE_ID,
  transportMode: TransportMode.Car_Petrol,
  distanceKm: 10,
  roundTrip: true,
  active: true,
};

const carFactor = {
  id: 'factor-car',
  activityType: TransportMode.Car_Petrol,
  unit: 'km',
  region: 'US',
  factorValue: 0.2,
  source: EmissionSource.DEFRA,
  validYear: 2026,
  active: true,
};

const bikeFactor = {
  ...carFactor,
  id: 'factor-bike',
  activityType: TransportMode.Bicycle,
  factorValue: 0,
};

function makeAttendance(
  dates: string[],
  status: AttendanceStatus = AttendanceStatus.Present,
  override?: TransportMode,
) {
  return dates.map((date) => ({
    employeeId: EMPLOYEE_ID,
    date: new Date(date),
    status,
    transportModeOverride: override ?? null,
    active: true,
  }));
}

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    employee: {
      findUnique: jest.fn().mockResolvedValue(employee),
      findMany: jest.fn().mockResolvedValue([{ id: EMPLOYEE_ID }]),
    },
    employeeCommuteProfile: { findUnique: jest.fn().mockResolvedValue(commuteProfile) },
    attendance: {
      findMany: jest.fn().mockResolvedValue(makeAttendance(['2026-06-01', '2026-06-02'])),
    },
    employeeMonthlyEmission: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'ame-uuid' })),
      update: jest
        .fn()
        .mockImplementation(({ data }: any) => Promise.resolve({ ...data, id: 'ame-uuid' })),
    },
    ...overrides,
  };
}

function makeEmissionFactorsService(resolveFactorImpl?: (...args: any[]) => any): any {
  return {
    resolveFactor: jest
      .fn()
      .mockImplementation(resolveFactorImpl ?? (() => Promise.resolve(carFactor))),
  };
}

describe('CarbonEngineService', () => {
  function build(
    prismaOverrides: Record<string, any> = {},
    resolveFactorImpl?: (...args: any[]) => any,
  ) {
    const prisma = makePrisma(prismaOverrides);
    const emissionFactorsService = makeEmissionFactorsService(resolveFactorImpl);
    const service = new CarbonEngineService(
      prisma as unknown as PrismaService,
      emissionFactorsService as unknown as EmissionFactorsService,
    );
    return { service, prisma, emissionFactorsService };
  }

  describe('recalculateEmployeeMonth', () => {
    it('throws NotFoundException for an unknown employee', async () => {
      const { service } = build({ employee: { findUnique: jest.fn().mockResolvedValue(null) } });
      await expect(service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('computes round-trip distance and emission across attended days only (Present, not WFH/Leave)', async () => {
      // The real `where: { status: Present }` clause filters WFH/Leave rows out at
      // the DB level — this mock returns only what Postgres would actually return.
      const attendanceRows = makeAttendance(['2026-06-01', '2026-06-02'], AttendanceStatus.Present);
      const { service, prisma } = build({
        attendance: { findMany: jest.fn().mockResolvedValue(attendanceRows) },
      });

      const result = await service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6);

      // 2 Present days * 10km * roundTrip(2) = 40km; emission = 40 * 0.2 = 8
      expect(result.totalDistanceKm).toBeCloseTo(40);
      expect(result.totalEmissionKgCo2e).toBeCloseTo(8);
      expect(result.attendedDays).toBe(2);
      expect(prisma.employeeMonthlyEmission.create).toHaveBeenCalled();
    });

    it('uses the per-day transportModeOverride instead of the profile default', async () => {
      const attendanceRows = makeAttendance(
        ['2026-06-01'],
        AttendanceStatus.Present,
        TransportMode.Bicycle,
      );
      const resolveFactor = jest
        .fn()
        .mockImplementation((activityType: string) =>
          Promise.resolve(activityType === TransportMode.Bicycle ? bikeFactor : carFactor),
        );
      const { service } = build(
        { attendance: { findMany: jest.fn().mockResolvedValue(attendanceRows) } },
        resolveFactor,
      );

      const result = await service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6);

      expect(resolveFactor).toHaveBeenCalledWith(TransportMode.Bicycle, 'US', 'km', 2026);
      expect(result.totalEmissionKgCo2e).toBeCloseTo(0); // bicycle factor is 0
    });

    it('returns zero distance/emission when the employee has no commute profile, but still counts attended days', async () => {
      const { service } = build({
        employeeCommuteProfile: { findUnique: jest.fn().mockResolvedValue(null) },
        attendance: {
          findMany: jest.fn().mockResolvedValue(makeAttendance(['2026-06-01', '2026-06-02'])),
        },
      });

      const result = await service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6);

      expect(result.totalDistanceKm).toBeCloseTo(0);
      expect(result.totalEmissionKgCo2e).toBeCloseTo(0);
      expect(result.attendedDays).toBe(2);
    });

    it('retries the recompute on an optimistic-concurrency conflict (P2025) and eventually succeeds', async () => {
      const existing = {
        employeeId: EMPLOYEE_ID,
        periodYear: 2026,
        periodMonth: 6,
        version: 3,
      };
      const update = jest
        .fn()
        .mockRejectedValueOnce({ code: 'P2025' })
        .mockResolvedValueOnce({ ...existing, version: 4 });

      const { service, prisma } = build({
        employeeMonthlyEmission: {
          findUnique: jest.fn().mockResolvedValue(existing),
          create: jest.fn(),
          update,
        },
      });

      const result = await service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6);

      expect(update).toHaveBeenCalledTimes(2);
      expect(result.version).toBe(4);
      expect(prisma.employeeMonthlyEmission.create).not.toHaveBeenCalled();
    });

    it('gives up after MAX_RECALC_ATTEMPTS of continuous conflicts', async () => {
      const existing = { employeeId: EMPLOYEE_ID, periodYear: 2026, periodMonth: 6, version: 3 };
      const { service } = build({
        employeeMonthlyEmission: {
          findUnique: jest.fn().mockResolvedValue(existing),
          create: jest.fn(),
          update: jest.fn().mockRejectedValue({ code: 'P2025' }),
        },
      });

      await expect(service.recalculateEmployeeMonth(EMPLOYEE_ID, 2026, 6)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('calculateInvoiceEmission', () => {
    it('multiplies quantity by the resolved factor value', async () => {
      const { service, emissionFactorsService } = build();

      const result = await service.calculateInvoiceEmission('Electricity', 'US', 'kWh', 100, 2026);

      expect(emissionFactorsService.resolveFactor).toHaveBeenCalledWith(
        'Electricity',
        'US',
        'kWh',
        2026,
      );
      expect(result.calculatedEmission).toBeCloseTo(20); // 100 * 0.2
      expect(result.factor).toEqual(carFactor);
    });

    it('propagates NotFoundException when no factor can be resolved', async () => {
      const { service } = build({}, () => Promise.reject(new NotFoundException('no factor')));

      await expect(
        service.calculateInvoiceEmission('Electricity', 'US', 'kWh', 100, 2026),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
