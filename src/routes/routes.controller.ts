import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { QueryRouteDto } from './dto/query-route.dto';

@Controller('routes')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('estimate')
  estimate(@Query() query: QueryRouteDto) {
    return this.routesService.estimate(query);
  }
}
