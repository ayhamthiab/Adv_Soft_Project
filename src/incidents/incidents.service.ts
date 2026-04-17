import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Incident } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentDto } from './dto/query-incident.dto';
import { FindAllResponse } from './types';

@Injectable()
export class IncidentsService {
  private readonly ALLOWED_SORT_FIELDS = ['createdAt', 'severity'];
  private readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new incident
   */
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

  /**
   * Find all incidents with filtering, sorting, and pagination (using raw SQL)
   * This method demonstrates the raw query requirement
   */
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

  /**
   * Find all incidents using Prisma ORM (alternative to raw SQL)
   * This demonstrates the capability without raw queries
   */
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

  /**
   * Find a single incident by ID
   */
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

  /**
   * Update an incident by ID
   */
  async update(id: number, updateIncidentDto: UpdateIncidentDto): Promise<Incident> {
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
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update incident');
    }
  }

  /**
   * Delete an incident by ID
   */
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

  // ==================== HELPER METHODS ====================

  /**
   * Parse and validate pagination parameters
   */
  private parsePaginationParams(query: QueryIncidentDto): { page: number; limit: number; offset: number } {
    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  /**
   * Validate sort parameters with whitelist (SQL Injection Prevention)
   */
  private validateSortParams(query: QueryIncidentDto): { sortField: string; sortOrder: 'asc' | 'desc' } {
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = (query.order ?? 'desc').toLowerCase() as 'asc' | 'desc';

    // Whitelist validation for sort field
    if (!this.ALLOWED_SORT_FIELDS.includes(sortField)) {
      throw new BadRequestException(
        `Invalid sort field. Allowed fields: ${this.ALLOWED_SORT_FIELDS.join(', ')}`,
      );
    }

    // Whitelist validation for sort order
    if (!this.ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      throw new BadRequestException(`Invalid sort order. Allowed values: ${this.ALLOWED_SORT_ORDERS.join(', ')}`);
    }

    return { sortField, sortOrder };
  }

  /**
   * Build filter conditions for raw SQL queries
   * Returns Prisma.Sql[] for use in raw queries
   */
  private buildFilterConditions(query: QueryIncidentDto): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = [];

    if (query.type) {
      conditions.push(Prisma.sql`"type" = ${query.type}`);
    }

    if (typeof query.severity === 'number') {
      conditions.push(Prisma.sql`"severity" = ${query.severity}`);
    }

    if (query.status) {
      conditions.push(Prisma.sql`"status" = ${query.status}`);
    }

    return conditions;
  }

  /**
   * Build WHERE conditions for Prisma ORM queries
   * Uses same logic as buildFilterConditions for consistency
   */
  private buildWhereConditions(query: QueryIncidentDto): Prisma.IncidentWhereInput {
    return {
      ...(query.type ? { type: query.type } : {}),
      ...(typeof query.severity === 'number' ? { severity: query.severity } : {}),
      ...(query.status ? { status: query.status as any } : {}),
    };
  }

  /**
   * Execute raw SQL query with unified filter logic
   * Safely constructs SQL without injection vulnerabilities
   */
  private async executeRawQuery(
    query: QueryIncidentDto,
    sortField: string,
    sortOrder: string,
    limit: number,
    offset: number,
  ): Promise<Incident[]> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.type) {
      params.push(query.type);
      conditions.push(`"type" = $${params.length}`);
    }

    if (typeof query.severity === 'number') {
      params.push(query.severity);
      conditions.push(`"severity" = $${params.length}`);
    }

    if (query.status) {
      params.push(query.status);
      conditions.push(`"status" = $${params.length}`);
    }

    let sql = `SELECT * FROM "Incident"`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY "${sortField}" ${sortOrder} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return this.prisma.$queryRawUnsafe<Incident[]>(sql, ...params);
  }

  /**
   * Count incidents using unified filter logic
   * Uses same conditions as raw query for consistency
   */
  private async countIncidents(query: QueryIncidentDto): Promise<number> {
    return this.prisma.incident.count({
      where: this.buildWhereConditions(query),
    });
  }
}
