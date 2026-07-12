import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { EmissionFactorsService } from './emission-factors.service';
import { CreateEmissionFactorDto } from './dto/create-emission-factor.dto';
import { UpdateEmissionFactorDto } from './dto/update-emission-factor.dto';
import { QueryEmissionFactorsDto } from './dto/query-emission-factors.dto';

@ApiTags('Admin — Emission Factors')
@Controller('admin/emission-factors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminEmissionFactorsController {
  constructor(private readonly emissionFactorsService: EmissionFactorsService) {}

  @Get()
  @ApiOperation({
    summary: 'List emission factors, filterable by activityType/region/source/validYear',
  })
  findAll(@Query() query: QueryEmissionFactorsDto) {
    return this.emissionFactorsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single emission factor by ID' })
  findOne(@Param('id') id: string) {
    return this.emissionFactorsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new emission factor' })
  create(@Body() dto: CreateEmissionFactorDto) {
    return this.emissionFactorsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an emission factor' })
  update(@Param('id') id: string, @Body() dto: UpdateEmissionFactorDto) {
    return this.emissionFactorsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete (deactivate) an emission factor' })
  remove(@Param('id') id: string) {
    return this.emissionFactorsService.remove(id);
  }
}
