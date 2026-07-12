import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceCategory, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { CarbonEngineService } from '../carbon-engine/carbon-engine.service';
import type { CreateInvoiceDto } from './dto/create-invoice.dto';
import type { UpdateInvoiceDto } from './dto/update-invoice.dto';
import type { QueryInvoicesDto } from './dto/query-invoices.dto';

interface CsvRow {
  category?: string;
  departmentCode?: string;
  vendorName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  quantity?: string;
  unit?: string;
  amount?: string;
  currency?: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly carbonEngineService: CarbonEngineService,
  ) {}

  async findAll(query: QueryInvoicesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = { active: true };
    if (query.category) where.category = query.category;
    if (query.departmentId) where.departmentId = query.departmentId;
    if (query.dateFrom || query.dateTo) {
      where.invoiceDate = {};
      if (query.dateFrom) where.invoiceDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.invoiceDate.lte = new Date(query.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
        include: { carbonTransaction: true, department: { select: { id: true, name: true } } },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { carbonTransaction: true, department: { select: { id: true, name: true } } },
    });
    if (!invoice || !invoice.active) {
      throw new NotFoundException(`Invoice ${id} not found`);
    }
    return invoice;
  }

  async create(dto: CreateInvoiceDto, createdByUserId: string) {
    const department = await this.requireDepartment(dto.departmentId);
    const invoiceDate = new Date(dto.invoiceDate);

    const { factor, calculatedEmission } = await this.carbonEngineService.calculateInvoiceEmission(
      dto.category,
      department.countryCode,
      dto.unit,
      dto.quantity,
      invoiceDate.getUTCFullYear(),
    );

    return this.prisma.invoice.create({
      data: {
        category: dto.category,
        department: { connect: { id: dto.departmentId } },
        vendorName: dto.vendorName,
        invoiceNumber: dto.invoiceNumber,
        invoiceDate,
        quantity: dto.quantity,
        unit: dto.unit,
        amount: dto.amount,
        currency: dto.currency ?? 'USD',
        attachmentUrl: dto.attachmentUrl,
        createdByUser: { connect: { id: createdByUserId } },
        carbonTransaction: {
          create: {
            emissionFactor: { connect: { id: factor.id } },
            factorValueSnapshot: factor.factorValue,
            quantity: dto.quantity,
            unit: dto.unit,
            calculatedEmission,
            department: { connect: { id: dto.departmentId } },
            txnDate: invoiceDate,
            autoCalculated: true,
          },
        },
      },
      include: { carbonTransaction: true },
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.findOne(id);

    const category = dto.category ?? existing.category;
    const departmentId = dto.departmentId ?? existing.departmentId;
    const unit = dto.unit ?? existing.unit;
    const quantity = dto.quantity ?? Number(existing.quantity);
    const invoiceDate = dto.invoiceDate ? new Date(dto.invoiceDate) : existing.invoiceDate;

    const recalcNeeded =
      dto.category !== undefined ||
      dto.departmentId !== undefined ||
      dto.unit !== undefined ||
      dto.quantity !== undefined ||
      dto.invoiceDate !== undefined;

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.departmentId !== undefined) data.department = { connect: { id: dto.departmentId } };
    if (dto.vendorName !== undefined) data.vendorName = dto.vendorName;
    if (dto.invoiceNumber !== undefined) data.invoiceNumber = dto.invoiceNumber;
    if (dto.invoiceDate !== undefined) data.invoiceDate = invoiceDate;
    if (dto.quantity !== undefined) data.quantity = dto.quantity;
    if (dto.unit !== undefined) data.unit = unit;
    if (dto.amount !== undefined) data.amount = dto.amount;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.attachmentUrl !== undefined) data.attachmentUrl = dto.attachmentUrl;

    if (!recalcNeeded) {
      return this.prisma.invoice.update({
        where: { id },
        data,
        include: { carbonTransaction: true },
      });
    }

    const department = await this.requireDepartment(departmentId);
    const { factor, calculatedEmission } = await this.carbonEngineService.calculateInvoiceEmission(
      category,
      department.countryCode,
      unit,
      quantity,
      invoiceDate.getUTCFullYear(),
    );

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data,
        include: { carbonTransaction: true },
      });
      if (updated.carbonTransactionId) {
        await tx.carbonTransaction.update({
          where: { id: updated.carbonTransactionId },
          data: {
            emissionFactorId: factor.id,
            factorValueSnapshot: factor.factorValue,
            quantity,
            unit,
            calculatedEmission,
            departmentId,
            txnDate: invoiceDate,
          },
        });
      }
      return tx.invoice.findUnique({ where: { id }, include: { carbonTransaction: true } });
    });
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({ where: { id }, data: { active: false } });
      if (existing.carbonTransactionId) {
        await tx.carbonTransaction.update({
          where: { id: existing.carbonTransactionId },
          data: { active: false },
        });
      }
      return updated;
    });
  }

  async importCsv(fileBuffer: Buffer, fileName: string, uploadedByUserId: string) {
    let rows: CsvRow[];
    try {
      rows = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
    } catch (err: any) {
      throw new BadRequestException(`Could not parse CSV file: ${err.message}`);
    }

    const batch = await this.prisma.invoiceImportBatch.create({
      data: { fileName, uploadedByUserId, totalRows: rows.length },
    });

    const errors: { row: number; reason: string }[] = [];
    let successRows = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // account for header row, 1-indexed
      try {
        const dto = await this.mapCsvRow(rows[i]);
        const invoice = await this.create(dto, uploadedByUserId);
        await this.prisma.invoice.update({
          where: { id: invoice.id },
          data: { importBatchId: batch.id },
        });
        successRows++;
      } catch (err: any) {
        errors.push({ row: rowNumber, reason: err?.message ?? 'Unknown error' });
      }
    }

    return this.prisma.invoiceImportBatch.update({
      where: { id: batch.id },
      data: {
        successRows,
        failedRows: errors.length,
        errorReport: errors,
      },
    });
  }

  async getImportBatch(id: string) {
    const batch = await this.prisma.invoiceImportBatch.findUnique({
      where: { id },
      include: {
        invoices: { select: { id: true, vendorName: true, category: true, amount: true } },
      },
    });
    if (!batch) {
      throw new NotFoundException(`Import batch ${id} not found`);
    }
    return batch;
  }

  private async mapCsvRow(row: CsvRow): Promise<CreateInvoiceDto> {
    if (!row.category || !(row.category in InvoiceCategory)) {
      throw new BadRequestException(`Invalid or missing category: "${row.category ?? ''}"`);
    }
    if (!row.departmentCode) {
      throw new BadRequestException('Missing departmentCode');
    }
    const department = await this.prisma.department.findUnique({
      where: { code: row.departmentCode },
    });
    if (!department || !department.active) {
      throw new BadRequestException(`Unknown departmentCode: "${row.departmentCode}"`);
    }
    if (!row.vendorName) throw new BadRequestException('Missing vendorName');
    if (!row.invoiceDate || Number.isNaN(new Date(row.invoiceDate).getTime())) {
      throw new BadRequestException(`Invalid invoiceDate: "${row.invoiceDate ?? ''}"`);
    }
    const quantity = Number(row.quantity);
    if (!row.quantity || Number.isNaN(quantity) || quantity < 0) {
      throw new BadRequestException(`Invalid quantity: "${row.quantity ?? ''}"`);
    }
    if (!row.unit) throw new BadRequestException('Missing unit');
    const amount = Number(row.amount);
    if (!row.amount || Number.isNaN(amount) || amount < 0) {
      throw new BadRequestException(`Invalid amount: "${row.amount ?? ''}"`);
    }

    return {
      category: row.category as InvoiceCategory,
      departmentId: department.id,
      vendorName: row.vendorName,
      invoiceNumber: row.invoiceNumber,
      invoiceDate: row.invoiceDate,
      quantity,
      unit: row.unit,
      amount,
      currency: row.currency,
    };
  }

  private async requireDepartment(departmentId: string) {
    const department = await this.prisma.department.findUnique({ where: { id: departmentId } });
    if (!department || !department.active) {
      throw new NotFoundException(`Department ${departmentId} not found`);
    }
    return department;
  }
}
