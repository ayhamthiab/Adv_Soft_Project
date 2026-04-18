import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { QueryCheckpointDto } from './dto/query-checkpoint.dto';
import {
  FindAllCheckpointsResponse,
  CheckpointHistoryResponse,
  CheckpointModel,
} from './types';

@Injectable()
export class CheckpointsService {
  private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'name'];
  private readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  constructor(private readonly prisma: PrismaService) {}

  private get prismaClient(): any {
    return this.prisma as any;
  }

  async create(
    createCheckpointDto: CreateCheckpointDto,
  ): Promise<CheckpointModel> {
    try {
      return await this.prismaClient.checkpoint.create({
        data: {
          ...createCheckpointDto,
          status: (createCheckpointDto.status ?? 'open') as any,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create checkpoint');
    }
  }

  async findAll(
    query: QueryCheckpointDto,
  ): Promise<FindAllCheckpointsResponse> {
    try {
      const { page, limit } = this.parsePaginationParams(query);
      const { sortField, sortOrder } = this.validateSortParams(query);

      const whereConditions = this.buildWhereConditions(query);

      const [checkpoints, total] = await Promise.all([
        this.prismaClient.checkpoint.findMany({
          where: whereConditions,
          orderBy: {
            [sortField]: sortOrder,
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prismaClient.checkpoint.count({
          where: whereConditions,
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        data: checkpoints,
        meta: {
          total,
          page,
          limit,
          pages,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch checkpoints');
    }
  }

  async findOne(id: number): Promise<CheckpointModel> {
    try {
      const checkpoint = await this.prismaClient.checkpoint.findUnique({
        where: { id },
      });

      if (!checkpoint) {
        throw new NotFoundException(`Checkpoint with ID ${id} not found`);
      }

      return checkpoint;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch checkpoint');
    }
  }

  async update(
    id: number,
    updateCheckpointDto: UpdateCheckpointDto,
  ): Promise<CheckpointModel> {
    try {
      if (Object.keys(updateCheckpointDto).length === 0) {
        throw new BadRequestException('No fields provided to update');
      }

      const currentCheckpoint = await this.prismaClient.checkpoint.findUnique({
        where: { id },
      });

      if (!currentCheckpoint) {
        throw new NotFoundException(`Checkpoint with ID ${id} not found`);
      }

      const checkpoint = await this.prismaClient.checkpoint.update({
        where: { id },
        data: updateCheckpointDto as any,
      });

      if (
        updateCheckpointDto.status &&
        updateCheckpointDto.status !== currentCheckpoint.status
      ) {
        await this.prismaClient.checkpointHistory.create({
          data: {
            checkpointId: id,
            status: updateCheckpointDto.status as any,
          },
        });
      }

      return checkpoint;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Checkpoint with ID ${id} not found`);
        }
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update checkpoint');
    }
  }

  async remove(id: number): Promise<CheckpointModel> {
    try {
      const checkpoint = await this.prismaClient.checkpoint.delete({
        where: { id },
      });

      return checkpoint;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Checkpoint with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to delete checkpoint');
    }
  }

  async getCheckpointHistory(id: number): Promise<CheckpointHistoryResponse> {
    try {
      const history = await this.prismaClient.checkpointHistory.findMany({
        where: { checkpointId: id },
        orderBy: { createdAt: 'desc' },
      });

      return { data: history };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch checkpoint history',
      );
    }
  }

  private parsePaginationParams(query: QueryCheckpointDto): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  private validateSortParams(query: QueryCheckpointDto): {
    sortField: string;
    sortOrder: 'asc' | 'desc';
  } {
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = (query.order ?? 'desc').toLowerCase() as 'asc' | 'desc';

    if (!this.ALLOWED_SORT_FIELDS.includes(sortField)) {
      throw new BadRequestException(
        `Invalid sort field. Allowed fields: ${this.ALLOWED_SORT_FIELDS.join(', ')}`,
      );
    }

    if (!this.ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      throw new BadRequestException(
        `Invalid sort order. Allowed values: ${this.ALLOWED_SORT_ORDERS.join(', ')}`,
      );
    }

    return { sortField, sortOrder };
  }

  private buildWhereConditions(query: QueryCheckpointDto): any {
    return {
      ...(query.name
        ? { name: { contains: query.name, mode: 'insensitive' } }
        : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
  }
}
