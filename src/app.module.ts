import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { IncidentsModule } from './incidents/incidents.module';
import { CheckpointsModule } from './checkpoints/checkpoints.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { RoutesModule } from './routes/routes.module';

@Module({
  imports: [
    PrismaModule,
    IncidentsModule,
    CheckpointsModule,
    ReportsModule,
    AlertsModule,
    RoutesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}