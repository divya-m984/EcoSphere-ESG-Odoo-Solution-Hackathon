/**
 * Prisma seed script — creates test users, employees, departments and rewards.
 *
 * Usage:
 *   npx ts-node prisma/seed.ts
 *
 * Or add to package.json:
 *   "prisma": { "seed": "ts-node prisma/seed.ts" }
 * then run:
 *   npx prisma db seed
 */

import { PrismaClient, UserRole, RewardStatus } from '@prisma/client';
import { randomBytes, scryptSync } from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  console.log('Seeding database...');

  // ── Department ──────────────────────────────────────────────────────────────
  const dept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'Engineering',
      code: 'ENG',
      countryCode: 'US',
      employeeCount: 0,
    },
  });

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ecosphere.dev' },
    update: {},
    create: {
      email: 'admin@ecosphere.dev',
      passwordHash: hashPassword('Admin@123'),
      role: UserRole.Admin,
    },
  });

  // ── ESG Manager user ────────────────────────────────────────────────────────
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@ecosphere.dev' },
    update: {},
    create: {
      email: 'manager@ecosphere.dev',
      passwordHash: hashPassword('Manager@123'),
      role: UserRole.ESG_Manager,
    },
  });

  await prisma.employee.upsert({
    where: { userId: managerUser.id },
    update: {},
    create: {
      userId: managerUser.id,
      name: 'ESG Manager',
      departmentId: dept.id,
      hireDate: new Date('2022-01-01'),
    },
  });

  // ── Employee user ───────────────────────────────────────────────────────────
  const empUser = await prisma.user.upsert({
    where: { email: 'employee@ecosphere.dev' },
    update: {},
    create: {
      email: 'employee@ecosphere.dev',
      passwordHash: hashPassword('Employee@123'),
      role: UserRole.Employee,
    },
  });

  const employee = await prisma.employee.upsert({
    where: { userId: empUser.id },
    update: {},
    create: {
      userId: empUser.id,
      name: 'Alex Green',
      departmentId: dept.id,
      hireDate: new Date('2023-06-01'),
    },
  });

  // Give the employee some starter XP so they can redeem rewards
  const existingXp = await prisma.xPEvent.findFirst({
    where: { employeeId: employee.id, source: 'adjustment', note: 'Seed XP' },
  });

  if (!existingXp) {
    await prisma.xPEvent.create({
      data: {
        employeeId: employee.id,
        delta: 2000,
        source: 'adjustment',
        note: 'Seed XP',
      },
    });
    console.log(`  Granted 2000 XP to ${employee.name}`);
  }

  // ── Rewards ─────────────────────────────────────────────────────────────────
  const rewards = [
    {
      name: 'Eco Water Bottle',
      description: 'Reusable stainless steel water bottle with EcoSphere branding.',
      pointsRequired: 500,
      stock: 50,
      status: RewardStatus.Active,
    },
    {
      name: 'Plant-a-Tree Certificate',
      description: 'We plant a tree in your name and send you a personalised certificate.',
      pointsRequired: 300,
      stock: 100,
      status: RewardStatus.Active,
    },
    {
      name: 'Extra Day Off',
      description: 'One additional paid leave day to be used within 3 months.',
      pointsRequired: 1500,
      stock: 10,
      status: RewardStatus.Active,
    },
    {
      name: 'Sustainability Workshop Ticket',
      description: 'Entry to the next EcoSphere sustainability masterclass.',
      pointsRequired: 800,
      stock: 0,
      status: RewardStatus.Out_Of_Stock,
    },
    {
      name: 'Charity Donation (Your Choice)',
      description: 'We make a $50 donation to an approved charity of your choice.',
      pointsRequired: 1000,
      stock: 30,
      status: RewardStatus.Active,
    },
  ];

  for (const r of rewards) {
    await prisma.reward.upsert({
      where: { id: r.name } as any,
      update: {},
      create: r,
    }).catch(async () => {
      // upsert by name fallback
      const existing = await prisma.reward.findFirst({ where: { name: r.name } });
      if (!existing) await prisma.reward.create({ data: r });
    });
  }

  // Ensure rewards are created (simpler approach since no unique name constraint)
  const existingRewards = await prisma.reward.count();
  if (existingRewards === 0) {
    await prisma.reward.createMany({ data: rewards });
  }

  console.log('Seeding complete.');
  console.log('\nTest credentials:');
  console.log('  Admin      — admin@ecosphere.dev     / Admin@123');
  console.log('  ESG Manager— manager@ecosphere.dev   / Manager@123');
  console.log('  Employee   — employee@ecosphere.dev  / Employee@123');
  console.log(`\n  Employee "${employee.name}" has 2000 XP and can redeem rewards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
