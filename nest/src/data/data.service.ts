import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  ChartBound,
  DailyHour,
  DocumentsFile,
  FlightHoursFile,
  LegendItem,
  Limits,
  RangeKey,
  ScheduleEntry,
  SchedulesFile,
} from './data.types';
import flightHoursJson = require('./files/mock-flight-hours.json');
import documentsJson = require('./files/mock-documents.json');
import schedulesJson = require('./files/mock-schedules.json');

/**
 * Seeds the service from the three provided JSON files at startup and keeps
 * them in memory. The files are imported (not read from disk at runtime) so
 * they are compiled and bundled with the app on any host, including serverless.
 * Read-only: callers must not mutate what they get back.
 */
@Injectable()
export class DataService implements OnModuleInit {
  private readonly logger = new Logger(DataService.name);

  private flightHoursFile!: FlightHoursFile;
  private documentsFile!: DocumentsFile;
  private schedulesFile!: SchedulesFile;
  private hoursMap!: Map<string, number>;

  onModuleInit(): void {
    this.flightHoursFile = flightHoursJson as unknown as FlightHoursFile;
    this.documentsFile = documentsJson as unknown as DocumentsFile;
    this.schedulesFile = schedulesJson as unknown as SchedulesFile;

    this.hoursMap = new Map(
      this.flightHoursFile.flightHours.map((d) => [d.date, d.hours]),
    );

    this.logger.log(
      `Loaded ${this.hoursMap.size} flight-hour days, ` +
        `${this.documentsFile.documents.length} documents, ` +
        `${this.schedulesFile.schedules.length} schedule entries`,
    );
  }

  get pilot(): FlightHoursFile['pilot'] {
    return this.flightHoursFile.pilot;
  }

  get limits(): Limits {
    return this.flightHoursFile.limits;
  }

  get chartBounds(): Record<RangeKey, ChartBound> {
    return this.flightHoursFile.chartBounds;
  }

  get flightHoursList(): readonly DailyHour[] {
    return this.flightHoursFile.flightHours;
  }

  /** date (YYYY-MM-DD) -> hours. A missing key means "no data", callers treat it as 0. */
  get hoursByDate(): ReadonlyMap<string, number> {
    return this.hoursMap;
  }

  get warningDays(): number {
    return this.documentsFile.thresholds.warningDays;
  }

  get documents(): DocumentsFile['documents'] {
    return this.documentsFile.documents;
  }

  get legend(): readonly LegendItem[] {
    return this.schedulesFile.legend;
  }

  get schedules(): readonly ScheduleEntry[] {
    return this.schedulesFile.schedules;
  }
}
