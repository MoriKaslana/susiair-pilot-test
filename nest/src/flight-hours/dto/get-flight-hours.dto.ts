import { IsIsoDate } from '../../common/validators/is-iso-date.decorator';

export class GetFlightHoursDto {
  @IsIsoDate()
  from!: string;

  @IsIsoDate()
  to!: string;
}
