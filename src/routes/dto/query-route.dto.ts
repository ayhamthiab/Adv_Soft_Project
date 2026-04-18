import { IsNumber, Min, Max, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRouteDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'startLat must be a number' })
  @Min(-90)
  @Max(90)
  startLat!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'startLng must be a number' })
  @Min(-180)
  @Max(180)
  startLng!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'endLat must be a number' })
  @Min(-90)
  @Max(90)
  endLat!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'endLng must be a number' })
  @Min(-180)
  @Max(180)
  endLng!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  avoidCheckpoints?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  avoidClosedRoads?: boolean;
}
