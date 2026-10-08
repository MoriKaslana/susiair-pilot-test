import { Controller, Get, Query } from '@nestjs/common';
import { GetSchedulesDto } from './dto/get-schedules.dto';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  findMonth(@Query() query: GetSchedulesDto) {
    return this.schedules.getMonth(query.year, query.month);
  }
}
