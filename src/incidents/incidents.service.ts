import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, Incident } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentDto } from './dto/query-incident.dto';
import { FindAllResponse } from './types';

@Injectable()
export class IncidentsService {
  private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'severity'];
  private readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertsService: AlertsService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto): Promise<Incident> {
    try {
      return await this.prisma.incident.create({
        data: {
          ...createIncidentDto,
          status: (createIncidentDto.status ?? 'active') as any,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create incident');
    }
  }

  async findAll(query: QueryIncidentDto): Promise<FindAllResponse> {
    try {
      return await this.findAllWithORM(query);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch incidents');
    }
  }

  async findAllWithORM(query: QueryIncidentDto): Promise<FindAllResponse> {
    try {
      const { page, limit } = this.parsePaginationParams(query);
      const { sortField, sortOrder } = this.validateSortParams(query);

      const whereConditions = this.buildWhereConditions(query);

      const [incidents, total] = await Promise.all([
        this.prisma.incident.findMany({
          where: whereConditions,
          orderBy: {
            [sortField]: sortOrder,
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.incident.count({
          where: whereConditions,
        }),
      ]);

      const pages = Math.ceil(total / limit);

      return {
        data: incidents,
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
      throw new InternalServerErrorException('Failed to fetch incidents');
    }
  }

  async findOne(id: number): Promise<Incident> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new NotFoundException(`Incident with ID ${id} not found`);
      }

      return incident;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch incident');
    }
  }

  async update(
    id: number,
    updateIncidentDto: UpdateIncidentDto,
  ): Promise<Incident> {
    try {
      if (Object.keys(updateIncidentDto).length === 0) {
        throw new BadRequestException('No fields provided to update');
      }

      const incident = await this.prisma.incident.update({
        where: { id },
        data: updateIncidentDto as any,
      });

      return incident;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Incident with ID ${id} not found`);
        }
      }
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update incident');
    }
  }

  async verify(id: number): Promise<Incident> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new NotFoundException(`Incident with ID ${id} not found`);
      }

      if (incident.status !== 'active') {
        throw new BadRequestException('Only active incidents can be verified');
      }

      const verifiedIncident = await this.prisma.incident.update({
        where: { id },
        data: { status: 'verified' as any },
      });

      // Generate alerts for the verified incident
      await this.alertsService.generateAlertsForIncident(id);

      return verifiedIncident;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify incident');
    }
  }

  async close(id: number): Promise<Incident> {
    try {
      const incident = await this.prisma.incident.findUnique({
        where: { id },
      });

      if (!incident) {
        throw new NotFoundException(`Incident with ID ${id} not found`);
      }

      if (incident.status !== 'active' && incident.status !== 'verified') {
        throw new BadRequestException(
          'Only active or verified incidents can be closed',
        );
      }

      return await this.prisma.incident.update({
        where: { id },
        data: { status: 'closed' as any },
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to close incident');
    }
  }

  async remove(id: number): Promise<Incident> {
    try {
      const incident = await this.prisma.incident.delete({
        where: { id },
      });

      return incident;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Incident with ID ${id} not found`);
        }
      }
      throw new InternalServerErrorException('Failed to delete incident');
    }
  }

  private parsePaginationParams(query: QueryIncidentDto): {
    page: number;
    limit: number;
    offset: number;
  } {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  private validateSortParams(query: QueryIncidentDto): {
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

  private buildWhereConditions(
    query: QueryIncidentDto,
  ): Prisma.IncidentWhereInput {
    return {
      ...(query.type ? { type: query.type } : {}),
      ...(typeof query.severity === 'number'
        ? { severity: query.severity }
        : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
  }
}
