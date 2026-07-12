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

import {
  PrismaClient,
  UserRole,
  RewardStatus,
  TransportMode,
  InvoiceCategory,
  AttendanceStatus,
  EmissionSource,
} from '@prisma/client';
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

  // ── Carbon emissions: emission factors ─────────────────────────────────────
  const currentYear = new Date().getUTCFullYear();

  const transportFactors: { mode: TransportMode; value: number }[] = [
    { mode: TransportMode.Car_Petrol, value: 0.192 },
    { mode: TransportMode.Car_Diesel, value: 0.171 },
    { mode: TransportMode.Car_Electric, value: 0.053 },
    { mode: TransportMode.Motorcycle, value: 0.113 },
    { mode: TransportMode.Bus, value: 0.105 },
    { mode: TransportMode.Train, value: 0.041 },
    { mode: TransportMode.Bicycle, value: 0 },
    { mode: TransportMode.Walk, value: 0 },
    { mode: TransportMode.Carpool, value: 0.096 },
  ];

  for (const { mode, value } of transportFactors) {
    await prisma.emissionFactor.upsert({
      where: {
        uq_emission_factors_lookup: { activityType: mode, region: 'US', unit: 'km', validYear: currentYear },
      },
      update: {},
      create: {
        activityType: mode,
        unit: 'km',
        region: 'US',
        factorValue: value,
        source: EmissionSource.DEFRA,
        validYear: currentYear,
        referenceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
      },
    });
  }

  const invoiceFactors: { category: InvoiceCategory; unit: string; value: number }[] = [
    { category: InvoiceCategory.Electricity, unit: 'kWh', value: 0.4 },
    { category: InvoiceCategory.Fuel, unit: 'liter', value: 2.31 },
    { category: InvoiceCategory.Diesel, unit: 'liter', value: 2.68 },
    { category: InvoiceCategory.Petrol, unit: 'liter', value: 2.31 },
    { category: InvoiceCategory.Natural_Gas, unit: 'therm', value: 5.3 },
    { category: InvoiceCategory.Air_Travel, unit: 'km', value: 0.15 },
    { category: InvoiceCategory.Hotel, unit: 'room-night', value: 20 },
    { category: InvoiceCategory.Office_Purchases, unit: 'USD', value: 0.05 },
    { category: InvoiceCategory.Waste_Disposal, unit: 'kg', value: 0.45 },
  ];

  for (const { category, unit, value } of invoiceFactors) {
    await prisma.emissionFactor.upsert({
      where: {
        uq_emission_factors_lookup: { activityType: category, region: 'US', unit, validYear: currentYear },
      },
      update: {},
      create: {
        activityType: category,
        unit,
        region: 'US',
        factorValue: value,
        source: EmissionSource.DEFRA,
        validYear: currentYear,
        referenceUrl: 'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
      },
    });
  }
  console.log(`  Seeded ${transportFactors.length + invoiceFactors.length} emission factors for ${currentYear}`);

  // ── Carbon emissions: employee commute profile + attendance ────────────────
  const commuteProfile = await prisma.employeeCommuteProfile.upsert({
    where: { employeeId: employee.id },
    update: {},
    create: {
      employeeId: employee.id,
      transportMode: TransportMode.Car_Petrol,
      distanceKm: 12,
      roundTrip: true,
    },
  });

  const carFactor = await prisma.emissionFactor.findUniqueOrThrow({
    where: {
      uq_emission_factors_lookup: {
        activityType: TransportMode.Car_Petrol,
        region: 'US',
        unit: 'km',
        validYear: currentYear,
      },
    },
  });

  const now = new Date();
  const periodsToSeed = [
    { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 },
    now.getUTCMonth() === 0
      ? { year: now.getUTCFullYear() - 1, month: 12 }
      : { year: now.getUTCFullYear(), month: now.getUTCMonth() },
  ];

  for (const { year, month } of periodsToSeed) {
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    let attendedDays = 0;

    for (let day = 1; day <= Math.min(daysInMonth, 20); day++) {
      const date = new Date(Date.UTC(year, month - 1, day));
      const dayOfWeek = date.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      const status = day % 9 === 0 ? AttendanceStatus.Leave : day % 5 === 0 ? AttendanceStatus.WFH : AttendanceStatus.Present;

      await prisma.attendance.upsert({
        where: { uq_attendance_employee_date: { employeeId: employee.id, date } },
        update: {},
        create: { employeeId: employee.id, date, status },
      });

      if (status === AttendanceStatus.Present) attendedDays++;
    }

    const distancePerDay = Number(commuteProfile.distanceKm) * (commuteProfile.roundTrip ? 2 : 1);
    const totalDistanceKm = distancePerDay * attendedDays;
    const totalEmissionKgCo2e = totalDistanceKm * Number(carFactor.factorValue);

    await prisma.employeeMonthlyEmission.upsert({
      where: { uq_employee_monthly_emission: { employeeId: employee.id, periodYear: year, periodMonth: month } },
      update: { attendedDays, totalDistanceKm, totalEmissionKgCo2e, lastRecalculatedAt: new Date() },
      create: { employeeId: employee.id, periodYear: year, periodMonth: month, attendedDays, totalDistanceKm, totalEmissionKgCo2e },
    });
  }
  console.log(`  Seeded commute profile and attendance for "${employee.name}" across ${periodsToSeed.length} months`);

  // ── Carbon emissions: sample invoices (each auto-creates its CarbonTransaction) ─
  const sampleInvoices: { category: InvoiceCategory; unit: string; vendorName: string; quantity: number; amount: number; monthsAgo: number }[] = [
    { category: InvoiceCategory.Electricity, unit: 'kWh', vendorName: 'CityPower Utilities', quantity: 4200, amount: 630, monthsAgo: 0 },
    { category: InvoiceCategory.Natural_Gas, unit: 'therm', vendorName: 'Metro Gas Co.', quantity: 180, amount: 220, monthsAgo: 0 },
    { category: InvoiceCategory.Air_Travel, unit: 'km', vendorName: 'SkyLine Airlines', quantity: 3500, amount: 890, monthsAgo: 1 },
    { category: InvoiceCategory.Office_Purchases, unit: 'USD', vendorName: 'OfficeMart', quantity: 1200, amount: 1200, monthsAgo: 1 },
    { category: InvoiceCategory.Waste_Disposal, unit: 'kg', vendorName: 'GreenCycle Waste Mgmt', quantity: 850, amount: 340, monthsAgo: 0 },
  ];

  const existingInvoiceCount = await prisma.invoice.count();
  if (existingInvoiceCount === 0) {
    for (const inv of sampleInvoices) {
      const invoiceDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - inv.monthsAgo, 10));
      // Seed factors only exist for `currentYear` — use that for lookup even if
      // monthsAgo pushed invoiceDate into the prior calendar year.
      const factor = await prisma.emissionFactor.findUniqueOrThrow({
        where: {
          uq_emission_factors_lookup: {
            activityType: inv.category,
            region: 'US',
            unit: inv.unit,
            validYear: currentYear,
          },
        },
      });
      const calculatedEmission = inv.quantity * Number(factor.factorValue);

      await prisma.invoice.create({
        data: {
          category: inv.category,
          department: { connect: { id: dept.id } },
          vendorName: inv.vendorName,
          invoiceDate,
          quantity: inv.quantity,
          unit: inv.unit,
          amount: inv.amount,
          createdByUser: { connect: { id: adminUser.id } },
          carbonTransaction: {
            create: {
              emissionFactor: { connect: { id: factor.id } },
              factorValueSnapshot: factor.factorValue,
              quantity: inv.quantity,
              unit: inv.unit,
              calculatedEmission,
              department: { connect: { id: dept.id } },
              txnDate: invoiceDate,
              autoCalculated: true,
            },
          },
        },
      });
    }
    console.log(`  Seeded ${sampleInvoices.length} sample invoices with calculated emissions`);
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
