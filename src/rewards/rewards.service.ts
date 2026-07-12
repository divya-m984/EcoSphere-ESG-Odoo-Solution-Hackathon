import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, RewardStatus, XPSourceType } from '@prisma/client';
import type { CreateRewardDto } from './dto/create-reward.dto';
import type { UpdateRewardDto } from './dto/update-reward.dto';
import type { UpdateRewardStatusDto } from './dto/update-reward-status.dto';
import type { QueryRewardsDto } from './dto/query-rewards.dto';

@Injectable()
export class RewardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /** Compute available XP balance for an employee from the XPEvent ledger. */
  async getBalance(employeeId: string): Promise<number> {
    const result = await this.prisma.xPEvent.aggregate({
      where: { employeeId },
      _sum: { delta: true },
    });
    return result._sum.delta ?? 0;
  }

  private async requireEmployee(employeeId: string | null): Promise<string> {
    if (!employeeId) {
      throw new ForbiddenException('Only employees can perform this action');
    }
    return employeeId;
  }

  private buildWhereClause(
    query: QueryRewardsDto,
    adminView = false,
  ): Prisma.RewardWhereInput {
    const where: Prisma.RewardWhereInput = { active: true };

    if (!adminView) {
      // Public catalogue: only show Active rewards (Inactive rewards are hidden)
      where.status = RewardStatus.Active;
    }

    if (query.status && adminView) {
      where.status = query.status;
    }

    if (query.availableOnly) {
      where.stock = { gt: 0 };
      where.status = RewardStatus.Active;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.minPoints !== undefined || query.maxPoints !== undefined) {
      where.pointsRequired = {};
      if (query.minPoints !== undefined) where.pointsRequired.gte = query.minPoints;
      if (query.maxPoints !== undefined) where.pointsRequired.lte = query.maxPoints;
    }

    return where;
  }

  // ── Employee endpoints ───────────────────────────────────────────────────────

  async findAll(query: QueryRewardsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const orderBy: Prisma.RewardOrderByWithRelationInput =
      query.sortByPoints
        ? { pointsRequired: query.sortByPoints }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          pointsRequired: true,
          stock: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.reward.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        pointsRequired: true,
        stock: true,
        status: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Hide inactive and soft-deleted rewards from employees
    if (!reward || !reward.active || reward.status === RewardStatus.Inactive) {
      throw new NotFoundException(`Reward ${id} not found`);
    }

    return reward;
  }

  async getBalanceForUser(employeeId: string | null) {
    const empId = await this.requireEmployee(employeeId);
    const balance = await this.getBalance(empId);
    return { employeeId: empId, balance };
  }

  /**
   * Atomic redemption with server-side idempotency:
   * 1. Check idempotency key — return cached result if already processed
   * 2. Verify reward is active and in stock
   * 3. Inside a single transaction:
   *    a. Verify employee XP balance
   *    b. Decrement stock atomically (P2025 if stock hits 0 concurrently)
   *    c. Create RewardRedemption record (with idempotencyKey)
   *    d. Create negative XPEvent
   *    e. Set status to Out_Of_Stock if stock reaches 0
   * All steps succeed or all roll back.
   */
  async redeem(employeeId: string | null, rewardId: string, idempotencyKey?: string) {
    const empId = await this.requireEmployee(employeeId);

    // ── Idempotency check (authoritative — server wins) ──────────────────────
    if (idempotencyKey) {
      const existing = await this.prisma.rewardRedemption.findUnique({
        where: { idempotencyKey },
        include: {
          reward: { select: { id: true, name: true, pointsRequired: true, stock: true, status: true } },
        },
      });

      if (existing) {
        if (existing.employeeId !== empId) {
          throw new ForbiddenException('Idempotency key belongs to a different employee');
        }
        const currentBalance = await this.getBalance(empId);
        return {
          redemption: {
            id: existing.id,
            rewardId: existing.rewardId,
            employeeId: existing.employeeId,
            pointsDeducted: existing.pointsDeducted,
            redeemedAt: existing.redeemedAt,
          },
          reward: existing.reward,
          balance: {
            previous: currentBalance + existing.pointsDeducted,
            current: currentBalance,
            deducted: existing.pointsDeducted,
          },
          idempotent: true,
        };
      }
    }

    // ── Pre-flight checks outside transaction (fast fail) ────────────────────
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
      select: { id: true, name: true, pointsRequired: true, stock: true, status: true, active: true },
    });

    if (!reward || !reward.active) {
      throw new NotFoundException(`Reward ${rewardId} not found`);
    }

    if (reward.status !== RewardStatus.Active) {
      throw new ConflictException(
        reward.status === RewardStatus.Out_Of_Stock
          ? 'This reward is out of stock'
          : 'This reward is not available for redemption',
      );
    }

    if (reward.stock <= 0) {
      throw new ConflictException('This reward is out of stock');
    }

    // ── Atomic transaction ───────────────────────────────────────────────────
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Compute authoritative balance inside transaction
        const balResult = await tx.xPEvent.aggregate({
          where: { employeeId: empId },
          _sum: { delta: true },
        });
        const balance = balResult._sum.delta ?? 0;

        if (balance < reward.pointsRequired) {
          throw new ConflictException(
            `Insufficient XP balance. You have ${balance} XP but this reward requires ${reward.pointsRequired} XP`,
          );
        }

        // Decrement stock with conditional WHERE — throws P2025 if stock = 0
        // This is the concurrency barrier: only one request can take the last unit
        const updatedReward = await tx.reward.update({
          where: {
            id: rewardId,
            stock: { gt: 0 },
            status: RewardStatus.Active,
            active: true,
          },
          data: { stock: { decrement: 1 } },
          select: { id: true, name: true, pointsRequired: true, stock: true },
        });

        // Create redemption record (idempotencyKey enforces uniqueness at DB level)
        const redemption = await tx.rewardRedemption.create({
          data: {
            rewardId,
            employeeId: empId,
            pointsDeducted: reward.pointsRequired,
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
          select: { id: true, rewardId: true, employeeId: true, pointsDeducted: true, redeemedAt: true },
        });

        // Create negative XP ledger entry
        await tx.xPEvent.create({
          data: {
            employeeId: empId,
            delta: -reward.pointsRequired,
            source: XPSourceType.redemption,
            sourceId: redemption.id,
            note: `Redeemed: ${reward.name}`,
          },
        });

        // If stock just hit 0, update status to Out_Of_Stock
        if (updatedReward.stock === 0) {
          await tx.reward.update({
            where: { id: rewardId },
            data: { status: RewardStatus.Out_Of_Stock },
          });
        }

        const newBalance = balance - reward.pointsRequired;

        return {
          redemption,
          reward: { ...updatedReward, status: updatedReward.stock === 0 ? RewardStatus.Out_Of_Stock : RewardStatus.Active },
          balance: { previous: balance, current: newBalance, deducted: reward.pointsRequired },
        };
      });
    } catch (err: any) {
      // Prisma P2025 = record to update not found (stock hit 0 concurrently)
      if (err?.code === 'P2025') {
        throw new ConflictException('This reward just ran out of stock — please try a different reward');
      }
      // Prisma P2002 = unique constraint on idempotency_key (concurrent same-key request)
      if (err?.code === 'P2002' && idempotencyKey) {
        const dup = await this.prisma.rewardRedemption.findUnique({
          where: { idempotencyKey },
          include: {
            reward: { select: { id: true, name: true, pointsRequired: true, stock: true, status: true } },
          },
        });
        if (dup && dup.employeeId === empId) {
          const currentBalance = await this.getBalance(empId);
          return {
            redemption: {
              id: dup.id,
              rewardId: dup.rewardId,
              employeeId: dup.employeeId,
              pointsDeducted: dup.pointsDeducted,
              redeemedAt: dup.redeemedAt,
            },
            reward: dup.reward,
            balance: {
              previous: currentBalance + dup.pointsDeducted,
              current: currentBalance,
              deducted: dup.pointsDeducted,
            },
            idempotent: true,
          };
        }
      }
      // Re-throw known HTTP exceptions as-is
      if (err?.status) throw err;
      throw err;
    }
  }

  async getMyRedemptions(employeeId: string | null) {
    const empId = await this.requireEmployee(employeeId);

    const redemptions = await this.prisma.rewardRedemption.findMany({
      where: { employeeId: empId },
      include: { reward: { select: { id: true, name: true, description: true } } },
      orderBy: { redeemedAt: 'desc' },
    });

    return redemptions.map((r) => ({
      id: r.id,
      rewardId: r.rewardId,
      rewardName: r.reward.name,
      rewardDescription: r.reward.description,
      pointsDeducted: r.pointsDeducted,
      redeemedAt: r.redeemedAt,
      status: 'Completed',
    }));
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────────

  async adminFindAll(query: QueryRewardsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query, true);

    const orderBy: Prisma.RewardOrderByWithRelationInput =
      query.sortByPoints
        ? { pointsRequired: query.sortByPoints }
        : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: { select: { redemptions: true } },
        },
      }),
      this.prisma.reward.count({ where }),
    ]);

    return {
      data: items.map((r) => ({ ...r, redemptionCount: r._count.redemptions })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminCreate(dto: CreateRewardDto) {
    return this.prisma.reward.create({
      data: {
        name: dto.name,
        description: dto.description,
        pointsRequired: dto.pointsRequired,
        stock: dto.stock,
        status: dto.status ?? (dto.stock > 0 ? RewardStatus.Active : RewardStatus.Out_Of_Stock),
      },
    });
  }

  async adminUpdate(id: string, dto: UpdateRewardDto) {
    await this.adminFindOne(id);

    const data: Prisma.RewardUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.pointsRequired !== undefined) data.pointsRequired = dto.pointsRequired;
    if (dto.stock !== undefined) {
      data.stock = dto.stock;
      // Auto-adjust Out_Of_Stock status when stock is restocked
      if (dto.stock > 0 && !dto.status) {
        const current = await this.prisma.reward.findUnique({ where: { id }, select: { status: true } });
        if (current?.status === RewardStatus.Out_Of_Stock) {
          data.status = RewardStatus.Active;
        }
      }
    }
    if (dto.status !== undefined) data.status = dto.status;

    return this.prisma.reward.update({ where: { id }, data });
  }

  async adminUpdateStatus(id: string, dto: UpdateRewardStatusDto) {
    await this.adminFindOne(id);
    return this.prisma.reward.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async adminGetRedemptions(id: string) {
    await this.adminFindOne(id);

    const redemptions = await this.prisma.rewardRedemption.findMany({
      where: { rewardId: id },
      include: { employee: { select: { id: true, name: true } } },
      orderBy: { redeemedAt: 'desc' },
    });

    return redemptions.map((r) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.employee.name,
      pointsDeducted: r.pointsDeducted,
      redeemedAt: r.redeemedAt,
      status: 'Completed',
    }));
  }

  private async adminFindOne(id: string) {
    const reward = await this.prisma.reward.findUnique({ where: { id } });
    if (!reward) throw new NotFoundException(`Reward ${id} not found`);
    return reward;
  }
}
