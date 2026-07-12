import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BadgesService } from './badges.service';

@ApiTags('Badges')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active badges' })
  findAll() {
    return this.badgesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a badge by ID' })
  findOne(@Param('id') id: string) {
    return this.badgesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new badge' })
  create(
    @Body()
    dto: {
      name: string;
      description: string;
      icon?: string;
      unlockRule?: any;
    },
  ) {
    return this.badgesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing badge' })
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      icon?: string;
      unlockRule?: any;
    },
  ) {
    return this.badgesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a badge' })
  remove(@Param('id') id: string) {
    return this.badgesService.remove(id);
  }
}
