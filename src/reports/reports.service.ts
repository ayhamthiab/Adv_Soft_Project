import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, Report } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';
import { FindAllResponse, ReportWithVotes } from './types';
import { IncidentsService } from '../incidents/incidents.service';

@Injectable()
export class ReportsService {
  private readonly ALLOWED_SORT_FIELDS = ['createdAt'];
  private readonly ALLOWED_SORT_ORDERS = ['asc', 'desc'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly incidentsService: IncidentsService,
  ) {}

  async create(createReportDto: CreateReportDto): Promise<Report> {
    try {
      // Check for duplicates
      const existingReport = await this.findDuplicate(createReportDto);
      if (existingReport) {
        return existingReport;
      }

      return await this.prisma.report.create({
        data: createReportDto,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create report');
    }
  }

  async findAll(query: QueryReportDto): Promise<FindAllResponse> {
    try {
      return await this.findAllWithORM(query);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }

  async findAllWithORM(query: QueryReportDto): Promise<FindAllResponse> {
    try {
      const { page, limit } = this.parsePaginationParams(query);
      const { sortField, sortOrder } = this.validateSortParams(query);

      const whereConditions = this.buildWhereConditions(query);

      const [reports, total] = await Promise.all([
        this.prisma.report.findMany({
          where: whereConditions,
          orderBy: {
            [sortField]: sortOrder,
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.report.count({
          where: whereConditions,
        }),
      ]);

      const reportsWithVotes = await this.addVoteCountsToReports(reports);

      const pages = Math.ceil(total / limit);

      return {
        data: reportsWithVotes,
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
      throw new InternalServerErrorException('Failed to fetch reports');
    }
  }

  async findOne(id: number): Promise<ReportWithVotes> {
    try {
      const report = await this.prisma.report.findUnique({
        where: { id },
      });

      if (!report) {
        throw new NotFoundException(`Report with ID ${id} not found`);
      }

      const reportsWithVotes = await this.addVoteCountsToReports([report]);
      return reportsWithVotes[0];
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch report');
    }
  }

  async vote(id: number, voteReportDto: VoteReportDto): Promise<void> {
    try {
      // Check if report exists
      await this.findOne(id);

      // Create vote
      await this.prisma.reportVote.create({
        data: {
          reportId: id,
          voteType: voteReportDto.voteType as any,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to vote on report');
    }
  }

  async approve(id: number, role: string): Promise<Report> {
    try {
      const report = await this.findOne(id);

      if (report.status !== 'PENDING') {
        throw new BadRequestException('Report is not in PENDING status');
      }

      // Create incident
      await this.incidentsService.create({
        type: report.category,
        severity: 1, // Default severity
        description: report.description,
        latitude: report.latitude,
        longitude: report.longitude,
      });

      // Update report status
      const updatedReport = await this.prisma.report.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      // Create audit log
      await this.prisma.reportAudit.create({
        data: {
          reportId: id,
          action: 'APPROVED',
          role,
        },
      });

      return updatedReport;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to approve report');
    }
  }

  async reject(id: number, role: string): Promise<Report> {
    try {
      const report = await this.findOne(id);

      if (report.status !== 'PENDING') {
        throw new BadRequestException('Report is not in PENDING status');
      }

      // Update report status
      const updatedReport = await this.prisma.report.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      // Create audit log
      await this.prisma.reportAudit.create({
        data: {
          reportId: id,
          action: 'REJECTED',
          role,
        },
      });

      return updatedReport;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to reject report');
    }
  }

  private async findDuplicate(createReportDto: CreateReportDto): Promise<Report | null> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const reports = await this.prisma.report.findMany({
      where: {
        category: createReportDto.category,
        createdAt: {
          gte: tenMinutesAgo,
        },
      },
    });

    for (const report of reports) {
      const distance = this.calculateDistance(
        createReportDto.latitude,
        createReportDto.longitude,
        report.latitude,
        report.longitude,
      );

      if (distance <= 200) { // 200 meters
        return report;
      }
    }

    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private parsePaginationParams(query: QueryReportDto): { page: number; limit: number } {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return { page, limit };
  }

  private validateSortParams(query: QueryReportDto): { sortField: string; sortOrder: string } {
    const sortField = query.sort ?? 'createdAt';
    const sortOrder = query.order ?? 'desc';

    if (!this.ALLOWED_SORT_FIELDS.includes(sortField)) {
      throw new BadRequestException(`Invalid sort field: ${sortField}`);
    }

    if (!this.ALLOWED_SORT_ORDERS.includes(sortOrder)) {
      throw new BadRequestException(`Invalid sort order: ${sortOrder}`);
    }

    return { sortField, sortOrder };
  }

  private buildWhereConditions(query: QueryReportDto): Prisma.ReportWhereInput {
    const where: Prisma.ReportWhereInput = {};

    if (query.status) {
      where.status = query.status as any;
    }

    if (query.category) {
      where.category = query.category;
    }

    return where;
  }

  private async addVoteCountsToReports(reports: Report[]): Promise<ReportWithVotes[]> {
    const reportIds = reports.map(r => r.id);

    const voteCounts = await this.prisma.reportVote.groupBy({
      by: ['reportId', 'voteType'],
      where: {
        reportId: {
          in: reportIds,
        },
      },
      _count: {
        voteType: true,
      },
    });

    const voteMap = new Map<number, { upvotes: number; downvotes: number }>();

    for (const count of voteCounts) {
      if (!voteMap.has(count.reportId)) {
        voteMap.set(count.reportId, { upvotes: 0, downvotes: 0 });
      }
      const votes = voteMap.get(count.reportId)!;
      if (count.voteType === 'UP') {
        votes.upvotes = count._count.voteType;
      } else if (count.voteType === 'DOWN') {
        votes.downvotes = count._count.voteType;
      }
    }

    return reports.map(report => {
      const votes = voteMap.get(report.id) || { upvotes: 0, downvotes: 0 };
      return {
        ...report,
        upvotes: votes.upvotes,
        downvotes: votes.downvotes,
        score: votes.upvotes - votes.downvotes,
      };
    });
  }
}