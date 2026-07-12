import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
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

  private parseDescription(rawDesc: string) {
    try {
      if (rawDesc.startsWith('{') && rawDesc.endsWith('}')) {
        const parsed = JSON.parse(rawDesc);
        return {
          descriptionText: parsed.descriptionText || '',
          cadence: parsed.cadence || 'Daily',
          participation: parsed.participation || 'Solo',
          milestones: parsed.milestones || '1 tier',
          status: parsed.status || 'Active',
        };
      }
    } catch {
      // Fallback if not JSON
    }
    return {
      descriptionText: rawDesc,
      cadence: 'Daily',
      participation: 'Solo',
      milestones: '1 tier',
      status: 'Active',
    };
  }

  async findAll() {
    const activities = await this.prisma.cSRActivity.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return activities.map((act) => {
      const parsed = this.parseDescription(act.description);
      return {
        id: act.id,
        title: act.title,
        description: parsed.descriptionText,
        categoryId: act.categoryId,
        categoryName: act.category.name,
        xpPerCompletion: act.pointsValue,
        evidenceRequired: act.evidenceRequired,
        activityDate: act.activityDate,
        cadence: parsed.cadence,
        participation: parsed.participation,
        milestones: parsed.milestones,
        status: parsed.status,
      };
    });
  }

  async findOne(id: string) {
    const act = await this.prisma.cSRActivity.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!act) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    const parsed = this.parseDescription(act.description);
    return {
      id: act.id,
      title: act.title,
      description: parsed.descriptionText,
      categoryId: act.categoryId,
      categoryName: act.category.name,
      xpPerCompletion: act.pointsValue,
      evidenceRequired: act.evidenceRequired,
      activityDate: act.activityDate,
      cadence: parsed.cadence,
      participation: parsed.participation,
      milestones: parsed.milestones,
      status: parsed.status,
    };
  }

  async create(dto: {
    title: string;
    description: string;
    xpPerCompletion: number;
    evidenceRequired: boolean;
    cadence: string;
    participation: string;
    milestones: string;
    status: string;
    category?: string;
  }) {
    const categoryName = dto.category || 'Environmental';
    const cat = await this.getOrCreateCategory(categoryName, 'CSR_Activity');

    // Serialize details inside the description
    const serializedDescription = JSON.stringify({
      descriptionText: dto.description || '',
      cadence: dto.cadence || 'Daily',
      participation: dto.participation || 'Solo',
      milestones: dto.milestones || '1 tier',
      status: dto.status || 'Active',
    });

    return this.prisma.cSRActivity.create({
      data: {
        title: dto.title,
        categoryId: cat.id,
        description: serializedDescription,
        activityDate: new Date(),
        pointsValue: dto.xpPerCompletion || 100,
        evidenceRequired: dto.evidenceRequired || false,
      },
    });
  }

  async update(
    id: string,
    dto: {
      title?: string;
      description?: string;
      xpPerCompletion?: number;
      evidenceRequired?: boolean;
      cadence?: string;
      participation?: string;
      milestones?: string;
      status?: string;
      category?: string;
    },
  ) {
    const existing = await this.findOne(id);

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.xpPerCompletion !== undefined) updateData.pointsValue = dto.xpPerCompletion;
    if (dto.evidenceRequired !== undefined) updateData.evidenceRequired = dto.evidenceRequired;

    if (dto.category) {
      const cat = await this.getOrCreateCategory(dto.category, 'CSR_Activity');
      updateData.categoryId = cat.id;
    }

    // Merge serialized properties
    const newDescriptionText = dto.description !== undefined ? dto.description : existing.description;
    const newCadence = dto.cadence !== undefined ? dto.cadence : existing.cadence;
    const newParticipation = dto.participation !== undefined ? dto.participation : existing.participation;
    const newMilestones = dto.milestones !== undefined ? dto.milestones : existing.milestones;
    const newStatus = dto.status !== undefined ? dto.status : existing.status;

    updateData.description = JSON.stringify({
      descriptionText: newDescriptionText,
      cadence: newCadence,
      participation: newParticipation,
      milestones: newMilestones,
      status: newStatus,
    });

    return this.prisma.cSRActivity.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const act = await this.prisma.cSRActivity.findUnique({ where: { id } });
    if (!act) throw new NotFoundException(`Task with ID ${id} not found`);

    return this.prisma.cSRActivity.update({
      where: { id },
      data: { active: false },
    });
  }
}
