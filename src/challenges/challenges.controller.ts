import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ChallengesService } from './challenges.service';

@ApiTags('Challenges')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active challenges' })
  findAll() {
    return this.challengesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a challenge by ID' })
  findOne(@Param('id') id: string) {
    return this.challengesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new challenge' })
  create(
    @Body()
    dto: {
      title: string;
      category: string;
      description: string;
      xpReward: number;
      difficulty: string;
      evidenceRequired: boolean;
      deadline: string;
      status: string;
    },
  ) {
    return this.challengesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing challenge' })
  update(
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      category?: string;
      description?: string;
      xpReward?: number;
      difficulty?: string;
      evidenceRequired?: boolean;
      deadline?: string;
      status?: string;
    },
  ) {
    return this.challengesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a challenge' })
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
