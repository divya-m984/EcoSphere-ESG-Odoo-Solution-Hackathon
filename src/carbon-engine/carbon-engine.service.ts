import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, EmissionFactor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmissionFactorsService } from '../emission-factors/emission-factors.service';

const COMMUTE_UNIT = 'km';
const MAX_RECALC_ATTEMPTS = 3;

export interface InvoiceEmissionResult {
  factor: EmissionFactor;
  calculatedEmission: number;
}

@Injectable()
export class CarbonEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emissionFactorsService: EmissionFactorsService,
  ) {}

  /**
   * Resolve the emission factor for an invoice line and compute its emission.
   * Pure calculation — callers are responsible for persisting the result
   * (see InvoicesService, which writes Invoice + CarbonTransaction atomically).
   */
  async calculateInvoiceEmission(
    activityType: string,
    region: string,
    unit: string,
    quantity: number,
    year: number,
  ): Promise<InvoiceEmissionResult> {
    const factor = await this.emissionFactorsService.resolveFactor(
      activityType,
      region,
      unit,
      year,
    );
    return { factor, calculatedEmission: quantity * Number(factor.factorValue) };
  }

  /**
   * Recompute an employee's whole commuting-emission month from Attendance rows.
   * Always re-derives the full month (not an incremental delta) so retries after a
   * concurrent-write conflict are safe to simply recompute-and-retry.
   * Missing commute profile yields zero emission rather than failing — commuting
   * data is expected to arrive gradually as employees set up their profile.
   */
  async recalculateEmployeeMonth(employeeId: string, year: number, month: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true },
    });
    if (!employee || !employee.active) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    const profile = await this.prisma.employeeCommuteProfile.findUnique({ where: { employeeId } });

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendanceRows = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        active: true,
        status: AttendanceStatus.Present,
        date: { gte: startDate, lt: endDate },
      },
    });

    const attendedDays = attendanceRows.length;
    let totalDistanceKm = 0;
    let totalEmissionKgCo2e = 0;

    if (profile && profile.active) {
      const distancePerDay = Number(profile.distanceKm) * (profile.roundTrip ? 2 : 1);
      const factorCache = new Map<string, EmissionFactor>();

      for (const row of attendanceRows) {
        const mode = row.transportModeOverride ?? profile.transportMode;
        let factor = factorCache.get(mode);
        if (!factor) {
          factor = await this.emissionFactorsService.resolveFactor(
            mode,
            employee.department.countryCode,
            COMMUTE_UNIT,
            year,
          );
          factorCache.set(mode, factor);
        }
        totalDistanceKm += distancePerDay;
        totalEmissionKgCo2e += distancePerDay * Number(factor.factorValue);
      }
    }

    return this.persistMonthlyEmission(
      employeeId,
      year,
      month,
      attendedDays,
      totalDistanceKm,
      totalEmissionKgCo2e,
    );
  }

  async recalculateEmployeeMonthsBulk(employeeIds: string[], year: number, month: number) {
    const results = [];
    for (const employeeId of employeeIds) {
      results.push(await this.recalculateEmployeeMonth(employeeId, year, month));
    }
    return results;
  }

  /** Recalculate every active employee for the given period — used for admin data fixes. */
  async recalculateAllEmployeesMonth(year: number, month: number) {
    const employees = await this.prisma.employee.findMany({
      where: { active: true },
      select: { id: true },
    });
    return this.recalculateEmployeeMonthsBulk(
      employees.map((e) => e.id),
      year,
      month,
    );
  }

  /**
   * Optimistic-concurrency upsert: the compound unique key plus a `version`
   * conditional filter on update mirrors the reward-redemption stock decrement
   * pattern (rewards.service.ts) — retries a full recompute on a lost race
   * rather than attempting to merge deltas.
   */
  private async persistMonthlyEmission(
    employeeId: string,
    periodYear: number,
    periodMonth: number,
    attendedDays: number,
    totalDistanceKm: number,
    totalEmissionKgCo2e: number,
  ) {
    for (let attempt = 0; attempt < MAX_RECALC_ATTEMPTS; attempt++) {
      const existing = await this.prisma.employeeMonthlyEmission.findUnique({
        where: { uq_employee_monthly_emission: { employeeId, periodYear, periodMonth } },
      });

      if (!existing) {
        try {
          return await this.prisma.employeeMonthlyEmission.create({
            data: {
              employeeId,
              periodYear,
              periodMonth,
              attendedDays,
              totalDistanceKm,
              totalEmissionKgCo2e,
              version: 0,
            },
          });
        } catch (err: any) {
          if (err?.code === 'P2002') continue; // created concurrently — retry as an update
          throw err;
        }
      }

      try {
        return await this.prisma.employeeMonthlyEmission.update({
          where: {
            uq_employee_monthly_emission: { employeeId, periodYear, periodMonth },
            version: existing.version,
          },
          data: {
            attendedDays,
            totalDistanceKm,
            totalEmissionKgCo2e,
            lastRecalculatedAt: new Date(),
            version: { increment: 1 },
          },
        });
      } catch (err: any) {
        if (err?.code === 'P2025') continue; // version changed concurrently — retry
        throw err;
      }
    }

    throw new ConflictException(
      `Could not recalculate emissions for employee ${employeeId} (${periodYear}-${periodMonth}) due to concurrent updates — please retry`,
    );
  }
}
