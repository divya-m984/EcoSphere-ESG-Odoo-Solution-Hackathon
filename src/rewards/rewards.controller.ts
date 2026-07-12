import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { RewardsService } from './rewards.service';
import { QueryRewardsDto } from './dto/query-rewards.dto';

class RedeemDto {
  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;
}

/**
 * Employee-facing rewards endpoints.
 *
 * IMPORTANT: Static routes (balance, redemptions/me) MUST be declared
 * before the parameterised :id route so NestJS resolves them first.
 */
@ApiTags('Rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ── Static routes first ───────────────────────────────────────────────────

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated employee's XP balance" })
  getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.rewardsService.getBalanceForUser(user.employeeId);
  }

  @Get('redemptions/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated employee's redemption history" })
  getMyRedemptions(@CurrentUser() user: AuthenticatedUser) {
    return this.rewardsService.getMyRedemptions(user.employeeId);
  }

  // ── Catalogue ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List active rewards with search, filter and pagination' })
  findAll(@Query() query: QueryRewardsDto) {
    return this.rewardsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single reward by ID (inactive rewards return 404)' })
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  // ── Redemption ────────────────────────────────────────────────────────────

  @Post(':id/redeem')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem a reward using earned XP (Employee only). Send idempotencyKey for safe retries.' })
  redeem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RedeemDto,
  ) {
    return this.rewardsService.redeem(user.employeeId, id, body.idempotencyKey);
  }
}
