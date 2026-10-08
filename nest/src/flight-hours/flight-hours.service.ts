import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addDays, diffInDays } from '../common/utils/date.util';
import { DataService } from '../data/data.service';
import { RangeKey } from '../data/data.types';

const MAX_RANGE_DAYS = 400;

/** Round at the output only, so float noise never reaches the client. */
const round1 = (n: number): number => Math.round(n * 10) / 10;

@Injectable()
export class FlightHoursService {
  constructor(
    private readonly data: DataService,
    private readonly config: ConfigService,
  ) {}

  /** The app's "today" (APP_TODAY). Never derived from the system clock. */
  get today(): string {
    return this.config.getOrThrow<string>('appToday');
  }

  getDailyHours(from: string, to: string) {
    const span = diffInDays(to, from);
    if (span < 0) {
      throw new BadRequestException('from must be on or before to');
    }
    if (span + 1 > MAX_RANGE_DAYS) {
      throw new BadRequestException(
        `Date range too large: the maximum is ${MAX_RANGE_DAYS} days`,
      );
    }

    // One entry per calendar day; days with no data count as 0.
    const days: { date: string; hours: number }[] = [];
    for (let i = 0; i <= span; i++) {
      const date = addDays(from, i);
      days.push({ date, hours: this.data.hoursByDate.get(date) ?? 0 });
    }
    return { from, to, days };
  }

  getLimits() {
    const today = this.today;
    const limits = this.data.limits;
    const defs = [
      { key: 'daily', label: 'Daily', windowDays: 1, limit: limits.daily },
      { key: 'weekly', label: 'Weekly', windowDays: 7, limit: limits.weekly },
      { key: 'monthly', label: 'Monthly', windowDays: 30, limit: limits.monthly },
      { key: 'annual', label: 'Annual', windowDays: 365, limit: limits.annual },
    ];
    return {
      today,
      cards: defs.map((d) => ({
        ...d,
        hours: round1(
          this.rollingWindowBluffing(this.data.hoursByDate, today, d.windowDays),
        ),
      })),
    };
  }

  getSummary(range: RangeKey) {
    const today = this.today;
    const bound = this.data.chartBounds[range];

    // today - N .. today + N, so today is always the centre point.
    const points: {
      date: string;
      hours: number;
      rollingSum: number;
      isFuture: boolean;
    }[] = [];
    for (let offset = -bound.displayRangeDays; offset <= bound.displayRangeDays; offset++) {
      const date = addDays(today, offset);
      points.push({
        date,
        hours: this.data.hoursByDate.get(date) ?? 0,
        rollingSum: round1(
          this.rollingWindowBluffing(this.data.hoursByDate, date, bound.windowDays),
        ),
        isFuture: offset > 0,
      });
    }

    return {
      range,
      today,
      windowDays: bound.windowDays,
      limit: bound.limit,
      max: bound.max,
      points,
    };
  }

  // this is a rolling sum calculation :)
  rollingWindowBluffing(
    hoursByDate: ReadonlyMap<string, number>,
    endDate: string,
    windowDays: number,
  ): number {
    let sum = 0;
    for (let i = 0; i < windowDays; i++) {
      sum += hoursByDate.get(addDays(endDate, -i)) ?? 0;
    }
    return sum;
  }
}
