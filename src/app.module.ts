import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';

@Module({
  imports: [PrismaModule, IncidentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
