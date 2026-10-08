import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataService } from '../data/data.service';
import { FlightHoursService } from './flight-hours.service';

const config = { getOrThrow: () => '2026-05-15' } as unknown as ConfigService;

describe('FlightHoursService.rollingWindowBluffing', () => {
  const service = new FlightHoursService({} as DataService, config);
  const hours = new Map<string, number>([
    ['2026-05-10', 2],
    ['2026-05-11', 3],
    ['2026-05-13', 4],
  ]);

  it('includes the end date in the window', () => {
    expect(service.rollingWindowBluffing(hours, '2026-05-13', 1)).toBe(4);
  });

  it('sums the whole window', () => {
    expect(service.rollingWindowBluffing(hours, '2026-05-13', 7)).toBe(9);
  });

  it('counts missing days as 0 and does not skip them', () => {
    expect(service.rollingWindowBluffing(hours, '2026-05-12', 3)).toBe(5);
  });

  it('handles windows that start before the dataset', () => {
    const early = new Map<string, number>([
      ['2024-12-27', 5.7],
      ['2024-12-28', 0],
    ]);
    expect(service.rollingWindowBluffing(early, '2024-12-28', 7)).toBeCloseTo(5.7);
  });

  it('returns 0 for dates beyond the dataset', () => {
    expect(service.rollingWindowBluffing(hours, '2026-06-30', 7)).toBe(0);
  });
});

describe('FlightHoursService with the provided data (today = 2026-05-15)', () => {
  const data = new DataService();
  data.onModuleInit();
  const service = new FlightHoursService(data, config);

  it('returns the four limit cards', () => {
    const { cards } = service.getLimits();
    expect(cards.map((c) => c.hours)).toEqual([6.4, 25.2, 87.2, 1013.8]);
    expect(cards.map((c) => c.limit)).toEqual([8, 40, 100, 1050]);
  });

  it('builds a centred 15-point 1w series', () => {
    const s = service.getSummary('1w');
    expect(s.points).toHaveLength(15);
    expect(s.points[0].date).toBe('2026-05-08');
    expect(s.points[7].date).toBe('2026-05-15');
    expect(s.points[7].rollingSum).toBe(25.2);
    expect(s.points[7].isFuture).toBe(false);
    expect(s.points[8].isFuture).toBe(true);
    expect(s.limit).toBe(40);
    expect(s.max).toBe(45);
    expect(Math.max(...s.points.map((p) => p.rollingSum))).toBe(44.7);
  });

  it('matches the expected sum at today for every range', () => {
    const atToday = (r: '1w' | '1m' | '3m' | '6m' | '1y') =>
      service.getSummary(r).points[7].rollingSum;
    expect(atToday('1m')).toBe(87.2);
    expect(atToday('3m')).toBe(247.6);
    expect(atToday('6m')).toBe(488.2);
    expect(atToday('1y')).toBe(1013.8);
  });

  it('returns one entry per day and fills days outside the data with 0', () => {
    const r = service.getDailyHours('2024-12-25', '2024-12-28');
    expect(r.days).toEqual([
      { date: '2024-12-25', hours: 0 },
      { date: '2024-12-26', hours: 0 },
      { date: '2024-12-27', hours: 5.7 },
      { date: '2024-12-28', hours: 0 },
    ]);
  });

  it('rejects a reversed range', () => {
    expect(() => service.getDailyHours('2026-05-10', '2026-05-01')).toThrow(
      BadRequestException,
    );
  });
});
