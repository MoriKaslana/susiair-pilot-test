import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DataModule } from './data/data.module';
import { AuthModule } from './auth/auth.module';
import { PilotModule } from './pilot/pilot.module';
import { FlightHoursModule } from './flight-hours/flight-hours.module';
import { DocumentsModule } from './documents/documents.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DataModule,
    AuthModule,
    PilotModule,
    FlightHoursModule,
    DocumentsModule,
    SchedulesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
