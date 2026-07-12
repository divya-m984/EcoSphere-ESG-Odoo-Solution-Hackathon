import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EmissionSource, InvoiceCategory } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { CarbonEngineService } from '../carbon-engine/carbon-engine.service';

const DEPARTMENT_ID = 'dept-uuid';
const INVOICE_ID = 'inv-uuid';
const USER_ID = 'user-uuid';

const department = { id: DEPARTMENT_ID, code: 'ENG', countryCode: 'US', active: true };

const electricityFactor = {
  id: 'factor-elec',
  activityType: InvoiceCategory.Electricity,
  unit: 'kWh',
  region: 'US',
  factorValue: 0.4,
  source: EmissionSource.DEFRA,
  validYear: 2026,
  active: true,
};

const createdInvoice = {
  id: INVOICE_ID,
  category: InvoiceCategory.Electricity,
  departmentId: DEPARTMENT_ID,
  vendorName: 'Acme Power',
  invoiceDate: new Date('2026-06-15'),
  quantity: 100,
  unit: 'kWh',
  amount: 250,
  currency: 'USD',
  active: true,
  carbonTransactionId: 'ctx-uuid',
  carbonTransaction: { id: 'ctx-uuid', calculatedEmission: 40 },
};

function makePrisma(overrides: Record<string, any> = {}): any {
  return {
    department: { findUnique: jest.fn().mockResolvedValue(department) },
    invoice: {
      findMany: jest.fn().mockResolvedValue([createdInvoice]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn().mockResolvedValue(createdInvoice),
      create: jest.fn().mockResolvedValue(createdInvoice),
      update: jest.fn().mockResolvedValue(createdInvoice),
    },
    carbonTransaction: { update: jest.fn().mockResolvedValue({}) },
    invoiceImportBatch: {
      create: jest.fn().mockResolvedValue({ id: 'batch-uuid' }),
      update: jest
        .fn()
        .mockImplementation(({ data }: any) => Promise.resolve({ id: 'batch-uuid', ...data })),
      findUnique: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation((fn: (tx: any) => Promise<any>) => fn(prismaTxStub(overrides))),
    ...overrides,
  };
}

function prismaTxStub(overrides: Record<string, any>) {
  return {
    invoice: {
      update: jest.fn().mockResolvedValue(createdInvoice),
      findUnique: jest.fn().mockResolvedValue(createdInvoice),
    },
    carbonTransaction: { update: jest.fn().mockResolvedValue({}) },
    ...overrides.tx,
  };
}

function makeCarbonEngineService(): any {
  return {
    calculateInvoiceEmission: jest
      .fn()
      .mockResolvedValue({ factor: electricityFactor, calculatedEmission: 40 }),
  };
}

describe('InvoicesService', () => {
  function build(prismaOverrides: Record<string, any> = {}) {
    const prisma = makePrisma(prismaOverrides);
    const carbonEngineService = makeCarbonEngineService();
    const service = new InvoicesService(
      prisma as unknown as PrismaService,
      carbonEngineService as unknown as CarbonEngineService,
    );
    return { service, prisma, carbonEngineService };
  }

  describe('create', () => {
    it('resolves the factor via CarbonEngineService and creates invoice+transaction together', async () => {
      const { service, prisma, carbonEngineService } = build();

      const result = await service.create(
        {
          category: InvoiceCategory.Electricity,
          departmentId: DEPARTMENT_ID,
          vendorName: 'Acme Power',
          invoiceDate: '2026-06-15',
          quantity: 100,
          unit: 'kWh',
          amount: 250,
        },
        USER_ID,
      );

      expect(carbonEngineService.calculateInvoiceEmission).toHaveBeenCalledWith(
        InvoiceCategory.Electricity,
        'US',
        'kWh',
        100,
        2026,
      );
      expect(prisma.invoice.create).toHaveBeenCalled();
      expect(result).toEqual(createdInvoice);
    });

    it('propagates NotFoundException when no factor can be resolved (does not silently skip)', async () => {
      const carbonEngineService = {
        calculateInvoiceEmission: jest.fn().mockRejectedValue(new NotFoundException()),
      };
      const prisma = makePrisma();
      const failingService = new InvoicesService(prisma, carbonEngineService as any);

      await expect(
        failingService.create(
          {
            category: InvoiceCategory.Electricity,
            departmentId: DEPARTMENT_ID,
            vendorName: 'Acme Power',
            invoiceDate: '2026-06-15',
            quantity: 100,
            unit: 'kWh',
            amount: 250,
          },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for an unknown department', async () => {
      const { service } = build({ department: { findUnique: jest.fn().mockResolvedValue(null) } });

      await expect(
        service.create(
          {
            category: InvoiceCategory.Electricity,
            departmentId: 'missing-dept',
            vendorName: 'Acme Power',
            invoiceDate: '2026-06-15',
            quantity: 100,
            unit: 'kWh',
            amount: 250,
          },
          USER_ID,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('re-resolves the factor and updates the linked CarbonTransaction when quantity changes', async () => {
      const { service, carbonEngineService } = build();

      await service.update(INVOICE_ID, { quantity: 200 });

      expect(carbonEngineService.calculateInvoiceEmission).toHaveBeenCalled();
    });

    it('skips recalculation entirely when no calc-relevant field changes', async () => {
      const { service, prisma, carbonEngineService } = build();

      await service.update(INVOICE_ID, { vendorName: 'New Vendor Name' });

      expect(carbonEngineService.calculateInvoiceEmission).not.toHaveBeenCalled();
      expect(prisma.invoice.update).toHaveBeenCalled();
    });
  });

  describe('importCsv', () => {
    it('does not fail the whole batch on one bad row and reports per-row errors', async () => {
      const { service, prisma } = build();
      const csv =
        'category,departmentCode,vendorName,invoiceNumber,invoiceDate,quantity,unit,amount,currency\n' +
        'Electricity,ENG,Acme Power,INV-1,2026-06-15,100,kWh,250,USD\n' +
        'NotACategory,ENG,Bad Row,INV-2,2026-06-16,50,kWh,100,USD\n';

      const result = await service.importCsv(Buffer.from(csv), 'invoices.csv', USER_ID);

      expect(prisma.invoiceImportBatch.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ totalRows: 2 }) }),
      );
      expect(result.successRows).toBe(1);
      expect(result.failedRows).toBe(1);
      expect((result.errorReport as any)[0]).toEqual(
        expect.objectContaining({ row: 3, reason: expect.stringContaining('category') }),
      );
      expect(prisma.invoice.create).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown departmentCode per-row', async () => {
      const { service, prisma } = build({
        department: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      const csv =
        'category,departmentCode,vendorName,invoiceNumber,invoiceDate,quantity,unit,amount,currency\n' +
        'Electricity,NOPE,Acme Power,INV-1,2026-06-15,100,kWh,250,USD\n';

      const result = await service.importCsv(Buffer.from(csv), 'invoices.csv', USER_ID);

      expect(result.failedRows).toBe(1);
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException on unparseable CSV content', async () => {
      const { service } = build();
      // csv-parse chokes on inconsistent column counts when columns:true expects a matching header
      const malformed = Buffer.from('"unterminated quote,\nfoo,bar\n');

      await expect(service.importCsv(malformed, 'bad.csv', USER_ID)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
