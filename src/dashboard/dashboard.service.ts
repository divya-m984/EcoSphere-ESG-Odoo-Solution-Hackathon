import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TrendQueryDto } from './dto/trend-query.dto';
import type { PeriodQueryDto } from './dto/period-query.dto';

function currentPeriod(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

function monthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) };
}

function previousPeriod(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

function lastNPeriods(n: number): { year: number; month: number }[] {
  const { year, month } = currentPeriod();
  const periods: { year: number; month: number }[] = [];
  let y = year;
  let m = month;
  for (let i = 0; i < n; i++) {
    periods.unshift({ year: y, month: m });
    ({ year: y, month: m } = previousPeriod(y, m));
  }
  return periods;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async sumCommuteEmission(year: number, month: number): Promise<number> {
    const result = await this.prisma.employeeMonthlyEmission.aggregate({
      where: { periodYear: year, periodMonth: month },
      _sum: { totalEmissionKgCo2e: true },
    });
    return Number(result._sum.totalEmissionKgCo2e ?? 0);
  }

  private async sumOperationalEmission(year: number, month: number): Promise<number> {
    const { start, end } = monthRange(year, month);
    const result = await this.prisma.carbonTransaction.aggregate({
      where: { active: true, txnDate: { gte: start, lt: end } },
      _sum: { calculatedEmission: true },
    });
    return Number(result._sum.calculatedEmission ?? 0);
  }

  /** Shared company-wide commute/operational breakdown for a single period — reused by ReportsService. */
  async getPeriodBreakdown(year: number, month: number) {
    const [commuteEmissionKgCo2e, operationalEmissionKgCo2e] = await Promise.all([
      this.sumCommuteEmission(year, month),
      this.sumOperationalEmission(year, month),
    ]);
    return {
      period: { year, month },
      commuteEmissionKgCo2e,
      operationalEmissionKgCo2e,
      totalEmissionKgCo2e: commuteEmissionKgCo2e + operationalEmissionKgCo2e,
    };
  }

  private async getEmployeeCommuteEmission(
    employeeId: string,
    year: number,
    month: number,
  ): Promise<number> {
    const record = await this.prisma.employeeMonthlyEmission.findUnique({
      where: { uq_employee_monthly_emission: { employeeId, periodYear: year, periodMonth: month } },
    });
    return Number(record?.totalEmissionKgCo2e ?? 0);
  }

  /** Admin/ESG_Manager see company-wide totals; Employee sees only their own commute contribution. */
  async getCarbonSummary(role: string, employeeId: string | null, query: PeriodQueryDto) {
    const { year, month } =
      query.year && query.month ? { year: query.year, month: query.month } : currentPeriod();
    const prev = previousPeriod(year, month);

    if (role === 'Employee') {
      if (!employeeId) throw new ForbiddenException('No employee profile linked to this account');
      const [current, previous] = await Promise.all([
        this.getEmployeeCommuteEmission(employeeId, year, month),
        this.getEmployeeCommuteEmission(employeeId, prev.year, prev.month),
      ]);
      return {
        scope: 'employee',
        period: { year, month },
        commuteEmissionKgCo2e: current,
        previousPeriodEmissionKgCo2e: previous,
      };
    }

    const [commuteCurrent, operationalCurrent, commutePrevious, operationalPrevious] =
      await Promise.all([
        this.sumCommuteEmission(year, month),
        this.sumOperationalEmission(year, month),
        this.sumCommuteEmission(prev.year, prev.month),
        this.sumOperationalEmission(prev.year, prev.month),
      ]);

    return {
      scope: 'company',
      period: { year, month },
      totalEmissionKgCo2e: commuteCurrent + operationalCurrent,
      commuteEmissionKgCo2e: commuteCurrent,
      operationalEmissionKgCo2e: operationalCurrent,
      previousPeriodTotalEmissionKgCo2e: commutePrevious + operationalPrevious,
    };
  }

  async getCarbonTrend(role: string, employeeId: string | null, query: TrendQueryDto) {
    const periods = lastNPeriods(query.months ?? 12);

    if (role === 'Employee') {
      if (!employeeId) throw new ForbiddenException('No employee profile linked to this account');
      const series = await Promise.all(
        periods.map(async (p) => ({
          ...p,
          emissionKgCo2e: await this.getEmployeeCommuteEmission(employeeId, p.year, p.month),
        })),
      );
      return { scope: 'employee', series };
    }

    const series = await Promise.all(
      periods.map(async (p) => {
        const [commute, operational] = await Promise.all([
          this.sumCommuteEmission(p.year, p.month),
          this.sumOperationalEmission(p.year, p.month),
        ]);
        return {
          ...p,
          commuteEmissionKgCo2e: commute,
          operationalEmissionKgCo2e: operational,
          totalEmissionKgCo2e: commute + operational,
        };
      }),
    );
    return { scope: 'company', series };
  }

  async getTopSources(query: PeriodQueryDto) {
    const { year, month } =
      query.year && query.month ? { year: query.year, month: query.month } : currentPeriod();
    const { start, end } = monthRange(year, month);

    const transactions = await this.prisma.carbonTransaction.findMany({
      where: { active: true, txnDate: { gte: start, lt: end } },
      include: { emissionFactor: { select: { activityType: true } } },
    });

    const totals = new Map<string, number>();
    for (const txn of transactions) {
      const key = txn.emissionFactor.activityType;
      totals.set(key, (totals.get(key) ?? 0) + Number(txn.calculatedEmission));
    }

    const sources = [...totals.entries()]
      .map(([activityType, emissionKgCo2e]) => ({ activityType, emissionKgCo2e }))
      .sort((a, b) => b.emissionKgCo2e - a.emissionKgCo2e);

    return { period: { year, month }, sources };
  }

  async getTopDepartments(query: PeriodQueryDto) {
    const { year, month } =
      query.year && query.month ? { year: query.year, month: query.month } : currentPeriod();
    const { start, end } = monthRange(year, month);

    const [transactions, monthlyEmissions] = await Promise.all([
      this.prisma.carbonTransaction.findMany({
        where: { active: true, txnDate: { gte: start, lt: end } },
        include: { department: { select: { id: true, name: true } } },
      }),
      this.prisma.employeeMonthlyEmission.findMany({
        where: { periodYear: year, periodMonth: month },
        include: { employee: { select: { departmentId: true } } },
      }),
    ]);

    const totals = new Map<
      string,
      { departmentId: string; departmentName: string; emissionKgCo2e: number }
    >();
    for (const txn of transactions) {
      const entry = totals.get(txn.departmentId) ?? {
        departmentId: txn.departmentId,
        departmentName: txn.department.name,
        emissionKgCo2e: 0,
      };
      entry.emissionKgCo2e += Number(txn.calculatedEmission);
      totals.set(txn.departmentId, entry);
    }

    if (monthlyEmissions.length > 0) {
      const departmentIds = [...new Set(monthlyEmissions.map((m) => m.employee.departmentId))];
      const departments = await this.prisma.department.findMany({
        where: { id: { in: departmentIds } },
        select: { id: true, name: true },
      });
      const departmentNames = new Map(departments.map((d) => [d.id, d.name]));

      for (const m of monthlyEmissions) {
        const deptId = m.employee.departmentId;
        const entry = totals.get(deptId) ?? {
          departmentId: deptId,
          departmentName: departmentNames.get(deptId) ?? 'Unknown',
          emissionKgCo2e: 0,
        };
        entry.emissionKgCo2e += Number(m.totalEmissionKgCo2e);
        totals.set(deptId, entry);
      }
    }

    const departments = [...totals.values()].sort((a, b) => b.emissionKgCo2e - a.emissionKgCo2e);
    return { period: { year, month }, departments };
  }

  async getMyCarbonHistory(employeeId: string | null) {
    if (!employeeId) throw new ForbiddenException('No employee profile linked to this account');
    const history = await this.prisma.employeeMonthlyEmission.findMany({
      where: { employeeId },
      orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    });
    return { data: history };
  }
}
