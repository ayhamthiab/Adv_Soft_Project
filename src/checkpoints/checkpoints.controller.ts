import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { QueryCheckpointDto } from './dto/query-checkpoint.dto';
import { FindAllCheckpointsResponse, CheckpointHistoryResponse } from './types';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('checkpoints')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  create(@Body() createCheckpointDto: CreateCheckpointDto) {
    return this.checkpointsService.create(createCheckpointDto);
  }

  @Get()
  findAll(@Query() query: QueryCheckpointDto): Promise<FindAllCheckpointsResponse> {
    return this.checkpointsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.checkpointsService.findOne(id);
  }

  @Get(':id/history')
  getCheckpointHistory(@Param('id', ParseIntPipe) id: number): Promise<CheckpointHistoryResponse> {
    return this.checkpointsService.getCheckpointHistory(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateCheckpointDto: UpdateCheckpointDto) {
    return this.checkpointsService.update(id, updateCheckpointDto);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.checkpointsService.remove(id);
  }
}