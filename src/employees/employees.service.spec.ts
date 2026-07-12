import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransportMode } from '@prisma/client';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';

const EMPLOYEE_ID = 'emp-uuid';

const activeEmployee = { id: EMPLOYEE_ID, active: true };

const commuteProfile = {
  id: 'profile-uuid',
  employeeId: EMPLOYEE_ID,
  transportMode: TransportMode.Car_Petrol,
  distanceKm: 12,
  roundTrip: true,
  active: true,
};

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    employee: {
      findUnique: jest.fn().mockResolvedValue(activeEmployee),
    },
    employeeCommuteProfile: {
      findUnique: jest.fn().mockResolvedValue(commuteProfile),
      upsert: jest.fn().mockResolvedValue(commuteProfile),
    },
    ...overrides,
  };
}

describe('EmployeesService', () => {
  function build(overrides: Record<string, any> = {}) {
    const prisma = makePrisma(overrides);
    const service = new EmployeesService(prisma as unknown as PrismaService);
    return { service, prisma };
  }

  describe('getMyCommuteProfile', () => {
    it('rejects when the caller has no employeeId', async () => {
      const { service } = build();
      await expect(service.getMyCommuteProfile(null)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when no profile exists', async () => {
      const { service } = build({
        employeeCommuteProfile: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      await expect(service.getMyCommuteProfile(EMPLOYEE_ID)).rejects.toThrow(NotFoundException);
    });

    it('returns the profile when set', async () => {
      const { service } = build();
      const result = await service.getMyCommuteProfile(EMPLOYEE_ID);
      expect(result).toEqual(commuteProfile);
    });
  });

  describe('upsertCommuteProfile', () => {
    it('throws NotFoundException for an unknown/inactive employee', async () => {
      const { service } = build({
        employee: { findUnique: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.upsertCommuteProfile(EMPLOYEE_ID, {
          transportMode: TransportMode.Car_Petrol,
          distanceKm: 12,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts on the employeeId unique key with roundTrip default true', async () => {
      const { service, prisma } = build();

      await service.upsertCommuteProfile(EMPLOYEE_ID, {
        transportMode: TransportMode.Car_Petrol,
        distanceKm: 12,
      });

      expect(prisma.employeeCommuteProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeId: EMPLOYEE_ID },
          create: expect.objectContaining({ roundTrip: true }),
        }),
      );
    });
  });
});
