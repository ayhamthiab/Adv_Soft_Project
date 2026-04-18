import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReportDto {
  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a number' })
  @Min(-90)
  @Max(90)
  latitude!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a number' })
  @Min(-180)
  @Max(180)
  longitude!: number;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  description!: string;
}
