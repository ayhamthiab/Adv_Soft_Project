import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';

@Module({
  imports: [PrismaModule, IncidentsModule, CheckpointsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
