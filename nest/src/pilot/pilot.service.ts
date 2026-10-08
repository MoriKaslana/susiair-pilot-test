import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataService } from '../data/data.service';

@Injectable()
export class PilotService {
  constructor(
    private readonly data: DataService,
    private readonly config: ConfigService,
  ) {}

  getMe() {
    return {
      name: this.data.pilot.name,
      // Taken from the provided file as-is (it includes planned hours after "today").
      totalFlightHours: this.data.pilot.totalFlightHours,
      avatarUrl: this.config.getOrThrow<string>('avatarUrl'),
      today: this.config.getOrThrow<string>('appToday'),
    };
  }
}
