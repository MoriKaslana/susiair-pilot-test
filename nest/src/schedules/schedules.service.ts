import { Injectable } from '@nestjs/common';
import { DataService } from '../data/data.service';

@Injectable()
export class SchedulesService {
  constructor(private readonly data: DataService) {}

  getMonth(year: number, month: number) {
    const prefix = `${year}-${String(month).padStart(2, '0')}-`;
    const schedules = this.data.schedules
      .filter((s) => s.duty_date.startsWith(prefix))
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date));

    // Entries are returned exactly as stored (snake_case, base_color, counts).
    // A month with no entries is a normal empty result, not an error.
    return { year, month, legend: this.data.legend, schedules };
  }
}
