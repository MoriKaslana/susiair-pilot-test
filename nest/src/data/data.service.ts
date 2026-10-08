import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
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

/**
 * Loads the three provided JSON files once at startup and keeps them in memory.
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
    this.flightHoursFile = this.readJson<FlightHoursFile>('mock-flight-hours.json');
    this.documentsFile = this.readJson<DocumentsFile>('mock-documents.json');
    this.schedulesFile = this.readJson<SchedulesFile>('mock-schedules.json');

    this.hoursMap = new Map(
      this.flightHoursFile.flightHours.map((d) => [d.date, d.hours]),
    );

    this.logger.log(
      `Loaded ${this.hoursMap.size} flight-hour days, ` +
        `${this.documentsFile.documents.length} documents, ` +
        `${this.schedulesFile.schedules.length} schedule entries`,
    );
  }

  private readJson<T>(fileName: string): T {
    const path = join(process.cwd(), 'data', fileName);
    try {
      return JSON.parse(readFileSync(path, 'utf-8')) as T;
    } catch (err) {
      throw new Error(`Could not load ${path}: ${(err as Error).message}`);
    }
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
