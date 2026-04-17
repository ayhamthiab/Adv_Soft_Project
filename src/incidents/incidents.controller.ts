import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentDto } from './dto/query-incident.dto';
import { FindAllResponse } from './types';
import { RoleGuard } from '../guards/role.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('incidents')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  findAll(@Query() query: QueryIncidentDto): Promise<FindAllResponse> {
    return this.incidentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Patch(':id/verify')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  verify(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.verify(id);
  }

  @Patch(':id/close')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.close(id);
  }

  @Delete(':id')
  @UseGuards(RoleGuard)
  @Roles('admin', 'moderator')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.incidentsService.remove(id);
  }
}