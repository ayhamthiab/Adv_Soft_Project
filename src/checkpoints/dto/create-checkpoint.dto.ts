import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCheckpointDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'latitude must be a number' })
  latitude!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'longitude must be a number' })
  longitude!: number;

  @IsOptional()
  @IsString()
  @IsIn(['open', 'closed', 'restricted'], {
    message: 'status must be one of: open, closed, restricted',
  })
  status?: string = 'open';
}
