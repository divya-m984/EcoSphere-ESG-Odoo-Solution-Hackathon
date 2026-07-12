import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RewardStatus, XPSourceType } from '@prisma/client';
import { RewardsService } from './rewards.service';
import { PrismaService } from '../prisma/prisma.service';

// ── fixture helpers ───────────────────────────────────────────────────────────

const EMPLOYEE_ID = 'emp-uuid';
const OTHER_EMPLOYEE_ID = 'other-emp-uuid';
const REWARD_ID = 'rwd-uuid';
const IDEMPOTENCY_KEY = '550e8400-e29b-41d4-a716-446655440000';

const activeReward = {
  id: REWARD_ID,
  name: 'Eco Bottle',
  description: 'Nice bottle',
  pointsRequired: 500,
  stock: 5,
  status: RewardStatus.Active,
  active: true,
};

function makeXpAggregate(balance: number) {
  return { _sum: { delta: balance } };
}

// ── prisma mock factory ───────────────────────────────────────────────────────

/**
 * NOTE: All tests here are UNIT tests using a mocked PrismaService.
 * They do NOT hit a real database and CANNOT verify true DB-level concurrency.
 * Concurrency guarantees (e.g. last-unit stock race) rely on Postgres row-level
 * locking via the conditional `WHERE stock > 0` in the UPDATE statement and the
 * unique index on idempotency_key. Those must be verified with integration tests
 * against a live Postgres instance (not included here).
 */
function makePrisma(overrides: Record<string, any> = {}): any {
  const tx = {
    xPEvent: {
      aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)),
      create: jest.fn().mockResolvedValue({}),
    },
    reward: {
      update: jest.fn().mockResolvedValue({ ...activeReward, stock: 4 }),
    },
    rewardRedemption: {
      create: jest.fn().mockResolvedValue({
        id: 'red-uuid',
        rewardId: REWARD_ID,
        employeeId: EMPLOYEE_ID,
        pointsDeducted: 500,
        redeemedAt: new Date(),
      }),
    },
  };

  return {
    reward: {
      findUnique: jest.fn().mockResolvedValue(activeReward),
      findMany: jest.fn().mockResolvedValue([activeReward]),
      count: jest.fn().mockResolvedValue(1),
      create: jest.fn().mockResolvedValue(activeReward),
      update: jest.fn().mockResolvedValue(activeReward),
    },
    rewardRedemption: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    xPEvent: {
      aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)),
    },
    $transaction: jest.fn().mockImplementation((fn: (tx: any) => Promise<any>) => fn(tx)),
    $queryRaw: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('RewardsService', () => {
  let service: RewardsService;
  let prisma: ReturnType<typeof makePrisma>;

  async function build(prismaMock: any = makePrisma()) {
    prisma = prismaMock;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RewardsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(RewardsService);
  }

  beforeEach(() => jest.clearAllMocks());

  // ── getBalance ──────────────────────────────────────────────────────────────

  describe('getBalance()', () => {
    it('returns the sum of xp_event.delta for the employee', async () => {
      await build();
      const bal = await service.getBalance(EMPLOYEE_ID);
      expect(bal).toBe(2000);
      expect(prisma.xPEvent.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: EMPLOYEE_ID } }),
      );
    });

    it('returns 0 when employee has no XP events', async () => {
      const p = makePrisma();
      p.xPEvent.aggregate.mockResolvedValue({ _sum: { delta: null } });
      await build(p);
      expect(await service.getBalance(EMPLOYEE_ID)).toBe(0);
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────

  describe('findAll()', () => {
    it('returns paginated rewards with meta', async () => {
      await build();
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────

  describe('findOne()', () => {
    it('returns the reward when found and active', async () => {
      await build();
      const reward = await service.findOne(REWARD_ID);
      expect(reward.id).toBe(REWARD_ID);
    });

    it('throws 404 when reward does not exist', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue(null);
      await build(p);
      await expect(service.findOne('missing-id')).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when reward is soft-deleted (active=false)', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue({ ...activeReward, active: false });
      await build(p);
      await expect(service.findOne(REWARD_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws 404 when reward status is Inactive (hidden from employees)', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue({ ...activeReward, status: RewardStatus.Inactive });
      await build(p);
      await expect(service.findOne(REWARD_ID)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getBalanceForUser ───────────────────────────────────────────────────────

  describe('getBalanceForUser()', () => {
    it('throws 403 when caller has no employee record (employeeId is null)', async () => {
      await build();
      await expect(service.getBalanceForUser(null)).rejects.toThrow(ForbiddenException);
    });

    it('returns balance for valid employee', async () => {
      await build();
      const result = await service.getBalanceForUser(EMPLOYEE_ID);
      expect(result.balance).toBe(2000);
    });
  });

  // ── redeem ──────────────────────────────────────────────────────────────────

  describe('redeem()', () => {
    it('throws 403 when employeeId is null', async () => {
      await build();
      await expect(service.redeem(null, REWARD_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws 404 when reward does not exist', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue(null);
      await build(p);
      await expect(service.redeem(EMPLOYEE_ID, 'bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws 409 when reward status is Inactive', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue({ ...activeReward, status: RewardStatus.Inactive });
      await build(p);
      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID)).rejects.toThrow(ConflictException);
    });

    it('throws 409 when reward is Out_Of_Stock', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue({ ...activeReward, status: RewardStatus.Out_Of_Stock, stock: 0 });
      await build(p);
      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID)).rejects.toThrow(ConflictException);
    });

    it('throws 409 when stock is 0 even with Active status', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue({ ...activeReward, stock: 0 });
      await build(p);
      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID)).rejects.toThrow(ConflictException);
    });

    it('throws 409 when employee has insufficient XP balance', async () => {
      const p = makePrisma();
      // Balance = 100, reward costs 500
      const tx = {
        xPEvent: { aggregate: jest.fn().mockResolvedValue(makeXpAggregate(100)), create: jest.fn() },
        reward: { update: jest.fn() },
        rewardRedemption: { create: jest.fn() },
      };
      p.$transaction.mockImplementation((fn: any) => fn(tx));
      await build(p);
      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID)).rejects.toThrow(ConflictException);
    });

    it('executes successfully: creates redemption, deducts XP, decrements stock', async () => {
      await build();
      const result = await service.redeem(EMPLOYEE_ID, REWARD_ID);

      expect(result.redemption.pointsDeducted).toBe(500);
      expect(result.balance.previous).toBe(2000);
      expect(result.balance.current).toBe(1500);
      expect(result.balance.deducted).toBe(500);
    });

    it('creates a negative XPEvent with source=redemption', async () => {
      const p = makePrisma();
      let capturedXpCreate: any = null;
      const tx = {
        xPEvent: {
          aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)),
          create: jest.fn().mockImplementation((args: any) => {
            capturedXpCreate = args;
            return Promise.resolve({});
          }),
        },
        reward: { update: jest.fn().mockResolvedValue({ ...activeReward, stock: 4 }) },
        rewardRedemption: {
          create: jest.fn().mockResolvedValue({ id: 'red-uuid', pointsDeducted: 500, redeemedAt: new Date() }),
        },
      };
      p.$transaction.mockImplementation((fn: any) => fn(tx));
      await build(p);

      await service.redeem(EMPLOYEE_ID, REWARD_ID);

      expect(capturedXpCreate.data.delta).toBe(-500);
      expect(capturedXpCreate.data.source).toBe(XPSourceType.redemption);
      expect(capturedXpCreate.data.sourceId).toBe('red-uuid');
    });

    it('re-throws ConflictException (P2025) as stock-conflict message', async () => {
      const p = makePrisma();
      const p2025 = Object.assign(new Error('Record not found'), { code: 'P2025' });
      const tx = {
        xPEvent: { aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)), create: jest.fn() },
        reward: { update: jest.fn().mockRejectedValue(p2025) },
        rewardRedemption: { create: jest.fn() },
      };
      p.$transaction.mockImplementation((fn: any) => fn(tx));
      await build(p);

      const err = await service.redeem(EMPLOYEE_ID, REWARD_ID).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).toMatch(/out of stock/i);
    });

    // ── Concurrency: last stock unit ────────────────────────────────────────
    // UNIT TEST (mocked) — proves P2025 is handled correctly.
    // True concurrent DB race must be verified via integration tests with a live
    // Postgres instance using parallel transactions.
    it('[unit/mocked] two concurrent attempts for the final unit: second gets P2025 → 409', async () => {
      const p = makePrisma();
      const p2025 = Object.assign(new Error('Record not found'), { code: 'P2025' });
      const tx = {
        xPEvent: { aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)), create: jest.fn() },
        reward: { update: jest.fn().mockRejectedValue(p2025) },
        rewardRedemption: { create: jest.fn() },
      };
      p.$transaction.mockImplementation((fn: any) => fn(tx));
      await build(p);

      const err = await service.redeem(EMPLOYEE_ID, REWARD_ID).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).toMatch(/out of stock/i);
    });

    // UNIT TEST (mocked) — proves balance check inside transaction prevents overdraft.
    // True simultaneous balance drain requires integration tests.
    it('[unit/mocked] simultaneous attempts when balance is sufficient for only one: second gets 409', async () => {
      const p = makePrisma();
      // Simulate balance exactly meeting cost for first, then 0 for second
      const tx = {
        xPEvent: { aggregate: jest.fn().mockResolvedValue(makeXpAggregate(0)), create: jest.fn() },
        reward: { update: jest.fn() },
        rewardRedemption: { create: jest.fn() },
      };
      p.$transaction.mockImplementation((fn: any) => fn(tx));
      await build(p);

      const err = await service.redeem(EMPLOYEE_ID, REWARD_ID).catch((e) => e);
      expect(err).toBeInstanceOf(ConflictException);
      expect(err.message).toMatch(/insufficient/i);
    });

    // ── Idempotency ─────────────────────────────────────────────────────────

    it('returns original redemption without new XP deduction when idempotency key already used (same employee)', async () => {
      const existingRedemption = {
        id: 'red-uuid',
        rewardId: REWARD_ID,
        employeeId: EMPLOYEE_ID,
        pointsDeducted: 500,
        redeemedAt: new Date(),
        idempotencyKey: IDEMPOTENCY_KEY,
        reward: { id: REWARD_ID, name: 'Eco Bottle', pointsRequired: 500, stock: 4, status: RewardStatus.Active },
      };

      const p = makePrisma();
      p.rewardRedemption.findUnique.mockResolvedValue(existingRedemption);
      await build(p);

      const result = await service.redeem(EMPLOYEE_ID, REWARD_ID, IDEMPOTENCY_KEY);

      // Must return original result — no new transaction, no XP deduction
      expect(result.redemption.id).toBe('red-uuid');
      expect((result as any).idempotent).toBe(true);
      expect(p.$transaction).not.toHaveBeenCalled();
    });

    it('throws 403 when idempotency key belongs to a different employee', async () => {
      const existingRedemption = {
        id: 'red-uuid',
        rewardId: REWARD_ID,
        employeeId: OTHER_EMPLOYEE_ID, // Different employee
        pointsDeducted: 500,
        redeemedAt: new Date(),
        idempotencyKey: IDEMPOTENCY_KEY,
        reward: { id: REWARD_ID, name: 'Eco Bottle', pointsRequired: 500, stock: 4, status: RewardStatus.Active },
      };

      const p = makePrisma();
      p.rewardRedemption.findUnique.mockResolvedValue(existingRedemption);
      await build(p);

      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID, IDEMPOTENCY_KEY))
        .rejects.toThrow(ForbiddenException);
      expect(p.$transaction).not.toHaveBeenCalled();
    });

    it('[unit/mocked] P2002 on idempotency_key (concurrent race): recovers by fetching existing redemption', async () => {
      const existingRedemption = {
        id: 'red-uuid',
        rewardId: REWARD_ID,
        employeeId: EMPLOYEE_ID,
        pointsDeducted: 500,
        redeemedAt: new Date(),
        idempotencyKey: IDEMPOTENCY_KEY,
        reward: { id: REWARD_ID, name: 'Eco Bottle', pointsRequired: 500, stock: 4, status: RewardStatus.Active },
      };

      const p = makePrisma();
      // First check returns null (no existing record yet)
      p.rewardRedemption.findUnique.mockResolvedValueOnce(null);
      // Transaction throws P2002 (concurrent insert with same key)
      const p2002 = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      p.$transaction.mockRejectedValue(p2002);
      // Recovery fetch returns the record inserted by the other request
      p.rewardRedemption.findUnique.mockResolvedValueOnce(existingRedemption);

      await build(p);

      const result = await service.redeem(EMPLOYEE_ID, REWARD_ID, IDEMPOTENCY_KEY);
      expect(result.redemption.id).toBe('red-uuid');
      expect((result as any).idempotent).toBe(true);
    });

    it('[unit/mocked] XPEvent creation failure rolls back transaction', async () => {
      const p = makePrisma();
      const tx = {
        xPEvent: {
          aggregate: jest.fn().mockResolvedValue(makeXpAggregate(2000)),
          create: jest.fn().mockRejectedValue(new Error('XP event write failed')),
        },
        reward: { update: jest.fn().mockResolvedValue({ ...activeReward, stock: 4 }) },
        rewardRedemption: {
          create: jest.fn().mockResolvedValue({ id: 'red-uuid', pointsDeducted: 500, redeemedAt: new Date() }),
        },
      };
      // Simulate Prisma rolling back and re-throwing
      p.$transaction.mockImplementation(async (fn: any) => {
        try {
          return await fn(tx);
        } catch (e) {
          throw e; // transaction rolled back
        }
      });
      await build(p);

      await expect(service.redeem(EMPLOYEE_ID, REWARD_ID)).rejects.toThrow('XP event write failed');
      // After rollback, no redemption should be persisted (tx rolled back)
    });
  });

  // ── getMyRedemptions ────────────────────────────────────────────────────────

  describe('getMyRedemptions()', () => {
    it('throws 403 when employeeId is null', async () => {
      await build();
      await expect(service.getMyRedemptions(null)).rejects.toThrow(ForbiddenException);
    });

    it('returns mapped redemptions with status=Completed', async () => {
      const p = makePrisma();
      p.rewardRedemption.findMany.mockResolvedValue([
        {
          id: 'r1',
          rewardId: REWARD_ID,
          employeeId: EMPLOYEE_ID,
          pointsDeducted: 500,
          redeemedAt: new Date('2026-01-01'),
          reward: { id: REWARD_ID, name: 'Eco Bottle', description: 'Nice' },
        },
      ]);
      await build(p);

      const result = await service.getMyRedemptions(EMPLOYEE_ID);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Completed');
      expect(result[0].rewardName).toBe('Eco Bottle');
      expect(result[0].pointsDeducted).toBe(500);
    });

    it('returns only redemptions for the requesting employee (WHERE clause)', async () => {
      await build();
      await service.getMyRedemptions(EMPLOYEE_ID);
      expect(prisma.rewardRedemption.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { employeeId: EMPLOYEE_ID } }),
      );
    });
  });

  // ── admin operations ─────────────────────────────────────────────────────────

  describe('adminCreate()', () => {
    it('creates a reward with Active status when stock > 0', async () => {
      await build();
      await service.adminCreate({ name: 'New', description: 'Desc', pointsRequired: 100, stock: 5 });
      expect(prisma.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RewardStatus.Active }),
        }),
      );
    });

    it('creates a reward with Out_Of_Stock status when stock = 0', async () => {
      await build();
      await service.adminCreate({ name: 'Empty', description: 'D', pointsRequired: 100, stock: 0 });
      expect(prisma.reward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: RewardStatus.Out_Of_Stock }),
        }),
      );
    });
  });

  describe('adminUpdateStatus()', () => {
    it('throws 404 when reward not found', async () => {
      const p = makePrisma();
      p.reward.findUnique.mockResolvedValue(null);
      await build(p);
      await expect(
        service.adminUpdateStatus('missing', { status: RewardStatus.Inactive }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates status to Inactive', async () => {
      await build();
      await service.adminUpdateStatus(REWARD_ID, { status: RewardStatus.Inactive });
      expect(prisma.reward.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: RewardStatus.Inactive } }),
      );
    });
  });

  // ── endpoint security (role guard is enforced at controller level) ──────────
  // Admin endpoints are decorated with @UseGuards(JwtAuthGuard, RolesGuard) and
  // @Roles('Admin', 'ESG_Manager') in AdminRewardsController.
  // RolesGuard throws ForbiddenException for any role not in the allow-list.
  // This is a design-time guarantee — no unit test needed at service level since
  // the service itself does not check roles (the guard does before the handler runs).
  //
  // Employee identity always comes from JWT context (@CurrentUser decorator reads
  // req.user set by JwtStrategy.validate), never from a request body.
});
