import { Module } from '@nestjs/common';
import { RoutesService } from './routes.service';
import { RoutesController } from './routes.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExternalRoutingService } from './services/external-routing.service';
import { WeatherService } from './services/weather.service';

@Module({
  imports: [PrismaModule],
  controllers: [RoutesController],
  providers: [RoutesService, ExternalRoutingService, WeatherService],
})
export class RoutesModule {}
