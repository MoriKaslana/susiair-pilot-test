import { Controller, Get, Query } from '@nestjs/common';
import { GetFlightHoursDto } from './dto/get-flight-hours.dto';
import { GetSummaryDto } from './dto/get-summary.dto';
import { FlightHoursService } from './flight-hours.service';

@Controller('flight-hours')
export class FlightHoursController {
  constructor(private readonly service: FlightHoursService) {}

  @Get()
  findDaily(@Query() query: GetFlightHoursDto) {
    return this.service.getDailyHours(query.from, query.to);
  }

  @Get('limits')
  getLimits() {
    return this.service.getLimits();
  }

  @Get('summary')
  getSummary(@Query() query: GetSummaryDto) {
    return this.service.getSummary(query.range);
  }
}
