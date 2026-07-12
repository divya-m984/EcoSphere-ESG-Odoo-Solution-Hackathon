import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { InvoiceCategory } from '@prisma/client';

export class CreateInvoiceDto {
  @IsEnum(InvoiceCategory)
  category!: InvoiceCategory;

  @IsUUID()
  departmentId!: string;

  @IsString()
  @MinLength(1)
  vendorName!: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsDateString()
  invoiceDate!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsString()
  @MinLength(1)
  unit!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUrl()
  attachmentUrl?: string;
}
