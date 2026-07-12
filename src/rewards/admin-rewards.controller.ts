import {
  Body,
  Controller,
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
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { UpdateRewardStatusDto } from './dto/update-reward-status.dto';
import { QueryRewardsDto } from './dto/query-rewards.dto';

@ApiTags('Admin — Rewards')
@Controller('admin/rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin', 'ESG_Manager')
@ApiBearerAuth()
export class AdminRewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'List all rewards (admin view with counts)' })
  findAll(@Query() query: QueryRewardsDto) {
    return this.rewardsService.adminFindAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reward' })
  create(@Body() dto: CreateRewardDto) {
    return this.rewardsService.adminCreate(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reward details and/or restock' })
  update(@Param('id') id: string, @Body() dto: UpdateRewardDto) {
    return this.rewardsService.adminUpdate(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate a reward' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateRewardStatusDto) {
    return this.rewardsService.adminUpdateStatus(id, dto);
  }

  @Get(':id/redemptions')
  @ApiOperation({ summary: 'List all redemptions for a specific reward' })
  getRedemptions(@Param('id') id: string) {
    return this.rewardsService.adminGetRedemptions(id);
  }
}
