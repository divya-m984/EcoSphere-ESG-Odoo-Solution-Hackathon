import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.badge.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
    });
    if (!badge) {
      throw new NotFoundException(`Badge with ID ${id} not found`);
    }
    return badge;
  }

  async create(dto: {
    name: string;
    description: string;
    icon?: string;
    unlockRule?: any;
  }) {
    return this.prisma.badge.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        icon: dto.icon || 'trophy',
        unlockRule: dto.unlockRule || {},
      },
    });
  }

  async update(
    id: string,
    dto: {
      name?: string;
      description?: string;
      icon?: string;
      unlockRule?: any;
    },
  ) {
    await this.findOne(id);
    return this.prisma.badge.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        icon: dto.icon,
        unlockRule: dto.unlockRule,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.badge.update({
      where: { id },
      data: { active: false },
    });
  }
}
