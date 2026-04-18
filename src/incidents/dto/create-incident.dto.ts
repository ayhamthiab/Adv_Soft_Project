import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  severity!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a number' })
  latitude!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a number' })
  longitude!: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'closed', 'verified'], {
    message: 'status must be one of: active, closed, verified',
  })
  status?: string = 'active';
}
