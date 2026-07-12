import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateEmissionFactorDto } from './dto/create-emission-factor.dto';
import type { UpdateEmissionFactorDto } from './dto/update-emission-factor.dto';
import type { QueryEmissionFactorsDto } from './dto/query-emission-factors.dto';

const GLOBAL_REGION = 'Global';

@Injectable()
export class EmissionFactorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryEmissionFactorsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.EmissionFactorWhereInput = { active: true };
    if (query.activityType) where.activityType = query.activityType;
    if (query.region) where.region = query.region;
    if (query.source) where.source = query.source;
    if (query.validYear) where.validYear = query.validYear;

    const [items, total] = await Promise.all([
      this.prisma.emissionFactor.findMany({
        where,
        orderBy: [{ activityType: 'asc' }, { validYear: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.emissionFactor.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const factor = await this.prisma.emissionFactor.findUnique({ where: { id } });
    if (!factor || !factor.active) {
      throw new NotFoundException(`Emission factor ${id} not found`);
    }
    return factor;
  }

  async create(dto: CreateEmissionFactorDto) {
    try {
      return await this.prisma.emissionFactor.create({
        data: {
          activityType: dto.activityType,
          unit: dto.unit,
          region: dto.region,
          factorValue: dto.factorValue,
          source: dto.source,
          validYear: dto.validYear,
          referenceUrl: dto.referenceUrl,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `An emission factor for ${dto.activityType}/${dto.region}/${dto.unit}/${dto.validYear} already exists`,
        );
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateEmissionFactorDto) {
    await this.findOne(id);

    const data: Prisma.EmissionFactorUpdateInput = {};
    if (dto.activityType !== undefined) data.activityType = dto.activityType;
    if (dto.unit !== undefined) data.unit = dto.unit;
    if (dto.region !== undefined) data.region = dto.region;
    if (dto.factorValue !== undefined) data.factorValue = dto.factorValue;
    if (dto.source !== undefined) data.source = dto.source;
    if (dto.validYear !== undefined) data.validYear = dto.validYear;
    if (dto.referenceUrl !== undefined) data.referenceUrl = dto.referenceUrl;
    if (dto.active !== undefined) data.active = dto.active;

    try {
      return await this.prisma.emissionFactor.update({ where: { id }, data });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('An emission factor with these lookup fields already exists');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.emissionFactor.update({ where: { id }, data: { active: false } });
  }

  /**
   * Resolve the active emission factor to use for a calculation.
   * Lookup order: exact [activityType, region, unit, validYear] match, then the
   * same activityType/unit in the Global region for that year, then the most
   * recent validYear at or before the requested year for that activityType/region/unit.
   * Throws if nothing usable is found — callers must not silently skip a calculation.
   */
  async resolveFactor(activityType: string, region: string, unit: string, year: number) {
    const exact = await this.prisma.emissionFactor.findFirst({
      where: { activityType, region, unit, validYear: year, active: true },
    });
    if (exact) return exact;

    if (region !== GLOBAL_REGION) {
      const global = await this.prisma.emissionFactor.findFirst({
        where: { activityType, region: GLOBAL_REGION, unit, validYear: year, active: true },
      });
      if (global) return global;
    }

    const latestPrior = await this.prisma.emissionFactor.findFirst({
      where: { activityType, region, unit, validYear: { lte: year }, active: true },
      orderBy: { validYear: 'desc' },
    });
    if (latestPrior) return latestPrior;

    throw new NotFoundException(
      `No active emission factor found for ${activityType}/${region}/${unit} (year ${year} or earlier)`,
    );
  }
}
