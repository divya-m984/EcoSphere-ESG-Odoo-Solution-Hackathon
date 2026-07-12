import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';

/**
 * Static routes (import, import/:batchId) MUST be declared before the
 * parameterised :id route so NestJS resolves them first.
 */
@ApiTags('Admin — Invoices')
@Controller('admin/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminInvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Bulk-import invoices from a CSV file (columns: category, departmentCode, vendorName, invoiceNumber, invoiceDate, quantity, unit, amount, currency). Bad rows are reported individually and do not fail the whole batch.',
  })
  importCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file")');
    }
    return this.invoicesService.importCsv(file.buffer, file.originalname, user.id);
  }

  @Get('import/:batchId')
  @ApiOperation({ summary: 'Get a past CSV import batch result, including per-row errors' })
  getImportBatch(@Param('batchId') batchId: string) {
    return this.invoicesService.getImportBatch(batchId);
  }

  @Get()
  @ApiOperation({ summary: 'List/filter invoices by category, department, and date range' })
  findAll(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice with its calculated emission' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Manually create a single invoice (auto-calculates its emission)' })
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthenticatedUser) {
    return this.invoicesService.create(dto, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit an invoice (recomputes its linked emission if calc-relevant fields change)',
  })
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an invoice and deactivate its linked emission record' })
  remove(@Param('id') id: string) {
    return this.invoicesService.remove(id);
  }
}
