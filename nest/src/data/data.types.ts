export type RangeKey = '1w' | '1m' | '3m' | '6m' | '1y';

export interface DailyHour {
  date: string;
  hours: number;
}

export interface ChartBound {
  limit: number;
  max: number;
  windowDays: number;
  displayRangeDays: number;
}

export interface Limits {
  daily: number;
  weekly: number;
  monthly: number;
  annual: number;
}

export interface FlightHoursFile {
  pilot: { name: string; totalFlightHours: number };
  limits: Limits;
  chartBounds: Record<RangeKey, ChartBound>;
  flightHours: DailyHour[];
}

export interface DocumentItem {
  id: string;
  label: string;
  expiryDate: string;
}

export interface DocumentsFile {
  today: string;
  thresholds: { warningDays: number; comment: string };
  documents: DocumentItem[];
}

export interface LegendItem {
  code: string;
  label: string;
  color: string;
}

export interface ScheduleEntry {
  id: string;
  duty_date: string;
  status: number;
  base_name: string;
  base_color: string;
  duty_type: string;
  count_schedules: number;
  count_logbooks: number;
}

export interface SchedulesFile {
  today: string;
  fieldGuide: Record<string, string>;
  legend: LegendItem[];
  schedules: ScheduleEntry[];
}
