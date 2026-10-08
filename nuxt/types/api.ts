export interface ApiError {
  statusCode: number
  error: string
  message: string | string[]
  path: string
  timestamp: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface PilotProfile {
  name: string
  totalFlightHours: number
  avatarUrl: string
  today: string
}

export interface DailyHours {
  date: string
  hours: number
}

export interface FlightHoursResponse {
  from: string
  to: string
  days: DailyHours[]
}

export type RangeKey = '1w' | '1m' | '3m' | '6m' | '1y'

export interface LimitCardData {
  key: 'daily' | 'weekly' | 'monthly' | 'annual'
  label: string
  windowDays: number
  limit: number
  hours: number
}

export interface LimitsResponse {
  today: string
  cards: LimitCardData[]
}

export interface SummaryPoint {
  date: string
  hours: number
  rollingSum: number
  isFuture: boolean
}

export interface SummaryResponse {
  range: RangeKey
  today: string
  windowDays: number
  limit: number
  max: number
  points: SummaryPoint[]
}

export type DocumentStatus = 'safe' | 'soon' | 'expired'

export interface PilotDocument {
  id: string
  label: string
  expiryDate: string
  daysRemaining: number
  status: DocumentStatus
}

export interface DocumentsResponse {
  today: string
  warningDays: number
  documents: PilotDocument[]
}

export interface LegendItem {
  code: string
  label: string
  color: string
}

export interface ScheduleEntry {
  id: string
  duty_date: string
  status: number
  base_name: string
  base_color: string
  duty_type: string
  count_schedules: number
  count_logbooks: number
}

export interface SchedulesResponse {
  year: number
  month: number
  legend: LegendItem[]
  schedules: ScheduleEntry[]
}
