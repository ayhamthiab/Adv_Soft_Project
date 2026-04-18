import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportDto } from './dto/query-report.dto';
import { VoteReportDto } from './dto/vote-report.dto';
import { FindAllResponse, ReportWithVotes } from './types';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('reports')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  @Get()
  findAll(@Query() query: QueryReportDto): Promise<FindAllResponse> {
    return this.reportsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ReportWithVotes> {
    return this.reportsService.findOne(id);
  }

  @Post(':id/vote')
  vote(
    @Param('id', ParseIntPipe) id: number,
    @Body() voteReportDto: VoteReportDto,
  ) {
    return this.reportsService.vote(id, voteReportDto);
  }

  @Patch(':id/approve')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') role: string,
  ) {
    return this.reportsService.approve(id, role);
  }

  @Patch(':id/reject')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Headers('x-user-role') role: string,
  ) {
    return this.reportsService.reject(id, role);
  }
}
