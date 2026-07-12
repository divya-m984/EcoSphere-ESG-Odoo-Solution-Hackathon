import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CarbonEngineService } from '../carbon-engine/carbon-engine.service';
import type { MarkAttendanceDto } from './dto/mark-attendance.dto';
import type { UpdateAttendanceDto } from './dto/update-attendance.dto';
import type { QueryAttendanceDto } from './dto/query-attendance.dto';
import type { BulkAttendanceDto } from './dto/bulk-attendance.dto';

function startOfDayUtc(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function periodOf(date: Date): { year: number; month: number } {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carbonEngineService: CarbonEngineService,
  ) {}

  private async requireEmployee(employeeId: string | null): Promise<string> {
    if (!employeeId) {
      throw new ForbiddenException('Only employees can perform this action');
    }
    return employeeId;
  }

  private assertNotFuture(date: Date) {
    const today = startOfDayUtc(new Date().toISOString());
    if (date.getTime() > today.getTime()) {
      throw new BadRequestException('Cannot mark attendance for a future date');
    }
  }

  async markMyAttendance(employeeId: string | null, dto: MarkAttendanceDto) {
    const empId = await this.requireEmployee(employeeId);
    return this.markAttendance(empId, dto);
  }

  async markAttendance(employeeId: string, dto: MarkAttendanceDto) {
    const date = startOfDayUtc(dto.date);
    this.assertNotFuture(date);

    const record = await this.prisma.attendance.upsert({
      where: { uq_attendance_employee_date: { employeeId, date } },
      create: {
        employeeId,
        date,
        status: dto.status ?? AttendanceStatus.Present,
        transportModeOverride: dto.transportModeOverride,
      },
      update: {
        status: dto.status ?? AttendanceStatus.Present,
        transportModeOverride: dto.transportModeOverride ?? null,
        active: true,
      },
    });

    const { year, month } = periodOf(date);
    await this.carbonEngineService.recalculateEmployeeMonth(employeeId, year, month);

    return record;
  }

  async findMyAttendance(employeeId: string | null, query: QueryAttendanceDto) {
    const empId = await this.requireEmployee(employeeId);
    return this.list({ ...query, employeeId: empId });
  }

  async adminFindAll(query: QueryAttendanceDto) {
    return this.list(query);
  }

  private async list(query: QueryAttendanceDto & { employeeId?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = { active: true };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;
    if (query.departmentId) where.employee = { departmentId: query.departmentId };
    if (query.year && query.month) {
      const start = new Date(Date.UTC(query.year, query.month - 1, 1));
      const end = new Date(Date.UTC(query.year, query.month, 1));
      where.date = { gte: start, lt: end };
    } else if (query.year) {
      const start = new Date(Date.UTC(query.year, 0, 1));
      const end = new Date(Date.UTC(query.year + 1, 0, 1));
      where.date = { gte: start, lt: end };
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: { employee: { select: { id: true, name: true, departmentId: true } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminUpdate(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.prisma.attendance.findUnique({ where: { id } });
    if (!existing || !existing.active) {
      throw new NotFoundException(`Attendance record ${id} not found`);
    }

    const newDate = dto.date ? startOfDayUtc(dto.date) : existing.date;

    const data: Prisma.AttendanceUpdateInput = {};
    if (dto.date !== undefined) data.date = newDate;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.transportModeOverride !== undefined)
      data.transportModeOverride = dto.transportModeOverride;

    const updated = await this.prisma.attendance.update({ where: { id }, data });

    const oldPeriod = periodOf(existing.date);
    const newPeriod = periodOf(newDate);
    await this.carbonEngineService.recalculateEmployeeMonth(
      existing.employeeId,
      oldPeriod.year,
      oldPeriod.month,
    );
    if (oldPeriod.year !== newPeriod.year || oldPeriod.month !== newPeriod.month) {
      await this.carbonEngineService.recalculateEmployeeMonth(
        existing.employeeId,
        newPeriod.year,
        newPeriod.month,
      );
    }

    return updated;
  }

  async adminBulkMark(dto: BulkAttendanceDto) {
    const results = [];
    for (const employeeId of dto.employeeIds) {
      results.push(await this.markAttendance(employeeId, { date: dto.date, status: dto.status }));
    }
    return results;
  }
}
