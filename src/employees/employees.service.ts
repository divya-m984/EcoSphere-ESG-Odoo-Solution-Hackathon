import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UpsertCommuteProfileDto } from './dto/upsert-commute-profile.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  private async requireEmployee(employeeId: string | null): Promise<string> {
    if (!employeeId) {
      throw new ForbiddenException('Only employees can perform this action');
    }
    return employeeId;
  }

  async requireActiveEmployee(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee || !employee.active) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }
    return employee;
  }

  async getCommuteProfile(employeeId: string) {
    const profile = await this.prisma.employeeCommuteProfile.findUnique({
      where: { employeeId },
    });
    if (!profile || !profile.active) {
      throw new NotFoundException('Commute profile not set for this employee');
    }
    return profile;
  }

  async getMyCommuteProfile(employeeId: string | null) {
    const empId = await this.requireEmployee(employeeId);
    return this.getCommuteProfile(empId);
  }

  async upsertCommuteProfile(employeeId: string, dto: UpsertCommuteProfileDto) {
    await this.requireActiveEmployee(employeeId);

    return this.prisma.employeeCommuteProfile.upsert({
      where: { employeeId },
      create: {
        employeeId,
        transportMode: dto.transportMode,
        distanceKm: dto.distanceKm,
        roundTrip: dto.roundTrip ?? true,
        active: true,
      },
      update: {
        transportMode: dto.transportMode,
        distanceKm: dto.distanceKm,
        ...(dto.roundTrip !== undefined ? { roundTrip: dto.roundTrip } : {}),
        active: true,
      },
    });
  }

  async upsertMyCommuteProfile(employeeId: string | null, dto: UpsertCommuteProfileDto) {
    const empId = await this.requireEmployee(employeeId);
    return this.upsertCommuteProfile(empId, dto);
  }
}
