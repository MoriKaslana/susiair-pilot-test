import { DataService } from '../data/data.service';
import { SchedulesService } from './schedules.service';

describe('SchedulesService', () => {
  const data = new DataService();
  data.onModuleInit();
  const service = new SchedulesService(data);

  it('returns only the requested month', () => {
    expect(service.getMonth(2026, 4).schedules).toHaveLength(17);
    expect(service.getMonth(2026, 5).schedules).toHaveLength(21);
    expect(service.getMonth(2026, 6).schedules).toHaveLength(16);
    expect(
      service.getMonth(2026, 4).schedules.every((s) => s.duty_date.startsWith('2026-04-')),
    ).toBe(true);
  });

  it('returns an empty list, not an error, for a month with no entries', () => {
    const r = service.getMonth(2026, 3);
    expect(r.schedules).toEqual([]);
    expect(r.legend.length).toBeGreaterThan(0);
  });

  it('passes entries through unchanged', () => {
    const entry = service.getMonth(2026, 5).schedules.find((s) => s.duty_date === '2026-05-15');
    expect(entry).toMatchObject({
      base_name: 'MKW',
      base_color: '#10B981',
      duty_type: 'DTY',
      count_schedules: 6,
      count_logbooks: 6,
    });
  });

  it('includes the 10-item duty legend', () => {
    expect(service.getMonth(2026, 5).legend).toHaveLength(10);
  });
});
