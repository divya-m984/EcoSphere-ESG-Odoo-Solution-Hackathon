import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengeDifficulty, ChallengeStatus } from '@prisma/client';

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateCategory(name: string, type: 'Challenge' | 'CSR_Activity') {
    const existing = await this.prisma.category.findFirst({
      where: { name, type },
    });
    if (existing) return existing;
    return this.prisma.category.create({
      data: { name, type },
    });
  }

  async findAll() {
    return this.prisma.challenge.findMany({
      where: { active: true },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!challenge) {
      throw new NotFoundException(`Challenge with ID ${id} not found`);
    }
    return challenge;
  }

  async create(dto: {
    title: string;
    category: string;
    description: string;
    xpReward: number;
    difficulty: string;
    evidenceRequired: boolean;
    deadline: string;
    status: string;
  }) {
    const cat = await this.getOrCreateCategory(dto.category, 'Challenge');
    
    // Parse difficulty and status enums or fallback
    const difficulty = (dto.difficulty as ChallengeDifficulty) || ChallengeDifficulty.Medium;
    const status = (dto.status as ChallengeStatus) || ChallengeStatus.Draft;
    const deadlineDate = dto.deadline ? new Date(dto.deadline) : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        description: dto.description || '',
        xpReward: dto.xpReward,
        difficulty,
        evidenceRequired: dto.evidenceRequired,
        deadline: deadlineDate,
        status,
        categoryId: cat.id,
      },
    });
  }

  async update(
    id: string,
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
    await this.findOne(id);

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.xpReward !== undefined) updateData.xpReward = dto.xpReward;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty as ChallengeDifficulty;
    if (dto.evidenceRequired !== undefined) updateData.evidenceRequired = dto.evidenceRequired;
    if (dto.deadline !== undefined) updateData.deadline = new Date(dto.deadline);
    if (dto.status !== undefined) updateData.status = dto.status as ChallengeStatus;

    if (dto.category) {
      const cat = await this.getOrCreateCategory(dto.category, 'Challenge');
      updateData.categoryId = cat.id;
    }

    return this.prisma.challenge.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.challenge.update({
      where: { id },
      data: { active: false },
    });
  }
}
