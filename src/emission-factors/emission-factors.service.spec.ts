import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmissionSource } from '@prisma/client';
import { EmissionFactorsService } from './emission-factors.service';
import { PrismaService } from '../prisma/prisma.service';

const FACTOR_ID = 'factor-uuid';

const usFactor2026 = {
  id: FACTOR_ID,
  activityType: 'Electricity',
  unit: 'kWh',
  region: 'US',
  factorValue: 0.4,
  source: EmissionSource.DEFRA,
  validYear: 2026,
  active: true,
};

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    emissionFactor: {
      findMany: jest.fn().mockResolvedValue([usFactor2026]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(usFactor2026),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(usFactor2026),
      update: jest.fn().mockResolvedValue(usFactor2026),
    },
    ...overrides,
  };
}

describe('EmissionFactorsService', () => {
  function build(overrides: Record<string, any> = {}) {
    const prisma = makePrisma(overrides);
    const service = new EmissionFactorsService(prisma as unknown as PrismaService);
    return { service, prisma };
  }

  describe('resolveFactor', () => {
    it('returns the exact activityType/region/unit/validYear match', async () => {
      const { service, prisma } = build({
        emissionFactor: { findFirst: jest.fn().mockResolvedValue(usFactor2026) },
      });

      const result = await service.resolveFactor('Electricity', 'US', 'kWh', 2026);

      expect(result).toEqual(usFactor2026);
      expect(prisma.emissionFactor.findFirst).toHaveBeenCalledTimes(1);
    });

    it('falls back to the Global region when no exact region match exists', async () => {
      const globalFactor = { ...usFactor2026, region: 'Global' };
      const findFirst = jest
        .fn()
        .mockResolvedValueOnce(null) // exact region miss
        .mockResolvedValueOnce(globalFactor); // Global hit

      const { service } = build({ emissionFactor: { findFirst } });

      const result = await service.resolveFactor('Electricity', 'FR', 'kWh', 2026);

      expect(result).toEqual(globalFactor);
      expect(findFirst).toHaveBeenCalledTimes(2);
    });

    it('falls back to the latest prior validYear when the requested year has no factor', async () => {
      const priorYearFactor = { ...usFactor2026, validYear: 2024 };
      const findFirst = jest
        .fn()
        .mockResolvedValueOnce(null) // exact miss
        .mockResolvedValueOnce(null) // global miss
        .mockResolvedValueOnce(priorYearFactor); // latest-prior hit

      const { service } = build({ emissionFactor: { findFirst } });

      const result = await service.resolveFactor('Electricity', 'US', 'kWh', 2026);

      expect(result).toEqual(priorYearFactor);
    });

    it('throws NotFoundException when no factor can be resolved at all', async () => {
      const { service } = build({
        emissionFactor: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(service.resolveFactor('Electricity', 'US', 'kWh', 2026)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('creates a new emission factor', async () => {
      const { service, prisma } = build();

      const result = await service.create({
        activityType: 'Electricity',
        unit: 'kWh',
        region: 'US',
        factorValue: 0.4,
        source: EmissionSource.DEFRA,
        validYear: 2026,
      });

      expect(prisma.emissionFactor.create).toHaveBeenCalled();
      expect(result).toEqual(usFactor2026);
    });

    it('throws ConflictException on a duplicate lookup key (P2025 P2002)', async () => {
      const { service } = build({
        emissionFactor: {
          create: jest.fn().mockRejectedValue({ code: 'P2002' }),
        },
      });

      await expect(
        service.create({
          activityType: 'Electricity',
          unit: 'kWh',
          region: 'US',
          factorValue: 0.4,
          source: EmissionSource.DEFRA,
          validYear: 2026,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for an inactive factor', async () => {
      const { service } = build({
        emissionFactor: {
          findUnique: jest.fn().mockResolvedValue({ ...usFactor2026, active: false }),
        },
      });

      await expect(service.findOne(FACTOR_ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('soft-deletes by setting active to false', async () => {
      const { service, prisma } = build();

      await service.remove(FACTOR_ID);

      expect(prisma.emissionFactor.update).toHaveBeenCalledWith({
        where: { id: FACTOR_ID },
        data: { active: false },
      });
    });
  });
});
