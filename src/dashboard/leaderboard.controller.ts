import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/jwt.strategy';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Leaderboard')
@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeaderboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get community leaderboard ranked by XP' })
  async getLeaderboard(@CurrentUser() user: AuthenticatedUser) {
    const employees = await this.prisma.employee.findMany({
      where: { active: true },
      include: {
        department: { select: { name: true } },
        xpEvents: { select: { delta: true } },
      },
    });

    const entries = employees.map((emp) => {
      const xp = emp.xpEvents.reduce((sum, evt) => sum + evt.delta, 0);
      const nameParts = emp.name.split(' ');
      const initials = nameParts.map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'E';

      return {
        id: emp.id,
        name: emp.name,
        department: emp.department.name,
        xp: xp || 0,
        streak: 3, // Realistic mock streak value
        movement: 'same',
        initials,
        isCurrentUser: emp.id === user.employeeId,
      };
    });

    // Sort descending by XP
    entries.sort((a, b) => b.xp - a.xp);

    return entries;
  }
}
