import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, TransportMode } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { CarbonEngineService } from '../carbon-engine/carbon-engine.service';

const EMPLOYEE_ID = 'emp-uuid';

const attendanceRecord = {
  id: 'att-uuid',
  employeeId: EMPLOYEE_ID,
  date: new Date('2020-01-15'),
  status: AttendanceStatus.Present,
  transportModeOverride: null,
  active: true,
};

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    attendance: {
      upsert: jest.fn().mockResolvedValue(attendanceRecord),
      findMany: jest.fn().mockResolvedValue([attendanceRecord]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(attendanceRecord),
      update: jest.fn().mockResolvedValue(attendanceRecord),
    },
    ...overrides,
  };
}

function makeCarbonEngineService(): any {
  return { recalculateEmployeeMonth: jest.fn().mockResolvedValue({}) };
}

describe('AttendanceService', () => {
  function build(prismaOverrides: Record<string, any> = {}) {
    const prisma = makePrisma(prismaOverrides);
    const carbonEngineService = makeCarbonEngineService();
    const service = new AttendanceService(
      prisma as unknown as PrismaService,
      carbonEngineService as unknown as CarbonEngineService,
    );
    return { service, prisma, carbonEngineService };
  }

  describe('markMyAttendance', () => {
    it('rejects when the caller has no employeeId', async () => {
      const { service } = build();
      await expect(
        service.markMyAttendance(null, { date: '2020-01-15', status: AttendanceStatus.Present }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a future date', async () => {
      const { service } = build();
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
      await expect(
        service.markMyAttendance(EMPLOYEE_ID, {
          date: futureDate,
          status: AttendanceStatus.Present,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('upserts on [employeeId, date] and triggers recalculation for that month', async () => {
      const { service, prisma, carbonEngineService } = build();

      await service.markMyAttendance(EMPLOYEE_ID, {
        date: '2020-01-15',
        status: AttendanceStatus.WFH,
      });

      expect(prisma.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            uq_attendance_employee_date: { employeeId: EMPLOYEE_ID, date: expect.any(Date) },
          },
        }),
      );
      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        2020,
        1,
      );
    });

    it('accepts a transportModeOverride', async () => {
      const { service, prisma } = build();

      await service.markMyAttendance(EMPLOYEE_ID, {
        date: '2020-01-15',
        status: AttendanceStatus.Present,
        transportModeOverride: TransportMode.Bicycle,
      });

      expect(prisma.attendance.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ transportModeOverride: TransportMode.Bicycle }),
        }),
      );
    });
  });

  describe('adminUpdate', () => {
    it('throws NotFoundException for an unknown record', async () => {
      const { service } = build({ attendance: { findUnique: jest.fn().mockResolvedValue(null) } });
      await expect(service.adminUpdate('missing-id', {})).rejects.toThrow(NotFoundException);
    });

    it('recalculates only the original month when the date does not change', async () => {
      const { service, carbonEngineService } = build();

      await service.adminUpdate('att-uuid', { status: AttendanceStatus.Leave });

      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenCalledTimes(1);
      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenCalledWith(
        EMPLOYEE_ID,
        2020,
        1,
      );
    });

    it('recalculates both the old and new month when the date is corrected across a month boundary', async () => {
      const { service, carbonEngineService } = build();

      await service.adminUpdate('att-uuid', { date: '2020-02-01' });

      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenCalledTimes(2);
      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenNthCalledWith(
        1,
        EMPLOYEE_ID,
        2020,
        1,
      );
      expect(carbonEngineService.recalculateEmployeeMonth).toHaveBeenNthCalledWith(
        2,
        EMPLOYEE_ID,
        2020,
        2,
      );
    });
  });

  describe('adminBulkMark', () => {
    it('marks attendance for every employee in the list', async () => {
      const { service, prisma } = build();

      await service.adminBulkMark({
        employeeIds: ['emp-1', 'emp-2'],
        date: '2020-01-15',
        status: AttendanceStatus.Holiday,
      });

      expect(prisma.attendance.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
