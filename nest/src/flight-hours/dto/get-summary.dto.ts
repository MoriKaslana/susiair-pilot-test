import { IsIn, IsOptional } from 'class-validator';
import { RangeKey } from '../../data/data.types';

export const RANGE_KEYS: RangeKey[] = ['1w', '1m', '3m', '6m', '1y'];

export class GetSummaryDto {
  @IsOptional()
  @IsIn(RANGE_KEYS)
  range: RangeKey = '1w';
}
