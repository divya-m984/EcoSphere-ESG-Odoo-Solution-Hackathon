import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(
    @Body()
    dto: {
      title: string;
      description: string;
      xpPerCompletion: number;
      evidenceRequired: boolean;
      cadence: string;
      participation: string;
      milestones: string;
      status: string;
      category?: string;
    },
  ) {
    return this.tasksService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing task' })
  update(
    @Param('id') id: string,
    @Body()
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
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task' })
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
